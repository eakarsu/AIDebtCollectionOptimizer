'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'agent',
    tenant_id TEXT NOT NULL DEFAULT 'default', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS ai_analyses (
    id BIGSERIAL PRIMARY KEY, analysis_type TEXT NOT NULL, input_data_json JSONB,
    result_json JSONB, model_used TEXT, user_id BIGINT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const migration = path.join(__dirname, '..', 'migrations', '002_governed_workflow.sql');
  await pool.query(fs.readFileSync(migration, 'utf8'));
  console.log('Runtime schema migrated');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
