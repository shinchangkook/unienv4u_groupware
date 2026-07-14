'use strict';
const express = require('express');
const { db, logAudit } = require('../db');
const { hashPassword, verifyPassword, signToken, rowToMember } = require('../auth');
const { requireAuth } = require('../middleware');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── 회원가입 (승인 대기 상태로 생성) ──
router.post('/signup', (req, res) => {
  const b = req.body || {};
  let email = String(b.email || '').trim();
  if (email && !email.includes('@')) email = email + '@unienv4u.com';
  const { name, dept, rank, tel, pw } = b;

  if (!name || !dept || !rank || !tel || !email || !pw) {
    return res.status(400).json({ error: 'invalid', message: '필수 항목을 모두 입력해주세요.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'invalid', message: '이메일 형식이 올바르지 않습니다.' });
  }
  if (String(pw).length < 8) {
    return res.status(400).json({ error: 'invalid', message: '비밀번호는 8자 이상이어야 합니다.' });
  }
  const dup = db.prepare('SELECT email FROM members WHERE email = ?').get(email);
  if (dup) {
    return res.status(409).json({ error: 'duplicate', message: '이미 등록된 이메일입니다.' });
  }

  const reqNo = 'REQ-' + Date.now();
  const reqDate = new Date().toISOString().slice(0, 10);
  db.prepare(`INSERT INTO members
    (email, pw_hash, name, ename, pemail, dept, rank, type, tel, hire_date, status, req_no, req_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    email, hashPassword(pw), name, b.ename || '', b.pemail || '',
    dept, rank, b.type || '', tel, b.date || reqDate, 'pending', reqNo, reqDate
  );
  logAudit(email, 'signup', 'members', { email, name });
  res.status(201).json({ ok: true, message: '가입 신청이 접수되었습니다. 관리자 승인 후 로그인할 수 있습니다.', reqNo });
});

// ── 로그인 ──
router.post('/login', (req, res) => {
  const b = req.body || {};
  let email = String(b.email || b.id || '').trim();
  if (email && !email.includes('@')) email = email + '@unienv4u.com';
  const pw = b.pw || b.password || '';

  if (!email || !pw) {
    return res.status(400).json({ error: 'invalid', message: '아이디와 비밀번호를 입력해주세요.' });
  }
  const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
  // 계정 존재 여부와 무관하게 동일 메시지(계정 열거 방지) — 단, 상태 안내는 예외.
  if (!row || !verifyPassword(pw, row.pw_hash)) {
    return res.status(401).json({ error: 'invalid_credentials', message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
  }
  if (row.status === 'pending') {
    return res.status(403).json({ error: 'pending', message: '가입 승인 대기 중입니다. 관리자의 승인을 기다려주세요.' });
  }
  if (row.status === 'rejected') {
    return res.status(403).json({ error: 'rejected', message: '가입이 거절되었습니다. 관리자에게 문의해주세요.' });
  }
  if (row.status === 'left') {
    return res.status(403).json({ error: 'left', message: '비활성(퇴사) 계정입니다.' });
  }

  const token = signToken(row);
  logAudit(email, 'login', 'members', null);
  res.json({ ok: true, token, user: rowToMember(row) });
});

// ── 내 정보 (토큰 검증 겸용) ──
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: rowToMember(req.user) });
});

// ── 로그아웃 (JWT는 stateless이므로 클라이언트 토큰 폐기로 처리) ──
router.post('/logout', requireAuth, (req, res) => {
  logAudit(req.user.email, 'logout', 'members', null);
  res.json({ ok: true });
});

module.exports = router;
