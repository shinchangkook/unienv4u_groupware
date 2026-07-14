// 도메인 타입 — spec_unienv4u_groupware_20260714.md §3~§5 기준

export type MemberStatus = 'pending' | 'approved' | 'rejected'
export type Dept = '측정조사팀' | '실험실' | '소음진동팀' | '경영지원팀' | '대표'

export interface Member {
  email: string
  pw: string
  name: string
  ename: string
  pemail: string
  jumin: string // 데모: 마스킹 문자열
  dept: Dept
  rank: string
  type: '정규직' | '계약직'
  tel: string
  date: string // 입사일 YYYY-MM-DD
  annualLeave: number
  leaveDate: string
  empno: string
  isAdmin: boolean
  isMaster: boolean
  isSubMaster?: boolean
  status: MemberStatus
  reqNo?: string
  reqDate?: string
}

export type MenuId =
  | 'dash' | 'member-info' | 'notice' | 'approval' | 'calendar' | 'worklog'
  | 'emp' | 'leave' | 'contract' | 'env' | 'client-reg' | 'account'
  | 'acc-ledger' | 'ledger' | 'equip'

export interface Notice {
  id: string
  category: '공지' | '자유'
  title: string
  author: string
  date: string
  views: number
  comments: number
  body: string
}

export interface Approval {
  id: string
  title: string
  drafter: string
  date: string
  status: '검토중' | '승인' | '반려'
  type: string
  reason?: string
}

export interface CalendarEvent {
  id: string
  date: string
  title: string
  type: '회의' | '출장' | '휴가' | '기타'
  owner: string
}

export interface WorkLog {
  id: string
  date: string
  writer: string
  category: string
  content: string
  place: string
  status: '진행' | '완료'
}

export interface HrOrder {
  id: string
  empno: string
  name: string
  type: '승진' | '전보' | '채용' | '퇴직'
  date: string
  detail: string
}

export interface Leave {
  id: string
  empno: string
  name: string
  dept: Dept
  type: '연차' | '월차' | '반차' | '병가'
  period: string
  days: number
  reason: string
  approver: string
  status: '검토중' | '승인' | '반려'
}

export interface AnnualSummary {
  total: number
  used: number
  remain: number
  useRate: number
}

export interface Client {
  code: string
  name: string
  bizno: string
  ceo: string
  tel: string
  manager: string
}

export interface Contract {
  ctno: string
  client: string
  title: string
  amount: number
  received: number
  unpaid: number
  date: string
  progress: number
  isJoint: boolean
  status: '진행' | '완료' | '대손'
}

export interface Billing {
  id: string
  ctno: string
  client: string
  billAmount: number
  receiveAmount: number
  billDate: string
  receiveDate: string
}

export interface EnvReport {
  mno: string // 관리번호 연도-발주처코드-순번
  year: string
  clientCode: string
  client: string
  item: '수질' | '대기' | '소음' | '토양'
  amount: number
  date: string
  locked: boolean
  status: '작성중' | '완료' | '결재'
}

export interface Incident {
  incNo: string
  equip: string
  reporter: string
  date: string
  symptom: string
  action: string
  status: '접수' | '수리중' | '완료'
}

export interface Equipment {
  id: string
  name: string
  spec: string
  serial: string
  maker: string
  use: string
  calibDue: string
  status: '정상' | '점검' | '이상'
}
