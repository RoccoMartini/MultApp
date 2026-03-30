'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import Sidebar from '@/components/Sidebar'
import MonthFilter from '@/components/MonthFilter'
import { supabase } from '@/lib/supabase'
import { Fine, FineType, Player } from '@/lib/database.types'
import { useAuth } from '@/context/AuthContext'

const TEAM_ID = '00000000-0000-0000-0000-000000000001'

export default function PlayersPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [players, setPlayers] = useState<Player[]>([])
  const [fines, setFines] = useState<(Fine & { fine_type: FineType })[]>([])
  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [selected, setSelected] = useState<Player | null>(null)
  const [month, setMonth] = useState('all')
  const [sortBy, setSortBy] = useState<'name' | 'amount'>('name')
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showEditPlayer, setShowEditPlayer] = useState<Player | null>(null)
  const [showAddFine, setShowAddFine] = useState(false)
  const [showDeletePlayer, setShowDeletePlayer] = useState<Player | null>(null)
  const [showDeleteFine, setShowDeleteFine] = useState<(Fine & { fine_type: FineType }) | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [playerNumber, setPlayerNumber] = useState('')
  const [playerRole, setPlayerRole] = useState('')
  const [fineTypeId, setFineTypeId] = useState('')
  const [fineDate, setFineDate] = useState(new Date().toISOString().slice(0, 10))
  const [fineNote, setFineNote] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const isCustomFine = fineTypeId === 'custom'

  const fetchData = useCallback(async () => {
    const [{ data: pData }, { data: fData }, { data: ftData }] = await Promise.all([
      supabase.from('players').select('*').eq('is_active', true).order('name'),
      (() => { let q = supabase.from('fines').select('*, fine_type:fine_types(*)'); if (month !== 'all') q = q.eq('month', month); return q })(),
      supabase.from('fine_types').select('*').eq('is_active', true).order('amount'),
    ])
    setPlayers(pData || [])
    setFines((fData as any) || [])
    setFineTypes(ftData || [])
  }, [month])

  useEffect(() => { fetchData() }, [fetchData])

  const playerFines = (id: string) => fines.filter(f => f.player_id === id)

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    const ua = playerFines(a.id).filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
    const ub = playerFines(b.id).filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
    return ub - ua
  })

  const savePlayer = async () => {
    if (!playerName.trim()) return
    setSaving(true)
    if (showEditPlayer) {
      await supabase.from('players').update({ name: playerName, number: playerNumber ? parseInt(playerNumber) : null, role: playerRole || null }).eq('id', showEditPlayer.id)
      setShowEditPlayer(null)
    } else {
      await supabase.from('players').insert({ team_id: TEAM_ID, name: playerName, number: playerNumber ? parseInt(playerNumber) : null, role: playerRole || null })
      setShowAddPlayer(false)
    }
    setPlayerName(''); setPlayerNumber(''); setPlayerRole('')
    setSaving(false); fetchData()
  }

  const deletePlayer = async (p: Player) => {
    await supabase.from('players').update({ is_active: false }).eq('id', p.id)
    setShowDeletePlayer(null)
    if (selected?.id === p.id) setSelected(null)
    fetchData()
  }

  const saveFine = async () => {
    if (!selected) return
    if (isCustomFine && (!customLabel.trim() || !customAmount)) return
    if (!isCustomFine && !fineTypeId) return
    setSaving(true)

    if (isCustomFine) {
      // Multa personalizzata — salviamo direttamente senza fine_type_id
      const { data: ft } = await supabase.from('fine_types').insert({
        team_id: TEAM_ID, label: customLabel, amount: parseFloat(customAmount), category: 'Altro', is_active: false
      }).select().single()
      if (ft) {
        await supabase.from('fines').insert({
          team_id: TEAM_ID, player_id: selected.id, fine_type_id: ft.id,
          label: customLabel, amount: parseFloat(customAmount), date: fineDate,
          month: fineDate.slice(0, 7), is_paid: false, note: fineNote || null,
        })
      }
    } else {
      const ft = fineTypes.find(f => f.id === fineTypeId)!
      await supabase.from('fines').insert({
        team_id: TEAM_ID, player_id: selected.id, fine_type_id: fineTypeId,
        label: ft.label, amount: ft.amount, date: fineDate,
        month: fineDate.slice(0, 7), is_paid: false, note: fineNote || null,
      })
    }

    setShowAddFine(false); setFineTypeId(''); setFineNote('')
    setCustomLabel(''); setCustomAmount('')
    setFineDate(new Date().toISOString().slice(0, 10))
    setSaving(false); fetchData()
  }

  const deleteFine = async (fine: Fine) => {
    await supabase.from('fines').delete().eq('id', fine.id)
    setShowDeleteFine(null); fetchData()
  }

  const togglePaid = async (id: string, current: boolean) => {
    if (!isAdmin) return
    await supabase.from('fines').update({ is_paid: !current }).eq('id', id)
    fetchData()
  }

  const openAddPlayer = () => { setPlayerName(''); setPlayerNumber(''); setPlayerRole(''); setShowAddPlayer(true) }
  const openEditPlayer = (p: Player) => { setPlayerName(p.name); setPlayerNumber(p.number?.toString() || ''); setPlayerRole(p.role || ''); setShowEditPlayer(p) }
  const fmt = (n: number) => `€${n}`
  const initials = (name: string) => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)

  const overlay = "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
  const box = "bg-surface border border-border rounded-2xl w-[420px] max-w-[90vw] overflow-hidden shadow-2xl"
  const inp = "w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
  const btnP = "px-4 py-2 bg-accent text-black font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
  const btnS = "px-4 py-2 bg-surface2 border border-border text-muted text-sm rounded-lg hover:text-white transition-colors"
  const btnD = "px-4 py-2 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg hover:bg-danger/20 transition-colors"

  const canSaveFine = isCustomFine
    ? customLabel.trim() !== '' && customAmount !== ''
    : fineTypeId !== ''

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-bg">
          <div className="font-bebas text-[26px] tracking-[2px]">Giocatori</div>
          <div className="flex items-center gap-3">
            <MonthFilter value={month} onChange={setMonth} />
            <div className="flex rounded-lg border border-border overflow-hidden text-[12px]">
              <button onClick={() => setSortBy('name')} className={`px-3 py-1.5 transition-colors ${sortBy === 'name' ? 'bg-accent text-black font-semibold' : 'text-muted hover:text-white'}`}>A→Z</button>
              <button onClick={() => setSortBy('amount')} className={`px-3 py-1.5 transition-colors border-l border-border ${sortBy === 'amount' ? 'bg-accent text-black font-semibold' : 'text-muted hover:text-white'}`}>€</button>
            </div>
            {isAdmin && <button onClick={openAddPlayer} className={btnP}>+ Giocatore</button>}
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-7">
          <div className="grid grid-cols-[280px_1fr] gap-5 h-full">
            <div className="flex flex-col overflow-hidden">
              <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-3 flex-shrink-0">
                Rosa <span className="text-[12px] font-sans font-normal tracking-normal">— {players.length} giocatori</span>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-1">
                {sortedPlayers.map(p => {
                  const pf = playerFines(p.id)
                  const unpaid = pf.filter(f => !f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                  const isSel = selected?.id === p.id
                  return (
                    <div key={p.id} onClick={() => setSelected(p)}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg cursor-pointer transition-all border flex-shrink-0 ${isSel ? 'bg-[#1f1f00] border-accent' : 'bg-surface border-border hover:border-accent/50'}`}>
                      <div className="w-[30px] h-[30px] rounded-full bg-surface2 border border-border flex items-center justify-center text-[11px] font-semibold text-accent flex-shrink-0">{initials(p.name)}</div>
                      <div className="flex-1 text-[13px] font-medium">{p.name}</div>
                      {pf.length > 0
                        ? <div className={`font-mono text-[12px] ${unpaid > 0 ? 'text-danger' : 'text-success'}`}>{unpaid > 0 ? fmt(unpaid) : '✓'}</div>
                        : <div className="text-[11px] text-border">—</div>}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col overflow-hidden">
              <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-3 flex-shrink-0 flex items-center justify-between">
                <span>{selected ? selected.name : 'Seleziona un giocatore'}</span>
                {selected && isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddFine(true)} className={btnP}>+ Multa</button>
                    <button onClick={() => openEditPlayer(selected)} className={btnS}>✏️</button>
                    <button onClick={() => setShowDeletePlayer(selected)} className={btnD}>🗑️</button>
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {!selected ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted gap-3">
                    <div className="text-[40px]">👈</div>
                    <div className="text-[13px]">Clicca su un giocatore per vedere le sue multe</div>
                  </div>
                ) : (() => {
                  const pf = playerFines(selected.id)
                  const paid = pf.filter(f => f.is_paid).reduce((s, f) => s + Number(f.amount), 0)
                  const unpaid = pf.reduce((s, f) => s + Number(f.amount), 0) - paid
                  if (pf.length === 0) return (
                    <div className="bg-surface border border-border rounded-xl p-10 text-center text-muted text-[13px]">
                      <div className="text-[32px] mb-2">✅</div>
                      Nessuna multa nel periodo selezionato
                      {isAdmin && <> — <button onClick={() => setShowAddFine(true)} className="text-accent underline">aggiungine una</button></>}
                    </div>
                  )
                  return (
                    <div className="bg-surface border border-border rounded-xl overflow-hidden">
                      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                        <div>
                          <div className="font-bebas text-[22px] tracking-[2px]">{selected.name}</div>
                          <div className="text-[11px] text-muted">{pf.length} sanzioni nel periodo</div>
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
                        {pf.map(fine => (
                          <div key={fine.id} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface2 transition-colors group">
                            <div className="font-mono text-[11px] text-muted min-w-[50px]">{fine.date.slice(5).replace('-', '/')}</div>
                            <div className="flex-1">
                              <div className="text-[13px]">{fine.label}</div>
                              <div className="flex gap-2 mt-0.5">
                                <span className="text-[10px] text-muted bg-surface2 px-1.5 py-0.5 rounded">{fine.fine_type?.category || 'Altro'}</span>
                                {fine.note && <span className="text-[10px] text-muted italic">{fine.note}</span>}
                              </div>
                            </div>
                            <div className={`font-mono text-[13px] font-medium min-w-[55px] text-right ${fine.is_paid ? 'text-success line-through opacity-60' : 'text-danger'}`}>{fmt(Number(fine.amount))}</div>
                            {isAdmin ? (
                              <>
                                <button onClick={() => togglePaid(fine.id, fine.is_paid)}
                                  className={`rounded-full relative transition-colors flex-shrink-0 ${fine.is_paid ? 'bg-success' : 'bg-border'}`}
                                  style={{ width: 32, height: 18 }}>
                                  <span className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-all ${fine.is_paid ? 'left-[17px]' : 'left-[3px]'}`} />
                                </button>
                                <button onClick={() => setShowDeleteFine(fine)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted hover:text-danger text-sm">🗑️</button>
                              </>
                            ) : (
                              <div className={`text-[10px] px-2 py-0.5 rounded font-medium ${fine.is_paid ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                {fine.is_paid ? 'Saldato' : 'Da pagare'}
                              </div>
                            )}
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

      {isAdmin && (showAddPlayer || showEditPlayer) && (
        <div className={overlay} onClick={() => { setShowAddPlayer(false); setShowEditPlayer(null) }}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px]">{showEditPlayer ? 'Modifica Giocatore' : 'Nuovo Giocatore'}</div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Nome e Cognome *</label>
                <input className={inp} placeholder="es. Rossi Mario" value={playerName} onChange={e => setPlayerName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && savePlayer()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">N° maglia</label>
                  <input className={inp} placeholder="es. 10" type="number" value={playerNumber} onChange={e => setPlayerNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Ruolo</label>
                  <input className={inp} placeholder="es. Portiere" value={playerRole} onChange={e => setPlayerRole(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => { setShowAddPlayer(false); setShowEditPlayer(null) }} className={btnS}>Annulla</button>
              <button onClick={savePlayer} disabled={saving || !playerName.trim()} className={btnP}>{saving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showAddFine && selected && (
        <div className={overlay} onClick={() => setShowAddFine(false)}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px]">Nuova Multa</div>
              <div className="text-[12px] text-muted mt-0.5">per {selected.name}</div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Tipo di multa *</label>
                <select className={inp} value={fineTypeId} onChange={e => setFineTypeId(e.target.value)}>
                  <option value="">Seleziona...</option>
                  {fineTypes.map(ft => <option key={ft.id} value={ft.id}>€{ft.amount} — {ft.label}</option>)}
                  <option value="custom">✏️ Altro (importo personalizzato)</option>
                </select>
              </div>

              {isCustomFine && (
                <>
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Causale *</label>
                    <input className={inp} placeholder="es. Comportamento scorretto in allenamento" value={customLabel} onChange={e => setCustomLabel(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Importo (€) *</label>
                    <input className={inp} placeholder="es. 15" type="number" value={customAmount} onChange={e => setCustomAmount(e.target.value)} />
                  </div>
                </>
              )}

              {!isCustomFine && fineTypeId && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px]">{fineTypes.find(f => f.id === fineTypeId)?.label}</span>
                  <span className="font-bebas text-[20px] text-accent">€{fineTypes.find(f => f.id === fineTypeId)?.amount}</span>
                </div>
              )}

              {isCustomFine && customLabel && customAmount && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px]">{customLabel}</span>
                  <span className="font-bebas text-[20px] text-accent">€{customAmount}</span>
                </div>
              )}

              <div>
                <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Data</label>
                <input className={inp} type="date" value={fineDate} onChange={e => setFineDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Note (opzionale)</label>
                <input className={inp} placeholder="es. Partita di campionato" value={fineNote} onChange={e => setFineNote(e.target.value)} />
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setShowAddFine(false)} className={btnS}>Annulla</button>
              <button onClick={saveFine} disabled={saving || !canSaveFine} className={btnP}>{saving ? 'Salvataggio...' : 'Aggiungi Multa'}</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showDeletePlayer && (
        <div className={overlay} onClick={() => setShowDeletePlayer(null)}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px] text-danger">Rimuovi Giocatore</div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px]">Rimuovere <strong>{showDeletePlayer.name}</strong> dalla rosa?</p>
              <p className="text-[12px] text-muted mt-1">Le multe esistenti rimarranno nel database.</p>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setShowDeletePlayer(null)} className={btnS}>Annulla</button>
              <button onClick={() => deletePlayer(showDeletePlayer)} className={btnD}>Sì, rimuovi</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showDeleteFine && (
        <div className={overlay} onClick={() => setShowDeleteFine(null)}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px] text-danger">Elimina Multa</div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px]">Eliminare questa multa?</p>
              <div className="mt-3 bg-surface2 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-[13px]">{showDeleteFine.label}</span>
                <span className="text-danger font-mono">€{showDeleteFine.amount}</span>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setShowDeleteFine(null)} className={btnS}>Annulla</button>
              <button onClick={() => deleteFine(showDeleteFine)} className={btnD}>Sì, elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}