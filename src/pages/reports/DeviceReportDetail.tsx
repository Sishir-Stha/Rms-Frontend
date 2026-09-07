import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, FileText } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { fetchDepartments } from '../../services/departments.service'
import { fetchDeviceRequests } from '../../services/device-request.service'
import ReportDateFilter, { type ReportDateRange } from '../../components/ReportDateFilter'
import type { RepairDepartmentOption } from '../../types/repair.types'
import type { DeviceRequestListItem } from '../../types/device-request.types'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

interface ExpenseRow {
  requestId: number
  id: string
  deviceType: string
  brand: string
  department: string
  quantity: number
  expenseWithoutVat: number
  expenseWithVat: number
}

interface DepartmentRow {
  department: string
  Approved: number
  Pending: number
  Rejected: number
  Fulfilled: number
}

// Date used for range filtering = the status decision date
const statusDate = (r: DeviceRequestListItem): string => {
  switch (r.approvalStatus) {
    case 'Pending': return r.recommendedDate || r.approvalDate || r.requestDate || ''
    case 'Approved':
    case 'Rejected': return r.approvalDate || r.requestDate || ''
    case 'Fulfilled': return r.fulfilledDate || r.approvalDate || r.requestDate || ''
    default: return r.requestDate || ''
  }
}

const cell = (n: number | string) => {
  const value = Number(n) || 0
  return value === 0 ? '-' : value
}

export default function DeviceReportDetail() {
  const navigate = useNavigate()
  const [allRequests, setAllRequests] = useState<DeviceRequestListItem[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [range, setRange] = useState<ReportDateRange | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const [requests, deptOptions] = await Promise.all([
          fetchDeviceRequests({ approvalStatus: '', deviceType: '' }),
          fetchDepartments().catch(() => [] as RepairDepartmentOption[]),
        ])
        if (!isMounted) return
        setAllRequests(requests)
        setDepartments(Array.isArray(deptOptions) ? deptOptions : [])
      } catch (error) {
        if (!isMounted) return
        setAllRequests([])
        setDepartments([])
        setErrorMessage(error instanceof Error ? error.message : LOAD_REPORT_ERROR_MESSAGE)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    void load()
    return () => { isMounted = false }
  }, [])

  // Requests whose status-date falls inside the selected range
  const inRange = useMemo(() => {
    if (!range) return allRequests
    return allRequests.filter((r) => {
      const d = statusDate(r)
      if (!d) return false
      if (range.from && d < range.from) return false
      if (range.to && d > range.to) return false
      return true
    })
  }, [allRequests, range])

  // Expense table = fulfilled requests in range
  const expenseRows = useMemo<ExpenseRow[]>(() => {
    return inRange
      .filter((r) => r.approvalStatus === 'Fulfilled')
      .map((r) => {
        const anyR = r as any
        return {
          requestId: r.requestId,
          id: r.id,
          deviceType: r.deviceType,
          brand: r.brand,
          department: r.department || '-',
          quantity: r.quantity,
          expenseWithoutVat: Number(anyR.expenseWithoutVat ?? anyR.expense_without_vat ?? 0),
          expenseWithVat: Number(anyR.expenseWithVat ?? anyR.expense_with_vat ?? 0),
        }
      })
      .sort((a, b) => b.requestId - a.requestId)
  }, [inRange])

  const totalWithoutVat = useMemo(() => expenseRows.reduce((s, r) => s + r.expenseWithoutVat, 0), [expenseRows])
  const totalWithVat = useMemo(() => expenseRows.reduce((s, r) => s + r.expenseWithVat, 0), [expenseRows])

  // Department summary in range
  const chartRows = useMemo<DepartmentRow[]>(() => {
    const names = new Set<string>()
    departments.forEach((d) => names.add(d.department_name))
    inRange.forEach((r) => { if (r.department) names.add(r.department) })
    return Array.from(names).sort().map((name) => {
      const rows = inRange.filter((r) => (r.department || '-') === name)
      return {
        department: name,
        Approved: rows.filter((r) => r.approvalStatus === 'Approved').length,
        Pending: rows.filter((r) => r.approvalStatus === 'Pending').length,
        Rejected: rows.filter((r) => r.approvalStatus === 'Rejected').length,
        Fulfilled: rows.filter((r) => r.approvalStatus === 'Fulfilled').length,
      }
    })
  }, [departments, inRange])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-on-surface">Device Request Report</h2>
            <p className="text-sm text-on-surface-variant">Device request counts and expenses by department</p>
          </div>
        </div>
        {/* Date filter at the rightmost side */}
        <ReportDateFilter onApply={(r) => setRange(r)} />
      </div>

      {isLoading ? (
        <div className="section-card flex items-center justify-center min-h-[260px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-on-surface-variant">Loading report...</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="section-card text-sm" style={{ color: 'var(--error-text)' }}>{errorMessage}</div>
      ) : (
        <>
          {/* 1) EXPENSE TABLE FIRST (top) */}
          <div className="section-card overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(98,223,125,0.12)' }}>
                <Banknote size={18} style={{ color: '#62df7d' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">Device Expense Table (Fulfilled)</h3>
                <p className="text-sm text-on-surface-variant">Expense with and without VAT for fulfilled requests in the selected range</p>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Device Name</th>
                    <th>Brand</th>
                    <th>Department</th>
                    <th>Quantity</th>
                    <th>Expense Without VAT [Rs.]</th>
                    <th>Expense With VAT (13%) [Rs.]</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">No fulfilled device expense data for the selected range</td></tr>
                  ) : (
                    expenseRows.map((row) => (
                      <tr key={row.requestId}>
                        <td className="font-medium text-on-surface">{row.deviceType}</td>
                        <td>{row.brand || '-'}</td>
                        <td>{row.department}</td>
                        <td>{row.quantity}</td>
                        <td>{row.expenseWithoutVat.toLocaleString()}</td>
                        <td>{row.expenseWithVat.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {expenseRows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                      <td colSpan={4} className="font-semibold text-on-surface text-left">Total</td>
                      <td className="font-semibold">{totalWithoutVat.toLocaleString()}</td>
                      <td className="font-semibold">{totalWithVat.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* 2) CHART */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(173,198,255,0.14)' }}>
                <FileText size={18} style={{ color: '#adc6ff' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">Department Request Chart</h3>
                <p className="text-sm text-on-surface-variant">Request counts by department for the selected range</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
                <XAxis dataKey="department" interval={0} height={50} axisLine={false} tickLine={false} tick={{ fill: '#879485', fontSize: 10 }} />
                <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
                <Bar dataKey="Approved" stackId="requests" fill="#62df7d" />
                <Bar dataKey="Pending" stackId="requests" fill="#f59e0b" />
                <Bar dataKey="Rejected" stackId="requests" fill="#ffb4ab" />
                <Bar dataKey="Fulfilled" stackId="requests" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3) DEPARTMENT TABLE */}
          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">Device Request Table</h3>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                    <th>Fulfilled</th>
                  </tr>
                </thead>
                <tbody>
                  {chartRows.map((row) => (
                    <tr key={row.department}>
                      <td className="font-medium text-on-surface">{row.department}</td>
                      <td>{cell(row.Approved)}</td>
                      <td>{cell(row.Pending)}</td>
                      <td>{cell(row.Rejected)}</td>
                      <td>{cell(row.Fulfilled)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}