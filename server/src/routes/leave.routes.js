'use strict';
// Phase 3 — 연차 계산 API (서버 권위 계산).
const express = require('express');
const { db } = require('../db');
const leave = require('../leave');
const { requireAuth } = require('../middleware');

const router = express.Router();
router.use(requireAuth);

// 단건 계산: 입사일 + 연도 → 생성 연차일수.
// body: { hireDate, year }  또는  { email, year }(회원 입사일 사용)
router.post('/calc-annual', (req, res) => {
  const b = req.body || {};
  const year = b.year || new Date().getFullYear();
  let hireDate = b.hireDate;
  if (!hireDate && b.email) {
    const m = db.prepare('SELECT hire_date FROM members WHERE email = ?').get(b.email);
    hireDate = m && m.hire_date;
  }
  const generated = leave.calcAnnualLeave(hireDate, year);
  res.json({ ok: true, year: Number(year), hireDate: hireDate || null, generated });
});

// 특정 회원의 연도별 연차 요약(입사일 기준 생성 + 이월 자동 산출).
// body: { email, fromYear, toYear }
router.post('/summary', (req, res) => {
  const b = req.body || {};
  const email = b.email || req.user.email;
  const m = db.prepare('SELECT hire_date, name FROM members WHERE email = ?').get(email);
  if (!m) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });
  const toYear = Number(b.toYear) || new Date().getFullYear();
  const fromYear = Number(b.fromYear) || (new Date(m.hire_date || Date.now()).getFullYear());
  const years = [];
  let prev = null;
  for (let y = fromYear; y <= toYear; y++) {
    const row = leave.initAnnualForYear(m.hire_date, y, prev);
    years.push(row);
    prev = { generated: row.generated, carried: row.carried, used: 0 };
  }
  res.json({ ok: true, email, name: m.name, years });
});

module.exports = router;
