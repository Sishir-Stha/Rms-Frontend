import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import {
  deleteRepairById,
  fetchRepairs,
} from '../services/repair.service'
import type { RepairStatus } from '../types/app'
import type { RepairListItem } from '../types/repair.types'

type StatusFilter = 'All' | RepairStatus

const STATUSES: StatusFilter[] = ['All', 'Pending', 'In Progress', 'Resolved', 'Closed']
const PAGE_SIZE = 8

export default function RepairManagement() {
  const { showToast } = useToast()
  const [repairs, setRepairs] = useState<RepairListItem[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<RepairListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const abortController = new AbortController()

    const loadRepairs = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetchRepairs(
          {
            status: statusFilter === 'All' ? '' : statusFilter,
            device_name: search.trim(),
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
  }, [refreshKey, search, statusFilter])

  const filtered = useMemo(() => {
    return repairs.filter((repair) => {
      const matchesStatus =
        statusFilter === 'All' || repair.status === statusFilter
      const query = search.toLowerCase()
      const matchesSearch =
        !query ||
        repair.id.toLowerCase().includes(query) ||
        repair.device.toLowerCase().includes(query) ||
        repair.issue.toLowerCase().includes(query) ||
        repair.reportedBy.toLowerCase().includes(query)

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

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
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
        <button
          type="button"
          onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
          className="btn-secondary flex items-center gap-2 flex-shrink-0"
          disabled={isLoading}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
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
              placeholder="Search ID, device, issue..."
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
                        No records found
                      </td>
                    </tr>
                  ) : (
                    paginated.map((repair) => (
                      <tr key={repair.repairId}>
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
                        <td>
                          <button
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
