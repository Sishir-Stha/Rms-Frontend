import type { Priority, RequestApprovalStatus } from '../types/app'
import type {
  ApproveDeviceRequestApiResponse, ApproveDeviceRequestPayload, CreateDeviceRequestPayload,
  DeviceRequestApiItem, DeviceRequestDetailApiResponse, DeviceRequestDetailItem, DeviceRequestListItem,
  FetchDeviceRequestsFilters, MoveDeviceRequestApiResponse,
} from '../types/device-request.types'

const API_BASE_URL = `http://${typeof window !== 'undefined' ? window.location.hostname : '192.168.5.59'}:4000/api/v1`
const LOAD_DEVICE_REQUESTS_ERROR_MESSAGE = 'Unable to load device requests right now.'
const LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE = 'Unable to load device request detail right now.'
const DEVICE_REQUESTS_SYNC_EVENT = 'device-requests:changed'

interface DeviceRequestsPayloadEnvelope { success?: boolean; message?: string; data?: unknown }

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null
const extractPayloadMessage = (payload: unknown): string | null => {
  if (!isRecord(payload) || typeof payload.message !== 'string') return null
  return payload.message.trim() === '' ? null : payload.message.trim()
}

const isDeviceRequestApiItem = (value: unknown): value is DeviceRequestApiItem => {
  if (!isRecord(value)) return false
  return typeof value.request_id === 'number' && typeof value.requested_by === 'number' &&
    (typeof value.requested_for === 'string' || value.requested_for === null || value.requested_for === undefined) &&
    typeof value.requester_name === 'string' && typeof value.department_id === 'number' &&
    typeof value.department_name === 'string' && typeof value.device_type === 'string' &&
    typeof value.brand === 'string' && typeof value.reason === 'string' && typeof value.quantity === 'number' &&
    typeof value.priority === 'string' && typeof value.request_date === 'string' &&
    (typeof value.approval_status === 'string' || value.approval_status === null) &&
    (typeof value.approved_by === 'number' || value.approved_by === null) &&
    (typeof value.approver_name === 'string' || value.approver_name === null) &&
    (typeof value.approval_date === 'string' || value.approval_date === null) &&
    typeof value.created_at === 'string' && typeof value.updated_at === 'string'
}

const isArrayOfDeviceRequestItems = (value: unknown): value is DeviceRequestApiItem[] => Array.isArray(value) && value.every(isDeviceRequestApiItem)
const isDeviceRequestDetailApiResponse = (value: unknown): value is DeviceRequestDetailApiResponse => isRecord(value) && isRecord(value.data) && isDeviceRequestApiItem(value.data.result)
const isMoveDeviceRequestApiResponse = (value: unknown): value is MoveDeviceRequestApiResponse => isRecord(value) && typeof value.success === 'boolean' && typeof value.message === 'string' && isRecord(value.data) && isDeviceRequestApiItem(value.data.result)
const isApproveDeviceRequestApiResponse = (value: unknown): value is ApproveDeviceRequestApiResponse => isRecord(value) && typeof value.success === 'boolean' && typeof value.message === 'string' && isRecord(value.data) && isDeviceRequestApiItem(value.data.result)

const emitDeviceRequestsChanged = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event(DEVICE_REQUESTS_SYNC_EVENT)) }

export const subscribeToDeviceRequestsChanged = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {}
  const listener = () => callback()
  window.addEventListener(DEVICE_REQUESTS_SYNC_EVENT, listener)
  return () => window.removeEventListener(DEVICE_REQUESTS_SYNC_EVENT, listener)
}

const extractDeviceRequestItems = (payload: unknown): DeviceRequestApiItem[] | null => {
  if (isArrayOfDeviceRequestItems(payload)) return payload
  if (!isRecord(payload)) return null
  const envelope = payload as DeviceRequestsPayloadEnvelope
  if (isArrayOfDeviceRequestItems(envelope.data)) return envelope.data
  if (isRecord(envelope.data) && isArrayOfDeviceRequestItems(envelope.data.result)) return envelope.data.result
  return null
}

const extractSingleDeviceRequestItem = (payload: unknown): DeviceRequestApiItem | null => {
  if (isDeviceRequestApiItem(payload)) return payload
  if (!isRecord(payload)) return null
  if (isDeviceRequestApiItem(payload.data)) return payload.data
  if (isRecord(payload.data) && isDeviceRequestApiItem(payload.data.result)) return payload.data.result
  return null
}

