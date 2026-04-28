import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileText } from 'lucide-react'
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
  getDeviceReport,
  type DeviceReport,
} from '../../api/reports'

const LOAD_REPORT_ERROR_MESSAGE = 'Unable to load reports right now.'

export default function DeviceReportDetail() {
  const navigate = useNavigate()
  const [reportRows, setReportRows] = useState<DeviceReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadReport = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await getDeviceReport()

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
        departmentCode: row.department_code,
        Approved: row.request_counts.Approved,
        Pending: row.request_counts.Pending,
        Rejected: row.request_counts.Rejected,
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
            Device Request Report
          </h2>
          <p className="text-sm text-on-surface-variant">
            Device request counts grouped by department code
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
                style={{ background: 'rgba(173,198,255,0.14)' }}
              >
                <FileText size={18} style={{ color: '#adc6ff' }} />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-on-surface">
                  Department Request Chart
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Existing request report data visualized by department
                </p>
              </div>
            </div>

            {chartRows.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No device request report data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
                  <XAxis
                    dataKey="departmentCode"
                    tick={{ fill: '#879485', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
                  <Bar dataKey="Approved" stackId="requests" fill="#62df7d" />
                  <Bar dataKey="Pending" stackId="requests" fill="#f59e0b" />
                  <Bar dataKey="Rejected" stackId="requests" fill="#ffb4ab" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="section-card overflow-hidden">
            <h3 className="font-display font-bold text-base text-on-surface mb-4">
              Device Request Table
            </h3>
            <div className="table-container">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Department Code</th>
                    <th>Approved</th>
                    <th>Pending</th>
                    <th>Rejected</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-on-surface-variant">
                        No device request report data available
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row) => (
                      <tr key={row.department_code}>
                        <td className="font-medium text-on-surface">{row.department_code}</td>
                        <td>{row.request_counts.Approved}</td>
                        <td>{row.request_counts.Pending}</td>
                        <td>{row.request_counts.Rejected}</td>
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
