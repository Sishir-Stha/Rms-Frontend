import React, { useState } from 'react'
import { Plus, Trash2, Tag, Building2, Wrench, Users, Pencil, Check, X } from 'lucide-react'
import { VENDORS as initVendors, DEPARTMENTS as initDepts, DEVICE_CATEGORIES, USERS as initUsers } from '../data/dummyData'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const REPAIR_STATUSES = [
  { name: 'Pending', description: 'Ticket submitted, not yet assigned', color: '#f59e0b' },
  { name: 'In Progress', description: 'Actively being worked on by a technician', color: '#adc6ff' },
  { name: 'Under Review', description: 'Repair done, awaiting quality check', color: '#879485' },
  { name: 'Completed', description: 'Fully resolved and closed', color: '#62df7d' },
]
const REQUEST_STATUSES = [
  { name: 'Pending', description: 'Awaiting admin review', color: '#f59e0b' },
  { name: 'Approved', description: 'Request approved for procurement', color: '#62df7d' },
  { name: 'Rejected', description: 'Request declined with reason', color: '#ffb4ab' },
]

function Section({ title, icon: Icon, children, fullWidth }) {
  return (
    <div className={`section-card space-y-4${fullWidth ? ' lg:col-span-2' : ''}`}>
      <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/15">
        <Icon size={17} className="text-primary" />
        <h3 className="font-display font-bold text-base text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function StatusDot({ status }) {
  const color = status === 'Active' ? '#62df7d' : '#879485'
  return <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ background: color }} />
}

