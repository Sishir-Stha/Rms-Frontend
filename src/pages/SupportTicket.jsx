import React, { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { SUPPORT_TICKETS, DEPARTMENTS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'

const STATUSES = ['All', 'Open', 'In Progress', 'Resolved']
const emptyForm = { title: '', description: '', raisedBy: '', department: '', priority: 'Medium', category: 'Hardware', assignedTo: '' }
const TECHNICIANS = ['Sarah Mitchell', 'James Rodriguez', 'Michael Torres', 'David Kim']

export default function SupportTicket() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState(SUPPORT_TICKETS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = tickets.filter(t => {
    const matchStatus = statusFilter === 'All' || t.status === statusFilter
    const q = search.toLowerCase()
    return matchStatus && (!q || t.title.toLowerCase().includes(q) || t.raisedBy.toLowerCase().includes(q) || t.department.toLowerCase().includes(q))
  })

  const handleCreate = () => {
    if (!form.title || !form.raisedBy) return showToast('Title and Raised By are required', 'error')
    const newId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`
    setTickets(prev => [{ ...form, id: newId, status: 'Open', createdDate: new Date().toISOString().slice(0,10), updatedDate: new Date().toISOString().slice(0,10) }, ...prev])
    showToast('Support ticket created', 'success')
    setShowModal(false); setForm(emptyForm)
  }

  const handleStatusChange = (id, status) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    showToast(`Ticket ${status.toLowerCase()}`, 'success')
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">Support Tickets</h2>
          <p className="text-sm text-on-surface-variant">Track and resolve IT support requests</p>
        </div>
        <button id="new-ticket-btn" onClick={() => setShowModal(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: tickets.filter(t => t.status === 'Open').length, color: '#f59e0b' },
          { label: 'In Progress', count: tickets.filter(t => t.status === 'In Progress').length, color: '#adc6ff' },
          { label: 'Resolved', count: tickets.filter(t => t.status === 'Resolved').length, color: '#62df7d' },
        ].map(({ label, count, color }) => (
          <div key={label} className="section-card text-center py-3">
            <p className="font-display font-bold text-2xl" style={{ color }}>{count}</p>
            <p className="text-xs text-on-surface-variant mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="section-card">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets…" className="input-field pl-9 py-2.5 w-full" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${statusFilter === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'}`}>
                {s}
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
                <th>Title</th>
                <th>Raised By</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant">No tickets found</td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td><code className="text-secondary text-xs">{t.id}</code></td>
                  <td>
                    <div>
                      <p className="font-medium text-sm text-on-surface">{t.title}</p>
                      <p className="text-xs text-on-surface-variant">{t.department}</p>
                    </div>
                  </td>
                  <td className="text-sm text-on-surface-variant">{t.raisedBy}</td>
                  <td><span className="badge badge-neutral">{t.category}</span></td>
                  <td><StatusBadge status={t.priority} /></td>
                  <td><StatusBadge status={t.status} /></td>
                  <td className="text-sm text-on-surface-variant">{t.assignedTo}</td>
                  <td>
                    {t.status !== 'Resolved' && (
                      <select value={t.status}
                        onChange={e => handleStatusChange(t.id, e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                        style={{ background: '#2d3449', color: '#dae2fd', border: '1px solid rgba(62,74,61,0.3)' }}>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Support Ticket" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Describe the issue briefly" className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'raisedBy', label: 'Raised By', placeholder: 'Your name' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">{label}</label>
                <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="input-field" />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} className="input-field">
                <option value="">Select dept</option>
                {DEPARTMENTS.map(d => <option key={d.id} value={d.code}>{d.code}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input-field">
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input-field">
                {['Hardware', 'Software', 'Network', 'Email', 'Access', 'Infrastructure', 'User Management'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Assign To</label>
              <select value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="input-field">
                <option value="">Unassigned</option>
                {TECHNICIANS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Detailed description of the issue…" className="input-field resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">Cancel</button>
          <button onClick={handleCreate} className="btn-primary">Create Ticket</button>
        </div>
      </Modal>
    </div>
  )
}
