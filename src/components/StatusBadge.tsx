interface StatusBadgeProps {
  status: string
}

// 🔽 NEW: Helper to normalize status strings to match our map keys
const getNormalizedKey = (status: string): string => {
  if (!status) return ''
  const lower = status.toLowerCase().trim()
  
  // Map all variations of "In" to the exact key "In"
  if (lower === 'in' || lower === 'in stock' || lower === 'available') return 'In'
  
  // Map all variations of "Out" to the exact key "Out"
  if (lower === 'out' || lower === 'out of stock' || lower === 'dispatched') return 'Out'
  
  // For everything else, return the original string to match the map
  return status 
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  // ── Device Request Statuses ──
  Open: { cls: 'badge-warning', label: 'Open' },
  Requested: { cls: 'badge-neutral', label: 'Requested' },
  Pending: { cls: 'badge-warning', label: 'Pending' },
  Recommended: { cls: 'badge-warning', label: 'Recommended' },
  Approved: { cls: 'badge-success', label: 'Approved' },
  Rejected: { cls: 'badge-error', label: 'Rejected' },
  Fulfilled: { cls: 'badge-success', label: 'Fulfilled' },

  // ── Device Stock Statuses ──
  In: { cls: 'badge-error', label: 'In' },       // Green
  Out: { cls: 'badge-success', label: 'Out' },       // Red

  // ── Repair / Ticket Statuses ──
  'In Progress': { cls: 'badge-info', label: 'In Progress' },
  Resolved: { cls: 'badge-success', label: 'Resolved' },
  Closed: { cls: 'badge-success', label: 'Closed' },

  // ── Priorities ──
  Critical: { cls: 'badge-error', label: 'Critical' },
  High: { cls: 'badge-warning', label: 'High' },
  Medium: { cls: 'badge-info', label: 'Medium' },
  Low: { cls: 'badge-neutral', label: 'Low' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // 🔽 Use the normalized key to look up the style
  const key = getNormalizedKey(status)
  
  const { cls, label } = STATUS_MAP[key] ?? {
    cls: 'badge-neutral',
    label: status, // Fallback to original text if still not found
  }

  return <span className={`badge ${cls}`}>{label}</span>
}