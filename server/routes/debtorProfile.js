const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/debtor-profile/:id
router.get('/:id', async (req, res) => {
  try {
    const debtorResult = await pool.query('SELECT * FROM debtors WHERE id = $1', [req.params.id]);
    if (debtorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }

    const debtor = debtorResult.rows[0];
    const debtorName = debtor.name;

    const [
      payments,
      paymentPlans,
      settlements,
      disputes,
      riskAssessments,
      contactSchedules,
      communicationCount,
      activityLogs
    ] = await Promise.all([
      pool.query('SELECT * FROM payments WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]),
      pool.query('SELECT * FROM payment_plans WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]),
      pool.query('SELECT * FROM settlements WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]),
      pool.query('SELECT * FROM disputes WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]),
      pool.query('SELECT * FROM risk_assessments WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]),
      pool.query('SELECT * FROM contact_schedules WHERE debtor_name = $1 ORDER BY scheduled_date DESC', [debtorName]),
      pool.query('SELECT COUNT(*) AS count FROM communications WHERE debtor_name = $1', [debtorName]),
      pool.query('SELECT * FROM activity_logs WHERE debtor_name = $1 ORDER BY created_at DESC', [debtorName]).catch(() => ({ rows: [] }))
    ]);

    res.json({
      debtor,
      payments: payments.rows,
      paymentPlans: paymentPlans.rows,
      settlements: settlements.rows,
      disputes: disputes.rows,
      riskAssessments: riskAssessments.rows,
      contactSchedules: contactSchedules.rows,
      communicationCount: parseInt(communicationCount.rows[0].count),
      activityTimeline: activityLogs.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/debtor-profile/:id/summary
router.get('/:id/summary', async (req, res) => {
  try {
    const debtorResult = await pool.query('SELECT * FROM debtors WHERE id = $1', [req.params.id]);
    if (debtorResult.rows.length === 0) {
      return res.status(404).json({ error: 'Debtor not found' });
    }

    const debtor = debtorResult.rows[0];
    const debtorName = debtor.name;

    const [
      totalPaidResult,
      missedPaymentsResult,
      lastContactResult,
      riskResult,
      activePlanResult,
      openDisputesResult
    ] = await Promise.all([
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE debtor_name = $1 AND status = 'completed'", [debtorName]),
      pool.query("SELECT COUNT(*) AS count FROM payments WHERE debtor_name = $1 AND (status = 'overdue' OR status = 'missed')", [debtorName]),
      pool.query('SELECT MAX(scheduled_date) AS last_contact FROM contact_schedules WHERE debtor_name = $1', [debtorName]),
      pool.query('SELECT risk_level FROM risk_assessments WHERE debtor_name = $1 ORDER BY created_at DESC LIMIT 1', [debtorName]),
      pool.query("SELECT * FROM payment_plans WHERE debtor_name = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1", [debtorName]),
      pool.query("SELECT COUNT(*) AS count FROM disputes WHERE debtor_name = $1 AND (status = 'open' OR status = 'under_review')", [debtorName])
    ]);

    const totalPaid = parseFloat(totalPaidResult.rows[0].total);
    const remainingBalance = parseFloat(debtor.total_debt) - totalPaid;
    const lastContactDate = lastContactResult.rows[0].last_contact;
    const daysSinceLastContact = lastContactDate
      ? Math.floor((Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    res.json({
      totalPaid,
      remainingBalance: Math.max(0, remainingBalance),
      missedPayments: parseInt(missedPaymentsResult.rows[0].count),
      daysSinceLastContact,
      currentRiskLevel: riskResult.rows.length > 0 ? riskResult.rows[0].risk_level : null,
      activePaymentPlan: activePlanResult.rows.length > 0 ? activePlanResult.rows[0] : null,
      openDisputeCount: parseInt(openDisputesResult.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
