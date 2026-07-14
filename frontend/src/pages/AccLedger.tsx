import { PageHeader, Card, won } from '../components/ui'

const ENTRIES = [
  { date: '2026-04-20', account: '용역매출', desc: '△△공단 대기측정 수금', debit: 0, credit: 12000000 },
  { date: '2026-03-15', account: '분석매출', desc: '○○화학 수질분석 수금', debit: 0, credit: 18000000 },
  { date: '2026-05-25', account: '용역매출', desc: '□□제철 소음측정 1차', debit: 0, credit: 9000000 },
  { date: '2026-04-05', account: '출장비', desc: '부산 현장조사 출장비', debit: 340000, credit: 0 },
  { date: '2026-05-10', account: '장비유지비', desc: '소음계 A/S', debit: 520000, credit: 0 },
]

export default function AccLedger() {
  let balance = 0
  return (
    <>
      <PageHeader title="계정별원장" desc="계정과목별 거래 내역 및 잔액 (연도 자동 추출)" />
      <Card title="2026년 전표 내역" icon="ti-book">
        <div className="tw">
          <table className="tb">
            <thead><tr><th>일자</th><th>계정과목</th><th>적요</th><th className="num">차변</th><th className="num">대변</th><th className="num">잔액</th></tr></thead>
            <tbody>
              {ENTRIES.map((e, i) => {
                balance += e.credit - e.debit
                return (
                  <tr key={i}>
                    <td>{e.date}</td><td style={{ fontWeight: 600 }}>{e.account}</td><td>{e.desc}</td>
                    <td className="num">{e.debit ? won(e.debit) : '-'}</td>
                    <td className="num">{e.credit ? won(e.credit) : '-'}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{won(balance)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
