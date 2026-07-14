import { useState } from 'react'
import { api } from '../mock/api'
import { useApi, PageHeader, Card, Badge, statusBadge, Loading } from '../components/ui'
import { ALL_DEPTS, MENU_PERMS } from '../lib/permissions'
import { MENU } from '../layout/menu'

export default function MemberInfo() {
  const { data: members } = useApi(() => api.listMembers())
  const [tab, setTab] = useState<'members' | 'pending' | 'perms'>('members')
  if (!members) return <Loading />

  const pending = members.filter((m) => m.status === 'pending')
  const allMenus = MENU.flatMap((g) => g.items)

  return (
    <>
      <PageHeader title="회원정보 관리" desc="마스터 전용 · 가입 승인 및 메뉴 권한 설정" />
      <div className="tab-row">
        <div className={'tab' + (tab === 'members' ? ' on' : '')} onClick={() => setTab('members')}>회원 목록</div>
        <div className={'tab' + (tab === 'pending' ? ' on' : '')} onClick={() => setTab('pending')}>가입 승인 {pending.length > 0 && <Badge kind="dng">{pending.length}</Badge>}</div>
        <div className={'tab' + (tab === 'perms' ? ' on' : '')} onClick={() => setTab('perms')}>메뉴 권한</div>
      </div>

      {tab === 'members' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>이름</th><th>부서</th><th>직급</th><th>이메일</th><th>권한</th><th>상태</th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.email}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td><td>{m.dept}</td><td>{m.rank}</td><td>{m.email}</td>
                    <td>{m.isMaster ? <Badge kind="info">마스터</Badge> : m.isSubMaster ? <Badge kind="warn">부마스터</Badge> : <Badge kind="mut">일반</Badge>}</td>
                    <td>{m.status === 'approved' ? statusBadge('승인') : m.status === 'pending' ? statusBadge('검토중') : statusBadge('반려')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'pending' && (
        <Card>
          {pending.length === 0 ? <div style={{ padding: 20, color: 'var(--text-tertiary)', fontSize: 12 }}>승인 대기 중인 신청이 없습니다.</div> : (
            <div className="tw">
              <table className="tb">
                <thead><tr><th>이름</th><th>부서</th><th>직급</th><th>이메일</th><th>신청일</th><th>처리</th></tr></thead>
                <tbody>
                  {pending.map((m) => (
                    <tr key={m.email}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td><td>{m.dept}</td><td>{m.rank}</td><td>{m.email}</td><td>{m.reqDate}</td>
                      <td><div style={{ display: 'flex', gap: 4 }}><button className="btn sm pri">승인</button><button className="btn sm dng">거절</button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'perms' && (
        <Card title="부서별 메뉴 접근 권한 (MENU_PERMS)" icon="ti-lock-access">
          <div className="tw">
            <table className="tb">
              <thead><tr><th>메뉴</th>{ALL_DEPTS.map((d) => <th key={d} style={{ textAlign: 'center' }}>{d}</th>)}<th style={{ textAlign: 'center' }}>마스터</th></tr></thead>
              <tbody>
                {allMenus.map((mn) => {
                  const perms = MENU_PERMS[mn.id] || []
                  const all = perms.length === 0
                  return (
                    <tr key={mn.id}>
                      <td style={{ fontWeight: 600 }}><i className={`ti ${mn.icon}`} style={{ marginRight: 5, color: 'var(--accent)' }} />{mn.label}</td>
                      {ALL_DEPTS.map((d) => (
                        <td key={d} style={{ textAlign: 'center' }}>{all || perms.includes(d) ? <i className="ti ti-check" style={{ color: 'var(--text-success)' }} /> : <span style={{ color: 'var(--border-p)' }}>·</span>}</td>
                      ))}
                      <td style={{ textAlign: 'center' }}><i className="ti ti-check" style={{ color: 'var(--text-success)' }} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>✓ = 접근 가능. 빈 배열 메뉴(대시보드·공지 등)는 전 직원 접근.</p>
        </Card>
      )}
    </>
  )
}
