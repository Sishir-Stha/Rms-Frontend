import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, BarChart3 } from 'lucide-react'
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
  getRepairsDepartmentSummary,
  getRepairCosts,
  type RepairDepartmentSummaryRow,
  type RepairCostRow as ApiRepairCostRow,
} from '../../api/reports'
import type { RepairDepartmentOption } from '../../types/repair.types'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

interface RepairCostRow {
  repairId: number
  id: string
  device: string
  department: string
  cost: number
}

interface DepartmentMonthRow {
  department: string
  Open: number
  InProgress: number
  Resolved: number
  Closed: number
}

const formatMonthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number)
  if (!y || !m) return key
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

const cell = (n: number) => (n === 0 ? '-' : n)

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

export default function RepairsReportDetail() {
  const navigate = useNavigate()
  const [summaryData, setSummaryData] = useState<RepairDepartmentSummaryRow[]>([])
  const [departments, setDepartments] = useState<RepairDepartmentOption[]>([])
  const [repairCostRows, setRepairCostRows] = useState<RepairCostRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)

  const mapCostsToUI = (apiRows: ApiRepairCostRow[]): RepairCostRow[] => {
    return apiRows.map((r) => ({
      repairId: r.repair_id,
      id: `REP-${String(r.repair_id).padStart(3, '0')}`,
      device: r.device_name,
      department: r.department_name,
      cost: Number(r.cost) || 0,
    }))
  }

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setIsLoading(true)
      setErrorMessage(null)
      try {
        const [summaryRes, deptOptions] = await Promise.all([
          getRepairsDepartmentSummary(),
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

  // Fetch costs for the selected month
  useEffect(() => {
    const loadCosts = async () => {
      try {
        const res = await getRepairCosts(selectedMonth)
        if (res.success) {
          setRepairCostRows(mapCostsToUI(res.data || []))
        } else {
          setRepairCostRows([])
        }
      } catch {
        setRepairCostRows([])
      }
    }
    loadCosts()
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

  // Always include EVERY department so none are dropped
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
        Open: Number(summaryRow?.Open) || 0,
        InProgress: Number(summaryRow?.InProgress) || 0,
        Resolved: Number(summaryRow?.Resolved) || 0,
        Closed: Number(summaryRow?.Closed) || 0,
      }
    })
  }, [departments, summaryData, selectedMonth])

  const totalCost = useMemo(
    () => repairCostRows.reduce((sum, row) => sum + row.cost, 0),
    [repairCostRows],
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/reports')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Repairs Report
          </h2>
          <p className="text-sm text-on-surface-variant">
            Repair counts and costs by department
          </p>
        </div>
      </div>

      {/* Month selector at top, same as Device Request Report */}
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
                style={{ background: 'rgba(98,223,125,0.12)' }}
              >
                <BarChart3 size={18} style={{ color: '#62df7d' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Department Status Chart — {formatMonthLabel(selectedMonth)}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Repair report data visualized by department for the selected month
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
                <Bar dataKey="Open" stackId="repairs" fill="#f59e0b" />
                <Bar dataKey="InProgress" stackId="repairs" fill="#3b82f6" />
                <Bar dataKey="Resolved" stackId="repairs" fill="#879485" />
                <Bar dataKey="Closed" stackId="repairs" fill="#62df7d" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">
              Department Repairs Table — {formatMonthLabel(selectedMonth)}
            </h3>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Open</th>
                    <th>InProgress</th>
                    <th>Resolved</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {chartRows.map((row) => (
                    <tr key={row.department}>
                      <td className="font-medium text-on-surface">{row.department}</td>
                      <td>{cell(row.Open)}</td>
                      <td>{cell(row.InProgress)}</td>
                      <td>{cell(row.Resolved)}</td>
                      <td>{cell(row.Closed)}</td>
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
                  Repair Cost Table (Resolved / Closed) — {formatMonthLabel(selectedMonth)}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Repair costs for resolved and closed repairs of the selected month
                </p>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Repair ID</th>
                    <th>Device Name</th>
                    <th>Department</th>
                    <th>Cost [Rs.]</th>
                  </tr>
                </thead>
                <tbody>
                  {repairCostRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-on-surface-variant">
                        No resolved or closed repair data for {formatMonthLabel(selectedMonth)}
                      </td>
                    </tr>
                  ) : (
                    repairCostRows.map((row) => (
                      <tr key={row.repairId}>
                        <td className="font-medium" style={{ color: 'var(--secondary)' }}>
                          <code>{row.id}</code>
                        </td>
                        <td className="font-medium text-on-surface">{row.device}</td>
                        <td>{row.department}</td>
                        <td>{row.cost.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {repairCostRows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                      <td colSpan={3} className="font-semibold text-on-surface">Total</td>
                      <td className="font-semibold">{totalCost.toLocaleString()}</td>
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