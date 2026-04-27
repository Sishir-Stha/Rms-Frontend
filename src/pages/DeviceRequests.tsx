import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  XCircle,
} from 'lucide-react'
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
  fetchDeviceRequests,
  subscribeToDeviceRequestsChanged,
} from '../services/device-request.service'
import { fetchUsers } from '../services/user.service'
import type { Priority, RequestApprovalStatus } from '../types/app'
import type { DeviceRequestListItem } from '../types/device-request.types'
import type {
  RepairCategoryOption,
  RepairDepartmentOption,
  RepairUserOption,
} from '../types/repair.types'

interface DeviceRequestFormData {
  requestedById: number
  departmentId: number
  deviceType: string
  brand: string
  reason: string
  quantity: number
  priority: Priority
}

interface ConfirmState {
  requestId: number
  action: 'reject'
}

type StatusFilter = 'All' | RequestApprovalStatus

const STATUSES: StatusFilter[] = ['All', 'Requested', 'Pending', 'Approved', 'Rejected']
const SUMMARY_STATUSES: RequestApprovalStatus[] = ['Requested', 'Pending', 'Approved', 'Rejected']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const PAGE_SIZE = 8

const emptyForm: DeviceRequestFormData = {
  requestedById: 0,
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
}

const getEmptyMessage = (statusFilter: StatusFilter): string =>
  statusFilter === 'All'
    ? 'No device requests found'
    : `No records found for status: ${statusFilter}`

