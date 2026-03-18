'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '⚡' },
  { href: '/giocatori', label: 'Giocatori', icon: '👥' },
  { href: '/tipi-multa', label: 'Tipi Multa', icon: '📋' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-[220px] bg-surface border-r border-border flex flex-col flex-shrink-0 h-screen">
      <div className="px-5 pt-7 pb-5 border-b border-border">
        <div className="font-bebas text-[32px] tracking-[3px] text-accent leading-none">MultApp</div>
        <div className="text-[10px] text-muted tracking-[2px] uppercase mt-0.5">Gestione Multe</div>
      </div>

      <nav className="p-3 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium mb-0.5 transition-all duration-150 ${
                isActive ? 'bg-accent text-black' : 'text-muted hover:bg-surface2 hover:text-white'
              }`}>
              <span className="w-5 text-center text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mx-3 mb-4 bg-surface2 border border-border rounded-lg p-3">
        <div className="text-[10px] text-muted uppercase tracking-[1px]">Stagione</div>
        <div className="text-[13px] font-semibold mt-0.5">2025 / 2026</div>
      </div>
    </aside>
  )
}