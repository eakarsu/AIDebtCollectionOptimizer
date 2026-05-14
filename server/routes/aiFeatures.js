/**
 * aiFeatures.js — Custom non-CRUD AI features for the debt collection optimizer.
 *
 * Endpoints (audit "Proposed New Features"):
 *   POST /api/ai-features/regulatory-alert-scan        — AI scans recent regulatory items, classifies impact
 *   POST /api/ai-features/coaching-leaderboard         — agent leaderboard with AI coaching tips per agent
 *   POST /api/ai-features/payment-plan-recommend/:id   — generate structured payment plan options
 *   POST /api/ai-features/dispute-triage/:id           — classify a dispute, suggest resolution
 *   GET  /api/ai-features/results                      — paginated audit log of AI runs
 *
 * All AI endpoints:
 *   - Use aiRateLimiter (20/hr per user).
 *   - Use parseAIJson 3-strategy parser.
 *   - Persist results to ai_results JSONB table.
 */

const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../services/openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { parseAIJson } = require('../middleware/parseAIJson');
const router = express.Router();

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        feature VARCHAR(100) NOT NULL,
        debtor_id INTEGER,
        user_id INTEGER,
        input JSONB DEFAULT '{}',
        output JSONB DEFAULT '{}',
        model VARCHAR(255),
        success BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ai_results_feature_idx ON ai_results(feature);
      CREATE INDEX IF NOT EXISTS ai_results_debtor_idx ON ai_results(debtor_id);
    `);
  } catch (err) {
    console.error('ai_results table init error:', err.message);
  }
})();

async function persistAIResult(feature, debtorId, userId, input, output, success = true) {
  try {
    await pool.query(
      `INSERT INTO ai_results (feature, debtor_id, user_id, input, output, model, success)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [feature, debtorId || null, userId || null, JSON.stringify(input), JSON.stringify(output), MODEL, success]
    );
  } catch (err) {
    console.error('persistAIResult error:', err.message);
  }
}

