import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Banknote, Wrench } from 'lucide-react'
import {
  Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { fetchRepairs } from '../../services/repair.service'
import { fetchDepartments } from '../../services/departments.service'
import ReportDateFilter, { type ReportDateRange } from '../../components/ReportDateFilter'
import type { RepairDepartmentOption } from '../../types/repair.types'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

interface CostRow {
  repairId: number
  id: string
  device: string
  department: string
  status: string
  resolvedDate: string
  cost: number
}

interface DepartmentRow {
  department: string
  Open: number
  InProgress: number
  Resolved: number
  Closed: number
}

const onlyDate = (v: any): string => {
  if (!v) return ''
  const s = String(v).trim()
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  return m ? m[1] : s.slice(0, 10)
}

const repairDate = (r: any): string => {
  if (r.status === 'Resolved' || r.status === 'Closed') {
    return onlyDate(r.resolvedDate ?? r.resolved_date) || onlyDate(r.reportedDate ?? r.reported_date)
  }
  return onlyDate(r.reportedDate ?? r.reported_date)
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

export default function RepairsReportDetail() {
  const navigate = useNavigate()
  const [allRepairs, setAllRepairs] = useState<any[]>([])
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
        const [rows, deptOptions] = await Promise.all([
          fetchRepairs({ status: '', device_name: '' }),
          fetchDepartments().catch(() => [] as RepairDepartmentOption[]),
        ])
        if (!isMounted) return
        setAllRepairs(rows || [])
        setDepartments(Array.isArray(deptOptions) ? deptOptions : [])
      } catch (error) {
        if (!isMounted) return
        setAllRepairs([])
        setDepartments([])
        setErrorMessage(error instanceof Error ? error.message : LOAD_REPORT_ERROR_MESSAGE)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    void load()
    return () => { isMounted = false }
  }, [])

  const inRange = useMemo(() => {
    if (!range) return allRepairs
    return allRepairs.filter((r) => {
      const d = repairDate(r)
      if (!d) return false
      if (range.from && d < range.from) return false
      if (range.to && d > range.to) return false
      return true
    })
  }, [allRepairs, range])

  const costRows = useMemo<CostRow[]>(() => {
    return inRange
      .filter((r) => r.status === 'Resolved' || r.status === 'Closed')
      .map((r) => ({
        repairId: r.repairId ?? r.repair_id,
        id: r.id ?? `R-${r.repairId ?? r.repair_id}`,
        device: r.device ?? r.device_name ?? '-',
        department: r.department ?? r.department_name ?? '-',
        status: r.status,
        resolvedDate: onlyDate(r.resolvedDate ?? r.resolved_date),
        cost: Number(r.cost ?? r.costs ?? 0),
      }))
      .sort((a, b) => b.repairId - a.repairId)
  }, [inRange])

  const totalCost = useMemo(() => costRows.reduce((s, r) => s + r.cost, 0), [costRows])

  // CHART ROWS: ALWAYS include EVERY department (even with zero data)
  const chartRows = useMemo<DepartmentRow[]>(() => {
    const names = new Set<string>()
    departments.forEach((d) => names.add(d.department_name))
    inRange.forEach((r) => names.add(r.department ?? r.department_name ?? '-'))
    return Array.from(names).sort().map((name) => {
      const rows = inRange.filter((r) => (r.department ?? r.department_name ?? '-') === name)
      return {
        department: name,
        Open: rows.filter((r) => r.status === 'Open').length,
        InProgress: rows.filter((r) => r.status === 'In Progress' || r.status === 'InProgress').length,
        Resolved: rows.filter((r) => r.status === 'Resolved').length,
        Closed: rows.filter((r) => r.status === 'Closed').length,
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
            <h2 className="font-display font-bold text-xl text-on-surface">Monthly Repairs Report</h2>
            <p className="text-sm text-on-surface-variant">Repair counts and costs by department</p>
          </div>
        </div>
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
          {/* 1) COST TABLE FIRST (top) */}
          <div className="section-card overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(98,223,125,0.12)' }}>
                <Banknote size={18} style={{ color: '#62df7d' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">Repair Cost Table (Resolved / Closed)</h3>
                <p className="text-sm text-on-surface-variant">Costs of resolved repairs in the selected range</p>
              </div>
            </div>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Repair ID</th>
                    <th>Device</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Resolved Date</th>
                    <th>Cost [Rs.]</th>
                  </tr>
                </thead>
                <tbody>
                  {costRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">No resolved repair cost data for the selected range</td></tr>
                  ) : (
                    costRows.map((row) => (
                      <tr key={row.repairId}>
                        <td className="font-medium text-on-surface">{row.id}</td>
                        <td>{row.device}</td>
                        <td>{row.department}</td>
                        <td>{row.status}</td>
                        <td>{row.resolvedDate || '-'}</td>
                        <td>{row.cost.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {costRows.length > 0 && (
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--border-color)' }}>
                      <td colSpan={5} className="font-semibold text-on-surface text-left">Total</td>
                      <td className="font-semibold">{totalCost.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* 2) CHART (all departments always visible) */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(173,198,255,0.14)' }}>
                <Wrench size={18} style={{ color: '#adc6ff' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">Department Repairs Chart</h3>
                <p className="text-sm text-on-surface-variant">Repair counts by department for the selected range</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
                <XAxis dataKey="department" interval={0} height={70} axisLine={false} tickLine={false} tick={<DepartmentTick />} />
                <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
                <Bar dataKey="Open" stackId="repairs" fill="#879485" />
                <Bar dataKey="InProgress" stackId="repairs" fill="#3b82f6" />
                <Bar dataKey="Resolved" stackId="repairs" fill="#f59e0b" />
                <Bar dataKey="Closed" stackId="repairs" fill="#16a34a" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3) DEPARTMENT TABLE */}
          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">Department Repairs Table</h3>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Open</th>
                    <th>In Progress</th>
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
        </>
      )}
    </div>
  )
}