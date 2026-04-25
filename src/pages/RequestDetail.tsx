import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Hash,
  Monitor,
  Save,
  Tag,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { DEPARTMENTS, DEVICE_REQUESTS } from '../data/dummyData'
import type { DeviceRequestRecord, Priority } from '../types/app'

type RequestDetailForm = Omit<DeviceRequestRecord, 'quantity'> & { quantity: number }

interface InfoRowProps {
  icon: LucideIcon
  label: string
  value: string | number | null | undefined
}

interface TimelineItem {
  color: string
  title: string
  date: string
}

interface TimelineEventProps extends TimelineItem {
  last: boolean
}

const FIELD_LABEL = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'
const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-sm mb-4'
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']

let requestsStore: DeviceRequestRecord[] = [...DEVICE_REQUESTS]

const createRequestForm = (request: DeviceRequestRecord): RequestDetailForm => ({
  ...request,
  quantity: request.quantity ?? 1,
})

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'var(--primary-lighter)' }}
      >
        <Icon size={13} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <p className="text-sm font-medium mt-0.5 break-words" style={{ color: 'var(--on-surface)' }}>
          {value !== null && value !== undefined && value !== '' ? String(value) : '-'}
        </p>
      </div>
    </div>
  )
}

function TimelineEvent({ color, title, date, last }: TimelineEventProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: color }} />
        {!last && (
          <div
            className="w-px flex-1 mt-1"
            style={{ background: 'var(--border-color)', minHeight: '24px' }}
          />
        )}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          {date}
        </p>
      </div>
    </div>
  )
}

