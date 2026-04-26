interface StatusBadgeProps {
  status: string
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  Open: { cls: 'badge-warning', label: 'Open' },
  Requested: { cls: 'badge-neutral', label: 'Requested' },
  Pending: { cls: 'badge-warning', label: 'Pending' },
  'In Progress': { cls: 'badge-info', label: 'In Progress' },
  Resolved: { cls: 'badge-success', label: 'Resolved' },
  Closed: { cls: 'badge-success', label: 'Closed' },
  Approved: { cls: 'badge-success', label: 'Approved' },
  Rejected: { cls: 'badge-error', label: 'Rejected' },
  Critical: { cls: 'badge-error', label: 'Critical' },
  High: { cls: 'badge-warning', label: 'High' },
  Medium: { cls: 'badge-info', label: 'Medium' },
  Low: { cls: 'badge-neutral', label: 'Low' },
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { cls, label } = STATUS_MAP[status] ?? {
    cls: 'badge-neutral',
    label: status,
  }

  return <span className={`badge ${cls}`}>{label}</span>
}
