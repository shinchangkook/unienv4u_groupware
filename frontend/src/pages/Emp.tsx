import { useState } from 'react'
import { api } from '../mock/api'
import { useApi, PageHeader, Card, Badge, Loading } from '../components/ui'

export default function Emp() {
  const { data: members } = useApi(() => api.listMembers())
  const { data: orders } = useApi(() => api.listHrOrders())
  const [tab, setTab] = useState<'list' | 'order'>('list')
  if (!members || !orders) return <Loading />

  const emps = members.filter((m) => m.status === 'approved' && !m.isAdmin)

  return (
    <>
      <PageHeader title="인사관리" desc="사원 정보 · 인사발령 · 인사기록카드" />
      <div className="tab-row">
        <div className={'tab' + (tab === 'list' ? ' on' : '')} onClick={() => setTab('list')}>사원 목록</div>
        <div className={'tab' + (tab === 'order' ? ' on' : '')} onClick={() => setTab('order')}>인사발령</div>
      </div>

      {tab === 'list' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>사번</th><th>이름</th><th>부서</th><th>직급</th><th>고용형태</th><th>입사일</th><th>연차</th><th>연락처</th></tr></thead>
              <tbody>
                {emps.map((m) => (
                  <tr key={m.empno}>
                    <td>{m.empno}</td><td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.dept}</td><td>{m.rank}</td>
                    <td><Badge kind={m.type === '정규직' ? 'info' : 'mut'}>{m.type}</Badge></td>
                    <td>{m.date}</td><td className="num">{m.annualLeave}일</td><td>{m.tel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'order' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>사번</th><th>대상자</th><th>발령 유형</th><th>발령일</th><th>내용</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.empno}</td><td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td><Badge kind={o.type === '퇴직' ? 'dng' : 'info'}>{o.type}</Badge></td>
                    <td>{o.date}</td><td>{o.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
