import type { Priority, RepairKanbanColumn, RepairStatus } from '../types/app'
import type {
  FetchRepairsFilters,
  MoveRepairApiResponse,
  RepairListApiItem,
  RepairListApiResponse,
  RepairListItem,
} from '../types/repair.types'

const API_BASE_URL = 'http://localhost:4000/api/v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRepairListApiItem = (value: unknown): value is RepairListApiItem => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.repair_id === 'number' &&
    typeof value.device_name === 'string' &&
    typeof value.category_name === 'string' &&
    typeof value.serial_no === 'string' &&
    typeof value.department_name === 'string' &&
    typeof value.issue === 'string' &&
    (typeof value.notes === 'string' || value.notes === null) &&
    typeof value.user_name === 'string' &&
    typeof value.vendor_name === 'string' &&
    typeof value.status === 'string' &&
    typeof value.priority === 'string' &&
    (typeof value.expected_completion === 'string' ||
      value.expected_completion === null) &&
    (typeof value.resolved_date === 'string' || value.resolved_date === null) &&
    typeof value.costs === 'string' &&
    (typeof value.kanban_column === 'string' || value.kanban_column === null)
  )
}

const isRepairListApiResponse = (value: unknown): value is RepairListApiResponse => {
  if (!isRecord(value) || !isRecord(value.data) || !Array.isArray(value.data.result)) {
    return false
  }

  return value.data.result.every(isRepairListApiItem)
}

const isMoveRepairApiResponse = (value: unknown): value is MoveRepairApiResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  typeof value.message === 'string' &&
  isRecord(value.data)

const formatRepairDisplayId = (repairId: number): string =>
  `REP-${String(repairId).padStart(3, '0')}`

const normalizeRepairStatus = (status: string): RepairStatus => {
  switch (status.trim().toLowerCase()) {
    case 'in progress':
      return 'In Progress'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    case 'under review':
      return 'Resolved'
    case 'completed':
      return 'Closed'
    case 'cancelled':
    case 'canceled':
      return 'Cancelled'
    case 'pending':
    default:
      return 'Pending'
  }
}

const normalizePriority = (priority: string): Priority => {
  switch (priority.trim().toLowerCase()) {
    case 'critical':
      return 'Critical'
    case 'high':
      return 'High'
    case 'low':
      return 'Low'
    case 'medium':
    default:
      return 'Medium'
  }
}

const normalizeKanbanColumn = (
  kanbanColumn: string | null,
  status: RepairStatus,
): RepairKanbanColumn => {
  switch (kanbanColumn?.trim().toLowerCase()) {
    case 'in progress':
      return 'In Progress'
    case 'resolved':
      return 'Resolved'
    case 'closed':
      return 'Closed'
    case 'under review':
      return 'Resolved'
    case 'completed':
      return 'Closed'
    case 'backlog':
      return 'Backlog'
    default:
      switch (status) {
        case 'In Progress':
          return 'In Progress'
        case 'Resolved':
        case 'Under Review':
          return 'Resolved'
        case 'Closed':
        case 'Completed':
          return 'Closed'
        default:
          return 'Backlog'
      }
  }
}

const toApiKanbanColumn = (kanbanColumn: RepairKanbanColumn): string => {
  switch (kanbanColumn) {
    case 'Under Review':
      return 'Resolved'
    case 'Completed':
      return 'Closed'
    default:
      return kanbanColumn
  }
}

const mapRepairListItem = (repair: RepairListApiItem): RepairListItem => {
  const normalizedStatus = normalizeRepairStatus(repair.status)

  return {
    repairId: repair.repair_id,
    id: formatRepairDisplayId(repair.repair_id),
    device: repair.device_name,
    deviceCategory: repair.category_name,
    serialNo: repair.serial_no,
    department: repair.department_name,
    issue: repair.issue,
    notes: repair.notes ?? '',
    reportedBy: repair.user_name,
    vendor: repair.vendor_name,
    status: normalizedStatus,
    priority: normalizePriority(repair.priority),
    expectedCompletion: repair.expected_completion,
    resolvedDate: repair.resolved_date,
    cost: Number.parseFloat(repair.costs) || 0,
    kanbanColumn: normalizeKanbanColumn(repair.kanban_column, normalizedStatus),
  }
}

const readErrorBody = async (response: Response): Promise<string | null> => {
  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

export async function fetchRepairs(
  filters: FetchRepairsFilters,
  signal?: AbortSignal,
): Promise<RepairListItem[]> {
  const response = await fetch(`${API_BASE_URL}/repairs/get`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      status: filters.status,
      device_name: filters.device_name,
    }),
    signal,
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to load repairs (${response.status})`,
    )
  }

  const payload: unknown = await response.json()

  if (!isRepairListApiResponse(payload)) {
    throw new Error('Repairs response is invalid')
  }

  return payload.data.result.map(mapRepairListItem)
}

export async function deleteRepairById(repairId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to delete repair (${response.status})`,
    )
  }
}

export async function moveRepairCard(
  repairId: number,
  kanbanColumn: RepairKanbanColumn,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      kanban_column: toApiKanbanColumn(kanbanColumn),
    }),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to move repair (${response.status})`,
    )
  }

  const payload: unknown = await response.json()

  if (!isMoveRepairApiResponse(payload)) {
    throw new Error('Move repair response is invalid')
  }
}
