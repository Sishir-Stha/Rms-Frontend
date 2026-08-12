// Get Device Stocks List
export interface DeviceStock {
  stock_id: number
  device_category_id: number
  category_name?: string

  device_code: string | null
  issue: string | null
  date: string | null

  origin_sector: string | null
  origin_department: number
  origin_department_name?: string

  destination_sector: string | null
  destination_department: number | null
  destination_department_name?: string | null

  device_quantity: number
  status: 'IN' | 'OUT'

  created_by: number
  created_by_name?: string

  updated_by: number | null
  updated_by_name?: string | null

  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export interface GetDeviceStocksResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock[]
  }
}

// Get Single Device Stock
export interface GetSingleDeviceStockResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock
  }
}

// Create Device Stock
export interface CreateDeviceStockRequest {
  device_category_id: number
  device_code: string | null
  issue: string | null
  date: string | null
  origin_sector: string | null
  origin_department: number
  destination_sector: string | null
  destination_department: number | null
  device_quantity: number
  status: 'IN' | 'OUT'
  created_by: number
}

export interface CreateDeviceStockResponse {
  success: boolean
  message: string
  data: {
    stock_id: number
  }
}

// Update Device Stock
export interface UpdateDeviceStockRequest {
  device_category_id: number | null
  device_code: string | null
  issue: string | null
  date: string | null
  origin_sector: string | null
  origin_department: number | null
  destination_sector: string | null
  destination_department: number | null
  device_quantity: number | null
  status: 'IN' | 'OUT' | null
  updated_by: number
}

export interface UpdateDeviceStockResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock
  }
}

// Update Device Stock Status
export interface UpdateDeviceStockStatusRequest {
  status: 'IN' | 'OUT'
  updated_by: number
}

export interface UpdateDeviceStockStatusResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock
  }
}

// Transfer Device Stock
export interface TransferDeviceStockRequest {
  destination_sector: string | null
  destination_department: number
  updated_by: number
}

export interface TransferDeviceStockResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock
  }
}

// Delete Device Stock
export interface DeleteDeviceStockRequest {
  updated_by: number
}

export interface DeleteDeviceStockResponse {
  success: boolean
  message: string
  data: {}
}

const API_BASE_URL = 'http://192.168.5.59/api/v1'

export const getDeviceStocks = async (
  status: string = '',
  device_category_id: string | number = '',
  origin_department: string | number = '',
  destination_department: string | number = ''
): Promise<GetDeviceStocksResponse> => {
  const params = new URLSearchParams()

  if (status) params.append('status', status)
  if (device_category_id) params.append('device_category_id', String(device_category_id))
  if (origin_department) params.append('origin_department', String(origin_department))
  if (destination_department) params.append('destination_department', String(destination_department))

  const response = await fetch(`${API_BASE_URL}/device-stock?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device stocks')
  }

  return response.json()
}

export const getSingleDeviceStock = async (
  stockId: number
): Promise<GetSingleDeviceStockResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock/${stockId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device stock')
  }

  return response.json()
}

export const createDeviceStock = async (
  stockData: CreateDeviceStockRequest
): Promise<CreateDeviceStockResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stockData),
  })

  if (!response.ok) {
    throw new Error('Failed to create device stock')
  }

  return response.json()
}

export const updateDeviceStock = async (
  stockId: number,
  stockData: UpdateDeviceStockRequest
): Promise<UpdateDeviceStockResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock/${stockId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stockData),
  })

  if (!response.ok) {
    throw new Error('Failed to update device stock')
  }

  return response.json()
}

export const updateDeviceStockStatus = async (
  stockId: number,
  statusData: UpdateDeviceStockStatusRequest
): Promise<UpdateDeviceStockStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock/${stockId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(statusData),
  })

  if (!response.ok) {
    throw new Error('Failed to update device stock status')
  }

  return response.json()
}

export const transferDeviceStock = async (
  stockId: number,
  transferData: TransferDeviceStockRequest
): Promise<TransferDeviceStockResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock/${stockId}/transfer`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transferData),
  })

  if (!response.ok) {
    throw new Error('Failed to transfer device stock')
  }

  return response.json()
}

export const deleteDeviceStock = async (
  stockId: number,
  deleteData: DeleteDeviceStockRequest
): Promise<DeleteDeviceStockResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-stock/${stockId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(deleteData),
  })

  if (!response.ok) {
    throw new Error('Failed to delete device stock')
  }

  return response.json()
}