export default function DeviceRequests() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<DeviceRequestListItem[]>([])
  const [users, setUsers] = useState<RepairUserOption[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [categories, setCategories] = useState<RepairCategoryOption[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<DeviceRequestFormData>(emptyForm)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lookupErrorMessage, setLookupErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeToDeviceRequestsChanged(() => {
      setRefreshKey((currentValue) => currentValue + 1)
    })

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

        if (abortController.signal.aborted) {
          return
        }

        setRequests(requestItems)
        setUsers(userOptions)
        setDepartments(departmentOptions)
        setCategories(categoryOptions)
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load device requests.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadPageData()

    return () => {
      abortController.abort()
    }
  }, [refreshKey])

  const refreshRequests = async () => {
    setErrorMessage(null)

    try {
      const requestItems = await fetchDeviceRequests({ approvalStatus: '', deviceType: '' })
      setRequests(requestItems)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load device requests.',
      )
    }
  }

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()

    return requests.filter((request) => {
      const matchesStatus =
        statusFilter === 'All' || request.approvalStatus === statusFilter
      const matchesSearch =
        query === '' ||
        request.id.toLowerCase().includes(query) ||
        request.requestedBy.toLowerCase().includes(query) ||
        request.department.toLowerCase().includes(query) ||
        request.deviceType.toLowerCase().includes(query) ||
        request.brand.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [requests, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const paginatedRequests = filteredRequests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetCreateForm = () => {
    setForm({
      ...emptyForm,
      requestedById: users[0]?.user_id ?? 0,
      departmentId: departments[0]?.department_id ?? 0,
      deviceType: categories[0]?.category_name ?? '',
    })
  }

  const openCreateModal = () => {
    resetCreateForm()
    setShowModal(true)
  }

  const handleApprove = async (requestId: number) => {
    if (!currentUser) {
      showToast('You must be logged in to approve requests', 'error')
      return
    }

    try {
      const updatedRequest = await approveDeviceRequestById(requestId, {
        approval_status: 'Approved',
        approved_by: currentUser.id,
      })

      if (updatedRequest) {
        setRequests((previousRequests) =>
          previousRequests.map((request) =>
            request.requestId === requestId ? updatedRequest : request,
          ),
        )
      } else {
        await refreshRequests()
      }

      showToast('Request approved', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to approve request.',
        'error',
      )
    }
  }

  const handleReject = async (requestId: number) => {
    if (!currentUser) {
      showToast('You must be logged in to reject requests', 'error')
      return
    }

    try {
      const updatedRequest = await approveDeviceRequestById(requestId, {
        approval_status: 'Rejected',
        approved_by: currentUser.id,
      })

      if (updatedRequest) {
        setRequests((previousRequests) =>
          previousRequests.map((request) =>
            request.requestId === requestId ? updatedRequest : request,
          ),
        )
      } else {
        await refreshRequests()
      }

      showToast('Request rejected', 'info')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to reject request.',
        'error',
      )
    } finally {
      setConfirm(null)
    }
  }

  const handleCreate = async () => {
    if (!form.requestedById || !form.departmentId || !form.deviceType.trim()) {
      showToast('Requester, department, and device type are required', 'error')
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
      })

      await refreshRequests()
      showToast('Device request submitted', 'success')
      setShowModal(false)
      resetCreateForm()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to create device request.',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
  }

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
          <h2 className="font-display font-bold text-xl text-on-surface">
            Device Requests
          </h2>
          <p className="text-sm text-on-surface-variant">
            Manage device request approvals and workflows
          </p>
        </div>
        <button
          id="new-request-btn"
          onClick={openCreateModal}
          className="btn-primary flex-shrink-0"
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_STATUSES.map((status) => (
          <div key={status} className="section-card text-center py-3">
            <p className="font-display font-bold text-2xl" style={{ color: SUMMARY_COLORS[status] }}>
              {requests.filter((request) => request.approvalStatus === status).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{status}</p>
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
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === status ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="section-card flex items-center justify-between gap-3">
          <p className="text-sm" style={{ color: 'var(--error-text)' }}>
            {errorMessage}
          </p>
          <button onClick={() => void refreshRequests()} className="btn-secondary px-3 py-1.5 text-xs">
            Retry
          </button>
        </div>
      ) : null}

      <div className="section-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requested By</th>
                <th>Department</th>
                <th>Device</th>
                <th>Qty</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-on-surface-variant">
                    {getEmptyMessage(statusFilter)}
                  </td>
                </tr>
              ) : (
                paginatedRequests.map((request) => {
                  const canReview =
                    request.approvalStatus === 'Requested' || request.approvalStatus === 'Pending'

                  return (
                    <tr
                      key={request.requestId}
                      className="cursor-pointer"
                      onClick={() => navigate(`/requests/${request.requestId}`)}
                    >
                      <td onClick={(event) => event.stopPropagation()}>
                        <code className="text-secondary text-xs">{request.id}</code>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-on-surface">
                          {request.requestedBy}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-on-surface-variant">
                          {request.department}
                        </span>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-on-surface">
                            {request.deviceType}
                          </p>
                          <p className="text-xs text-on-surface-variant">{request.brand || '-'}</p>
                        </div>
                      </td>
                      <td className="text-sm text-on-surface-variant">{request.quantity}</td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <StatusBadge status={request.priority} />
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        <StatusBadge status={request.approvalStatus} />
                      </td>
                      <td
                        className="text-xs"
                        style={{ color: 'var(--muted)' }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {request.requestDate}
                      </td>
                      <td onClick={(event) => event.stopPropagation()}>
                        {canReview ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => void handleApprove(request.requestId)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                color: 'var(--success-text)',
                                background: 'var(--success-bg)',
                              }}
                            >
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button
                              onClick={() => setConfirm({ requestId: request.requestId, action: 'reject' })}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                              style={{
                                color: 'var(--error-text)',
                                background: 'var(--error-bg)',
                              }}
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate(`/requests/${request.requestId}`)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              color: 'var(--primary)',
                              background: 'var(--primary-lighter)',
                            }}
                          >
                            <Edit2 size={11} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/15 px-1">
          <p className="text-xs text-on-surface-variant">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filteredRequests.length)}-
            {Math.min(page * PAGE_SIZE, filteredRequests.length)} of {filteredRequests.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
              className="w-7 h-7 rounded-lg btn-ghost disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-on-surface px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="w-7 h-7 rounded-lg btn-ghost disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Device Request"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Requested By
            </label>
            <select
              value={form.requestedById ? String(form.requestedById) : ''}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  requestedById: Number(event.target.value),
                }))
              }
              className="input-field"
            >
              <option value="">
                {users.length === 0 ? 'No users available' : 'Select requester'}
              </option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.user_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Department
            </label>
            <select
              value={form.departmentId ? String(form.departmentId) : ''}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  departmentId: Number(event.target.value),
                }))
              }
              className="input-field"
            >
              <option value="">
                {departments.length === 0 ? 'No departments available' : 'Select department'}
              </option>
              {departments.map((department) => (
                <option key={department.department_id} value={department.department_id}>
                  {department.department_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Device Type
            </label>
            <select
              value={form.deviceType}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  deviceType: event.target.value,
                }))
              }
              className="input-field"
            >
              <option value="">
                {categories.length === 0 ? 'No device categories available' : 'Select device type'}
              </option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_name}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Preferred Brand/Model
            </label>
            <input
              value={form.brand}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  brand: event.target.value,
                }))
              }
              placeholder="e.g. Dell XPS 15"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    quantity: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    priority: event.target.value as Priority,
                  }))
                }
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
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Reason
            </label>
            <textarea
              value={form.reason}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  reason: event.target.value,
                }))
              }
              rows={2}
              placeholder="Why is this device needed?"
              className="input-field resize-none"
            />
          </div>
          {lookupErrorMessage ? (
            <p className="text-xs" style={{ color: 'var(--error-text)' }}>
              {lookupErrorMessage}
            </p>
          ) : null}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">
            Cancel
          </button>
          <button onClick={() => void handleCreate()} className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.action === 'reject') {
            void handleReject(confirm.requestId)
          }
        }}
        danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?"
      />
    </div>
  )
}
