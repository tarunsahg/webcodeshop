import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';

function loadSettings() {
  const rows = db().prepare('SELECT key,value FROM settings').all();
  const out = {};
  for (const r of rows) {
    try { out[r.key] = JSON.parse(r.value); } catch { out[r.key] = r.value; }
  }
  return out;
}

export async function GET() {
  return handle(async () => ok({ settings: loadSettings() }));
}

export async function PUT(req) {
  return handle(async () => {
    requireAdmin();
    const body = await parseJSON(req);
    const upsert = db().prepare('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
    const tx = db().transaction(() => {
      for (const [k, v] of Object.entries(body || {})) {
        upsert.run(k, typeof v === 'string' ? v : JSON.stringify(v));
      }
    });
    tx();
    return ok({ settings: loadSettings() });
  });
}
