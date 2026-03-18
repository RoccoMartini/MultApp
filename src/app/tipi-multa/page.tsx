'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { FineType } from '@/lib/database.types'
import { useAuth } from '@/context/AuthContext'

const TEAM_ID = '00000000-0000-0000-0000-000000000001'
const CATEGORIES = ['Presenze', 'Abbigliamento', 'Disciplina', 'Campo']

export default function FineTypesPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState<FineType | null>(null)
  const [showDelete, setShowDelete] = useState<FineType | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Presenze')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    const { data } = await supabase.from('fine_types').select('*').eq('is_active', true).order('amount')
    setFineTypes(data || [])
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => { setLabel(''); setAmount(''); setCategory('Presenze'); setShowAdd(true) }
  const openEdit = (ft: FineType) => { setLabel(ft.label); setAmount(ft.amount.toString()); setCategory(ft.category); setShowEdit(ft) }

  const save = async () => {
    if (!label.trim() || !amount) return
    setSaving(true)
    if (showEdit) {
      await supabase.from('fine_types').update({ label, amount: parseFloat(amount), category }).eq('id', showEdit.id)
      setShowEdit(null)
    } else {
      await supabase.from('fine_types').insert({ team_id: TEAM_ID, label, amount: parseFloat(amount), category })
      setShowAdd(false)
    }
    setSaving(false); fetchData()
  }

  const del = async (ft: FineType) => {
    await supabase.from('fine_types').update({ is_active: false }).eq('id', ft.id)
    setShowDelete(null); fetchData()
  }

  const overlay = "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
  const box = "bg-surface border border-border rounded-2xl w-[460px] max-w-[90vw] overflow-hidden shadow-2xl"
  const inp = "w-full bg-surface2 border border-border rounded-lg px-3 py-2.5 text-sm text-white placeholder-muted focus:outline-none focus:border-accent transition-colors"
  const btnP = "px-4 py-2 bg-accent text-black font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
  const btnS = "px-4 py-2 bg-surface2 border border-border text-muted text-sm rounded-lg hover:text-white transition-colors"
  const btnD = "px-4 py-2 bg-danger/10 border border-danger/30 text-danger text-sm rounded-lg hover:bg-danger/20 transition-colors"

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-bg">
          <div className="font-bebas text-[26px] tracking-[2px]">Tipi di Multa</div>
          {isAdmin && <button onClick={openAdd} className={btnP}>+ Tipo Multa</button>}
        </div>
        <div className="p-7 overflow-y-auto flex-1">
          <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-4">Regolamento Multe</div>
          <div className="flex flex-col gap-3">
            {fineTypes.map((ft, i) => (
              <div key={ft.id} className="bg-surface border border-border rounded-xl px-5 py-4 flex items-start gap-4 group">
                <div className="font-bebas text-[28px] text-accent leading-none min-w-[30px]">{i + 1}</div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium leading-snug mb-1">{ft.label}</div>
                  <div className="text-[11px] text-muted">{ft.category}</div>
                </div>
                <div className="font-bebas text-[28px] text-danger leading-none">€{ft.amount}</div>
                {isAdmin && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <button onClick={() => openEdit(ft)} className="w-8 h-8 rounded-lg bg-surface2 border border-border text-muted hover:text-white flex items-center justify-center text-sm transition-colors">✏️</button>
                    <button onClick={() => setShowDelete(ft)} className="w-8 h-8 rounded-lg bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 flex items-center justify-center text-sm transition-colors">🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {isAdmin && (showAdd || showEdit) && (
        <div className={overlay} onClick={() => { setShowAdd(false); setShowEdit(null) }}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px]">{showEdit ? 'Modifica Tipo Multa' : 'Nuovo Tipo Multa'}</div>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Descrizione *</label>
                <input className={inp} placeholder="es. Ritardo allenamento" value={label} onChange={e => setLabel(e.target.value)} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Importo (€) *</label>
                  <input className={inp} placeholder="es. 10" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div>
                  <label className="text-[11px] text-muted uppercase tracking-[1px] mb-1.5 block">Categoria</label>
                  <select className={inp} value={category} onChange={e => setCategory(e.target.value)}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {amount && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-[13px] text-muted">{label || 'Nuova multa'}</span>
                  <span className="font-bebas text-[20px] text-accent">€{amount}</span>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setShowEdit(null) }} className={btnS}>Annulla</button>
              <button onClick={save} disabled={saving || !label.trim() || !amount} className={btnP}>{saving ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showDelete && (
        <div className={overlay} onClick={() => setShowDelete(null)}>
          <div className={box} onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-border">
              <div className="font-bebas text-[22px] tracking-[2px] text-danger">Elimina Tipo Multa</div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px]">Eliminare questo tipo di multa?</p>
              <div className="mt-3 bg-surface2 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-[13px]">{showDelete.label}</span>
                <span className="font-bebas text-[20px] text-danger">€{showDelete.amount}</span>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-3">
              <button onClick={() => setShowDelete(null)} className={btnS}>Annulla</button>
              <button onClick={() => del(showDelete)} className={btnD}>Sì, elimina</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}