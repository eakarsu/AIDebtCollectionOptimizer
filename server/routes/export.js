const express = require('express');
const router = express.Router();
const pool = require('../db');

const entityTableMap = {
  debtors: 'debtors',
  payments: 'payments',
  campaigns: 'campaigns',
  disputes: 'disputes',
  settlements: 'settlements',
  'payment-plans': 'payment_plans',
  'compliance-checks': 'compliance_checks',
  agents: 'collection_agents',
  portfolios: 'portfolios',
  schedules: 'contact_schedules',
  'risk-assessments': 'risk_assessments'
};

function buildFilterQuery(tableName, query) {
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (query.filter_status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(query.filter_status);
  }

  if (query.date_from) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(query.date_from);
  }

  if (query.date_to) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(query.date_to);
  }

  if (query.search) {
    conditions.push(`CAST(${tableName}.* AS TEXT) ILIKE $${paramIndex++}`);
    params.push(`%${query.search}%`);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { whereClause, params };
}

function rowsToCsv(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(',')];
  for (const row of rows) {
    const values = headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csvLines.push(values.join(','));
  }
  return csvLines.join('\n');
}

// GET /api/export/:entity
router.get('/:entity', async (req, res) => {
  try {
    const tableName = entityTableMap[req.params.entity];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity. Allowed: ' + Object.keys(entityTableMap).join(', ') });
    }

    const { whereClause, params } = buildFilterQuery(tableName, req.query);
    const sql = `SELECT * FROM ${tableName} ${whereClause} ORDER BY created_at DESC`;
    const result = await pool.query(sql, params);

    const csv = rowsToCsv(result.rows);
    const date = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}_${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/:entity/summary
router.get('/:entity/summary', async (req, res) => {
  try {
    const tableName = entityTableMap[req.params.entity];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity. Allowed: ' + Object.keys(entityTableMap).join(', ') });
    }

    const countResult = await pool.query(`SELECT COUNT(*) AS total_records FROM ${tableName}`);
    const dateRangeResult = await pool.query(`SELECT MIN(created_at) AS earliest, MAX(created_at) AS latest FROM ${tableName}`);

    // Get numeric column aggregates
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = $1 AND data_type IN ('numeric', 'decimal', 'integer', 'bigint', 'real', 'double precision')
    `, [tableName]);

    const numericSummaries = {};
    for (const col of columnsResult.rows) {
      const aggResult = await pool.query(`SELECT COALESCE(SUM(${col.column_name}), 0) AS sum, COALESCE(AVG(${col.column_name}), 0) AS avg, COALESCE(MIN(${col.column_name}), 0) AS min, COALESCE(MAX(${col.column_name}), 0) AS max FROM ${tableName}`);
      numericSummaries[col.column_name] = aggResult.rows[0];
    }

    res.json({
      entity: req.params.entity,
      totalRecords: parseInt(countResult.rows[0].total_records),
      dateRange: {
        earliest: dateRangeResult.rows[0].earliest,
        latest: dateRangeResult.rows[0].latest
      },
      numericSummaries
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