const isNoDeviceRequestsPayload = (payload: unknown): boolean => {
  if (!isRecord(payload)) return false
  const envelope = payload as DeviceRequestsPayloadEnvelope
  const message = typeof envelope.message === 'string' ? envelope.message.trim().toLowerCase() : ''
  if ((message.includes('no') && message.includes('device request')) || (message.includes('no') && message.includes('requests found'))) return true
  if (Array.isArray(envelope.data)) return envelope.data.length === 0
  if (isRecord(envelope.data)) {
    if (isArrayOfDeviceRequestItems(envelope.data.result)) return envelope.data.result.length === 0
    return Object.keys(envelope.data).length === 0
  }
  return envelope.data === undefined || envelope.data === null
}

const formatDeviceRequestDisplayId = (request: DeviceRequestApiItem): string => {
  const reqAny = request as any
  if (reqAny.split_info && reqAny.original_request_id) {
    return `REQ-${reqAny.original_request_id}/${reqAny.split_info}`
  }
  return `REQ-${String(request.request_id).padStart(3, '0')}`
}

const normalizeRequestStatus = (status: string | null | undefined): RequestApprovalStatus => {
  const s = status?.trim().toLowerCase()
  if (s === 'requested') return 'Requested'
  if (s === 'pending') return 'Pending'
  if (s === 'approved') return 'Approved'
  if (s === 'rejected') return 'Rejected'
  if (s === 'fulfilled' || s === 'partially fulfilled') return 'Fulfilled'
  return 'Requested'
}

const normalizePriority = (priority: string): Priority => {
  const p = priority.trim().toLowerCase()
  if (p === 'critical') return 'Critical'
  if (p === 'high') return 'High'
  if (p === 'low') return 'Low'
  return 'Medium'
}

const mapDeviceRequestItem = (request: DeviceRequestApiItem): DeviceRequestListItem => {
  const reqAny = request as any
  return {
    requestId: request.request_id,
    id: formatDeviceRequestDisplayId(request),
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
    recommendedDate: reqAny.recommended_date ? reqAny.recommended_date.slice(0, 10) : null,
    approvalStatus: normalizeRequestStatus(request.approval_status),
    approvedById: request.approved_by,
    approvedBy: request.approver_name,
    approvalDate: request.approval_date ? request.approval_date.slice(0, 10) : null,
    fulfilledDate: request.fulfilled_date ? request.fulfilled_date.slice(0, 10) : null,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    ...(reqAny.is_deleted !== undefined ? { isDeleted: reqAny.is_deleted } : {}),
    ...(reqAny.original_request_id !== undefined ? { originalRequestId: reqAny.original_request_id } : {}),
    ...(reqAny.split_info !== undefined ? { splitInfo: reqAny.split_info } : {}),
    ...(reqAny.planned_fulfilled_qty !== undefined ? { plannedFulfilledQty: reqAny.planned_fulfilled_qty } : {}),
  } as unknown as DeviceRequestListItem
}

const mapDeviceRequestDetailItem = (request: DeviceRequestApiItem): DeviceRequestDetailItem => ({ ...mapDeviceRequestItem(request) } as unknown as DeviceRequestDetailItem)

const parseJsonResponse = async (response: Response): Promise<unknown> => { try { return await response.json() } catch { return null } }
const readErrorBody = async (response: Response): Promise<string | null> => { try { const text = await response.text(); return text || null } catch { return null } }

export async function fetchDeviceRequests(filters: FetchDeviceRequestsFilters, signal?: AbortSignal): Promise<DeviceRequestListItem[]> {
  const params = new URLSearchParams()
  if (filters.approvalStatus) params.append('approval_status', filters.approvalStatus)
  if (filters.deviceType) params.append('device_type', filters.deviceType)
  const url = params.toString() ? `${API_BASE_URL}/device-requests?${params.toString()}` : `${API_BASE_URL}/device-requests`
  const response = await fetch(url, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, signal })
  const payload = await parseJsonResponse(response)
  if (!response.ok) {
    if (isNoDeviceRequestsPayload(payload)) return []
    throw new Error(LOAD_DEVICE_REQUESTS_ERROR_MESSAGE)
  }
  const requests = extractDeviceRequestItems(payload)
  if (requests) return requests.map(mapDeviceRequestItem)
  if (isNoDeviceRequestsPayload(payload)) return []
  throw new Error(LOAD_DEVICE_REQUESTS_ERROR_MESSAGE)
}

