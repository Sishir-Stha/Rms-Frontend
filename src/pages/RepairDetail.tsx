import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Building, Calendar, Clock, DollarSign, Hash, MapPin, Save, Trash2, User, Wrench, type LucideIcon } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { fetchDeviceCategories } from '../services/device_categories.service'
import { fetchDepartments } from '../services/departments.service'
import { fetchRepairById, updateRepairById } from '../services/repair.service'
import { fetchUsers } from '../services/user.service'
import { fetchVendors } from '../services/vendors.service'
import type { Priority, RepairStatus } from '../types/app'
import type { RepairCategoryOption, RepairDepartmentOption, RepairDetailItem, RepairUserOption, RepairVendorOption } from '../types/repair.types'
import { formatDateOnly, toBackendDate, getTodayLocal } from '../utils/date'

interface RepairDetailFormState {
  repairId: number
  id: string
  deviceName: string
  categoryId: number
  serialNo: string
  departmentId: number
  issue: string
  notes: string
  reportedById: number
  reportedDate: string
  vendorId: number
  status: RepairStatus
  priority: Priority
  expectedCompletion: string
  resolvedDate: string
  cost: number
}

interface InfoRowProps { icon: LucideIcon; label: string; value: string | number | null | undefined }
interface TimelineItem { color: string; title: string; date: string }
interface TimelineEventProps extends TimelineItem { last: boolean }

const FIELD_LABEL = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'
const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-sm mb-4'
const REPAIR_STATUSES: RepairStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']

const parseRepairId = (value: string | undefined): number | null => {
  if (!value) return null
  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) ? parsedValue : null
}

const createRepairFormState = (repair: RepairDetailItem): RepairDetailFormState => ({
  repairId: repair.repairId,
  id: repair.id,
  deviceName: repair.device,
  categoryId: repair.categoryId,
  serialNo: repair.serialNo,
  departmentId: repair.departmentId,
  issue: repair.issue,
  notes: repair.notes,
  reportedById: repair.reportedById,
  reportedDate: formatDateOnly(repair.reportedDate),
  vendorId: repair.vendorId,
  status: repair.status,
  priority: repair.priority,
  expectedCompletion: formatDateOnly(repair.expectedCompletion),
  resolvedDate: formatDateOnly(repair.resolvedDate),
  cost: repair.cost,
})

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'var(--primary-lighter)' }}>
        <Icon size={13} style={{ color: 'var(--primary)' }} />
      </div>
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

