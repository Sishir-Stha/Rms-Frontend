import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fetchDepartments } from '../services/departments.service'
import {
  approveDeviceRequestById,
  fetchDeviceRequestById,
  fetchDeviceRequests,
  updateDeviceRequestById,
} from '../services/device-request.service'
import { fetchUsers } from '../services/user.service'
import type { Priority, RequestApprovalStatus } from '../types/app'
import type { DeviceRequestDetailItem, DeviceRequestListItem } from '../types/device-request.types'
import type {
  RepairDepartmentOption,
  RepairUserOption,
} from '../types/repair.types'
import { formatDeviceRequestStatus } from '../utils/device-request-status'

interface RequestDetailFormState {
  requestId: number
  id: string
  requestedById: number
  requestedFor: string
  departmentId: number
  deviceType: string
  brand: string
  reason: string
  requestDate: string
  approvalStatus: RequestApprovalStatus
  approvedById: number | null
  approvedByName: string | null
  approvalDate: string
  priority: Priority
  quantity: number
}

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
const REQUEST_STATUSES: RequestApprovalStatus[] = [
  'Requested',
  'Pending',
  'Approved',
  'Rejected',
]

const formatDateInputValue = (value: string | null): string =>
  value ? value.slice(0, 10) : ''

const toNullableDate = (value: string): string | null => (value.trim() === '' ? null : value)

const parseRequestId = (value: string | undefined): number | null => {
  if (!value) {
    return null
  }

  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) ? parsedValue : null
}

