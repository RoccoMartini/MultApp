'use client'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import MonthFilter from '@/components/MonthFilter'
import { supabase } from '@/lib/supabase'
import { Fine, FineType, Player } from '@/lib/database.types'

interface PlayerWithFines extends Player {
  fines: (Fine & { fine_type: FineType })[]
}

interface ModalData {
  type: 'outstanding' | 'paid'
  players: PlayerWithFines[]
}

export default function DashboardPage() {
  const [month, setMonth] = useState('2025-03')
  const [fines, setFines] = useState<(Fine & { fine_type: FineType; player: Player })[]>([])
  const [modal, setModal] = useState<ModalData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFines = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('fines')
      .select('*, fine_type:fine_types(*), player:players(*)')
      .order('date', { ascending: false })

    if (month !== 'all') query = query.eq('month', month)

    const { data } = await query
    setFines((data as any) || [])
    setLoading(false)
  }, [month])

  useEffect(() => { fetchFines() }, [fetchFines])

  const total = fines.reduce((s, f) => s + Number(f.amount), 0)
  const paid = fines.filter(f => f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
  const outstanding = total - paid

  const playersWithFines = () => {
    const map = new Map<string, PlayerWithFines>()
    fines.forEach(f => {
      if (!map.has(f.player_id)) {
        map.set(f.player_id, { ...f.player, fines: [] })
      }
      map.get(f.player_id)!.fines.push({ ...f, fine_type: f.fine_type })
    })
    return Array.from(map.values())
  }

  const openModal = (type: 'outstanding' | 'paid') => {
    const all = playersWithFines()
    const filtered = all.map(p => ({
      ...p,
      fines: p.fines.filter(f => type === 'outstanding' ? !f.is_paid : f.is_paid)
    })).filter(p => p.fines.length > 0)
      .sort((a, b) => {
        const ta = a.fines.reduce((s, f) => s + Number(f.amount), 0)
        const tb = b.fines.reduce((s, f) => s + Number(f.amount), 0)
        return tb - ta
      })
    setModal({ type, players: filtered })
  }

  const togglePaid = async (fineId: string, current: boolean) => {
    await supabase.from('fines').update({ is_paid: !current }).eq('id', fineId)
    fetchFines()
  }

  const initials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
  const fmt = (n: number) => `€${n}`

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-bg sticky top-0 z-10">
          <div className="font-bebas text-[26px] tracking-[2px]">Dashboard</div>
          <MonthFilter value={month} onChange={setMonth} />
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-7">
            <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:bg-danger">
              <div className="text-[10px] uppercase tracking-[2px] text-muted mb-2">Totale Multe</div>
              <div className="font-bebas text-[38px] text-danger leading-none">{fmt(total)}</div>
              <div className="text-[11px] text-muted mt-1.5">{fines.length} sanzioni</div>
            </div>

            <button
              onClick={() => openModal('outstanding')}
              className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden text-left transition-colors hover:border-accent group"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-accent" />
              <div className="text-[10px] uppercase tracking-[2px] text-muted mb-2">Da Riscuotere</div>
              <div className="font-bebas text-[38px] text-accent leading-none">{fmt(outstanding)}</div>
              <div className="text-[11px] text-muted mt-1.5">{fines.filter(f => !f.is_paid).length} aperte</div>
              <div className="absolute bottom-3 right-3.5 text-[10px] text-accent tracking-[1px] uppercase font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Vedi chi ›</div>
            </button>

            <button
              onClick={() => openModal('paid')}
              className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden text-left transition-colors hover:border-success group"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-success" />
              <div className="text-[10px] uppercase tracking-[2px] text-muted mb-2">Già Saldato</div>
              <div className="font-bebas text-[38px] text-success leading-none">{fmt(paid)}</div>
              <div className="text-[11px] text-muted mt-1.5">{fines.filter(f => f.is_paid).length} saldate</div>
              <div className="absolute bottom-3 right-3.5 text-[10px] text-success tracking-[1px] uppercase font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Vedi chi ›</div>
            </button>
          </div>

          {/* Players summary */}
          <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-3">Riepilogo Giocatori</div>
          {loading ? (
            <div className="text-muted text-sm">Caricamento...</div>
          ) : (
            <div className="flex flex-col gap-2">
              {playersWithFines().sort((a, b) => {
                const ua = a.fines.filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                const ub = b.fines.filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                return ub - ua
              }).map(p => {
                const unpaid = p.fines.filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                return (
                  <div key={p.id} className="bg-surface border border-border rounded-xl px-4 py-3.5 flex items-center gap-3.5 hover:border-accent transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-[11px] font-semibold text-accent flex-shrink-0">
                      {initials(p.name)}
                    </div>
                    <div className="flex-1 text-sm font-medium">{p.name}</div>
                    <div className="flex items-center gap-2">
                      {unpaid > 0
                        ? <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20">{p.fines.filter(f => !f.is_paid).length} aperte</span>
                        : <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">✓ saldato</span>
                      }
                    </div>
                    <div className={`font-mono text-[13px] font-medium min-w-[60px] text-right ${unpaid > 0 ? 'text-danger' : 'text-success'}`}>
                      {unpaid > 0 ? fmt(unpaid) : fmt(p.fines.reduce((s, f) => s + Number(f.amount), 0))}
                    </div>
                  </div>
                )
              })}
              {playersWithFines().length === 0 && (
                <div className="text-center py-10 text-muted text-sm">🎉 Nessuna multa nel periodo selezionato</div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setModal(null)}>
          <div className="bg-surface border border-border rounded-2xl w-[460px] max-w-[90vw] max-h-[80vh] flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <div>
                <div className="font-bebas text-[22px] tracking-[2px]">
                  {modal.type === 'outstanding' ? 'Da Riscuotere' : 'Già Saldato'}
                </div>
                <div className="text-[11px] text-muted mt-0.5">
                  {modal.players.length} giocatori · {fmt(modal.players.reduce((s, p) => s + p.fines.reduce((sf, f) => sf + Number(f.amount), 0), 0))}
                </div>
              </div>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-surface2 border border-border text-muted hover:text-white flex items-center justify-center text-lg transition-colors">×</button>
            </div>
            <div className="overflow-y-auto p-3">
              {modal.players.length === 0 ? (
                <div className="py-10 text-center text-muted text-sm">
                  {modal.type === 'outstanding' ? '🎉 Tutti in regola!' : '📭 Nessun pagamento nel periodo'}
                </div>
              ) : modal.players.map(p => {
                const tot = p.fines.reduce((s, f) => s + Number(f.amount), 0)
                const color = modal.type === 'outstanding' ? 'text-accent' : 'text-success'
                return (
                  <details key={p.id} className="group">
                    <summary className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-surface2 list-none">
                      <div className={`w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${color}`}>
                        {initials(p.name)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-[11px] text-muted">{p.fines.length} multa{p.fines.length > 1 ? 'e' : ''}</div>
                      </div>
                      <div className={`font-mono text-sm font-semibold ${color}`}>{fmt(tot)}</div>
                      <div className="text-muted text-xs group-open:rotate-90 transition-transform">›</div>
                    </summary>
                    <div className="pl-14 pb-1">
                      {p.fines.map(f => (
                        <div key={f.id} className="flex items-center gap-2.5 py-1.5 text-[12px] text-muted">
                          <span className="font-mono text-[10px] min-w-[40px]">{f.date.slice(5).replace('-', '/')}</span>
                          <span className="flex-1">{f.fine_type.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-surface2 rounded">{f.fine_type.category}</span>
                          <span className={`font-mono font-semibold ${color}`}>{fmt(Number(f.amount))}</span>
                          <button
                            onClick={() => togglePaid(f.id, f.is_paid)}
                            className={`w-8 h-4.5 rounded-full relative transition-colors ${f.is_paid ? 'bg-success' : 'bg-border'}`}
                            style={{ width: 32, height: 18 }}
                          >
                            <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all ${f.is_paid ? 'left-[17px]' : 'left-[3px]'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
