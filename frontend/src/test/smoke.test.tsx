import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../auth/AuthContext'
import { ToastProvider } from '../components/Toast'
import { canAccess, calcAnnualLeave } from '../lib/permissions'
import { genManageNo } from '../mock/api'
import { MEMBERS, ENV_REPORTS } from '../mock/seed'

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('앱 런타임 렌더', () => {
  it('로그인 화면이 마운트된다', () => {
    renderApp()
    expect(screen.getByText('유앤아이환경기술(주)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('이메일 또는 아이디')).toBeInTheDocument()
  })

  it('마스터 데모 로그인 후 대시보드와 전체 메뉴가 렌더된다', async () => {
    renderApp()
    fireEvent.click(screen.getByText('마스터 (대표이사)'))
    await waitFor(() => expect(screen.getByText(/안녕하세요/)).toBeInTheDocument(), { timeout: 3000 })
    // 마스터는 회원관리(마스터 전용) 메뉴가 보인다
    expect(screen.getByText('회원정보 관리')).toBeInTheDocument()
    expect(screen.getByText('총 계약금액')).toBeInTheDocument()
  })
})

describe('핵심 비즈니스 로직', () => {
  it('권한: 일반 측정조사팀은 회원관리 불가, 계약은 가능', () => {
    const hong = MEMBERS.find((m) => m.email === 'hong@unienv4u.com')!
    expect(canAccess(hong, 'member-info')).toBe(false)
    expect(canAccess(hong, 'contract')).toBe(true)
    expect(canAccess(hong, 'dash')).toBe(true)
  })

  it('권한: 마스터는 전 메뉴 접근', () => {
    const admin = MEMBERS.find((m) => m.isMaster)!
    expect(canAccess(admin, 'member-info')).toBe(true)
    expect(canAccess(admin, 'emp')).toBe(true)
  })

  it('근로기준법 연차 계산', () => {
    expect(calcAnnualLeave('2026-01-01', 2026)).toBe(11) // 1년 미만
    expect(calcAnnualLeave('2024-01-01', 2026)).toBe(15) // 2년차
    expect(calcAnnualLeave('2005-01-01', 2026)).toBe(25) // 20년 이상
  })

  it('환경 관리번호 채번: 연도-코드-순번', () => {
    // CL-001은 2026년 기존 1건 → 다음 순번 002
    expect(genManageNo('2026', 'CL-001', '', ENV_REPORTS)).toBe('2026-CL-001-002')
    // 신규 코드 → 001
    expect(genManageNo('2026', 'CL-999', '', ENV_REPORTS)).toBe('2026-CL-999-001')
  })
})
