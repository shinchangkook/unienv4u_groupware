'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const cfg = require('./config');

// 데이터 디렉터리 보장
fs.mkdirSync(path.dirname(cfg.DB_FILE), { recursive: true });

const db = new DatabaseSync(cfg.DB_FILE);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// ── 스키마 ──────────────────────────────────────────────
// members: 프론트엔드 회원 객체 필드를 최대한 그대로 보존(로컬 미러링 호환).
//          단 비밀번호는 평문(pw) 대신 pw_hash 로만 저장한다.
db.exec(`
CREATE TABLE IF NOT EXISTS members (
  email        TEXT PRIMARY KEY,
  pw_hash      TEXT NOT NULL,
  name         TEXT NOT NULL,
  ename        TEXT DEFAULT '',
  pemail       TEXT DEFAULT '',
  jumin_enc    TEXT DEFAULT '',        -- 주민번호: 서버 AES 암호화 자리(현재 미수집 권장)
  dept         TEXT DEFAULT '',
  rank         TEXT DEFAULT '',
  type         TEXT DEFAULT '',
  tel          TEXT DEFAULT '',
  hire_date    TEXT DEFAULT '',
  annual_leave INTEGER DEFAULT 0,
  leave_date   TEXT DEFAULT '',
  empno        TEXT DEFAULT '',
  is_admin     INTEGER DEFAULT 0,
  is_master    INTEGER DEFAULT 0,
  is_submaster INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'pending', -- pending / approved / rejected / left
  req_no       TEXT DEFAULT '',
  req_date     TEXT DEFAULT '',
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- 범용 문서 저장소: 나머지 10개 localStorage 도메인을 도메인/ID 단위로 보관.
-- Phase 2 에서 도메인별 정식 테이블로 승격하기 전, 어댑터가 즉시 서버 동기화되도록 하는 계층.
CREATE TABLE IF NOT EXISTS documents (
  domain     TEXT NOT NULL,           -- clients, ctu, billing, env, leaves, ...
  id         TEXT NOT NULL,           -- 도메인 내 고유 키
  data       TEXT NOT NULL,           -- JSON 문자열
  updated_by TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (domain, id)
);

-- 키-값 저장소: 배열이 아닌 객체형 도메인(det_mno, lv_settings 등)용.
CREATE TABLE IF NOT EXISTS kv_store (
  key        TEXT PRIMARY KEY,
  data       TEXT NOT NULL,           -- JSON (객체/배열 무관)
  updated_by TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 전자결재 문서 (Phase 4)
CREATE TABLE IF NOT EXISTS approvals (
  id         TEXT PRIMARY KEY,
  doc_no     TEXT,
  title      TEXT NOT NULL,
  type       TEXT DEFAULT '',        -- 휴가/지출/구매/일반...
  drafter    TEXT NOT NULL,          -- 기안자 email
  content    TEXT DEFAULT '',        -- 본문(JSON 문자열 허용)
  status     TEXT DEFAULT 'pending', -- pending / approved / rejected
  cur_step   INTEGER DEFAULT 1,      -- 현재 결재 단계
  created_at TEXT DEFAULT (datetime('now')),
  decided_at TEXT DEFAULT ''
);

-- 전자결재 결재선 (단계별 결재자)
CREATE TABLE IF NOT EXISTS approval_lines (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  approval_id TEXT NOT NULL,
  step        INTEGER NOT NULL,
  approver    TEXT NOT NULL,          -- 결재자 email
  status      TEXT DEFAULT 'waiting', -- waiting / current / approved / rejected
  reason      TEXT DEFAULT '',
  decided_at  TEXT DEFAULT ''
);

-- 첨부파일 (Phase 4) — 파일 본체는 data/uploads/ 에 저장, 메타만 DB.
CREATE TABLE IF NOT EXISTS attachments (
  id          TEXT PRIMARY KEY,
  domain      TEXT DEFAULT '',        -- env / approval / ...
  target_id   TEXT DEFAULT '',        -- 연결 대상(성적서 id 등)
  filename    TEXT NOT NULL,
  mime        TEXT DEFAULT '',
  size        INTEGER DEFAULT 0,
  path        TEXT NOT NULL,
  uploaded_by TEXT DEFAULT '',
  created_at  TEXT DEFAULT (datetime('now'))
);

-- 인앱 알림 (Phase 5)
CREATE TABLE IF NOT EXISTS notifications (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient  TEXT NOT NULL,          -- 수신자 email
  type       TEXT DEFAULT '',        -- approval_request / approval_approved / approval_rejected ...
  title      TEXT DEFAULT '',
  body       TEXT DEFAULT '',
  ref        TEXT DEFAULT '',        -- 관련 문서 id
  is_read    INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notif_recipient ON notifications(recipient, is_read);

-- 감사 로그
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  actor      TEXT DEFAULT '',
  action     TEXT NOT NULL,
  target     TEXT DEFAULT '',
  detail     TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// node:sqlite 은 better-sqlite3 의 db.transaction() 을 제공하지 않으므로
// BEGIN/COMMIT/ROLLBACK 로 감싸는 헬퍼를 직접 만든다.
function transaction(fn) {
  return function (...args) {
    db.exec('BEGIN');
    try {
      const result = fn(...args);
      db.exec('COMMIT');
      return result;
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
  };
}

function logAudit(actor, action, target, detail) {
  try {
    db.prepare('INSERT INTO audit_logs (actor, action, target, detail) VALUES (?,?,?,?)')
      .run(actor || '', action, target || '', detail ? JSON.stringify(detail) : '');
  } catch (_) { /* 감사 로그 실패는 요청을 막지 않음 */ }
}

module.exports = { db, logAudit, transaction };
