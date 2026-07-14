'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cfg = require('./config');

const SALT_ROUNDS = 10;

function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), SALT_ROUNDS);
}
function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compareSync(String(plain), hash);
}

function signToken(member) {
  return jwt.sign(
    { email: member.email, name: member.name, isAdmin: !!member.is_admin, isMaster: !!member.is_master },
    cfg.JWT_SECRET,
    { expiresIn: cfg.JWT_EXPIRES }
  );
}
function verifyToken(token) {
  try { return jwt.verify(token, cfg.JWT_SECRET); }
  catch (_) { return null; }
}

// DB row(snake_case) → 프론트엔드 회원 객체(camelCase, index.html 호환).
// 비밀번호는 절대 내보내지 않는다.
function rowToMember(row) {
  if (!row) return null;
  return {
    email: row.email,
    name: row.name,
    ename: row.ename || '',
    pemail: row.pemail || '',
    jumin: '',                       // 서버는 주민번호를 클라이언트로 반환하지 않음
    dept: row.dept || '',
    rank: row.rank || '',
    type: row.type || '',
    tel: row.tel || '',
    date: row.hire_date || '',
    annualLeave: row.annual_leave || 0,
    leaveDate: row.leave_date || '',
    empno: row.empno || '',
    isAdmin: !!row.is_admin,
    isMaster: !!row.is_master,
    isSubMaster: !!row.is_submaster,
    status: row.status || 'pending',
    reqNo: row.req_no || '',
    reqDate: row.req_date || '',
  };
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, rowToMember };
