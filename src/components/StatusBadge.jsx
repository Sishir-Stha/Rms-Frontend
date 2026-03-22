import React from 'react'

const STATUS_MAP = {
  // Repair statuses
  'Pending':       { cls: 'badge-warning',  label: 'Pending' },
  'In Progress':   { cls: 'badge-info',     label: 'In Progress' },
  'Under Review':  { cls: 'badge-neutral',  label: 'Under Review' },
  'Completed':     { cls: 'badge-success',  label: 'Completed' },
  'Cancelled':     { cls: 'badge-error',    label: 'Cancelled' },
  // Device request statuses
  'Approved':      { cls: 'badge-success',  label: 'Approved' },
  'Rejected':      { cls: 'badge-error',    label: 'Rejected' },
  // Priority levels
  'Critical':      { cls: 'badge-error',    label: 'Critical' },
  'High':          { cls: 'badge-warning',  label: 'High' },
  'Medium':        { cls: 'badge-info',     label: 'Medium' },
  'Low':           { cls: 'badge-neutral',  label: 'Low' },
}

export default function StatusBadge({ status }) {
  const { cls, label } = STATUS_MAP[status] || { cls: 'badge-neutral', label: status }
  return <span className={`badge ${cls}`}>{label}</span>
}
