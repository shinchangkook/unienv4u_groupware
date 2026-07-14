'use strict';
const { verifyToken } = require('./auth');
const { db } = require('./db');

// Authorization: Bearer <token> 헤더를 검증하고 req.user 에 최신 회원 정보를 채운다.
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'unauthorized', message: '인증이 필요합니다.' });

  // 토큰은 유효하지만 계정 상태가 바뀌었을 수 있으므로 DB에서 재확인.
  const row = db.prepare('SELECT * FROM members WHERE email = ?').get(payload.email);
  if (!row) return res.status(401).json({ error: 'unauthorized', message: '존재하지 않는 계정입니다.' });
  if (row.status !== 'approved') return res.status(403).json({ error: 'forbidden', message: '승인되지 않은 계정입니다.' });

  req.user = row;
  next();
}

// 마스터(관리자)만 허용.
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'forbidden', message: '관리자 권한이 필요합니다.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
