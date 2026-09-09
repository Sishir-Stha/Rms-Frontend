import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'

export interface ReportDateRange {
  from: string
  to: string
}

type Preset = 'this-month' | 'last-month' | 'this-week'

interface ReportDateFilterProps {
  onApply: (range: ReportDateRange | null) => void
}

const PRESET_LABELS: Record<Preset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-week': 'This Week',
}

const pad = (n: number) => String(n).padStart(2, '0')
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const getPresetDates = (preset: Preset): ReportDateRange => {
  const today = new Date()
  if (preset === 'this-month') {
    return { from: `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`, to: toStr(today) }
  }
  if (preset === 'last-month') {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const last = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: toStr(first), to: toStr(last) }
  }
  // this-week: Monday of current week → today
  const day = (today.getDay() + 6) % 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - day)
  return { from: toStr(monday), to: toStr(today) }
}

export default function ReportDateFilter({ onApply }: ReportDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const [active, setActive] = useState<Preset | 'custom' | null>('this-month')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')

  // Drafts: picking From/To never applies until Apply is clicked
  const [draftFrom, setDraftFrom] = useState('')
  const [draftTo, setDraftTo] = useState('')

  // Default = This Month, applied once on mount
  useEffect(() => {
    const d = getPresetDates('this-month')
    setActive('this-month')
    setAppliedFrom(d.from)
    setAppliedTo(d.to)
    onApply(d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync drafts from applied values when popover opens
  useEffect(() => {
    if (isOpen) {
      setDraftFrom(appliedFrom)
      setDraftTo(appliedTo)
    }
  }, [isOpen, appliedFrom, appliedTo])

  const handlePreset = (preset: Preset) => {
    const d = getPresetDates(preset)
    setActive(preset)
    setAppliedFrom(d.from)
    setAppliedTo(d.to)
    onApply(d)
    setIsOpen(false)
  }

  const handleCustomDateChange = (field: 'from' | 'to', value: string) => {
    if (field === 'from') {
      setDraftFrom(value)
    } else {
      setDraftTo(value)
    }
  }

  const handleApply = () => {
    if (!draftFrom || !draftTo) return
    setActive('custom')
    setAppliedFrom(draftFrom)
    setAppliedTo(draftTo)
    onApply({ from: draftFrom, to: draftTo })
    setIsOpen(false)
  }

  const handleClear = () => {
    setActive(null)
    setAppliedFrom('')
    setAppliedTo('')
    onApply(null)
    setIsOpen(false)
  }

  const getDisplayLabel = () => {
    if (active && active !== 'custom') return PRESET_LABELS[active]
    if (active === 'custom' && appliedFrom && appliedTo) return `${appliedFrom} - ${appliedTo}`
    if (!active) return 'All Time'
    return 'This Month'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          isOpen
            ? 'border-primary bg-primary/5 text-primary'
            : 'border-outline-variant/30 bg-surface text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        <Calendar size={16} />

        <span className="text-sm font-medium">
          {getDisplayLabel()}
        </span>

        {isOpen && <X size={14} className="ml-1" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-surface rounded-xl shadow-lg border border-outline-variant/20 z-50 p-4">

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar
                size={16}
                className="text-primary"
              />

              <h3 className="font-semibold text-sm text-on-surface">
                Select Date Range
              </h3>
            </div>

            {(appliedFrom || appliedTo) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-on-surface-variant hover:text-error transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Report presets: This Month / Last Month / This Week */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(Object.entries(PRESET_LABELS) as [Preset, string][]).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePreset(key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  active === key
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                From
              </label>

              <input
                type="date"
                value={draftFrom}
                onChange={(e) =>
                  handleCustomDateChange(
                    'from',
                    e.target.value
                  )
                }
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
                To
              </label>

              <input
                type="date"
                value={draftTo}
                onChange={(e) =>
                  handleCustomDateChange(
                    'to',
                    e.target.value
                  )
                }
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={!draftFrom || !draftTo}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Apply Custom Dates
            </button>
          </div>

        </div>
      )}
    </div>
  )
}