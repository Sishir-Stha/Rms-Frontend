// Get Device Requests (List)
export interface DeviceRequest {
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
  approval_status: string
  approved_by: number | null
  approver_name: string | null
  approval_date: string | null
  kanban_column: string | null
  created_at: string
  updated_at: string
}

export interface GetDeviceRequestsResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequest[]
  }
}
// Get Single Device Request
export interface GetSingleDeviceRequestResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequest
  }
}
// Create Device Request
export interface CreateDeviceRequestRequest {
  requested_by: number
  department_id: number
  device_type: string
  brand: string
  reason: string
  quantity: number
  priority: string
}

export interface CreateDeviceRequestResponse {
  success: boolean
  message: string
  data: {
    request_id: number
  }
}
// Update Device Request
export interface UpdateDeviceRequestRequest {
  requested_by: number
  department_id: number
  device_type: string
  brand: string
  reason: string
  quantity: number
  priority: string
  request_date: string
  approval_status: string
  approved_by: number
  approval_date: string
  kanban_column: string
}

export interface UpdateDeviceRequestResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}
// Approve Device Request
export interface ApproveDeviceRequestRequest {
  approval_status: string
  approved_by: number
}

export interface ApproveDeviceRequestResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequest
  }
}

// Delete Device Request
export interface DeleteDeviceRequestResponse {
  success: boolean
  message: string
  data: {}
}




const API_BASE_URL = 'http://localhost:4000/api/v1'

export const getDeviceRequests = async (approval_status: string = '', device_type: string = ''): Promise<GetDeviceRequestsResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests?approval_status=${approval_status}&device_type=${device_type}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device requests')
  }

  return response.json()
}



export const getSingleDeviceRequest = async (requestId: number): Promise<GetSingleDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device request')
  }

  return response.json()
}



export const createDeviceRequest = async (requestData: CreateDeviceRequestRequest): Promise<CreateDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    throw new Error('Failed to create device request')
  }

  return response.json()
}



export const updateDeviceRequest = async (requestId: number, requestData: UpdateDeviceRequestRequest): Promise<UpdateDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    throw new Error('Failed to update device request')
  }

  return response.json()
}

// Move Device Request (Kanban)
export interface MoveDeviceRequestRequest {
  kanban_column: string
}

export interface MoveDeviceRequestResponse {
  success: boolean
  message: string
  data: {
    result: DeviceRequest
  }
}

export const moveDeviceRequest = async (requestId: number, moveData: MoveDeviceRequestRequest): Promise<MoveDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/move`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moveData),
  })

  if (!response.ok) {
    throw new Error('Failed to move device request')
  }

  return response.json()
}


export const approveDeviceRequest = async (requestId: number, approveData: ApproveDeviceRequestRequest): Promise<ApproveDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(approveData),
  })

  if (!response.ok) {
    throw new Error('Failed to approve device request')
  }

  return response.json()
}



export const deleteDeviceRequest = async (requestId: number): Promise<DeleteDeviceRequestResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-requests/${requestId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete device request')
  }

  return response.json()
}