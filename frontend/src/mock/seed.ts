// 시드 데이터 — spec §3.3 INIT_MEMBERS 및 각 도메인 샘플
import type {
  Member, Notice, Approval, CalendarEvent, WorkLog, HrOrder, Leave,
  Client, Contract, Billing, EnvReport, Incident, Equipment,
} from '../types'

export const MEMBERS: Member[] = [
  { email: 'admin@unienv4u.com', pw: 'admin1234', name: '신창국', ename: 'Shin Chang-guk', pemail: '', jumin: '******-*******', dept: '경영지원팀', rank: '대표이사', type: '정규직', tel: '010-0000-0000', date: '2015-03-02', annualLeave: 25, leaveDate: '', empno: 'EMP-000', isAdmin: true, isMaster: true, status: 'approved' },
  { email: 'choi@unienv4u.com', pw: 'choi12345', name: '최병효', ename: 'Choi Byeong-hyo', pemail: '', jumin: '******-*******', dept: '측정조사팀', rank: '이사', type: '정규직', tel: '010-1111-2222', date: '2016-05-10', annualLeave: 21, leaveDate: '', empno: 'EMP-001', isAdmin: false, isMaster: false, isSubMaster: true, status: 'approved' },
  { email: 'jo@unienv4u.com', pw: 'jo123456', name: '조현석', ename: 'Jo Hyeon-seok', pemail: '', jumin: '******-*******', dept: '측정조사팀', rank: '팀장', type: '정규직', tel: '010-2222-3333', date: '2018-02-01', annualLeave: 19, leaveDate: '', empno: 'EMP-002', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'kim@unienv4u.com', pw: 'kim12345', name: '김환경', ename: 'Kim Hwan-gyeong', pemail: '', jumin: '******-*******', dept: '측정조사팀', rank: '과장', type: '정규직', tel: '010-3333-4444', date: '2019-03-04', annualLeave: 17, leaveDate: '', empno: 'EMP-003', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'lee@unienv4u.com', pw: 'lee12345', name: '이수질', ename: 'Lee Su-jil', pemail: '', jumin: '******-*******', dept: '실험실', rank: '팀장', type: '정규직', tel: '010-4444-5555', date: '2018-07-16', annualLeave: 19, leaveDate: '', empno: 'EMP-004', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'park@unienv4u.com', pw: 'park12345', name: '박대기', ename: 'Park Dae-gi', pemail: '', jumin: '******-*******', dept: '실험실', rank: '대리', type: '정규직', tel: '010-5555-6666', date: '2021-01-04', annualLeave: 14, leaveDate: '', empno: 'EMP-005', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'hong@unienv4u.com', pw: 'hong1234', name: '홍길동', ename: 'Hong Gil-dong', pemail: 'hong@gmail.com', jumin: '******-*******', dept: '측정조사팀', rank: '대리', type: '정규직', tel: '010-6666-7777', date: '2022-03-07', annualLeave: 13, leaveDate: '', empno: 'EMP-006', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'jung@unienv4u.com', pw: 'jung1234', name: '정소음', ename: 'Jung So-eum', pemail: '', jumin: '******-*******', dept: '소음진동팀', rank: '과장', type: '정규직', tel: '010-7777-8888', date: '2020-05-11', annualLeave: 16, leaveDate: '', empno: 'EMP-007', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'yoon@unienv4u.com', pw: 'yoon1234', name: '윤토양', ename: 'Yoon To-yang', pemail: '', jumin: '******-*******', dept: '소음진동팀', rank: '사원', type: '정규직', tel: '010-8888-9999', date: '2024-01-02', annualLeave: 11, leaveDate: '', empno: 'EMP-008', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'han@unienv4u.com', pw: 'han12345', name: '한경영', ename: 'Han Gyeong-yeong', pemail: '', jumin: '******-*******', dept: '경영지원팀', rank: '과장', type: '정규직', tel: '010-9999-0000', date: '2020-08-03', annualLeave: 16, leaveDate: '', empno: 'EMP-009', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'lim@unienv4u.com', pw: 'lim12345', name: '임계약', ename: 'Lim Gye-yak', pemail: '', jumin: '******-*******', dept: '측정조사팀', rank: '사원', type: '계약직', tel: '010-1234-5678', date: '2025-03-03', annualLeave: 10, leaveDate: '', empno: 'EMP-010', isAdmin: false, isMaster: false, status: 'approved' },
  { email: 'new@unienv4u.com', pw: 'new12345', name: '신입사원', ename: 'New Employee', pemail: '', jumin: '******-*******', dept: '실험실', rank: '사원', type: '정규직', tel: '010-0001-0002', date: '2026-03-02', annualLeave: 11, leaveDate: '', empno: 'EMP-011', isAdmin: false, isMaster: false, status: 'pending', reqNo: 'REQ-1748736000000', reqDate: '2026-06-01' },
]

