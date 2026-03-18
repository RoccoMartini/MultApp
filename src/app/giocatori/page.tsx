'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import MonthFilter from '@/components/MonthFilter'
import { supabase } from '@/lib/supabase'
import { Fine, FineType, Player } from '@/lib/database.types'

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [fines, setFines] = useState<(Fine & { fine_type: FineType })[]>([])
  const [selected, setSelected] = useState<Player | null>(null)
  const [month, setMonth] = useState('2025-03')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: pData }, { data: fData }] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true).order('name'),
      (() => {
        let q = supabase.from('fines').select('*, fine_type:fine_types(*)')
        if (month !== 'all') q = q.eq('month', month)
        return q
      })()
    ])
    setPlayers(pData || [])
    setFines((fData as any) || [])
    setLoading(false)
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const playerFines = (playerId: string) => fines.filter(f => f.player_id === playerId)

  const togglePaid = async (fineId: string, current: boolean) => {
    await supabase.from('fines').update({ is_paid: !current }).eq('id', fineId)
    fetchData()
  }

  const fmt = (n: number) => `€${n}`
  const initials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-bg">
          <div className="font-bebas text-[26px] tracking-[2px]">Giocatori</div>
          <MonthFilter value={month} onChange={setMonth} />
        </div>

        <div className="flex-1 overflow-hidden p-7">
          <div className="grid grid-cols-[280px_1fr] gap-5 h-full">
            {/* Players list */}
            <div className="flex flex-col overflow-hidden">
              <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-3 flex-shrink-0">
                Rosa <span className="text-[12px] font-sans font-normal tracking-normal text-muted">— {players.length} giocatori</span>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {players.map(p => {
                  const pFines = playerFines(p.id)
                  const unpaid = pFines.filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                  const isSelected = selected?.id === p.id
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all border flex-shrink-0 ${
                        isSelected ? 'bg-[#1f1f00] border-accent' : 'bg-surface border-border hover:border-accent/50'
                      }`}
                    >
                      <div className="w-[30px] h-[30px] rounded-full bg-surface2 border border-border flex items-center justify-center text-[11px] font-semibold text-accent flex-shrink-0">
                        {initials(p.name)}
                      </div>
                      <div className="flex-1 text-[13px] font-medium">{p.name}</div>
                      {pFines.length > 0 ? (
                        <div className={`font-mono text-[12px] ${unpaid > 0 ? 'text-danger' : 'text-success'}`}>
                          {unpaid > 0 ? fmt(unpaid) : '✓'}
                        </div>
                      ) : (
                        <div className="text-[11px] text-border">—</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex flex-col overflow-hidden">
              <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-3 flex-shrink-0">
                {selected ? selected.name : 'Seleziona un giocatore'}
              </div>
              <div className="flex-1 overflow-y-auto">
                {!selected ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted gap-3">
                    <div className="text-[40px]">👈</div>
                    <div className="text-[13px]">Clicca su un giocatore per vedere le sue multe</div>
                  </div>
                ) : (() => {
                  const pFines = playerFines(selected.id)
                  const total = pFines.reduce((s, f) => s + Number(f.amount), 0)
                  const paid = pFines.filter(f => f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                  const unpaid = total - paid

                  if (pFines.length === 0) {
                    return (
                      <div className="bg-surface border border-border rounded-xl p-10 text-center text-muted text-[13px]">
                        <div className="text-[32px] mb-2">✅</div>
                        Nessuna multa nel periodo selezionato
                      </div>
                    )
                  }

                  return (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                        <div>
                          <div className="font-bebas text-[22px] tracking-[2px]">{selected.name}</div>
                          <div className="text-[11px] text-muted">{pFines.length} sanzioni nel periodo</div>
                        </div>
                        <div className="flex gap-5">
                          <div className="text-right">
                            <div className="text-[10px] text-muted uppercase tracking-[1px]">Da pagare</div>
                            <div className="font-bebas text-[22px] text-danger">{fmt(unpaid)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-muted uppercase tracking-[1px]">Saldato</div>
                            <div className="font-bebas text-[22px] text-success">{fmt(paid)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        {pFines.map(fine => (
                          <div key={fine.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface2 transition-colors">
                            <div className="font-mono text-[11px] text-muted min-w-[50px]">
                              {fine.date.slice(5).replace('-', '/')}
                            </div>
                            <div className="flex-1">
                              <div className="text-[13px]">{fine.fine_type.label}</div>
                              <span className="text-[10px] text-muted bg-surface2 px-1.5 py-0.5 rounded">{fine.fine_type.category}</span>
                            </div>
                            <div className={`font-mono text-[13px] font-medium min-w-[55px] text-right ${fine.is_paid ? 'text-success line-through opacity-60' : 'text-danger'}`}>
                              {fmt(Number(fine.amount))}
                            </div>
                            <button
                              onClick={() => togglePaid(fine.id, fine.is_paid)}
                              className={`rounded-full relative transition-colors flex-shrink-0 ${fine.is_paid ? 'bg-success' : 'bg-border'}`}
                              style={{ width: 32, height: 18 }}
                            >
                              <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all ${fine.is_paid ? 'left-[17px]' : 'left-[3px]'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
