// 권한 모델 — spec §3.4
import type { Member, MenuId, Dept } from '../types'

export const ALL_DEPTS: Dept[] = ['측정조사팀', '실험실', '소음진동팀', '경영지원팀', '대표']

const DEPT_ALIASES: Record<string, Dept> = {
  '환경조사팀': '측정조사팀',
  '실험분석팀': '실험실',
}
export function normalizeDept(dept: string): string {
  return DEPT_ALIASES[dept] || dept || ''
}

// 메뉴별 접근 허용 부서 ('_master' = 마스터 전용 토큰, 빈 배열 = 전 직원)
export const MENU_PERMS: Record<MenuId, string[]> = {
  dash: [], notice: [], approval: [], calendar: [], worklog: [],
  emp: ['경영지원팀', '대표', '_master'],
  leave: ['경영지원팀', '대표', '_master'],
  contract: ['측정조사팀', '소음진동팀', '경영지원팀', '대표', '_master'],
  env: ['측정조사팀', '소음진동팀', '경영지원팀', '대표', '_master'],
  'client-reg': ['경영지원팀', '대표', '_master'],
  account: ['경영지원팀', '대표', '_master'],
  'acc-ledger': ['경영지원팀', '대표', '_master'],
  ledger: ['경영지원팀', '대표', '_master'],
  equip: ['측정조사팀', '실험실', '소음진동팀', '경영지원팀', '대표', '_master'],
  'member-info': ['_master'],
}

function deptCanAccess(perms: string[], dept: string): boolean {
  if (!perms || perms.length === 0) return true
  return perms.includes(normalizeDept(dept))
}

export function canAccess(user: Member | null, menuId: MenuId): boolean {
  if (!user) return false
  if (user.isMaster || user.isAdmin) return true
  return deptCanAccess(MENU_PERMS[menuId], user.dept)
}

// 근로기준법 연차 자동 계산 — spec §5.7
export function calcAnnualLeave(hireDate: string, year: number): number {
  const hire = new Date(hireDate || Date.now())
  const ref = new Date(`${year}-01-01`)
  const yrs = Math.max(0, Math.floor((ref.getTime() - hire.getTime()) / (365.25 * 24 * 3600 * 1000)))
  if (yrs < 1) return 11
  if (yrs < 3) return 15
  if (yrs < 5) return 16
  if (yrs < 10) return 17
  if (yrs < 20) return 21
  return 25
}
