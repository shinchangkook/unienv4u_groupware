import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import './login.css'

const DEMO = [
  { label: '마스터 (대표이사)', id: 'admin@unienv4u.com', pw: 'admin1234' },
  { label: '팀장 (측정조사팀)', id: 'jo@unienv4u.com', pw: 'jo123456' },
  { label: '일반 (홍길동)', id: 'hong@unienv4u.com', pw: 'hong1234' },
]

export default function Login() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function doLogin(idv = id, pwv = pw) {
    setErr(''); setBusy(true)
    try {
      await login(idv, pwv)
      nav('/dash')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo" style={{ width: 44, height: 44, fontSize: 22 }}>U</div>
          <h1>유앤아이환경기술(주)</h1>
          <p>통합 그룹웨어 시스템 · MVP</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); doLogin() }}>
          <label className="fld">
            <span>아이디</span>
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="이메일 또는 아이디" autoFocus />
          </label>
          <label className="fld">
            <span>비밀번호</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
          </label>
          {err && <div className="login-err">{err}</div>}
          <button className="btn pri" type="submit" disabled={busy} style={{ width: '100%', justifyContent: 'center', padding: 11, marginTop: 4 }}>
            {busy ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <div className="demo">
          <div className="demo-t">데모 계정 (클릭 시 자동 로그인)</div>
          {DEMO.map((d) => (
            <button key={d.id} className="demo-btn" onClick={() => { setId(d.id); setPw(d.pw); doLogin(d.id, d.pw) }}>
              <span>{d.label}</span><small>{d.id}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
