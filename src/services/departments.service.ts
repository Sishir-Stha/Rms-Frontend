import type { RepairDepartmentOption } from '../types/repair.types'

const API_BASE_URL = 'http://192.168.5.59:4000/api/v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRepairDepartmentOption = (value: unknown): value is RepairDepartmentOption => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.department_id === 'number' &&
    typeof value.department_name === 'string' &&
    typeof value.department_code === 'string' &&
    typeof value.head_count === 'number'
  )
}

const isArrayOfDepartments = (value: unknown): value is RepairDepartmentOption[] =>
  Array.isArray(value) && value.every(isRepairDepartmentOption)

const extractDepartments = (payload: unknown): RepairDepartmentOption[] | null => {
  if (isArrayOfDepartments(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (isArrayOfDepartments(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && isArrayOfDepartments(payload.data.result)) {
    return payload.data.result
  }

  return null
}

export async function fetchDepartments(
  signal?: AbortSignal,
): Promise<RepairDepartmentOption[]> {
  const response = await fetch(`${API_BASE_URL}/departments/get`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      department_name: '',
      department_code: '',
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error('Unable to load departments right now.')
  }

  const payload: unknown = await response.json()
  const departments = extractDepartments(payload)

  if (!departments) {
    throw new Error('Unable to load departments right now.')
  }

  return departments
}