// ─── POST /api/ai-features/regulatory-alert-scan ─────────────────────────────
// Pull recent regulatory items, AI classifies impact and surfaces high-priority alerts.
router.post('/regulatory-alert-scan', aiRateLimiter, async (req, res) => {
  try {
    const recent = await pool.query(
      `SELECT id, title, agency, effective_date, summary, status, jurisdiction
         FROM regulatory ORDER BY effective_date DESC NULLS LAST, created_at DESC LIMIT 30`
    ).catch(async () => {
      // Fallback to wildcard select if schema differs slightly
      return pool.query('SELECT * FROM regulatory ORDER BY id DESC LIMIT 30');
    });

    if (recent.rows.length === 0) {
      return res.json({ message: 'No regulatory items to scan', alerts: [] });
    }

    const systemPrompt = `You are a debt-collection compliance officer. Review the recent regulatory items and
classify each as low/medium/high impact for a U.S. third-party collections agency. Surface up to 5 high-impact
alerts with required action steps and a deadline. Respond with ONLY valid JSON:
{
  "alerts": [
    { "id": <id>, "title": "<text>", "impact": "<low|medium|high>", "summary": "<text>",
      "required_actions": ["<text>"], "deadline_hint": "<YYYY-MM-DD or N/A>" }
  ],
  "overall_risk_posture": "<low|medium|high>",
  "recommended_next_review": "<YYYY-MM-DD>"
}`;
    const userMessage = `Recent regulatory items:\n${JSON.stringify(recent.rows)}`;

    const aiResponse = await callOpenRouter(userMessage, systemPrompt);
    if (!aiResponse.success) {
      return res.status(502).json({ error: 'AI service unavailable', details: aiResponse.error });
    }

    const parsed = parseAIJson(aiResponse.content);
    if (!parsed.ok) {
      await persistAIResult('regulatory_alert_scan', null, req.user?.id, {}, { raw: aiResponse.content }, false);
      return res.status(422).json({ error: 'AI returned non-parseable response', raw: aiResponse.content });
    }

    await persistAIResult('regulatory_alert_scan', null, req.user?.id, {}, parsed.data);
    res.json({ success: true, scanned: recent.rows.length, ...parsed.data, model: MODEL });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ─── POST /api/ai-features/coaching-leaderboard ──────────────────────────────
// Aggregate agent KPIs into a leaderboard with AI coaching suggestions per agent.
router.post('/coaching-leaderboard', aiRateLimiter, async (req, res) => {
  try {
    const agents = await pool.query(
      `SELECT id, name, team, accounts_assigned, total_recovered, success_rate, performance_score, status
         FROM collection_agents WHERE status = 'active' ORDER BY total_recovered DESC NULLS LAST LIMIT 25`
    );

    if (agents.rows.length === 0) {
      return res.json({ message: 'No active agents on leaderboard', leaderboard: [] });
    }

    const systemPrompt = `You are a collections-team performance coach. Rank these agents on a composite score
(blend of success_rate, total_recovered, performance_score, accounts_assigned). For each agent, give one
specific, actionable coaching tip (1 sentence). Respond with ONLY valid JSON:
{
  "leaderboard": [
    { "agent_id": <id>, "name": "<text>", "team": "<text>",
      "composite_score": <0-100>, "rank": <int>, "coaching_tip": "<text>", "strength": "<text>" }
  ],
  "team_summary": "<2 sentence overview>",
  "top_3_agents_to_promote": [<agent_id>, <agent_id>, <agent_id>]
}`;
    const userMessage = `Agents:\n${JSON.stringify(agents.rows)}`;

    const aiResponse = await callOpenRouter(userMessage, systemPrompt);
    if (!aiResponse.success) {
      return res.status(502).json({ error: 'AI service unavailable', details: aiResponse.error });
    }

    const parsed = parseAIJson(aiResponse.content);
    if (!parsed.ok) {
      await persistAIResult('coaching_leaderboard', null, req.user?.id, {}, { raw: aiResponse.content }, false);
      return res.status(422).json({ error: 'AI returned non-parseable response', raw: aiResponse.content });
    }

    await persistAIResult('coaching_leaderboard', null, req.user?.id, {}, parsed.data);
    res.json({ success: true, agent_count: agents.rows.length, ...parsed.data, model: MODEL });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ─── POST /api/ai-features/payment-plan-recommend/:debtor_id ─────────────────
// Generate 3 structured payment plan options for a debtor.
router.post('/payment-plan-recommend/:debtor_id', aiRateLimiter, async (req, res) => {
  const { debtor_id } = req.params;

  try {
    const debtorResult = await pool.query('SELECT * FROM debtors WHERE id = $1', [debtor_id]);
    if (debtorResult.rows.length === 0) return res.status(404).json({ error: 'Debtor not found' });
    const debtor = debtorResult.rows[0];

    const paymentResult = await pool.query(
      'SELECT amount, payment_date, status FROM payments WHERE debtor_name ILIKE $1 ORDER BY payment_date DESC LIMIT 10',
      [`%${debtor.name}%`]
    ).catch(() => ({ rows: [] }));

    const riskResult = await pool.query(
      'SELECT risk_score, risk_level, recommendation FROM risk_assessments WHERE debtor_name ILIKE $1 ORDER BY last_assessed DESC LIMIT 1',
      [`%${debtor.name}%`]
    ).catch(() => ({ rows: [] }));

    const systemPrompt = `You are an AI debt-restructuring specialist. Build 3 realistic, FDCPA-compliant payment
plan options for the debtor. Respond with ONLY valid JSON:
{
  "options": [
    { "label": "<text>", "monthly_payment": <number>, "duration_months": <int>, "total_paid": <number>,
      "first_payment_date": "<YYYY-MM-DD>", "interest_rate": <number>, "discount_pct": <number>,
      "fits_income_estimate": <bool>, "rationale": "<text>" }
  ],
  "recommended_option_index": <int>,
  "compliance_notes": ["<text>"]
}`;
    const userMessage = `Debtor: ${debtor.name}
Total Debt: $${debtor.total_debt || 0}
Status: ${debtor.status}
Account #: ${debtor.account_number || 'N/A'}
Last Contact: ${debtor.last_contact || 'never'}
Notes: ${debtor.notes || 'none'}

Risk profile: ${riskResult.rows[0] ? JSON.stringify(riskResult.rows[0]) : 'none on file'}

Recent payments:
${paymentResult.rows.map((p) => `- $${p.amount} on ${p.payment_date} (${p.status})`).join('\n') || 'no payment history'}`;

    const aiResponse = await callOpenRouter(userMessage, systemPrompt);
    if (!aiResponse.success) {
      return res.status(502).json({ error: 'AI service unavailable', details: aiResponse.error });
    }

    const parsed = parseAIJson(aiResponse.content);
    if (!parsed.ok) {
      await persistAIResult('payment_plan_recommend', debtor_id, req.user?.id, { debtor_id }, { raw: aiResponse.content }, false);
      return res.status(422).json({ error: 'AI returned non-parseable response', raw: aiResponse.content });
    }

    await persistAIResult('payment_plan_recommend', debtor_id, req.user?.id, { debtor_id }, parsed.data);
    res.json({
      success: true,
      debtor: { id: parseInt(debtor_id), name: debtor.name, total_debt: debtor.total_debt },
      ...parsed.data,
      model: MODEL,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ─── POST /api/ai-features/dispute-triage/:dispute_id ────────────────────────
// Classify a dispute and suggest resolution path.
router.post('/dispute-triage/:dispute_id', aiRateLimiter, async (req, res) => {
  const { dispute_id } = req.params;

  try {
    const disputeResult = await pool.query('SELECT * FROM disputes WHERE id = $1', [dispute_id]);
    if (disputeResult.rows.length === 0) return res.status(404).json({ error: 'Dispute not found' });
    const dispute = disputeResult.rows[0];

    const systemPrompt = `You are an AI dispute triage specialist for debt collection. Classify the dispute by
type, assess validity, and recommend a resolution path that complies with the FDCPA 30-day response window.
Respond with ONLY valid JSON:
{
  "classification": "<amount|identity|fraud|already_paid|statute_of_limitations|other>",
  "validity_score": <0-100>,
  "validity_assessment": "<text>",
  "recommended_action": "<text>",
  "documentation_required": ["<text>"],
  "deadline_days": <int>,
  "escalate_to_attorney": <bool>
}`;
    const userMessage = `Dispute:
- ID: ${dispute.id}
- Debtor: ${dispute.debtor_name || 'N/A'}
- Type: ${dispute.dispute_type || 'unspecified'}
- Date Filed: ${dispute.date_filed || 'N/A'}
- Status: ${dispute.status}
- Amount Disputed: $${dispute.amount_disputed || 0}
- Description: ${dispute.description || 'N/A'}
- Resolution Notes: ${dispute.resolution || 'none yet'}`;

    const aiResponse = await callOpenRouter(userMessage, systemPrompt);
    if (!aiResponse.success) {
      return res.status(502).json({ error: 'AI service unavailable', details: aiResponse.error });
    }

    const parsed = parseAIJson(aiResponse.content);
    if (!parsed.ok) {
      await persistAIResult('dispute_triage', null, req.user?.id, { dispute_id }, { raw: aiResponse.content }, false);
      return res.status(422).json({ error: 'AI returned non-parseable response', raw: aiResponse.content });
    }

    await persistAIResult('dispute_triage', null, req.user?.id, { dispute_id }, parsed.data);
    res.json({ success: true, dispute_id: parseInt(dispute_id), ...parsed.data, model: MODEL });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ─── GET /api/ai-features/results ────────────────────────────────────────────
// Paginated audit log of past AI runs (for replay/debugging).
router.get('/results', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  if (req.query.feature) {
    params.push(req.query.feature);
    conditions.push(`feature = $${params.length}`);
  }
  if (req.query.debtor_id) {
    params.push(req.query.debtor_id);
    conditions.push(`debtor_id = $${params.length}`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    params.push(limit, offset);
    const [data, count] = await Promise.all([
      pool.query(
        `SELECT id, feature, debtor_id, user_id, success, model, created_at, output
           FROM ai_results ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      pool.query(`SELECT COUNT(*) FROM ai_results ${where}`, params.slice(0, -2)),
    ]);

    const total = parseInt(count.rows[0].count);
    res.json({
      data: data.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
