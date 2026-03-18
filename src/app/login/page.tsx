'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function LoginPage() {
  const { login, loginAsViewer } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'viewer' | 'admin'>('viewer')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleViewer = async () => {
    setLoading(true); setError('')
    const ok = await loginAsViewer(code)
    if (ok) router.push('/')
    else setError('Codice non valido. Riprova.')
    setLoading(false)
  }

  const handleAdmin = async () => {
    setLoading(true); setError('')
    const ok = await login(email, password)
    if (ok) router.push('/')
    else setError('Email o password errati.')
    setLoading(false)
  }

  const inp = "w-full bg-surface2 border border-border rounded-lg px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="font-bebas text-[52px] tracking-[6px] text-accent leading-none">MultApp</div>
          <div className="text-[11px] text-muted tracking-[3px] uppercase mt-1">Gestione Multe Squadra</div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button onClick={() => { setTab('viewer'); setError('') }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${tab === 'viewer' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}>
              👥 Visualizza
            </button>
            <button onClick={() => { setTab('admin'); setError('') }}
              className={`flex-1 py-3.5 text-sm font-medium transition-colors ${tab === 'admin' ? 'bg-accent text-black' : 'text-muted hover:text-white'}`}>
              🔐 Admin
            </button>
          </div>

          <div className="p-6">
            {tab === 'viewer' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Codice Squadra</label>
                  <input className={inp} placeholder="es. AQUILE2526" value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleViewer()} autoFocus />
                </div>
                <p className="text-[11px] text-muted">Inserisci il codice fornito dal tuo allenatore per accedere in sola lettura.</p>
                {error && <p className="text-[12px] text-danger">{error}</p>}
                <button onClick={handleViewer} disabled={loading || !code.trim()}
                  className="w-full py-3 bg-accent text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                  {loading ? 'Accesso...' : 'Entra come Spettatore'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Email</label>
                  <input className={inp} type="email" placeholder="admin@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Password</label>
                  <input className={inp} type="password" placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdmin()} />
                </div>
                {error && <p className="text-[12px] text-danger">{error}</p>}
                <button onClick={handleAdmin} disabled={loading || !email || !password}
                  className="w-full py-3 bg-accent text-black font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                  {loading ? 'Accesso...' : 'Accedi come Admin'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}