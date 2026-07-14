import { api } from '../mock/api'
import { useApi, PageHeader, Card, won, Loading } from '../components/ui'

export default function Ledger() {
  const { data: clients } = useApi(() => api.listClients())
  const { data: contracts } = useApi(() => api.listContracts())
  if (!clients || !contracts) return <Loading />

  const rows = clients.map((c) => {
    const cs = contracts.filter((ct) => ct.client === c.name)
    const total = cs.reduce((s, ct) => s + ct.amount, 0)
    const received = cs.reduce((s, ct) => s + ct.received, 0)
    return { code: c.code, name: c.name, total, received, balance: total - received }
  })

  return (
    <>
      <PageHeader title="거래처원장" desc="거래처별 잔액 및 거래 내역" />
      <Card title="잔액 현황" icon="ti-report-money">
        <div className="tw">
          <table className="tb">
            <thead><tr><th>코드</th><th>거래처</th><th className="num">거래총액</th><th className="num">수금액</th><th className="num">잔액(미수)</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code}>
                  <td>{r.code}</td><td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td className="num">{won(r.total)}</td><td className="num">{won(r.received)}</td>
                  <td className={'num' + (r.balance > 0 ? ' pos' : '')}>{r.balance ? won(r.balance) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
