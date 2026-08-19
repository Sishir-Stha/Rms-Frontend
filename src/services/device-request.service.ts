import type { Priority, RequestApprovalStatus } from '../types/app'
import type {
  ApproveDeviceRequestApiResponse,
  ApproveDeviceRequestPayload,
  CreateDeviceRequestPayload,
  DeviceRequestApiItem,
  DeviceRequestDetailApiResponse,
  DeviceRequestDetailItem,
  DeviceRequestListItem,
  FetchDeviceRequestsFilters,
  MoveDeviceRequestApiResponse,
  UpdateDeviceRequestPayload,
} from '../types/device-request.types'

const API_BASE_URL = 'http://192.168.5.59:4000/api/v1'
const LOAD_DEVICE_REQUESTS_ERROR_MESSAGE = 'Unable to load device requests right now.'
const LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE =
  'Unable to load device request detail right now.'
const DEVICE_REQUESTS_SYNC_EVENT = 'device-requests:changed'

interface DeviceRequestsPayloadEnvelope {
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

const isDeviceRequestApiItem = (value: unknown): value is DeviceRequestApiItem => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.request_id === 'number' &&
    typeof value.requested_by === 'number' &&
    (typeof value.requested_for === 'string' ||
      value.requested_for === null ||
      value.requested_for === undefined) &&
    typeof value.requester_name === 'string' &&
    typeof value.department_id === 'number' &&
    typeof value.department_name === 'string' &&
    typeof value.device_type === 'string' &&
    typeof value.brand === 'string' &&
    typeof value.reason === 'string' &&
    typeof value.quantity === 'number' &&
    typeof value.priority === 'string' &&
    typeof value.request_date === 'string' &&
    (typeof value.approval_status === 'string' || value.approval_status === null) &&
    (typeof value.approved_by === 'number' || value.approved_by === null) &&
    (typeof value.approver_name === 'string' || value.approver_name === null) &&
    (typeof value.approval_date === 'string' || value.approval_date === null) &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  )
}

const isArrayOfDeviceRequestItems = (value: unknown): value is DeviceRequestApiItem[] =>
  Array.isArray(value) && value.every(isDeviceRequestApiItem)

const isDeviceRequestDetailApiResponse = (
  value: unknown,
): value is DeviceRequestDetailApiResponse =>
  isRecord(value) && isRecord(value.data) && isDeviceRequestApiItem(value.data.result)

const isMoveDeviceRequestApiResponse = (
  value: unknown,
): value is MoveDeviceRequestApiResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  typeof value.message === 'string' &&
  isRecord(value.data) &&
  isDeviceRequestApiItem(value.data.result)

const isApproveDeviceRequestApiResponse = (
  value: unknown,
): value is ApproveDeviceRequestApiResponse =>
  isRecord(value) &&
  typeof value.success === 'boolean' &&
  typeof value.message === 'string' &&
  isRecord(value.data) &&
  isDeviceRequestApiItem(value.data.result)

const emitDeviceRequestsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(DEVICE_REQUESTS_SYNC_EVENT))
  }
}

export const subscribeToDeviceRequestsChanged = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const listener = () => callback()
  window.addEventListener(DEVICE_REQUESTS_SYNC_EVENT, listener)

  return () => {
    window.removeEventListener(DEVICE_REQUESTS_SYNC_EVENT, listener)
  }
}

