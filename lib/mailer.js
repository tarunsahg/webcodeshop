import 'server-only';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db } from './db.js';

/*
  Email service abstraction.
  - If SMTP is configured in Admin -> Integrations, sends via SMTP (nodemailer).
  - Else if RESEND_API_KEY is set, sends via Resend.
  - Otherwise, writes the message to ./data/mail/*.txt (dev outbox).
  - Marketing emails are skipped for unsubscribed recipients.
  - All sends are recorded in the email_log table.
*/

const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const FROM = process.env.MAIL_FROM || 'WebCodeShop <hello@webcodeshop.dev>';
const RESEND_KEY = process.env.RESEND_API_KEY;
const SECRET = process.env.WCS_SECRET || 'webcodeshop-dev-secret-change-me-in-production';
const MAIL_DIR = path.join(process.cwd(), 'data', 'mail');
const SUPPORT = 'contact@webcodeshop.com';

// ===== Unsubscribe helpers =====
export function unsubToken(email) {
  return crypto.createHmac('sha256', SECRET).update('unsub:' + String(email || '').toLowerCase().trim()).digest('base64url');
}
export function verifyUnsub(email, token) {
  if (!email || !token) return false;
  const a = Buffer.from(String(token));
  const b = Buffer.from(unsubToken(email));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function isUnsubscribed(email) {
  try { return !!db().prepare('SELECT email FROM email_unsubscribes WHERE email=?').get(String(email || '').toLowerCase().trim()); } catch { return false; }
}
export function setUnsubscribed(email, on) {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return;
  if (on) db().prepare('INSERT OR IGNORE INTO email_unsubscribes (email) VALUES (?)').run(e);
  else db().prepare('DELETE FROM email_unsubscribes WHERE email=?').run(e);
}
function unsubUrl(email) {
  if (!email) return APP_URL + '/unsubscribe';
  return APP_URL + '/unsubscribe?e=' + encodeURIComponent(String(email).toLowerCase().trim()) + '&t=' + unsubToken(email);
}

// ===== Providers =====
async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error('Resend error: ' + res.status);
  return await res.json();
}

function logToFile({ to, subject, html, text, template }) {
  if (!fs.existsSync(MAIL_DIR)) fs.mkdirSync(MAIL_DIR, { recursive: true });
  const fn = new Date().toISOString().replace(/[:.]/g, '-') + '_' + (template || 'mail') + '.txt';
  const body = 'To: ' + to + '\nSubject: ' + subject + '\nFrom: ' + FROM + '\n\n' + (text || html);
  fs.writeFileSync(path.join(MAIL_DIR, fn), body, 'utf8');
  console.log('[mailer:dev]', subject, '->', to, '(saved to', fn + ')');
}

// Reads SMTP settings saved from Admin -> Integrations (settings table).
function getSmtpConfig() {
  try {
    const rows = db().prepare("SELECT key,value FROM settings WHERE key IN ('smtpHost','smtpPort','smtpUser','smtpPass','fromEmail')").all();
    const s = {};
    for (const r of rows) { try { s[r.key] = JSON.parse(r.value); } catch { s[r.key] = r.value; } }
    if (s.smtpHost && s.smtpUser && s.smtpPass) {
      return { host: s.smtpHost, port: parseInt(s.smtpPort || '587', 10), user: s.smtpUser, pass: s.smtpPass, from: s.fromEmail || s.smtpUser };
    }
  } catch {}
  return null;
}

async function sendViaSmtp({ to, subject, html, text }) {
  const cfg = getSmtpConfig();
  if (!cfg) throw new Error('SMTP is not configured.');
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.port === 465, auth: { user: cfg.user, pass: cfg.pass } });
  await transporter.sendMail({ from: cfg.from, to, subject, html, text });
}

// Verifies the saved SMTP credentials can actually connect. Throws on failure.
export async function verifySmtp() {
  const cfg = getSmtpConfig();
  if (!cfg) throw new Error('Add your SMTP host, username and password first, then save.');
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.port === 465, auth: { user: cfg.user, pass: cfg.pass } });
  await transporter.verify();
  return true;
}

