'use strict';
// Phase 2 — 모델링된 업무 도메인 REST (clients, contracts, billings, env).
const express = require('express');
const { logAudit } = require('../db');
const domains = require('../domains');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

function checkDomain(req, res, next) {
  if (!domains.isModeled(req.params.domain)) {
    return res.status(404).json({ error: 'unknown_domain', message: '알 수 없는 도메인입니다.' });
  }
  next();
}

// 목록 조회
router.get('/:domain', checkDomain, (req, res) => {
  res.json({ ok: true, domain: req.params.domain, items: domains.list(req.params.domain) });
});

// 배열 전체 교체 (프론트 미러링에서 사용)
router.put('/:domain', checkDomain, (req, res) => {
  const items = Array.isArray(req.body) ? req.body : (req.body && req.body.items);
  try {
    const count = domains.replaceAll(req.params.domain, items, req.user.email);
    logAudit(req.user.email, 'domain_replace', req.params.domain, { count });
    res.json({ ok: true, domain: req.params.domain, count });
  } catch (e) {
    res.status(e.status || 400).json({ error: 'invalid', message: '저장 실패: ' + e.message });
  }
});

// 단일 upsert
router.post('/:domain', checkDomain, (req, res) => {
  try {
    const id = domains.upsert(req.params.domain, req.body || {}, req.user.email);
    logAudit(req.user.email, 'domain_upsert', `${req.params.domain}/${id}`, null);
    res.json({ ok: true, id });
  } catch (e) {
    res.status(e.status || 400).json({ error: 'invalid', message: '저장 실패: ' + e.message });
  }
});

// 단일 삭제
router.delete('/:domain/:id', checkDomain, (req, res) => {
  domains.remove(req.params.domain, req.params.id);
  logAudit(req.user.email, 'domain_delete', `${req.params.domain}/${req.params.id}`, null);
  res.json({ ok: true });
});

module.exports = router;
