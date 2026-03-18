'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Role = 'admin' | 'viewer' | null

interface AuthContextType {
  role: Role
  adminName: string
  login: (email: string, password: string) => Promise<boolean>
  loginAsViewer: (code: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('multapp_role')
    const name = localStorage.getItem('multapp_name')
    if (saved) { setRole(saved as Role); setAdminName(name || '') }
  }, [])

  const login = async (email: string, password: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.from('admins').select('*').eq('email', email).eq('password_hash', password).single()
    if (data) {
      setRole('admin'); setAdminName(data.name)
      localStorage.setItem('multapp_role', 'admin')
      localStorage.setItem('multapp_name', data.name)
      return true
    }
    return false
  }

  const loginAsViewer = async (code: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await supabase.from('team_settings').select('*').eq('viewer_code', code.toUpperCase()).single()
    if (data) {
      setRole('viewer')
      localStorage.setItem('multapp_role', 'viewer')
      return true
    }
    return false
  }

  const logout = () => {
    setRole(null); setAdminName('')
    localStorage.removeItem('multapp_role')
    localStorage.removeItem('multapp_name')
  }

  return (
    <AuthContext.Provider value={{ role, adminName, login, loginAsViewer, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}