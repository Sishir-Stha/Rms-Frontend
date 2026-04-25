import { useState, type ChangeEvent } from 'react'
import { Plus, Search } from 'lucide-react'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { DEPARTMENTS, SUPPORT_TICKETS } from '../data/dummyData'
import type { Priority, SupportTicketRecord, TicketStatus } from '../types/app'

interface SupportTicketFormData {
  title: string
  description: string
  raisedBy: string
  department: string
  priority: Priority
  category: string
  assignedTo: string
}

type StatusFilter = 'All' | TicketStatus

const STATUSES: StatusFilter[] = ['All', 'Open', 'In Progress', 'Resolved']
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low']
const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Access', 'Infrastructure', 'User Management']
const TECHNICIANS = ['Sarah Mitchell', 'James Rodriguez', 'Michael Torres', 'David Kim']

const emptyForm: SupportTicketFormData = {
  title: '',
  description: '',
  raisedBy: '',
  department: '',
  priority: 'Medium',
  category: 'Hardware',
  assignedTo: '',
}

export default function SupportTicket() {
  const { showToast } = useToast()
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(SUPPORT_TICKETS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<SupportTicketFormData>(emptyForm)

  const filtered = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'All' || ticket.status === statusFilter
    const query = search.toLowerCase()

    return (
      matchesStatus &&
      (!query ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.raisedBy.toLowerCase().includes(query) ||
        ticket.department.toLowerCase().includes(query))
    )
  })

  const handleCreate = () => {
    if (!form.title || !form.raisedBy) {
      showToast('Title and raised by are required', 'error')
      return
    }

    const newId = `TKT-${String(tickets.length + 1).padStart(3, '0')}`
    const now = new Date().toISOString().slice(0, 10)

    setTickets((previousTickets) => [
      {
        ...form,
        id: newId,
        status: 'Open',
        createdDate: now,
        updatedDate: now,
      },
      ...previousTickets,
    ])
    showToast('Support ticket created', 'success')
    setShowModal(false)
    setForm(emptyForm)
  }

  const handleStatusChange = (id: string, status: TicketStatus) => {
    setTickets((previousTickets) =>
      previousTickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket,
      ),
    )
    showToast(`Ticket ${status.toLowerCase()}`, 'success')
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value)
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

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', count: tickets.filter((ticket) => ticket.status === 'Open').length, color: '#f59e0b' },
          { label: 'In Progress', count: tickets.filter((ticket) => ticket.status === 'In Progress').length, color: '#adc6ff' },
          { label: 'Resolved', count: tickets.filter((ticket) => ticket.status === 'Resolved').length, color: '#62df7d' },
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search tickets..."
              className="input-field pl-9 py-2.5 w-full"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
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
                <tr>
                  <td colSpan={8} className="text-center py-12 text-on-surface-variant">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><code className="text-secondary text-xs">{ticket.id}</code></td>
                    <td>
                      <div>
                        <p className="font-medium text-sm text-on-surface">{ticket.title}</p>
                        <p className="text-xs text-on-surface-variant">{ticket.department}</p>
                      </div>
                    </td>
                    <td className="text-sm text-on-surface-variant">{ticket.raisedBy}</td>
                    <td><span className="badge badge-neutral">{ticket.category}</span></td>
                    <td><StatusBadge status={ticket.priority} /></td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td className="text-sm text-on-surface-variant">{ticket.assignedTo}</td>
                    <td>
                      {ticket.status !== 'Resolved' && (
                        <select
                          value={ticket.status}
                          onChange={(event) => handleStatusChange(ticket.id, event.target.value as TicketStatus)}
                          className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                          style={{
                            background: '#2d3449',
                            color: '#dae2fd',
                            border: '1px solid rgba(62,74,61,0.3)',
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Support Ticket" size="md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Title
            </label>
            <input
              value={form.title}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, title: event.target.value }))
              }
              placeholder="Describe the issue briefly"
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Raised By
              </label>
              <input
                value={form.raisedBy}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, raisedBy: event.target.value }))
                }
                placeholder="Your name"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Department
              </label>
              <select
                value={form.department}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, department: event.target.value }))
                }
                className="input-field"
              >
                <option value="">Select dept</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department.id} value={department.code}>
                    {department.code}
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
                Category
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, category: event.target.value }))
                }
                className="input-field"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                Assign To
              </label>
              <select
                value={form.assignedTo}
                onChange={(event) =>
                  setForm((currentForm) => ({ ...currentForm, assignedTo: event.target.value }))
                }
                className="input-field"
              >
                <option value="">Unassigned</option>
                {TECHNICIANS.map((technician) => (
                  <option key={technician} value={technician}>
                    {technician}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((currentForm) => ({ ...currentForm, description: event.target.value }))
              }
              rows={3}
              placeholder="Detailed description of the issue..."
              className="input-field resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowModal(false)} className="btn-ghost px-5 py-2.5 rounded-xl">
            Cancel
          </button>
          <button onClick={handleCreate} className="btn-primary">
            Create Ticket
          </button>
        </div>
      </Modal>
    </div>
  )
}
