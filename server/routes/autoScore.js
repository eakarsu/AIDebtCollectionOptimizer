const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../services/openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { parseAIJson } = require('../middleware/parseAIJson');
const router = express.Router();

// POST /api/auto-score/debtor/:id
// Fetches debtor data, calls AI to compute risk score + recovery probability,
// parses JSON response, and writes results to risk_assessments and recovery_predictions tables.
router.post('/debtor/:id', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch debtor
    const debtorResult = await pool.query('SELECT * FROM debtors WHERE id = $1', [id]);
    if (debtorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }
    const debtor = debtorResult.rows[0];

    // Fetch existing risk assessments
    const riskResult = await pool.query(
      'SELECT * FROM risk_assessments WHERE debtor_name ILIKE $1 ORDER BY created_at DESC LIMIT 5',
      [`%${debtor.name}%`]
    );

    // Fetch payment plans
    const planResult = await pool.query(
      'SELECT * FROM payment_plans WHERE debtor_name ILIKE $1 ORDER BY created_at DESC LIMIT 3',
      [`%${debtor.name}%`]
    );

    // Fetch settlements
    const settlementResult = await pool.query(
      'SELECT * FROM settlements WHERE debtor_name ILIKE $1 ORDER BY created_at DESC LIMIT 3',
      [`%${debtor.name}%`]
    );

    const systemPrompt = `You are an AI risk analyst for debt collection. You MUST respond with ONLY valid JSON in the exact structure below, no other text:
{
  "risk_score": <integer 0-100>,
  "risk_level": "<low|medium|high|critical>",
  "recovery_probability": <integer 0-100>,
  "estimated_recovery": <number>,
  "factors": "<comma-separated key factors>",
  "recommendation": "<one sentence recommended action>",
  "recommended_strategy": "<collection strategy name>",
  "confidence_score": <integer 0-100>,
  "time_horizon_days": <integer>
}`;

    const userMessage = `Score this debtor for risk and recovery probability:

Debtor: ${debtor.name}
Email: ${debtor.email || 'N/A'}
Phone: ${debtor.phone || 'N/A'}
Total Debt: $${debtor.total_debt || 0}
Status: ${debtor.status || 'unknown'}
Account Number: ${debtor.account_number || 'N/A'}
Last Contact: ${debtor.last_contact || 'Never'}
Notes: ${debtor.notes || 'None'}

Previous Risk Assessments: ${riskResult.rows.length}
${riskResult.rows.slice(0, 2).map(r => `- Score: ${r.risk_score}, Level: ${r.risk_level}, Date: ${r.last_assessed}`).join('\n') || 'None'}

Active Payment Plans: ${planResult.rows.length}
${planResult.rows.map(p => `- $${p.monthly_payment || 0}/mo, Status: ${p.status}`).join('\n') || 'None'}

Settlement History: ${settlementResult.rows.length}
${settlementResult.rows.map(s => `- Original: $${s.original_amount}, Settlement: $${s.settlement_amount}, Status: ${s.status}`).join('\n') || 'None'}

Compute risk score (0-100, higher = riskier), recovery probability (0-100), and estimated recovery amount. Return only the JSON.`;

    const aiResponse = await callOpenRouter(userMessage, systemPrompt);

    if (!aiResponse.success) {
      return res.status(502).json({ error: 'AI service unavailable', details: aiResponse.error });
    }

    // Parse AI JSON response with the shared 3-strategy parser
    const parsed = parseAIJson(aiResponse.content);
    if (!parsed.ok) {
      return res.status(422).json({
        error: 'AI returned non-parseable response',
        raw: aiResponse.content
      });
    }
    const scored = parsed.data;

    const now = new Date().toISOString().split('T')[0];

    // Write risk assessment to DB
    const riskInsert = await pool.query(
      `INSERT INTO risk_assessments (debtor_name, risk_score, risk_level, factors, recommendation, collection_probability, estimated_recovery, last_assessed, account_age_days, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        debtor.name,
        scored.risk_score || 50,
        scored.risk_level || 'medium',
        scored.factors || '',
        scored.recommendation || '',
        scored.recovery_probability || 50,
        scored.estimated_recovery || 0,
        now,
        debtor.last_contact ? Math.floor((new Date() - new Date(debtor.last_contact)) / (1000 * 60 * 60 * 24)) : null,
        `Auto-scored by AI on ${now}`
      ]
    );

    // Write recovery prediction to DB
    const predInsert = await pool.query(
      `INSERT INTO recovery_predictions (debtor_name, debt_amount, predicted_recovery, confidence_score, prediction_model, factors, time_horizon_days, recommended_strategy, predicted_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        debtor.name,
        debtor.total_debt || 0,
        scored.estimated_recovery || 0,
        scored.confidence_score || 50,
        'anthropic/claude-3-5-sonnet-20241022',
        scored.factors || '',
        scored.time_horizon_days || 90,
        scored.recommended_strategy || '',
        new Date(Date.now() + (scored.time_horizon_days || 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        `Auto-scored by AI on ${now}`
      ]
    );

    res.json({
      debtor_id: parseInt(id, 10),
      debtor_name: debtor.name,
      scored,
      risk_assessment: riskInsert.rows[0],
      recovery_prediction: predInsert.rows[0]
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
