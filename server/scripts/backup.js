'use strict';
// SQLite 일관 스냅샷 백업. WAL 모드에서도 안전하게 단일 파일로 복제(VACUUM INTO).
// 사용: node scripts/backup.js [출력디렉터리]   (기본 ./data/backups)
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.join(__dirname, '..');
const DB_FILE = path.resolve(ROOT, process.env.DB_FILE || './data/groupware.db');
const OUT_DIR = path.resolve(ROOT, process.argv[2] || './data/backups');

if (!fs.existsSync(DB_FILE)) {
  console.error('DB 파일 없음:', DB_FILE);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

const d = new Date();
const stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0')
  + '-' + String(d.getHours()).padStart(2, '0') + String(d.getMinutes()).padStart(2, '0') + String(d.getSeconds()).padStart(2, '0');
const outFile = path.join(OUT_DIR, `groupware-${stamp}.db`);

const db = new DatabaseSync(DB_FILE, { readOnly: true });
// VACUUM INTO 는 트랜잭션 일관 스냅샷을 단일 파일로 생성한다.
db.exec(`VACUUM INTO '${outFile.replace(/'/g, "''")}'`);
db.close();

const size = fs.statSync(outFile).size;
console.log(`백업 완료: ${outFile} (${(size / 1024).toFixed(1)} KB)`);

// 첨부파일(uploads)도 함께 보관 권장 — 안내만 출력.
const uploads = path.resolve(ROOT, './data/uploads');
if (fs.existsSync(uploads)) {
  console.log(`참고: 첨부파일 디렉터리도 백업하세요 → ${uploads}`);
}
