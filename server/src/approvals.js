'use strict';
// Phase 4 — 전자결재 워크플로우 (기안 → 결재선 순차 승인/반려).
const { db, transaction, logAudit } = require('./db');
const notif = require('./notifications');

function genId() {
  // 시간 기반 + 카운터로 충돌 방지(스크립트 환경 Date.now 제약 없음: 서버는 사용 가능).
  return 'APR-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36);
}
function genDocNo() {
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const cnt = db.prepare("SELECT COUNT(*) c FROM approvals WHERE doc_no LIKE ?").get('APV-' + ymd + '-%').c;
  return 'APV-' + ymd + '-' + String(cnt + 1).padStart(3, '0');
}

// 결재 문서 생성. approvers = 결재자 email 배열(단계 순서).
function create({ title, type, drafter, content, approvers }) {
  if (!title || !drafter) { const e = new Error('제목과 기안자는 필수입니다.'); e.status = 400; throw e; }
  if (!Array.isArray(approvers) || approvers.length === 0) {
    const e = new Error('결재선(approvers)이 최소 1명 필요합니다.'); e.status = 400; throw e;
  }
  const id = genId();
  const docNo = genDocNo();
  const insA = db.prepare(`INSERT INTO approvals (id, doc_no, title, type, drafter, content, status, cur_step)
    VALUES (?,?,?,?,?,?, 'pending', 1)`);
  const insL = db.prepare(`INSERT INTO approval_lines (approval_id, step, approver, status) VALUES (?,?,?,?)`);
  const tx = transaction(() => {
    insA.run(id, docNo, title, type || '', drafter, typeof content === 'string' ? content : JSON.stringify(content || ''));
    approvers.forEach((email, i) => {
      insL.run(id, i + 1, email, i === 0 ? 'current' : 'waiting');
    });
  });
  tx();
  logAudit(drafter, 'approval_create', id, { docNo, title, approvers });
  // 1차 결재자에게 알림
  notif.create(approvers[0], { type: 'approval_request', title: '새 결재 요청', body: `${title} (${docNo})`, ref: id });
  return get(id);
}

function get(id) {
  const a = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  if (!a) return null;
  a.lines = db.prepare('SELECT step, approver, status, reason, decided_at FROM approval_lines WHERE approval_id = ? ORDER BY step').all(id);
  try { a.content = JSON.parse(a.content); } catch (_) { /* 문자열 그대로 */ }
  return a;
}

// 현재 단계 결재자가 승인/반려. actor 는 요청자 email.
function decide(id, actor, decision, reason, isAdmin) {
  const a = db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
  if (!a) { const e = new Error('결재 문서를 찾을 수 없습니다.'); e.status = 404; throw e; }
  if (a.status !== 'pending') { const e = new Error('이미 종결된 결재입니다.'); e.status = 409; throw e; }

  const line = db.prepare("SELECT * FROM approval_lines WHERE approval_id = ? AND step = ?").get(id, a.cur_step);
  if (!line) { const e = new Error('결재선 오류'); e.status = 500; throw e; }
  if (line.approver !== actor && !isAdmin) {
    const e = new Error('현재 단계의 결재자만 처리할 수 있습니다.'); e.status = 403; throw e;
  }
  if (decision === 'reject' && !reason) { const e = new Error('반려 사유는 필수입니다.'); e.status = 400; throw e; }

  const now = new Date().toISOString();
  const tx = transaction(() => {
    if (decision === 'approve') {
      db.prepare("UPDATE approval_lines SET status='approved', reason=?, decided_at=? WHERE id=?").run(reason || '', now, line.id);
      const next = db.prepare("SELECT * FROM approval_lines WHERE approval_id=? AND step=?").get(id, a.cur_step + 1);
      if (next) {
        db.prepare("UPDATE approval_lines SET status='current' WHERE id=?").run(next.id);
        db.prepare("UPDATE approvals SET cur_step=? WHERE id=?").run(a.cur_step + 1, id);
      } else {
        db.prepare("UPDATE approvals SET status='approved', decided_at=? WHERE id=?").run(now, id);
      }
    } else {
      db.prepare("UPDATE approval_lines SET status='rejected', reason=?, decided_at=? WHERE id=?").run(reason || '', now, line.id);
      db.prepare("UPDATE approvals SET status='rejected', decided_at=? WHERE id=?").run(now, id);
    }
  });
  tx();
  logAudit(actor, decision === 'approve' ? 'approval_approve' : 'approval_reject', id, { step: a.cur_step, reason: reason || '' });
  // 알림: 승인 시 다음 결재자(또는 최종 승인 시 기안자), 반려 시 기안자
  const fresh = get(id);
  if (decision === 'approve') {
    if (fresh.status === 'approved') {
      notif.create(a.drafter, { type: 'approval_approved', title: '결재 최종 승인', body: `${a.title} (${a.doc_no})`, ref: id });
    } else {
      const nextLine = fresh.lines.find(l => l.step === fresh.cur_step);
      if (nextLine) notif.create(nextLine.approver, { type: 'approval_request', title: '새 결재 요청', body: `${a.title} (${a.doc_no})`, ref: id });
    }
  } else {
    notif.create(a.drafter, { type: 'approval_rejected', title: '결재 반려', body: `${a.title} — 사유: ${reason || ''}`, ref: id });
  }
  return fresh;
}

// 내 결재함(현재 내가 결재할 차례) / 기안함(내가 올린 문서).
function inbox(email) {
  const rows = db.prepare(`SELECT a.* FROM approvals a
    JOIN approval_lines l ON l.approval_id = a.id
    WHERE a.status='pending' AND l.step = a.cur_step AND l.approver = ?
    ORDER BY a.created_at DESC`).all(email);
  return rows.map(r => get(r.id));
}
function outbox(email) {
  const rows = db.prepare("SELECT id FROM approvals WHERE drafter = ? ORDER BY created_at DESC").all(email);
  return rows.map(r => get(r.id));
}
function list() {
  const rows = db.prepare('SELECT id FROM approvals ORDER BY created_at DESC').all();
  return rows.map(r => get(r.id));
}

module.exports = { create, get, decide, inbox, outbox, list };
