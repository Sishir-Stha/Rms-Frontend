import DateRangeFilter from '../components/DateRangeFilter'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'

import {
  DEVICE_CATEGORIES,
} from '../data/dummyData'

import {
  getDeviceStocks,
  createDeviceStock,
  deleteDeviceStock,
  type CreateDeviceStockRequest,
  type DeleteDeviceStockRequest,
} from '../api/device-stock'
import { getDepartments, type Department } from '../api/department'

const CURRENT_USER_ID = 1

import type {
  DeviceStockRecord,
  DeviceStockStatus,
} from '../types/app'

interface DeviceStockFormData {
  deviceCode: string
  deviceCategory: string
  date: string
  originSector: string
  originDepartment: string
  destinationSector: string
  destinationDepartment: string
  status: DeviceStockStatus
  issue: string // <-- ADDED
}

interface ConfirmState {
  stockId: string
  action: 'delete'
}

type StatusFilter = 'All' | 'IN' | 'OUT'

const PAGE_SIZE = 8
const STATUSES: StatusFilter[] = ['All', 'IN', 'OUT']
const SUMMARY_STATUSES: DeviceStockStatus[] = ['IN', 'OUT']

const emptyForm: DeviceStockFormData = {
  deviceCode: '',
  deviceCategory: '',
  date: '',
  originSector: '',
  originDepartment: '',
  destinationSector: '',
  destinationDepartment: '',
  status: 'IN',
  issue: '', // <-- ADDED
}

const SUMMARY_COLORS: Record<DeviceStockStatus, string> = {
  IN: '#ff0000',
  OUT: '#33cc33',
}

const STATUS_LABELS: Record<DeviceStockStatus, string> = {
  IN: 'IN (Destination not Reached)',
  OUT: 'OUT (Destination Reached)',
}

