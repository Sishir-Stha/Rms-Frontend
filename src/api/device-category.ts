// Get Device Categories
export interface GetDeviceCategoriesRequest {
  category_name: string
}

export interface DeviceCategory {
  category_id: number
  category_name: string
  description: string
  device_count: number
}

export interface GetDeviceCategoriesResponse {
  success: boolean
  message: string
  data: {
    result: DeviceCategory[]
  }
}

// Create Device Category
export interface CreateDeviceCategoryRequest {
  category_name: string
  description: string
  device_count: number
}

export interface CreateDeviceCategoryResponse {
  success: boolean
  message: string
  data: {
    category_id: number
  }
}

// Update Device Category
export interface UpdateDeviceCategoryRequest {
  category_name: string
  description: string
  device_count: number
}

export interface UpdateDeviceCategoryResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}

export interface DeleteDeviceCategoryResponse {
  success: boolean
  message: string
  data: {}
}


const API_BASE_URL = 'http://192.168.5.59:4000/api/v1'

export const getDeviceCategories = async (filters: GetDeviceCategoriesRequest): Promise<GetDeviceCategoriesResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-categories/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device categories')
  }

  return response.json()
}


export const createDeviceCategory = async (categoryData: CreateDeviceCategoryRequest): Promise<CreateDeviceCategoryResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  })

  if (!response.ok) {
    throw new Error('Failed to create device category')
  }

  return response.json()
}


export const updateDeviceCategory = async (categoryId: number, categoryData: UpdateDeviceCategoryRequest): Promise<UpdateDeviceCategoryResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-categories/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  })

  if (!response.ok) {
    throw new Error('Failed to update device category')
  }

  return response.json()
}

// Delete Device Category

export const deleteDeviceCategory = async (categoryId: number): Promise<DeleteDeviceCategoryResponse> => {
  const response = await fetch(`${API_BASE_URL}/device-categories/${categoryId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete device category')
  }

  return response.json()
}