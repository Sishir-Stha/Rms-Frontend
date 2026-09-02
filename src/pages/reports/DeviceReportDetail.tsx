import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, FileText } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { fetchDepartments } from '../../services/departments.service'
import {
  getDeviceReportSummary,
  getDeviceExpenses,
  type DeviceSummaryRow,
  type DeviceExpenseRow as ApiExpenseRow,
} from '../../api/reports'
import type { RepairDepartmentOption } from '../../types/repair.types'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

interface ExpenseRow {
  requestId: number
  id: string
  deviceType: string
  brand: string
  department: string
  expenseWithoutVat: number
  expenseWithVat: number
}

interface DepartmentMonthRow {
  department: string
  Approved: number
  Pending: number
  Rejected: number
  Fulfilled: number
}

const formatMonthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const cell = (n: number | string) => {
  const value = Number(n) || 0
  return value === 0 ? '-' : value
}

function DepartmentTick(props: any) {
  const { x, y, payload } = props
  const name = String(payload?.value ?? '')
  const words = name.split(' ')

  const lines: string[] = []
  let current = ''
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > 12 && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  })
  if (current) lines.push(current)

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, index) => (
        <text
          key={index}
          x={0}
          y={0}
          dy={index * 12 + 10}
          textAnchor="middle"
          fill="#879485"
          fontSize={10}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

export default function DeviceReportDetail() {
  const navigate = useNavigate()
  const [summaryData, setSummaryData] = useState<DeviceSummaryRow[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)

  // Maps API response to the exact shape your UI expects
  const mapExpensesToUI = (apiRows: ApiExpenseRow[]): ExpenseRow[] => {
    return apiRows.map((r) => ({
      requestId: r.request_id,
      id: r.id,
      deviceType: r.device_type,
      brand: r.brand,
      department: r.department_name || '-',
      expenseWithoutVat: Number(r.expense_without_vat) || 0,
      expenseWithVat: Number(r.expense_with_vat) || 0,
    }))
  }

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const [summaryRes, deptOptions] = await Promise.all([
          getDeviceReportSummary(),
          fetchDepartments().catch(() => [] as RepairDepartmentOption[]),
        ])
        
        if (!summaryRes.success) {
          throw new Error(summaryRes.message || LOAD_REPORT_ERROR_MESSAGE)
        }

        if (isMounted) {
          setSummaryData(summaryRes.data || [])
          setDepartments(Array.isArray(deptOptions) ? deptOptions : [])
        }
      } catch (error) {
        if (!isMounted) return
        setSummaryData([])
        setDepartments([])
        setErrorMessage(error instanceof Error ? error.message : LOAD_REPORT_ERROR_MESSAGE)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    void loadReport()
    return () => { isMounted = false }
  }, [])

  // Fetch expenses for the selected month
  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const res = await getDeviceExpenses(selectedMonth)
        if (res.success) {
          setExpenseRows(mapExpensesToUI(res.data || []))
        } else {
          setExpenseRows([])
        }
      } catch {
        setExpenseRows([])
      }
    }
    loadExpenses()
  }, [selectedMonth])

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>([currentMonth])
    summaryData.forEach((row) => {
      if (row.month) monthsSet.add(row.month)
    })
    
    const allKeys = Array.from(monthsSet).sort().reverse()
    if (allKeys.length === 0) return [currentMonth]
    
    const earliest = allKeys[allKeys.length - 1]
    const months: string[] = []
    let [y, m] = currentMonth.split('-').map(Number)
    const [ey, em] = earliest.split('-').map(Number)
    
    while (y > ey || (y === ey && m >= em)) {
      months.push(`${y}-${String(m).padStart(2, '0')}`)
      m -= 1
      if (m === 0) { m = 12; y -= 1 }
    }
    return months
  }, [summaryData, currentMonth])

  // Always include EVERY department from BOTH sources so none are accidentally dropped
  const chartRows = useMemo<DepartmentMonthRow[]>(() => {
    const namesFromTable = departments.map((d) => d.department_name)
    const namesFromSummary = Array.from(new Set(
      summaryData
        .filter((row) => row.month === selectedMonth)
        .map((row) => row.department_name)
    ))

    const allNamesSet = new Set<string>()
    namesFromTable.forEach((n) => allNamesSet.add(n))
    namesFromSummary.forEach((n) => {
      if (n && !Array.from(allNamesSet).some((existing) => existing.toLowerCase() === n.toLowerCase())) {
        allNamesSet.add(n)
      }
    })

    const allNames = Array.from(allNamesSet).sort()

    return allNames.map((name) => {
      const summaryRow = summaryData.find(
        (r) => r.month === selectedMonth && r.department_name.toLowerCase() === name.toLowerCase()
      )
      
      return {
        department: name,
        Approved: summaryRow?.Approved || 0,
        Pending: summaryRow?.Pending || 0,
        Rejected: summaryRow?.Rejected || 0,
        Fulfilled: summaryRow?.Fulfilled || 0,
      }
    })
  }, [departments, summaryData, selectedMonth])

  const totalWithoutVat = useMemo(() => expenseRows.reduce((sum, row) => sum + row.expenseWithoutVat, 0), [expenseRows])
  const totalWithVat = useMemo(() => expenseRows.reduce((sum, row) => sum + row.expenseWithVat, 0), [expenseRows])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/reports')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Device Request Report
          </h2>
          <p className="text-sm text-on-surface-variant">
            Monthly device request counts and expenses by department
          </p>
        </div>
      </div>

      <div className="section-card">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--muted)' }}>
            Report Month
          </span>
          {availableMonths.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedMonth === month
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {formatMonthLabel(month)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="section-card flex items-center justify-center min-h-[260px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-on-surface-variant">Loading report...</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="section-card text-sm" style={{ color: 'var(--error-text)' }}>
          {errorMessage}
        </div>
      ) : (
        <>
          <div className="section-card">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(173,198,255,0.14)' }}
              >
                <FileText size={18} style={{ color: '#adc6ff' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Department Request Chart — {formatMonthLabel(selectedMonth)}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Request report data visualized by department for the selected month
                </p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
                <XAxis
                  dataKey="department"
                  interval={0}
                  height={50}
                  tick={<DepartmentTick />}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
                <Bar dataKey="Approved" stackId="requests" fill="#62df7d" />
                <Bar dataKey="Pending" stackId="requests" fill="#f59e0b" />
                <Bar dataKey="Rejected" stackId="requests" fill="#ffb4ab" />
                <Bar dataKey="Fulfilled" stackId="requests" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">
              Device Request Table — {formatMonthLabel(selectedMonth)}
            </h3>
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

          <div className="section-card overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(98,223,125,0.12)' }}
              >
                <Banknote size={18} style={{ color: '#62df7d' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Device Expense Table (Fulfilled) — {formatMonthLabel(selectedMonth)}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Expense with and without VAT for fulfilled device requests of the selected month
                </p>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Device Name</th>
                    <th>Brand</th>
                    <th>Department</th>
                    <th>Expense Without VAT [Rs.]</th>
                    <th>Expense With VAT (13%) [Rs.]</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-on-surface-variant">
                        No fulfilled device expense data for {formatMonthLabel(selectedMonth)}
                      </td>
                    </tr>
                  ) : (
                    expenseRows.map((row) => (
                      <tr key={row.requestId}>
                        <td className="font-medium text-on-surface">{row.deviceType}</td>
                        <td>{row.brand || '-'}</td>
                        <td>{row.department}</td>
                        <td>{row.expenseWithoutVat.toLocaleString()}</td>
                        <td>{row.expenseWithVat.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {expenseRows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                      <td colSpan={3} className="font-semibold text-on-surface text-right">Total</td>
                      <td className="font-semibold">{totalWithoutVat.toLocaleString()}</td>
                      <td className="font-semibold">{totalWithVat.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}