import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, ChevronRight, Clock3, Hash, Package, Save, Trash2, FileText } from 'lucide-react'

import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { DEVICE_CATEGORIES, DEPARTMENTS } from '../data/dummyData'
import { getSingleDeviceStock, updateDeviceStock, deleteDeviceStock, type UpdateDeviceStockRequest, type DeleteDeviceStockRequest } from '../api/device-stock'

const CURRENT_USER_ID = 1

import type { DeviceStockRecord, DeviceStockStatus } from '../types/app'

interface DeviceStockFormData {
  id: string
  deviceCategory: string
  deviceCode: string
  issue: string
  date: string
  quantity: number
  originSector: string
  originDepartment: string
  destination: string
  destinationRequest: string
  status: DeviceStockStatus
}

interface InfoCardRowProps { icon: React.ElementType; label: string; value: string }
interface TimelineItemProps { title: string; date: string; last?: boolean }

const STATUS_LABELS: Record<DeviceStockStatus, string> = { IN: 'IN (Destination not Reached)', OUT: 'OUT (Destination Reached)' }
const STATUS_COLORS: Record<DeviceStockStatus, string> = { IN: '#ff0000', OUT: '#33cc33' }

function InfoCardRow({ icon: Icon, label, value }: InfoCardRowProps) {
  return (
    <div className="flex items-start gap-3 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-lighter)' }}>
        <Icon size={14} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
        <p className="text-sm font-medium mt-1 text-on-surface break-words">{value || '-'}</p>
      </div>
    </div>
  )
}

function TimelineItem({ title, date, last }: TimelineItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: 'var(--primary)' }} />
        {!last && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border-color)', minHeight: 30 }} />}
      </div>
      <div className="pb-5">
        <p className="text-sm font-medium text-on-surface">{title}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{date}</p>
      </div>
    </div>
  )
}

