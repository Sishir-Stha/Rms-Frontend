import { useEffect, useState, type ReactNode } from 'react'
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
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  updateDepartment,
  type CreateDepartmentRequest,
  type Department,
  type UpdateDepartmentRequest,
} from '../api/department'
import {
  createDeviceCategory,
  deleteDeviceCategory,
  getDeviceCategories,
  updateDeviceCategory,
  type CreateDeviceCategoryRequest,
  type DeviceCategory,
  type UpdateDeviceCategoryRequest,
} from '../api/device-category'
import {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
  type CreateUserRequest,
  type User,
} from '../api/user'
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
  type CreateVendorRequest,
  type UpdateVendorRequest,
  type Vendor,
} from '../api/vendors'
import type {
  Priority,
  RequestApprovalStatus,
  RepairStatus,
  UserStatus,
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

interface UserFormState {
  user_id?: number
  user_name: string
  email: string
  password: string
  department_id: number
  status: UserStatus
  join_date: string
}

interface VendorFormState {
  vendor_name: string
  contact: string
  phone: string
  specialization: string
  rating: number
}

interface DepartmentFormState {
  department_name: string
  department_code: string
  head_count: number
}

interface CategoryFormState {
  category_name: string
  description: string
  device_count: number
}

type ModalMode = 'create' | 'edit'

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

const createEmptyUserForm = (departmentId = 0): UserFormState => ({
  user_name: '',
  email: '',
  password: '',
  department_id: departmentId,
  status: 'Active',
  join_date: new Date().toISOString().slice(0, 10),
})

const createEmptyVendorForm = (): VendorFormState => ({
  vendor_name: '',
  contact: '',
  phone: '',
  specialization: '',
  rating: 0,
})

const createEmptyDepartmentForm = (): DepartmentFormState => ({
  department_name: '',
  department_code: '',
  head_count: 0,
})

const createEmptyCategoryForm = (): CategoryFormState => ({
  category_name: '',
  description: '',
  device_count: 0,
})

const toUserStatus = (status: string): UserStatus =>
  status.trim().toLowerCase() === 'inactive' ? 'Inactive' : 'Active'

const getAvatar = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

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

function StatusDot({ status }: { status: string }) {
  const color = status.trim().toLowerCase() === 'active' ? '#62df7d' : '#879485'
  return (
    <span
      className="w-2 h-2 rounded-full flex-shrink-0 inline-block"
      style={{ background: color }}
    />
  )
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center min-h-[220px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-on-surface-variant">{label}</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-4 text-sm"
      style={{ background: 'rgba(186,26,26,0.08)', color: 'var(--error-text)' }}
    >
      {message}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl p-6 text-sm text-center text-on-surface-variant"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {message}
    </div>
  )
}

export default function Settings() {
  const { showToast } = useToast()

  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<DeviceCategory[]>([])

  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [isDepartmentsLoading, setIsDepartmentsLoading] = useState(true)
  const [isVendorsLoading, setIsVendorsLoading] = useState(true)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)

  const [usersErrorMessage, setUsersErrorMessage] = useState<string | null>(null)
  const [departmentsErrorMessage, setDepartmentsErrorMessage] = useState<string | null>(null)
  const [vendorsErrorMessage, setVendorsErrorMessage] = useState<string | null>(null)
  const [categoriesErrorMessage, setCategoriesErrorMessage] = useState<string | null>(null)

  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [userModalMode, setUserModalMode] = useState<ModalMode>('create')
  const [userForm, setUserForm] = useState<UserFormState>(createEmptyUserForm())
  const [isUserFormLoading, setIsUserFormLoading] = useState(false)
  const [isSubmittingUser, setIsSubmittingUser] = useState(false)
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null)

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false)
  const [vendorModalMode, setVendorModalMode] = useState<ModalMode>('create')
  const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null)
  const [vendorForm, setVendorForm] = useState<VendorFormState>(createEmptyVendorForm())
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false)
  const [deleteTargetVendor, setDeleteTargetVendor] = useState<Vendor | null>(null)

  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false)
  const [departmentModalMode, setDepartmentModalMode] = useState<ModalMode>('create')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null)
  const [departmentForm, setDepartmentForm] = useState<DepartmentFormState>(
    createEmptyDepartmentForm(),
  )
  const [isSubmittingDepartment, setIsSubmittingDepartment] = useState(false)
  const [deleteTargetDepartment, setDeleteTargetDepartment] = useState<Department | null>(null)

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [categoryModalMode, setCategoryModalMode] = useState<ModalMode>('create')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(createEmptyCategoryForm())
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<DeviceCategory | null>(null)

  const loadUsers = async () => {
    setIsUsersLoading(true)
    setUsersErrorMessage(null)

    try {
      const response = await getUsers()

      if (!response.success) {
        throw new Error(response.message || 'Unable to load users right now.')
      }

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Unable to load users right now.')
      }

      setUsers(response.data.result)
    } catch (error) {
      setUsers([])
      setUsersErrorMessage(
        error instanceof Error ? error.message : 'Unable to load users right now.',
      )
    } finally {
      setIsUsersLoading(false)
    }
  }

  const loadDepartments = async () => {
    setIsDepartmentsLoading(true)
    setDepartmentsErrorMessage(null)

    try {
      const response = await getDepartments({
        department_name: '',
        department_code: '',
      })

      if (!response.success) {
        throw new Error(response.message || 'Unable to load departments right now.')
      }

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Unable to load departments right now.')
      }

      setDepartments(response.data.result)
    } catch (error) {
      setDepartments([])
      setDepartmentsErrorMessage(
        error instanceof Error ? error.message : 'Unable to load departments right now.',
      )
    } finally {
      setIsDepartmentsLoading(false)
    }
  }

  const loadVendors = async () => {
    setIsVendorsLoading(true)
    setVendorsErrorMessage(null)

    try {
      const response = await getVendors()

      if (!response.success) {
        throw new Error(response.message || 'Unable to load vendors right now.')
      }

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Unable to load vendors right now.')
      }

      setVendors(response.data.result)
    } catch (error) {
      setVendors([])
      setVendorsErrorMessage(
        error instanceof Error ? error.message : 'Unable to load vendors right now.',
      )
    } finally {
      setIsVendorsLoading(false)
    }
  }

  const loadCategories = async () => {
    setIsCategoriesLoading(true)
    setCategoriesErrorMessage(null)

    try {
      const response = await getDeviceCategories({
        category_name: '',
      })

      if (!response.success) {
        throw new Error(response.message || 'Unable to load device categories right now.')
      }

      if (!Array.isArray(response.data?.result)) {
        throw new Error('Unable to load device categories right now.')
      }

      setCategories(response.data.result)
    } catch (error) {
      setCategories([])
      setCategoriesErrorMessage(
        error instanceof Error ? error.message : 'Unable to load device categories right now.',
      )
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadUsers(), loadDepartments(), loadVendors(), loadCategories()])
  }, [])

  const closeUserModal = () => {
    setIsUserModalOpen(false)
    setIsUserFormLoading(false)
    setIsSubmittingUser(false)
    setUserForm(createEmptyUserForm(departments[0]?.department_id ?? 0))
  }

  const closeVendorModal = () => {
    setIsVendorModalOpen(false)
    setVendorModalMode('create')
    setSelectedVendorId(null)
    setVendorForm(createEmptyVendorForm())
    setIsSubmittingVendor(false)
  }

  const closeDepartmentModal = () => {
    setIsDepartmentModalOpen(false)
    setDepartmentModalMode('create')
    setSelectedDepartmentId(null)
    setDepartmentForm(createEmptyDepartmentForm())
    setIsSubmittingDepartment(false)
  }

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false)
    setCategoryModalMode('create')
    setSelectedCategoryId(null)
    setCategoryForm(createEmptyCategoryForm())
    setIsSubmittingCategory(false)
  }

  const openCreateUserModal = () => {
    setUserModalMode('create')
    setUserForm(createEmptyUserForm(departments[0]?.department_id ?? 0))
    setIsUserFormLoading(false)
    setIsUserModalOpen(true)
  }

  const openEditUserModal = (userId: number) => {
    setUserModalMode('edit')
    setIsUserFormLoading(true)
    setIsUserModalOpen(true)

    void (async () => {
      try {
        const response = await getUserById(userId)

        if (!response.success) {
          throw new Error(response.message || 'Unable to load user right now.')
        }

        const user = response.data?.result

        if (!user) {
          throw new Error('Unable to load user right now.')
        }

        setUserForm({
          user_id: user.user_id,
          user_name: user.user_name,
          email: user.email,
          password: '',
          department_id: user.department_id,
          status: toUserStatus(user.status),
          join_date: user.join_date.slice(0, 10),
        })
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to load user right now.',
          'error',
        )
        closeUserModal()
      } finally {
        setIsUserFormLoading(false)
      }
    })()
  }

  const handleUserSubmit = () => {
    if (!userForm.user_name.trim() || !userForm.email.trim() || !userForm.department_id) {
      showToast('Name, email, and department are required', 'error')
      return
    }

    if (userModalMode === 'create' && !userForm.password.trim()) {
      showToast('Password is required', 'error')
      return
    }

    setIsSubmittingUser(true)

    void (async () => {
      try {
        if (userModalMode === 'create') {
          const response = await createUser({
            user_name: userForm.user_name.trim(),
            email: userForm.email.trim(),
            password: userForm.password,
            department_id: userForm.department_id,
            status: userForm.status,
            join_date: userForm.join_date,
          } satisfies CreateUserRequest)

          if (!response.success) {
            throw new Error(response.message || 'Failed to create user')
          }

          showToast('User created successfully', 'success')
        } else {
          if (!userForm.user_id) {
            throw new Error('User ID is missing')
          }

          const response = await updateUser({
            user_id: userForm.user_id,
            user_name: userForm.user_name.trim(),
            email: userForm.email.trim(),
            department_id: userForm.department_id,
            status: userForm.status,
          })

          if (!response.success) {
            throw new Error(response.message || 'Failed to update user')
          }

          showToast('User updated successfully', 'success')
        }

        await loadUsers()
        closeUserModal()
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to save user right now.',
          'error',
        )
      } finally {
        setIsSubmittingUser(false)
      }
    })()
  }

  const handleDeleteUser = () => {
    if (!deleteTargetUser) {
      return
    }

    void (async () => {
      try {
        const response = await deleteUser({ user_id: deleteTargetUser.user_id })

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete user')
        }

        await loadUsers()
        showToast('User removed', 'info')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to delete user right now.',
          'error',
        )
      } finally {
        setDeleteTargetUser(null)
      }
    })()
  }

  const openCreateVendorModal = () => {
    setVendorModalMode('create')
    setSelectedVendorId(null)
    setVendorForm(createEmptyVendorForm())
    setIsVendorModalOpen(true)
  }

  const openEditVendorModal = (vendor: Vendor) => {
    setVendorModalMode('edit')
    setSelectedVendorId(vendor.vendor_id)
    setVendorForm({
      vendor_name: vendor.vendor_name,
      contact: vendor.contact,
      phone: vendor.phone,
      specialization: vendor.specialization,
      rating: Number(vendor.rating) || 0,
    })
    setIsVendorModalOpen(true)
  }

  const handleVendorSubmit = () => {
    if (!vendorForm.vendor_name.trim()) {
      showToast('Vendor name is required', 'error')
      return
    }

    setIsSubmittingVendor(true)

    void (async () => {
      try {
        const payload = {
          vendor_name: vendorForm.vendor_name.trim(),
          contact: vendorForm.contact.trim(),
          phone: vendorForm.phone.trim(),
          specialization: vendorForm.specialization.trim(),
          rating: vendorForm.rating,
        }

        if (vendorModalMode === 'create') {
          const response = await createVendor(payload satisfies CreateVendorRequest)

          if (!response.success) {
            throw new Error(response.message || 'Failed to create vendor')
          }

          showToast('Vendor created successfully', 'success')
        } else {
          if (selectedVendorId === null) {
            throw new Error('Vendor ID is missing')
          }

          const response = await updateVendor(
            selectedVendorId,
            payload satisfies UpdateVendorRequest,
          )

          if (!response.success) {
            throw new Error(response.message || 'Failed to update vendor')
          }

          showToast('Vendor updated successfully', 'success')
        }

        await loadVendors()
        closeVendorModal()
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to save vendor right now.',
          'error',
        )
      } finally {
        setIsSubmittingVendor(false)
      }
    })()
  }

  const handleDeleteVendor = () => {
    if (!deleteTargetVendor) {
      return
    }

    void (async () => {
      try {
        const response = await deleteVendor(deleteTargetVendor.vendor_id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete vendor')
        }

        await loadVendors()
        showToast('Vendor removed', 'info')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to delete vendor right now.',
          'error',
        )
      } finally {
        setDeleteTargetVendor(null)
      }
    })()
  }

  const openCreateDepartmentModal = () => {
    setDepartmentModalMode('create')
    setSelectedDepartmentId(null)
    setDepartmentForm(createEmptyDepartmentForm())
    setIsDepartmentModalOpen(true)
  }

  const openEditDepartmentModal = (department: Department) => {
    setDepartmentModalMode('edit')
    setSelectedDepartmentId(department.department_id)
    setDepartmentForm({
      department_name: department.department_name,
      department_code: department.department_code,
      head_count: department.head_count,
    })
    setIsDepartmentModalOpen(true)
  }

  const handleDepartmentSubmit = () => {
    if (!departmentForm.department_name.trim() || !departmentForm.department_code.trim()) {
      showToast('Department name and code are required', 'error')
      return
    }

    setIsSubmittingDepartment(true)

    void (async () => {
      try {
        const payload = {
          department_name: departmentForm.department_name.trim(),
          department_code: departmentForm.department_code.trim(),
          head_count: departmentForm.head_count,
        }

        if (departmentModalMode === 'create') {
          const response = await createDepartment(payload satisfies CreateDepartmentRequest)

          if (!response.success) {
            throw new Error(response.message || 'Failed to create department')
          }

          showToast('Department created successfully', 'success')
        } else {
          if (selectedDepartmentId === null) {
            throw new Error('Department ID is missing')
          }

          const response = await updateDepartment(
            selectedDepartmentId,
            payload satisfies UpdateDepartmentRequest,
          )

          if (!response.success) {
            throw new Error(response.message || 'Failed to update department')
          }

          showToast('Department updated successfully', 'success')
        }

        await Promise.all([loadDepartments(), loadUsers()])
        closeDepartmentModal()
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to save department right now.',
          'error',
        )
      } finally {
        setIsSubmittingDepartment(false)
      }
    })()
  }

  const handleDeleteDepartment = () => {
    if (!deleteTargetDepartment) {
      return
    }

    void (async () => {
      try {
        const response = await deleteDepartment(deleteTargetDepartment.department_id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete department')
        }

        await Promise.all([loadDepartments(), loadUsers()])
        showToast('Department removed', 'info')
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Unable to delete department right now.',
          'error',
        )
      } finally {
        setDeleteTargetDepartment(null)
      }
    })()
  }

  const openCreateCategoryModal = () => {
    setCategoryModalMode('create')
    setSelectedCategoryId(null)
    setCategoryForm(createEmptyCategoryForm())
    setIsCategoryModalOpen(true)
  }

  const openEditCategoryModal = (category: DeviceCategory) => {
    setCategoryModalMode('edit')
    setSelectedCategoryId(category.category_id)
    setCategoryForm({
      category_name: category.category_name,
      description: category.description,
      device_count: category.device_count,
    })
    setIsCategoryModalOpen(true)
  }

  const handleCategorySubmit = () => {
    if (!categoryForm.category_name.trim()) {
      showToast('Category name is required', 'error')
      return
    }

    setIsSubmittingCategory(true)

    void (async () => {
      try {
        const payload = {
          category_name: categoryForm.category_name.trim(),
          description: categoryForm.description.trim(),
          device_count: categoryForm.device_count,
        }

        if (categoryModalMode === 'create') {
          const response = await createDeviceCategory(
            payload satisfies CreateDeviceCategoryRequest,
          )

          if (!response.success) {
            throw new Error(response.message || 'Failed to create device category')
          }

          showToast('Device category created successfully', 'success')
        } else {
          if (selectedCategoryId === null) {
            throw new Error('Category ID is missing')
          }

          const response = await updateDeviceCategory(
            selectedCategoryId,
            payload satisfies UpdateDeviceCategoryRequest,
          )

          if (!response.success) {
            throw new Error(response.message || 'Failed to update device category')
          }

          showToast('Device category updated successfully', 'success')
        }

        await loadCategories()
        closeCategoryModal()
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : 'Unable to save device category right now.',
          'error',
        )
      } finally {
        setIsSubmittingCategory(false)
      }
    })()
  }

  const handleDeleteCategory = () => {
    if (!deleteTargetCategory) {
      return
    }

    void (async () => {
      try {
        const response = await deleteDeviceCategory(deleteTargetCategory.category_id)

        if (!response.success) {
          throw new Error(response.message || 'Failed to delete device category')
        }

        await loadCategories()
        showToast('Device category removed', 'info')
      } catch (error) {
        showToast(
          error instanceof Error
            ? error.message
            : 'Unable to delete device category right now.',
          'error',
        )
      } finally {
        setDeleteTargetCategory(null)
      }
    })()
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Configure system preferences and master data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="User Management" icon={Users} fullWidth>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-on-surface-variant">{users.length} users total</p>
            <button
              onClick={openCreateUserModal}
              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
              disabled={isDepartmentsLoading}
            >
              <Plus size={13} /> Create User
            </button>
          </div>

          {departmentsErrorMessage ? <ErrorState message={departmentsErrorMessage} /> : null}

          {isUsersLoading ? (
            <LoadingState label="Loading users..." />
          ) : usersErrorMessage ? (
            <ErrorState message={usersErrorMessage} />
          ) : users.length === 0 ? (
            <EmptyState message="No users available" />
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
                    >
                      {getAvatar(user.user_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-on-surface truncate">{user.user_name}</p>
                        <StatusDot status={user.status} />
                        <span className="text-xs text-on-surface-variant">{user.status}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {user.email} · {user.department.department_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditUserModal(user.user_id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTargetUser(user)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Vendor Management" icon={Building2}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-on-surface-variant">{vendors.length} vendors total</p>
            <button
              onClick={openCreateVendorModal}
              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> Create Vendor
            </button>
          </div>

          {isVendorsLoading ? (
            <LoadingState label="Loading vendors..." />
          ) : vendorsErrorMessage ? (
            <ErrorState message={vendorsErrorMessage} />
          ) : vendors.length === 0 ? (
            <EmptyState message="No vendors available" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {vendors.map((vendor) => (
                <div
                  key={vendor.vendor_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{vendor.vendor_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {vendor.contact || 'No contact'} · {vendor.phone || 'No phone'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {vendor.specialization || 'General'} · Rating {vendor.rating}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditVendorModal(vendor)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetVendor(vendor)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Department Management" icon={Building2}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-on-surface-variant">{departments.length} departments total</p>
            <button
              onClick={openCreateDepartmentModal}
              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> Create Department
            </button>
          </div>

          {isDepartmentsLoading ? (
            <LoadingState label="Loading departments..." />
          ) : departmentsErrorMessage ? (
            <ErrorState message={departmentsErrorMessage} />
          ) : departments.length === 0 ? (
            <EmptyState message="No departments available" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {departments.map((department) => (
                <div
                  key={department.department_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{department.department_name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {department.department_code} · {department.head_count} staff
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditDepartmentModal(department)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetDepartment(department)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Device Categories" icon={Tag}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-on-surface-variant">{categories.length} categories total</p>
            <button
              onClick={openCreateCategoryModal}
              className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> Create Category
            </button>
          </div>

          {isCategoriesLoading ? (
            <LoadingState label="Loading device categories..." />
          ) : categoriesErrorMessage ? (
            <ErrorState message={categoriesErrorMessage} />
          ) : categories.length === 0 ? (
            <EmptyState message="No device categories available" />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map((category) => (
                <div
                  key={category.category_id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface">{category.category_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {category.description || 'No description'}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {category.device_count} devices
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditCategoryModal(category)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTargetCategory(category)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Workflow Status Types" icon={Wrench} fullWidth>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-2">
              {REPAIR_STATUSES.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
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
            <div className="space-y-2">
              {REQUEST_STATUSES.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
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

      <Modal
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        title={userModalMode === 'create' ? 'Create User' : 'Edit User'}
        size="lg"
      >
        {isUserFormLoading ? (
          <LoadingState label="Loading user..." />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Full Name</label>
                <input
                  value={userForm.user_name}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({ ...currentForm, user_name: event.target.value }))
                  }
                  placeholder="e.g. Jane Doe"
                  className="input-field text-sm w-full"
                />
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({ ...currentForm, email: event.target.value }))
                  }
                  placeholder="jane@repairms.com"
                  className="input-field text-sm w-full"
                />
              </div>
              {userModalMode === 'create' && (
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(event) =>
                      setUserForm((currentForm) => ({ ...currentForm, password: event.target.value }))
                    }
                    placeholder="Enter password"
                    className="input-field text-sm w-full"
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Department</label>
                <select
                  value={userForm.department_id ? String(userForm.department_id) : ''}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      department_id: Number(event.target.value),
                    }))
                  }
                  className="input-field text-sm w-full"
                  disabled={isDepartmentsLoading || departments.length === 0}
                >
                  <option value="">
                    {isDepartmentsLoading
                      ? 'Loading departments...'
                      : departments.length === 0
                        ? 'No departments available'
                        : 'Select department'}
                  </option>
                  {departments.map((department) => (
                    <option key={department.department_id} value={department.department_id}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-on-surface-variant mb-1 block">Status</label>
                <select
                  value={userForm.status}
                  onChange={(event) =>
                    setUserForm((currentForm) => ({
                      ...currentForm,
                      status: event.target.value as UserStatus,
                    }))
                  }
                  className="input-field text-sm w-full"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {userModalMode === 'create' && (
                <div>
                  <label className="text-xs text-on-surface-variant mb-1 block">Join Date</label>
                  <input
                    type="date"
                    value={userForm.join_date}
                    onChange={(event) =>
                      setUserForm((currentForm) => ({ ...currentForm, join_date: event.target.value }))
                    }
                    className="input-field text-sm w-full"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-5">
              <button onClick={closeUserModal} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                <X size={12} /> Cancel
              </button>
              <button
                onClick={handleUserSubmit}
                className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
                disabled={isSubmittingUser}
              >
                <Check size={12} /> {isSubmittingUser ? 'Saving...' : userModalMode === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={isVendorModalOpen}
        onClose={closeVendorModal}
        title={vendorModalMode === 'create' ? 'Create Vendor' : 'Edit Vendor'}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Vendor Name</label>
            <input
              value={vendorForm.vendor_name}
              onChange={(event) =>
                setVendorForm((currentForm) => ({ ...currentForm, vendor_name: event.target.value }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Contact</label>
            <input
              value={vendorForm.contact}
              onChange={(event) =>
                setVendorForm((currentForm) => ({ ...currentForm, contact: event.target.value }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Phone</label>
            <input
              value={vendorForm.phone}
              onChange={(event) =>
                setVendorForm((currentForm) => ({ ...currentForm, phone: event.target.value }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Specialization</label>
            <input
              value={vendorForm.specialization}
              onChange={(event) =>
                setVendorForm((currentForm) => ({
                  ...currentForm,
                  specialization: event.target.value,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={vendorForm.rating}
              onChange={(event) =>
                setVendorForm((currentForm) => ({
                  ...currentForm,
                  rating: Number(event.target.value) || 0,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-5">
          <button onClick={closeVendorModal} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
            <X size={12} /> Cancel
          </button>
          <button
            onClick={handleVendorSubmit}
            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
            disabled={isSubmittingVendor}
          >
            <Check size={12} /> {isSubmittingVendor ? 'Saving...' : vendorModalMode === 'create' ? 'Create Vendor' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isDepartmentModalOpen}
        onClose={closeDepartmentModal}
        title={departmentModalMode === 'create' ? 'Create Department' : 'Edit Department'}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Department Name</label>
            <input
              value={departmentForm.department_name}
              onChange={(event) =>
                setDepartmentForm((currentForm) => ({
                  ...currentForm,
                  department_name: event.target.value,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Department Code</label>
            <input
              value={departmentForm.department_code}
              onChange={(event) =>
                setDepartmentForm((currentForm) => ({
                  ...currentForm,
                  department_code: event.target.value,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Head Count</label>
            <input
              type="number"
              min="0"
              value={departmentForm.head_count}
              onChange={(event) =>
                setDepartmentForm((currentForm) => ({
                  ...currentForm,
                  head_count: Number(event.target.value) || 0,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-5">
          <button onClick={closeDepartmentModal} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
            <X size={12} /> Cancel
          </button>
          <button
            onClick={handleDepartmentSubmit}
            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
            disabled={isSubmittingDepartment}
          >
            <Check size={12} /> {isSubmittingDepartment ? 'Saving...' : departmentModalMode === 'create' ? 'Create Department' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        title={categoryModalMode === 'create' ? 'Create Category' : 'Edit Category'}
        size="md"
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Category Name</label>
            <input
              value={categoryForm.category_name}
              onChange={(event) =>
                setCategoryForm((currentForm) => ({
                  ...currentForm,
                  category_name: event.target.value,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Description</label>
            <textarea
              value={categoryForm.description}
              onChange={(event) =>
                setCategoryForm((currentForm) => ({
                  ...currentForm,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="input-field text-sm w-full resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-on-surface-variant mb-1 block">Device Count</label>
            <input
              type="number"
              min="0"
              value={categoryForm.device_count}
              onChange={(event) =>
                setCategoryForm((currentForm) => ({
                  ...currentForm,
                  device_count: Number(event.target.value) || 0,
                }))
              }
              className="input-field text-sm w-full"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-5">
          <button onClick={closeCategoryModal} className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
            <X size={12} /> Cancel
          </button>
          <button
            onClick={handleCategorySubmit}
            className="btn-primary px-3 py-1.5 text-xs flex items-center gap-1"
            disabled={isSubmittingCategory}
          >
            <Check size={12} /> {isSubmittingCategory ? 'Saving...' : categoryModalMode === 'create' ? 'Create Category' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        danger
        onConfirm={handleDeleteUser}
        title="Remove User"
        message={`Are you sure you want to remove ${deleteTargetUser?.user_name ?? 'this user'}?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetVendor)}
        onClose={() => setDeleteTargetVendor(null)}
        danger
        onConfirm={handleDeleteVendor}
        title="Remove Vendor"
        message={`Are you sure you want to remove ${deleteTargetVendor?.vendor_name ?? 'this vendor'}?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetDepartment)}
        onClose={() => setDeleteTargetDepartment(null)}
        danger
        onConfirm={handleDeleteDepartment}
        title="Remove Department"
        message={`Are you sure you want to remove ${deleteTargetDepartment?.department_name ?? 'this department'}?`}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTargetCategory)}
        onClose={() => setDeleteTargetCategory(null)}
        danger
        onConfirm={handleDeleteCategory}
        title="Remove Device Category"
        message={`Are you sure you want to remove ${deleteTargetCategory?.category_name ?? 'this category'}?`}
      />
    </div>
  )
}
