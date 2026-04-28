import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3 } from 'lucide-react'
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
import {
  getRepairsReport,
  type MonthlyRepairReport,
} from '../../api/reports'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

export default function RepairsReportDetail() {
  const navigate = useNavigate()
  const [reportRows, setReportRows] = useState<MonthlyRepairReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getRepairsReport()

        if (!response.success) {
          throw new Error(response.message || LOAD_REPORT_ERROR_MESSAGE)
        }

        if (!Array.isArray(response.data)) {
          throw new Error(LOAD_REPORT_ERROR_MESSAGE)
        }

        if (isMounted) {
          setReportRows(response.data)
        }
      } catch (error) {
        if (!isMounted) {
          return
        }

        setReportRows([])
        setErrorMessage(
          error instanceof Error ? error.message : LOAD_REPORT_ERROR_MESSAGE,
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadReport()

    return () => {
      isMounted = false
    }
  }, [])

  const chartRows = useMemo(
    () =>
      reportRows.map((row) => ({
        month: row.month,
        Open: row.monthly_repair_summary.Open,
        InProgress: row.monthly_repair_summary.InProgress,
        Resolved: row.monthly_repair_summary.Resolved,
        Closed: row.monthly_repair_summary.Closed,
      })),
    [reportRows],
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/reports')} className="btn-ghost p-2 rounded-xl">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-on-surface">
            Monthly Repairs Report
          </h2>
          <p className="text-sm text-on-surface-variant">
            Monthly repair counts grouped by status
          </p>
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
                  Monthly Status Chart
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Existing report data visualized by month
                </p>
              </div>
            </div>

            {chartRows.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No monthly repair data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#879485', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
                  <Bar dataKey="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="InProgress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Resolved" fill="#879485" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Closed" fill="#62df7d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">
              Monthly Repairs Table
            </h3>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Open</th>
                    <th>InProgress</th>
                    <th>Resolved</th>
                    <th>Closed</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-on-surface-variant">
                        No monthly repair data available
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row) => (
                      <tr key={row.month}>
                        <td className="font-medium text-on-surface">{row.month}</td>
                        <td>{row.monthly_repair_summary.Open}</td>
                        <td>{row.monthly_repair_summary.InProgress}</td>
                        <td>{row.monthly_repair_summary.Resolved}</td>
                        <td>{row.monthly_repair_summary.Closed}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