export const NOTICES: Notice[] = [
  { id: 'N-001', category: '공지', title: '2026년 하계 휴가 신청 안내', author: '한경영', date: '2026-06-20', views: 87, comments: 3, body: '하계 휴가 신청은 7월 5일까지 휴가관리 메뉴에서 접수 바랍니다.' },
  { id: 'N-002', category: '공지', title: '측정장비 정기 교정 일정 공지', author: '이수질', date: '2026-06-18', views: 54, comments: 1, body: '수질/대기 측정장비 정기 교정이 7월 2주차에 진행됩니다.' },
  { id: 'N-003', category: '자유', title: '하반기 팀 회식 날짜 투표', author: '홍길동', date: '2026-06-16', views: 24, comments: 8, body: '회식 날짜 투표 부탁드립니다.' },
]

export const APPROVALS: Approval[] = [
  { id: 'APP-2026-018', title: '6월 출장비 정산 신청', drafter: '홍길동', date: '2026-06-17', status: '검토중', type: '지출결의' },
  { id: 'APP-2026-017', title: '소음측정 장비 구매 요청', drafter: '정소음', date: '2026-06-15', status: '승인', type: '구매요청' },
  { id: 'APP-2026-016', title: '외부 교육 참가 신청', drafter: '박대기', date: '2026-06-12', status: '반려', type: '교육신청', reason: '예산 초과로 반려' },
]

export const EVENTS: CalendarEvent[] = [
  { id: 'C-1', date: '2026-07-03', title: '△△공단 대기측정 출장', type: '출장', owner: '김환경' },
  { id: 'C-2', date: '2026-07-08', title: '월간 경영회의', type: '회의', owner: '신창국' },
  { id: 'C-3', date: '2026-07-15', title: '홍길동 연차', type: '휴가', owner: '홍길동' },
  { id: 'C-4', date: '2026-07-22', title: '수질 시료 채취 (인천)', type: '출장', owner: '이수질' },
]

export const WORKLOGS: WorkLog[] = [
  { id: 'W-1', date: '2026-06-17', writer: '홍길동', category: '환경조사', content: '부산 △△공단 현장조사 및 시료채취 (NOx 초과 건)', place: '부산 △△구', status: '완료' },
  { id: 'W-2', date: '2026-06-16', writer: '정소음', category: '소음측정', content: '아파트 공사장 소음 민원 측정', place: '인천 남동구', status: '완료' },
  { id: 'W-3', date: '2026-06-18', writer: '김환경', category: '대기측정', content: '산업단지 대기오염물질 정기 측정', place: '경기 시흥', status: '진행' },
]

export const HR_ORDERS: HrOrder[] = [
  { id: 'HR-1', empno: 'EMP-006', name: '홍길동', type: '승진', date: '2025-01-01', detail: '사원 → 대리 승진' },
  { id: 'HR-2', empno: 'EMP-010', name: '임계약', type: '채용', date: '2025-03-03', detail: '계약직 입사 (측정조사팀)' },
  { id: 'HR-3', empno: 'EMP-003', name: '김환경', type: '전보', date: '2024-07-01', detail: '실험실 → 측정조사팀' },
]

export const LEAVES: Leave[] = [
  { id: 'L-1', empno: 'EMP-006', name: '홍길동', dept: '측정조사팀', type: '월차', period: '2026-06-23', days: 1, reason: '개인', approver: '김환경', status: '검토중' },
  { id: 'L-2', empno: 'EMP-006', name: '홍길동', dept: '측정조사팀', type: '연차', period: '2026-04-28~2026-04-29', days: 2, reason: '개인', approver: '조현석', status: '반려' },
  { id: 'L-3', empno: 'EMP-007', name: '정소음', dept: '소음진동팀', type: '반차', period: '2026-06-10', days: 0.5, reason: '병원', approver: '한경영', status: '승인' },
]

