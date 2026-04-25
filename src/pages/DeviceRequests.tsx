import { useState, type ChangeEvent } from 'react'
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
import { useToast } from '../context/ToastContext'
import { DEPARTMENTS, DEVICE_REQUESTS } from '../data/dummyData'
import type { DeviceRequestRecord, Priority, RequestApprovalStatus } from '../types/app'

interface DeviceRequestFormData {
  requestedBy: string
  department: string
  deviceType: string
  brand: string
  reason: string
  priority: Priority
}

interface ConfirmState {
  id: string
  action: 'reject'
}

type StatusFilter = 'All' | RequestApprovalStatus
type TextFieldKey = 'requestedBy' | 'deviceType' | 'brand'

const STATUSES: StatusFilter[] = ['All', 'Pending', 'Approved', 'Rejected']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const PAGE_SIZE = 8

const emptyForm: DeviceRequestFormData = {
  requestedBy: '',
  department: '',
  deviceType: '',
  brand: '',
  reason: '',
  priority: 'Medium',
}

const TEXT_FIELDS: Array<{ key: TextFieldKey; label: string; placeholder: string }> = [
  { key: 'requestedBy', label: 'Requested By', placeholder: 'Employee name' },
  { key: 'deviceType', label: 'Device Type', placeholder: 'e.g. Laptop, Phone, Monitor' },
  { key: 'brand', label: 'Preferred Brand/Model', placeholder: 'e.g. Dell XPS 15' },
]

export default function DeviceRequests() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [requests, setRequests] = useState<DeviceRequestRecord[]>(DEVICE_REQUESTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<DeviceRequestFormData>(emptyForm)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const filtered = requests.filter((request) => {
    const matchesStatus =
      statusFilter === 'All' || request.approvalStatus === statusFilter
    const query = search.toLowerCase()
    const matchesSearch =
      !query ||
      request.id.toLowerCase().includes(query) ||
      request.requestedBy.toLowerCase().includes(query) ||
      request.department.toLowerCase().includes(query) ||
      request.deviceType.toLowerCase().includes(query)

    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleApprove = (id: string) => {
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              approvalStatus: 'Approved',
              approvedBy: 'Admin User',
              approvalDate: new Date().toISOString().slice(0, 10),
              kanbanColumn: 'Approved',
            }
          : request,
      ),
    )
    showToast('Request approved', 'success')
  }

  const handleReject = (id: string) => {
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request.id === id
          ? {
              ...request,
              approvalStatus: 'Rejected',
              approvedBy: 'Admin User',
              approvalDate: new Date().toISOString().slice(0, 10),
              kanbanColumn: 'Rejected',
            }
          : request,
      ),
    )
    showToast('Request rejected', 'info')
  }

  const handleCreate = () => {
    if (!form.requestedBy || !form.deviceType) {
      showToast('Requester and device type are required', 'error')
      return
    }

    const newId = `REQ-${String(requests.length + 1).padStart(3, '0')}`

    setRequests((previousRequests) => [
      {
        ...form,
        id: newId,
        requestDate: new Date().toISOString().slice(0, 10),
        approvalStatus: 'Pending',
        approvedBy: null,
        approvalDate: null,
        kanbanColumn: 'Pending',
      },
      ...previousRequests,
    ])

    showToast('Device request submitted', 'success')
    setShowModal(false)
    setForm(emptyForm)
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
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
          onClick={() => setShowModal(true)}
          className="btn-primary flex-shrink-0"
        >
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Pending',
            count: requests.filter((request) => request.approvalStatus === 'Pending').length,
            color: '#f59e0b',
          },
          {
            label: 'Approved',
            count: requests.filter((request) => request.approvalStatus === 'Approved').length,
            color: '#62df7d',
          },
          {
            label: 'Rejected',
            count: requests.filter((request) => request.approvalStatus === 'Rejected').length,
            color: '#ffb4ab',
          },
        ].map(({ label, count, color }) => (
          <div key={label} className="section-card text-center py-3">
            <p className="font-display font-bold text-2xl" style={{ color }}>
              {count}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{label}</p>
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

      <div className="section-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Requested By</th>
                <th>Department</th>
                <th>Device</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-on-surface-variant">
                    No requests found
                  </td>
                </tr>
              ) : (
                paginated.map((request) => (
                  <tr
                    key={request.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/requests/${request.id}`)}
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
                        <p className="text-xs text-on-surface-variant">{request.brand}</p>
                      </div>
                    </td>
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
                      {request.approvalStatus === 'Pending' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                            style={{
                              color: 'var(--success-text)',
                              background: 'var(--success-bg)',
                            }}
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setConfirm({ id: request.id, action: 'reject' })}
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
                          onClick={() => navigate(`/requests/${request.id}`)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/15 px-1">
          <p className="text-xs text-on-surface-variant">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}-
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
          {TEXT_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                {label}
              </label>
              <input
                value={form[key]}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    [key]: event.target.value,
                  }))
                }
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Department
            </label>
            <select
              value={form.department}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  department: event.target.value,
                }))
              }
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
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary">
            Submit Request
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.action === 'reject') {
            handleReject(confirm.id)
          }
        }}
        danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?"
      />
    </div>
  )
}
