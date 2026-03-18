'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'
import { FineType } from '@/lib/database.types'

const CATEGORIES = ['Presenze', 'Abbigliamento', 'Disciplina', 'Campo']

export default function FineTypesPage() {
  const [fineTypes, setFineTypes] = useState<FineType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('fine_types').select('*').order('category').then(({ data }) => {
      setFineTypes(data || [])
      setLoading(false)
    })
  }, [])

  const fmt = (n: number) => `€${n}`

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="px-7 py-5 border-b border-border flex items-center justify-between bg-bg">
          <div className="font-bebas text-[26px] tracking-[2px]">Tipi di Multa</div>
        </div>

        <div className="p-7 overflow-y-auto flex-1">
          <div className="font-bebas text-[18px] tracking-[2px] text-muted mb-4">Regolamento Multe</div>

          {loading ? (
            <div className="text-muted text-sm">Caricamento...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {fineTypes.map((ft, i) => (
                <div key={ft.id} className="bg-surface border border-border rounded-xl px-5 py-4 flex items-start gap-4">
                  <div className="font-bebas text-[28px] text-accent leading-none min-w-[30px]">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-[14px] font-medium leading-snug mb-1">{ft.label}</div>
                    <div className="text-[11px] text-muted">{ft.category}</div>
                  </div>
                  <div className="font-bebas text-[28px] text-danger leading-none">{fmt(ft.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
