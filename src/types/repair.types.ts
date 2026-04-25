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
  status: string
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

export interface FetchRepairsFilters {
  status: string
  device_name: string
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
