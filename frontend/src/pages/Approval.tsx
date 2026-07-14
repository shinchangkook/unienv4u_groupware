import { api } from '../mock/api'
import { useApi, PageHeader, Card, statusBadge, Loading } from '../components/ui'

export default function Approval() {
  const { data } = useApi(() => api.listApprovals())
  if (!data) return <Loading />
  return (
    <>
      <PageHeader title="전자결재" desc="기안 → 팀장 → 대표이사 승인 라인" action={<button className="btn pri"><i className="ti ti-plus" /> 새 기안</button>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>문서번호</th><th>유형</th><th>제목</th><th>기안자</th><th>기안일</th><th>상태</th><th>비고</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td>{a.id}</td><td>{a.type}</td>
                  <td style={{ fontWeight: 600 }}>{a.title}</td>
                  <td>{a.drafter}</td><td>{a.date}</td>
                  <td>{statusBadge(a.status)}</td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{a.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
