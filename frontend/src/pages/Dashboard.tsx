import { api } from '../mock/api'
import { useAuth } from '../auth/AuthContext'
import { useApi, PageHeader, Card, statusBadge, won, Loading } from '../components/ui'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: contracts } = useApi(() => api.listContracts())
  const { data: approvals } = useApi(() => api.listApprovals())
  const { data: leaves } = useApi(() => api.listLeaves())
  const { data: notices } = useApi(() => api.listNotices())
  const { data: env } = useApi(() => api.listEnvReports())

  if (!contracts || !approvals || !leaves || !notices || !env) return <Loading />

  const totalContract = contracts.reduce((s, c) => s + c.amount, 0)
  const totalUnpaid = contracts.reduce((s, c) => s + c.unpaid, 0)
  const pendingAppr = approvals.filter((a) => a.status === '검토중').length
  const pendingLeave = leaves.filter((l) => l.status === '검토중').length

  return (
    <>
      <PageHeader title={`안녕하세요, ${user?.name}님 👋`} desc="유앤아이환경기술 그룹웨어 대시보드" />

      <div className="stat-grid section">
        <div className="stat">
          <div className="stat-l"><i className="ti ti-file-invoice" /> 총 계약금액</div>
          <div className="stat-v">{won(totalContract)}</div>
          <div className="stat-s">진행 {contracts.filter((c) => c.status === '진행').length}건 / 전체 {contracts.length}건</div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-alert-triangle" /> 미수금 총액</div>
          <div className="stat-v" style={{ color: 'var(--text-danger)' }}>{won(totalUnpaid)}</div>
          <div className="stat-s">회수율 {Math.round((1 - totalUnpaid / totalContract) * 100)}%</div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-file-check" /> 결재 대기</div>
          <div className="stat-v">{pendingAppr}건</div>
          <div className="stat-s">전자결재 검토 필요</div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-beach" /> 휴가 승인 대기</div>
          <div className="stat-v">{pendingLeave}건</div>
          <div className="stat-s">근태 처리 필요</div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-leaf" /> 환경 성적서</div>
          <div className="stat-v">{env.length}건</div>
          <div className="stat-s">작성중 {env.filter((e) => e.status === '작성중').length} / 완료 {env.filter((e) => e.status === '완료').length}</div>
        </div>
      </div>

      <div className="grid-2">
        <Card title="최근 전자결재" icon="ti-file-check">
          <div className="tw">
            <table className="tb">
              <thead><tr><th>문서번호</th><th>제목</th><th>기안자</th><th>상태</th></tr></thead>
              <tbody>
                {approvals.map((a) => (
                  <tr key={a.id}><td>{a.id}</td><td>{a.title}</td><td>{a.drafter}</td><td>{statusBadge(a.status)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="공지사항" icon="ti-speakerphone">
          <div className="tw">
            <table className="tb">
              <thead><tr><th>구분</th><th>제목</th><th>작성자</th><th>날짜</th></tr></thead>
              <tbody>
                {notices.map((n) => (
                  <tr key={n.id}><td>{statusBadge(n.category === '공지' ? '진행' : '접수')}</td><td>{n.title}</td><td>{n.author}</td><td>{n.date}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  )
}
