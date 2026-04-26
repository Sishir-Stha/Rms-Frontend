import type { Priority, RepairKanbanColumn, RepairStatus } from './app'

export interface RepairListApiItem {
  repair_id: number
  device_name: string
  category_name: string
  serial_no: string
  department_name: string
  issue: string
  notes: string | null
  user_name: string
  vendor_name: string
  status: string | null
  priority: string
  expected_completion: string | null
  resolved_date: string | null
  costs: string
  kanban_column: string | null
}

export interface RepairListApiResponse {
  success: boolean
  message: string
  data: {
    result: RepairListApiItem[]
  }
}

export interface RepairDetailApiItem {
  repair_id: number
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string | null
  reported_by: number
  reported_date: string
  vendor_id: number
  status: string | null
  priority: string
  expected_completion: string | null
  resolved_date: string | null
  costs: string
  kanban_column: string | null
  created_at: string
  updated_at: string
}

export interface RepairDetailApiResponse {
  success: boolean
  message: string
  data: {
    result: RepairDetailApiItem
  }
}

export interface FetchRepairsFilters {
  status: string
  device_name: string
}

export interface RepairDepartmentOption {
  department_id: number
  department_name: string
  department_code: string
  head_count: number
}

export interface RepairVendorOption {
  vendor_id: number
  vendor_name: string
  contact: string
  phone: string
  specialization: string
  rating: string
  created_at: string
}

export interface RepairCategoryOption {
  category_id: number
  category_name: string
  description: string
  device_count: number
}

export interface RepairReportedByUser {
  user_id: number
  user_name: string
  email: string
  department_id: number
  status: string
  join_date: string
  created_at: string
}

export interface RepairUserOption {
  user_id: number
  user_name: string
}

export interface UpdateRepairPayload {
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string
  status: RepairStatus
  reported_by: number
  reported_date: string | null
  vendor_id: number
  priority: Priority
  expected_completion: string | null
  resolved_date: string | null
  cost: number
}

export interface CreateRepairPayload {
  device_name: string
  category_id: number
  serial_no: string
  department_id: number
  issue: string
  notes: string
  reported_by: number
  vendor_id: number
  priority: Priority
  expected_completion: string | null
}

export interface MoveRepairApiResponse {
  success: boolean
  message: string
  data: Record<string, unknown>
}

export interface RepairListItem {
  repairId: number
  id: string
  device: string
  deviceCategory: string
  serialNo: string
  department: string
  issue: string
  notes: string
  reportedBy: string
  vendor: string
  status: RepairStatus
  priority: Priority
  expectedCompletion: string | null
  resolvedDate: string | null
  cost: number
  kanbanColumn: RepairKanbanColumn
}

export interface RepairDetailItem {
  repairId: number
  id: string
  device: string
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
  expectedCompletion: string | null
  resolvedDate: string | null
  cost: number
  kanbanColumn: RepairKanbanColumn
  createdAt: string
  updatedAt: string
}
