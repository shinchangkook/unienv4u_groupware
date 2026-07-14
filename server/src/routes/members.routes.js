'use strict';
const express = require('express');
const { db, logAudit } = require('../db');
const { rowToMember, hashPassword } = require('../auth');
const { requireAuth, requireAdmin } = require('../middleware');
const { encrypt, decrypt, maskJumin } = require('../crypto');

const router = express.Router();

// 모든 회원 라우트는 로그인 필요.
router.use(requireAuth);

// ── 주민번호 저장 (AES-256-GCM 암호화) — 본인 또는 관리자 ──
router.put('/:email/jumin', (req, res) => {
  const email = req.params.email;
  if (req.user.email !== email && !req.user.is_admin) {
    return res.status(403).json({ error: 'forbidden', message: '권한이 없습니다.' });
  }
  const row = db.prepare('SELECT email FROM members WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });
  const jumin = String(req.body && req.body.jumin || '').trim();
  const enc = jumin ? encrypt(jumin) : '';
  db.prepare("UPDATE members SET jumin_enc=?, updated_at=datetime('now') WHERE email=?").run(enc, email);
  logAudit(req.user.email, 'set_jumin', email, null); // 값은 로그에 남기지 않음
  res.json({ ok: true, masked: maskJumin(jumin) });
});

// ── 주민번호 조회 (마스킹) — 본인 또는 관리자, 접근 감사 기록 ──
router.get('/:email/jumin', (req, res) => {
  const email = req.params.email;
  if (req.user.email !== email && !req.user.is_admin) {
    return res.status(403).json({ error: 'forbidden', message: '권한이 없습니다.' });
  }
  const row = db.prepare('SELECT jumin_enc FROM members WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });
  const plain = decrypt(row.jumin_enc);
  logAudit(req.user.email, 'view_jumin', email, null); // 개인정보 접근 감사
  res.json({ ok: true, masked: plain ? maskJumin(plain) : '', hasValue: !!plain });
});

// ── 회원 목록 ──
// 일반 사용자: 승인된 회원만. 관리자: 전체(대기/거절 포함).
router.get('/', (req, res) => {
  const rows = req.user.is_admin
    ? db.prepare('SELECT * FROM members ORDER BY empno').all()
    : db.prepare("SELECT * FROM members WHERE status = 'approved' ORDER BY empno").all();
  res.json({ ok: true, members: rows.map(rowToMember) });
});

// ── 승인 대기 목록 (관리자) ──
router.get('/pending', requireAdmin, (req, res) => {
  const rows = db.prepare("SELECT * FROM members WHERE status = 'pending' ORDER BY req_date").all();
  res.json({ ok: true, members: rows.map(rowToMember) });
});

// ── 가입 승인 (관리자) ──
router.post('/:email/approve', requireAdmin, (req, res) => {
  const email = req.params.email;
  const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });

  // 사번 자동 부여(비어 있으면).
  let empno = row.empno;
  if (!empno) {
    const max = db.prepare("SELECT empno FROM members WHERE empno LIKE 'EMP-%' ORDER BY empno DESC").get();
    const n = max && max.empno ? parseInt(max.empno.slice(4), 10) + 1 : 1;
    empno = 'EMP-' + String(n).padStart(3, '0');
  }
  db.prepare("UPDATE members SET status='approved', empno=?, updated_at=datetime('now') WHERE email=?")
    .run(empno, email);
  logAudit(req.user.email, 'approve_member', email, { empno });
  res.json({ ok: true, member: rowToMember(db.prepare('SELECT * FROM members WHERE email=?').get(email)) });
});

// ── 가입 거절 (관리자) ──
router.post('/:email/reject', requireAdmin, (req, res) => {
  const email = req.params.email;
  const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });
  db.prepare("UPDATE members SET status='rejected', updated_at=datetime('now') WHERE email=?").run(email);
  logAudit(req.user.email, 'reject_member', email, null);
  res.json({ ok: true });
});

// ── 회원 정보 수정 ──
// 본인은 일부 필드, 관리자는 전체 필드 수정 가능.
const SELF_FIELDS = ['name', 'ename', 'pemail', 'tel'];
const ADMIN_FIELDS = ['name', 'ename', 'pemail', 'tel', 'dept', 'rank', 'type',
  'annualLeave', 'leaveDate', 'empno', 'isAdmin', 'isMaster', 'isSubMaster', 'status'];
const COL = {
  name: 'name', ename: 'ename', pemail: 'pemail', tel: 'tel', dept: 'dept', rank: 'rank',
  type: 'type', annualLeave: 'annual_leave', leaveDate: 'leave_date', empno: 'empno',
  isAdmin: 'is_admin', isMaster: 'is_master', isSubMaster: 'is_submaster', status: 'status',
};

router.patch('/:email', (req, res) => {
  const email = req.params.email;
  const isSelf = req.user.email === email;
  if (!isSelf && !req.user.is_admin) {
    return res.status(403).json({ error: 'forbidden', message: '수정 권한이 없습니다.' });
  }
  const row = db.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!row) return res.status(404).json({ error: 'not_found', message: '회원을 찾을 수 없습니다.' });

  const allowed = req.user.is_admin ? ADMIN_FIELDS : SELF_FIELDS;
  const sets = [];
  const vals = [];
  for (const key of allowed) {
    if (req.body[key] === undefined) continue;
    let v = req.body[key];
    if (['isAdmin', 'isMaster', 'isSubMaster'].includes(key)) v = v ? 1 : 0;
    sets.push(`${COL[key]} = ?`);
    vals.push(v);
  }
  // 비밀번호 변경(본인/관리자)
  if (req.body.pw) {
    if (String(req.body.pw).length < 8) {
      return res.status(400).json({ error: 'invalid', message: '비밀번호는 8자 이상이어야 합니다.' });
    }
    sets.push('pw_hash = ?');
    vals.push(hashPassword(req.body.pw));
  }
  if (!sets.length) return res.status(400).json({ error: 'invalid', message: '변경할 항목이 없습니다.' });

  sets.push("updated_at = datetime('now')");
  vals.push(email);
  db.prepare(`UPDATE members SET ${sets.join(', ')} WHERE email = ?`).run(...vals);
  logAudit(req.user.email, 'update_member', email, { fields: sets });
  res.json({ ok: true, member: rowToMember(db.prepare('SELECT * FROM members WHERE email=?').get(email)) });
});

module.exports = router;
