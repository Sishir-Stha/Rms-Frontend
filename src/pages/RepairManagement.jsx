import React, { useState } from 'react'
import { Plus, Search, Edit2, Trash2, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { REPAIRS, VENDORS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const STATUSES = ['All', 'Pending', 'In Progress', 'Under Review', 'Completed']
const PAGE_SIZE = 8

const emptyForm = { device: '', deviceCategory: '', issue: '', reportedBy: '', technician: '', vendor: '', status: 'Pending', priority: 'Medium', expectedCompletion: '', serialNo: '', department: '' }

export default function RepairManagement() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState(REPAIRS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filtered = repairs.filter(r => {
    const matchStatus = statusFilter === 'All' || r.status === statusFilter
    const q = search.toLowerCase()
    const matchSearch = !q || r.id.toLowerCase().includes(q) || r.device.toLowerCase().includes(q) || r.issue.toLowerCase().includes(q) || r.reportedBy.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = r => navigate(`/repairs/${r.id}`)
  const handleSave = () => {
    if (!form.device || !form.issue) return showToast('Device and Issue are required', 'error')
    if (editItem) {
      setRepairs(prev => prev.map(r => r.id === editItem.id ? { ...r, ...form } : r))
      showToast('Repair updated successfully', 'success')
    } else {
      const newId = `REP-${String(repairs.length + 1).padStart(3, '0')}`
      setRepairs(prev => [{ ...form, id: newId, reportedDate: new Date().toISOString().slice(0, 10), resolvedDate: null, cost: 0, kanbanColumn: form.status === 'Completed' ? 'Completed' : form.status === 'In Progress' ? 'In Progress' : 'Backlog' }, ...prev])
      showToast('Repair ticket created', 'success')
    }
    setShowModal(false)
  }
  const handleDelete = () => {
    setRepairs(prev => prev.filter(r => r.id !== deleteTarget))
    showToast('Repair deleted', 'info')
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">Repair Management</h2>
          <p className="text-sm text-on-surface-variant">Track and manage device repair tickets</p>
        </div>
        <button id="new-repair-btn" onClick={openCreate} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Repair
        </button>
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ID, device, issue…"
              className="input-field pl-9 py-2.5 w-full" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-on-surface-variant flex-shrink-0" />
            {STATUSES.map(s => (
              <button key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="section-card overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Device</th>
                <th>Issue</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Expected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">No records found</td></tr>
              ) : paginated.map(r => (
                <tr key={r.id} className="group cursor-pointer"
                  onClick={() => navigate(`/repairs/${r.id}`)}>
                  <td><code className="text-secondary text-xs">{r.id}</code></td>
                  <td>
                    <div>
                      <p className="font-medium text-on-surface text-sm">{r.device}</p>
                      <p className="text-xs text-on-surface-variant">{r.department}</p>
                    </div>
                  </td>
                  <td><p className="text-xs text-on-surface-variant max-w-[180px] truncate">{r.issue}</p></td>
                  <td><span className="text-sm text-on-surface">{r.technician}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><StatusBadge status={r.priority} /></td>
                  <td className="text-xs text-on-surface-variant">{r.expectedCompletion || '—'}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/repairs/${r.id}`)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ color: 'var(--primary)', background: 'var(--primary-lighter)' }}>
                        <Edit2 size={11} /> View
                      </button>
                      <button onClick={() => setDeleteTarget(r.id)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                        style={{ color: 'var(--error-text)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--error-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/15 px-1">
          <p className="text-xs text-on-surface-variant">
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="w-7 h-7 rounded-lg btn-ghost disabled:opacity-30"><ChevronLeft size={14} /></button>
            <span className="text-xs text-on-surface px-2">{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="w-7 h-7 rounded-lg btn-ghost disabled:opacity-30"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editItem ? `Edit ${editItem.id}` : 'New Repair Ticket'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'device', label: 'Device Name', placeholder: 'e.g. Dell Inspiron 15' },
            { key: 'deviceCategory', label: 'Category', placeholder: 'e.g. Laptops' },
            { key: 'serialNo', label: 'Serial Number', placeholder: 'SN-XXXX-XXX' },
            { key: 'department', label: 'Department', placeholder: 'e.g. Finance' },
            { key: 'reportedBy', label: 'Reported By', placeholder: 'Employee name' },
            { key: 'technician', label: 'Technician', placeholder: 'Assign technician' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{label}</label>
              <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="input-field" />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Issue Description</label>
            <textarea value={form.issue || ''} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
              rows={2} placeholder="Describe the issue…" className="input-field resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input-field">
              {['Pending', 'In Progress', 'Under Review', 'Completed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
              {['Critical', 'High', 'Medium', 'Low'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Vendor</label>
            <select value={form.vendor || ''} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="input-field">
              <option value="">Select vendor</option>
              {VENDORS.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Expected Completion</label>
            <input type="date" value={form.expectedCompletion || ''} onChange={e => setForm(f => ({ ...f, expectedCompletion: e.target.value }))} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">Cancel</button>
          <button onClick={handleSave} className="btn-primary">{editItem ? 'Update' : 'Create'} Ticket</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} danger
        title="Delete Repair Ticket"
        message={`Are you sure you want to delete ${deleteTarget}? This cannot be undone.`} />
    </div>
  )
}