export default function DeviceStockDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [form, setForm] = useState<DeviceStockFormData | null>(null)
  const [originalForm, setOriginalForm] = useState<DeviceStockFormData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  useEffect(() => {
    const loadStock = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const response = await getSingleDeviceStock(Number(id))
        if (response.success && response.data) {
          const stock = response.data.result
          const stockData: DeviceStockFormData = {
            id: String(stock.stock_id),
            deviceCategory: stock.category_name || '',
            deviceCode: stock.device_code || '',
            issue: stock.issue || '',
            date: stock.date ? stock.date.split('T')[0] : '',
            quantity: Number(stock.device_quantity) || 1,
            originSector: stock.origin_sector || '',
            originDepartment: stock.origin_department_name || '',
            destination: stock.destination_sector || '',
            destinationRequest: stock.destination_department_name || '',
            status: stock.status,
          }
          setForm(stockData)
          setOriginalForm(stockData)
        } else {
          showToast('Device stock record not found', 'error')
          navigate('/device-stock')
        }
      } catch (error) {
        console.error('Failed to load device stock:', error)
        showToast('Failed to load device stock', 'error')
        navigate('/device-stock')
      } finally {
        setIsLoading(false)
      }
    }
    void loadStock()
  }, [id, navigate, showToast])

  const handleChange = (key: keyof DeviceStockFormData, value: string | number) => {
    if (!form) return
    setForm({ ...form, [key]: value })
  }

  const handleSave = async () => {
    if (!form) return
    if (!form.deviceCategory || !form.originSector || !form.originDepartment || !form.date) {
      showToast('Please fill all required fields', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      // Smart Fallback: Default to first category/department if custom text doesn't match
      const selectedCategory = DEVICE_CATEGORIES.find(
        (cat) => cat.name.toLowerCase() === form.deviceCategory.toLowerCase()
      ) || DEVICE_CATEGORIES[0]

      const selectedOriginDepartment = DEPARTMENTS.find(
        (dept) => dept.name === form.originDepartment
      ) || DEPARTMENTS[0]

      const selectedDestinationDepartment = DEPARTMENTS.find(
        (dept) => dept.name === form.destinationRequest
      )

      const payload: UpdateDeviceStockRequest = {
        device_category_id: selectedCategory?.id ?? 1,
        device_code: form.deviceCode || null,
        date: form.date.split('T')[0],
        origin_sector: form.originSector,
        origin_department: selectedOriginDepartment?.id ?? 1,
        destination_sector: form.destination || null,
        destination_department: selectedDestinationDepartment?.id ?? null,
        device_quantity: Number(form.quantity) || 1,
        issue: form.issue || null,
        status: form.status,
        updated_by: CURRENT_USER_ID,
      }

      const response = await updateDeviceStock(Number(id), payload)
      if (response.success) {
        showToast('Device stock updated successfully', 'success')
        setOriginalForm(form)
      }
    } catch (error) {
      console.error('Failed to update device stock:', error)
      showToast('Failed to update device stock', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      const deletePayload: DeleteDeviceStockRequest = { updated_by: CURRENT_USER_ID }
      const response = await deleteDeviceStock(Number(id), deletePayload)
      if (response.success) {
        showToast('Device stock deleted successfully', 'success')
        navigate('/device-stock')
      }
    } catch (error) {
      console.error('Failed to delete device stock:', error)
      showToast('Failed to delete device stock', 'error')
    } finally {
      setShowDelete(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!form || !originalForm) return false
    return JSON.stringify(form) !== JSON.stringify(originalForm)
  }, [form, originalForm])

  const sameDepartmentStocks = useMemo<DeviceStockRecord[]>(() => {
    if (!form) return []
    return []
  }, [form])

  if (isLoading || !form) {
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/device-stock')} className="icon-button"><ArrowLeft size={18} /></button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display font-bold text-2xl text-on-surface">Edit Stock: {form.id}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setShowDelete(true)} className="btn-secondary px-4 py-2 flex items-center gap-2" style={{ color: 'var(--error-text)', background: 'var(--error-bg)' }}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={() => void handleSave()} disabled={!hasChanges || isSubmitting} className="btn-primary px-4 py-2 flex items-center gap-2" style={{ opacity: hasChanges ? 1 : 0.5, cursor: hasChanges ? 'pointer' : 'not-allowed' }}>
            <Save size={15} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-5">
          <div className="section-card">
            <div className="flex items-center gap-2 mb-5">
              <Package size={16} className="text-primary" />
              <h3 className="font-semibold text-sm text-on-surface">Device Stock Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Category</label>
                <textarea value={form.deviceCategory} onChange={(e) => handleChange('deviceCategory', e.target.value)} rows={1} placeholder="eg. vga cable" className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Device Code</label>
                <input type="text" value={form.deviceCode} onChange={(e) => handleChange('deviceCode', e.target.value)} className="input-field" placeholder="Enter device code" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Date</label>
                <input type="date" value={form.date} onChange={(e) => handleChange('date', e.target.value)} className="input-field" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Origin</label>
                <textarea value={form.originSector} onChange={(e) => handleChange('originSector', e.target.value)} rows={1} placeholder="eg. Procurement" className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Origin Dept</label>
                <select value={form.originDepartment} onChange={(e) => handleChange('originDepartment', e.target.value)} className="input-field">
                  <option value="">Select Origin Dept</option>
                  {DEPARTMENTS.map((department) => (<option key={department.id} value={department.name}>{department.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Destination</label>
                <textarea value={form.destination} onChange={(e) => handleChange('destination', e.target.value)} rows={1} placeholder="eg. Information technology" className="input-field resize-none" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Dest Dept</label>
                <select value={form.destinationRequest} onChange={(e) => handleChange('destinationRequest', e.target.value)} className="input-field">
                  <option value="">Select Dest Dept</option>
                  {DEPARTMENTS.map((department) => (<option key={department.id} value={department.name}>{department.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Quantity</label>
                <input type="number" value={form.quantity} onChange={(e) => handleChange('quantity', Number(e.target.value))} className="input-field" placeholder="Enter quantity" min="1" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Issue / Remarks</label>
                <textarea value={form.issue} onChange={(e) => handleChange('issue', e.target.value)} className="input-field min-h-[90px] resize-none" placeholder="Enter issue or remarks" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-on-surface-variant">Status</label>
                <select value={form.status} onChange={(e) => handleChange('status', e.target.value)} className="input-field">
                  <option value="IN">IN (Destination not Reached)</option>
                  <option value="OUT">OUT (Destination Reached)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5">
          <div className="section-card" style={{ background: 'linear-gradient(180deg, rgba(93,76,255,0.08), rgba(93,76,255,0.03))' }}>
            <h3 className="font-semibold text-sm mb-3 text-on-surface">Quick Info</h3>
            <InfoCardRow icon={Hash} label="Stock ID" value={form.id} />
            <InfoCardRow icon={Package} label="Category" value={form.deviceCategory} />
            <InfoCardRow icon={Building2} label="Origin Dept" value={form.originDepartment} />
            <InfoCardRow icon={FileText} label="Issue" value={form.issue || 'None'} />
            <InfoCardRow icon={Building2} label="Dest Dept" value={form.destinationRequest || 'N/A'} />

            <div className="pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Current Status</p>
              <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', backgroundColor: STATUS_COLORS[form.status] + '20', color: STATUS_COLORS[form.status] }}>
                {STATUS_LABELS[form.status]}
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <Clock3 size={15} className="text-primary" />
              <h3 className="font-semibold text-sm text-on-surface">History</h3>
            </div>
            <TimelineItem title="Stock entry created" date={form.date} />
            <TimelineItem title={`Status updated to ${STATUS_LABELS[form.status]}`} date={form.date} />
            <TimelineItem title={`Destination assigned to ${form.destinationRequest || 'N/A'}`} date={form.date} last />
          </div>

          <div className="section-card">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={15} className="text-primary" />
              <h3 className="font-semibold text-sm text-on-surface">From Same Department</h3>
            </div>
            {sameDepartmentStocks.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No related entries found.</p>
            ) : (
              <div className="space-y-3">
                {sameDepartmentStocks.map((stock) => (
                  <button key={stock.id} onClick={() => navigate(`/device-stock/${stock.id}`)} className="w-full flex items-center justify-between rounded-xl px-3 py-3 transition-all hover:bg-surface-container" style={{ background: 'var(--surface-container-low)' }}>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-on-surface">{stock.id}</p>
                      <div className="mt-1">
                        <p className="text-xs text-on-surface-variant">{stock.deviceCategory}</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">{stock.issue || 'No issue'}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-on-surface-variant" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={showDelete} title="Delete Device Stock" message="Are you sure you want to delete this stock entry? This action cannot be undone." onConfirm={handleDelete} onClose={() => setShowDelete(false)} danger />
    </div>
  )
}