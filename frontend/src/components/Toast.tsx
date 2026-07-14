import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'danger' | 'warning'
interface ToastItem { id: number; msg: string; kind: ToastKind }

const Ctx = createContext<(msg: string, kind?: ToastKind) => void>(() => {})

let seq = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const show = useCallback((msg: string, kind: ToastKind = 'info') => {
    const id = ++seq
    setItems((s) => [...s, { id, msg, kind }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 2600)
  }, [])

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-wrap">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>{t.msg}</div>
        ))}
      </div>
      <style>{`
        .toast-wrap { position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
        .toast { padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.15); animation: toastIn .2s; max-width: 320px; }
        .toast-info { background: var(--bg-info); color: var(--text-info); }
        .toast-success { background: var(--bg-success); color: var(--text-success); }
        .toast-danger { background: var(--bg-danger); color: var(--text-danger); }
        .toast-warning { background: var(--bg-warning); color: var(--text-warning); }
        @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </Ctx.Provider>
  )
}

export function useToast() {
  return useContext(Ctx)
}
