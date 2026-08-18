import type { RepairCategoryOption } from '../types/repair.types'

const API_BASE_URL = 'http://localhost:4000/api/v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRepairCategoryOption = (value: unknown): value is RepairCategoryOption => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.category_id === 'number' &&
    typeof value.category_name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.device_count === 'number'
  )
}

const isArrayOfCategories = (value: unknown): value is RepairCategoryOption[] =>
  Array.isArray(value) && value.every(isRepairCategoryOption)

const extractCategories = (payload: unknown): RepairCategoryOption[] | null => {
  if (isArrayOfCategories(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (isArrayOfCategories(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && isArrayOfCategories(payload.data.result)) {
    return payload.data.result
  }

  return null
}

export async function fetchDeviceCategories(
  signal?: AbortSignal,
): Promise<RepairCategoryOption[]> {
  const response = await fetch(`${API_BASE_URL}/device-categories/get`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      category_name: '',
    }),
    signal,
  })

  if (!response.ok) {
    throw new Error('Unable to load device categories right now.')
  }

  const payload: unknown = await response.json()
  const categories = extractCategories(payload)

  if (!categories) {
    throw new Error('Unable to load device categories right now.')
  }

  return categories
}
