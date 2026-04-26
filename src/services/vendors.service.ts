import type { RepairVendorOption } from '../types/repair.types'

const API_BASE_URL = 'http://localhost:4000/api/v1'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isRepairVendorOption = (value: unknown): value is RepairVendorOption => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.vendor_id === 'number' &&
    typeof value.vendor_name === 'string' &&
    typeof value.contact === 'string' &&
    typeof value.phone === 'string' &&
    typeof value.specialization === 'string' &&
    typeof value.rating === 'string' &&
    typeof value.created_at === 'string'
  )
}

const isArrayOfVendors = (value: unknown): value is RepairVendorOption[] =>
  Array.isArray(value) && value.every(isRepairVendorOption)

const extractVendors = (payload: unknown): RepairVendorOption[] | null => {
  if (isArrayOfVendors(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return null
  }

  if (isArrayOfVendors(payload.data)) {
    return payload.data
  }

  if (isRecord(payload.data) && isArrayOfVendors(payload.data.result)) {
    return payload.data.result
  }

  return null
}

export async function fetchVendors(
  signal?: AbortSignal,
): Promise<RepairVendorOption[]> {
  const response = await fetch(
    `${API_BASE_URL}/vendors?vendor_name=&specialization=`,
    {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      signal,
    },
  )

  if (!response.ok) {
    throw new Error('Unable to load vendors right now.')
  }

  const payload: unknown = await response.json()
  const vendors = extractVendors(payload)

  if (!vendors) {
    throw new Error('Unable to load vendors right now.')
  }

  return vendors
}
