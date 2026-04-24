const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      portfolioResult,
      recoveredResult,
      activeAccountsResult,
      totalDebtorsResult,
      activeCampaignsResult,
      pendingDisputesResult,
      complianceResult,
      activeAgentsResult,
      avgSettlementResult,
      overduePaymentsResult,
      upcomingSchedulesResult
    ] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(total_debt), 0) AS total FROM debtors'),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'"),
      pool.query("SELECT COUNT(*) AS count FROM debtors WHERE status != 'closed'"),
      pool.query('SELECT COUNT(*) AS count FROM debtors'),
      pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) AS count FROM disputes WHERE status = 'open' OR status = 'under_review'"),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'passed') AS passed FROM compliance_checks"),
      pool.query("SELECT COUNT(*) AS count FROM collection_agents WHERE status = 'active'"),
      pool.query('SELECT COALESCE(AVG(discount_percent), 0) AS avg FROM settlements'),
      pool.query("SELECT COUNT(*) AS count FROM payments WHERE status = 'overdue' OR (due_date < NOW() AND status = 'pending')"),
      pool.query("SELECT COUNT(*) AS count FROM contact_schedules WHERE scheduled_date >= NOW() AND scheduled_date <= NOW() + INTERVAL '7 days'")
    ]);

    const totalPortfolioValue = parseFloat(portfolioResult.rows[0].total);
    const totalRecovered = parseFloat(recoveredResult.rows[0].total);
    const recoveryRate = totalPortfolioValue > 0 ? (totalRecovered / totalPortfolioValue) * 100 : 0;
    const complianceTotal = parseInt(complianceResult.rows[0].total);
    const compliancePassed = parseInt(complianceResult.rows[0].passed);
    const complianceScore = complianceTotal > 0 ? (compliancePassed / complianceTotal) * 100 : 0;

    res.json({
      totalPortfolioValue,
      totalRecovered,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      activeAccounts: parseInt(activeAccountsResult.rows[0].count),
      totalDebtors: parseInt(totalDebtorsResult.rows[0].count),
      activeCampaigns: parseInt(activeCampaignsResult.rows[0].count),
      pendingDisputes: parseInt(pendingDisputesResult.rows[0].count),
      complianceScore: Math.round(complianceScore * 100) / 100,
      activeAgents: parseInt(activeAgentsResult.rows[0].count),
      avgSettlementDiscount: Math.round(parseFloat(avgSettlementResult.rows[0].avg) * 100) / 100,
      overduePayments: parseInt(overduePaymentsResult.rows[0].count),
      upcomingSchedules: parseInt(upcomingSchedulesResult.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/trends
router.get('/trends', async (req, res) => {
  try {
    const [paymentTrends, debtorTrends, recoveryTrends] = await Promise.all([
      pool.query(`
        SELECT date_trunc('month', created_at) AS month, COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY month
      `),
      pool.query(`
        SELECT date_trunc('month', created_at) AS month, COUNT(*) AS count
        FROM debtors
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY month
      `),
      pool.query(`
        SELECT date_trunc('month', created_at) AS month, COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY month
      `)
    ]);

    res.json({
      paymentTrends: paymentTrends.rows,
      debtorTrends: debtorTrends.rows,
      recoveryTrends: recoveryTrends.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dashboard/recent-activity
router.get('/recent-activity', async (req, res) => {
  try {
    const result = await pool.query(`
      (SELECT 'payment' AS type, CONCAT('Payment of $', amount, ' from ', debtor_name) AS description, created_at AS date, status FROM payments ORDER BY created_at DESC LIMIT 20)
      UNION ALL
      (SELECT 'dispute' AS type, CONCAT('Dispute: ', reason) AS description, created_at AS date, status FROM disputes ORDER BY created_at DESC LIMIT 20)
      UNION ALL
      (SELECT 'settlement' AS type, CONCAT('Settlement for ', debtor_name, ' - $', settlement_amount) AS description, created_at AS date, status FROM settlements ORDER BY created_at DESC LIMIT 20)
      ORDER BY date DESC
      LIMIT 20
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
