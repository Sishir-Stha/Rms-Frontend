import { getUsers, type User } from '../api/user'
import type { RepairReportedByUser, RepairUserOption } from '../types/repair.types'

const API_BASE_URL = 'http://192.168.5.59:4000/api/v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRepairReportedByUser = (value: unknown): value is RepairReportedByUser => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.user_id === 'number' &&
    typeof value.user_name === 'string' &&
    typeof value.email === 'string' &&
    typeof value.department_id === 'number' &&
    typeof value.status === 'string' &&
    typeof value.join_date === 'string' &&
    typeof value.created_at === 'string'
  )
}

const isUserOption = (value: unknown): value is RepairUserOption => {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.user_id === 'number' && typeof value.user_name === 'string'
}

const extractUser = (payload: unknown): RepairReportedByUser | null => {
  if (isRepairReportedByUser(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (isRepairReportedByUser(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && isRepairReportedByUser(payload.data.result)) {
    return payload.data.result
  }

  return null
}

const extractUsers = (payload: unknown): RepairUserOption[] | null => {
  if (Array.isArray(payload) && payload.every(isUserOption)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (Array.isArray(payload.data) && payload.data.every(isUserOption)) {
    return payload.data
  }

  if (
    isRecord(payload.data) &&
    Array.isArray(payload.data.result) &&
    payload.data.result.every(isUserOption)
  ) {
    return payload.data.result
  }

  return null
}

const mapApiUserToOption = (user: User): RepairUserOption => ({
  user_id: user.user_id,
  user_name: user.user_name,
})

const isSelectableUser = (user: User): boolean => {
  const normalizedStatus = user.status.trim().toLowerCase()
  return normalizedStatus !== 'delete' && normalizedStatus !== 'deleted'
}

export async function fetchUsers(): Promise<RepairUserOption[]> {
  const payload = await getUsers()

  if (Array.isArray(payload.data?.result)) {
    return payload.data.result.filter(isSelectableUser).map(mapApiUserToOption)
  }

  const users = extractUsers(payload)

  if (users) {
    return users
  }

  throw new Error('Unable to load users right now.')
}

export async function fetchUserById(
  userId: number,
  signal?: AbortSignal,
): Promise<RepairReportedByUser> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error('Unable to load user right now.')
  }

  const payload: unknown = await response.json()
  const user = extractUser(payload)

  if (!user) {
    throw new Error('Unable to load user right now.')
  }

  return user
}
