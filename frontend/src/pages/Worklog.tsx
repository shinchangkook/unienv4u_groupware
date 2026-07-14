import { api } from '../mock/api'
import { useApi, PageHeader, Card, statusBadge, Loading } from '../components/ui'

export default function Worklog() {
  const { data } = useApi(() => api.listWorklogs())
  if (!data) return <Loading />
  return (
    <>
      <PageHeader title="업무일지" desc="일자별 현장·측정 업무 기록" action={<button className="btn pri"><i className="ti ti-plus" /> 일지 작성</button>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>날짜</th><th>작성자</th><th>구분</th><th>업무 내용</th><th>장소</th><th>상태</th></tr></thead>
            <tbody>
              {data.map((w) => (
                <tr key={w.id}>
                  <td>{w.date}</td><td>{w.writer}</td><td>{w.category}</td>
                  <td style={{ fontWeight: 500 }}>{w.content}</td><td>{w.place}</td>
                  <td>{statusBadge(w.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
