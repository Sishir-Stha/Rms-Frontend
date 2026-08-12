import DateRangeFilter from '../components/DateRangeFilter'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { CheckCircle, ChevronLeft, ChevronRight, Edit2, Plus, Search, Trash2, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fetchDepartments } from '../services/departments.service'
import { fetchDeviceCategories } from '../services/device_categories.service'
import {
  approveDeviceRequestById,
  createDeviceRequestEntry,
  deleteDeviceRequestById,
  fetchDeviceRequests,
  subscribeToDeviceRequestsChanged,
} from '../services/device-request.service'
import { fetchUsers } from '../services/user.service'
import type { Priority, RequestApprovalStatus } from '../types/app'
import type { DeviceRequestListItem } from '../types/device-request.types'
import type { RepairCategoryOption, RepairDepartmentOption, RepairUserOption } from '../types/repair.types'
import {
  canCreateDeviceRequestForUser,
  getUserAccess,
  canViewRecommendedStatus,
  canViewRejectedStatus,
  canViewFulfilledStatus,
  canViewRequestedStatus, // <-- ADDED
  canDeleteDeviceRequest,
} from '../utils/access-control'
import { formatDeviceRequestStatus } from '../utils/device-request-status'

interface DeviceRequestFormData {
  requestedById: number
  requestedFor: string
  departmentId: number
  deviceType: string
  brand: string
  reason: string
  quantity: number
  priority: Priority
}

interface ConfirmState {
  requestId: number
  requestLabel: string
  action: 'reject' | 'delete'
}

type StatusFilter = 'All' | RequestApprovalStatus

const STATUSES: StatusFilter[] = ['All', 'Requested', 'Pending', 'Approved', 'Rejected', 'Fulfilled']
const SUMMARY_STATUSES: RequestApprovalStatus[] = ['Requested', 'Pending', 'Approved', 'Rejected', 'Fulfilled']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const PAGE_SIZE = 8

const emptyForm: DeviceRequestFormData = {
  requestedById: 0,
  requestedFor: '',
  departmentId: 0,
  deviceType: '',
  brand: '',
  reason: '',
  quantity: 1,
  priority: 'Medium',
}

const SUMMARY_COLORS: Record<RequestApprovalStatus, string> = {
  Requested: '#bac5ee',
  Pending: '#f59e0b',
  Approved: '#62df7d',
  Rejected: '#ffb4ab',
  Fulfilled: '#0891b2',
}

const getEmptyMessage = (statusFilter: StatusFilter): string =>
  statusFilter === 'All' ? 'No device requests found' : `No records found for status: ${formatDeviceRequestStatus(statusFilter)}`

