import type { Priority, RepairStatus } from '../types/app'
import type {
  CreateRepairPayload,
  FetchRepairsFilters,
  MoveRepairApiResponse,
  RepairDetailApiItem,
  RepairDetailApiResponse,
  RepairDetailItem,
  RepairListApiItem,
  RepairListItem,
  UpdateRepairPayload,
} from '../types/repair.types'

const API_BASE_URL = 'http://192.168.5.59/api/v1'
const LOAD_REPAIRS_ERROR_MESSAGE = 'Unable to load repairs right now.'
const LOAD_REPAIR_DETAIL_ERROR_MESSAGE = 'Unable to load repair detail right now.'
const REPAIRS_SYNC_EVENT = 'repairs:changed'

interface RepairsPayloadEnvelope {
  success?: boolean
  message?: string
  data?: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const extractPayloadMessage = (payload: unknown): string | null => {
  if (!isRecord(payload) || typeof payload.message !== 'string') {
    return null
  }

  const message = payload.message.trim()
  return message === '' ? null : message
}

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
    (typeof value.status === 'string' || value.status === null) &&
    typeof value.priority === 'string' &&
    (typeof value.expected_completion === 'string' ||
      value.expected_completion === null) &&
    (typeof value.resolved_date === 'string' || value.resolved_date === null) &&
    typeof value.costs === 'string'
  )
}

const isRepairDetailApiItem = (value: unknown): value is RepairDetailApiItem => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.repair_id === 'number' &&
    typeof value.device_name === 'string' &&
    typeof value.category_id === 'number' &&
    typeof value.serial_no === 'string' &&
    typeof value.department_id === 'number' &&
    typeof value.issue === 'string' &&
    (typeof value.notes === 'string' || value.notes === null) &&
    typeof value.reported_by === 'number' &&
    typeof value.reported_date === 'string' &&
    typeof value.vendor_id === 'number' &&
    (typeof value.status === 'string' || value.status === null) &&
    typeof value.priority === 'string' &&
    (typeof value.expected_completion === 'string' ||
      value.expected_completion === null) &&
    (typeof value.resolved_date === 'string' || value.resolved_date === null) &&
    typeof value.costs === 'string' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

const isRepairDetailApiResponse = (value: unknown): value is RepairDetailApiResponse =>
  isRecord(value) &&
  isRecord(value.data) &&
  isRepairDetailApiItem(value.data.result)

const isMoveRepairApiResponse = (value: unknown): value is MoveRepairApiResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  typeof value.message === 'string' &&
  isRecord(value.data)

const emitRepairsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(REPAIRS_SYNC_EVENT))
  }
}

export const subscribeToRepairsChanged = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const listener = () => callback()
  window.addEventListener(REPAIRS_SYNC_EVENT, listener)

  return () => {
    window.removeEventListener(REPAIRS_SYNC_EVENT, listener)
  }
}

const isArrayOfRepairListItems = (value: unknown): value is RepairListApiItem[] =>
  Array.isArray(value) && value.every(isRepairListApiItem)

