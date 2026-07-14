import { PageHeader, Card, Badge } from '../components/ui'

const ACCOUNTS = [
  { code: '4001', name: '용역매출', type: '수익', note: '환경측정 용역' },
  { code: '4002', name: '분석매출', type: '수익', note: '수질·대기 분석' },
  { code: '5001', name: '급여', type: '비용', note: '인건비' },
  { code: '5002', name: '출장비', type: '비용', note: '현장 측정 출장' },
  { code: '5003', name: '장비유지비', type: '비용', note: '교정·수리' },
  { code: '1001', name: '외상매출금', type: '자산', note: '미수금' },
]
const KIND: Record<string, 'ok' | 'dng' | 'info'> = { 수익: 'ok', 비용: 'dng', 자산: 'info' }

export default function Account() {
  return (
    <>
      <PageHeader title="계정과목" desc="회계 계정과목 관리" action={<button className="btn pri"><i className="ti ti-plus" /> 계정 추가</button>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>코드</th><th>계정과목</th><th>구분</th><th>비고</th></tr></thead>
            <tbody>
              {ACCOUNTS.map((a) => (
                <tr key={a.code}>
                  <td>{a.code}</td><td style={{ fontWeight: 600 }}>{a.name}</td>
                  <td><Badge kind={KIND[a.type]}>{a.type}</Badge></td><td>{a.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