export async function fetchDeviceRequestById(requestId: number, signal?: AbortSignal): Promise<DeviceRequestDetailItem> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, signal })
  if (!response.ok) throw new Error(LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE)
  const payload: unknown = await response.json()
  if (!isDeviceRequestDetailApiResponse(payload)) throw new Error(LOAD_DEVICE_REQUEST_DETAIL_ERROR_MESSAGE)
  return mapDeviceRequestDetailItem(payload.data.result)
}

export async function createDeviceRequestEntry(payload: CreateDeviceRequestPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to create device request (${response.status})`)
  emitDeviceRequestsChanged()
}

export async function updateDeviceRequestById(requestId: number, payload: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to update device request (${response.status})`)
  emitDeviceRequestsChanged()
}

export async function moveDeviceRequestCard(requestId: number, approvalStatus: RequestApprovalStatus): Promise<DeviceRequestListItem | null> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/move`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ approval_status: approvalStatus }) })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to move device request (${response.status})`)
  const payload = await parseJsonResponse(response)
  if (payload === null) { emitDeviceRequestsChanged(); return null }
  if (isMoveDeviceRequestApiResponse(payload)) { emitDeviceRequestsChanged(); return mapDeviceRequestItem(payload.data.result) }
  const item = extractSingleDeviceRequestItem(payload)
  if (item) { emitDeviceRequestsChanged(); return mapDeviceRequestItem(item) }
  if (isRecord(payload) && payload.success === false) throw new Error(extractPayloadMessage(payload) || 'Failed to move device request.')
  emitDeviceRequestsChanged(); return null
}

export async function approveDeviceRequestById(requestId: number, approvePayload: ApproveDeviceRequestPayload): Promise<DeviceRequestListItem | null> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/approve`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(approvePayload) })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to update request approval (${response.status})`)
  const parsedPayload = await parseJsonResponse(response)
  if (parsedPayload === null) { emitDeviceRequestsChanged(); return null }
  if (isApproveDeviceRequestApiResponse(parsedPayload)) { emitDeviceRequestsChanged(); return mapDeviceRequestItem(parsedPayload.data.result) }
  const item = extractSingleDeviceRequestItem(parsedPayload)
  if (item) { emitDeviceRequestsChanged(); return mapDeviceRequestItem(item) }
  if (isRecord(parsedPayload) && parsedPayload.success === false) throw new Error(extractPayloadMessage(parsedPayload) || 'Failed to update request approval.')
  emitDeviceRequestsChanged(); return null
}

export async function deleteDeviceRequestById(requestId: number, deletedBy: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ deleted_by: deletedBy })
  })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to delete device request (${response.status})`)
  emitDeviceRequestsChanged()
}

export async function processSplitFulfillment(requestId: number, payload: { fulfilled_quantity: number; performed_by: number; notes?: string }): Promise<{ fulfilledRequestId: number; remainingRequestId: number | null; message: string }> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/split-fulfill`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error((await readErrorBody(response)) || `Failed to process split fulfillment (${response.status})`)
  const parsedPayload = await parseJsonResponse(response)
  if (isRecord(parsedPayload) && parsedPayload.success === true && isRecord(parsedPayload.data) && isRecord(parsedPayload.data.result)) {
    const result = parsedPayload.data.result as Record<string, unknown>
    emitDeviceRequestsChanged()
    return {
      fulfilledRequestId: Number(result.fulfilled_request_id),
      remainingRequestId: result.remaining_request_id != null ? Number(result.remaining_request_id) : null,
      message: typeof result.message === 'string' ? result.message : 'Request split successfully',
    }
  }
  throw new Error('Failed to process split fulfillment.')
}

export interface AuditLogEntry {
  action: string
  previous_value: string | null
  new_value: string | null
  performed_by_name: string | null
  performed_at: string
  notes: string | null
}

export async function fetchRequestHistory(requestId: number): Promise<AuditLogEntry[]> {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/history`, { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Failed to fetch request history')
  const payload: unknown = await response.json()
  if (isRecord(payload) && payload.success === true && isRecord(payload.data) && Array.isArray(payload.data.result)) {
    return payload.data.result as AuditLogEntry[]
  }
  throw new Error('Failed to parse request history')
}