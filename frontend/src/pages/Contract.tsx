import { useState } from 'react'
import { api } from '../mock/api'
import { useApi, PageHeader, Card, statusBadge, Badge, won, Loading } from '../components/ui'

export default function Contract() {
  const { data: contracts } = useApi(() => api.listContracts())
  const { data: billings } = useApi(() => api.listBillings())
  const [tab, setTab] = useState<'unified' | 'unpaid' | 'billing'>('unified')
  if (!contracts || !billings) return <Loading />

  const unpaidList = contracts.filter((c) => c.unpaid > 0)
  const badDebt = contracts.filter((c) => c.status === '대손')

  return (
    <>
      <PageHeader title="계약·미수금관리" desc="통합 계약 · 청구/수금 · 미수금 및 대손 현황" action={<button className="btn pri"><i className="ti ti-plus" /> 계약 등록</button>} />
      <div className="tab-row">
        <div className={'tab' + (tab === 'unified' ? ' on' : '')} onClick={() => setTab('unified')}>통합 계약</div>
        <div className={'tab' + (tab === 'unpaid' ? ' on' : '')} onClick={() => setTab('unpaid')}>미수금 현황</div>
        <div className={'tab' + (tab === 'billing' ? ' on' : '')} onClick={() => setTab('billing')}>청구/수금</div>
      </div>

      {tab === 'unified' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>계약번호</th><th>발주처</th><th>계약명</th><th className="num">계약금액</th><th className="num">수금액</th><th className="num">미수금</th><th>진행률</th><th>구분</th><th>상태</th></tr></thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.ctno}>
                    <td>{c.ctno}</td><td>{c.client}</td><td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td className="num">{won(c.amount)}</td><td className="num">{won(c.received)}</td>
                    <td className="num pos">{c.unpaid ? won(c.unpaid) : '-'}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="bar" style={{ width: 50 }}><div style={{ width: `${c.progress}%` }} /></div><span style={{ fontSize: 10 }}>{c.progress}%</span></div></td>
                    <td>{c.isJoint ? <Badge kind="warn">공동</Badge> : <Badge kind="mut">단독</Badge>}</td>
                    <td>{statusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'unpaid' && (
        <>
          <Card title="미수금 (거래처·계약별)" icon="ti-alert-triangle">
            <div className="tw">
              <table className="tb">
                <thead><tr><th>계약번호</th><th>발주처</th><th className="num">계약금액</th><th className="num">미수금</th><th>경과</th></tr></thead>
                <tbody>
                  {unpaidList.map((c) => (
                    <tr key={c.ctno}><td>{c.ctno}</td><td>{c.client}</td><td className="num">{won(c.amount)}</td><td className="num pos">{won(c.unpaid)}</td><td>{c.date}~</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="대손 현황" icon="ti-file-x" style={{ marginTop: 16 }}>
            {badDebt.length ? <table className="tb"><tbody>{badDebt.map((c) => <tr key={c.ctno}><td>{c.ctno}</td><td>{c.client}</td><td className="num pos">{won(c.unpaid)}</td></tr>)}</tbody></table>
              : <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: 8 }}>대손 처리된 계약이 없습니다.</div>}
          </Card>
        </>
      )}

      {tab === 'billing' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>계약번호</th><th>발주처</th><th className="num">청구액</th><th>청구일</th><th className="num">수금액</th><th>수금일</th></tr></thead>
              <tbody>
                {billings.map((b) => (
                  <tr key={b.id}><td>{b.ctno}</td><td>{b.client}</td><td className="num">{won(b.billAmount)}</td><td>{b.billDate}</td><td className="num">{won(b.receiveAmount)}</td><td>{b.receiveDate}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
