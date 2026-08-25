import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Building, Calendar, CheckCircle2, ChevronRight, Clock, FileText, Hash, Minus, Monitor, Package, Plus, Save, Tag, User, XCircle, type LucideIcon } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fetchDepartments } from '../services/departments.service'
import { approveDeviceRequestById, fetchDeviceRequestById, fetchDeviceRequests, updateDeviceRequestById } from '../services/device-request.service'
import { fetchUsers } from '../services/user.service'
import type { Priority, RequestApprovalStatus } from '../types/app'
import type { DeviceRequestDetailItem, DeviceRequestListItem } from '../types/device-request.types'
import type { RepairDepartmentOption, RepairUserOption } from '../types/repair.types'
import { formatDeviceRequestStatus } from '../utils/device-request-status'
import {
  getUserAccess, isRequestViewerOnly, canEditDeviceDetails, canEditRequesterInformation,
  canUpdateDeviceQuantity, canEditPartialAndExpense, canViewRequestedStatus, canViewRecommendedStatus,
  canViewApprovedStatus, canViewRejectedStatus, canViewFulfilledStatus, canFulfillRequestStatus,
  canActOnRequested, canActOnRecommended, getRequestedActionLabel,
} from '../utils/access-control'

interface RequestDetailFormState {
  requestId: number; id: string; requestedById: number; requestedFor: string; departmentId: number;
  deviceType: string; brand: string; reason: string; requestDate: string; approvalStatus: RequestApprovalStatus;
  approvedById: number | null; approvedByName: string | null; approvalDate: string; priority: Priority; quantity: number;
}
interface InfoRowProps { icon: LucideIcon; label: string; value: string | number | null | undefined }
interface TimelineItem { color: string; title: string; date: string }
interface TimelineEventProps extends TimelineItem { last: boolean }

const FIELD_LABEL = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'
const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-sm mb-4'
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const REQUEST_STATUSES: RequestApprovalStatus[] = ['Requested', 'Pending', 'Approved', 'Rejected', 'Fulfilled']

const formatDateInputValue = (v: string | null): string => v ? v.slice(0, 10) : ''
const toNullableDate = (v: string): string | null => v.trim() === '' ? null : v
const parseRequestId = (v: string | undefined): number | null => { if (!v) return null; const p = Number(v); return Number.isInteger(p) ? p : null }

