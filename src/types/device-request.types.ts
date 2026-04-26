import type { Priority, RequestApprovalStatus, RequestKanbanColumn } from './app'

export interface DeviceRequestApiItem {
  request_id: number
  requested_by: number
  requester_name: string
  department_id: number
  department_name: string
  device_type: string
  brand: string
  reason: string
  quantity: number
  priority: string
  request_date: string
  approval_status: string | null
  approved_by: number | null
  approver_name: string | null
  approval_date: string | null
  kanban_column: string | null
  created_at: string
  updated_at: string
}

export interface DeviceRequestApiResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequestApiItem[]
  }
}

export interface DeviceRequestDetailApiResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequestApiItem
  }
}

export interface FetchDeviceRequestsFilters {
  approvalStatus: string
  deviceType: string
}

export interface CreateDeviceRequestPayload {
  requested_by: number
  department_id: number
  device_type: string
  brand: string
  reason: string
  quantity: number
  priority: Priority
}

export interface UpdateDeviceRequestPayload {
  requested_by: number
  department_id: number
  device_type: string
  brand: string
  reason: string
  quantity: number
  priority: Priority
  request_date: string | null
  approval_status: RequestApprovalStatus
  approved_by: number | null
  approval_date: string | null
  kanban_column: RequestKanbanColumn
}

export interface ApproveDeviceRequestPayload {
  approval_status: Extract<RequestApprovalStatus, 'Approved' | 'Rejected'>
  approved_by: number
}

export interface MoveDeviceRequestApiResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequestApiItem
  }
}

export interface ApproveDeviceRequestApiResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequestApiItem
  }
}

export interface DeviceRequestListItem {
  requestId: number
  id: string
  requestedById: number
  requestedBy: string
  departmentId: number
  department: string
  deviceType: string
  brand: string
  reason: string
  quantity: number
  priority: Priority
  requestDate: string
  approvalStatus: RequestApprovalStatus
  approvedById: number | null
  approvedBy: string | null
  approvalDate: string | null
  kanbanColumn: RequestKanbanColumn
}

export interface DeviceRequestDetailItem extends DeviceRequestListItem {
  createdAt: string
  updatedAt: string
}