export default function RequestDetail() {
  const { id } = useParams<'id'>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const original = requestsStore.find((request) => request.id === id)
  const [form, setForm] = useState<RequestDetailForm | null>(
    original ? createRequestForm(original) : null,
  )
  const [showRejectDialog, setShowRejectDialog] = useState(false)

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>
          Request Not Found
        </h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>
          No record found for {id}
        </p>
        <button onClick={() => navigate('/requests')} className="btn-primary">
          &larr; Back to Requests
        </button>
      </div>
    )
  }

  const setField = <Key extends keyof RequestDetailForm>(
    key: Key,
    value: RequestDetailForm[Key],
  ) => {
    setForm((currentForm) => (currentForm ? { ...currentForm, [key]: value } : currentForm))
  }

  const handleSave = () => {
    if (!id) {
      return
    }

    const updatedRequest: DeviceRequestRecord = {
      ...form,
      quantity: form.quantity,
    }

    requestsStore = requestsStore.map((request) =>
      request.id === id ? updatedRequest : request,
    )
    setForm(createRequestForm(updatedRequest))
    showToast(`${id} updated successfully`, 'success')
  }

  const handleApprove = () => {
    if (!id) {
      return
    }

    const updatedRequest: DeviceRequestRecord = {
      ...form,
      quantity: form.quantity,
      approvalStatus: 'Approved',
      approvedBy: 'Admin User',
      approvalDate: new Date().toISOString().slice(0, 10),
      kanbanColumn: 'Approved',
    }

    requestsStore = requestsStore.map((request) =>
      request.id === id ? updatedRequest : request,
    )
    setForm(createRequestForm(updatedRequest))
    showToast(`${id} approved`, 'success')
  }

  const handleReject = () => {
    if (!id) {
      return
    }

    const updatedRequest: DeviceRequestRecord = {
      ...form,
      quantity: form.quantity,
      approvalStatus: 'Rejected',
      approvedBy: 'Admin User',
      approvalDate: new Date().toISOString().slice(0, 10),
      kanbanColumn: 'Rejected',
    }

    requestsStore = requestsStore.map((request) =>
      request.id === id ? updatedRequest : request,
    )
    setForm(createRequestForm(updatedRequest))
    showToast(`${id} rejected`, 'info')
    setShowRejectDialog(false)
  }

  const related = requestsStore
    .filter((request) => request.id !== id && request.department === form.department)
    .slice(0, 3)

  const timeline: TimelineItem[] = [
    {
      color: 'var(--primary)',
      title: `Request submitted by ${form.requestedBy}`,
      date: form.requestDate,
    },
  ]

  if (form.approvalStatus === 'Approved' && form.approvedBy && form.approvalDate) {
    timeline.push({
      color: 'var(--success)',
      title: `Approved by ${form.approvedBy}`,
      date: form.approvalDate,
    })
  }

  if (form.approvalStatus === 'Rejected' && form.approvedBy && form.approvalDate) {
    timeline.push({
      color: 'var(--error-text)',
      title: `Rejected by ${form.approvedBy}`,
      date: form.approvalDate,
    })
  }

  const isPending = form.approvalStatus === 'Pending'

  const renderSectionTitle = (icon: ReactNode, title: string) => (
    <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--primary-lighter)' }}
      >
        {icon}
      </div>
      {title}
    </div>
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/requests')}
            className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm"
            style={{ border: '1px solid var(--border-strong)' }}
          >
            <ArrowLeft size={15} /> Requests
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>
              {form.id}
            </h1>
            <StatusBadge status={form.approvalStatus} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isPending && (
            <>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold"
                style={{
                  background: 'rgba(0,83,56,0.1)',
                  color: 'var(--success-text)',
                  border: '1px solid rgba(0,83,56,0.2)',
                }}
              >
                <CheckCircle2 size={14} /> Approve
              </button>
            </>
          )}
          <button onClick={handleSave} className="btn-primary text-sm">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="section-card">
            {renderSectionTitle(<Monitor size={14} style={{ color: 'var(--primary)' }} />, 'Device Details')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Device Type
                </label>
                <input
                  value={form.deviceType}
                  onChange={(event) => setField('deviceType', event.target.value)}
                  placeholder="e.g. Laptop, Monitor..."
                  className="input-field"
                />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Brand / Model
                </label>
                <input
                  value={form.brand}
                  onChange={(event) => setField('brand', event.target.value)}
                  placeholder="e.g. Dell XPS 15"
                  className="input-field"
                />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(event) => setField('priority', event.target.value as Priority)}
                  className="input-field"
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Quantity
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setField('quantity', Math.max(1, Number(event.target.value) || 1))
                  }
                  min="1"
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Reason / Justification
                </label>
                <textarea
                  value={form.reason}
                  onChange={(event) => setField('reason', event.target.value)}
                  rows={3}
                  placeholder="Why is this device needed?"
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            {renderSectionTitle(<User size={14} style={{ color: 'var(--primary)' }} />, 'Requester Information')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Requested By
                </label>
                <input
                  value={form.requestedBy}
                  onChange={(event) => setField('requestedBy', event.target.value)}
                  placeholder="Employee name"
                  className="input-field"
                />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(event) => setField('department', event.target.value)}
                  className="input-field"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((department) => (
                    <option key={department.id} value={department.name}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Request Date
                </label>
                <input
                  type="date"
                  value={form.requestDate}
                  onChange={(event) => setField('requestDate', event.target.value)}
                  className="input-field"
                />
              </div>
              {form.approvalDate && (
                <div>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                    Decision Date
                  </label>
                  <input readOnly value={form.approvalDate} className="input-field" style={{ opacity: 0.7 }} />
                </div>
              )}
            </div>

            {!isPending && (
              <div
                className="mt-4 pt-4 flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background:
                    form.approvalStatus === 'Approved'
                      ? 'var(--success-bg)'
                      : 'var(--error-bg)',
                  border: `1px solid ${
                    form.approvalStatus === 'Approved'
                      ? 'rgba(0,83,56,0.2)'
                      : 'rgba(186,26,26,0.2)'
                  }`,
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                {form.approvalStatus === 'Approved' ? (
                  <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} />
                ) : (
                  <XCircle size={18} style={{ color: 'var(--error-text)' }} />
                )}
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color:
                        form.approvalStatus === 'Approved'
                          ? 'var(--success-text)'
                          : 'var(--error-text)',
                    }}
                  >
                    {form.approvalStatus === 'Approved' ? 'Approved' : 'Rejected'} by{' '}
                    {form.approvedBy}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    on {form.approvalDate}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>
              Quick Info
            </p>
            <InfoRow icon={Hash} label="Request ID" value={form.id} />
            <InfoRow icon={Building} label="Department" value={form.department} />
            <InfoRow icon={User} label="Requester" value={form.requestedBy} />
            <InfoRow icon={Calendar} label="Request Date" value={form.requestDate} />
            <div className="flex items-start gap-3 pt-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-lighter)' }}
              >
                <Tag size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Current Status
                </p>
                <div className="mt-1">
                  <StatusBadge status={form.approvalStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} /> History
            </div>
            {timeline.map((event, index) => (
              <TimelineEvent
                key={`${event.title}-${index}`}
                {...event}
                last={index === timeline.length - 1}
              />
            ))}
          </div>

          {related.length > 0 && (
            <div className="section-card">
              <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
                <FileText size={15} style={{ color: 'var(--primary)' }} /> From Same Department
              </div>
              <div className="space-y-2">
                {related.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => navigate(`/requests/${request.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all"
                    style={{ background: 'var(--surface-low)' }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = 'var(--surface-container)'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = 'var(--surface-low)'
                    }}
                  >
                    <div>
                      <code className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>
                        {request.id}
                      </code>
                      <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>
                        {request.deviceType}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={request.approvalStatus} />
                      <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleReject}
        danger
        title="Reject Request"
        message={`Reject ${id}? This action will be logged.`}
      />
    </div>
  )
}