export const CLIENTS: Client[] = [
  { code: 'CL-001', name: '△△산업단지관리공단', bizno: '123-45-67890', ceo: '김대표', tel: '032-100-2000', manager: '이과장' },
  { code: 'CL-002', name: '○○화학(주)', bizno: '234-56-78901', ceo: '박대표', tel: '051-200-3000', manager: '최대리' },
  { code: 'CL-003', name: '□□제철', bizno: '345-67-89012', ceo: '정대표', tel: '054-300-4000', manager: '한주임' },
]

export const CONTRACTS: Contract[] = [
  { ctno: 'CT-2026-001', client: '△△산업단지관리공단', title: '대기오염물질 정기측정 용역', amount: 24000000, received: 12000000, unpaid: 12000000, date: '2026-01-15', progress: 50, isJoint: false, status: '진행' },
  { ctno: 'CT-2026-002', client: '○○화학(주)', title: '수질 자가측정 대행', amount: 18000000, received: 18000000, unpaid: 0, date: '2026-02-01', progress: 100, isJoint: false, status: '완료' },
  { ctno: 'CT-2026-003', client: '□□제철', title: '소음·진동 측정 (공동)', amount: 36000000, received: 9000000, unpaid: 27000000, date: '2026-03-10', progress: 25, isJoint: true, status: '진행' },
]

export const BILLINGS: Billing[] = [
  { id: 'B-1', ctno: 'CT-2026-001', client: '△△산업단지관리공단', billAmount: 12000000, receiveAmount: 12000000, billDate: '2026-04-01', receiveDate: '2026-04-20' },
  { id: 'B-2', ctno: 'CT-2026-002', client: '○○화학(주)', billAmount: 18000000, receiveAmount: 18000000, billDate: '2026-03-01', receiveDate: '2026-03-15' },
  { id: 'B-3', ctno: 'CT-2026-003', client: '□□제철', billAmount: 9000000, receiveAmount: 9000000, billDate: '2026-05-01', receiveDate: '2026-05-25' },
]

export const ENV_REPORTS: EnvReport[] = [
  { mno: '2026-CL001-001', year: '2026', clientCode: 'CL-001', client: '△△산업단지관리공단', item: '대기', amount: 4800000, date: '2026-04-05', locked: true, status: '완료' },
  { mno: '2026-CL002-001', year: '2026', clientCode: 'CL-002', client: '○○화학(주)', item: '수질', amount: 3600000, date: '2026-03-12', locked: true, status: '결재' },
  { mno: '2026-CL003-001', year: '2026', clientCode: 'CL-003', client: '□□제철', item: '소음', amount: 6000000, date: '2026-05-20', locked: false, status: '작성중' },
]

export const INCIDENTS: Incident[] = [
  { incNo: 'INC-2026-003', equip: '대기 시료채취기 (모델 AX-200)', reporter: '김환경', date: '2026-06-10', symptom: '펌프 유량 불안정', action: '펌프 교체 후 재교정', status: '완료' },
  { incNo: 'INC-2026-004', equip: '소음계 (NL-52)', reporter: '정소음', date: '2026-06-18', symptom: '전원 간헐적 꺼짐', action: '제조사 A/S 접수', status: '수리중' },
]

export const EQUIPMENT: Equipment[] = [
  { id: 'EQ-001', name: '대기 시료채취기', spec: 'AX-200', serial: 'SN-AX20026', maker: '한국환경계측', use: '대기오염물질 포집', calibDue: '2026-12-31', status: '정상' },
  { id: 'EQ-002', name: '소음계', spec: 'NL-52', serial: 'SN-NL5219', maker: 'RION', use: '소음 측정', calibDue: '2026-08-15', status: '이상' },
  { id: 'EQ-003', name: 'pH 측정기', spec: 'HQ-40d', serial: 'SN-HQ4088', maker: 'HACH', use: '수질 pH 분석', calibDue: '2027-02-28', status: '정상' },
]
