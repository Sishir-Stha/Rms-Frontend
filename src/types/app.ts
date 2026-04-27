export type UserStatus = 'Active' | 'Inactive'
export type RepairStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
export type RequestApprovalStatus = 'Requested' | 'Pending' | 'Approved' | 'Rejected'
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved'
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface AppUser {
  id: number
  name: string
  email: string
  department: string
  status: UserStatus
  avatar: string
  joinDate: string
}

export interface VendorRecord {
  id: number
  name: string
  contact: string
  phone: string
  specialization: string
  rating: number
}

export interface DepartmentRecord {
  id: number
  name: string
  code: string
  headCount: number
}

export interface DeviceCategoryRecord {
  id: number
  name: string
  description: string
  icon: string
  count: number
}

export interface RepairRecord {
  id: string
  device: string
  deviceCategory: string
  issue: string
  reportedBy: string
  reportedDate: string
  technician: string
  vendor: string
  status: RepairStatus
  priority: Priority
  expectedCompletion: string | null
  resolvedDate: string | null
  cost: number
  serialNo: string
  department: string
  kanbanColumn?: RepairStatus
  notes?: string
}

export interface DeviceRequestRecord {
  id: string
  requestedBy: string
  department: string
  deviceType: string
  brand: string
  reason: string
  requestDate: string
  approvalStatus: RequestApprovalStatus
  approvedBy: string | null
  approvalDate: string | null
  priority: Priority
  kanbanColumn?: RequestApprovalStatus
  quantity?: number
}

export interface SupportTicketRecord {
  id: string
  title: string
  description: string
  raisedBy: string
  department: string
  priority: Priority
  status: TicketStatus
  assignedTo: string
  category: string
  createdDate: string
  updatedDate: string
}

export interface MonthlyRepairDataPoint {
  month: string
  repairs: number
  completed: number
  pending: number
}

export interface DeviceCategoryChartDatum {
  name: string
  value: number
  fill: string
}

export interface DepartmentRequestsDatum {
  dept: string
  requests: number
  approved: number
  rejected: number
  pending: number
}

export interface TechnicianPerformanceDatum {
  name: string
  resolved: number
  inProgress: number
  avgDays: number
  rating: number
}

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

export interface NotificationItem {
  id: number
  text: string
  time: string
  dot: string
}
