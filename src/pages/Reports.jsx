import React, { useState } from 'react'
import { BarChart3, FileText, Users, ArrowLeft, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import {
  MONTHLY_REPAIRS, DEPARTMENT_REQUESTS_DATA, TECHNICIAN_PERFORMANCE,
  DEVICE_CATEGORY_DATA, REPAIRS, DEVICE_REQUESTS
} from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'

const REPORT_LIST = [
  {
    id: 'monthly-repair',
    title: 'Monthly Repair Summary',
    description: 'Monthly repair counts, completion rates, and trends over the past 12 months.',
    icon: BarChart3,
    color: '#62df7d',
    lastGenerated: 'Mar 22, 2026',
    records: MONTHLY_REPAIRS.length,
  },
  {
    id: 'device-request',
    title: 'Device Request Analysis',
    description: 'Department-wise device requests with approval, rejection, and pending breakdown.',
    icon: FileText,
    color: '#adc6ff',
    lastGenerated: 'Mar 22, 2026',
    records: DEPARTMENT_REQUESTS_DATA.length,
  },
  {
    id: 'technician-performance',
    title: 'Technician Performance',
    description: 'Individual technician metrics: resolved tickets, average days, and ratings.',
    icon: Users,
    color: '#f59e0b',
    lastGenerated: 'Mar 21, 2026',
    records: TECHNICIAN_PERFORMANCE.length,
  },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-ambient" style={{ background: '#2d3449', border: '1px solid rgba(62,74,61,0.3)' }}>
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
}

// ── Report Detail Components ──────────────────────────────────────────────────
function MonthlyRepairReport() {
  const [page, setPage] = useState(1)
  const PS = 6
  const total = Math.max(1, Math.ceil(MONTHLY_REPAIRS.length / PS))
  const paged = MONTHLY_REPAIRS.slice((page-1)*PS, page*PS)
  return (
    <div className="space-y-6">
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Repairs vs Completed — 12 Months</h4>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={MONTHLY_REPAIRS}>
            <defs>
              <linearGradient id="rg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#62df7d" stopOpacity={0.3}/><stop offset="95%" stopColor="#62df7d" stopOpacity={0}/></linearGradient>
              <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#adc6ff" stopOpacity={0.2}/><stop offset="95%" stopColor="#adc6ff" stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
            <XAxis dataKey="month" tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
            <Area type="monotone" dataKey="repairs" name="Total Repairs" stroke="#62df7d" fill="url(#rg1)" strokeWidth={2.5} dot={false} />
            <Area type="monotone" dataKey="completed" name="Completed" stroke="#adc6ff" fill="url(#rg2)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fill="none" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Monthly Data Table</h4>
        <table className="data-table w-full">
          <thead><tr><th>Month</th><th>Total Repairs</th><th>Completed</th><th>Pending</th><th>Completion Rate</th></tr></thead>
          <tbody>
            {paged.map(m => (
              <tr key={m.month}>
                <td className="font-medium text-on-surface">{m.month}</td>
                <td className="text-on-surface">{m.repairs}</td>
                <td><span className="text-primary font-semibold">{m.completed}</span></td>
                <td><span className="text-warning font-semibold">{m.pending}</span></td>
                <td><span className="text-on-surface">{Math.round((m.completed/m.repairs)*100)}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-outline-variant/15">
          <p className="text-xs text-on-surface-variant">{paged.length} of {MONTHLY_REPAIRS.length} rows</p>
          <div className="flex gap-1">
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="w-7 h-7 btn-ghost rounded-lg disabled:opacity-30"><ChevronLeft size={14}/></button>
            <span className="text-xs px-2 text-on-surface">{page}/{total}</span>
            <button disabled={page===total} onClick={()=>setPage(p=>p+1)} className="w-7 h-7 btn-ghost rounded-lg disabled:opacity-30"><ChevronRight size={14}/></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeviceRequestReport() {
  return (
    <div className="space-y-6">
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Department-wise Device Requests</h4>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={DEPARTMENT_REQUESTS_DATA} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" />
            <XAxis dataKey="dept" tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#879485' }} />
            <Bar dataKey="approved" name="Approved" fill="#62df7d" radius={[4,4,0,0]} />
            <Bar dataKey="rejected" name="Rejected" fill="#ffb4ab" radius={[4,4,0,0]} />
            <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Request Analysis Table</h4>
        <table className="data-table w-full">
          <thead><tr><th>Department</th><th>Total</th><th>Approved</th><th>Rejected</th><th>Pending</th><th>Approval Rate</th></tr></thead>
          <tbody>
            {DEPARTMENT_REQUESTS_DATA.map(d => (
              <tr key={d.dept}>
                <td className="font-medium text-on-surface">{d.dept}</td>
                <td>{d.requests}</td>
                <td className="text-primary font-semibold">{d.approved}</td>
                <td className="text-error font-semibold">{d.rejected}</td>
                <td className="text-warning font-semibold">{d.pending}</td>
                <td>{Math.round((d.approved/d.requests)*100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TechnicianReport() {
  return (
    <div className="space-y-6">
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Resolved Tickets per Technician</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={TECHNICIAN_PERFORMANCE} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(62,74,61,0.15)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#879485', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="resolved" name="Resolved" fill="#62df7d" radius={[0,4,4,0]} />
            <Bar dataKey="inProgress" name="In Progress" fill="#adc6ff" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="section-card">
        <h4 className="font-semibold text-sm text-on-surface mb-4">Performance Metrics Table</h4>
        <table className="data-table w-full">
          <thead><tr><th>Technician</th><th>Resolved</th><th>In Progress</th><th>Avg Days</th><th>Rating</th></tr></thead>
          <tbody>
            {TECHNICIAN_PERFORMANCE.map(t => (
              <tr key={t.name}>
                <td className="font-medium text-on-surface">{t.name}</td>
                <td className="text-primary font-semibold">{t.resolved}</td>
                <td className="text-secondary">{t.inProgress}</td>
                <td className="text-on-surface">{t.avgDays} days</td>
                <td>
                  <div className="flex items-center gap-1">
                    <span className="text-warning">★</span>
                    <span className="font-semibold text-on-surface">{t.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const REPORT_COMPONENTS = {
  'monthly-repair': MonthlyRepairReport,
  'device-request': DeviceRequestReport,
  'technician-performance': TechnicianReport,
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Reports() {
  const [selected, setSelected] = useState(null)

  if (selected) {
    const report = REPORT_LIST.find(r => r.id === selected)
    const ReportComponent = REPORT_COMPONENTS[selected]
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-xl text-on-surface">{report.title}</h2>
            <p className="text-sm text-on-surface-variant">{report.description}</p>
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={14} /> Export PDF
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download size={14} /> Export Excel
          </button>
        </div>
        <ReportComponent />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Reports</h2>
        <p className="text-sm text-on-surface-variant">Select a report to view detailed analytics and data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_LIST.map(report => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              id={`report-${report.id}`}
              onClick={() => setSelected(report.id)}
              className="section-card card-3d text-left group hover:border-opacity-40 transition-all duration-300"
              style={{ borderTop: `3px solid ${report.color}` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${report.color}18` }}>
                  <Icon size={22} style={{ color: report.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base text-on-surface group-hover:text-primary transition-colors">{report.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{report.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-xs text-on-surface-variant">Last generated: {report.lastGenerated}</span>
                    <span className="text-xs font-semibold" style={{ color: report.color }}>{report.records} records</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-xs font-semibold flex items-center gap-1" style={{ color: report.color }}>
                  View Report →
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
