import type { MenuId } from '../types'

export interface MenuItem { id: MenuId; label: string; icon: string; path: string }
export interface MenuGroup { group: string; items: MenuItem[] }

export const MENU: MenuGroup[] = [
  {
    group: '그룹웨어',
    items: [
      { id: 'dash', label: '대시보드', icon: 'ti-layout-dashboard', path: '/dash' },
      { id: 'notice', label: '공지사항/게시판', icon: 'ti-speakerphone', path: '/notice' },
      { id: 'approval', label: '전자결재', icon: 'ti-file-check', path: '/approval' },
      { id: 'calendar', label: '일정/캘린더', icon: 'ti-calendar', path: '/calendar' },
      { id: 'worklog', label: '업무일지', icon: 'ti-notebook', path: '/worklog' },
    ],
  },
  {
    group: '인사·근태',
    items: [
      { id: 'emp', label: '인사관리', icon: 'ti-users', path: '/emp' },
      { id: 'leave', label: '휴가관리', icon: 'ti-beach', path: '/leave' },
    ],
  },
  {
    group: '사업관리',
    items: [
      { id: 'contract', label: '계약·미수금관리', icon: 'ti-file-invoice', path: '/contract' },
      { id: 'env', label: '환경질현황', icon: 'ti-leaf', path: '/env' },
    ],
  },
  {
    group: '수금관리',
    items: [
      { id: 'client-reg', label: '거래처등록', icon: 'ti-building-store', path: '/client-reg' },
      { id: 'account', label: '계정과목', icon: 'ti-list-details', path: '/account' },
      { id: 'acc-ledger', label: '계정별원장', icon: 'ti-book', path: '/acc-ledger' },
      { id: 'ledger', label: '거래처원장', icon: 'ti-report-money', path: '/ledger' },
    ],
  },
  {
    group: '장비관리',
    items: [
      { id: 'equip', label: '장비관리', icon: 'ti-tools', path: '/equip' },
    ],
  },
  {
    group: '회원관리',
    items: [
      { id: 'member-info', label: '회원정보 관리', icon: 'ti-user-shield', path: '/member-info' },
    ],
  },
]
