export interface Department {
  department_id: number
  department_name: string
}

export interface User {
  user_id: number
  user_name: string
  email: string
  department: Department
  status: string
  join_date: string
  created_at: string
}

export interface UsersResponse {
  success: boolean
  message: string
  data: {
    result: User[]
  }
}


export interface CreateUserRequest {
  user_name: string
  email: string
  password: string
  department_id: number
  status: string
  join_date: string
}

export interface CreateUserResponse {
  success: boolean
  message: string
  data: {
    response: {
      user_id: number
      user_name: string
    }
  }
}


export interface UpdateUserRequest {
  user_id: number
  user_name: string
  email: string
  department_id: number
  status: string
}

export interface UpdatedUser {
  user_id: number
  user_name: string
  email: string
  password: string
  department_id: number
  status: string
  join_date: string
  created_at: string
}

export interface UpdateUserResponse {
  success: boolean
  message: string
  data: {
    updated: UpdatedUser
  }
}


export interface DeleteUserRequest {
  user_id: number
}

export interface DeletedUser {
  user_id: number
  user_name: string
  email: string
  password: string
  department_id: number
  status: string
  join_date: string
  created_at: string
}

export interface DeleteUserResponse {
  success: boolean
  message: string
  data: {
    result: DeletedUser
  }
}
const API_BASE_URL = 'http://localhost:4000/api/v1'

export const getUsers = async (): Promise<UsersResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}



export const createUser = async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    throw new Error('Failed to create user')
  }

  return response.json()
}


export const updateUser = async (userData: UpdateUserRequest): Promise<UpdateUserResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    throw new Error('Failed to update user')
  }

  return response.json()
}


export const deleteUser = async (userData: DeleteUserRequest): Promise<DeleteUserResponse> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    throw new Error('Failed to delete user')
  }

  return response.json()
}