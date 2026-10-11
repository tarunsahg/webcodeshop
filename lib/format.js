export const DEFAULT_CATS = [
  { id: 'all', name: 'All products', icon: '✨', c: 'linear-gradient(135deg,#5b5bf7,#8b5cf6)' },
  { id: 'php', name: 'PHP scripts', icon: '🐘', c: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
  { id: 'html', name: 'HTML templates', icon: '🎨', c: 'linear-gradient(135deg,#f97316,#fbbf24)' },
  { id: 'js', name: 'JS apps', icon: '⚡', c: 'linear-gradient(135deg,#06b6d4,#3b82f6)' },
  { id: 'giftcard', name: 'Gift cards', icon: '🎁', c: 'linear-gradient(135deg,#10b981,#34d399)' },
];

// Backwards-compatible export of the full default category list (includes "all").
export const CATS = DEFAULT_CATS;

// Default storefront categories (excluding the synthetic "all" entry).
export const defaultShopCats = () => DEFAULT_CATS.filter((c) => c.id !== 'all');

// Runtime registry so catName()/catIcon() resolve custom categories that were
// added from the admin panel. Providers keeps this in sync on load/change.
let REGISTRY = DEFAULT_CATS.slice();
export function setCatRegistry(cats) {
  const all = DEFAULT_CATS[0];
  const list = Array.isArray(cats) ? cats.filter((c) => c && c.id && c.id !== 'all') : [];
  REGISTRY = [all, ...list];
}
export function getCatRegistry() { return REGISTRY; }

// Build a safe, unique category id from a display name.
export function slugifyCat(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return base || 'cat-' + Math.random().toString(36).slice(2, 6);
}

export const money = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const catName = (id) => (REGISTRY.find((c) => c.id === id) || {}).name || id;
export const catIcon = (id) => (REGISTRY.find((c) => c.id === id) || {}).icon || '📦';
export const catImage = (id) => (REGISTRY.find((c) => c.id === id) || {}).image || null;

export function generateKey(productName) {
  const prefix = (productName || 'KEY').replace(/[^A-Za-z]/g, '').slice(0, 5).toUpperCase().padEnd(3, 'X');
  const rnd = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return prefix + '-' + rnd() + '-' + rnd() + '-' + rnd();
}

export function uid(prefix = 'id') {
  return prefix + '_' + Math.random().toString(36).slice(2, 9);
}

// ===== Dates (always displayed in India time, Asia/Kolkata) =====
// SQLite datetime('now') stores UTC with a space separator and no tz marker,
// so we normalise to UTC before formatting in IST.
export function parseDbDate(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  let str = String(s).trim();
  if (!str) return null;
  if (str.endsWith('Z') || str.endsWith('z')) return new Date(str);
  if (str.includes('+')) return new Date(str);
  return new Date(str.replace(' ', 'T') + 'Z');
}
export const fmtDate = (s) => {
  const d = parseDbDate(s);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
};
export const fmtDateTime = (s) => {
  const d = parseDbDate(s);
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};
