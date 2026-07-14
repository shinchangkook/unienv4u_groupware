import { useState } from 'react'
import { api } from '../mock/api'
import { useApi, PageHeader, Card, statusBadge, Loading } from '../components/ui'

export default function Equip() {
  const { data: equipment } = useApi(() => api.listEquipment())
  const { data: incidents } = useApi(() => api.listIncidents())
  const [tab, setTab] = useState<'list' | 'incident'>('list')
  if (!equipment || !incidents) return <Loading />

  return (
    <>
      <PageHeader title="장비관리" desc="장비 대장 · 이상 보고서 · 교정 현황" action={<button className="btn pri"><i className="ti ti-plus" /> 이상 보고</button>} />
      <div className="tab-row">
        <div className={'tab' + (tab === 'list' ? ' on' : '')} onClick={() => setTab('list')}>장비 대장</div>
        <div className={'tab' + (tab === 'incident' ? ' on' : '')} onClick={() => setTab('incident')}>이상 보고서</div>
      </div>

      {tab === 'list' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>관리번호</th><th>장비명</th><th>규격</th><th>기기번호</th><th>제작사</th><th>주요 용도</th><th>교정 만료</th><th>상태</th></tr></thead>
              <tbody>
                {equipment.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td><td style={{ fontWeight: 600 }}>{e.name}</td><td>{e.spec}</td>
                    <td>{e.serial}</td><td>{e.maker}</td><td>{e.use}</td><td>{e.calibDue}</td>
                    <td>{statusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'incident' && (
        <Card>
          <div className="tw">
            <table className="tb">
              <thead><tr><th>보고서번호</th><th>장비</th><th>보고자</th><th>일자</th><th>증상</th><th>조치</th><th>상태</th></tr></thead>
              <tbody>
                {incidents.map((i) => (
                  <tr key={i.incNo}>
                    <td style={{ fontWeight: 600 }}>{i.incNo}</td><td>{i.equip}</td><td>{i.reporter}</td>
                    <td>{i.date}</td><td>{i.symptom}</td><td>{i.action}</td><td>{statusBadge(i.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
