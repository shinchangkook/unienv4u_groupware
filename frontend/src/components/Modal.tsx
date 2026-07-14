import type { ReactNode } from 'react'

export default function Modal({ open, title, onClose, children, footer }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="mo-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mo">
        <div className="mo-h">
          <span>{title}</span>
          <button className="mo-x" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="mo-b">{children}</div>
        {footer && <div className="mo-f">{footer}</div>}
      </div>
      <style>{`
        .mo-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 5000; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .mo { background: var(--bg-primary); border-radius: var(--radius-lg); width: 100%; max-width: 460px; max-height: 88vh; overflow: auto; box-shadow: 0 16px 48px rgba(0,0,0,.3); animation: toastIn .15s; }
        .mo-h { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px; border-bottom: 0.5px solid var(--border-s); font-weight: 700; font-size: 14px; }
        .mo-x { background: none; border: none; cursor: pointer; color: var(--text-tertiary); font-size: 18px; display: flex; }
        .mo-b { padding: 18px; }
        .mo-f { padding: 14px 18px; border-top: 0.5px solid var(--border-s); display: flex; justify-content: flex-end; gap: 8px; }
      `}</style>
    </div>
  )
}