export default function Settings() {
  const { showToast } = useToast()

  // ── Vendors ──────────────────────────────────────────────
  const [vendors, setVendors] = useState(initVendors)
  const [newVendor, setNewVendor] = useState('')
  const [deleteVendor, setDeleteVendor] = useState(null)

  const addVendor = () => {
    if (!newVendor.trim()) return showToast('Enter a vendor name', 'error')
    if (vendors.find(v => v.name.toLowerCase() === newVendor.toLowerCase())) return showToast('Vendor already exists', 'warning')
    setVendors(prev => [...prev, { id: Date.now(), name: newVendor.trim(), contact: 'N/A', specialization: 'General', rating: 4.0 }])
    showToast('Vendor added', 'success'); setNewVendor('')
  }

  // ── Departments ───────────────────────────────────────────
  const [depts, setDepts] = useState(initDepts)
  const [newDept, setNewDept] = useState('')
  const [deleteDept, setDeleteDept] = useState(null)

  const addDept = () => {
    if (!newDept.trim()) return showToast('Enter a department name', 'error')
    if (depts.find(d => d.name.toLowerCase() === newDept.toLowerCase())) return showToast('Department already exists', 'warning')
    setDepts(prev => [...prev, { id: Date.now(), name: newDept.trim(), code: newDept.trim().slice(0, 3).toUpperCase(), headCount: 0 }])
    showToast('Department added', 'success'); setNewDept('')
  }

  // ── Users ─────────────────────────────────────────────────
  const [users, setUsers] = useState(initUsers)
  const [editingUserId, setEditingUserId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteUserId, setDeleteUserId] = useState(null)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', department: 'IT', status: 'Active' })

  const startEdit = (user) => {
    setEditingUserId(user.id)
    setEditForm({ name: user.name, email: user.email, department: user.department, status: user.status })
    setAddingUser(false)
  }
  const cancelEdit = () => { setEditingUserId(null); setEditForm({}) }

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) return showToast('Name and email are required', 'error')
    const emailExists = users.some(u => u.id !== editingUserId && u.email.toLowerCase() === editForm.email.toLowerCase())
    if (emailExists) return showToast('Email already in use', 'warning')
    setUsers(prev => prev.map(u => u.id === editingUserId
      ? { ...u, name: editForm.name.trim(), email: editForm.email.trim(), department: editForm.department, status: editForm.status }
      : u
    ))
    showToast('User updated', 'success')
    cancelEdit()
  }

  const startAddUser = () => {
    setAddingUser(true)
    setEditingUserId(null)
    setNewUser({ name: '', email: '', department: depts[0]?.name || 'IT', status: 'Active' })
  }

  const saveNewUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) return showToast('Name and email are required', 'error')
    if (users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase())) return showToast('Email already exists', 'warning')
    const initials = newUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    setUsers(prev => [...prev, {
      id: Date.now(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      department: newUser.department,
      status: newUser.status,
      avatar: initials,
      joinDate: new Date().toISOString().slice(0, 10),
    }])
    showToast('User added', 'success')
    setAddingUser(false)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Configure system preferences and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── User Management (full width) ── */}
        <Section title="User Management" icon={Users} fullWidth>
          {/* Add user bar */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">{users.length} users total</p>
            {!addingUser && (
              <button onClick={startAddUser} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
                <Plus size={13} /> Add User
              </button>
            )}
          </div>

          {/* New user form */}
          {addingUser && (
            <div className="rounded-xl p-4 space-y-3 border border-outline-variant/25"
              style={{ background: 'rgba(98,223,125,0.04)' }}>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">New User</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Full Name</label>
                  <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Jane Doe" className="input-field text-sm w-full" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                    placeholder="jane@repairms.com" className="input-field text-sm w-full" />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Department</label>
                  <select value={newUser.department} onChange={e => setNewUser(p => ({ ...p, department: e.target.value }))}
                    className="input-field text-sm w-full">
                    {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Status</label>
                  <select value={newUser.status} onChange={e => setNewUser(p => ({ ...p, status: e.target.value }))}
                    className="input-field text-sm w-full">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setAddingUser(false)} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                  <X size={12} /> Cancel
                </button>
                <button onClick={saveNewUser} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1">
                  <Check size={12} /> Save User
                </button>
              </div>
            </div>
          )}

          {/* User list */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {users.map(user => (
              <div key={user.id} className="rounded-xl p-3 transition-all"
                style={{ background: editingUserId === user.id ? 'rgba(98,223,125,0.06)' : 'rgba(255,255,255,0.03)', border: editingUserId === user.id ? '1px solid rgba(98,223,125,0.2)' : '1px solid transparent' }}>

                {editingUserId === user.id ? (
                  /* ── Inline edit row ── */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Full name" className="input-field text-sm" />
                      <input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="Email" className="input-field text-sm" />
                      <select value={editForm.department} onChange={e => setEditForm(p => ({ ...p, department: e.target.value }))}
                        className="input-field text-sm">
                        {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                      <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                        className="input-field text-sm">
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit} className="btn-secondary px-3 py-1 text-xs flex items-center gap-1">
                        <X size={11} /> Cancel
                      </button>
                      <button onClick={saveEdit} className="btn-primary px-3 py-1 text-xs flex items-center gap-1">
                        <Check size={11} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Read row ── */
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                        <StatusDot status={user.status} />
                        <span className="text-xs text-on-surface-variant">{user.status}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">{user.email} · {user.department}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => startEdit(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteUserId(user.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ── Vendor Management ── */}
        <Section title="Vendor Management" icon={Building2}>
          <div className="flex gap-2">
            <input value={newVendor} onChange={e => setNewVendor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addVendor()}
              placeholder="New vendor name…" className="input-field flex-1" />
            <button onClick={addVendor} className="btn-primary px-4"><Plus size={15} /></button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vendors.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{v.name}</p>
                  <p className="text-xs text-on-surface-variant">{v.specialization} · ★ {v.rating}</p>
                </div>
                <button onClick={() => setDeleteVendor(v.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Department Management ── */}
        <Section title="Department Management" icon={Building2}>
          <div className="flex gap-2">
            <input value={newDept} onChange={e => setNewDept(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDept()}
              placeholder="New department name…" className="input-field flex-1" />
            <button onClick={addDept} className="btn-primary px-4"><Plus size={15} /></button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {depts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{d.name}</p>
                  <p className="text-xs text-on-surface-variant">{d.code} · {d.headCount} staff</p>
                </div>
                <button onClick={() => setDeleteDept(d.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Device Categories ── */}
        <Section title="Device Categories" icon={Tag}>
          <div className="space-y-2">
            {DEVICE_CATEGORIES.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{c.description}</p>
                </div>
                <span className="text-xs font-bold text-primary">{c.count}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Status Configuration ── */}
        <Section title="Repair Status Types" icon={Wrench}>
          <div className="space-y-2">
            {REPAIR_STATUSES.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</p>
                  <p className="text-xs text-on-surface-variant">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/15">
            <p className="text-xs font-semibold text-on-surface mb-2">Request Status Types</p>
            <div className="space-y-2">
              {REQUEST_STATUSES.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

      </div>

      {/* ── Confirm dialogs ── */}
      <ConfirmDialog isOpen={!!deleteVendor} onClose={() => setDeleteVendor(null)} danger
        onConfirm={() => { setVendors(p => p.filter(v => v.id !== deleteVendor)); showToast('Vendor removed', 'info'); setDeleteVendor(null) }}
        title="Remove Vendor" message="Are you sure you want to remove this vendor?" />
      <ConfirmDialog isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} danger
        onConfirm={() => { setDepts(p => p.filter(d => d.id !== deleteDept)); showToast('Department removed', 'info'); setDeleteDept(null) }}
        title="Remove Department" message="Are you sure you want to remove this department?" />
      <ConfirmDialog isOpen={!!deleteUserId} onClose={() => setDeleteUserId(null)} danger
        onConfirm={() => { setUsers(p => p.filter(u => u.id !== deleteUserId)); showToast('User removed', 'info'); setDeleteUserId(null) }}
        title="Remove User" message="Are you sure you want to remove this user?" />
    </div>
  )
}
