const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/reports/collection-summary
router.get('/collection-summary', async (req, res) => {
  try {
    const [totals, statusBreakdown, topDebtors] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*) FROM debtors) AS total_accounts,
          (SELECT COALESCE(SUM(total_debt), 0) FROM debtors) AS total_debt,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') AS total_recovered
      `),
      pool.query('SELECT status, COUNT(*) AS count, COALESCE(SUM(total_debt), 0) AS total_debt FROM debtors GROUP BY status ORDER BY count DESC'),
      pool.query('SELECT id, name, total_debt, status, account_number FROM debtors ORDER BY total_debt DESC LIMIT 10')
    ]);

    const { total_accounts, total_debt, total_recovered } = totals.rows[0];
    const totalDebt = parseFloat(total_debt);
    const totalRecovered = parseFloat(total_recovered);
    const recoveryRate = totalDebt > 0 ? (totalRecovered / totalDebt) * 100 : 0;

    res.json({
      totalAccounts: parseInt(total_accounts),
      totalDebt,
      totalRecovered,
      recoveryRate: Math.round(recoveryRate * 100) / 100,
      statusBreakdown: statusBreakdown.rows,
      topDebtors: topDebtors.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/agent-performance
router.get('/agent-performance', async (req, res) => {
  try {
    const agents = await pool.query(`
      SELECT
        ca.id, ca.name, ca.status, ca.performance_score,
        (SELECT COUNT(*) FROM debtors d WHERE d.status != 'closed') AS accounts_assigned,
        COALESCE(ca.performance_score, 0) AS score
      FROM collection_agents ca
      ORDER BY ca.performance_score DESC NULLS LAST
    `);

    const avgResult = await pool.query('SELECT COALESCE(AVG(performance_score), 0) AS avg_score FROM collection_agents');
    const avgScore = parseFloat(avgResult.rows[0].avg_score);

    const agentsWithComparison = agents.rows.map(agent => ({
      ...agent,
      comparedToAverage: agent.performance_score
        ? Math.round((parseFloat(agent.performance_score) - avgScore) * 100) / 100
        : null
    }));

    res.json({
      agents: agentsWithComparison,
      averageScore: Math.round(avgScore * 100) / 100
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/portfolio-analysis
router.get('/portfolio-analysis', async (req, res) => {
  try {
    const [portfolios, agingAnalysis] = await Promise.all([
      pool.query('SELECT * FROM portfolios ORDER BY total_value DESC NULLS LAST'),
      pool.query(`
        SELECT
          CASE
            WHEN created_at >= NOW() - INTERVAL '30 days' THEN '0-30 days'
            WHEN created_at >= NOW() - INTERVAL '60 days' THEN '31-60 days'
            WHEN created_at >= NOW() - INTERVAL '90 days' THEN '61-90 days'
            ELSE '90+ days'
          END AS age_bucket,
          COUNT(*) AS count,
          COALESCE(SUM(total_debt), 0) AS total_debt
        FROM debtors
        GROUP BY age_bucket
        ORDER BY age_bucket
      `)
    ]);

    const portfolioRows = portfolios.rows;
    const best = portfolioRows.length > 0 ? portfolioRows[0] : null;
    const worst = portfolioRows.length > 0 ? portfolioRows[portfolioRows.length - 1] : null;

    res.json({
      portfolios: portfolioRows,
      agingAnalysis: agingAnalysis.rows,
      bestPerforming: best,
      worstPerforming: worst
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/compliance-report
router.get('/compliance-report', async (req, res) => {
  try {
    const [summary, byRegulation, highRisk, upcomingReviews] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'passed') AS passed,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending
        FROM compliance_checks
      `),
      pool.query("SELECT regulation_type, COUNT(*) AS count, COUNT(*) FILTER (WHERE status = 'passed') AS passed, COUNT(*) FILTER (WHERE status = 'failed') AS failed FROM compliance_checks GROUP BY regulation_type ORDER BY count DESC"),
      pool.query("SELECT * FROM compliance_checks WHERE status = 'failed' ORDER BY created_at DESC LIMIT 20"),
      pool.query("SELECT * FROM compliance_checks WHERE next_review_date >= NOW() AND next_review_date <= NOW() + INTERVAL '30 days' ORDER BY next_review_date ASC")
        .catch(() => ({ rows: [] }))
    ]);

    res.json({
      summary: summary.rows[0],
      byRegulation: byRegulation.rows,
      highRiskItems: highRisk.rows,
      upcomingReviews: upcomingReviews.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/payment-analysis
router.get('/payment-analysis', async (req, res) => {
  try {
    const [methodDistribution, monthlyTrends, avgAmount, onTimeRatio] = await Promise.all([
      pool.query('SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total FROM payments GROUP BY payment_method ORDER BY count DESC'),
      pool.query(`
        SELECT date_trunc('month', created_at) AS month, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY month
      `),
      pool.query('SELECT COALESCE(AVG(amount), 0) AS avg_amount FROM payments'),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed' AND (due_date IS NULL OR payment_date <= due_date)) AS on_time,
          COUNT(*) FILTER (WHERE status = 'overdue' OR (due_date IS NOT NULL AND payment_date > due_date)) AS late,
          COUNT(*) AS total
        FROM payments
      `)
    ]);

    const total = parseInt(onTimeRatio.rows[0].total) || 1;
    const onTime = parseInt(onTimeRatio.rows[0].on_time);
    const late = parseInt(onTimeRatio.rows[0].late);

    res.json({
      methodDistribution: methodDistribution.rows,
      monthlyTrends: monthlyTrends.rows,
      averagePaymentAmount: Math.round(parseFloat(avgAmount.rows[0].avg_amount) * 100) / 100,
      onTimeVsLate: {
        onTime,
        late,
        onTimePercentage: Math.round((onTime / total) * 10000) / 100,
        latePercentage: Math.round((late / total) * 10000) / 100
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