// ===== Core send =====
export async function sendMail({ to, subject, html, text, template, marketing }) {
  if (marketing && isUnsubscribed(to)) {
    try { db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, template || null, 'skipped-unsub'); } catch {}
    return { skipped: true };
  }
  const smtp = getSmtpConfig();
  const provider = smtp ? 'smtp' : (RESEND_KEY ? 'resend' : 'console');
  try {
    if (smtp) await sendViaSmtp({ to, subject, html, text });
    else if (RESEND_KEY) await sendViaResend({ to, subject, html, text });
    else logToFile({ to, subject, html, text, template });
    try { db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, template || null, provider); } catch {}
    return { ok: true, provider };
  } catch (e) {
    console.error('[mailer] failed:', e.message);
    try { db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, template || null, 'failed'); } catch {}
    throw e;
  }
}

// Sends a test email through whichever provider is configured. Throws on real send failure.
export async function sendTestEmail({ to, subject, text }) {
  const safe = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = layout('<h2 style="margin:0 0 10px;">It works! \u2713</h2><div style="white-space:pre-wrap;color:#3a4663;">' + safe + '</div>', to);
  const smtp = getSmtpConfig();
  let provider = 'console';
  if (smtp) { await sendViaSmtp({ to, subject, html, text }); provider = 'smtp'; }
  else if (RESEND_KEY) { await sendViaResend({ to, subject, html, text }); provider = 'resend'; }
  else { logToFile({ to, subject, html, text, template: 'test' }); provider = 'console'; }
  try { db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, 'test', provider); } catch {}
  return provider;
}

// ===== Modern email layout (logo header, CTA-friendly body, footer + unsubscribe) =====
function button(href, label) {
  return '<a href="' + href + '" style="display:inline-block;background:#1e64ff;color:#ffffff;padding:13px 26px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">' + label + '</a>';
}

function layout(content, to) {
  const year = new Date().getFullYear();
  const logo = APP_URL + '/logo-icon.png';
  const unsub = unsubUrl(to);
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#eef1f7;">'
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">WebCodeShop \u2014 Code. Templates. Scripts. Solutions.</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f7;padding:28px 12px;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;"><tr><td align="center">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(11,31,77,.10);">'
    // header
    + '<tr><td style="background:linear-gradient(135deg,#0b1f4d 0%,#1e64ff 100%);padding:26px 30px;">'
    + '<table role="presentation" cellpadding="0" cellspacing="0"><tr>'
    + '<td style="vertical-align:middle;"><img src="' + logo + '" width="40" height="40" alt="WebCodeShop" style="display:block;border-radius:10px;background:#ffffff;"/></td>'
    + '<td style="vertical-align:middle;padding-left:12px;"><div style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-.02em;">WebCodeShop</div>'
    + '<div style="color:#bcd0ff;font-size:11px;letter-spacing:.12em;text-transform:uppercase;">Code \u00b7 Templates \u00b7 Scripts</div></td>'
    + '</tr></table></td></tr>'
    // body
    + '<tr><td style="padding:32px 30px;color:#0a1733;font-size:15px;line-height:1.65;">' + content + '</td></tr>'
    // help strip
    + '<tr><td style="padding:0 30px 26px;"><div style="background:#f6f8fd;border:1px solid #e6eaf2;border-radius:12px;padding:16px 18px;font-size:13px;color:#5f6b85;">Need a hand? Just reply to this email or reach us at <a href="mailto:' + SUPPORT + '" style="color:#1e64ff;text-decoration:none;">' + SUPPORT + '</a>.</div></td></tr>'
    // footer
    + '<tr><td style="padding:20px 30px;background:#0b1f4d;color:#aebbd8;font-size:12px;line-height:1.7;">'
    + '<div style="color:#ffffff;font-weight:700;font-size:14px;margin-bottom:4px;">WebCodeShop</div>'
    + 'Premium code, scripts &amp; digital gift cards \u2014 delivered the moment you check out.<br>'
    + '<a href="' + APP_URL + '/shop" style="color:#9fc0ff;text-decoration:none;">Shop</a> &nbsp;\u00b7&nbsp; '
    + '<a href="' + APP_URL + '/account" style="color:#9fc0ff;text-decoration:none;">My account</a> &nbsp;\u00b7&nbsp; '
    + '<a href="' + APP_URL + '/help" style="color:#9fc0ff;text-decoration:none;">Help center</a>'
    + '<div style="margin-top:14px;color:#6f80a6;">\u00a9 ' + year + ' WebCodeShop. All rights reserved.<br>'
    + 'You\u2019re receiving this email because you have an account with us. <a href="' + unsub + '" style="color:#9fc0ff;text-decoration:underline;">Unsubscribe</a> from marketing emails.</div>'
    + '</td></tr>'
    + '</table></td></tr></table></body></html>';
}