const extractRepairListItems = (payload: unknown): RepairListApiItem[] | null => {
  if (isArrayOfRepairListItems(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  const envelope = payload as RepairsPayloadEnvelope

  if (isArrayOfRepairListItems(envelope.data)) {
    return envelope.data
  }

  if (isRecord(envelope.data) && isArrayOfRepairListItems(envelope.data.result)) {
    return envelope.data.result
  }

  return null
}

const isNoRepairsPayload = (payload: unknown): boolean => {
  if (!isRecord(payload)) {
    return false
  }

  const envelope = payload as RepairsPayloadEnvelope
  const message =
    typeof envelope.message === 'string' ? envelope.message.trim().toLowerCase() : ''

  if (message.includes('no repairs found')) {
    return true
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data.length === 0
  }

  if (isRecord(envelope.data)) {
    if (isArrayOfRepairListItems(envelope.data.result)) {
      return envelope.data.result.length === 0
    }

    return Object.keys(envelope.data).length === 0
  }

  return envelope.data === undefined || envelope.data === null
}

const formatRepairDisplayId = (repairId: number): string =>
  `REP-${String(repairId).padStart(3, '0')}`

const normalizeRepairStatus = (status: string | null | undefined): RepairStatus => {
  const normalizedStatus = status?.trim().toLowerCase()

  switch (normalizedStatus) {
    case 'open':
      return 'Open'
    case 'inprogress':
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
      return 'Closed'
    case 'pending':
      return 'Open'
    default:
      return 'Open'
  }
}

const serializeRepairStatus = (status: string): string => {
  switch (status) {
    case 'In Progress':
      return 'InProgress'
    default:
      return status
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
  }
}

const mapRepairDetailItem = (repair: RepairDetailApiItem): RepairDetailItem => {
  const normalizedStatus = normalizeRepairStatus(repair.status)

  return {
    repairId: repair.repair_id,
    id: formatRepairDisplayId(repair.repair_id),
    device: repair.device_name,
    categoryId: repair.category_id,
    serialNo: repair.serial_no,
    departmentId: repair.department_id,
    issue: repair.issue,
    notes: repair.notes ?? '',
    reportedById: repair.reported_by,
    reportedDate: repair.reported_date,
    vendorId: repair.vendor_id,
    status: normalizedStatus,
    priority: normalizePriority(repair.priority),
    expectedCompletion: repair.expected_completion,
    resolvedDate: repair.resolved_date,
    cost: Number.parseFloat(repair.costs) || 0,
    createdAt: repair.created_at,
    updatedAt: repair.updated_at,
  }
}

const parseJsonResponse = async (response: Response): Promise<unknown> => {
  try {
    return await response.json()
  } catch {
    return null
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
      status: filters.status ? serializeRepairStatus(filters.status) : '',
      device_name: filters.device_name,
    }),
    signal,
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    if (isNoRepairsPayload(payload)) {
      return []
    }

    throw new Error(LOAD_REPAIRS_ERROR_MESSAGE)
  }

  const repairs = extractRepairListItems(payload)

  if (repairs) {
    return repairs.map(mapRepairListItem)
  }

  if (isNoRepairsPayload(payload)) {
    return []
  }

  throw new Error(LOAD_REPAIRS_ERROR_MESSAGE)
}

export async function fetchRepairById(
  repairId: number,
  signal?: AbortSignal,
): Promise<RepairDetailItem> {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(LOAD_REPAIR_DETAIL_ERROR_MESSAGE)
  }

  const payload: unknown = await response.json()

  if (!isRepairDetailApiResponse(payload)) {
    throw new Error(LOAD_REPAIR_DETAIL_ERROR_MESSAGE)
  }

  return mapRepairDetailItem(payload.data.result)
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

  emitRepairsChanged()
}

export async function updateRepairById(
  repairId: number,
  payload: UpdateRepairPayload,
): Promise<void> {
  const requestPayload = {
    ...payload,
    status: serializeRepairStatus(payload.status),
  }

  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(requestPayload),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to update repair (${response.status})`,
    )
  }

  emitRepairsChanged()
}

export async function moveRepairCard(
  repairId: number,
  status: RepairStatus,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/repairs/${repairId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      status: serializeRepairStatus(status),
    }),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to move repair (${response.status})`,
    )
  }

  const payload = await parseJsonResponse(response)

  if (payload === null) {
    emitRepairsChanged()
    return
  }

  if (isMoveRepairApiResponse(payload)) {
    emitRepairsChanged()
    return
  }

  if (isRecord(payload) && payload.success === false) {
    throw new Error(extractPayloadMessage(payload) || 'Failed to move repair.')
  }

  emitRepairsChanged()
}

const extractCreatedRepairId = (payload: unknown): number | null => {
  if (!isRecord(payload)) {
    return null
  }

  if (typeof payload.repair_id === 'number') {
    return payload.repair_id
  }

  if (isRecord(payload.data)) {
    if (typeof payload.data.repair_id === 'number') {
      return payload.data.repair_id
    }

    if (isRecord(payload.data.result) && typeof payload.data.result.repair_id === 'number') {
      return payload.data.result.repair_id
    }
  }

  return null
}

export async function createRepairEntry(
  payload: CreateRepairPayload,
): Promise<number | null> {
  const response = await fetch(`${API_BASE_URL}/repairs`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const parsedPayload = await parseJsonResponse(response)

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(
      errorBody || `Failed to create repair (${response.status})`,
    )
  }

  emitRepairsChanged()

  return extractCreatedRepairId(parsedPayload)
}
