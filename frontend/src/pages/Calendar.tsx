import { api } from '../mock/api'
import { useApi, PageHeader, Card, Badge, Loading } from '../components/ui'
import type { CalendarEvent } from '../types'

const TYPE_KIND: Record<string, 'info' | 'ok' | 'warn' | 'dng' | 'mut'> = {
  회의: 'info', 출장: 'warn', 휴가: 'ok', 기타: 'mut',
}

export default function Calendar() {
  const { data } = useApi(() => api.listEvents())
  if (!data) return <Loading />

  // 2026년 7월 미니 캘린더 (데모 고정월)
  const year = 2026, month = 7
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const byDay = new Map<number, CalendarEvent[]>()
  data.forEach((e) => {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() + 1 === month) {
      const day = d.getDate()
      byDay.set(day, [...(byDay.get(day) || []), e])
    }
  })
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <>
      <PageHeader title="일정 / 캘린더" desc="2026년 7월" action={<button className="btn pri"><i className="ti ti-plus" /> 일정 등록</button>} />
      <div className="grid-2">
        <Card>
          <div className="cal">
            {['일', '월', '화', '수', '목', '금', '토'].map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((day, i) => (
              <div key={i} className={'cal-cell' + (day ? '' : ' empty')}>
                {day && <>
                  <div className="cal-day">{day}</div>
                  {(byDay.get(day) || []).map((e) => (
                    <div key={e.id} className={`cal-ev ev-${e.type}`}>{e.title}</div>
                  ))}
                </>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="다가오는 일정" icon="ti-calendar-event">
          <div className="tw">
            <table className="tb">
              <thead><tr><th>날짜</th><th>일정</th><th>유형</th><th>담당</th></tr></thead>
              <tbody>
                {data.map((e) => (
                  <tr key={e.id}><td>{e.date}</td><td style={{ fontWeight: 600 }}>{e.title}</td><td><Badge kind={TYPE_KIND[e.type]}>{e.type}</Badge></td><td>{e.owner}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <style>{`
        .cal { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
        .cal-dow { text-align: center; font-size: 11px; font-weight: 700; color: var(--text-tertiary); padding: 4px 0; }
        .cal-cell { min-height: 62px; border: 0.5px solid var(--border-s); border-radius: 6px; padding: 4px; font-size: 10px; }
        .cal-cell.empty { border: none; }
        .cal-day { font-size: 11px; font-weight: 600; color: var(--text-secondary); }
        .cal-ev { margin-top: 2px; padding: 1px 4px; border-radius: 4px; font-size: 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ev-회의 { background: var(--bg-info); color: var(--text-info); }
        .ev-출장 { background: var(--bg-warning); color: var(--text-warning); }
        .ev-휴가 { background: var(--bg-success); color: var(--text-success); }
        .ev-기타 { background: var(--bg-tertiary); color: var(--text-secondary); }
      `}</style>
    </>
  )
}