export default function DeviceStock() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [stocks, setStocks] = useState<DeviceStockRecord[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [page, setPage] = useState(1)

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<DeviceStockFormData>(emptyForm)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const mapStock = (stock: any): DeviceStockRecord => ({
    id: String(stock.stock_id),
    deviceCategory: stock.category_name || '',
    deviceCode: stock.device_code || '',
    date: stock.date ? stock.date.split('T')[0] : '',
    originSector: stock.origin_sector || '',
    originDepartment: stock.origin_department_name || '',
    destinationSector: stock.destination_sector || '',
    destination: stock.destination_department_name || null,
    destinationRequest: stock.destination_sector || null,
    issue: stock.issue || '',
    quantity: Number(stock.device_quantity) || 1,
    status: stock.status,
  })

  useEffect(() => {
    const loadStocks = async () => {
      setIsLoading(true)
      try {
        const response = await getDeviceStocks()
        if (response.success && response.data) {
          setStocks(response.data.result.map(mapStock))
        }
      } catch (error) {
        console.error('Failed to load stocks:', error)
        showToast('Failed to load device stocks', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    const fetchDepartments = async () => {
      try {
        const response = await getDepartments({ department_name: '', department_code: '' })
        if (response.success && response.data) {
          setDepartments(response.data.result)
        }
      } catch (error) {
        console.error('Failed to load departments:', error)
        showToast('Failed to load departments', 'error')
      }
    }

    void loadStocks()
    void fetchDepartments()
  }, [])

  const filteredStocks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return stocks.filter((stock) => {
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'IN' && stock.status === 'IN') ||
        (statusFilter === 'OUT' && stock.status === 'OUT')

      const matchesDate = (() => {
        if (!dateFrom && !dateTo) return true
        const stockDate = stock.date
        if (dateFrom && stockDate < dateFrom) return false
        if (dateTo && stockDate > dateTo) return false
        return true
      })()

      const safe = (v: any) => (v ?? '').toString().toLowerCase()

      const matchesSearch =
        query === '' ||
        safe(stock.deviceCode).includes(query) ||
        safe(stock.deviceCategory).includes(query) ||
        safe(stock.issue).includes(query) ||
        safe(stock.date).includes(query) ||
        safe(stock.quantity).includes(query) ||
        safe(stock.originSector).includes(query) ||
        safe(stock.originDepartment).includes(query) ||
        safe(stock.destination).includes(query) ||
        safe(stock.destinationSector).includes(query) ||
        safe(stock.destinationRequest).includes(query) ||
        safe(stock.status).includes(query)

      return matchesStatus && matchesDate && matchesSearch
    })
  }, [stocks, search, statusFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredStocks.length / PAGE_SIZE))
  const paginatedStocks = filteredStocks.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetCreateForm = () => setForm(emptyForm)
  const openCreateModal = () => {
    resetCreateForm()
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!form.deviceCategory || !form.date || !form.originSector || !form.originDepartment) {
      showToast('Please fill all required fields', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const selectedCategory = DEVICE_CATEGORIES.find(
        (cat) => cat.name.toLowerCase() === form.deviceCategory.toLowerCase()
      ) || DEVICE_CATEGORIES[0]

      const selectedDepartment = departments.find(
        (dept) => dept.department_name === form.originDepartment
      ) || departments[0]

      const selectedDestDepartment = departments.find(
        (dept) => dept.department_name === form.destinationDepartment
      )

      const payload: CreateDeviceStockRequest = {
        device_category_id: selectedCategory?.id || 1,
        device_code: form.deviceCode || null,
        date: form.date.split('T')[0],
        origin_sector: form.originSector,
        origin_department: selectedDepartment?.department_id || 1,
        destination_sector: form.destinationSector || null,
        destination_department: selectedDestDepartment?.department_id || null,
        device_quantity: 1,
        status: form.status,
        created_by: CURRENT_USER_ID,
        issue: form.issue || null, // <-- ADDED
      }

      const response = await createDeviceStock(payload)

      if (response.success) {
        showToast('Device stock created successfully', 'success')
        setShowModal(false)
        resetCreateForm()

        const reloadResponse = await getDeviceStocks()
        if (reloadResponse.success && reloadResponse.data) {
          setStocks(reloadResponse.data.result.map(mapStock))
        }
      }
    } catch (error) {
      console.error('Failed to create device stock:', error)
      showToast('Failed to create device stock', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (stockId: string) => {
    try {
      const deletePayload: DeleteDeviceStockRequest = { updated_by: CURRENT_USER_ID }
      const response = await deleteDeviceStock(Number(stockId), deletePayload)

      if (response.success) {
        setStocks((prev) => prev.filter((item) => item.id !== stockId))
        showToast('Device stock deleted successfully', 'success')
      }
    } catch (error) {
      console.error('Failed to delete device stock:', error)
      showToast('Failed to delete device stock', 'error')
    } finally {
      setConfirm(null)
    }
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-on-surface-variant">Loading device stock...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">Device Stock</h2>
          <p className="text-sm text-on-surface-variant">Manage stock transfers and inventory</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary">
          <Plus size={15} /> New Entry
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUMMARY_STATUSES.map((status) => (
          <div key={status} className="section-card text-center py-4">
            <p className="font-display font-bold text-2xl" style={{ color: SUMMARY_COLORS[status] }}>
              {stocks.filter((stock) => stock.status === status).length}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{STATUS_LABELS[status]}</p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input value={search} onChange={handleSearchChange} placeholder="Search device category, device code..." className="input-field pl-9" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === status ? 'bg-primary text-on-primary' : 'bg-surface-container'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <DateRangeFilter onApply={(from, to) => { setDateFrom(from); setDateTo(to); setPage(1) }} />
          </div>
        </div>
      </div>

      <div className="section-card overflow-hidden">
        <div className="table-container">
          <table className="data-table table-fixed w-full">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="w-[6%] whitespace-nowrap py-3 text-left">Code</th>
                <th className="w-[10%] py-3 text-left">Category</th>
                <th className="w-[6%] whitespace-nowrap py-3 text-center">Qty</th>
                <th className="w-[12%] py-3 text-left">Origin</th>
                <th className="w-[12%] py-3 text-left">Origin Dept</th>
                <th className="w-[12%] py-3 text-left">Destination</th>
                <th className="w-[12%] py-3 text-left">Dest Dept</th>
                <th className="w-[12%] py-3 text-left">Issue</th>
                <th className="w-[10%] whitespace-nowrap py-3 text-left">Date</th>
                <th className="w-[8%] whitespace-nowrap py-3 text-center">Status</th>
                <th className="w-[10%] whitespace-nowrap py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStocks.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-12 text-on-surface-variant">No device stocks found</td></tr>
              ) : (
                paginatedStocks.map((stock) => (
                  <tr key={stock.id} className="cursor-pointer border-b border-outline-variant/20 hover:bg-surface-container/50 transition-colors" onDoubleClick={() => navigate(`/device-stock/${stock.id}`)}>
                    <td className="whitespace-nowrap py-3" onClick={(e) => e.stopPropagation()}>
                      <code className="text-secondary text-xs font-medium">{stock.deviceCode || '—'}</code>
                    </td>
                    <td className="py-3">{stock.deviceCategory || '—'}</td>
                    <td className="whitespace-nowrap py-3 text-center">{stock.quantity ?? 1}</td>
                    <td className="py-3">{stock.originSector || '—'}</td>
                    <td className="py-3">{stock.originDepartment || '—'}</td>
                    <td className="py-3">{stock.destinationSector || '—'}</td>
                    <td className="py-3">{stock.destination || '—'}</td>
                    <td className="py-3">{stock.issue || '—'}</td>
                    <td className="whitespace-nowrap py-3">{stock.date || '—'}</td>
                    <td className="whitespace-nowrap py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge status={stock.status} />
                    </td>
                    <td className="whitespace-nowrap py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => navigate(`/device-stock/${stock.id}`)} className="btn-secondary px-2 py-1" title="Edit"><Edit2 size={14} /></button>
                        <button onClick={() => setConfirm({ stockId: stock.id, action: 'delete' })} className="btn-secondary px-2 py-1" style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 mt-3">
          <p className="text-xs text-on-surface-variant">Page {page} of {totalPages}</p>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)} className="icon-button"><ChevronLeft size={14} /></button>
            <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)} className="icon-button"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

            {/* 👇 REMOVED title="Create Device Stock Entry" from here */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="md">
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base text-on-surface">Device Stock Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Device Code</label>
              <input type="text" value={form.deviceCode} onChange={(e) => setForm({ ...form, deviceCode: e.target.value })} placeholder="Enter device code" className="input-field" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Category</label>
              <textarea value={form.deviceCategory} onChange={(e) => setForm({ ...form, deviceCategory: e.target.value })} rows={1} placeholder="eg. vga cable" className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Origin</label>
              <textarea value={form.originSector} onChange={(e) => setForm({ ...form, originSector: e.target.value })} rows={1} placeholder="eg. Procurement" className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Origin Dept</label>
              <select value={form.originDepartment} onChange={(e) => setForm({ ...form, originDepartment: e.target.value })} className="input-field">
                <option value="">Origin Dept</option>
                {departments.map((dept) => (<option key={dept.department_id} value={dept.department_name}>{dept.department_name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Destination</label>
              <textarea value={form.destinationSector} onChange={(e) => setForm({ ...form, destinationSector: e.target.value })} rows={1} placeholder="eg. Information technology" className="input-field resize-none" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Dest Dept</label>
              <select value={form.destinationDepartment} onChange={(e) => setForm({ ...form, destinationDepartment: e.target.value })} className="input-field">
                <option value="">Dest Dept</option>
                {departments.map((dept) => (<option key={dept.department_id} value={dept.department_name}>{dept.department_name}</option>))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Issue / Remarks</label>
              <textarea 
                value={form.issue} 
                onChange={(e) => setForm({ ...form, issue: e.target.value })} 
                rows={2} 
                placeholder="Enter any issues or remarks (optional)" 
                className="input-field resize-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DeviceStockStatus })} className="input-field">
              <option value="IN">IN (Destination not Reached)</option>
              <option value="OUT">OUT (Destination Reached)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary px-4 py-2">Cancel</button>
            <button onClick={handleCreate} disabled={isSubmitting} className="btn-primary px-4 py-2">{isSubmitting ? 'Creating...' : 'Create Entry'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirm !== null}
        title="Delete Device Stock"
        message="Are you sure you want to delete this stock entry? This action cannot be undone."
        onConfirm={() => { if (confirm) handleDelete(confirm.stockId) }}
        onClose={() => setConfirm(null)}
        danger
      />
    </div>
  )
}