const API_BASE_URL = 'http://localhost:4000/api/v1'

// =======================
// 📦 TYPES
// =======================

export interface DeviceStock {
  id: string
  deviceCategory: string
  deviceCode?: string
  date: string
  originSector: string
  originDepartment: string
  destinationSector?: string
  destinationDepartment?: string
  issue?: string
  deviceQuantity: number
  status: 'IN' | 'OUT'
}

// =======================
// 📥 GET LIST
// =======================

export interface GetDeviceStocksRequest {
  search?: string
  status?: 'IN' | 'OUT' | ''
  page?: number
  limit?: number
}

export interface GetDeviceStocksResponse {
  success: boolean
  message: string
  data: {
    result: DeviceStock[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

// =======================
// ➕ CREATE
// =======================

export interface CreateDeviceStockRequest {
  deviceCategory: string
  deviceCode?: string
  date: string
  originSector: string
  originDepartment: string
  destinationSector?: string
  destinationDepartment?: string
  issue?: string
  deviceQuantity: number
  status: 'IN' | 'OUT'
}

export interface CreateDeviceStockResponse {
  success: boolean
  message: string
  data: {
    id: number
  }
}

// =======================
// ✏️ UPDATE
// =======================

export interface UpdateDeviceStockRequest {
  deviceCategory?: string
  deviceCode?: string
  date?: string
  originSector?: string
  originDepartment?: string
  destinationSector?: string
  destinationDepartment?: string
  issue?: string
  deviceQuantity?: number
  status?: 'IN' | 'OUT'
}

export interface UpdateDeviceStockResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}

// =======================
// 🗑️ DELETE
// =======================

export interface DeleteDeviceStockResponse {
  success: boolean
  message: string
  data: Record<string, never>
}

// =======================
// 🔌 API FUNCTIONS
// =======================

// 📥 GET LIST
export const getDeviceStocks = async (
  params: GetDeviceStocksRequest
): Promise<GetDeviceStocksResponse> => {
  const query = new URLSearchParams({
    search: params.search ?? '',
    status: params.status ?? '',
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
  })

  const response = await fetch(
    `${API_BASE_URL}/device-stock?${query.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch device stocks')
  }

  return response.json()
}

// ➕ CREATE
export const createDeviceStock = async (
  data: CreateDeviceStockRequest
): Promise<CreateDeviceStockResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/device-stock`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create device stock')
  }

  return response.json()
}

// 🔍 GET BY ID
export const getDeviceStockById = async (id: string) => {
  const response = await fetch(
    `${API_BASE_URL}/device-stock/${id}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch device stock')
  }

  return response.json()
}

// ✏️ UPDATE
export const updateDeviceStock = async (
  id: string,
  data: UpdateDeviceStockRequest
): Promise<UpdateDeviceStockResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/device-stock/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update device stock')
  }

  return response.json()
}

// 🗑️ DELETE
export const deleteDeviceStock = async (
  id: string
): Promise<DeleteDeviceStockResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/device-stock/${id}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete device stock')
  }

  return response.json()
}