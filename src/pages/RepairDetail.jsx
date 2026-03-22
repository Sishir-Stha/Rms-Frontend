import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Save, Trash2, Wrench, Calendar, User, Building,
  Clock, AlertCircle, CheckCircle2, Tag, DollarSign, Monitor,
  Hash, MapPin, FileText, ChevronRight
} from 'lucide-react'
import { REPAIRS, VENDORS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

// A shared context/store would be better in production, but we use module state here for demo
let repairsStore = [...REPAIRS]

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

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const original = repairsStore.find(r => r.id === id)
  const [form, setForm] = useState(original ? { ...original } : null)
  const [showDelete, setShowDelete] = useState(false)

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Repair Not Found</h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>No record found for {id}</p>
        <button onClick={() => navigate('/repairs')} className="btn-primary">← Back to Repairs</button>
      </div>
    )
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    repairsStore = repairsStore.map(r => r.id === id ? { ...form } : r)
    showToast(`${id} updated successfully`, 'success')
  }

  const handleDelete = () => {
    repairsStore = repairsStore.filter(r => r.id !== id)
    showToast(`${id} deleted`, 'info')
    navigate('/repairs')
  }

  // Related repairs (same device category, different id)
  const related = repairsStore.filter(r => r.id !== id && r.deviceCategory === form.deviceCategory).slice(0, 3)

  // Timeline events
  const timeline = [
    { color: 'var(--success)', title: `Ticket created by ${form.reportedBy}`, date: form.reportedDate },
    form.technician && { color: 'var(--primary)', title: `Assigned to ${form.technician}`, date: form.reportedDate },
    form.status !== 'Pending' && { color: '#3b82f6', title: `Status → ${form.status}`, date: form.reportedDate },
    form.resolvedDate && { color: 'var(--success)', title: 'Marked as Resolved', date: form.resolvedDate },
  ].filter(Boolean)

  return (
    <div className="p-6 animate-fade-in">
      {/* ── Page Header ──────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/repairs')}
            className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm"
            style={{ border: '1px solid var(--border-strong)' }}>
            <ArrowLeft size={15} /> Repairs
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{form.id}</h1>
            <StatusBadge status={form.status} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDelete(true)}
            className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={handleSave} className="btn-primary text-sm">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      {/* ── 2-Column Layout ──────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: Main content (2/3) ─── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Device & Issue card */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-lighter)' }}>
                <Wrench size={14} style={{ color: 'var(--primary)' }} />
              </div>
              Device Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'device',         label: 'Device Name',    placeholder: 'e.g. Dell Inspiron 15' },
                { key: 'deviceCategory', label: 'Category',       placeholder: 'e.g. Laptops' },
                { key: 'serialNo',       label: 'Serial Number',  placeholder: 'SN-XXXX-XXX' },
                { key: 'department',     label: 'Department',     placeholder: 'e.g. Finance' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>{label}</label>
                  <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
                    placeholder={placeholder} className="input-field" />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Issue Description</label>
                <textarea value={form.issue || ''} onChange={e => set('issue', e.target.value)}
                  rows={3} placeholder="Describe the issue in detail…"
                  className="input-field resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Internal Notes</label>
                <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
                  rows={2} placeholder="Internal notes, parts needed, etc."
                  className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* Assignment & Timeline card */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-lighter)' }}>
                <Calendar size={14} style={{ color: 'var(--primary)' }} />
              </div>
              Assignment & Timeline
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'reportedBy', label: 'Reported By',  placeholder: 'Employee name' },
                { key: 'technician', label: 'Technician',   placeholder: 'Assigned technician' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>{label}</label>
                  <input value={form[key] || ''} onChange={e => set(key, e.target.value)}
                    placeholder={placeholder} className="input-field" />
                </div>
              ))}
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Vendor</label>
                <select value={form.vendor || ''} onChange={e => set('vendor', e.target.value)} className="input-field">
                  <option value="">Select vendor</option>
                  {VENDORS.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Repair Cost ($)</label>
                <input type="number" value={form.cost || ''} onChange={e => set('cost', e.target.value)}
                  placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expected Completion</label>
                <input type="date" value={form.expectedCompletion || ''} onChange={e => set('expectedCompletion', e.target.value)}
                  className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Resolved Date</label>
                <input type="date" value={form.resolvedDate || ''} onChange={e => set('resolvedDate', e.target.value)}
                  className="input-field" />
              </div>
            </div>

            {/* Status & Priority row */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className="input-field">
                  {['Pending', 'In Progress', 'Under Review', 'Completed'].map(s =>
                    <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="input-field">
                  {['Critical', 'High', 'Medium', 'Low'].map(s =>
                    <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar cards (1/3) ─── */}
        <div className="space-y-4">

          {/* Quick Info card */}
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
              Quick Info
            </p>
            <InfoRow icon={Hash} label="Ticket ID" value={form.id} />
            <InfoRow icon={Building} label="Department" value={form.department} />
            <InfoRow icon={User} label="Reported By" value={form.reportedBy} />
            <InfoRow icon={Calendar} label="Reported Date" value={form.reportedDate} />
            <InfoRow icon={MapPin} label="Vendor" value={form.vendor} />
            <div className="flex items-start gap-3 pt-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-lighter)' }}>
                <DollarSign size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Cost</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>
                  ${parseFloat(form.cost || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* History / Timeline card */}
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} /> History
            </div>
            <div className="space-y-0">
              {timeline.map((ev, i) => (
                <TimelineEvent key={i} {...ev} last={i === timeline.length - 1} />
              ))}
            </div>
          </div>

          {/* Related repairs card */}
          {related.length > 0 && (
            <div className="section-card">
              <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
                <FileText size={15} style={{ color: 'var(--primary)' }} /> Related Repairs
              </div>
              <div className="space-y-2">
                {related.map(r => (
                  <button key={r.id} onClick={() => navigate(`/repairs/${r.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all"
                    style={{ background: 'var(--surface-low)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-container)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-low)'}>
                    <div>
                      <code className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>{r.id}</code>
                      <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>{r.device}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={r.status} />
                      <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save footer on mobile */}
      <div className="mt-6 flex justify-end xl:hidden">
        <button onClick={handleSave} className="btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={handleDelete} danger
        title="Delete Repair Ticket"
        message={`Are you sure you want to permanently delete ${id}? This cannot be undone.`} />
    </div>
  )
}
