export interface DashboardMetrics {
  totalRepairs: number
  pendingRepairs: number
  deviceRequests: number
  resolvedToday: number
  totalRepairsTrend: number
  pendingTrend: number
  requestsTrend: number
  resolvedTrend: number
}

export interface DashboardMetricsResponse {
  success: boolean
  message: string
  data: DashboardMetrics
}

const API_BASE_URL = 'http://localhost:4000/api/v1'

export const getDashboardMetrics = async (): Promise<DashboardMetricsResponse> => {
  const response = await fetch(`${API_BASE_URL}/dashboard/metrics`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard metrics')
  }

  return response.json()
}