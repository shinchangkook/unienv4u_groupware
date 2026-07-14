'use strict';
// Phase 4 — 전자결재 REST.
const express = require('express');
const approvals = require('../approvals');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// 목록: ?box=inbox|outbox|all (기본 all)
router.get('/', (req, res) => {
  const box = req.query.box || 'all';
  let items;
  if (box === 'inbox') items = approvals.inbox(req.user.email);
  else if (box === 'outbox') items = approvals.outbox(req.user.email);
  else items = approvals.list();
  res.json({ ok: true, box, items });
});

// 단건 조회
router.get('/:id', (req, res) => {
  const a = approvals.get(req.params.id);
  if (!a) return res.status(404).json({ error: 'not_found', message: '결재 문서를 찾을 수 없습니다.' });
  res.json({ ok: true, approval: a });
});

// 기안(생성). 기안자는 항상 로그인 사용자.
router.post('/', (req, res) => {
  try {
    const a = approvals.create({
      title: req.body.title,
      type: req.body.type,
      content: req.body.content,
      approvers: req.body.approvers,
      drafter: req.user.email,
    });
    res.status(201).json({ ok: true, approval: a });
  } catch (e) {
    res.status(e.status || 400).json({ error: 'invalid', message: e.message });
  }
});

// 승인 / 반려
router.post('/:id/approve', (req, res) => decide(req, res, 'approve'));
router.post('/:id/reject', (req, res) => decide(req, res, 'reject'));

function decide(req, res, decision) {
  try {
    const a = approvals.decide(req.params.id, req.user.email, decision, req.body && req.body.reason, !!req.user.is_admin);
    res.json({ ok: true, approval: a });
  } catch (e) {
    res.status(e.status || 400).json({ error: 'invalid', message: e.message });
  }
}

module.exports = router;
