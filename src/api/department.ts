// Get Departments
export interface GetDepartmentsRequest {
  department_name: string
  department_code: string
}

export interface Department {
  department_id: number
  department_name: string
  department_code: string
  head_count: number
}

export interface GetDepartmentsResponse {
  success: boolean
  message: string
  data: {
    result: Department[]
  }
}



const API_BASE_URL = 'http://localhost:4000/api/v1'

export const getDepartments = async (filters: GetDepartmentsRequest): Promise<GetDepartmentsResponse> => {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filters),
  })

  if (!response.ok) {
    throw new Error('Failed to fetch departments')
  }

  return response.json()
}

// Create Department
export interface CreateDepartmentRequest {
  department_name: string
  department_code: string
  head_count: number
}

export interface CreateDepartmentResponse {
  success: boolean
  message: string
  data: {
    department_id: number
  }
}

export const createDepartment = async (departmentData: CreateDepartmentRequest): Promise<CreateDepartmentResponse> => {
  const response = await fetch(`${API_BASE_URL}/departments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(departmentData),
  })

  if (!response.ok) {
    throw new Error('Failed to create department')
  }

  return response.json()
}

// Update Department
export interface UpdateDepartmentRequest {
  department_name: string
  department_code: string
  head_count: number
}

export interface UpdateDepartmentResponse {
  success: boolean
  message: string
  data: {
    result: boolean
  }
}

export const updateDepartment = async (departmentId: number, departmentData: UpdateDepartmentRequest): Promise<UpdateDepartmentResponse> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(departmentData),
  })

  if (!response.ok) {
    throw new Error('Failed to update department')
  }

  return response.json()
}

// Delete Department
export interface DeleteDepartmentResponse {
  success: boolean
  message: string
  data: {}
}

export const deleteDepartment = async (departmentId: number): Promise<DeleteDepartmentResponse> => {
  const response = await fetch(`${API_BASE_URL}/departments/${departmentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to delete department')
  }

  return response.json()
}