// ===== Templates =====
export async function sendWelcome(user) {
  return sendMail({
    to: user.email,
    subject: 'Welcome to WebCodeShop \ud83d\udc4b',
    template: 'welcome',
    marketing: true,
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Hey ' + user.name + ', welcome aboard! \ud83c\udf89</h2>'
      + '<p style="color:#3a4663;">Your WebCodeShop account is ready. Browse production-ready PHP &amp; HTML software, modern JS apps, and instant digital gift cards \u2014 delivered to your inbox the moment you check out.</p>'
      + '<p style="margin:22px 0;">' + button(APP_URL + '/shop', 'Start browsing') + '</p>'
      + '<p style="color:#5f6b85;font-size:13.5px;">Every purchase comes with instant delivery and lifetime updates.</p>', user.email),
    text: 'Welcome ' + user.name + '! Your WebCodeShop account is ready. Browse: ' + APP_URL + '/shop',
  });
}

export async function sendOrderReceipt(order) {
  const keysList = (order.keys || []).map((k) => '<tr><td style="padding:10px 0;font-weight:600;border-bottom:1px solid #eef1f7;">' + k.name + '</td><td style="padding:10px 0;font-family:monospace;color:#1e64ff;border-bottom:1px solid #eef1f7;text-align:right;">' + k.code + '</td></tr>').join('');
  const total = '\u20b9' + (order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sendMail({
    to: order.email,
    subject: 'Order confirmed \u2014 ' + order.id,
    template: 'order-receipt',
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Thanks for your order! \u2713</h2>'
      + '<p style="color:#3a4663;">Order <b>' + order.id + '</b> is confirmed. Your license keys and downloads are below and saved to your account.</p>'
      + '<table role="presentation" width="100%" style="border-collapse:collapse;margin:18px 0;">' + keysList + '</table>'
      + '<div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;padding-top:6px;"><span>Total paid</span><span>' + total + '</span></div>'
      + '<p style="margin:22px 0;">' + button(APP_URL + '/account', 'View in your account') + '</p>', order.email),
    text: 'Order ' + order.id + ' confirmed. Total ' + total + '. View: ' + APP_URL + '/account',
  });
}

export async function sendPasswordReset(user, resetUrl) {
  return sendMail({
    to: user.email,
    subject: 'Reset your WebCodeShop password',
    template: 'password-reset',
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Reset your password</h2>'
      + '<p style="color:#3a4663;">We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>'
      + '<p style="margin:22px 0;">' + button(resetUrl, 'Reset password') + '</p>'
      + '<p style="font-size:13px;color:#5f6b85;word-break:break-all;">Or paste this link into your browser:<br><a href="' + resetUrl + '" style="color:#1e64ff;">' + resetUrl + '</a></p>'
      + '<p style="font-size:13px;color:#5f6b85;">If you didn\u2019t request this, you can safely ignore this email \u2014 your password won\u2019t change.</p>', user.email),
    text: 'Reset your WebCodeShop password: ' + resetUrl,
  });
}

export async function sendSubscribeWelcome(email) {
  return sendMail({
    to: email,
    subject: 'You are subscribed to WebCodeShop 🎉',
    template: 'subscribe-welcome',
    marketing: true,
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">You are on the list! 🎉</h2>'
      + '<p style="color:#3a4663;">Thanks for subscribing to WebCodeShop. You will be first to hear about fresh code drops, new templates &amp; scripts, and exclusive promo codes — about one email a week, never any spam.</p>'
      + '<p style="margin:22px 0;">' + button(APP_URL + '/shop', 'Explore the shop') + '</p>'
      + '<p style="color:#5f6b85;font-size:13.5px;">Changed your mind? You can unsubscribe anytime using the link at the bottom of any email.</p>', email),
    text: 'Thanks for subscribing to WebCodeShop! Explore the shop: ' + APP_URL + '/shop',
  });
}

export async function sendOrderPending(order) {
  return sendMail({
    to: order.email,
    subject: 'We received your order — ' + order.id,
    template: 'order-pending',
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Thanks ' + (order.name || 'there') + ', we got your order ⏳</h2>'
      + '<p style="color:#3a4663;">Your order <b>' + order.id + '</b> has been placed and your payment is <b>under review</b>. We verify UPI payments manually — usually within a few hours.</p>'
      + orderItemsTable(order)
      + (order.txnId ? '<p style="color:#5f6b85;font-size:13.5px;">Transaction ID: <span style="font-family:monospace;color:#0a1733;">' + order.txnId + '</span></p>' : '')
      + '<p style="color:#3a4663;">We’ll email you the moment it’s approved, and your downloads &amp; codes will appear in your account.</p>'
      + '<p style="margin:22px 0;">' + button(APP_URL + '/account', 'Track your order') + '</p>', order.email),
    text: 'Order ' + order.id + ' received and under review. Track it: ' + APP_URL + '/account',
  });
}

