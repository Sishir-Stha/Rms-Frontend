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

// --- New Interfaces for Database Integration ---
export interface DeviceSummaryRow {
  month: string
  department_name: string
  Approved: number
  Pending: number
  Rejected: number
  Fulfilled: number
}

export interface DeviceExpenseRow {
  request_id: number
  id: string
  device_type: string
  brand: string
  department_name: string;
  quantity: number
  expense_without_vat: number
  expense_with_vat: number
}

export interface RepairCostRow {
  repair_id: number
  device_name: string
  department_name: string
  cost: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface RepairDepartmentSummaryRow {
  month: string;
  department_name: string;
  Open: number;
  InProgress: number;
  Resolved: number;
  Closed: number;
}

export const getRepairsDepartmentSummary = async (): Promise<ApiResponse<RepairDepartmentSummaryRow[]>> => {
  const res = await fetch(`${API_BASE_URL}/reports/repairs/department-summary`);
  return res.json();
};

const API_BASE_URL = 'http://192.168.5.59:4000/api/v1' 
export const getRepairsReport = async (): Promise<RepairsReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/reports/repairs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch repairs report')
  return await response.json()
}

export const getDeviceReport = async (): Promise<DeviceReportResponse> => {
  const response = await fetch(`${API_BASE_URL}/reports/device`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error('Failed to fetch device report')
  return await response.json()
}

export const getDeviceReportSummary = async (): Promise<ApiResponse<DeviceSummaryRow[]>> => {
  const res = await fetch(`${API_BASE_URL}/reports/devices/summary`)
  return res.json()
}

export const getDeviceExpenses = async (month: string): Promise<ApiResponse<DeviceExpenseRow[]>> => {
  const res = await fetch(`${API_BASE_URL}/reports/devices/expenses?month=${month}`)
  return res.json()
}

export const getRepairsSummary = async (): Promise<ApiResponse<MonthlyRepairReport[]>> => {
  const res = await fetch(`${API_BASE_URL}/reports/repairs/summary`)
  return res.json()
}

export const getRepairCosts = async (month: string): Promise<ApiResponse<RepairCostRow[]>> => {
  const res = await fetch(`${API_BASE_URL}/reports/repairs/costs?month=${month}`)
  return res.json()
}
export const updateDeviceRequestExpense = async (id: string, expenseWithoutVat: number, expenseWithVat: number) => {
  const res = await fetch(`http://192.168.5.59:4000/api/v1/device-requests/${id}/expense`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      expense_without_vat: expenseWithoutVat, 
      expense_with_vat: expenseWithVat 
    })
  });
  return res.json();
};