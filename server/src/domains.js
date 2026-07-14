'use strict';
// Phase 2 — 핵심 업무 도메인을 모델링된 전용 테이블로 승격.
// 각 도메인은 (검색용 핵심 컬럼 + 전체 객체 payload) 구조로 저장하여
// 서버 검증/조회는 컬럼으로, 프론트 왕복은 payload 로 무손실 처리한다.
const { db, transaction } = require('./db');

// 프론트엔드 localStorage 키 ↔ API 도메인 매핑은 프론트(uni-store.js)에서 담당.
// 여기서는 API 도메인 이름을 기준으로 정의한다.
const REGISTRY = {
  clients: {
    table: 'dom_clients',
    idField: 'no',
    columns: [
      { col: 'code', field: 'code' },
      { col: 'name', field: 'name', required: true },
      { col: 'bizno', field: 'bizno' },
    ],
  },
  contracts: { // 프론트 uni_ctu (사용자 추가 계약)
    table: 'dom_contracts',
    idField: 'ctno',
    columns: [
      { col: 'client', field: 'client' },
      { col: 'name', field: 'name', required: true },
      { col: 'status', field: 'status' },
    ],
  },
  billings: { // 프론트 uni_billing
    table: 'dom_billings',
    idField: 'billNo',
    columns: [
      { col: 'ctno', field: 'ctno', required: true },
      { col: 'client', field: 'client' },
      { col: 'amount', field: 'amount' },
      { col: 'bill_date', field: 'billDate' },
      { col: 'status', field: 'status' },
    ],
  },
  env: { // 프론트 uni_env (성적서, pays/trips 는 payload 내부)
    table: 'dom_env',
    idField: 'id',
    columns: [
      { col: 'manage_no', field: 'manageNo' },
      { col: 'year', field: 'year' },
      { col: 'client', field: 'client' },
      { col: 'contract', field: 'contract' },
      { col: 'status', field: 'status' },
    ],
  },
};

function isModeled(domain) { return Object.prototype.hasOwnProperty.call(REGISTRY, domain); }

// 레지스트리에 따라 테이블 생성.
function createTables() {
  for (const key of Object.keys(REGISTRY)) {
    const d = REGISTRY[key];
    const cols = d.columns.map(c => `${c.col} TEXT`).join(',\n  ');
    db.exec(`CREATE TABLE IF NOT EXISTS ${d.table} (
  id TEXT PRIMARY KEY,
  ${cols},
  data TEXT NOT NULL,
  updated_by TEXT DEFAULT '',
  updated_at TEXT DEFAULT (datetime('now'))
);`);
  }
}

// 항목 검증 → { id } 또는 에러 throw.
function validateItem(domain, item, index) {
  const d = REGISTRY[domain];
  const where = (index != null) ? `[${index}]` : '';
  if (!item || typeof item !== 'object') throw new Error(`${where} 객체가 아닙니다.`);
  const id = item[d.idField];
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error(`${where} 필수 식별자 '${d.idField}' 가 없습니다.`);
  }
  for (const c of d.columns) {
    if (c.required && (item[c.field] === undefined || item[c.field] === null || String(item[c.field]).trim() === '')) {
      throw new Error(`${where} 필수 항목 '${c.field}' 가 비어 있습니다.`);
    }
  }
  return String(id);
}

function colValues(domain, item) {
  return REGISTRY[domain].columns.map(c => {
    const v = item[c.field];
    return v === undefined || v === null ? '' : String(v);
  });
}

function list(domain) {
  const d = REGISTRY[domain];
  const rows = db.prepare(`SELECT data FROM ${d.table} ORDER BY id`).all();
  return rows.map(r => { try { return JSON.parse(r.data); } catch (_) { return null; } }).filter(Boolean);
}

// 배열 전체 교체 (프론트 setItem 미러링에 대응). 검증 실패 시 전체 롤백.
function replaceAll(domain, items, user) {
  const d = REGISTRY[domain];
  if (!Array.isArray(items)) throw Object.assign(new Error('배열이 필요합니다.'), { status: 400 });
  // 사전 검증
  const ids = items.map((it, i) => validateItem(domain, it, i));
  const colNames = d.columns.map(c => c.col);
  const placeholders = ['?', ...colNames.map(() => '?'), '?', '?'].join(',');
  const insSql = `INSERT INTO ${d.table} (id, ${colNames.join(', ')}, data, updated_by) VALUES (${placeholders})`;
  const ins = db.prepare(insSql);
  const del = db.prepare(`DELETE FROM ${d.table}`);
  const tx = transaction(() => {
    del.run();
    items.forEach((item, i) => {
      ins.run(ids[i], ...colValues(domain, item), JSON.stringify(item), user || '');
    });
  });
  tx();
  return items.length;
}

// 단일 upsert.
function upsert(domain, item, user) {
  const d = REGISTRY[domain];
  const id = validateItem(domain, item);
  const colNames = d.columns.map(c => c.col);
  const setCols = colNames.map(c => `${c}=excluded.${c}`).concat('data=excluded.data', 'updated_by=excluded.updated_by', "updated_at=datetime('now')").join(', ');
  const placeholders = ['?', ...colNames.map(() => '?'), '?', '?'].join(',');
  db.prepare(`INSERT INTO ${d.table} (id, ${colNames.join(', ')}, data, updated_by) VALUES (${placeholders})
    ON CONFLICT(id) DO UPDATE SET ${setCols}`)
    .run(id, ...colValues(domain, item), JSON.stringify(item), user || '');
  return id;
}

function remove(domain, id) {
  const d = REGISTRY[domain];
  db.prepare(`DELETE FROM ${d.table} WHERE id = ?`).run(String(id));
}

module.exports = { REGISTRY, isModeled, createTables, list, replaceAll, upsert, remove, validateItem };
