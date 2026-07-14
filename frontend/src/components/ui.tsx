import { useEffect, useState, type ReactNode } from 'react'

// 데이터 로딩 훅 — mock API(Promise) 소비
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true)
    fn().then((d) => { if (alive) { setData(d); setLoading(false) } })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return { data, loading }
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="page-h" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ title, icon, children, style }: { title?: string; icon?: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={style}>
      {title && <div className="card-h">{icon && <i className={`ti ${icon}`} />}{title}</div>}
      {children}
    </div>
  )
}

export function Badge({ kind, children }: { kind: 'info' | 'ok' | 'warn' | 'dng' | 'mut'; children: ReactNode }) {
  const cls = { info: 'b-info', ok: 'b-ok', warn: 'b-warn', dng: 'b-dng', mut: 'b-mut' }[kind]
  return <span className={`bx ${cls}`}>{children}</span>
}

export function statusBadge(status: string) {
  const map: Record<string, 'info' | 'ok' | 'warn' | 'dng' | 'mut'> = {
    검토중: 'warn', 승인: 'ok', 반려: 'dng', 완료: 'ok', 진행: 'info', 대손: 'dng',
    작성중: 'warn', 결재: 'info', 접수: 'mut', 수리중: 'warn', 정상: 'ok', 이상: 'dng', 점검: 'warn',
  }
  return <Badge kind={map[status] || 'mut'}>{status}</Badge>
}

export function won(n: number): string {
  return '₩' + n.toLocaleString('ko-KR')
}

export function Loading() {
  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>불러오는 중…</div>
}

export function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>{msg}</div>
}
