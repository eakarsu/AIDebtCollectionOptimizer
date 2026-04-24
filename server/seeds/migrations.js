const pool = require('../db');

async function runMigrations() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        user_email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(100) NOT NULL,
        entity_id INTEGER,
        old_data JSONB,
        new_data JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT false,
        link VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        debtor_name VARCHAR(255),
        activity_type VARCHAR(100) NOT NULL,
        description TEXT,
        performed_by VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  }
}

module.exports = { runMigrations };