export async function sendOrderApproved(order) {
  return sendMail({
    to: order.email,
    subject: 'Payment approved — ' + order.id + ' is confirmed',
    template: 'order-approved',
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Good news ' + (order.name || 'there') + ', your payment is approved ✓</h2>'
      + '<p style="color:#3a4663;">We’ve verified your payment for order <b>' + order.id + '</b>. Your order is now confirmed and your items are being delivered to your account.</p>'
      + orderItemsTable(order)
      + '<p style="color:#3a4663;">You’ll receive your downloads, codes or gift cards shortly — they’re always available in your account too.</p>'
      + '<p style="margin:22px 0;">' + button(APP_URL + '/account', 'View my order') + '</p>', order.email),
    text: 'Payment approved for order ' + order.id + '. View it: ' + APP_URL + '/account',
  });
}

export async function sendOrderItemsDelivered(order, keys) {
  const list = (keys && keys.length) ? keys : (order.keys || []);
  const hasGift = list.some((k) => k.kind === 'giftcard');
  const hasCode = list.some((k) => k.kind !== 'giftcard');
  return sendMail({
    to: order.email,
    subject: 'Order is completed — ' + order.id + ' 🎉',
    template: 'order-delivered',
    html: layout('<h2 style="margin:0 0 8px;font-size:21px;">Order is completed! 🎉</h2>'
      + '<p style="color:#3a4663;">Here ' + (list.length === 1 ? 'is your item' : 'are your items') + ' for order <b>' + order.id + '</b>. ' + (hasCode ? 'Your download links are below.' : (hasGift ? 'Keep your gift code and PIN safe.' : '')) + '</p>'
      + deliveredKeysBlock(list)
      + '<p style="margin:22px 0;">' + button(APP_URL + '/account', 'Go to my account') + '</p>'
      + '<p style="color:#5f6b85;font-size:13px;">Tip: you can re-download or copy your codes anytime from your account.</p>', order.email),
    text: 'Your order ' + order.id + ' is completed. View it: ' + APP_URL + '/account',
  });
}

function orderItemsTable(order) {
  const rows = (order.items || []).map((it) =>
    '<tr><td style="padding:9px 0;border-bottom:1px solid #eef1f7;color:#0a1733;">' + it.name + ' <span style="color:#8a96b3;">× ' + it.qty + '</span></td>'
    + '<td style="padding:9px 0;border-bottom:1px solid #eef1f7;text-align:right;font-weight:600;color:#0a1733;">₹' + ((it.price || 0) * (it.qty || 1)).toLocaleString('en-IN') + '</td></tr>'
  ).join('');
  const total = '₹' + (order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return '<table role="presentation" width="100%" style="border-collapse:collapse;margin:16px 0;font-size:14.5px;">' + rows
    + '<tr><td style="padding:12px 0 0;font-weight:800;font-size:16px;color:#0a1733;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:16px;color:#0a1733;">' + total + '</td></tr></table>';
}

function deliveredKeysBlock(keys) {
  return (keys || []).map((k) => {
    const isGift = k.kind === 'giftcard';
    const pinLine = isGift && k.pin ? '<div style="font-size:13px;color:#5f6b85;margin-top:4px;">PIN: <span style="font-family:monospace;color:#0a1733;font-weight:700;">' + k.pin + '</span></div>' : '';
    const isLink = !isGift && String(k.code || '').startsWith('http');
    const codeLine = isLink
      ? '<a href="' + k.code + '" style="color:#1e64ff;font-family:monospace;word-break:break-all;">' + k.code + '</a>'
      : '<span style="font-family:monospace;color:#0a1733;font-weight:700;word-break:break-all;">' + k.code + '</span>';
    return '<div style="background:#f6f8fd;border:1px solid #e6eaf2;border-radius:12px;padding:14px 16px;margin-bottom:10px;">'
      + '<div style="font-weight:700;color:#0a1733;margin-bottom:4px;">' + (isGift ? '🎁 ' : '💻 ') + k.name + '</div>'
      + codeLine + pinLine + '</div>';
  }).join('');
}
