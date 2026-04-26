import { useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  Building2,
  Check,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import {
  DEPARTMENTS as INITIAL_DEPARTMENTS,
  DEVICE_CATEGORIES,
  USERS as INITIAL_USERS,
  VENDORS as INITIAL_VENDORS,
} from '../data/dummyData'
import type {
  AppUser,
  DepartmentRecord,
  DeviceCategoryRecord,
  Priority,
  RequestApprovalStatus,
  RepairStatus,
  UserStatus,
  VendorRecord,
} from '../types/app'

interface SectionProps {
  title: string
  icon: LucideIcon
  children: ReactNode
  fullWidth?: boolean
}

interface StatusConfigItem<TName extends string> {
  name: TName
  description: string
  color: string
}

type UserFormState = Pick<AppUser, 'name' | 'email' | 'department' | 'status'>

const REPAIR_STATUSES: StatusConfigItem<RepairStatus>[] = [
  { name: 'Open', description: 'Ticket submitted and ready to be worked on', color: '#f59e0b' },
  { name: 'In Progress', description: 'Actively being worked on by a technician', color: '#adc6ff' },
  { name: 'Resolved', description: 'Repair completed and awaiting closure confirmation', color: '#879485' },
  { name: 'Closed', description: 'Fully resolved and closed', color: '#62df7d' },
]

const REQUEST_STATUSES: StatusConfigItem<RequestApprovalStatus>[] = [
  { name: 'Requested', description: 'Submitted and awaiting workflow triage', color: '#bac5ee' },
  { name: 'Pending', description: 'Awaiting admin review', color: '#f59e0b' },
  { name: 'Approved', description: 'Request approved for procurement', color: '#62df7d' },
  { name: 'Rejected', description: 'Request declined with reason', color: '#ffb4ab' },
]

function Section({ title, icon: Icon, children, fullWidth = false }: SectionProps) {
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

function StatusDot({ status }: { status: UserStatus }) {
  const color = status === 'Active' ? '#62df7d' : '#879485'
  return <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ background: color }} />
}

