import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Member } from '../types'
import { api } from '../mock/api'

interface AuthCtx {
  user: Member | null
  login: (id: string, pw: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null)

  async function login(id: string, pw: string) {
    const u = await api.login(id, pw)
    setUser(u)
  }
  function logout() {
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth must be used within AuthProvider')
  return c
}
