import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'

interface DateRangeFilterProps {
  onApply: (from: string, to: string) => void
  onClose?: () => void
}

type QuickFilter = 
  | 'today'
  | 'last-7-days'
  | 'this-month'
  | '1-year'
  | null

const QUICK_FILTER_LABELS: Record<string, string> = {
  'today': 'Today',
  'last-7-days': 'Last 7 Days',
  'this-month': 'This Month',
  '1-year': '1 Year'

}

export default function DateRangeFilter({ onApply, onClose }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getQuickFilterDates = (filter: QuickFilter) => {
    const today = new Date()
    let from: Date
    let to: Date = today

    switch (filter) {
      case 'today': from = today; break
      case 'last-7-days': from = new Date(today); from.setDate(today.getDate() - 7); break
      case 'this-month': from = new Date(today.getFullYear(), today.getMonth(), 1); break
      case '1-year': from = new Date(today); from.setFullYear(today.getFullYear() - 1); break
      default: from = today
    }
    return { from: formatDate(from), to: formatDate(to) }
  }

  // ️ AUTOMATIC LABEL SYNC: This ensures the button text ALWAYS matches the dates,
  // even if the direct state update is delayed by React batching.
  useEffect(() => {
    if (!fromDate || !toDate) {
      setQuickFilter(null)
      return
    }
    
    for (const key of Object.keys(QUICK_FILTER_LABELS)) {
      const dates = getQuickFilterDates(key as QuickFilter)
      if (dates.from === fromDate && dates.to === toDate) {
        setQuickFilter(key as QuickFilter)
        return
      }
    }
    setQuickFilter(null)
  }, [fromDate, toDate])

  const handleQuickFilter = (filter: QuickFilter) => {
    const dates = getQuickFilterDates(filter)
    setQuickFilter(filter)
    setFromDate(dates.from)
    setToDate(dates.to)
    onApply(dates.from, dates.to) 
    setIsOpen(false) 
  }

  const handleApply = () => {
    if (fromDate && toDate) {
      onApply(fromDate, toDate)
      setIsOpen(false)
    }
  }

  const handleClear = () => {
    setQuickFilter(null)
    setFromDate('')
    setToDate('')
    onApply('', '') 
    setIsOpen(false)
  }

  const getDisplayLabel = () => {
    if (quickFilter && QUICK_FILTER_LABELS[quickFilter]) {
      return QUICK_FILTER_LABELS[quickFilter]
    }
    if (fromDate && toDate) {
      return `${fromDate} - ${toDate}`
    }
    return 'Date Range'
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
              <Calendar size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-on-surface">Select Date Range</h3>
            </div>
            {(fromDate || toDate) && (
              <button 
                type="button"
                onClick={handleClear}
                className="text-xs text-on-surface-variant hover:text-error transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(QUICK_FILTER_LABELS).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleQuickFilter(key as QuickFilter)
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  quickFilter === key
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setQuickFilter(null)
                }}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1.5">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setQuickFilter(null)
                }}
                className="input-field w-full"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={!fromDate || !toDate}
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