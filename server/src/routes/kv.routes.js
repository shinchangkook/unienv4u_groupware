'use strict';
// 객체형 도메인용 키-값 저장소 (det_mno 등).
const express = require('express');
const { db, logAudit } = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// 허용 키 화이트리스트.
// det_mno(Phase 2) + Phase 3 객체형 도메인(연차·휴가설정·메모·메뉴권한).
const KEYS = new Set(['det_mno', 'lv_settings', 'annual', 'memos', 'menu_perms']);

function checkKey(req, res, next) {
  if (!KEYS.has(req.params.key)) {
    return res.status(404).json({ error: 'unknown_key', message: '알 수 없는 키입니다.' });
  }
  next();
}

router.get('/:key', checkKey, (req, res) => {
  const row = db.prepare('SELECT data FROM kv_store WHERE key = ?').get(req.params.key);
  let value = null;
  if (row) { try { value = JSON.parse(row.data); } catch (_) { value = null; } }
  res.json({ ok: true, key: req.params.key, value });
});

router.put('/:key', checkKey, (req, res) => {
  const value = (req.body && Object.prototype.hasOwnProperty.call(req.body, 'value')) ? req.body.value : req.body;
  db.prepare(`INSERT INTO kv_store (key, data, updated_by, updated_at)
    VALUES (?,?,?,datetime('now'))
    ON CONFLICT(key) DO UPDATE SET data=excluded.data, updated_by=excluded.updated_by, updated_at=datetime('now')`)
    .run(req.params.key, JSON.stringify(value ?? null), req.user.email);
  logAudit(req.user.email, 'kv_put', req.params.key, null);
  res.json({ ok: true, key: req.params.key });
});

module.exports = router;
