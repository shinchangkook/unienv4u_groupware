import { useState } from 'react'
import { api, genManageNo } from '../mock/api'
import { useApi, PageHeader, Card, statusBadge, Badge, won, Loading } from '../components/ui'

const ITEM_KIND: Record<string, 'info' | 'ok' | 'warn' | 'dng'> = { 수질: 'info', 대기: 'warn', 소음: 'ok', 토양: 'dng' }

export default function Env() {
  const { data } = useApi(() => api.listEnvReports())
  const [year, setYear] = useState('2026')
  const [code, setCode] = useState('CL-001')
  const [preview, setPreview] = useState('')
  if (!data) return <Loading />

  return (
    <>
      <PageHeader title="환경질현황" desc="환경측정 성적서 작성·조회 및 관리번호 자동 채번" action={<button className="btn pri"><i className="ti ti-plus" /> 성적서 작성</button>} />

      <Card title="관리번호 자동생성 (연도-발주처코드-순번)" icon="ti-hash">
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label className="fld" style={{ margin: 0 }}><span>연도</span><input value={year} onChange={(e) => setYear(e.target.value)} style={{ width: 90 }} /></label>
          <label className="fld" style={{ margin: 0 }}><span>발주처 코드</span><input value={code} onChange={(e) => setCode(e.target.value)} style={{ width: 120 }} /></label>
          <button className="btn" onClick={() => setPreview(genManageNo(year, code, '', data))}><i className="ti ti-wand" /> 채번</button>
          {preview && <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15, paddingBottom: 6 }}>{preview}</div>}
        </div>
      </Card>

      <Card title="성적서 목록" icon="ti-file-analytics" style={{ marginTop: 16 }}>
        <div className="tw">
          <table className="tb">
            <thead><tr><th>관리번호</th><th>연도</th><th>발주처</th><th>측정 항목</th><th className="num">금액</th><th>측정일</th><th>잠금</th><th>상태</th></tr></thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.mno}>
                  <td style={{ fontWeight: 600 }}>{e.mno}</td><td>{e.year}</td><td>{e.client}</td>
                  <td><Badge kind={ITEM_KIND[e.item]}>{e.item}</Badge></td>
                  <td className="num">{won(e.amount)}</td><td>{e.date}</td>
                  <td>{e.locked ? <i className="ti ti-lock" style={{ color: 'var(--text-tertiary)' }} /> : <i className="ti ti-lock-open" style={{ color: 'var(--text-success)' }} />}</td>
                  <td>{statusBadge(e.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
