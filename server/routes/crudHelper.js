const express = require('express');
const pool = require('../db');

function createCrudRouter(tableName, columns, searchColumn = null) {
  const router = express.Router();

  // GET all - with pagination, sorting, filtering, date range
  router.get('/', async (req, res) => {
    try {
      const search = req.query.search;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
      const offset = (page - 1) * limit;
      const sort = req.query.sort || 'created_at';
      const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

      const conditions = [];
      const params = [];
      let paramIndex = 1;

      // Search
      if (search && searchColumn) {
        conditions.push(`${searchColumn} ILIKE $${paramIndex++}`);
        params.push(`%${search}%`);
      }

      // Filter params (filter_*)
      for (const [key, value] of Object.entries(req.query)) {
        if (key.startsWith('filter_') && value) {
          const column = key.replace('filter_', '');
          conditions.push(`${column} = $${paramIndex++}`);
          params.push(value);
        }
      }

      // Date range
      if (req.query.date_from) {
        conditions.push(`created_at >= $${paramIndex++}`);
        params.push(req.query.date_from);
      }
      if (req.query.date_to) {
        conditions.push(`created_at <= $${paramIndex++}`);
        params.push(req.query.date_to);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total
      const countResult = await pool.query(
        `SELECT COUNT(*) FROM ${tableName} ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Fetch data with pagination
      const dataParams = [...params, limit, offset];
      const query = `SELECT * FROM ${tableName} ${whereClause} ORDER BY ${sort} ${order} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      const result = await pool.query(query, dataParams);

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

  // GET one
  router.get('/:id', async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post('/', async (req, res) => {
    try {
      const fields = columns.filter(c => c !== 'id' && c !== 'created_at' && c !== 'updated_at');
      const values = fields.map(f => req.body[f]);
      const placeholders = fields.map((_, i) => `$${i + 1}`);

      const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await pool.query(query, values);
      const created = result.rows[0];

      // Log activity asynchronously
      pool.query(
        `INSERT INTO activity_logs (activity_type, description, performed_by, metadata) VALUES ($1, $2, $3, $4)`,
        [
          'create',
          `Created new ${tableName} record`,
          req.user ? req.user.email : 'system',
          JSON.stringify({ table: tableName, record_id: created.id }),
        ]
      ).catch(err => console.error('Activity log error:', err.message));

      res.status(201).json(created);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  router.put('/:id', async (req, res) => {
    try {
      const fields = columns.filter(c => c !== 'id' && c !== 'created_at' && c !== 'updated_at');
      const setClauses = fields.map((f, i) => `${f} = $${i + 1}`);
      const values = fields.map(f => req.body[f]);
      values.push(req.params.id);

      const query = `UPDATE ${tableName} SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`;
      const result = await pool.query(query, values);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

      const updated = result.rows[0];

      // Log activity asynchronously
      pool.query(
        `INSERT INTO activity_logs (activity_type, description, performed_by, metadata) VALUES ($1, $2, $3, $4)`,
        [
          'update',
          `Updated ${tableName} record #${req.params.id}`,
          req.user ? req.user.email : 'system',
          JSON.stringify({ table: tableName, record_id: parseInt(req.params.id, 10) }),
        ]
      ).catch(err => console.error('Activity log error:', err.message));

      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

      // Log activity asynchronously
      pool.query(
        `INSERT INTO activity_logs (activity_type, description, performed_by, metadata) VALUES ($1, $2, $3, $4)`,
        [
          'delete',
          `Deleted ${tableName} record #${req.params.id}`,
          req.user ? req.user.email : 'system',
          JSON.stringify({ table: tableName, record_id: parseInt(req.params.id, 10) }),
        ]
      ).catch(err => console.error('Activity log error:', err.message));

      res.json({ message: 'Deleted successfully', deleted: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createCrudRouter;