export default function DeviceRequests() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const canCreateDeviceRequest = canCreateDeviceRequestForUser(currentUser?.email)
  const access = getUserAccess(currentUser?.email)
  const isRestrictedUserFlag = access.isRestricted && !access.canCreateRequest

  const canViewRecommended = currentUser?.email ? canViewRecommendedStatus(currentUser.email) : true
  const canViewRejected = currentUser?.email ? canViewRejectedStatus(currentUser.email) : true
  const canViewFulfilled = currentUser?.email ? canViewFulfilledStatus(currentUser.email) : true
  const canViewRequested = currentUser?.email ? canViewRequestedStatus(currentUser.email) : true // <-- ADDED
  const canDeleteRequest = currentUser?.email ? canDeleteDeviceRequest(currentUser.email) : true

  const [requests, setRequests] = useState<DeviceRequestListItem[]>([])
  const [users, setUsers] = useState<RepairUserOption[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [categories, setCategories] = useState<RepairCategoryOption[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<DeviceRequestFormData>(emptyForm)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lookupErrorMessage, setLookupErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToDeviceRequestsChanged(() => setRefreshKey((currentValue) => currentValue + 1))
    return unsubscribe
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    const loadPageData = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      setLookupErrorMessage(null)
      try {
        const [requestItems, userOptions, departmentOptions, categoryOptions] = await Promise.all([
          fetchDeviceRequests({ approvalStatus: '', deviceType: '' }, abortController.signal),
          fetchUsers(),
          fetchDepartments(abortController.signal),
          fetchDeviceCategories(abortController.signal),
        ])
        if (abortController.signal.aborted) return
        setRequests(requestItems)
        setUsers(userOptions)
        setDepartments(departmentOptions)
        setCategories(categoryOptions)
      } catch (error) {
        if (abortController.signal.aborted) return
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load device requests.')
      } finally {
        if (!abortController.signal.aborted) setIsLoading(false)
      }
    }
    void loadPageData()
    return () => { abortController.abort() }
  }, [refreshKey])

  const refreshRequests = async () => {
    setErrorMessage(null)
    try {
      const requestItems = await fetchDeviceRequests({ approvalStatus: '', deviceType: '' })
      setRequests(requestItems)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load device requests.')
    }
  }

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests
      .filter((request) => {
        const matchesStatus = statusFilter === 'All' || request.approvalStatus === statusFilter
        const matchesDate = (() => {
          if (!dateFrom && !dateTo) return true
          const requestDate = request.requestDate
          if (dateFrom && requestDate < dateFrom) return false
          if (dateTo && requestDate > dateTo) return false
          return true
        })()
        const matchesSearch =
          query === '' ||
          request.id.toLowerCase().includes(query) ||
          request.requestedBy.toLowerCase().includes(query) ||
          request.department.toLowerCase().includes(query) ||
          request.deviceType.toLowerCase().includes(query) ||
          request.brand.toLowerCase().includes(query)
        return matchesStatus && matchesDate && matchesSearch
      })
      .sort((a, b) => a.requestId - b.requestId)
  }, [requests, search, statusFilter, dateFrom, dateTo])

  const paginatedRequests = filteredRequests

  const resetCreateForm = () => {
    setForm({
      ...emptyForm,
      requestedById: users[0]?.user_id ?? 0,
      departmentId: departments[0]?.department_id ?? 0,
      deviceType: categories[0]?.category_name ?? '',
    })
  }

  const openCreateModal = () => {
    if (!canCreateDeviceRequest) {
      showToast('You do not have permission to create requests', 'error')
      return
    }
    resetCreateForm()
    setShowModal(true)
  }

  const handleApprove = async (requestId: number) => {
    if (!currentUser) {
      showToast('You must be logged in to approve requests', 'error')
      return
    }
    try {
      const updatedRequest = await approveDeviceRequestById(requestId, { approval_status: 'Approved', approved_by: currentUser.id })
      if (updatedRequest) {
        setRequests((previousRequests) => previousRequests.map((request) => request.requestId === requestId ? updatedRequest : request))
      } else {
        await refreshRequests()
      }
      showToast('Request approved', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to approve request.', 'error')
    }
  }

  const handleReject = async (requestId: number) => {
    if (!currentUser) {
      showToast('You must be logged in to reject requests', 'error')
      return
    }
    try {
      const updatedRequest = await approveDeviceRequestById(requestId, { approval_status: 'Rejected', approved_by: currentUser.id })
      if (updatedRequest) {
        setRequests((previousRequests) => previousRequests.map((request) => request.requestId === requestId ? updatedRequest : request))
      } else {
        await refreshRequests()
      }
      showToast('Request rejected', 'info')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to reject request.', 'error')
    } finally {
      setConfirm(null)
    }
  }

  const handleCreate = async () => {
    if (!canCreateDeviceRequest) {
      showToast('You do not have permission to create requests', 'error')
      setShowModal(false)
      return
    }
    if (!form.requestedById || !form.departmentId || !form.requestedFor.trim() || !form.deviceType.trim()) {
      showToast('Requester, department, requested for, and device type are required', 'error')
      return
    }
    setIsSubmitting(true)
    try {
      await createDeviceRequestEntry({
        requested_by: form.requestedById,
        department_id: form.departmentId,
        device_type: form.deviceType.trim(),
        brand: form.brand.trim(),
        reason: form.reason.trim(),
        quantity: form.quantity,
        priority: form.priority,
        requested_for: form.requestedFor.trim(),
      })
      await refreshRequests()
      showToast('Device request submitted', 'success')
      setShowModal(false)
      resetCreateForm()
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create device request.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (requestId: number) => {
    try {
      await deleteDeviceRequestById(requestId)
      setRequests((previousRequests) => previousRequests.filter((request) => request.requestId !== requestId))
      showToast('Request deleted', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete device request.', 'error')
    } finally {
      setConfirm(null)
    }
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
  }

  const shouldHideApproveReject = currentUser?.email
    ? ['bhupal@yetiairlines.com', 'umesh.acharya@yetiairlines.com', 'ajita@yetiairlines.com', 'roshan@yetiairlines.com', 'aayush@yetiairlines.com', 'raj@yetiairlines.com'].includes(currentUser.email.trim().toLowerCase())
    : false

    // Calculate exactly which summary statuses are visible for this user
  const visibleSummaryStatuses = SUMMARY_STATUSES.filter((status) => {
    if (status === 'Requested' && !canViewRequested) return false
    if (status === 'Pending' && !canViewRecommended) return false
    if (status === 'Rejected' && !canViewRejected) return false
    if (status === 'Fulfilled' && !canViewFulfilled) return false
    return true
  })

  // Dynamically assign the perfect grid class based on the count
  const summaryGridClass = 
    visibleSummaryStatuses.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
    visibleSummaryStatuses.length === 4 ? 'grid-cols-2 sm:grid-cols-4' :
    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Loading device requests...
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">Device Requests</h2>
          <p className="text-sm text-on-surface-variant">Manage device request approvals and workflows</p>
        </div>
        {canCreateDeviceRequest && (
          <button id="new-request-btn" onClick={openCreateModal} className="btn-primary flex-shrink-0">
            <Plus size={16} /> New Request
          </button>
        )}
      </div>

            {/* Dynamic Grid: Perfectly fits 3, 4, or 5 cards */}
      <div className={`grid ${summaryGridClass} gap-3`}>
        {visibleSummaryStatuses.map((status) => (
          <div key={status} className="section-card text-center py-3">
            <p className="font-display font-bold text-2xl" style={{ color: SUMMARY_COLORS[status] }}>
              {requests.filter((request) => request.approvalStatus === status).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{formatDeviceRequestStatus(status)}</p>
          </div>
        ))}
      </div>

            <div className="section-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search requester, department, device..."
              className="input-field pl-9 py-2.5 w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUSES.filter((status) => {
              if (status === 'Requested' && !canViewRequested) return false
              if (status === 'Pending' && !canViewRecommended) return false
              if (status === 'Rejected' && !canViewRejected) return false
              if (status === 'Fulfilled' && !canViewFulfilled) return false
              return true
            }).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === status
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {formatDeviceRequestStatus(status)}
              </button>
            ))}
          </div>
          
          {/* Pushed to the far right */}
          <div className="ml-auto flex-shrink-0">
            <DateRangeFilter
              onApply={(from, to) => {
                setDateFrom(from)
                setDateTo(to)
              }}
            />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="section-card flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--error-text)' }}>{errorMessage}</p>
          <button onClick={() => void refreshRequests()} className="btn-secondary px-3 py-1.5 text-xs">Retry</button>
        </div>
      ) : null}

      <div className="section-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Requested By</th><th>Department</th><th>Device</th><th>Qty</th><th>Priority</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-on-surface-variant">{getEmptyMessage(statusFilter)}</td></tr>
              ) : (
                filteredRequests.map((request) => {
                  const canReview = request.approvalStatus === 'Requested' || request.approvalStatus === 'Pending'
                  return (
                    <tr key={request.requestId} className="cursor-pointer" onDoubleClick={() => navigate(`/requests/${request.requestId}`)}>
                      <td onClick={(event) => event.stopPropagation()}><code className="text-secondary text-xs">{request.id}</code></td>
                      <td><span className="text-sm font-medium text-on-surface">{request.requestedBy}</span></td>
                      <td><span className="text-sm text-on-surface-variant">{request.department}</span></td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-on-surface">{request.deviceType}</p>
                          <p className="text-xs text-on-surface-variant">{request.brand || '-'}</p>
                        </div>
                      </td>
                      <td className="text-sm text-on-surface-variant">{request.quantity}</td>
                      <td onClick={(event) => event.stopPropagation()}><StatusBadge status={request.priority} /></td>
                      <td onClick={(event) => event.stopPropagation()}><StatusBadge status={formatDeviceRequestStatus(request.approvalStatus)} /></td>
                      <td className="text-xs whitespace-nowrap" style={{ color: 'var(--muted)' }} onClick={(event) => event.stopPropagation()}>{request.requestDate}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {canReview ? (
                          <div className="flex items-center gap-1.5">
                            {!isRestrictedUserFlag && !shouldHideApproveReject && (
                              <>
                                <button onClick={() => void handleApprove(request.requestId)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--success-text)', background: 'var(--success-bg)' }}><CheckCircle size={12} /> Approve</button>
                                <button onClick={() => setConfirm({ requestId: request.requestId, requestLabel: request.id, action: 'reject' })} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }}><XCircle size={12} /> Reject</button>
                              </>
                            )}
                            <button onClick={() => navigate(`/requests/${request.requestId}`)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ color: 'var(--primary)', background: 'var(--primary-lighter)' }}><Edit2 size={11} /> View</button>
                            {canDeleteRequest && (
                              <button onClick={() => setConfirm({ requestId: request.requestId, requestLabel: request.id, action: 'delete' })} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }}><Trash2 size={12} /> Delete</button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => navigate(`/requests/${request.requestId}`)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ color: 'var(--primary)', background: 'var(--primary-lighter)' }}><Edit2 size={11} /> View</button>
                            {canDeleteRequest && (
                              <button onClick={() => setConfirm({ requestId: request.requestId, requestLabel: request.id, action: 'delete' })} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold" style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }}><Trash2 size={11} /> Delete</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canCreateDeviceRequest && (
        <Modal isOpen={showModal && canCreateDeviceRequest} onClose={() => setShowModal(false)} title="New Device Request" size="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Requested By</label>
              <select value={form.requestedById ? String(form.requestedById) : ''} onChange={(event) => setForm((currentForm) => ({ ...currentForm, requestedById: Number(event.target.value) }))} className="input-field">
                <option value="">{users.length === 0 ? 'No users available' : 'Select requester'}</option>
                {users.map((user) => (<option key={user.user_id} value={user.user_id}>{user.user_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Department</label>
              <select value={form.departmentId ? String(form.departmentId) : ''} onChange={(event) => setForm((currentForm) => ({ ...currentForm, departmentId: Number(event.target.value) }))} className="input-field">
                <option value="">{departments.length === 0 ? 'No departments available' : 'Select department'}</option>
                {departments.map((department) => (<option key={department.department_id} value={department.department_id}>{department.department_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Requested For</label>
              <input value={form.requestedFor} onChange={(event) => setForm((currentForm) => ({ ...currentForm, requestedFor: event.target.value }))} placeholder="e.g. Finance team" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Device Type</label>
              <select value={form.deviceType} onChange={(event) => setForm((currentForm) => ({ ...currentForm, deviceType: event.target.value }))} className="input-field">
                <option value="">{categories.length === 0 ? 'No device categories available' : 'Select device type'}</option>
                {categories.map((category) => (<option key={category.category_id} value={category.category_name}>{category.category_name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Preferred Brand/Model</label>
              <input value={form.brand} onChange={(event) => setForm((currentForm) => ({ ...currentForm, brand: event.target.value }))} placeholder="e.g. Dell XPS 15" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={(event) => setForm((currentForm) => ({ ...currentForm, quantity: Math.max(1, Number(event.target.value) || 1) }))} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={(event) => setForm((currentForm) => ({ ...currentForm, priority: event.target.value as Priority }))} className="input-field">
                {PRIORITIES.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Reason</label>
              <textarea value={form.reason} onChange={(event) => setForm((currentForm) => ({ ...currentForm, reason: event.target.value }))} rows={2} placeholder="Why is this device needed?" className="input-field resize-none" />
            </div>
            {lookupErrorMessage ? <p className="text-xs sm:col-span-2" style={{ color: 'var(--error-text)' }}>{lookupErrorMessage}</p> : null}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">Cancel</button>
            <button onClick={() => void handleCreate()} className="btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.action === 'reject') { void handleReject(confirm.requestId); return }
          if (confirm?.action === 'delete') { void handleDelete(confirm.requestId) }
        }}
        danger
        title={confirm?.action === 'delete' ? 'Delete Request' : 'Reject Request'}
        message={confirm?.action === 'delete' ? `Are you sure you want to delete ${confirm.requestLabel}?` : `Are you sure you want to reject ${confirm?.requestLabel ?? 'this device request'}?`}
      />
    </div>
  )
}