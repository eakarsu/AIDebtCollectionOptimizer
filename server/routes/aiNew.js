const express = require('express');
const pool = require('../db');
const { callOpenRouter } = require('../services/openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// POST /api/ai/agent-scorecard
// Accepts { agent_id, date_range }, returns performance score, KPIs, coaching suggestions
router.post('/agent-scorecard', aiRateLimiter, async (req, res) => {
  try {
    const { agent_id, date_range } = req.body;

    if (!agent_id) {
      return res.status(400).json({ error: 'agent_id is required' });
    }

    // Fetch agent
    const agentResult = await pool.query('SELECT * FROM collection_agents WHERE id = $1', [agent_id]);
    if (agentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    const agent = agentResult.rows[0];

    // Build date filter
    let dateFilter = '';
    const dateParams = [];
    if (date_range && date_range.start) {
      dateFilter += ` AND created_at >= $${dateParams.length + 1}`;
      dateParams.push(date_range.start);
    }
    if (date_range && date_range.end) {
      dateFilter += ` AND created_at <= $${dateParams.length + 1}`;
      dateParams.push(date_range.end);
    }

    // Fetch campaigns associated with agent
    const campaignResult = await pool.query(
      `SELECT * FROM campaigns WHERE notes ILIKE $1 ${dateFilter} ORDER BY created_at DESC LIMIT 20`,
      [`%${agent.name}%`, ...dateParams]
    );

    // Fetch settlements by agent name
    const settlementResult = await pool.query(
      `SELECT * FROM settlements WHERE notes ILIKE $1 ${dateFilter} ORDER BY created_at DESC LIMIT 20`,
      [`%${agent.name}%`, ...dateParams]
    );

    // Fetch communications by agent
    const commResult = await pool.query(
      `SELECT * FROM communications WHERE notes ILIKE $1 ${dateFilter} ORDER BY created_at DESC LIMIT 50`,
      [`%${agent.name}%`, ...dateParams]
    );

    const acceptedSettlements = settlementResult.rows.filter(s => s.status === 'accepted');
    const totalRecovered = acceptedSettlements.reduce((sum, s) => sum + parseFloat(s.settlement_amount || 0), 0);

    const systemPrompt = `You are an AI performance coach for debt collection agents. Analyze agent metrics and provide a structured performance evaluation. Include: overall score (0-100), KPI breakdown (contacts made, promise-to-pay rate, kept rate, recovery amount), strengths, and 3 specific coaching suggestions. Be constructive and data-driven.`;

    const userMessage = `Performance evaluation for agent: ${agent.name}
Email: ${agent.email || 'N/A'} | Team: ${agent.team || 'N/A'}
Status: ${agent.status || 'active'}
Date Range: ${date_range ? `${date_range.start || 'start'} to ${date_range.end || 'today'}` : 'All time'}

Agent Metrics (from profile):
- Accounts Assigned: ${agent.accounts_assigned || 0}
- Total Recovered (lifetime): $${agent.total_recovered || 0}
- Success Rate (profile): ${agent.success_rate || 0}%
- Performance Score (profile): ${agent.performance_score || 'N/A'}

Activity in Period:
- Campaigns Involved: ${campaignResult.rows.length}
- Communications Sent: ${commResult.rows.length}
- Settlements Negotiated: ${settlementResult.rows.length}
- Settlements Accepted: ${acceptedSettlements.length}
- Amount Recovered in Period: $${totalRecovered.toFixed(2)}

PTP Rate (estimated): ${settlementResult.rows.length > 0 ? Math.round((acceptedSettlements.length / settlementResult.rows.length) * 100) : 0}%

Please provide: 1) Overall performance score 0-100, 2) KPI breakdown table, 3) Top 2 strengths, 4) 3 specific coaching suggestions with action steps.`;

    const result = await callOpenRouter(userMessage, systemPrompt);

    res.json({
      agent: { id: agent_id, name: agent.name, team: agent.team },
      period: date_range || 'all time',
      metrics: {
        campaigns: campaignResult.rows.length,
        communications: commResult.rows.length,
        settlements_negotiated: settlementResult.rows.length,
        settlements_accepted: acceptedSettlements.length,
        amount_recovered: parseFloat(totalRecovered.toFixed(2)),
        ptp_rate: settlementResult.rows.length > 0 ? Math.round((acceptedSettlements.length / settlementResult.rows.length) * 100) : 0
      },
      analysis: result.content || result.result || result.error
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/portfolio-analytics
// Accepts { portfolio_id }, returns recovery probability distribution, prioritization, expected recovery
router.post('/portfolio-analytics', aiRateLimiter, async (req, res) => {
  try {
    const { portfolio_id } = req.body;

    if (!portfolio_id) {
      return res.status(400).json({ error: 'portfolio_id is required' });
    }

    // Fetch portfolio
    const portfolioResult = await pool.query('SELECT * FROM portfolios WHERE id = $1', [portfolio_id]);
    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    const portfolio = portfolioResult.rows[0];

    // Fetch debtors associated with this portfolio (via notes or portfolio field)
    const debtorResult = await pool.query(
      'SELECT * FROM debtors WHERE notes ILIKE $1 OR status != $2 ORDER BY total_debt DESC LIMIT 100',
      [`%portfolio${portfolio_id}%`, 'closed']
    );

    // Fetch risk assessments for these debtors
    const riskResult = await pool.query(
      'SELECT * FROM risk_assessments ORDER BY last_assessed DESC LIMIT 50'
    );

    // Fetch recovery predictions
    const predResult = await pool.query(
      'SELECT * FROM recovery_predictions ORDER BY created_at DESC LIMIT 50'
    );

    const totalDebt = debtorResult.rows.reduce((sum, d) => sum + parseFloat(d.total_debt || 0), 0);
    const statusBreakdown = debtorResult.rows.reduce((acc, d) => {
      acc[d.status || 'unknown'] = (acc[d.status || 'unknown'] || 0) + 1;
      return acc;
    }, {});

    const systemPrompt = `You are an AI portfolio analyst for debt collection. Analyze portfolio health and provide actionable recovery optimization recommendations. Include recovery probability distribution (high/medium/low buckets), prioritized action list, expected total recovery, and strategic recommendations. Be specific and quantitative.`;

    const userMessage = `Portfolio analysis for: ${portfolio.name}
Portfolio ID: ${portfolio_id}
Status: ${portfolio.status || 'active'}
Total Accounts: ${portfolio.total_accounts || debtorResult.rows.length}
Total Portfolio Value: $${portfolio.total_value || totalDebt.toFixed(2)}
Current Recovery Rate: ${portfolio.recovery_rate || 0}%
Acquisition Date: ${portfolio.acquisition_date || 'N/A'}
Source: ${portfolio.source || 'N/A'}

Debtor Breakdown (${debtorResult.rows.length} accounts analyzed):
- Total Debt Value: $${totalDebt.toFixed(2)}
- Status Distribution: ${JSON.stringify(statusBreakdown)}
- Top 5 by debt: ${debtorResult.rows.slice(0, 5).map(d => `${d.name}: $${d.total_debt} (${d.status})`).join(', ')}

Risk Profile (${riskResult.rows.length} assessments):
- High Risk: ${riskResult.rows.filter(r => r.risk_level === 'high' || r.risk_level === 'critical').length}
- Medium Risk: ${riskResult.rows.filter(r => r.risk_level === 'medium').length}
- Low Risk: ${riskResult.rows.filter(r => r.risk_level === 'low').length}

Recovery Predictions (${predResult.rows.length} predictions):
- Avg Confidence: ${predResult.rows.length > 0 ? Math.round(predResult.rows.reduce((s, p) => s + (p.confidence_score || 0), 0) / predResult.rows.length) : 'N/A'}%

Please provide: 1) Recovery probability distribution (% high/medium/low), 2) Estimated total recovery with timeline, 3) Top 5 prioritized accounts for immediate action, 4) Strategic recommendations to improve portfolio performance.`;

    const result = await callOpenRouter(userMessage, systemPrompt);

    res.json({
      portfolio: { id: portfolio_id, name: portfolio.name, status: portfolio.status },
      summary: {
        total_accounts: debtorResult.rows.length,
        total_debt: parseFloat(totalDebt.toFixed(2)),
        status_breakdown: statusBreakdown,
        current_recovery_rate: portfolio.recovery_rate
      },
      analysis: result.content || result.result || result.error
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/communication-optimizer
// Accepts { debtor_id, channel (email|sms|call) }, returns optimal contact time, tone, script outline
router.post('/communication-optimizer', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_id, channel } = req.body;

    if (!debtor_id) {
      return res.status(400).json({ error: 'debtor_id is required' });
    }

    const validChannels = ['email', 'sms', 'call'];
    if (channel && !validChannels.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${validChannels.join(', ')}` });
    }

    const selectedChannel = channel || 'email';

    // Fetch debtor
    const debtorResult = await pool.query('SELECT * FROM debtors WHERE id = $1', [debtor_id]);
    if (debtorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }
    const debtor = debtorResult.rows[0];

    // Fetch communication history
    const historyResult = await pool.query(
      'SELECT * FROM communications WHERE template_name ILIKE $1 ORDER BY created_at DESC LIMIT 20',
      [`%${debtor.name}%`]
    );

    // Fetch payment history
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE debtor_name ILIKE $1 ORDER BY payment_date DESC LIMIT 10',
      [`%${debtor.name}%`]
    );

    // Fetch risk assessment
    const riskResult = await pool.query(
      'SELECT * FROM risk_assessments WHERE debtor_name ILIKE $1 ORDER BY last_assessed DESC LIMIT 1',
      [`%${debtor.name}%`]
    );

    const systemPrompt = `You are an AI communication expert for debt collection. Optimize outreach strategy for a specific debtor and channel, ensuring full FDCPA/TCPA compliance. Provide: 1) Optimal contact times (specific days and hours), 2) Recommended message tone and approach, 3) Specific script outline for the channel, 4) Compliance checklist, 5) Follow-up cadence recommendation.`;

    const userMessage = `Optimize ${selectedChannel.toUpperCase()} communication for debtor:

Debtor: ${debtor.name}
Total Debt: $${debtor.total_debt || 0}
Status: ${debtor.status || 'unknown'}
Last Contact: ${debtor.last_contact || 'Never'}
Notes: ${debtor.notes || 'None'}
Location: ${debtor.address || 'Unknown'}

Risk Profile:
${riskResult.rows.length > 0 ? `- Risk Level: ${riskResult.rows[0].risk_level}, Score: ${riskResult.rows[0].risk_score}, Recommendation: ${riskResult.rows[0].recommendation}` : '- No risk assessment on file'}

Communication History (${historyResult.rows.length} records):
${historyResult.rows.slice(0, 5).map(c => `- ${c.type || 'message'}: ${c.subject || 'N/A'} (${c.tone || 'neutral'} tone)`).join('\n') || 'No prior communications'}

Payment History (${paymentResult.rows.length} payments):
${paymentResult.rows.slice(0, 3).map(p => `- $${p.amount} on ${p.payment_date} (${p.status})`).join('\n') || 'No payment history'}

Channel: ${selectedChannel}

Please provide: 1) Best contact times (specific), 2) Tone and approach rationale, 3) Script/template outline, 4) FDCPA/TCPA compliance notes, 5) Follow-up schedule.`;

    const result = await callOpenRouter(userMessage, systemPrompt);

    res.json({
      debtor: { id: debtor_id, name: debtor.name, status: debtor.status },
      channel: selectedChannel,
      communication_history_count: historyResult.rows.length,
      payment_history_count: paymentResult.rows.length,
      analysis: result.content || result.result || result.error
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/score-debtor
// Audit recommendation: stateless debtor risk scoring from a profile payload.
router.post('/score-debtor', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_profile, payment_history, communication_history } = req.body;
    if (!debtor_profile) {
      return res.status(400).json({ error: 'debtor_profile is required' });
    }

    const systemPrompt = `You are an AI risk-scoring engine for debt collection. Given a debtor profile and optional payment/communication histories, return a recovery-likelihood score (0-100) and a recommended collection strategy. Respect FDCPA/TCPA. Output JSON with these fields: recovery_likelihood, risk_tier ("low"|"medium"|"high"|"unrecoverable"), recommended_strategy, optimal_contact_channel ("email"|"sms"|"call"), settlement_floor_pct, narrative.`;

    const userMessage = `Score the following debtor:

DEBTOR PROFILE:
${typeof debtor_profile === 'string' ? debtor_profile : JSON.stringify(debtor_profile, null, 2)}

PAYMENT HISTORY (optional):
${payment_history ? (typeof payment_history === 'string' ? payment_history : JSON.stringify(payment_history, null, 2)) : 'Not provided'}

COMMUNICATION HISTORY (optional):
${communication_history ? (typeof communication_history === 'string' ? communication_history : JSON.stringify(communication_history, null, 2)) : 'Not provided'}

Return JSON only.`;

    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({
      score: result.content || result.result,
      raw: result,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/predict-payment-likelihood
// Audit recommendation: predict probability of payment by horizon.
router.post('/predict-payment-likelihood', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_profile, horizon_days } = req.body;
    if (!debtor_profile) {
      return res.status(400).json({ error: 'debtor_profile is required' });
    }
    const horizon = horizon_days && Number.isFinite(parseInt(horizon_days, 10)) ? parseInt(horizon_days, 10) : 30;
    if (horizon < 1 || horizon > 365) {
      return res.status(400).json({ error: 'horizon_days must be between 1 and 365' });
    }

    const systemPrompt = `You are a payment-likelihood model for debt-collection operations. Estimate the probability that a debtor will pay within the given horizon. Be conservative; if data is sparse mark confidence as "low". Return JSON: { probability (0-1), confidence ("low"|"medium"|"high"), drivers: [{ factor, impact ("positive"|"negative"), reasoning }], recommendation }`;

    const userMessage = `Predict payment likelihood within ${horizon} days for this debtor:

DEBTOR PROFILE:
${typeof debtor_profile === 'string' ? debtor_profile : JSON.stringify(debtor_profile, null, 2)}

Return JSON only.`;

    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({
      horizon_days: horizon,
      prediction: result.content || result.result,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/optimize-settlement-offer
// Stateless settlement-offer optimization from a debtor profile.
router.post('/optimize-settlement-offer', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_profile, original_balance, hardship_indicators } = req.body;
    if (!debtor_profile) {
      return res.status(400).json({ error: 'debtor_profile is required' });
    }
    const systemPrompt = `You are an AI settlement-offer optimizer for debt collection. Given a debtor profile and (optionally) original balance and hardship indicators, recommend a settlement amount, lump-sum vs structured plan, expected acceptance probability, and FDCPA/TCPA-compliant negotiation script. Return JSON: { recommended_amount, percent_of_balance, structure ("lump_sum"|"installment_3"|"installment_6"|"installment_12"), acceptance_probability (0-1), negotiation_script, rationale }.`;
    const userMessage = `Optimize settlement offer.

DEBTOR PROFILE:
${typeof debtor_profile === 'string' ? debtor_profile : JSON.stringify(debtor_profile, null, 2)}

ORIGINAL BALANCE:
${original_balance !== undefined ? original_balance : 'Not provided'}

HARDSHIP INDICATORS:
${hardship_indicators ? (typeof hardship_indicators === 'string' ? hardship_indicators : JSON.stringify(hardship_indicators, null, 2)) : 'Not provided'}

Return JSON only.`;
    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({ recommendation: result.content || result.result, raw: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/detect-fraud
// Stateless fraud-pattern detection on a debtor record.
router.post('/detect-fraud', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_record, application_data, payment_history } = req.body;
    if (!debtor_record) {
      return res.status(400).json({ error: 'debtor_record is required' });
    }
    const systemPrompt = `You are an AI fraud-detection engine for debt collection. Analyze a debtor record (and optional application data + payment history) for fraud indicators (synthetic identity, identity theft, dispute abuse, first-party fraud). Return JSON: { fraud_risk ("low"|"medium"|"high"|"critical"), score (0-100), indicators: [{ name, severity, evidence }], recommended_actions: [string], requires_manual_review (boolean) }.`;
    const userMessage = `Analyze for fraud.

DEBTOR RECORD:
${typeof debtor_record === 'string' ? debtor_record : JSON.stringify(debtor_record, null, 2)}

APPLICATION DATA (optional):
${application_data ? (typeof application_data === 'string' ? application_data : JSON.stringify(application_data, null, 2)) : 'Not provided'}

PAYMENT HISTORY (optional):
${payment_history ? (typeof payment_history === 'string' ? payment_history : JSON.stringify(payment_history, null, 2)) : 'Not provided'}

Return JSON only.`;
    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({ assessment: result.content || result.result, raw: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/analyze-payment-pattern
// Stateless payment-pattern analysis.
router.post('/analyze-payment-pattern', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_profile, payment_history } = req.body;
    if (!payment_history) {
      return res.status(400).json({ error: 'payment_history is required' });
    }
    const systemPrompt = `You are an AI payment-pattern analyst. Examine a debtor's payment history (and optional profile) to identify cadence, seasonality, partial-payment behavior, missed-payment triggers, and trend direction. Return JSON: { cadence ("weekly"|"biweekly"|"monthly"|"irregular"|"none"), avg_days_late, partial_payment_rate (0-1), trend ("improving"|"stable"|"deteriorating"), risk_signals: [string], recommended_strategy }.`;
    const userMessage = `Analyze payment pattern.

DEBTOR PROFILE (optional):
${debtor_profile ? (typeof debtor_profile === 'string' ? debtor_profile : JSON.stringify(debtor_profile, null, 2)) : 'Not provided'}

PAYMENT HISTORY:
${typeof payment_history === 'string' ? payment_history : JSON.stringify(payment_history, null, 2)}

Return JSON only.`;
    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({ analysis: result.content || result.result, raw: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/ai/schedule-optimal-contact
// Stateless best-contact-window prediction.
router.post('/schedule-optimal-contact', aiRateLimiter, async (req, res) => {
  try {
    const { debtor_profile, communication_history, channel } = req.body;
    if (!debtor_profile) {
      return res.status(400).json({ error: 'debtor_profile is required' });
    }
    const validChannels = ['email', 'sms', 'call', 'mail'];
    if (channel && !validChannels.includes(channel)) {
      return res.status(400).json({ error: `channel must be one of: ${validChannels.join(', ')}` });
    }
    const systemPrompt = `You are an AI contact-scheduling engine for debt collection. Given a debtor profile and optional comm history, predict the optimal contact windows (FDCPA/TCPA-compliant: 8am-9pm local time, no excessive frequency). Return JSON: { recommended_channel ("email"|"sms"|"call"|"mail"), top_windows: [{ day_of_week, start_hour, end_hour, timezone, confidence }], frequency_cap_per_week, compliance_notes: [string], rationale }.`;
    const userMessage = `Predict optimal contact windows.

DEBTOR PROFILE:
${typeof debtor_profile === 'string' ? debtor_profile : JSON.stringify(debtor_profile, null, 2)}

COMMUNICATION HISTORY (optional):
${communication_history ? (typeof communication_history === 'string' ? communication_history : JSON.stringify(communication_history, null, 2)) : 'Not provided'}

REQUESTED CHANNEL (optional):
${channel || 'Not specified — recommend one'}

Return JSON only.`;
    const result = await callOpenRouter(userMessage, systemPrompt);
    res.json({ schedule: result.content || result.result, raw: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
