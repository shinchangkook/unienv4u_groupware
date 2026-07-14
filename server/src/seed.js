'use strict';
// index.html 의 INIT_MEMBERS 를 서버 DB로 이관하는 초기 시드.
// 평문 pw 는 즉시 bcrypt 해시로 변환하여 저장한다(평문은 DB에 남기지 않음).
const { db, logAudit, transaction } = require('./db');
const { hashPassword } = require('./auth');

const INIT_MEMBERS = [
  { email: 'admin@unienv4u.com', pw: 'admin1234', name: '신창국', ename: 'Shin Chang-guk', dept: '경영지원팀', rank: '대표이사', type: '정규직', tel: '010-0000-0000', date: '2015-03-02', annualLeave: 15, empno: 'EMP-000', isAdmin: true, isMaster: true, status: 'approved' },
  { email: 'choi@unienv4u.com', pw: 'choi12345', name: '최병효', ename: 'Choi Byeong-hyo', dept: '측정조사팀', rank: '이사', type: '정규직', tel: '010-1111-2222', date: '2016-05-10', annualLeave: 21, empno: 'EMP-001', isAdmin: false, isMaster: false, status: 'approved', isSubMaster: true },
  { email: 'jo@unienv4u.com', pw: 'jo123456', name: '조현석', ename: 'Jo Hyeon-seok', dept: '측정조사팀', rank: '팀장', type: '정규직', tel: '010-2222-3333', date: '2018-02-01', annualLeave: 19, empno: 'EMP-002', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'kim@unienv4u.com', pw: 'kim12345', name: '김환경', ename: 'Kim Hwan-gyeong', dept: '측정조사팀', rank: '과장', type: '정규직', tel: '010-3333-4444', date: '2019-03-04', annualLeave: 17, empno: 'EMP-003', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'lee@unienv4u.com', pw: 'lee12345', name: '이수질', ename: 'Lee Su-jil', dept: '실험실', rank: '팀장', type: '정규직', tel: '010-4444-5555', date: '2018-07-16', annualLeave: 19, empno: 'EMP-004', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'park@unienv4u.com', pw: 'park12345', name: '박대기', ename: 'Park Dae-gi', dept: '실험실', rank: '대리', type: '정규직', tel: '010-5555-6666', date: '2021-01-04', annualLeave: 14, empno: 'EMP-005', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'hong@unienv4u.com', pw: 'hong1234', name: '홍길동', ename: 'Hong Gil-dong', pemail: 'hong@gmail.com', dept: '측정조사팀', rank: '대리', type: '정규직', tel: '010-6666-7777', date: '2022-03-07', annualLeave: 13, empno: 'EMP-006', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'jung@unienv4u.com', pw: 'jung1234', name: '정소음', ename: 'Jung So-eum', dept: '소음진동팀', rank: '과장', type: '정규직', tel: '010-7777-8888', date: '2020-05-11', annualLeave: 16, empno: 'EMP-007', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'yoon@unienv4u.com', pw: 'yoon1234', name: '윤토양', ename: 'Yoon To-yang', dept: '소음진동팀', rank: '사원', type: '정규직', tel: '010-8888-9999', date: '2024-01-02', annualLeave: 11, empno: 'EMP-008', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'han@unienv4u.com', pw: 'han12345', name: '한경영', ename: 'Han Gyeong-yeong', dept: '경영지원팀', rank: '과장', type: '정규직', tel: '010-9999-0000', date: '2020-08-03', annualLeave: 16, empno: 'EMP-009', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'lim@unienv4u.com', pw: 'lim12345', name: '임계약', ename: 'Lim Gye-yak', dept: '측정조사팀', rank: '사원', type: '계약직', tel: '010-1234-5678', date: '2025-03-03', annualLeave: 10, empno: 'EMP-010', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'new@unienv4u.com', pw: 'new12345', name: '신입사원', ename: 'New Employee', dept: '실험실', rank: '사원', type: '정규직', tel: '010-0001-0002', date: '2026-03-02', annualLeave: 11, empno: 'EMP-011', isAdmin: false, isMaster: false, status: 'pending', reqDate: '2026-06-01' },
];

function seed() {
  const existing = db.prepare('SELECT COUNT(*) c FROM members').get().c;
  if (existing > 0) {
    return { seeded: false, count: existing };
  }
  const stmt = db.prepare(`INSERT INTO members
    (email, pw_hash, name, ename, pemail, dept, rank, type, tel, hire_date,
     annual_leave, leave_date, empno, is_admin, is_master, is_submaster, status, req_no, req_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const tx = transaction((rows) => {
    for (const m of rows) {
      stmt.run(
        m.email, hashPassword(m.pw), m.name, m.ename || '', m.pemail || '',
        m.dept || '', m.rank || '', m.type || '', m.tel || '', m.date || '',
        m.annualLeave || 0, m.leaveDate || '', m.empno || '',
        m.isAdmin ? 1 : 0, m.isMaster ? 1 : 0, m.isSubMaster ? 1 : 0,
        m.status || 'pending', m.reqNo || '', m.reqDate || ''
      );
    }
  });
  tx(INIT_MEMBERS);
  logAudit('system', 'seed', 'members', { count: INIT_MEMBERS.length });
  return { seeded: true, count: INIT_MEMBERS.length };
}

module.exports = { seed, INIT_MEMBERS };

// 단독 실행 지원: `npm run seed`
if (require.main === module) {
  const r = seed();
  console.log(r.seeded ? `시드 완료: ${r.count}명 등록` : `이미 ${r.count}명 존재 — 시드 건너뜀`);
}
