import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Monitor, User, Building, Calendar,
  Clock, AlertCircle, CheckCircle2, XCircle, Hash,
  FileText, ChevronRight, Tag
} from 'lucide-react'
import { DEVICE_REQUESTS, DEPARTMENTS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

let requestsStore = [...DEVICE_REQUESTS]

const FIELD_LABEL = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'
const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-sm mb-4'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'var(--primary-lighter)' }}>
        <Icon size={13} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words" style={{ color: 'var(--on-surface)' }}>{value || '—'}</p>
      </div>
    </div>
  )
}

function TimelineEvent({ color, title, date, last }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
        {!last && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-color)', minHeight: '24px' }} />}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{date}</p>
      </div>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const original = requestsStore.find(r => r.id === id)
  const [form, setForm] = useState(original ? { ...original } : null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Request Not Found</h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>No record found for {id}</p>
        <button onClick={() => navigate('/requests')} className="btn-primary">← Back to Requests</button>
      </div>
    )
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    requestsStore = requestsStore.map(r => r.id === id ? { ...form } : r)
    showToast(`${id} updated successfully`, 'success')
  }

  const handleApprove = () => {
    const updated = { ...form, approvalStatus: 'Approved', approvedBy: 'Admin User', approvalDate: new Date().toISOString().slice(0, 10), kanbanColumn: 'Approved' }
    requestsStore = requestsStore.map(r => r.id === id ? updated : r)
    setForm(updated)
    showToast(`${id} approved`, 'success')
  }

  const handleReject = () => {
    const updated = { ...form, approvalStatus: 'Rejected', approvedBy: 'Admin User', approvalDate: new Date().toISOString().slice(0, 10), kanbanColumn: 'Rejected' }
    requestsStore = requestsStore.map(r => r.id === id ? updated : r)
    setForm(updated)
    showToast(`${id} rejected`, 'info')
    setShowRejectDialog(false)
  }

  // Related requests (same department)
  const related = requestsStore.filter(r => r.id !== id && r.department === form.department).slice(0, 3)

  const timeline = [
    { color: 'var(--primary)', title: `Request submitted by ${form.requestedBy}`, date: form.requestDate },
    form.approvalStatus === 'Approved' && { color: 'var(--success)', title: `Approved by ${form.approvedBy}`, date: form.approvalDate },
    form.approvalStatus === 'Rejected' && { color: 'var(--error-text)', title: `Rejected by ${form.approvedBy}`, date: form.approvalDate },
  ].filter(Boolean)

  const isPending = form.approvalStatus === 'Pending'

  return (
    <div className="p-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/requests')}
            className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm"
            style={{ border: '1px solid var(--border-strong)' }}>
            <ArrowLeft size={15} /> Requests
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{form.id}</h1>
            <StatusBadge status={form.approvalStatus} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <>
              <button onClick={() => setShowRejectDialog(true)}
                className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}>
                <XCircle size={14} /> Reject
              </button>
              <button onClick={handleApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(0,83,56,0.1)', color: 'var(--success-text)', border: '1px solid rgba(0,83,56,0.2)' }}>
                <CheckCircle2 size={14} /> Approve
              </button>
            </>
          )}
          <button onClick={handleSave} className="btn-primary text-sm">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* LEFT - main content */}
        <div className="xl:col-span-2 space-y-5">

          {/* Device Details card */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-lighter)' }}>
                <Monitor size={14} style={{ color: 'var(--primary)' }} />
              </div>
              Device Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Device Type</label>
                <input value={form.deviceType || ''} onChange={e => set('deviceType', e.target.value)}
                  placeholder="e.g. Laptop, Monitor…" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Brand / Model</label>
                <input value={form.brand || ''} onChange={e => set('brand', e.target.value)}
                  placeholder="e.g. Dell XPS 15" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Quantity</label>
                <input type="number" value={form.quantity || 1} onChange={e => set('quantity', e.target.value)}
                  min="1" className="input-field" />
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Reason / Justification</label>
                <textarea value={form.reason || ''} onChange={e => set('reason', e.target.value)}
                  rows={3} placeholder="Why is this device needed?"
                  className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* Requester info card */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-lighter)' }}>
                <User size={14} style={{ color: 'var(--primary)' }} />
              </div>
              Requester Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Requested By</label>
                <input value={form.requestedBy || ''} onChange={e => set('requestedBy', e.target.value)}
                  placeholder="Employee name" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Department</label>
                <select value={form.department || ''} onChange={e => set('department', e.target.value)} className="input-field">
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Request Date</label>
                <input type="date" value={form.requestDate || ''} onChange={e => set('requestDate', e.target.value)}
                  className="input-field" />
              </div>
              {form.approvalDate && (
                <div>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Decision Date</label>
                  <input readOnly value={form.approvalDate} className="input-field" style={{ opacity: 0.7 }} />
                </div>
              )}
            </div>

            {/* Approval status block */}
            {!isPending && (
              <div className="mt-4 pt-4 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: form.approvalStatus === 'Approved' ? 'var(--success-bg)' : 'var(--error-bg)',
                  border: `1px solid ${form.approvalStatus === 'Approved' ? 'rgba(0,83,56,0.2)' : 'rgba(186,26,26,0.2)'}`,
                  borderTop: '1px solid var(--border-color)',
                }}>
                {form.approvalStatus === 'Approved'
                  ? <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} />
                  : <XCircle size={18} style={{ color: 'var(--error-text)' }} />}
                <div>
                  <p className="text-sm font-semibold"
                    style={{ color: form.approvalStatus === 'Approved' ? 'var(--success-text)' : 'var(--error-text)' }}>
                    {form.approvalStatus === 'Approved' ? 'Approved' : 'Rejected'} by {form.approvedBy}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>on {form.approvalDate}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT - sidebar cards */}
        <div className="space-y-4">

          {/* Quick Info */}
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Quick Info</p>
            <InfoRow icon={Hash} label="Request ID" value={form.id} />
            <InfoRow icon={Building} label="Department" value={form.department} />
            <InfoRow icon={User} label="Requester" value={form.requestedBy} />
            <InfoRow icon={Calendar} label="Request Date" value={form.requestDate} />
            <div className="flex items-start gap-3 pt-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-lighter)' }}>
                <Tag size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Status</p>
                <div className="mt-1"><StatusBadge status={form.approvalStatus} /></div>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} /> History
            </div>
            {timeline.map((ev, i) => (
              <TimelineEvent key={i} {...ev} last={i === timeline.length - 1} />
            ))}
          </div>

          {/* Related in same dept */}
          {related.length > 0 && (
            <div className="section-card">
              <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
                <FileText size={15} style={{ color: 'var(--primary)' }} /> From Same Department
              </div>
              <div className="space-y-2">
                {related.map(r => (
                  <button key={r.id} onClick={() => navigate(`/requests/${r.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all"
                    style={{ background: 'var(--surface-low)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-low)'}>
                    <div>
                      <code className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>{r.id}</code>
                      <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>{r.deviceType}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={r.approvalStatus} />
                      <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={showRejectDialog} onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject} danger
        title="Reject Request"
        message={`Reject ${id}? This action will be logged.`} />
    </div>
  )
}
