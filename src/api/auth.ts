export interface LoginRequest {
  email: string
  password: string
}

export interface UserData {
  user_id: number
  username: string
  email: string
  department: number
  status: string
}

export interface LoginResponse {
  success: boolean
  message: string
  data: {
    response: UserData
  }
}

const API_BASE_URL = 'http://localhost:4000/api/v1'

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  const data: LoginResponse = await response.json()

  // Store the response data in localStorage
  localStorage.setItem('userData', JSON.stringify(data.data.response))
  localStorage.setItem('loginResponse', JSON.stringify(data))

  return data
}

export const loginApi = login

// Helper function to get stored user data from anywhere in the app
export const getStoredUserData = (): UserData | null => {
  const userData = localStorage.getItem('userData')
  return userData ? JSON.parse(userData) : null
}

// Helper function to get full login response
export const getStoredLoginResponse = (): LoginResponse | null => {
  const loginResponse = localStorage.getItem('loginResponse')
  return loginResponse ? JSON.parse(loginResponse) : null
}
