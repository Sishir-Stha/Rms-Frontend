import { useEffect, useRef, useState } from 'react'
import { CalendarDays } from 'lucide-react'

export type ReportRangePreset = 'thisMonth' | 'lastMonth' | 'thisWeek' | 'custom'

export interface ReportDateRange {
  from: string
  to: string
  preset: ReportRangePreset
}

const pad = (n: number) => String(n).padStart(2, '0')
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const getThisMonthRange = (): { from: string; to: string } => {
  const now = new Date()
  return {
    from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    to: toStr(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  }
}

export const getLastMonthRange = (): { from: string; to: string } => {
  const now = new Date()
  return {
    from: toStr(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: toStr(new Date(now.getFullYear(), now.getMonth(), 0)),
  }
}

export const getThisWeekRange = (): { from: string; to: string } => {
  const now = new Date()
  const diffToMonday = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: toStr(monday), to: toStr(sunday) }
}

interface Props {
  onApply: (range: ReportDateRange) => void
}

export default function ReportDateFilter({ onApply }: Props) {
  const [open, setOpen] = useState(false)
  const [preset, setPreset] = useState<ReportRangePreset>('thisMonth')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const label =
    preset === 'thisMonth' ? 'This Month' :
    preset === 'lastMonth' ? 'Last Month' :
    preset === 'thisWeek' ? 'This Week' : 'Custom'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Default = This Month on first render
  useEffect(() => {
    const r = getThisMonthRange()
    onApply({ from: r.from, to: r.to, preset: 'thisMonth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyPreset = (p: ReportRangePreset) => {
    setPreset(p)
    if (p === 'thisMonth') { const r = getThisMonthRange(); onApply({ from: r.from, to: r.to, preset: p }); }
    if (p === 'lastMonth') { const r = getLastMonthRange(); onApply({ from: r.from, to: r.to, preset: p }); }
    if (p === 'thisWeek') { const r = getThisWeekRange(); onApply({ from: r.from, to: r.to, preset: p }); }
  }

  const applyCustom = () => {
    const fallback = getThisMonthRange()
    const r = { from: from || fallback.from, to: to || fallback.to }
    setPreset('custom')
    onApply({ from: r.from, to: r.to, preset: 'custom' })
    setOpen(false)
  }

  const presetBtn = (p: ReportRangePreset, text: string) => (
    <button
      key={p}
      onClick={() => applyPreset(p)}
      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${preset === p ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}
    >
      {text}
    </button>
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        style={{ border: '1px solid var(--border-strong)' }}
      >
        <CalendarDays size={14} /> {label}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 section-card p-4" style={{ width: '320px', boxShadow: '0 8px 24px var(--shadow)' }}>
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>Select Date Range</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {presetBtn('thisMonth', 'This Month')}
            {presetBtn('lastMonth', 'Last Month')}
            {presetBtn('thisWeek', 'This Week')}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <button onClick={applyCustom} className="btn-primary px-3 py-1.5 text-xs">Apply Custom Dates</button>
          </div>
        </div>
      )}
    </div>
  )
}