const createRequestForm = (r: DeviceRequestDetailItem): RequestDetailFormState => ({
  requestId: r.requestId, id: r.id, requestedById: r.requestedById, requestedFor: r.requestedFor, departmentId: r.departmentId,
  deviceType: r.deviceType, brand: r.brand, reason: r.reason, requestDate: formatDateInputValue(r.requestDate),
  approvalStatus: r.approvalStatus, approvedById: r.approvedById, approvedByName: r.approvedBy,
  approvalDate: formatDateInputValue(r.approvalDate), priority: r.priority, quantity: r.quantity,
})

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--primary-lighter)' }}><Icon size={13} style={{ color: 'var(--primary)' }} /></div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words" style={{ color: 'var(--on-surface)' }}>{value !== null && value !== undefined && value !== '' ? String(value) : '-'}</p>
      </div>
    </div>
  )
}
function TimelineEvent({ color, title, date, last }: TimelineEventProps) {
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
  const { id } = useParams<'id'>()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { showToast } = useToast()

  const access = getUserAccess(currentUser?.email)
  const viewOnly = isRequestViewerOnly(currentUser?.email)
  const deviceDetailsEditable = canEditDeviceDetails(currentUser?.email)
  const requesterInfoEditable = canEditRequesterInformation(currentUser?.email)
  const quantityEditable = canUpdateDeviceQuantity(currentUser?.email)
  const partialAndExpenseEditable = canEditPartialAndExpense(currentUser?.email)

  const [form, setForm] = useState<RequestDetailFormState | null>(null)
  const [users, setUsers] = useState<RepairUserOption[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [requests, setRequests] = useState<DeviceRequestListItem[]>([])
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [trueOriginalQty, setTrueOriginalQty] = useState<number | null>(null)
  const [sessionLoadedQty, setSessionLoadedQty] = useState<number | null>(null)

  const [totalQty, setTotalQty] = useState<number>(0)
  const [partialQuantity, setPartialQuantity] = useState<number>(0)
  const [sessionLoadedPartial, setSessionLoadedPartial] = useState<number | null>(null)
  const [expenseWithoutVatStr, setExpenseWithoutVatStr] = useState<string>('0')
  const expenseWithoutVat = useMemo(() => Math.max(0, parseFloat(expenseWithoutVatStr) || 0), [expenseWithoutVatStr])
  const expenseWithVat = useMemo(() => Math.round(expenseWithoutVat * 1.13 * 100) / 100, [expenseWithoutVat])

  const [quantityStr, setQuantityStr] = useState<string>('1')

  const canViewRequested = currentUser?.email ? canViewRequestedStatus(currentUser.email) : true
  const canViewRecommended = currentUser?.email ? canViewRecommendedStatus(currentUser.email) : true
  const canViewApproved = currentUser?.email ? canViewApprovedStatus(currentUser.email) : true
  const canViewRejected = currentUser?.email ? canViewRejectedStatus(currentUser.email) : true
  const canViewFulfilled = currentUser?.email ? canViewFulfilledStatus(currentUser.email) : true
  const canFulfillRequest = currentUser?.email ? canFulfillRequestStatus(currentUser.email) : false
  const canActOnReq = currentUser?.email ? canActOnRequested(currentUser.email) : false
  const canActOnRec = currentUser?.email ? canActOnRecommended(currentUser.email) : false
  const requestedActionLabel = currentUser?.email ? getRequestedActionLabel(currentUser.email) : 'Approve'

  useEffect(() => {
    const abortController = new AbortController()
    const requestId = parseRequestId(id)
    if (requestId === null) { setForm(null); setErrorMessage(`No record found for ${id}`); setIsLoading(false); return () => { abortController.abort() } }
    const load = async () => {
      setIsLoading(true); setErrorMessage(null)
      try {
        const [requestDetail, requestItems, userOptions, departmentOptions] = await Promise.all([
          fetchDeviceRequestById(requestId, abortController.signal),
          fetchDeviceRequests({ approvalStatus: '', deviceType: '' }, abortController.signal),
          fetchUsers(), fetchDepartments(abortController.signal),
        ])
        if (abortController.signal.aborted) return
        setRequests(requestItems); setUsers(userOptions); setDepartments(departmentOptions)
        setForm(createRequestForm(requestDetail))

        const dbQty = requestDetail.quantity
        setQuantityStr(String(dbQty))

        const storedTrueOriginal = localStorage.getItem(`req_original_qty_${requestId}`)
        if (storedTrueOriginal === null) { localStorage.setItem(`req_original_qty_${requestId}`, String(dbQty)); setTrueOriginalQty(dbQty) }
        else setTrueOriginalQty(Number(storedTrueOriginal))
        setSessionLoadedQty(dbQty)

        const storedTotal = localStorage.getItem(`req_total_qty_${requestId}`)
        const storedPartial = localStorage.getItem(`req_partial_qty_${requestId}`)
        const total = storedTotal !== null ? Number(storedTotal) : dbQty
        setTotalQty(total)
        const initialPartial = storedPartial !== null ? Number(storedPartial) : dbQty
        // Allow partial up to full total (default = total). Never exceed total.
        setPartialQuantity(Math.max(0, Math.min(initialPartial, total)))
        setSessionLoadedPartial(Math.max(0, Math.min(initialPartial, total)))

        const storedExpense = localStorage.getItem(`req_expense_${requestId}`)
        setExpenseWithoutVatStr(storedExpense !== null ? storedExpense : '0')
      } catch (error) {
        if (abortController.signal.aborted) return
        setForm(null); setErrorMessage(error instanceof Error ? error.message : 'Unable to load request detail.')
      } finally { if (!abortController.signal.aborted) setIsLoading(false) }
    }
    void load()
    return () => { abortController.abort() }
  }, [id])

  const selectedRequester = useMemo(() => users.find((u) => u.user_id === form?.requestedById) ?? null, [form?.requestedById, users])
  const selectedDepartment = useMemo(() => departments.find((d) => d.department_id === form?.departmentId) ?? null, [departments, form?.departmentId])
  const related = useMemo(() => requests.filter((r) => r.requestId !== form?.requestId && r.departmentId === form?.departmentId).slice(0, 3), [form?.departmentId, form?.requestId, requests])

  const canViewThisRequest = useMemo(() => {
    if (!form) return true
    if (form.approvalStatus === 'Requested' && !canViewRequested) return false
    if (form.approvalStatus === 'Pending' && !canViewRecommended) return false
    if (form.approvalStatus === 'Approved' && !canViewApproved) return false
    if (form.approvalStatus === 'Rejected' && !canViewRejected) return false
    if (form.approvalStatus === 'Fulfilled' && !canViewFulfilled) return false
    return true
  }, [form, canViewRequested, canViewRecommended, canViewApproved, canViewRejected, canViewFulfilled])

  if (isLoading) return <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}><div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" /><p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Loading request detail...</p></div>
  if (!form) return (
    <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <AlertCircle size={48} style={{ color: 'var(--muted)' }} /><h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Request Not Found</h2>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>{errorMessage ?? `No record found for ${id}`}</p>
      <button onClick={() => navigate('/requests')} className="btn-primary">&larr; Back to Requests</button>
    </div>
  )
  if (!canViewThisRequest) return (
    <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
      <AlertCircle size={48} style={{ color: 'var(--muted)' }} /><h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Access Denied</h2>
      <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>You do not have permission to view this request.</p>
      <button onClick={() => navigate('/requests')} className="btn-primary">&larr; Back to Requests</button>
    </div>
  )

  const isAnjana = currentUser?.email?.trim().toLowerCase() === 'anjana@yetiairlines.com'
  const isSudharshan = currentUser?.email?.trim().toLowerCase() === 'sudharshan@yetiairlines.com'
  const isFulfilledViewOnly = isSudharshan && form.approvalStatus === 'Fulfilled'
  const quantityOnlyEditable = quantityEditable && form.approvalStatus === 'Pending'
  const quantityEnabled = !isAnjana && !isFulfilledViewOnly && (deviceDetailsEditable || quantityOnlyEditable)
  const showPartialAndExpense = form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled'

  const setField = <Key extends keyof RequestDetailFormState>(key: Key, value: RequestDetailFormState[Key]) => {
    setForm((cur) => (cur ? { ...cur, [key]: value } : cur))
  }

  // Quantity = Total - Partial, but:
  //  - if Partial >= Total (default state) => Quantity = Total (never 0)
  //  - otherwise Quantity is at least 1
  const computeQuantity = (total: number, partial: number): number => {
    if (partial >= total) return total
    return Math.max(1, total - partial)
  }

  const handlePartialChange = (value: number) => {
    const clamped = Math.max(0, Math.min(value, totalQty))
    const remaining = computeQuantity(totalQty, clamped)
    setPartialQuantity(clamped)
    setField('quantity', remaining)
    setQuantityStr(String(remaining))
  }

  const handleQuantityInput = (raw: string) => {
    setQuantityStr(raw)
    const parsed = parseInt(raw, 10)
    if (!Number.isNaN(parsed) && parsed >= 1) {
      setField('quantity', parsed)
      setTotalQty(parsed)
      setPartialQuantity(parsed)
    }
  }

  const savePartialAndExpense = () => {
    if (!form) return
    localStorage.setItem(`req_total_qty_${form.requestId}`, String(totalQty))
    localStorage.setItem(`req_partial_qty_${form.requestId}`, String(partialQuantity))
    localStorage.setItem(`req_expense_${form.requestId}`, expenseWithoutVatStr)
  }

  const handleStatusChange = (nextStatus: RequestApprovalStatus) => {
    setForm((cur) => {
      if (!cur) return cur
      if (nextStatus === 'Requested' || nextStatus === 'Pending') return { ...cur, approvalStatus: nextStatus, approvedById: null, approvedByName: null, approvalDate: '' }
      const today = new Date().toISOString().slice(0, 10)
      return { ...cur, approvalStatus: nextStatus, approvedById: cur.approvedById ?? currentUser?.id ?? null, approvedByName: cur.approvedByName ?? currentUser?.name ?? null, approvalDate: cur.approvalDate || today }
    })
  }

  const performSave = async (): Promise<boolean> => {
    if (!form) return false
    if (!form.requestedById || !form.departmentId || !form.requestedFor.trim() || !form.deviceType.trim()) { showToast('Requester, department, requested for, and device type are required', 'error'); return false }
    try {
      const newQty = form.quantity
      if (sessionLoadedQty !== null && sessionLoadedQty !== newQty && trueOriginalQty !== null) {
        const key = `req_history_${form.requestId}`
        const hist = JSON.parse(localStorage.getItem(key) || '[]')
        const ev = { color: '#3b82f6', title: `${currentUser?.name || 'User'} updated the quantity from ${trueOriginalQty} units to ${newQty} units.`, date: new Date().toLocaleDateString() }
        if (!hist.some((h: any) => h.title === ev.title)) { hist.push(ev); localStorage.setItem(key, JSON.stringify(hist)) }
      }
      if (sessionLoadedPartial !== null && sessionLoadedPartial !== partialQuantity) {
        const key = `req_history_${form.requestId}`
        const hist = JSON.parse(localStorage.getItem(key) || '[]')
        const ev = { color: '#0891b2', title: `${currentUser?.name || 'User'} updated the quantity from ${sessionLoadedPartial} units to ${partialQuantity} units.`, date: new Date().toLocaleDateString() }
        if (!hist.some((h: any) => h.title === ev.title)) { hist.push(ev); localStorage.setItem(key, JSON.stringify(hist)) }
      }
      await updateDeviceRequestById(form.requestId, {
        requested_by: form.requestedById, department_id: form.departmentId, device_type: form.deviceType.trim(),
        brand: form.brand.trim(), reason: form.reason.trim(), quantity: form.quantity, priority: form.priority,
        requested_for: form.requestedFor.trim(), request_date: toNullableDate(form.requestDate),
        approval_status: form.approvalStatus, approved_by: form.approvedById, approval_date: toNullableDate(form.approvalDate)
      })
      savePartialAndExpense()
      setSessionLoadedQty(newQty); setSessionLoadedPartial(partialQuantity)
      const refreshed = await fetchDeviceRequestById(form.requestId)
      setForm(createRequestForm(refreshed))
      return true
    } catch (error) { showToast(error instanceof Error ? error.message : 'Failed to update device request.', 'error'); return false }
  }

  const handleSave = async () => { setIsSaving(true); const ok = await performSave(); if (ok) showToast(`${form?.id} updated successfully`, 'success'); setIsSaving(false) }

  const handleApproval = async (nextStatus: 'Approved' | 'Rejected' | 'Fulfilled' | 'Pending') => {
    if (!currentUser) { showToast('You must be logged in to review requests', 'error'); return }
    setIsSaving(true)
    try {
      const ok = await performSave(); if (!ok) { setIsSaving(false); return }
      await approveDeviceRequestById(form!.requestId, { approval_status: nextStatus, approved_by: currentUser.id })
      const [requestDetail, requestItems] = await Promise.all([fetchDeviceRequestById(form!.requestId), fetchDeviceRequests({ approvalStatus: '', deviceType: '' })])
      setRequests(requestItems); setForm(createRequestForm(requestDetail)); setSessionLoadedQty(requestDetail.quantity); setQuantityStr(String(requestDetail.quantity))
      let msg = `${form!.id} ${nextStatus.toLowerCase()}`; let type: 'success' | 'info' = 'info'
      if (nextStatus === 'Approved' || nextStatus === 'Fulfilled' || nextStatus === 'Pending') { msg = nextStatus === 'Pending' ? `${form!.id} recommended` : `${form!.id} ${nextStatus.toLowerCase()}`; type = 'success' }
      showToast(msg, type)
    } catch (error) { showToast(error instanceof Error ? error.message : `Failed to mark request as ${nextStatus}.`, 'error') }
    finally { setIsSaving(false); setShowRejectDialog(false) }
  }

  const timeline: TimelineItem[] = [{ color: 'var(--primary)', title: `Request submitted by ${selectedRequester?.user_name ?? form.approvedByName ?? `User #${form.requestedById}`}`, date: form.requestDate }]
  if (form.approvalStatus === 'Pending') timeline.push({ color: '#f59e0b', title: 'Moved to Recommended review', date: form.requestDate })
  if (form.approvalStatus === 'Approved' && form.approvedByName && form.approvalDate) timeline.push({ color: 'var(--success)', title: `Approved by ${form.approvedByName}`, date: form.approvalDate })
  if (form.approvalStatus === 'Rejected' && form.approvedByName && form.approvalDate) timeline.push({ color: 'var(--error-text)', title: `Rejected by ${form.approvedByName}`, date: form.approvalDate })
  if (form.approvalStatus === 'Fulfilled' && form.approvedByName && form.approvalDate) timeline.push({ color: '#0891b2', title: `Fulfilled by ${form.approvedByName}`, date: form.approvalDate })
  const frontendHistory: TimelineItem[] = form ? JSON.parse(localStorage.getItem(`req_history_${form.requestId}`) || '[]') : []
  const fullTimeline = [...timeline, ...frontendHistory].reverse()

  const canReviewFinal = !viewOnly && ((form.approvalStatus === 'Requested' && canActOnReq) || (form.approvalStatus === 'Pending' && canActOnRec))
  const canSave = (deviceDetailsEditable || requesterInfoEditable || quantityEditable || partialAndExpenseEditable) && !isFulfilledViewOnly

  const renderSectionTitle = (icon: ReactNode, title: string) => (
    <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-lighter)' }}>{icon}</div>{title}
    </div>
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/requests')} className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm" style={{ border: '1px solid var(--border-strong)' }}><ArrowLeft size={15} /> Requests</button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{form.id}</h1>
            <StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} /><StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canReviewFinal && (<>
            <button onClick={() => setShowRejectDialog(true)} disabled={isSaving} className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5" style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}><XCircle size={14} /> Reject</button>
            <button onClick={() => { const t = form.approvalStatus === 'Requested' && requestedActionLabel === 'Recommend' ? 'Pending' : 'Approved'; handleApproval(t) }} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(0,83,56,0.1)', color: 'var(--success-text)', border: '1px solid rgba(0,83,56,0.2)' }}>
              <CheckCircle2 size={14} /> {isSaving ? 'Saving...' : (form.approvalStatus === 'Requested' ? requestedActionLabel : 'Approve')}
            </button>
          </>)}
          {canFulfillRequest && form.approvalStatus === 'Approved' && (
            <button onClick={() => handleApproval('Fulfilled')} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{ background: 'rgba(0,83,56,0.1)', color: 'var(--success-text)', border: '1px solid rgba(0,83,56,0.2)' }}>
              <CheckCircle2 size={14} /> {isSaving ? 'Saving...' : 'Fulfill'}
            </button>
          )}
          {canSave && (<button onClick={handleSave} className="btn-primary text-sm" disabled={isSaving}><Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}</button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="section-card">
            {renderSectionTitle(<Monitor size={14} style={{ color: 'var(--primary)' }} />, 'Device Details')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Device Type</label><input value={form.deviceType} onChange={(e) => setField('deviceType', e.target.value)} placeholder="e.g. Laptop, Monitor..." disabled={!deviceDetailsEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Brand / Model</label><input value={form.brand} onChange={(e) => setField('brand', e.target.value)} placeholder="e.g. Dell XPS 15" disabled={!deviceDetailsEditable} className="input-field" /></div>

              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Priority</label>
                <select value={form.priority} onChange={(e) => setField('priority', e.target.value as Priority)} disabled={!deviceDetailsEditable} className="input-field">{PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}</select>
              </div>

              <div>
                <div className="flex items-start gap-4 flex-wrap">
                  <div style={{ width: '150px', flexShrink: 0 }}>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantityStr}
                      onChange={(e) => handleQuantityInput(e.target.value)}
                      disabled={!quantityEnabled}
                      className="input-field"
                      style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}
                    />
                  </div>
                  {showPartialAndExpense && (
                    <div style={{ width: '150px', flexShrink: 0 }}>
                      <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Partial (Fulfilled)</label>
                      <div
                        className="input-field flex items-stretch overflow-hidden select-none"
                        style={{
                          width: '100%',
                          padding: 0,
                          background: partialAndExpenseEditable ? 'var(--input-bg)' : 'var(--surface-low)',
                          opacity: partialAndExpenseEditable ? 1 : 0.7,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handlePartialChange(partialQuantity - 1)}
                          disabled={!partialAndExpenseEditable || partialQuantity <= 0}
                          className="flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ padding: '0.625rem 0.625rem', borderRight: '1px solid var(--border-color)', color: 'var(--on-surface)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="flex-1 flex items-center justify-center text-sm font-bold tabular-nums" style={{ padding: '0.625rem 0', color: 'var(--on-surface)' }}>
                          {String(partialQuantity).padStart(2, '0')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePartialChange(partialQuantity + 1)}
                          disabled={!partialAndExpenseEditable || partialQuantity >= totalQty}
                          className="flex items-center justify-center hover:bg-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ padding: '0.625rem 0.625rem', borderLeft: '1px solid var(--border-color)', color: 'var(--on-surface)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {showPartialAndExpense && (
                <>
                  <div>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expense Without VAT [Rs.]</label>
                    <input type="number" min="0" step="0.01" value={expenseWithoutVatStr} onChange={(e) => setExpenseWithoutVatStr(e.target.value)} disabled={!partialAndExpenseEditable} className="input-field" placeholder="0" />
                  </div>
                  <div>
                    <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expense With VAT (13%) [Rs.]</label>
                    <input type="number" value={expenseWithoutVatStr === '' ? '' : expenseWithVat} readOnly className="input-field" style={{ background: 'var(--surface-low)', opacity: 0.85 }} />
                  </div>
                </>
              )}

              <div className="sm:col-span-2"><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Reason / Justification</label><textarea value={form.reason} onChange={(e) => setField('reason', e.target.value)} rows={3} placeholder="Why is this device needed?" disabled={!deviceDetailsEditable} className="input-field resize-none" /></div>
            </div>
          </div>

          <div className="section-card">
            {renderSectionTitle(<User size={14} style={{ color: 'var(--primary)' }} />, 'Requester Information')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Requested By</label><select value={String(form.requestedById)} onChange={(e) => setField('requestedById', Number(e.target.value))} disabled={!requesterInfoEditable} className="input-field"><option value="">Select requester</option>{users.map((u) => (<option key={u.user_id} value={u.user_id}>{u.user_name}</option>))}</select></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Department</label><select value={String(form.departmentId)} onChange={(e) => setField('departmentId', Number(e.target.value))} disabled={!requesterInfoEditable} className="input-field"><option value="">Select department</option>{departments.map((d) => (<option key={d.department_id} value={d.department_id}>{d.department_name}</option>))}</select></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Requested For</label><input value={form.requestedFor} onChange={(e) => setField('requestedFor', e.target.value)} placeholder="e.g. New hire, Apple" disabled={!requesterInfoEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Request Date</label><input type="date" value={form.requestDate} onChange={(e) => setField('requestDate', e.target.value)} disabled={!requesterInfoEditable} className="input-field" /></div>
              <div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Status</label><select value={form.approvalStatus} onChange={(e) => handleStatusChange(e.target.value as RequestApprovalStatus)} disabled={!requesterInfoEditable} className="input-field">{REQUEST_STATUSES.map((s) => (<option key={s} value={s}>{formatDeviceRequestStatus(s)}</option>))}</select></div>
              {form.approvalDate && (<div><label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Decision Date</label><input readOnly value={form.approvalDate} className="input-field" style={{ opacity: 0.7 }} /></div>)}
            </div>
            {(form.approvalStatus === 'Approved' || form.approvalStatus === 'Rejected' || form.approvalStatus === 'Fulfilled') && (
              <div className="mt-4 pt-4 flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled' ? 'var(--success-bg)' : 'var(--error-bg)', border: `1px solid ${form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled' ? 'rgba(0,83,56,0.2)' : 'rgba(186,26,26,0.2)'}`, borderTop: '1px solid var(--border-color)' }}>
                {form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled' ? <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} /> : <XCircle size={18} style={{ color: 'var(--error-text)' }} />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: form.approvalStatus === 'Approved' || form.approvalStatus === 'Fulfilled' ? 'var(--success-text)' : 'var(--error-text)' }}>{form.approvalStatus} by {form.approvedByName ?? '-'}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>on {form.approvalDate || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Quick Info</p>
            <InfoRow icon={Hash} label="Request ID" value={form.id} />
            <InfoRow icon={Building} label="Department" value={selectedDepartment?.department_name ?? ''} />
            <InfoRow icon={User} label="Requester" value={selectedRequester?.user_name ?? ''} />
            <InfoRow icon={Tag} label="Requested For" value={form.requestedFor} />
            <InfoRow icon={Calendar} label="Request Date" value={form.requestDate} />
            {showPartialAndExpense && (<>
              <InfoRow icon={Package} label="Total Qty" value={totalQty} />
              <InfoRow icon={Package} label="Partial (Fulfilled)" value={partialQuantity} />
              <InfoRow icon={Package} label="Remaining" value={Math.max(0, totalQty - partialQuantity)} />
            </>)}
            <div className="flex items-start gap-3 pt-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-lighter)' }}><Tag size={13} style={{ color: 'var(--primary)' }} /></div>
              <div><p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Status</p><div className="mt-1"><StatusBadge status={formatDeviceRequestStatus(form.approvalStatus)} /></div></div>
            </div>
          </div>
          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}><Clock size={15} style={{ color: 'var(--primary)' }} /> History</div>
            {fullTimeline.map((event, index) => (<TimelineEvent key={`${event.title}-${index}`} {...event} last={index === fullTimeline.length - 1} />))}
          </div>
          {related.length > 0 && (
            <div className="section-card">
              <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}><FileText size={15} style={{ color: 'var(--primary)' }} /> From Same Department</div>
              <div className="space-y-2">
                {related.map((request) => (
                  <button key={request.requestId} onClick={() => navigate(`/requests/${request.requestId}`)} className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all" style={{ background: 'var(--surface-low)' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-container)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-low)' }}>
                    <div><code className="text-xs font-bold" style={{ color: 'var(--secondary)' }}>{request.id}</code><p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: 'var(--muted)' }}>{request.deviceType}</p></div>
                    <div className="flex items-center gap-1.5"><StatusBadge status={formatDeviceRequestStatus(request.approvalStatus)} /><ChevronRight size={12} style={{ color: 'var(--muted)' }} /></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog isOpen={showRejectDialog} onClose={() => setShowRejectDialog(false)} onConfirm={() => handleApproval('Rejected')} danger title="Reject Request" message={`Reject ${form.id}? This action will be logged.`} />
    </div>
  )
}