import { useState, useRef, useEffect } from 'react'
import { Calendar, X } from 'lucide-react'

export type QuickFilter =
  | 'default'
  | 'today'
  | 'last-7-days'
  | 'this-month'
  | null

interface DateRangeFilterKanbanProps {
  quickFilter: QuickFilter
  fromDate: string
  toDate: string
  onApply: (
    mode: 'default' | 'custom' | 'all',
    from: string,
    to: string,
    quick: QuickFilter
  ) => void
  onClose?: () => void
}

const QUICK_FILTER_LABELS: Record<Exclude<QuickFilter, null>, string> = {
  default: 'Default',
  today: 'Today',
  'last-7-days': 'Last 7 Days',
  'this-month': 'This Month',
}

export default function DateRangeFilterKanban({
  quickFilter,
  fromDate,
  toDate,
  onApply,
}: DateRangeFilterKanbanProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // FIX: local drafts so picking From/To never triggers onApply (no refresh, popover stays open)
  const [draftFrom, setDraftFrom] = useState(fromDate)
  const [draftTo, setDraftTo] = useState(toDate)

  // Sync drafts from applied values each time the popover opens
  useEffect(() => {
    if (isOpen) {
      setDraftFrom(fromDate)
      setDraftTo(toDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const getQuickFilterDates = (filter: Exclude<QuickFilter, null>) => {
    const today = new Date()

    let from: Date
    let to: Date = new Date(today)

    switch (filter) {
      case 'today':
        from = new Date(today)
        break

      case 'last-7-days':
        from = new Date(today)
        from.setDate(today.getDate() - 7)
        break

      case 'this-month':
        from = new Date(today.getFullYear(), today.getMonth(), 1)
        break

      default:
        from = new Date(today)
    }

    return {
      from: formatDate(from),
      to: formatDate(to),
    }
  }

  const handleQuickFilter = (filter: Exclude<QuickFilter, null>) => {
    if (filter === 'default') {
      onApply('default', '', '', 'default')
      setIsOpen(false)
      return
    }

    const dates = getQuickFilterDates(filter)

    onApply(
      'custom',
      dates.from,
      dates.to,
      filter
    )

    setIsOpen(false)
  }

  // FIX: drafts only — NO onApply here
  const handleCustomDateChange = (
    field: 'from' | 'to',
    value: string
  ) => {
    if (field === 'from') {
      setDraftFrom(value)
    } else {
      setDraftTo(value)
    }
  }

  // FIX: apply uses the drafts
  const handleApply = () => {
    if (!draftFrom || !draftTo) return

    onApply(
      'custom',
      draftFrom,
      draftTo,
      null
    )

    setIsOpen(false)
  }

  const handleClear = () => {
    onApply(
      'all',
      '',
      '',
      null
    )

    setIsOpen(false)
  }

  const getDisplayLabel = () => {
    if (quickFilter) {
      return QUICK_FILTER_LABELS[quickFilter]
    }

    if (fromDate && toDate) {
      return `${fromDate} - ${toDate}`
    }

    return 'Default'
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
                onClick={() =>
                  handleQuickFilter(
                    key as Exclude<QuickFilter, null>
                  )
                }
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