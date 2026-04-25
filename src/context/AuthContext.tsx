import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UserData } from '../api/auth'
import type { AppUser } from '../types/app'

interface AuthContextValue {
  currentUser: AppUser | null
  isAuthenticated: boolean
  loading: boolean
  login: (user: AppUser | UserData) => void
  logout: () => void
}

const STORAGE_KEY = 'repairms_user'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const buildAvatar = (name: string): string =>
  name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AU'

const normalizeUser = (value: AppUser | UserData): AppUser => {
  if ('user_id' in value) {
    return {
      id: value.user_id,
      name: value.username,
      email: value.email,
      department: String(value.department),
      status: value.status === 'Inactive' ? 'Inactive' : 'Active',
      avatar: buildAvatar(value.username),
      joinDate: new Date().toISOString().slice(0, 10),
    }
  }

  return value
}

const parseStoredUser = (stored: string | null): AppUser | null => {
  if (!stored) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(stored)
    if (!isRecord(parsed)) {
      return null
    }

    if (
      typeof parsed.id === 'number' &&
      typeof parsed.name === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.department === 'string'
    ) {
      return {
        id: parsed.id,
        name: parsed.name,
        email: parsed.email,
        department: parsed.department,
        status: parsed.status === 'Inactive' ? 'Inactive' : 'Active',
        avatar: typeof parsed.avatar === 'string' ? parsed.avatar : buildAvatar(parsed.name),
        joinDate:
          typeof parsed.joinDate === 'string'
            ? parsed.joinDate
            : new Date().toISOString().slice(0, 10),
      }
    }

    if (
      typeof parsed.user_id === 'number' &&
      typeof parsed.username === 'string' &&
      typeof parsed.email === 'string' &&
      (typeof parsed.department === 'number' || typeof parsed.department === 'string')
    ) {
      return normalizeUser({
        user_id: parsed.user_id,
        username: parsed.username,
        email: parsed.email,
        department:
          typeof parsed.department === 'number'
            ? parsed.department
            : Number.parseInt(parsed.department, 10) || 0,
        status: parsed.status === 'Inactive' ? 'Inactive' : 'Active',
      })
    }

    return null
  } catch {
    return null
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const user = parseStoredUser(localStorage.getItem(STORAGE_KEY))

    if (user) {
      setCurrentUser(user)
      setIsAuthenticated(true)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }

    setLoading(false)
  }, [])

  const login = (user: AppUser | UserData) => {
    const normalizedUser = normalizeUser(user)

    setCurrentUser(normalizedUser)
    setIsAuthenticated(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedUser))
  }

  const logout = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem(STORAGE_KEY)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isAuthenticated,
      loading,
      login,
      logout,
    }),
    [currentUser, isAuthenticated, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