const extractDeviceRequestItems = (payload: unknown): DeviceRequestApiItem[] | null => {
  if (isArrayOfDeviceRequestItems(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  const envelope = payload as DeviceRequestsPayloadEnvelope

  if (isArrayOfDeviceRequestItems(envelope.data)) {
    return envelope.data
  }

  if (isRecord(envelope.data) && isArrayOfDeviceRequestItems(envelope.data.result)) {
    return envelope.data.result
  }

  return null
}

const extractSingleDeviceRequestItem = (payload: unknown): DeviceRequestApiItem | null => {
  if (isDeviceRequestApiItem(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (isDeviceRequestApiItem(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && isDeviceRequestApiItem(payload.data.result)) {
    return payload.data.result
  }

  return null
}

const isNoDeviceRequestsPayload = (payload: unknown): boolean => {
  if (!isRecord(payload)) {
    return false
  }

  const envelope = payload as DeviceRequestsPayloadEnvelope
  const message =
    typeof envelope.message === 'string' ? envelope.message.trim().toLowerCase() : ''

  if (
    (message.includes('no') && message.includes('device request')) ||
    (message.includes('no') && message.includes('requests found'))
  ) {
    return true
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data.length === 0
  }

  if (isRecord(envelope.data)) {
    if (isArrayOfDeviceRequestItems(envelope.data.result)) {
      return envelope.data.result.length === 0
    }

    return Object.keys(envelope.data).length === 0
  }

  return envelope.data === undefined || envelope.data === null
}

const formatDeviceRequestDisplayId = (requestId: number): string =>
  `REQ-${String(requestId).padStart(3, '0')}`

const normalizeRequestStatus = (
  status: string | null | undefined,
): RequestApprovalStatus => {
  const normalizedStatus = status?.trim().toLowerCase()

  switch (normalizedStatus) {
    case 'requested':
      return 'Requested'
    case 'pending':
      return 'Pending'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'fulfilled':
      return 'Fulfilled' // <--- Added this case
    default:
      return 'Requested'
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

const mapDeviceRequestItem = (request: DeviceRequestApiItem): DeviceRequestListItem => {
  const normalizedStatus = normalizeRequestStatus(request.approval_status)

  return {
    requestId: request.request_id,
    id: formatDeviceRequestDisplayId(request.request_id),
    requestedById: request.requested_by,
    requestedBy: request.requester_name,
    requestedFor: typeof request.requested_for === 'string' ? request.requested_for : '',
    departmentId: request.department_id,
    department: request.department_name,
    deviceType: request.device_type,
    brand: request.brand,
    reason: request.reason,
    quantity: request.quantity,
    priority: normalizePriority(request.priority),
    requestDate: request.request_date.slice(0, 10),
    recommendedDate: request.recommended_date ? request.recommended_date.slice(0, 10) : null,
    approvalStatus: normalizedStatus,
    approvedById: request.approved_by,
    approvedBy: request.approver_name,
    approvalDate: request.approval_date ? request.approval_date.slice(0, 10) : null,
    fulfilledDate: request.fulfilled_date ? request.fulfilled_date.slice(0, 10) : null,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }
}

const mapDeviceRequestDetailItem = (
  request: DeviceRequestApiItem,
): DeviceRequestDetailItem => ({
  ...mapDeviceRequestItem(request),
})

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

export async function fetchDeviceRequests(
  filters: FetchDeviceRequestsFilters,
  signal?: AbortSignal,
): Promise<DeviceRequestListItem[]> {
  const params = new URLSearchParams({
    approval_status: filters.approvalStatus,
    device_type: filters.deviceType,
  })

  const response = await fetch(`${API_BASE_URL}/device-requests?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    if (isNoDeviceRequestsPayload(payload)) {
      return []
    }

    throw new Error(LOAD_DEVICE_REQUESTS_ERROR_MESSAGE)
  }

  const requests = extractDeviceRequestItems(payload)

  if (requests) {
    return requests.map(mapDeviceRequestItem)
  }

  if (isNoDeviceRequestsPayload(payload)) {
    return []
  }

  throw new Error(LOAD_DEVICE_REQUESTS_ERROR_MESSAGE)
}

export async function fetchDeviceRequestById(
  requestId: number,
  signal?: AbortSignal,
): Promise<DeviceRequestDetailItem> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE)
  }

  const payload: unknown = await response.json()

  if (!isDeviceRequestDetailApiResponse(payload)) {
    throw new Error(LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE)
  }

  return mapDeviceRequestDetailItem(payload.data.result)
}

export async function createDeviceRequestEntry(
  payload: CreateDeviceRequestPayload,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody || `Failed to create device request (${response.status})`)
  }

  emitDeviceRequestsChanged()
}

export async function updateDeviceRequestById(
  requestId: number,
  payload: UpdateDeviceRequestPayload,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody || `Failed to update device request (${response.status})`)
  }

  emitDeviceRequestsChanged()
}

export async function moveDeviceRequestCard(
  requestId: number,
  approvalStatus: RequestApprovalStatus,
): Promise<DeviceRequestListItem | null> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/move`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      approval_status: approvalStatus,
    }),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody || `Failed to move device request (${response.status})`)
  }

  const payload = await parseJsonResponse(response)

  if (payload === null) {
    emitDeviceRequestsChanged()
    return null
  }

  if (isMoveDeviceRequestApiResponse(payload)) {
    emitDeviceRequestsChanged()
    return mapDeviceRequestItem(payload.data.result)
  }

  const requestItem = extractSingleDeviceRequestItem(payload)

  if (requestItem) {
    emitDeviceRequestsChanged()
    return mapDeviceRequestItem(requestItem)
  }

  if (isRecord(payload) && payload.success === false) {
    throw new Error(extractPayloadMessage(payload) || 'Failed to move device request.')
  }

  emitDeviceRequestsChanged()
  return null
}

export async function approveDeviceRequestById(
  requestId: number,
  payload: ApproveDeviceRequestPayload,
): Promise<DeviceRequestListItem | null> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/approve`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody || `Failed to update request approval (${response.status})`)
  }

  const parsedPayload = await parseJsonResponse(response)

  if (parsedPayload === null) {
    emitDeviceRequestsChanged()
    return null
  }

  if (isApproveDeviceRequestApiResponse(parsedPayload)) {
    emitDeviceRequestsChanged()
    return mapDeviceRequestItem(parsedPayload.data.result)
  }

  const requestItem = extractSingleDeviceRequestItem(parsedPayload)

  if (requestItem) {
    emitDeviceRequestsChanged()
    return mapDeviceRequestItem(requestItem)
  }

  if (isRecord(parsedPayload) && parsedPayload.success === false) {
    throw new Error(
      extractPayloadMessage(parsedPayload) || 'Failed to update request approval.',
    )
  }

  emitDeviceRequestsChanged()
  return null
}

export async function deleteDeviceRequestById(requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const errorBody = await readErrorBody(response)
    throw new Error(errorBody || `Failed to delete device request (${response.status})`)
  }

  emitDeviceRequestsChanged()
}