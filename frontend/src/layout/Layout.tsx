import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { canAccess } from '../lib/permissions'
import { MENU } from './menu'
import './layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  if (!user) return null

  const initials = user.name.slice(0, 2)

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">U</div>
          <div>
            <div className="brand-name">유앤아이환경기술</div>
            <div className="brand-sub">그룹웨어 MVP</div>
          </div>
        </div>

        <nav className="nav">
          {MENU.map((g) => {
            const items = g.items.filter((it) => canAccess(user, it.id))
            if (items.length === 0) return null
            return (
              <div className="nav-group" key={g.group}>
                <div className="nav-group-t">{g.group}</div>
                {items.map((it) => (
                  <NavLink key={it.id} to={it.path} className={({ isActive }) => 'ni' + (isActive ? ' on' : '')}>
                    <i className={`ti ${it.icon}`} />
                    <span>{it.label}</span>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        <div className="sb-usr">
          <div className="ava">{initials}</div>
          <div className="usr-meta">
            <div className="usr-name">
              {user.name} ({user.rank})
              {user.isAdmin && <span className="bx b-info" style={{ marginLeft: 4 }}>마스터</span>}
            </div>
            <div className="usr-dept">{user.dept}</div>
          </div>
          <button className="btn sm" onClick={() => { logout(); nav('/login') }}>로그아웃</button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
