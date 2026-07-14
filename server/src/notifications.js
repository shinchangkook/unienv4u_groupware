'use strict';
// Phase 5 — 인앱 알림. (SMTP 메일은 후속 확장 지점: sendMail 훅만 추가하면 됨)
const { db } = require('./db');

function create(recipient, { type, title, body, ref } = {}) {
  if (!recipient) return null;
  const r = db.prepare(`INSERT INTO notifications (recipient, type, title, body, ref) VALUES (?,?,?,?,?)`)
    .run(recipient, type || '', title || '', body || '', ref || '');
  // 후속: 여기서 SMTP 발송 훅 호출 가능 (환경변수 SMTP_* 설정 시)
  return r.lastInsertRowid;
}

function listForUser(email, { unreadOnly = false, limit = 30 } = {}) {
  const sql = `SELECT id, type, title, body, ref, is_read, created_at
    FROM notifications WHERE recipient = ? ${unreadOnly ? 'AND is_read = 0' : ''}
    ORDER BY id DESC LIMIT ?`;
  return db.prepare(sql).all(email, Math.min(Number(limit) || 30, 100))
    .map(n => ({ ...n, is_read: !!n.is_read }));
}

function unreadCount(email) {
  return db.prepare('SELECT COUNT(*) c FROM notifications WHERE recipient = ? AND is_read = 0').get(email).c;
}

function markRead(id, email) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient = ?').run(id, email);
}
function markAllRead(email) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE recipient = ? AND is_read = 0').run(email);
}

module.exports = { create, listForUser, unreadCount, markRead, markAllRead };
