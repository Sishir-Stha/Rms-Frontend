import type { DashboardMetrics } from '../types/dashboard.types'

const API_BASE_URL = 'http://localhost:4000/api/v1'

interface DashboardMetricsEnvelope {
  data: unknown
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isDashboardMetrics = (value: unknown): value is DashboardMetrics => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.totalRepairs === 'number' &&
    typeof value.pendingRepairs === 'number' &&
    typeof value.deviceRequests === 'number' &&
    typeof value.resolvedToday === 'number'
  )
}

const isDashboardMetricsEnvelope = (
  value: unknown,
): value is DashboardMetricsEnvelope => isRecord(value) && 'data' in value

export async function fetchDashboardMetrics(
  signal?: AbortSignal,
): Promise<DashboardMetrics> {
  const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Failed to load dashboard metrics (${response.status})`)
  }

  const payload: unknown = await response.json()

  if (isDashboardMetrics(payload)) {
    return payload
  }

  if (
    isDashboardMetricsEnvelope(payload) &&
    isDashboardMetrics(payload.data)
  ) {
    return payload.data
  }

  throw new Error('Dashboard metrics response is invalid')
}