const createRequestForm = (request: DeviceRequestDetailItem): RequestDetailFormState => ({
  requestId: request.requestId,
  id: request.id,
  requestedById: request.requestedById,
  requestedFor: request.requestedFor,
  departmentId: request.departmentId,
  deviceType: request.deviceType,
  brand: request.brand,
  reason: request.reason,
  requestDate: formatDateInputValue(request.requestDate),
  approvalStatus: request.approvalStatus,
  approvedById: request.approvedById,
  approvedByName: request.approvedBy,
  approvalDate: formatDateInputValue(request.approvalDate),
  priority: request.priority,
  quantity: request.quantity,
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
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState<RequestDetailFormState | null>(null)
  const [users, setUsers] = useState<RepairUserOption[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [requests, setRequests] = useState<DeviceRequestListItem[]>([])
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const requestId = parseRequestId(id)

    if (requestId === null) {
      setForm(null)
      setErrorMessage(`No record found for ${id}`)
      setIsLoading(false)
      return () => {
        abortController.abort()
      }
    }

    const loadRequestDetail = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [requestDetail, requestItems, userOptions, departmentOptions] = await Promise.all([
          fetchDeviceRequestById(requestId, abortController.signal),
          fetchDeviceRequests({ approvalStatus: '', deviceType: '' }, abortController.signal),
          fetchUsers(),
          fetchDepartments(abortController.signal),
        ])

        if (abortController.signal.aborted) {
          return
        }

        setRequests(requestItems)
        setUsers(userOptions)
        setDepartments(departmentOptions)
        setForm(createRequestForm(requestDetail))
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setForm(null)
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load request detail.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadRequestDetail()

    return () => {
      abortController.abort()
    }
  }, [id])

  const selectedRequester = useMemo(
    () => users.find((user) => user.user_id === form?.requestedById) ?? null,
    [form?.requestedById, users],
  )

  const selectedDepartment = useMemo(
    () =>
      departments.find((department) => department.department_id === form?.departmentId) ?? null,
    [departments, form?.departmentId],
  )

  const related = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            request.requestId !== form?.requestId && request.departmentId === form?.departmentId,
        )
        .slice(0, 3),
    [form?.departmentId, form?.requestId, requests],
  )

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Loading request detail...
        </p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>
          Request Not Found
        </h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>
          {errorMessage ?? `No record found for ${id}`}
        </p>
        <button onClick={() => navigate('/requests')} className="btn-primary">
          &larr; Back to Requests
        </button>
      </div>
    )
  }

  const setField = <Key extends keyof RequestDetailFormState>(
    key: Key,
    value: RequestDetailFormState[Key],
  ) => {
    setForm((currentForm) => (currentForm ? { ...currentForm, [key]: value } : currentForm))
  }

  const handleStatusChange = (nextStatus: RequestApprovalStatus) => {
    setForm((currentForm) => {
      if (!currentForm) {
        return currentForm
      }

      if (nextStatus === 'Requested' || nextStatus === 'Pending') {
        return {
          ...currentForm,
          approvalStatus: nextStatus,
          approvedById: null,
          approvedByName: null,
          approvalDate: '',
        }
      }

      const today = new Date().toISOString().slice(0, 10)

      return {
        ...currentForm,
        approvalStatus: nextStatus,
        approvedById: currentForm.approvedById ?? currentUser?.id ?? null,
        approvedByName: currentForm.approvedByName ?? currentUser?.name ?? null,
        approvalDate: currentForm.approvalDate || today,
      }
    })
  }

  const handleSave = () => {
    if (!form) {
      return
    }

    if (
      !form.requestedById ||
      !form.departmentId ||
      !form.requestedFor.trim() ||
      !form.deviceType.trim()
    ) {
      showToast('Requester, department, requested for, and device type are required', 'error')
      return
    }

    setIsSaving(true)

    void (async () => {
      try {
        await updateDeviceRequestById(form.requestId, {
          requested_by: form.requestedById,
          department_id: form.departmentId,
          device_type: form.deviceType.trim(),
          brand: form.brand.trim(),
          reason: form.reason.trim(),
          quantity: form.quantity,
          priority: form.priority,
          requested_for: form.requestedFor.trim(),
          request_date: toNullableDate(form.requestDate),
          approval_status: form.approvalStatus,
          approved_by: form.approvedById,
          approval_date: toNullableDate(form.approvalDate),
        })
        showToast(`${form.id} updated successfully`, 'success')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Failed to update device request.',
          'error',
        )
      } finally {
        setIsSaving(false)
      }
    })()
  }

  const handleApproval = (nextStatus: Extract<RequestApprovalStatus, 'Approved' | 'Rejected'>) => {
    if (!currentUser) {
      showToast('You must be logged in to review requests', 'error')
      return
    }

    void (async () => {
      try {
        await approveDeviceRequestById(form.requestId, {
          approval_status: nextStatus,
          approved_by: currentUser.id,
        })

        const [requestDetail, requestItems] = await Promise.all([
          fetchDeviceRequestById(form.requestId),
          fetchDeviceRequests({ approvalStatus: '', deviceType: '' }),
        ])

        setRequests(requestItems)
        setForm(createRequestForm(requestDetail))
        showToast(`${form.id} ${nextStatus.toLowerCase()}`, nextStatus === 'Approved' ? 'success' : 'info')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : `Failed to mark request as ${nextStatus}.`,
          'error',
        )
      } finally {
        setShowRejectDialog(false)
      }
    })()
  }

  const timeline: TimelineItem[] = [
    {
      color: 'var(--primary)',
      title: `Request submitted by ${selectedRequester?.user_name ?? form.approvedByName ?? `User #${form.requestedById}`}`,
      date: form.requestDate,
    },
  ]

  if (form.approvalStatus === 'Pending') {
    timeline.push({
      color: '#f59e0b',
      title: 'Moved to Recommended review',
      date: form.requestDate,
    })
  }

  if (form.approvalStatus === 'Approved' && form.approvedByName && form.approvalDate) {
    timeline.push({
      color: 'var(--success)',
      title: `Approved by ${form.approvedByName}`,
      date: form.approvalDate,
    })
  }

  if (form.approvalStatus === 'Rejected' && form.approvedByName && form.approvalDate) {
    timeline.push({
      color: 'var(--error-text)',
      title: `Rejected by ${form.approvedByName}`,
      date: form.approvalDate,
    })
  }

  const canReview =
    form.approvalStatus === 'Requested' || form.approvalStatus === 'Pending'

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
            <StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canReview && (
            <>
              <button
                onClick={() => setShowRejectDialog(true)}
                className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
                style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}
              >
                <XCircle size={14} /> Reject
              </button>
              <button
                onClick={() => handleApproval('Approved')}
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
          <button onClick={handleSave} className="btn-primary text-sm" disabled={isSaving}>
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
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
                  min="1"
                  value={form.quantity}
                  onChange={(event) =>
                    setField('quantity', Math.max(1, Number(event.target.value) || 1))
                  }
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
                <select
                  value={String(form.requestedById)}
                  onChange={(event) => setField('requestedById', Number(event.target.value))}
                  className="input-field"
                >
                  <option value="">Select requester</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Department
                </label>
                <select
                  value={String(form.departmentId)}
                  onChange={(event) => setField('departmentId', Number(event.target.value))}
                  className="input-field"
                >
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.department_id} value={department.department_id}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Requested For
                </label>
                <input
                  value={form.requestedFor}
                  onChange={(event) => setField('requestedFor', event.target.value)}
                  placeholder="e.g. New hire, Apple"
                  className="input-field"
                />
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
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>
                  Status
                </label>
                <select
                  value={form.approvalStatus}
                  onChange={(event) =>
                    handleStatusChange(event.target.value as RequestApprovalStatus)
                  }
                  className="input-field"
                >
                  {REQUEST_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatDeviceRequestStatus(status)}
                    </option>
                  ))}
                </select>
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

            {(form.approvalStatus === 'Approved' || form.approvalStatus === 'Rejected') && (
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
                    {form.approvalStatus} by {form.approvedByName ?? '-'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    on {form.approvalDate || '-'}
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
            <InfoRow icon={Building} label="Department" value={selectedDepartment?.department_name ?? ''} />
            <InfoRow icon={User} label="Requester" value={selectedRequester?.user_name ?? ''} />
            <InfoRow icon={Tag} label="Requested For" value={form.requestedFor} />
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
                  <StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} />
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
                    key={request.requestId}
                    onClick={() => navigate(`/requests/${request.requestId}`)}
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
                      <StatusBadge status={formatDeviceRequestStatus(request.approvalStatus)} />
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
        onConfirm={() => handleApproval('Rejected')}
        danger
        title="Reject Request"
        message={`Reject ${form.id}? This action will be logged.`}
      />
    </div>
  )
}
