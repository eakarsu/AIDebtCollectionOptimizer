const express = require('express');
const router = express.Router();
const pool = require('../db');

const allowedEntities = {
  debtors: 'debtors',
  payments: 'payments',
  campaigns: 'campaigns',
  disputes: 'disputes',
  settlements: 'settlements',
  'payment-plans': 'payment_plans',
  agents: 'collection_agents',
  portfolios: 'portfolios',
  schedules: 'contact_schedules'
};

// Allowed columns per entity for updates (prevents arbitrary column injection)
const allowedColumns = {
  debtors: ['name', 'email', 'phone', 'address', 'total_debt', 'status', 'account_number', 'notes'],
  payments: ['debtor_name', 'amount', 'payment_method', 'status', 'reference_number', 'payment_date', 'due_date', 'notes'],
  campaigns: ['name', 'status', 'type', 'start_date', 'end_date', 'description'],
  disputes: ['debtor_name', 'reason', 'status', 'resolution', 'notes'],
  settlements: ['debtor_name', 'original_amount', 'settlement_amount', 'discount_percent', 'status', 'notes'],
  'payment-plans': ['debtor_name', 'total_amount', 'installment_amount', 'frequency', 'status', 'notes'],
  agents: ['name', 'email', 'phone', 'status', 'performance_score'],
  portfolios: ['name', 'status', 'total_value', 'description'],
  schedules: ['debtor_name', 'scheduled_date', 'contact_type', 'status', 'notes']
};

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

// POST /api/bulk/:entity/update
router.post('/:entity/update', async (req, res) => {
  try {
    const tableName = allowedEntities[req.params.entity];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity. Allowed: ' + Object.keys(allowedEntities).join(', ') });
    }

    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'updates must be a non-empty object' });
    }

    const entityAllowed = allowedColumns[req.params.entity] || [];
    const updateFields = Object.keys(updates).filter(k => entityAllowed.includes(k));
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const params = [];
    let paramIndex = 1;

    const setClauses = updateFields.map(field => {
      params.push(updates[field]);
      return `${field} = $${paramIndex++}`;
    });

    const idPlaceholders = ids.map(id => {
      params.push(id);
      return `$${paramIndex++}`;
    });

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id IN (${idPlaceholders.join(', ')}) RETURNING *`;
    const result = await pool.query(sql, params);

    res.json({ updated: result.rowCount, rows: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bulk/:entity/delete
router.post('/:entity/delete', async (req, res) => {
  try {
    const tableName = allowedEntities[req.params.entity];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity. Allowed: ' + Object.keys(allowedEntities).join(', ') });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`);
    const sql = `DELETE FROM ${tableName} WHERE id IN (${placeholders.join(', ')}) RETURNING *`;
    const result = await pool.query(sql, ids);

    res.json({ deleted: result.rowCount, rows: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bulk/:entity/export
router.post('/:entity/export', async (req, res) => {
  try {
    const tableName = allowedEntities[req.params.entity];
    if (!tableName) {
      return res.status(400).json({ error: 'Invalid entity. Allowed: ' + Object.keys(allowedEntities).join(', ') });
    }

    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }

    const placeholders = ids.map((_, i) => `$${i + 1}`);
    const sql = `SELECT * FROM ${tableName} WHERE id IN (${placeholders.join(', ')}) ORDER BY created_at DESC`;
    const result = await pool.query(sql, ids);

    const csv = rowsToCsv(result.rows);
    const date = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}_export_${date}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
