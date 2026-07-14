import { useEffect, useState } from 'react'
import { api } from '../mock/api'
import { useAuth } from '../auth/AuthContext'
import { PageHeader, Card, statusBadge, Loading } from '../components/ui'
import Modal from '../components/Modal'
import { useToast } from '../components/Toast'
import { calcAnnualLeave } from '../lib/permissions'
import type { Leave as LeaveT, AnnualSummary } from '../types'

export default function Leave() {
  const { user } = useAuth()
  const toast = useToast()
  const [leaves, setLeaves] = useState<LeaveT[] | null>(null)
  const [summary, setSummary] = useState<AnnualSummary | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ type: '연차', period: '', days: 1, reason: '' })

  useEffect(() => {
    api.listLeaves().then(setLeaves)
    api.annualSummary(user?.empno || '', 2026).then(setSummary)
  }, [user?.empno])

  if (!leaves || !summary) return <Loading />
  const myTotal = user ? calcAnnualLeave(user.date, 2026) : 15

  function submit() {
    if (!form.period) { toast('기간을 입력해주세요.', 'warning'); return }
    const nl: LeaveT = {
      id: 'L-' + Date.now(), empno: user!.empno, name: user!.name, dept: user!.dept,
      type: form.type as LeaveT['type'], period: form.period, days: Number(form.days),
      reason: form.reason || '개인', approver: '팀장', status: '검토중',
    }
    setLeaves((s) => [nl, ...(s || [])])
    setOpen(false)
    setForm({ type: '연차', period: '', days: 1, reason: '' })
    toast('휴가 신청이 접수되었습니다. 결재 대기 중입니다.', 'success')
  }

  return (
    <>
      <PageHeader title="휴가관리" desc="휴가 신청·결재 및 연차 자동 계산 (근로기준법)"
        action={<button className="btn pri" onClick={() => setOpen(true)}><i className="ti ti-plus" /> 휴가 신청</button>} />

      <div className="stat-grid section">
        <div className="stat">
          <div className="stat-l"><i className="ti ti-calendar-stats" /> 내 연차 (2026)</div>
          <div className="stat-v">{summary.remain}일</div>
          <div className="stat-s">사용 {summary.used} / 총 {summary.total}일</div>
          <div className="bar" style={{ marginTop: 8 }}><div style={{ width: `${summary.useRate}%` }} /></div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-calculator" /> 근속 기준 부여</div>
          <div className="stat-v">{myTotal}일</div>
          <div className="stat-s">입사일 {user?.date} 기준 자동 산정</div>
        </div>
        <div className="stat">
          <div className="stat-l"><i className="ti ti-clock" /> 승인 대기</div>
          <div className="stat-v">{leaves.filter((l) => l.status === '검토중').length}건</div>
          <div className="stat-s">결재 필요</div>
        </div>
      </div>

      <Card title="휴가 신청 내역" icon="ti-list">
        <div className="tw">
          <table className="tb">
            <thead><tr><th>사번</th><th>이름</th><th>부서</th><th>유형</th><th>기간</th><th className="num">일수</th><th>사유</th><th>결재자</th><th>상태</th></tr></thead>
            <tbody>
              {leaves.map((l) => (
                <tr key={l.id}>
                  <td>{l.empno}</td><td style={{ fontWeight: 600 }}>{l.name}</td><td>{l.dept}</td>
                  <td>{l.type}</td><td>{l.period}</td><td className="num">{l.days}일</td>
                  <td>{l.reason}</td><td>{l.approver}</td><td>{statusBadge(l.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="근로기준법 연차 부여 기준" icon="ti-scale" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.9 }}>
          1년 미만 <b>11일</b> · 1~3년 <b>15일</b> · 3~5년 <b>16일</b> · 5~10년 <b>17일</b> · 10~20년 <b>21일</b> · 20년 이상 <b>25일</b>
        </div>
      </Card>

      <Modal open={open} title="휴가 신청" onClose={() => setOpen(false)}
        footer={<><button className="btn" onClick={() => setOpen(false)}>취소</button><button className="btn pri" onClick={submit}>신청</button></>}>
        <label className="fld"><span>휴가 유형</span>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={selStyle}>
            <option>연차</option><option>월차</option><option>반차</option><option>병가</option>
          </select>
        </label>
        <label className="fld"><span>기간 (예: 2026-08-01~2026-08-02)</span>
          <input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} style={inStyle} placeholder="2026-08-01" />
        </label>
        <label className="fld"><span>일수</span>
          <input type="number" step="0.5" value={form.days} onChange={(e) => setForm({ ...form, days: Number(e.target.value) })} style={inStyle} />
        </label>
        <label className="fld"><span>사유</span>
          <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} style={inStyle} placeholder="개인 사유" />
        </label>
      </Modal>
    </>
  )
}

const inStyle: React.CSSProperties = { width: '100%', padding: '9px 11px', border: '0.5px solid var(--border-p)', borderRadius: 8, fontSize: 13, background: 'var(--bg-primary)', color: 'var(--text-primary)' }
const selStyle = inStyle
