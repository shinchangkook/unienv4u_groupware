'use strict';
// Phase 4 — 주민번호 등 민감정보 서버측 강암호화(AES-256-GCM).
// index.html 의 btoa() "간단 암호화"(사실상 인코딩)를 대체한다. (uni_build §9)
const crypto = require('node:crypto');
const cfg = require('./config');

// 32바이트 키 확보: JUMIN_KEY(64 hex) 우선, 없으면 JWT_SECRET 에서 scrypt 파생(개발용).
function getKey() {
  const hex = process.env.JUMIN_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, 'hex');
  return crypto.scryptSync(cfg.JWT_SECRET, 'uni-jumin-salt', 32);
}
const KEY = getKey();

// 평문 → "v1:ivB64:tagB64:cipherB64"
function encrypt(plain) {
  if (plain == null || plain === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':');
}

// 암호문 → 평문 (형식 오류/위변조 시 null)
function decrypt(blob) {
  if (!blob) return null;
  const parts = String(blob).split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  try {
    const iv = Buffer.from(parts[1], 'base64');
    const tag = Buffer.from(parts[2], 'base64');
    const data = Buffer.from(parts[3], 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch (_) { return null; }
}

// 주민번호 마스킹: 앞 6자리 + 뒤 1자리만 노출 (예: 900101-1******)
function maskJumin(plain) {
  if (!plain) return '';
  const digits = String(plain).replace(/[^0-9]/g, '');
  if (digits.length < 7) return '******';
  return digits.slice(0, 6) + '-' + digits[6] + '******';
}

module.exports = { encrypt, decrypt, maskJumin };
