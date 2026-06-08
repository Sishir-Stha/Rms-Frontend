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
  DEPARTMENTS,
} from '../data/dummyData'

import {
  getDeviceStocks,
  createDeviceStock,
  deleteDeviceStock,
  type CreateDeviceStockRequest,
} from '../api/device-stock'

import type {
  DeviceStockRecord,
  DeviceStockStatus,
} from '../types/app'

interface DeviceStockFormData {
  deviceCategory: string
  date: string
  originSector: string
  originDepartment: string
  destination: string
  destinationRequest: string
  status: DeviceStockStatus
}

interface ConfirmState {
  stockId: string
  action: 'delete'
}

type StatusFilter = 'All' | DeviceStockStatus

const PAGE_SIZE = 8

const STATUSES: StatusFilter[] = [
  'All',
  'IN',
  'OUT',
]

const SUMMARY_STATUSES: DeviceStockStatus[] = [
  'IN',
  'OUT',
]

const ORIGIN_SECTORS = [
  'Procurement',
  'Vendor Return',
  'Refurbished',
]

const emptyForm: DeviceStockFormData = {
  deviceCategory: '',
  date: '',
  originSector: '',
  originDepartment: '',
  destination: '',
  destinationRequest: '',
  status: 'IN',
}

const SUMMARY_COLORS: Record<
  DeviceStockStatus,
  string
> = {
  IN: '#adc6ff',
  OUT: '#62df7d',
}

