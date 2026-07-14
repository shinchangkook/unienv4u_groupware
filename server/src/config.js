'use strict';
// 아주 가벼운 .env 로더 (외부 의존성 없이 동작).
const fs = require('node:fs');
const path = require('node:path');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const ROOT = path.join(__dirname, '..');
module.exports = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '12h',
  DB_FILE: path.resolve(ROOT, process.env.DB_FILE || './data/groupware.db'),
  SERVE_FRONTEND: (process.env.SERVE_FRONTEND || 'true') !== 'false',
  CORS_ORIGIN: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  // 프로젝트 루트(index.html 위치): server/ 의 상위 디렉터리
  FRONTEND_DIR: path.resolve(ROOT, '..'),
};
