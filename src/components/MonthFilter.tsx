'use client'

const MONTHS = [
  { value: 'all', label: 'Tutto' },
  { value: '2025-01', label: 'Gen' },
  { value: '2025-02', label: 'Feb' },
  { value: '2025-03', label: 'Mar' },
  { value: '2025-04', label: 'Apr' },
  { value: '2025-05', label: 'Mag' },
]

interface MonthFilterProps {
  value: string
  onChange: (month: string) => void
}

export default function MonthFilter({ value, onChange }: MonthFilterProps) {
  return (
    <div className="flex gap-1.5">
      {MONTHS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`px-3.5 py-1.5 rounded-full border text-xs transition-all duration-150 ${
            value === m.value
              ? 'bg-accent text-black border-accent font-semibold'
              : 'border-border text-muted hover:border-accent hover:text-accent'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
