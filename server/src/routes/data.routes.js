'use strict';
// 범용 문서 저장소 라우트.
// index.html 의 나머지 localStorage 도메인(clients, ctu, billing, env, leaves,
// annual, lv_settings, memos, menu_perms, det_mno)을 서버로 동기화하기 위한 계층.
// Phase 2 에서 도메인별 정식 테이블 + 검증 로직으로 승격한다.
const express = require('express');
const { db, logAudit, transaction } = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// 허용 도메인 화이트리스트 (임의 도메인 생성 방지).
// 주의: clients/contracts/billings/env 는 Phase 2 에서 /api/domains 로 승격됨.
//       det_mno/lv_settings 는 /api/kv 로 이동. 여기는 Phase 3 대상만 남긴다.
const DOMAINS = new Set([
  'leaves', 'annual', 'memos', 'menu_perms',
]);

function checkDomain(req, res, next) {
  if (!DOMAINS.has(req.params.domain)) {
    return res.status(404).json({ error: 'unknown_domain', message: '알 수 없는 도메인입니다.' });
  }
  next();
}

// ── 도메인 전체 조회 ──
router.get('/:domain', checkDomain, (req, res) => {
  const rows = db.prepare('SELECT id, data FROM documents WHERE domain = ? ORDER BY id').all(req.params.domain);
  const items = rows.map(r => {
    try { return JSON.parse(r.data); } catch (_) { return { id: r.id }; }
  });
  res.json({ ok: true, domain: req.params.domain, items });
});

// ── 도메인 전체 교체 (배열 저장) ──
// 프론트 store 어댑터의 save(domain, array) 에 대응.
router.put('/:domain', checkDomain, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : (req.body && req.body.items);
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'invalid', message: '배열 형식의 items 가 필요합니다.' });
  }
  const domain = req.params.domain;
  const del = db.prepare('DELETE FROM documents WHERE domain = ?');
  const ins = db.prepare('INSERT INTO documents (domain, id, data, updated_by) VALUES (?,?,?,?)');
  const tx = transaction((list) => {
    del.run(domain);
    list.forEach((item, i) => {
      const base = item ? (item.id ?? item.no ?? item.email ?? item.mno ?? item.key) : undefined;
      const id = String(base != null ? base : i);
      ins.run(domain, id, JSON.stringify(item), req.user.email);
    });
  });
  tx(items);
  logAudit(req.user.email, 'save_domain', domain, { count: items.length });
  res.json({ ok: true, domain, count: items.length });
});

// ── 단일 문서 upsert ──
router.post('/:domain', checkDomain, (req, res) => {
  const item = req.body || {};
  const base = item.id ?? item.no ?? item.email ?? item.mno ?? item.key;
  const id = String(base != null ? base : ('doc-' + Date.now()));
  db.prepare(`INSERT INTO documents (domain, id, data, updated_by, updated_at)
    VALUES (?,?,?,?,datetime('now'))
    ON CONFLICT(domain, id) DO UPDATE SET data=excluded.data, updated_by=excluded.updated_by, updated_at=datetime('now')`)
    .run(req.params.domain, id, JSON.stringify({ ...item, id }), req.user.email);
  logAudit(req.user.email, 'upsert_doc', `${req.params.domain}/${id}`, null);
  res.json({ ok: true, id });
});

// ── 단일 문서 삭제 ──
router.delete('/:domain/:id', checkDomain, (req, res) => {
  db.prepare('DELETE FROM documents WHERE domain = ? AND id = ?').run(req.params.domain, req.params.id);
  logAudit(req.user.email, 'delete_doc', `${req.params.domain}/${req.params.id}`, null);
  res.json({ ok: true });
});

module.exports = router;
