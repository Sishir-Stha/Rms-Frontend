export interface MonthlyRepairSummary {
  Open: number
  InProgress: number
  Resolved: number
  Closed: number
}

export interface MonthlyRepairReport {
  month: string
  monthly_repair_summary: MonthlyRepairSummary
}

export interface RepairsReportResponse {
  success: boolean
  message: string
  data: MonthlyRepairReport[]
}

export interface DeviceRequestCounts {
  Approved: number
  Pending: number
  Rejected: number
}

export interface DeviceReport {
  department_code: string
  request_counts: DeviceRequestCounts
}

export interface DeviceReportResponse {
  success: boolean
  message: string
  data: DeviceReport[]
}

const API_BASE_URL = 'http://l192.168.5.59:4000/api/v1'

export const getRepairsReport = async (): Promise<RepairsReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/reports/repairs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch repairs report')
  }

  return await response.json()
}

export const getDeviceReport = async (): Promise<DeviceReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/reports/device`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch device report')
  }

  return await response.json()
}