'use strict';
// Phase 5 — 인앱 알림 REST.
const express = require('express');
const notif = require('../notifications');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// 목록: ?unread=1&limit=30
router.get('/', (req, res) => {
  const items = notif.listForUser(req.user.email, {
    unreadOnly: req.query.unread === '1',
    limit: req.query.limit,
  });
  res.json({ ok: true, items, unread: notif.unreadCount(req.user.email) });
});

// 안읽음 개수만
router.get('/count', (req, res) => {
  res.json({ ok: true, unread: notif.unreadCount(req.user.email) });
});

// 단건 읽음
router.post('/:id/read', (req, res) => {
  notif.markRead(Number(req.params.id), req.user.email);
  res.json({ ok: true, unread: notif.unreadCount(req.user.email) });
});

// 전체 읽음
router.post('/read-all', (req, res) => {
  notif.markAllRead(req.user.email);
  res.json({ ok: true, unread: 0 });
});

module.exports = router;
