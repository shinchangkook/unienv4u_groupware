import { api } from '../mock/api'
import { useApi, PageHeader, Card, Badge, Loading } from '../components/ui'

export default function Notice() {
  const { data } = useApi(() => api.listNotices())
  if (!data) return <Loading />
  return (
    <>
      <PageHeader title="공지사항 / 게시판" desc="사내 공지 및 자유게시판" action={<button className="btn pri"><i className="ti ti-plus" /> 새 글</button>} />
      <Card>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>구분</th><th>제목</th><th>작성자</th><th>작성일</th><th className="num">조회</th><th className="num">댓글</th></tr></thead>
            <tbody>
              {data.map((n) => (
                <tr key={n.id}>
                  <td><Badge kind={n.category === '공지' ? 'info' : 'mut'}>{n.category}</Badge></td>
                  <td style={{ fontWeight: 600 }}>{n.title}</td>
                  <td>{n.author}</td><td>{n.date}</td>
                  <td className="num">{n.views}</td><td className="num">{n.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
