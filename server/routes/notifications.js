const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET / - List notifications for current user, unread first
router.get('/', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let result;

    if (userId) {
      result = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY read ASC, created_at DESC`,
        [userId]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM notifications ORDER BY read ASC, created_at DESC`
      );
    }

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /unread-count - Get count of unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    let result;

    if (userId) {
      result = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false`,
        [userId]
      );
    } else {
      result = await pool.query(
        `SELECT COUNT(*) FROM notifications WHERE read = false`
      );
    }

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /read-all - Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    if (userId) {
      await pool.query(
        `UPDATE notifications SET read = true WHERE user_id = $1 AND read = false`,
        [userId]
      );
    } else {
      await pool.query(`UPDATE notifications SET read = true WHERE read = false`);
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /:id - Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
