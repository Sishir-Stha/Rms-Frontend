import { fetchRepairs } from './repair.service'
import { fetchDeviceRequests } from './device-request.service'
import type { DashboardMetrics } from '../types/dashboard.types'

const onlyDate = (v: any): string => {
  if (!v) return ''
  const s = String(v).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s.slice(0, 10)
}

const getTodayString = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function fetchDashboardMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
  const [repairs, requests] = await Promise.all([
    fetchRepairs({ status: '', device_name: '' }, signal),
    fetchDeviceRequests({ approvalStatus: '', deviceType: '' }, signal),
  ])

  const today = getTodayString()

  // PENDING REPAIRS = "In Progress" entries from the Repair Kanban
  const pendingRepairs = repairs.filter(
    (r: any) => r.status === 'In Progress' || r.status === 'InProgress',
  ).length

  // DEVICE REQUESTS = active only (deleted / split-original entries excluded)
  const deviceRequests = requests.filter(
    (r: any) => r.isDeleted !== true && r.is_deleted !== true,
  ).length

  // RESOLVED TODAY = repairs resolved/closed with resolved date = today
  const resolvedToday = repairs.filter((r: any) => {
    const resolvedOn = onlyDate(r.resolvedDate ?? r.resolved_date)
    return (r.status === 'Resolved' || r.status === 'Closed') && resolvedOn === today
  }).length

  return {
    totalRepairs: repairs.length,
    pendingRepairs,
    deviceRequests,
    resolvedToday,
  }
}