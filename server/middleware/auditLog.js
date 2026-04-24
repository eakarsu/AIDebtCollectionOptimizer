const pool = require('../db');

function createAuditMiddleware(entityType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    let oldData = null;

    // For updates, try to fetch old data before proceeding
    if (req.method === 'PUT' && req.params.id) {
      try {
        const result = await pool.query(
          `SELECT * FROM ${entityType} WHERE id = $1`,
          [req.params.id]
        );
        if (result.rows.length > 0) {
          oldData = result.rows[0];
        }
      } catch (err) {
        // Silently continue - old data capture is best-effort
      }
    }

    // Override res.json to capture response and log asynchronously
    res.json = (data) => {
      originalJson(data);

      // Log asynchronously - don't block the response
      const method = req.method;
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const actionMap = {
          POST: 'create',
          PUT: 'update',
          DELETE: 'delete',
        };
        const action = actionMap[method];
        const userId = req.user ? req.user.id : null;
        const userEmail = req.user ? req.user.email : null;
        const entityId = req.params.id ? parseInt(req.params.id, 10) : null;
        const ipAddress = req.ip || req.connection.remoteAddress || null;
        const newData = method === 'DELETE' ? null : req.body;

        pool.query(
          `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_data, new_data, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userId,
            userEmail,
            action,
            entityType,
            entityId,
            oldData ? JSON.stringify(oldData) : null,
            newData ? JSON.stringify(newData) : null,
            ipAddress,
          ]
        ).catch((err) => {
          console.error('Audit log error:', err.message);
        });
      }
    };

    next();
  };
}

module.exports = { createAuditMiddleware };
