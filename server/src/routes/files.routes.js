'use strict';
// Phase 4 — 첨부파일 저장소. 본체는 data/uploads/ 에, 메타는 attachments 테이블에.
// 멀티파트 의존성 없이 base64 JSON 업로드로 처리(express.json limit 내).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { db, logAudit } = require('../db');
const cfg = require('../config');
const { requireAuth } = require('../middleware');

const UPLOAD_DIR = path.join(path.dirname(cfg.DB_FILE), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const router = express.Router();
router.use(requireAuth);

function safeName(name) {
  return String(name || 'file').replace(/[^\w.\-가-힣]/g, '_').slice(0, 120);
}

// 업로드: { domain, targetId, filename, mime, dataB64 }
router.post('/', (req, res) => {
  const b = req.body || {};
  if (!b.filename || !b.dataB64) {
    return res.status(400).json({ error: 'invalid', message: 'filename 과 dataB64 가 필요합니다.' });
  }
  let buf;
  try { buf = Buffer.from(b.dataB64, 'base64'); } catch (_) {
    return res.status(400).json({ error: 'invalid', message: 'base64 디코딩 실패.' });
  }
  const id = 'FILE-' + Date.now().toString(36) + '-' + crypto.randomBytes(4).toString('hex');
  const fname = safeName(b.filename);
  const diskPath = path.join(UPLOAD_DIR, id + '__' + fname);
  fs.writeFileSync(diskPath, buf);
  db.prepare(`INSERT INTO attachments (id, domain, target_id, filename, mime, size, path, uploaded_by)
    VALUES (?,?,?,?,?,?,?,?)`).run(
    id, b.domain || '', b.targetId || '', fname, b.mime || 'application/octet-stream', buf.length, diskPath, req.user.email);
  logAudit(req.user.email, 'file_upload', `${b.domain || ''}/${b.targetId || ''}`, { id, filename: fname, size: buf.length });
  res.status(201).json({ ok: true, id, filename: fname, size: buf.length });
});

// 목록: ?domain=&targetId=
router.get('/', (req, res) => {
  const rows = db.prepare(`SELECT id, domain, target_id, filename, mime, size, uploaded_by, created_at
    FROM attachments WHERE (?='' OR domain=?) AND (?='' OR target_id=?) ORDER BY created_at DESC`)
    .all(req.query.domain || '', req.query.domain || '', req.query.targetId || '', req.query.targetId || '');
  res.json({ ok: true, items: rows });
});

// 다운로드(원본 스트림)
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!row || !fs.existsSync(row.path)) return res.status(404).json({ error: 'not_found', message: '파일을 찾을 수 없습니다.' });
  res.setHeader('Content-Type', row.mime || 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="' + encodeURIComponent(row.filename) + '"');
  fs.createReadStream(row.path).pipe(res);
});

// 삭제
router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM attachments WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found', message: '파일을 찾을 수 없습니다.' });
  try { fs.unlinkSync(row.path); } catch (_) {}
  db.prepare('DELETE FROM attachments WHERE id = ?').run(req.params.id);
  logAudit(req.user.email, 'file_delete', req.params.id, null);
  res.json({ ok: true });
});

module.exports = router;
