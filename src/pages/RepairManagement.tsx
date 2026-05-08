import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { fetchDeviceCategories } from '../services/device_categories.service'
import { fetchDepartments } from '../services/departments.service'
import {
  createRepairEntry,
  deleteRepairById,
  fetchRepairs,
  subscribeToRepairsChanged,
} from '../services/repair.service'
import { fetchUsers } from '../services/user.service'
import { fetchVendors } from '../services/vendors.service'
import type { Priority, RepairStatus } from '../types/app'
import type {
  RepairCategoryOption,
  RepairDepartmentOption,
  RepairListItem,
  RepairUserOption,
  RepairVendorOption,
} from '../types/repair.types'

interface RepairCreateFormState {
  deviceName: string
  categoryId: number
  serialNo: string
  departmentId: number
  issue: string
  notes: string
  reportedById: number
  vendorId: number
  priority: Priority
  expectedCompletion: string
}

type StatusFilter = 'All' | RepairStatus

const STATUSES: StatusFilter[] = ['All', 'Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const PAGE_SIZE = 8

const createEmptyForm = (currentUserId?: number): RepairCreateFormState => ({
  deviceName: '',
  categoryId: 0,
  serialNo: '',
  departmentId: 0,
  issue: '',
  notes: '',
  reportedById: currentUserId ?? 0,
  vendorId: 0,
  priority: 'Medium',
  expectedCompletion: '',
})

const toNullableDate = (value: string): string | null => (value.trim() === '' ? null : value)

export default function RepairManagement() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState<RepairListItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<RepairListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoadingCreateLookups, setIsLoadingCreateLookups] = useState(false)
  const [createLookupsError, setCreateLookupsError] = useState<string | null>(null)
  const [form, setForm] = useState<RepairCreateFormState>(createEmptyForm(currentUser?.id))
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [vendors, setVendors] = useState<RepairVendorOption[]>([])
  const [categories, setCategories] = useState<RepairCategoryOption[]>([])
  const [users, setUsers] = useState<RepairUserOption[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToRepairsChanged(() => {
      setRefreshKey((currentValue) => currentValue + 1)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    const abortController = new AbortController()

    const loadRepairs = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        // Fetch all repairs with status filter only
        // Client-side search filtering will be applied in useMemo below
        const response = await fetchRepairs(
          {
            status: statusFilter === 'All' ? '' : statusFilter,
            device_name: ''
          },
          abortController.signal,
        )

        if (!abortController.signal.aborted) {
          setRepairs(response)
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load repairs.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadRepairs()

    return () => {
      abortController.abort()
    }
  }, [refreshKey, statusFilter])

  useEffect(() => {
    if (!showCreateModal) {
      return
    }

    if (
      departments.length > 0 &&
      vendors.length > 0 &&
      categories.length > 0 &&
      users.length > 0
    ) {
      return
    }

    const abortController = new AbortController()

    const loadCreateLookups = async () => {
      setIsLoadingCreateLookups(true)
      setCreateLookupsError(null)

      try {
        const [departmentOptions, vendorOptions, categoryOptions, userOptions] =
          await Promise.all([
            fetchDepartments(abortController.signal),
            fetchVendors(abortController.signal),
            fetchDeviceCategories(abortController.signal),
            fetchUsers(),
          ])

        if (abortController.signal.aborted) {
          return
        }

        setDepartments(departmentOptions)
        setVendors(vendorOptions)
        setCategories(categoryOptions)
        setUsers(userOptions)
        setForm((currentForm) => ({
          ...currentForm,
          categoryId: currentForm.categoryId || categoryOptions[0]?.category_id || 0,
          departmentId: currentForm.departmentId || departmentOptions[0]?.department_id || 0,
          reportedById:
            currentForm.reportedById || currentUser?.id || userOptions[0]?.user_id || 0,
          vendorId: currentForm.vendorId || vendorOptions[0]?.vendor_id || 0,
        }))
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setCreateLookupsError(
          error instanceof Error ? error.message : 'Unable to load repair form data.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingCreateLookups(false)
        }
      }
    }

    void loadCreateLookups()

    return () => {
      abortController.abort()
    }
  }, [categories.length, currentUser?.id, departments.length, showCreateModal, users.length, vendors.length])

  // Client-side filtering for status and device name search
  // This ensures real-time search without additional API calls
  const filtered = useMemo(() => {
    return repairs.filter((repair) => {
      // Filter by selected status
      const matchesStatus =
        statusFilter === 'All' || repair.status === statusFilter

      // Filter by device name (case-insensitive)
      // If search is empty, all repairs match the search filter
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query || repair.device.toLowerCase().includes(query)

      return matchesStatus && matchesSearch
    })
  }, [repairs, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = () => {
    if (!deleteTarget) {
      return
    }

    void (async () => {
      try {
        await deleteRepairById(deleteTarget.repairId)
        setRepairs((previousRepairs) =>
          previousRepairs.filter(
            (repair) => repair.repairId !== deleteTarget.repairId,
          ),
        )
        showToast('Repair deleted', 'info')
        setDeleteTarget(null)
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Failed to delete repair.',
          'error',
        )
      }
    })()
  }

  // Handle search input change with real-time filtering
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1) // Reset to first page when search term changes
  }

  const openCreateModal = () => {
    setForm({
      ...createEmptyForm(currentUser?.id),
      categoryId: categories[0]?.category_id ?? 0,
      departmentId: departments[0]?.department_id ?? 0,
      reportedById: currentUser?.id ?? users[0]?.user_id ?? 0,
      vendorId: vendors[0]?.vendor_id ?? 0,
    })
    setShowCreateModal(true)
  }

  const handleCreateRepair = () => {
    if (
      !form.deviceName.trim() ||
      !form.categoryId ||
      !form.serialNo.trim() ||
      !form.departmentId ||
      !form.issue.trim() ||
      !form.reportedById ||
      !form.vendorId
    ) {
      showToast('All required repair fields must be filled', 'error')
      return
    }

    setIsCreating(true)

    void (async () => {
      try {
        await createRepairEntry({
          device_name: form.deviceName.trim(),
          category_id: form.categoryId,
          serial_no: form.serialNo.trim(),
          department_id: form.departmentId,
          issue: form.issue.trim(),
          notes: form.notes.trim(),
          reported_by: form.reportedById,
          vendor_id: form.vendorId,
          priority: form.priority,
          expected_completion: toNullableDate(form.expectedCompletion),
        })

        const refreshedRepairs = await fetchRepairs({
          status: statusFilter === 'All' ? '' : statusFilter,
          device_name: search.trim(),
        })

        setRepairs(refreshedRepairs)
        setPage(1)
        setShowCreateModal(false)
        setForm(createEmptyForm(currentUser?.id))
        showToast('Repair created successfully', 'success')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Failed to create repair.',
          'error',
        )
      } finally {
        setIsCreating(false)
      }
    })()
  }
 

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Repair Management
          </h2>
          <p className="text-sm text-on-surface-variant">
            Track repair tickets from the backend repair list
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={14} />
            New Repair
          </button>
        </div>
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
              placeholder="Search by device name..."
              className="input-field pl-9 py-2.5 w-full"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-on-surface-variant flex-shrink-0" />
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
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-on-surface-variant">
                Loading repairs...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] text-center px-6">
            <p className="text-base font-semibold" style={{ color: 'var(--error)' }}>
              Unable to load repair records
            </p>
            <p className="text-sm mt-2 text-on-surface-variant">
              {errorMessage}
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
              className="btn-primary mt-4"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Device</th>
                    <th>Issue</th>
                    <th>Reported By</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Expected</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-on-surface-variant">
                        No data for this status found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((repair) => (
                      <tr
                        key={repair.repairId}
                        className="cursor-pointer"
                        onClick={() => navigate(`/repairs/${repair.repairId}`)}
                      >
                        <td>
                          <code className="text-secondary text-xs">{repair.id}</code>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-on-surface text-sm">{repair.device}</p>
                            <p className="text-xs text-on-surface-variant">{repair.department}</p>
                          </div>
                        </td>
                        <td>
                          <p className="text-xs text-on-surface-variant max-w-[180px] truncate">
                            {repair.issue}
                          </p>
                        </td>
                        <td>
                          <span className="text-sm text-on-surface">{repair.reportedBy}</span>
                        </td>
                        <td><StatusBadge status={repair.status} /></td>
                        <td><StatusBadge status={repair.priority} /></td>
                        <td className="text-xs text-on-surface-variant">
                          {repair.expectedCompletion || '-'}
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/repairs/${repair.repairId}`)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{
                                color: 'var(--primary)',
                                background: 'var(--primary-lighter)',
                              }}
                            >
                              <Edit2 size={11} /> View
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(repair)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              style={{ color: 'var(--error-text)' }}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.background = 'var(--error-bg)'
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.background = 'transparent'
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
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
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Repair"
        size="lg"
      >
        {isLoadingCreateLookups ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-on-surface-variant">Loading repair form...</p>
            </div>
          </div>
        ) : createLookupsError ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--error-text)' }}>
              {createLookupsError}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary px-4 py-2"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Device Name
                </label>
                <input
                  value={form.deviceName}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, deviceName: event.target.value }))
                  }
                  placeholder="e.g. Dell Inspiron 15"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Category
                </label>
                <select
                  value={form.categoryId ? String(form.categoryId) : ''}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      categoryId: Number(event.target.value),
                    }))
                  }
                  className="input-field"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Serial Number
                </label>
                <input
                  value={form.serialNo}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, serialNo: event.target.value }))
                  }
                  placeholder="SN-XXXX-XXX"
                  className="input-field"
                />
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
                  <option value="">Select department</option>
                  {departments.map((department) => (
                    <option key={department.department_id} value={department.department_id}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Reported By
                </label>
                <select
                  value={form.reportedById ? String(form.reportedById) : ''}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      reportedById: Number(event.target.value),
                    }))
                  }
                  className="input-field"
                >
                  <option value="">Select user</option>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Vendor
                </label>
                <select
                  value={form.vendorId ? String(form.vendorId) : ''}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      vendorId: Number(event.target.value),
                    }))
                  }
                  className="input-field"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.vendor_name}
                    </option>
                  ))}
                </select>
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
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Expected Completion
                </label>
                <input
                  type="date"
                  value={form.expectedCompletion}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      expectedCompletion: event.target.value,
                    }))
                  }
                  className="input-field"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Issue Description
                </label>
                <textarea
                  value={form.issue}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, issue: event.target.value }))
                  }
                  rows={3}
                  placeholder="Describe the issue"
                  className="input-field resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))
                  }
                  rows={2}
                  placeholder="Optional notes"
                  className="input-field resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-ghost px-5 py-2.5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRepair}
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Repair'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        danger
        title="Delete Repair Ticket"
        message={`Are you sure you want to delete ${deleteTarget?.id ?? 'this repair'}? This cannot be undone.`}
      />
    </div>
  )
}
