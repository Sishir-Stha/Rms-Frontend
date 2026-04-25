import { useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Building,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Hash,
  MapPin,
  Save,
  Trash2,
  User,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { REPAIRS, VENDORS } from '../data/dummyData'
import type { Priority, RepairRecord, RepairStatus } from '../types/app'

type RepairDetailForm = Omit<RepairRecord, 'notes'> & { notes: string }

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
const REPAIR_STATUSES: RepairStatus[] = ['Pending', 'In Progress', 'Under Review', 'Completed']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']

let repairsStore: RepairRecord[] = [...REPAIRS]

const createRepairForm = (repair: RepairRecord): RepairDetailForm => ({
  ...repair,
  notes: repair.notes ?? '',
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

export default function RepairDetail() {
  const { id } = useParams<'id'>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const original = repairsStore.find((repair) => repair.id === id)
  const [form, setForm] = useState<RepairDetailForm | null>(
    original ? createRepairForm(original) : null,
  )
  const [showDelete, setShowDelete] = useState(false)

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>
          Repair Not Found
        </h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>
          No record found for {id}
        </p>
        <button onClick={() => navigate('/repairs')} className="btn-primary">
          &larr; Back to Repairs
        </button>
      </div>
    )
  }

  const setField = <Key extends keyof RepairDetailForm>(
    key: Key,
    value: RepairDetailForm[Key],
  ) => {
    setForm((currentForm) => (currentForm ? { ...currentForm, [key]: value } : currentForm))
  }

  const handleSave = () => {
    if (!id) {
      return
    }

    const updatedRepair: RepairRecord = {
      ...form,
      notes: form.notes || undefined,
    }

    repairsStore = repairsStore.map((repair) => (repair.id === id ? updatedRepair : repair))
    setForm(createRepairForm(updatedRepair))
    showToast(`${id} updated successfully`, 'success')
  }

  const handleDelete = () => {
    if (!id) {
      return
    }

    repairsStore = repairsStore.filter((repair) => repair.id !== id)
    showToast(`${id} deleted`, 'info')
    navigate('/repairs')
  }

  const related = repairsStore
    .filter((repair) => repair.id !== id && repair.deviceCategory === form.deviceCategory)
    .slice(0, 3)

  const timeline: TimelineItem[] = [
    {
      color: 'var(--success)',
      title: `Ticket created by ${form.reportedBy}`,
      date: form.reportedDate,
    },
  ]

  if (form.technician) {
    timeline.push({
      color: 'var(--primary)',
      title: `Assigned to ${form.technician}`,
      date: form.reportedDate,
    })
  }

  if (form.status !== 'Pending') {
    timeline.push({
      color: '#3b82f6',
      title: `Status -> ${form.status}`,
      date: form.reportedDate,
    })
  }

  if (form.resolvedDate) {
    timeline.push({
      color: 'var(--success)',
      title: 'Marked as Resolved',
      date: form.resolvedDate,
    })
  }

  const fieldGroup: Array<{ key: keyof RepairDetailForm; label: string; placeholder: string }> = [
    { key: 'device', label: 'Device Name', placeholder: 'e.g. Dell Inspiron 15' },
    { key: 'deviceCategory', label: 'Category', placeholder: 'e.g. Laptops' },
    { key: 'serialNo', label: 'Serial Number', placeholder: 'SN-XXXX-XXX' },
    { key: 'department', label: 'Department', placeholder: 'e.g. Finance' },
  ]

  const assignmentFields: Array<{ key: keyof RepairDetailForm; label: string; placeholder: string }> = [
    { key: 'reportedBy', label: 'Reported By', placeholder: 'Employee name' },
    { key: 'technician', label: 'Technician', placeholder: 'Assigned technician' },
  ]

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
            onClick={() => navigate('/repairs')}
            className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm"
            style={{ border: '1px solid var(--border-strong)' }}
          >
            <ArrowLeft size={15} /> Repairs
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>
              {form.id}
            </h1>
            <StatusBadge status={form.status} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDelete(true)}
            className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}
          >
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={handleSave} className="btn-primary text-sm">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="section-card">
            {renderSectionTitle(<Wrench size={14} style={{ color: 'var(--primary)' }} />, 'Device Information')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldGroup.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                    {label}
                  </label>
                  <input
                    value={String(form[key] ?? '')}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setField(key, event.target.value as RepairDetailForm[typeof key])
                    }
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Issue Description
                </label>
                <textarea
                  value={form.issue}
                  onChange={(event) => setField('issue', event.target.value)}
                  rows={3}
                  placeholder="Describe the issue in detail..."
                  className="input-field resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Internal Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) => setField('notes', event.target.value)}
                  rows={2}
                  placeholder="Internal notes, parts needed, etc."
                  className="input-field resize-none"
                />
              </div>
            </div>
          </div>

          <div className="section-card">
            {renderSectionTitle(
              <Calendar size={14} style={{ color: 'var(--primary)' }} />,
              'Assignment & Timeline',
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignmentFields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                    {label}
                  </label>
                  <input
                    value={String(form[key] ?? '')}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setField(key, event.target.value as RepairDetailForm[typeof key])
                    }
                    placeholder={placeholder}
                    className="input-field"
                  />
                </div>
              ))}
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Vendor
                </label>
                <select
                  value={form.vendor}
                  onChange={(event) => setField('vendor', event.target.value)}
                  className="input-field"
                >
                  <option value="">Select vendor</option>
                  {VENDORS.map((vendor) => (
                    <option key={vendor.id} value={vendor.name}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Repair Cost ($)
                </label>
                <input
                  type="number"
                  value={form.cost === 0 ? '' : form.cost}
                  onChange={(event) =>
                    setField('cost', event.target.value === '' ? 0 : Number(event.target.value))
                  }
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Expected Completion
                </label>
                <input
                  type="date"
                  value={form.expectedCompletion ?? ''}
                  onChange={(event) =>
                    setField('expectedCompletion', event.target.value || null)
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Resolved Date
                </label>
                <input
                  type="date"
                  value={form.resolvedDate ?? ''}
                  onChange={(event) => setField('resolvedDate', event.target.value || null)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(event) => setField('status', event.target.value as RepairStatus)}
                  className="input-field"
                >
                  {REPAIR_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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
            </div>
          </div>
        </div>

        <div className="space-y-4">
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
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--primary-lighter)' }}
              >
                <DollarSign size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Cost
                </p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>
                  ${form.cost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} /> History
            </div>
            <div className="space-y-0">
              {timeline.map((event, index) => (
                <TimelineEvent
                  key={`${event.title}-${index}`}
                  {...event}
                  last={index === timeline.length - 1}
                />
              ))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="section-card">
              <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
                <FileText size={15} style={{ color: 'var(--primary)' }} /> Related Repairs
              </div>
              <div className="space-y-2">
                {related.map((repair) => (
                  <button
                    key={repair.id}
                    onClick={() => navigate(`/repairs/${repair.id}`)}
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
                        {repair.id}
                      </code>
                      <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>
                        {repair.device}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={repair.status} />
                      <ChevronRight size={12} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end xl:hidden">
        <button onClick={handleSave} className="btn-primary">
          <Save size={14} /> Save Changes
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        danger
        title="Delete Repair Ticket"
        message={`Are you sure you want to permanently delete ${id}? This cannot be undone.`}
      />
    </div>
  )
}