export default function RepairDetail() {
  const { id } = useParams<'id'>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  
  const [form, setForm] = useState<RepairDetailFormState | null>(null)
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [vendors, setVendors] = useState<RepairVendorOption[]>([])
  const [categories, setCategories] = useState<RepairCategoryOption[]>([])
  const [users, setUsers] = useState<RepairUserOption[]>([])
  const [showDelete, setShowDelete] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [usersErrorMessage, setUsersErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()
    const repairId = parseRepairId(id)

    if (repairId === null) {
      setForm(null)
      setErrorMessage(`No record found for ${id}`)
      setIsLoading(false)
      return () => { abortController.abort() }
    }

    const loadRepairDetail = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      setIsUsersLoading(true)
      setUsersErrorMessage(null)

      try {
        const repair = await fetchRepairById(repairId, abortController.signal)
        const [departmentOptions, vendorOptions, categoryOptions] = await Promise.all([
          fetchDepartments(abortController.signal),
          fetchVendors(abortController.signal),
          fetchDeviceCategories(abortController.signal),
        ])

        if (abortController.signal.aborted) return

        try {
          const userOptions = await fetchUsers()
          if (!abortController.signal.aborted) setUsers(userOptions)
        } catch (error) {
          if (!abortController.signal.aborted) {
            setUsers([])
            setUsersErrorMessage(error instanceof Error ? error.message : 'Unable to load users right now.')
          }
        } finally {
          if (!abortController.signal.aborted) setIsUsersLoading(false)
        }

        setDepartments(departmentOptions)
        setVendors(vendorOptions)
        setCategories(categoryOptions)
        setForm(createRepairFormState(repair))
      } catch (error) {
        if (abortController.signal.aborted) return
        setForm(null)
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load repair detail.')
      } finally {
        if (!abortController.signal.aborted) {
          setIsUsersLoading(false)
          setIsLoading(false)
        }
      }
    }

    void loadRepairDetail()
    return () => { abortController.abort() }
  }, [id])

  const selectedDepartment = useMemo(() => departments.find((department) => department.department_id === form?.departmentId) ?? null, [departments, form?.departmentId])
  const selectedVendor = useMemo(() => vendors.find((vendor) => vendor.vendor_id === form?.vendorId) ?? null, [vendors, form?.vendorId])
  const selectedCategory = useMemo(() => categories.find((category) => category.category_id === form?.categoryId) ?? null, [categories, form?.categoryId])
  const selectedReportedByUser = useMemo(() => users.find((user) => user.user_id === form?.reportedById) ?? null, [form?.reportedById, users])

  const reportedByDisplayName = selectedReportedByUser?.user_name ?? (form?.reportedById ? `User #${form.reportedById}` : '')

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Loading repair detail...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <AlertCircle size={48} style={{ color: 'var(--muted)' }} />
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--on-surface)' }}>Repair Not Found</h2>
        <p className="text-sm mt-1 mb-5" style={{ color: 'var(--muted)' }}>{errorMessage ?? `No record found for ${id}`}</p>
        <button onClick={() => navigate('/repairs')} className="btn-primary">&larr; Back to Repairs</button>
      </div>
    )
  }

  const setField = <Key extends keyof RepairDetailFormState>(key: Key, value: RepairDetailFormState[Key]) => {
    setForm((currentForm) => (currentForm ? { ...currentForm, [key]: value } : currentForm))
  }

  // AUTO-FILL RESOLVED DATE WHEN STATUS CHANGES TO RESOLVED
  const handleStatusChange = (nextStatus: RepairStatus) => {
    setForm((currentForm) => {
      if (!currentForm) return currentForm
      
      const updates: Partial<RepairDetailFormState> = { status: nextStatus }
      
      if (nextStatus === 'Resolved' && !currentForm.resolvedDate) {
        updates.resolvedDate = getTodayLocal()
      }
      
      if (nextStatus !== 'Resolved') {
        updates.resolvedDate = ''
      }

      return { ...currentForm, ...updates }
    })
  }

  const handleSave = () => {
    if (!form) return
    if (!form.departmentId || !form.vendorId || !form.categoryId || !form.reportedById) {
      showToast('Department, vendor, category, and reported by are required', 'error')
      return
    }

    setIsSaving(true)
    void (async () => {
      try {
        await updateRepairById(form.repairId, {
          device_name: form.deviceName,
          category_id: form.categoryId,
          serial_no: form.serialNo,
          department_id: form.departmentId,
          issue: form.issue,
          notes: form.notes,
          status: form.status,
          reported_by: form.reportedById,
          reported_date: toBackendDate(form.reportedDate),
          vendor_id: form.vendorId,
          priority: form.priority,
          expected_completion: toBackendDate(form.expectedCompletion),
          resolved_date: toBackendDate(form.resolvedDate),
          cost: form.cost,
        })
        showToast(`${form.id} updated successfully`, 'success')
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to update repair.', 'error')
      } finally {
        setIsSaving(false)
      }
    })()
  }

  const handleDelete = () => {
    showToast(`${form.id} deleted`, 'info')
    navigate('/repairs')
  }

  const timeline: TimelineItem[] = [
    { color: 'var(--success)', title: `Ticket created by ${reportedByDisplayName || 'Unknown User'}`, date: form.reportedDate },
  ]
  if (form.status !== 'Open') {
    timeline.push({ color: '#3b82f6', title: `Status -> ${form.status}`, date: form.reportedDate })
  }
  if (form.resolvedDate) {
    timeline.push({ color: 'var(--success)', title: 'Marked as Resolved', date: form.resolvedDate })
  }

  const renderSectionTitle = (icon: ReactNode, title: string) => (
    <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-lighter)' }}>{icon}</div>
      {title}
    </div>
  )

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => navigate('/repairs')} className="btn-ghost px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm" style={{ border: '1px solid var(--border-strong)' }}>
            <ArrowLeft size={15} /> Repairs
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-bold text-xl tracking-tight" style={{ color: 'var(--on-surface)' }}>{form.id}</h1>
            <StatusBadge status={form.status} />
            <StatusBadge status={form.priority} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowDelete(true)} className="btn-ghost px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5" style={{ color: 'var(--error-text)', border: '1px solid var(--border-strong)' }}>
            <Trash2 size={14} /> Delete
          </button>
          <button onClick={handleSave} className="btn-primary text-sm" disabled={isSaving}>
            <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="section-card">
            {renderSectionTitle(<Wrench size={14} style={{ color: 'var(--primary)' }} />, 'Device Information')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Device Name</label>
                <input value={form.deviceName} onChange={(event: ChangeEvent<HTMLInputElement>) => setField('deviceName', event.target.value)} placeholder="e.g. Dell Inspiron 15" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Category</label>
                <select value={String(form.categoryId)} onChange={(event) => setField('categoryId', Number(event.target.value))} className="input-field">
                  <option value="">Select category</option>
                  {categories.map((category) => (<option key={category.category_id} value={category.category_id}>{category.category_name}</option>))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Serial Number</label>
                <input value={form.serialNo} onChange={(event: ChangeEvent<HTMLInputElement>) => setField('serialNo', event.target.value)} placeholder="SN-XXXX-XXX" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Department</label>
                <select value={String(form.departmentId)} onChange={(event) => setField('departmentId', Number(event.target.value))} className="input-field">
                  <option value="">Select department</option>
                  {departments.map((department) => (<option key={department.department_id} value={department.department_id}>{department.department_name}</option>))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Issue Description</label>
                <textarea value={form.issue} onChange={(event) => setField('issue', event.target.value)} rows={3} placeholder="Describe the issue in detail..." className="input-field resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Internal Notes</label>
                <textarea value={form.notes} onChange={(event) => setField('notes', event.target.value)} rows={2} placeholder="Internal notes, parts needed, etc." className="input-field resize-none" />
              </div>
            </div>
          </div>

          <div className="section-card">
            {renderSectionTitle(<Calendar size={14} style={{ color: 'var(--primary)' }} />, 'Assignment & Timeline')}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Reported By</label>
                <select value={form.reportedById ? String(form.reportedById) : ''} onChange={(event) => setField('reportedById', Number(event.target.value))} className="input-field" disabled={isUsersLoading || users.length === 0}>
                  <option value="">{isUsersLoading ? 'Loading users...' : usersErrorMessage ? 'Unable to load users' : users.length === 0 ? 'No users available' : 'Select user'}</option>
                  {users.map((user) => (<option key={user.user_id} value={user.user_id}>{user.user_name}</option>))}
                </select>
                {usersErrorMessage ? <p className="text-xs mt-1" style={{ color: 'var(--error-text)' }}>{usersErrorMessage}</p> : null}
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Vendor</label>
                <select value={String(form.vendorId)} onChange={(event) => setField('vendorId', Number(event.target.value))} className="input-field">
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (<option key={vendor.vendor_id} value={vendor.vendor_id}>{vendor.vendor_name}</option>))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Repair Cost (Rs)</label>
                <input type="number" value={form.cost === 0 ? '' : form.cost} onChange={(event) => setField('cost', event.target.value === '' ? 0 : Number(event.target.value))} placeholder="0.00" className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Reported Date</label>
                <input type="date" value={form.reportedDate} onChange={(event) => setField('reportedDate', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Expected Completion</label>
                <input type="date" value={form.expectedCompletion} onChange={(event) => setField('expectedCompletion', event.target.value)} className="input-field" />
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Resolved Date</label>
                <input type="date" value={form.resolvedDate} onChange={(event) => setField('resolvedDate', event.target.value)} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Status</label>
                <select value={form.status} onChange={(event) => handleStatusChange(event.target.value as RepairStatus)} className="input-field">
                  {REPAIR_STATUSES.map((status) => (<option key={status} value={status}>{status}</option>))}
                </select>
              </div>
              <div>
                <label className={FIELD_LABEL} style={{ color: 'var(--muted)' }}>Priority</label>
                <select value={form.priority} onChange={(event) => setField('priority', event.target.value as Priority)} className="input-field">
                  {PRIORITIES.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="section-card" style={{ background: 'var(--primary-lighter)', border: '1px solid var(--primary-light)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--primary)' }}>Quick Info</p>
            <InfoRow icon={Hash} label="Ticket ID" value={form.id} />
            <InfoRow icon={Building} label="Department" value={selectedDepartment?.department_name ?? ''} />
            <InfoRow icon={User} label="Reported By" value={reportedByDisplayName} />
            <InfoRow icon={Calendar} label="Reported Date" value={form.reportedDate} />
            <InfoRow icon={MapPin} label="Vendor" value={selectedVendor?.vendor_name ?? ''} />
            <InfoRow icon={Wrench} label="Category" value={selectedCategory?.category_name ?? ''} />
            <div className="flex items-start gap-3 pt-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-lighter)' }}>
                <DollarSign size={13} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Cost</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--on-surface)' }}>Rs {form.cost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className={SECTION_TITLE} style={{ color: 'var(--on-surface)' }}>
              <Clock size={15} style={{ color: 'var(--primary)' }} /> History
            </div>
            <div className="space-y-0">
              {timeline.map((event, index) => (<TimelineEvent key={`${event.title}-${index}`} {...event} last={index === timeline.length - 1} />))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end xl:hidden">
        <button onClick={handleSave} className="btn-primary" disabled={isSaving}>
          <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <ConfirmDialog isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete} danger title="Delete Repair Ticket" message={`Are you sure you want to permanently delete ${form.id}? This cannot be undone.`} />
    </div>
  )
}