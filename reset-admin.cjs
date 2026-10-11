/*
 * One-time admin reset / fix.
 *
 * Run this from the project root (where package.json is) with:
 *     node reset-admin.cjs
 *
 * It force-sets the admin account below, no matter what state the database
 * is in, and removes the old demo/default accounts. Safe to run multiple times.
 * Your products, orders, coupons etc. are NOT touched.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// ==== Edit these if you ever want a different admin login ====
const NAME = 'Tarun Sah';
const EMAIL = 'tarunsahg@gmail.com';
const PASSWORD = 'Tarun2008*';
// =============================================================

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + hash;
}

const dbPath = path.join(process.cwd(), 'data', 'webcodeshop.db');
if (!fs.existsSync(dbPath)) {
  console.error('No database found at ' + dbPath);
  console.error('Start the app once (npm run dev) so the database is created, then run this again.');
  process.exit(1);
}

const d = new Database(dbPath);
try {
  d.prepare("DELETE FROM users WHERE email IN ('buyer@demo.com','admin@webcodeshop.dev')").run();
} catch (e) {}

const email = EMAIL.toLowerCase().trim();
const row = d.prepare('SELECT id FROM users WHERE email=?').get(email);
if (row) {
  d.prepare("UPDATE users SET name=?, password=?, role='admin' WHERE email=?").run(NAME, hashPassword(PASSWORD), email);
  console.log('Updated existing account to admin: ' + email);
} else {
  d.prepare("INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,'admin',?)").run(NAME, email, hashPassword(PASSWORD), new Date().toISOString());
  console.log('Created new admin: ' + email);
}
d.close();
console.log('');
console.log('Done! You can now log in at /admin/login with:');
console.log('  Email:    ' + EMAIL);
console.log('  Password: ' + PASSWORD);