export default function DeviceStock() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [stocks, setStocks] =
    useState<DeviceStockRecord[]>([])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('All')

  const [page, setPage] = useState(1)

  const [showModal, setShowModal] =
    useState(false)

  const [form, setForm] =
    useState<DeviceStockFormData>(emptyForm)

  const [confirm, setConfirm] =
    useState<ConfirmState | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  useEffect(() => {
    const loadStocks = async () => {
      setIsLoading(true)

      try {
        const response = await getDeviceStocks({
          page: 1,
          limit: 100,
        })

        if (response.success && response.data) {
          const formattedStocks: DeviceStockRecord[] =
            response.data.result.map((stock) => ({
              id: stock.id,
              deviceCategory: stock.deviceCategory,
              date: stock.date,
              originSector: stock.originSector,
              originDepartment: stock.originDepartment,
              destination: stock.destinationDepartment || null,
              destinationRequest:
                stock.destinationSector || null,
              status: stock.status,
            }))
          setStocks(formattedStocks)
        }
      } catch (error) {
        console.error('Failed to load stocks:', error)
        showToast(
          'Failed to load device stocks',
          'error',
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadStocks()
  }, [])

  const filteredStocks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return stocks.filter((stock) => {
      const matchesStatus =
        statusFilter === 'All' ||
        stock.status === statusFilter

      const matchesSearch =
        query === '' ||
        stock.id.toLowerCase().includes(query) ||
        stock.deviceCategory
          .toLowerCase()
          .includes(query) ||
        stock.originSector
          .toLowerCase()
          .includes(query) ||
        stock.originDepartment
          .toLowerCase()
          .includes(query)

      return matchesStatus && matchesSearch
    })
  }, [stocks, search, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStocks.length / PAGE_SIZE),
  )

  const paginatedStocks = filteredStocks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  const resetCreateForm = () => {
    setForm(emptyForm)
  }

  const openCreateModal = () => {
    resetCreateForm()
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (
      !form.deviceCategory ||
      !form.date ||
      !form.originSector ||
      !form.originDepartment
    ) {
      showToast(
        'Please fill all required fields',
        'error',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const payload: CreateDeviceStockRequest = {
        deviceCategory: form.deviceCategory,
        date: form.date,
        originSector: form.originSector,
        originDepartment: form.originDepartment,
        destinationSector: form.destination || undefined,
        destinationDepartment: form.destinationRequest || undefined,
        deviceQuantity: 1,
        status: form.status,
      }

      const response =
        await createDeviceStock(payload)

      if (response.success) {
        showToast(
          'Device stock created successfully',
          'success',
        )

        setShowModal(false)
        resetCreateForm()

        // Reload stocks
        const reloadResponse =
          await getDeviceStocks({
            page: 1,
            limit: 100,
          })

        if (
          reloadResponse.success &&
          reloadResponse.data
        ) {
          const formattedStocks: DeviceStockRecord[] =
            reloadResponse.data.result.map(
              (stock) => ({
                id: stock.id,
                deviceCategory:
                  stock.deviceCategory,
                date: stock.date,
                originSector: stock.originSector,
                originDepartment:
                  stock.originDepartment,
                destination:
                  stock.destinationDepartment ||
                  null,
                destinationRequest:
                  stock.destinationSector || null,
                status: stock.status,
              }),
            )
          setStocks(formattedStocks)
        }
      }
    } catch (error) {
      console.error(
        'Failed to create device stock:',
        error,
      )
      showToast(
        'Failed to create device stock',
        'error',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (stockId: string) => {
    try {
      const response =
        await deleteDeviceStock(stockId)

      if (response.success) {
        setStocks((prev) =>
          prev.filter((item) => item.id !== stockId),
        )

        showToast(
          'Device stock deleted successfully',
          'success',
        )
      }
    } catch (error) {
      console.error(
        'Failed to delete device stock:',
        error,
      )
      showToast(
        'Failed to delete device stock',
        'error',
      )
    } finally {
      setConfirm(null)
    }
  }

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setSearch(event.target.value)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />

          <p className="text-sm text-on-surface-variant">
            Loading device stock...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Device Stock
          </h2>

          <p className="text-sm text-on-surface-variant">
            Manage stock transfers and inventory
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary"
        >
          <Plus size={15} />
          New Entry
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SUMMARY_STATUSES.map((status) => (
          <div
            key={status}
            className="section-card text-center py-4"
          >
            <p
              className="font-display font-bold text-2xl"
              style={{
                color: SUMMARY_COLORS[status],
              }}
            >
              {
                stocks.filter(
                  (stock) =>
                    stock.status === status,
                ).length
              }
            </p>

            <p className="text-xs text-on-surface-variant mt-1">
              {status}
            </p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />

            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search stock..."
              className="input-field pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  statusFilter === status
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container'
                }`}
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
                <th>Device Category</th>
                <th>Origin Sector</th>
                <th>Department</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedStocks.map((stock) => (
                <tr
                  key={stock.id}
                  className="cursor-pointer"
                  onDoubleClick={() =>
                    navigate(
                      `/device-stock/${stock.id}`,
                    )
                  }
                >
                  <td>
                    <code className="text-secondary text-xs">
                      {stock.id}
                    </code>
                  </td>

                  <td>{stock.deviceCategory}</td>

                  <td>{stock.originSector}</td>

                  <td>
                    {stock.originDepartment}
                  </td>

                  <td>
                    {stock.destination || '—'}
                  </td>

                  <td>
                    <StatusBadge
                      status={stock.status}
                    />
                  </td>

                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          navigate(
                            `/device-stock/${stock.id}`,
                          )
                        }
                        className="btn-secondary px-2 py-1"
                      >
                        <Edit2 size={12} />
                      </button>

                      <button
                        onClick={() =>
                          setConfirm({
                            stockId: stock.id,
                            action: 'delete',
                          })
                        }
                        className="btn-secondary px-2 py-1"
                        style={{
                          color:
                            'var(--error-text)',
                          background:
                            'var(--error-bg)',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10 mt-3">
          <p className="text-xs text-on-surface-variant">
            Page {page} of {totalPages}
          </p>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() =>
                setPage((prev) => prev - 1)
              }
              className="icon-button"
            >
              <ChevronLeft size={14} />
            </button>

            <button
              disabled={page === totalPages}
              onClick={() =>
                setPage((prev) => prev + 1)
              }
              className="icon-button"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Device Stock Entry"
        size="md"
      >
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-base text-on-surface">
              Device Stock Details
            </h3>

            <p className="text-sm text-on-surface-variant mt-1">
              Create a new stock entry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={form.deviceCategory}
              onChange={(e) =>
                setForm({
                  ...form,
                  deviceCategory: e.target.value,
                })
              }
              className="input-field"
            >
              <option value="">
                Device Category
              </option>

              {DEVICE_CATEGORIES.map((category) => (
                <option
                  key={category.id}
                  value={category.name}
                >
                  {category.name}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm({
                  ...form,
                  date: e.target.value,
                })
              }
              className="input-field"
            />

            <select
              value={form.originSector}
              onChange={(e) =>
                setForm({
                  ...form,
                  originSector: e.target.value,
                })
              }
              className="input-field"
            >
              <option value="">
                Origin Sector
              </option>

              {ORIGIN_SECTORS.map((sector) => (
                <option
                  key={sector}
                  value={sector}
                >
                  {sector}
                </option>
              ))}
            </select>

            <select
              value={form.originDepartment}
              onChange={(e) =>
                setForm({
                  ...form,
                  originDepartment:
                    e.target.value,
                })
              }
              className="input-field"
            >
              <option value="">
                Department
              </option>

              {DEPARTMENTS.map((department) => (
                <option
                  key={department.id}
                  value={department.name}
                >
                  {department.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Destination"
              value={form.destination}
              onChange={(e) =>
                setForm({
                  ...form,
                  destination: e.target.value,
                })
              }
              className="input-field"
            />

            <input
              type="text"
              placeholder="Destination Request"
              value={form.destinationRequest}
              onChange={(e) =>
                setForm({
                  ...form,
                  destinationRequest:
                    e.target.value,
                })
              }
              className="input-field"
            />
          </div>

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status:
                  e.target
                    .value as DeviceStockStatus,
              })
            }
            className="input-field"
          >
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
          </select>

          <div className="flex justify-end gap-2 pt-3">
            <button
              onClick={() =>
                setShowModal(false)
              }
              className="btn-secondary px-4 py-2"
            >
              Cancel
            </button>

            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="btn-primary px-4 py-2"
            >
              {isSubmitting
                ? 'Creating...'
                : 'Create Entry'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirm !== null}
        title="Delete Device Stock"
        message="Are you sure you want to delete this stock entry? This action cannot be undone."
        onConfirm={() => {
          if (confirm) {
            handleDelete(confirm.stockId)
          }
        }}
        onClose={() => setConfirm(null)}
        danger
      />
    </div>
  )
}