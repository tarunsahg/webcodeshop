import 'server-only';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { SEED } from './seed.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'webcodeshop.db');

let _db = null;

export function db() {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  migrate(_db);
  seedIfEmpty(_db);
  syncAccounts(_db);
  return _db;
}

function initSchema(d) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'customer',
      avatar TEXT,
      provider TEXT DEFAULT 'local',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS oauth_accounts (
      provider TEXT NOT NULL,
      provider_user_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      email TEXT,
      linked_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (provider, provider_user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS email_unsubscribes (
      email TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_code TEXT NOT NULL,
      user_id INTEGER,
      email TEXT,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_downloads_code ON downloads(license_code);
    CREATE INDEX IF NOT EXISTS idx_downloads_user ON downloads(user_id);
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      body TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE TABLE IF NOT EXISTS wishlist (
      user_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      added_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS email_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      to_addr TEXT NOT NULL,
      subject TEXT NOT NULL,
      template TEXT,
      provider TEXT,
      sent_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cat TEXT NOT NULL,
      price REAL NOT NULL,
      old_price REAL,
      icon TEXT,
      image TEXT,
      gradient TEXT,
      rating REAL DEFAULT 0,
      reviews INTEGER DEFAULT 0,
      sales INTEGER DEFAULT 0,
      description TEXT,
      tag TEXT,
      tag_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      customer_name TEXT,
      customer_email TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      coupon_code TEXT,
      placed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS license_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_name TEXT,
      code TEXT NOT NULL,
      delivered_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'percent',
      value REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      uses INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS support_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_license_order ON license_keys(order_id);
    CREATE INDEX IF NOT EXISTS idx_products_cat ON products(cat);
  `);

  // Lightweight migrations for databases created before a column existed.
  const ensureColumn = (table, column, def) => {
    const cols = d.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((c) => c.name === column)) {
      d.exec(`ALTER TABLE ${table} ADD COLUMN ${def}`);
    }
  };
  try { ensureColumn('products', 'image', 'image TEXT'); } catch (e) {}
  try { ensureColumn('products', 'images', 'images TEXT'); } catch (e) {}
  try { ensureColumn('products', 'features', 'features TEXT'); } catch (e) {}
  try { ensureColumn('products', 'specs', 'specs TEXT'); } catch (e) {}
  try { ensureColumn('products', 'trending', 'trending INTEGER DEFAULT 0'); } catch (e) {}
  try { ensureColumn('products', 'new_arrival', 'new_arrival INTEGER DEFAULT 0'); } catch (e) {}
  try { ensureColumn('products', 'on_deal', 'on_deal INTEGER DEFAULT 0'); } catch (e) {}
  try { ensureColumn('products', 'kind', "kind TEXT DEFAULT 'code'"); } catch (e) {}
  try { ensureColumn('license_keys', 'kind', "kind TEXT DEFAULT 'code'"); } catch (e) {}
  try { ensureColumn('license_keys', 'pin', 'pin TEXT'); } catch (e) {}
  try { ensureColumn('license_keys', 'value', 'value REAL'); } catch (e) {}
  try { ensureColumn('products', 'file_url', 'file_url TEXT'); } catch (e) {}
  try { ensureColumn('products', 'file_name', 'file_name TEXT'); } catch (e) {}
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return salt + ':' + hash;
}

function seedIfEmpty(d) {
  const userCount = d.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (userCount > 0) return;

  const tx = d.transaction(() => {
    const insUser = d.prepare('INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,?,?)');
    for (const u of SEED.customers) {
      insUser.run(u.name, u.email, hashPassword(u.password), 'customer', u.joined ? u.joined + ' 09:00:00' : new Date().toISOString());
    }
    for (const a of SEED.admins) {
      insUser.run(a.name, a.email, hashPassword(a.password), 'admin', new Date().toISOString());
    }

    const insProd = d.prepare('INSERT INTO products (id,name,cat,price,old_price,icon,image,gradient,rating,reviews,sales,description,tag,tag_type,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
    for (const p of SEED.products) {
      insProd.run(p.id, p.name, p.cat, p.price, p.old || null, p.icon, p.image || null, p.gr, p.rating || 0, p.reviews || 0, p.sales || 0, p.desc || '', p.tag || null, p.tagType || null, p.createdAt || new Date().toISOString());
    }

    const insCoupon = d.prepare('INSERT INTO coupons (code,type,value,active,uses) VALUES (?,?,?,?,?)');
    for (const c of SEED.coupons) {
      insCoupon.run(c.code, c.type, c.value, c.active ? 1 : 0, c.used || c.uses || 0);
    }

    const insSetting = d.prepare('INSERT INTO settings (key,value) VALUES (?,?)');
    for (const [k, v] of Object.entries(SEED.settings)) {
      insSetting.run(k, typeof v === 'string' ? v : JSON.stringify(v));
    }

    const insOrder = d.prepare('INSERT INTO orders (id,user_id,customer_name,customer_email,status,subtotal,discount,total,coupon_code,placed_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
    const insItem = d.prepare('INSERT INTO order_items (order_id,product_id,product_name,qty,price) VALUES (?,?,?,?,?)');
    const insKey = d.prepare('INSERT INTO license_keys (order_id,product_id,product_name,code) VALUES (?,?,?,?)');
    const findUser = d.prepare('SELECT id FROM users WHERE email=?');
    for (const o of SEED.orders) {
      const userRow = findUser.get(o.email);
      const subtotal = (o.items || []).reduce((s, it) => s + it.price * it.qty, 0);
      insOrder.run(o.id, userRow ? userRow.id : null, o.name || o.customer || '', o.email, o.status || 'completed', subtotal, Math.max(0, subtotal - o.total), o.total, o.coupon || null, o.date + ' 12:00:00');
      for (const it of (o.items || [])) {
        const pid = it.pid || it.id || null;
        insItem.run(o.id, pid, it.name, it.qty, it.price);
        if (it.key) {
          insKey.run(o.id, pid, it.name, it.key);
          for (let i = 1; i < it.qty; i++) insKey.run(o.id, pid, it.name, genKey(pid || 'WCS'));
        } else {
          for (let i = 0; i < it.qty; i++) insKey.run(o.id, pid, it.name, genKey(pid || 'WCS'));
        }
      }
    }
  });
  tx();
}

// Ensures the configured admin account(s) always exist with the configured
// credentials, and removes legacy demo/default accounts. Runs on every startup
// so the documented credentials work even on a pre-existing database.
function syncAccounts(d) {
  try { d.prepare("DELETE FROM users WHERE email IN ('buyer@demo.com','admin@webcodeshop.dev')").run(); } catch (e) {}
  const find = d.prepare('SELECT id, password FROM users WHERE email=?');
  const upd = d.prepare("UPDATE users SET name=?, password=?, role='admin' WHERE email=?");
  const ins = d.prepare("INSERT INTO users (name,email,password,role,created_at) VALUES (?,?,?,'admin',?)");
  for (const a of (SEED.admins || [])) {
    const row = find.get(a.email);
    if (!row) { ins.run(a.name, a.email, hashPassword(a.password), new Date().toISOString()); continue; }
    if (!verifyPassword(a.password, row.password)) upd.run(a.name, hashPassword(a.password), a.email);
  }
}

function migrate(d) {
  const cols = d.prepare("PRAGMA table_info(orders)").all().map((c) => c.name);
  if (!cols.includes('payment_method')) d.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT 'card'");
  if (!cols.includes('txn_id')) d.exec("ALTER TABLE orders ADD COLUMN txn_id TEXT");
  if (!cols.includes('admin_message')) d.exec("ALTER TABLE orders ADD COLUMN admin_message TEXT");
  if (!cols.includes('customer_phone')) d.exec("ALTER TABLE orders ADD COLUMN customer_phone TEXT");
}

function genKey(prefix) {
  const p = (prefix || 'WCS').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'WCS';
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${p}-${seg()}-${seg()}-${seg()}`;
}

// Gift cards use a distinct, higher-entropy code plus a separate 4-digit PIN,
// so they behave like cash and never collide with software license keys.
function genGiftCard() {
  const seg = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  const code = `GC-${seg()}-${seg()}-${seg()}-${seg()}`;
  const pin = String(1000 + (crypto.randomBytes(2).readUInt16BE(0) % 9000));
  return { code, pin };
}

export { hashPassword, genKey, genGiftCard };

export function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const test = crypto.scryptSync(pw, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
  } catch {
    return false;
  }
}
