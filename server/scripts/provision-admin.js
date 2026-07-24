'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const email = String(process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const tenantId = String(process.env.GOVERNANCE_TENANT_ID || process.env.TENANT_ID || 'runtime-tenant');
  if (!email || password.length < 12) throw new Error('Provisioning requires an admin email and a password of at least 12 characters');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users(name,email,password_hash,role,tenant_id) VALUES($1,$2,$3,'admin',$4)
     ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='admin',tenant_id=EXCLUDED.tenant_id`,
    ['Runtime Administrator', email, hash, tenantId]
  );
  console.log('Runtime administrator provisioned');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
