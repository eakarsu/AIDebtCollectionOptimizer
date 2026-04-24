const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET / - List audit logs with pagination and filters
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (req.query.entity_type) {
      conditions.push(`entity_type = $${paramIndex++}`);
      params.push(req.query.entity_type);
    }

    if (req.query.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(req.query.action);
    }

    if (req.query.user_email) {
      conditions.push(`user_email = $${paramIndex++}`);
      params.push(req.query.user_email);
    }

    if (req.query.date_from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(req.query.date_from);
    }

    if (req.query.date_to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(req.query.date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, limit, offset];
    const result = await pool.query(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      dataParams
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /entity/:type/:id - Get audit trail for specific entity
router.get('/entity/:type/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC`,
      [req.params.type, req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
