// Mock API 계층 — spec §1, §7. REST 형태로 추상화하여 추후 실제 HTTP로 교체.
// 모든 메서드는 Promise를 반환하여 비동기 백엔드 계약을 흉내낸다.
import * as seed from './seed'
import type {
  Member, Notice, Approval, CalendarEvent, WorkLog, HrOrder, Leave,
  Client, Contract, Billing, EnvReport, Incident, Equipment, AnnualSummary,
} from '../types'
import { calcAnnualLeave } from '../lib/permissions'

const LATENCY = 120 // ms — 네트워크 지연 흉내

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), LATENCY))
}

export const api = {
  // ── 인증 ──
  login(id: string, pw: string): Promise<Member> {
    const email = id.includes('@') ? id : `${id}@unienv4u.com`
    const user = seed.MEMBERS.find((m) => m.email === email && m.pw === pw)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!user) return reject(new Error('아이디 또는 비밀번호가 올바르지 않습니다.'))
        if (user.status === 'pending') return reject(new Error('가입 승인 대기 중입니다.'))
        if (user.status === 'rejected') return reject(new Error('가입이 거절되었습니다.'))
        resolve(structuredClone(user))
      }, LATENCY)
    })
  },

  // ── 회원 ──
  listMembers: (): Promise<Member[]> => delay(seed.MEMBERS),
  listPending: (): Promise<Member[]> => delay(seed.MEMBERS.filter((m) => m.status === 'pending')),

  // ── 그룹웨어 ──
  listNotices: (): Promise<Notice[]> => delay(seed.NOTICES),
  listApprovals: (): Promise<Approval[]> => delay(seed.APPROVALS),
  listEvents: (): Promise<CalendarEvent[]> => delay(seed.EVENTS),
  listWorklogs: (): Promise<WorkLog[]> => delay(seed.WORKLOGS),

  // ── 인사·근태 ──
  listHrOrders: (): Promise<HrOrder[]> => delay(seed.HR_ORDERS),
  listLeaves: (): Promise<Leave[]> => delay(seed.LEAVES),
  annualSummary(empno: string, year: number): Promise<AnnualSummary> {
    const m = seed.MEMBERS.find((x) => x.empno === empno)
    const total = m ? calcAnnualLeave(m.date, year) : 15
    const used = seed.LEAVES.filter((l) => l.empno === empno && l.status === '승인').reduce((s, l) => s + l.days, 0)
    const remain = Math.max(0, total - used)
    const useRate = total ? Math.round((used / total) * 100) : 0
    return delay({ total, used, remain, useRate })
  },

  // ── 사업관리 ──
  listContracts: (): Promise<Contract[]> => delay(seed.CONTRACTS),
  listBillings: (): Promise<Billing[]> => delay(seed.BILLINGS),
  listEnvReports: (): Promise<EnvReport[]> => delay(seed.ENV_REPORTS),

  // ── 수금관리 ──
  listClients: (): Promise<Client[]> => delay(seed.CLIENTS),

  // ── 장비 ──
  listIncidents: (): Promise<Incident[]> => delay(seed.INCIDENTS),
  listEquipment: (): Promise<Equipment[]> => delay(seed.EQUIPMENT),
}

// 관리번호 자동생성 — spec §5.9 genManageNo
export function genManageNo(year: string, clientCode: string, clientName: string, existing: EnvReport[]): string {
  const useCode = clientCode || clientName.slice(0, 3).replace(/[^A-Za-z0-9가-힣]/g, '') || 'XXX'
  const seq = existing.filter((e) => e.clientCode === useCode && e.year === year).length + 1
  return `${year}-${useCode}-${String(seq).padStart(3, '0')}`
}