export default function Settings() {
  const { showToast } = useToast()

  const [vendors, setVendors] = useState<VendorRecord[]>(INITIAL_VENDORS)
  const [newVendor, setNewVendor] = useState('')
  const [deleteVendor, setDeleteVendor] = useState<number | null>(null)

  const [depts, setDepts] = useState<DepartmentRecord[]>(INITIAL_DEPARTMENTS)
  const [newDept, setNewDept] = useState('')
  const [deleteDept, setDeleteDept] = useState<number | null>(null)

  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<UserFormState | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null)
  const [addingUser, setAddingUser] = useState(false)
  const [newUser, setNewUser] = useState<UserFormState>({
    name: '',
    email: '',
    department: 'IT',
    status: 'Active',
  })

  const addVendor = () => {
    const vendorName = newVendor.trim()

    if (!vendorName) {
      showToast('Enter a vendor name', 'error')
      return
    }

    if (vendors.find((vendor) => vendor.name.toLowerCase() === vendorName.toLowerCase())) {
      showToast('Vendor already exists', 'warning')
      return
    }

    setVendors((previousVendors) => [
      ...previousVendors,
      {
        id: Date.now(),
        name: vendorName,
        contact: 'N/A',
        phone: 'N/A',
        specialization: 'General',
        rating: 4.0,
      },
    ])
    showToast('Vendor added', 'success')
    setNewVendor('')
  }

  const addDept = () => {
    const departmentName = newDept.trim()

    if (!departmentName) {
      showToast('Enter a department name', 'error')
      return
    }

    if (depts.find((department) => department.name.toLowerCase() === departmentName.toLowerCase())) {
      showToast('Department already exists', 'warning')
      return
    }

    setDepts((previousDepartments) => [
      ...previousDepartments,
      {
        id: Date.now(),
        name: departmentName,
        code: departmentName.slice(0, 3).toUpperCase(),
        headCount: 0,
      },
    ])
    showToast('Department added', 'success')
    setNewDept('')
  }

  const startEdit = (user: AppUser) => {
    setEditingUserId(user.id)
    setEditForm({
      name: user.name,
      email: user.email,
      department: user.department,
      status: user.status,
    })
    setAddingUser(false)
  }

  const cancelEdit = () => {
    setEditingUserId(null)
    setEditForm(null)
  }

  const saveEdit = () => {
    if (!editForm || editingUserId === null) {
      return
    }

    if (!editForm.name.trim() || !editForm.email.trim()) {
      showToast('Name and email are required', 'error')
      return
    }

    const emailExists = users.some(
      (user) => user.id !== editingUserId && user.email.toLowerCase() === editForm.email.toLowerCase(),
    )

    if (emailExists) {
      showToast('Email already in use', 'warning')
      return
    }

    setUsers((previousUsers) =>
      previousUsers.map((user) =>
        user.id === editingUserId
          ? {
              ...user,
              name: editForm.name.trim(),
              email: editForm.email.trim(),
              department: editForm.department,
              status: editForm.status,
            }
          : user,
      ),
    )
    showToast('User updated', 'success')
    cancelEdit()
  }

  const startAddUser = () => {
    setAddingUser(true)
    setEditingUserId(null)
    setEditForm(null)
    setNewUser({
      name: '',
      email: '',
      department: depts[0]?.name || 'IT',
      status: 'Active',
    })
  }

  const saveNewUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      showToast('Name and email are required', 'error')
      return
    }

    if (users.find((user) => user.email.toLowerCase() === newUser.email.toLowerCase())) {
      showToast('Email already exists', 'warning')
      return
    }

    const initials = newUser.name
      .trim()
      .split(' ')
      .map((word) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    setUsers((previousUsers) => [
      ...previousUsers,
      {
        id: Date.now(),
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        department: newUser.department,
        status: newUser.status,
        avatar: initials,
        joinDate: new Date().toISOString().slice(0, 10),
      },
    ])
    showToast('User added', 'success')
    setAddingUser(false)
  }

  const handleEnterKey = (event: KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (event.key === 'Enter') {
      action()
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Configure system preferences and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="User Management" icon={Users} fullWidth>
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">{users.length} users total</p>
            {!addingUser && (
              <button onClick={startAddUser} className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5">
                <Plus size={13} /> Add User
              </button>
            )}
          </div>

          {addingUser && (
            <div
              className="rounded-xl p-4 space-y-3 border border-outline-variant/25"
              style={{ background: 'rgba(98,223,125,0.04)' }}
            >
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">New User</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Full Name</label>
                  <input
                    value={newUser.name}
                    onChange={(event) =>
                      setNewUser((currentUser) => ({ ...currentUser, name: event.target.value }))
                    }
                    placeholder="e.g. Jane Doe"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(event) =>
                      setNewUser((currentUser) => ({ ...currentUser, email: event.target.value }))
                    }
                    placeholder="jane@repairms.com"
                    className="input-field text-sm w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Department</label>
                  <select
                    value={newUser.department}
                    onChange={(event) =>
                      setNewUser((currentUser) => ({
                        ...currentUser,
                        department: event.target.value,
                      }))
                    }
                    className="input-field text-sm w-full"
                  >
                    {depts.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Status</label>
                  <select
                    value={newUser.status}
                    onChange={(event) =>
                      setNewUser((currentUser) => ({
                        ...currentUser,
                        status: event.target.value as UserStatus,
                      }))
                    }
                    className="input-field text-sm w-full"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
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

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl p-3 transition-all"
                style={{
                  background: editingUserId === user.id ? 'rgba(98,223,125,0.06)' : 'rgba(255,255,255,0.03)',
                  border:
                    editingUserId === user.id
                      ? '1px solid rgba(98,223,125,0.2)'
                      : '1px solid transparent',
                }}
              >
                {editingUserId === user.id && editForm ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={editForm.name}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm ? { ...currentForm, name: event.target.value } : currentForm,
                          )
                        }
                        placeholder="Full name"
                        className="input-field text-sm"
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm ? { ...currentForm, email: event.target.value } : currentForm,
                          )
                        }
                        placeholder="Email"
                        className="input-field text-sm"
                      />
                      <select
                        value={editForm.department}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm ? { ...currentForm, department: event.target.value } : currentForm,
                          )
                        }
                        className="input-field text-sm"
                      >
                        {depts.map((department) => (
                          <option key={department.id} value={department.name}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={editForm.status}
                        onChange={(event) =>
                          setEditForm((currentForm) =>
                            currentForm
                              ? { ...currentForm, status: event.target.value as UserStatus }
                              : currentForm,
                          )
                        }
                        className="input-field text-sm"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
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
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                    >
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                        <StatusDot status={user.status} />
                        <span className="text-xs text-on-surface-variant">{user.status}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {user.email} · {user.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => startEdit(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>

        <Section title="Vendor Management" icon={Building2}>
          <div className="flex gap-2">
            <input
              value={newVendor}
              onChange={(event) => setNewVendor(event.target.value)}
              onKeyDown={(event) => handleEnterKey(event, addVendor)}
              placeholder="New vendor name..."
              className="input-field flex-1"
            />
            <button onClick={addVendor} className="btn-primary px-4">
              <Plus size={15} />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{vendor.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {vendor.specialization} · * {vendor.rating}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteVendor(vendor.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Department Management" icon={Building2}>
          <div className="flex gap-2">
            <input
              value={newDept}
              onChange={(event) => setNewDept(event.target.value)}
              onKeyDown={(event) => handleEnterKey(event, addDept)}
              placeholder="New department name..."
              className="input-field flex-1"
            />
            <button onClick={addDept} className="btn-primary px-4">
              <Plus size={15} />
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {depts.map((department) => (
              <div key={department.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{department.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {department.code} · {department.headCount} staff
                  </p>
                </div>
                <button
                  onClick={() => setDeleteDept(department.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Device Categories" icon={Tag}>
          <div className="space-y-2">
            {DEVICE_CATEGORIES.map((category: DeviceCategoryRecord) => (
              <div key={category.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xl">{category.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">{category.name}</p>
                  <p className="text-xs text-on-surface-variant">{category.description}</p>
                </div>
                <span className="text-xs font-bold text-primary">{category.count}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Repair Status Types" icon={Wrench}>
          <div className="space-y-2">
            {REPAIR_STATUSES.map((status) => (
              <div key={status.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: status.color }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: status.color }}>
                    {status.name}
                  </p>
                  <p className="text-xs text-on-surface-variant">{status.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/15">
            <p className="text-xs font-semibold text-on-surface mb-2">Request Status Types</p>
            <div className="space-y-2">
              {REQUEST_STATUSES.map((status) => (
                <div key={status.name} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: status.color }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: status.color }}>
                      {status.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">{status.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteVendor)}
        onClose={() => setDeleteVendor(null)}
        danger
        onConfirm={() => {
          if (deleteVendor === null) {
            return
          }

          setVendors((previousVendors) =>
            previousVendors.filter((vendor) => vendor.id !== deleteVendor),
          )
          showToast('Vendor removed', 'info')
          setDeleteVendor(null)
        }}
        title="Remove Vendor"
        message="Are you sure you want to remove this vendor?"
      />
      <ConfirmDialog
        isOpen={Boolean(deleteDept)}
        onClose={() => setDeleteDept(null)}
        danger
        onConfirm={() => {
          if (deleteDept === null) {
            return
          }

          setDepts((previousDepartments) =>
            previousDepartments.filter((department) => department.id !== deleteDept),
          )
          showToast('Department removed', 'info')
          setDeleteDept(null)
        }}
        title="Remove Department"
        message="Are you sure you want to remove this department?"
      />
      <ConfirmDialog
        isOpen={Boolean(deleteUserId)}
        onClose={() => setDeleteUserId(null)}
        danger
        onConfirm={() => {
          if (deleteUserId === null) {
            return
          }

          setUsers((previousUsers) =>
            previousUsers.filter((user) => user.id !== deleteUserId),
          )
          showToast('User removed', 'info')
          setDeleteUserId(null)
        }}
        title="Remove User"
        message="Are you sure you want to remove this user?"
      />
    </div>
  )
}
