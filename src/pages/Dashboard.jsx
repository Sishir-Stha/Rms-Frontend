import React, { useState, useEffect } from 'react'
import { Wrench, Monitor, CheckCircle, Clock, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { DASHBOARD_METRICS, MONTHLY_REPAIRS, DEVICE_CATEGORY_DATA, REPAIRS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import { useTheme } from '../context/ThemeContext'

function StatCard({ icon: Icon, label, value, trend, color, sub }) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const end = parseInt(value)
    const step = end / (900 / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setCount(end); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  const isPos = trend > 0
  return (
    <div className="section-card card-3d relative overflow-hidden cursor-default">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{ background: color, filter: 'blur(30px)', transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1a` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: isPos ? 'var(--primary)' : 'var(--error)' }}>
          {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="font-display font-extrabold text-3xl mb-1"
        style={{ color: 'var(--on-surface)', textShadow: `0 0 40px ${color}30` }}>
        {count.toLocaleString()}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>{sub}</p>}
    </div>
  )
}

const CARDS = [
  { icon: Wrench,       label: 'Total Repairs',    value: DASHBOARD_METRICS.totalRepairs,   trend: DASHBOARD_METRICS.totalRepairsTrend, color: '#3b82f6', sub: 'This fiscal year' },
  { icon: Clock,        label: 'Pending Repairs',   value: DASHBOARD_METRICS.pendingRepairs, trend: DASHBOARD_METRICS.pendingTrend,       color: '#f59e0b', sub: 'Awaiting assignment' },
  { icon: Monitor,      label: 'Device Requests',   value: DASHBOARD_METRICS.deviceRequests, trend: DASHBOARD_METRICS.requestsTrend,      color: '#16a34a', sub: 'Active this month' },
  { icon: CheckCircle,  label: 'Resolved Today',    value: DASHBOARD_METRICS.resolvedToday,  trend: DASHBOARD_METRICS.resolvedTrend,      color: '#8b5cf6', sub: 'As of now' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px var(--shadow)' }}>
      <p className="text-xs mb-1" style={{ color: 'var(--on-surface-variant)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: '0 8px 30px var(--shadow)' }}>
      <p className="text-sm font-semibold" style={{ color: payload[0].payload.fill }}>{payload[0].name}: {payload[0].value}%</p>
    </div>
  )
}

const recentActivity = REPAIRS.slice(0, 8)

export default function Dashboard() {
  const { isDark } = useTheme()
  // Chart grid / axis color adapts to theme
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const axisColor = isDark ? '#879485' : '#94a3b8'

  return (
    <div className="p-6 space-y-6 relative overflow-hidden">
      {/* Subtle background orbs — very faint */}
      <div className="orb w-96 h-96 -top-32 -right-32 animate-float-slow pointer-events-none" style={{ background: '#16a34a' }} />
      <div className="orb w-64 h-64 bottom-0 left-1/3 animate-float pointer-events-none" style={{ background: '#3b82f6', animationDelay: '1s' }} />

      {/* Welcome banner — uses CSS vars, no hardcoded dark hex */}
      <div className="section-card relative overflow-hidden"
        style={{ borderLeft: '4px solid var(--primary)', background: 'var(--welcome-bg)' }}>
        <div className="absolute right-0 top-0 bottom-0 w-32 flex items-center justify-center" style={{ opacity: 0.07 }}>
          <Wrench size={80} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="flex items-center justify-between relative">
          <div>
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>Welcome back, Admin! 👋</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Here's your system overview for today, March 22, 2026
            </p>
          </div>
          <div className="badge badge-success hidden md:flex items-center gap-1.5">
            <Activity size={12} /> System Operational
          </div>
        </div>
      </div>

      {/* 3D Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" style={{ perspective: '1000px' }}>
        {CARDS.map(card => <StatCard key={card.label} {...card} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Area chart */}
        <div className="lg:col-span-2 section-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-base" style={{ color: 'var(--on-surface)' }}>Monthly Repairs Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Last 12 months performance</p>
            </div>
            <span className="badge badge-success text-xs">↑ 8.3% YoY</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_REPAIRS} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gRepair" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gComplete" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="repairs" stroke="#16a34a" strokeWidth={2.5} fill="url(#gRepair)" name="Total Repairs" dot={false} activeDot={{ r: 5, fill: '#16a34a' }} />
              <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fill="url(#gComplete)" name="Completed" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="section-card">
          <div className="mb-5">
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--on-surface)' }}>Device Categories</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Distribution by type</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={DEVICE_CATEGORY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                paddingAngle={3} dataKey="value" stroke="none">
                {DEVICE_CATEGORY_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {DEVICE_CATEGORY_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                  <span style={{ color: 'var(--on-surface-variant)' }}>{d.name}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--on-surface)' }}>Recent Activity</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Latest repair requests and updates</p>
          </div>
          <a href="/repairs" className="text-xs font-semibold transition-colors" style={{ color: 'var(--secondary)' }}>View All →</a>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Device</th><th>Issue</th><th>Status</th>
                <th>Priority</th><th>Reported</th><th>Technician</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map(r => (
                <tr key={r.id}>
                  <td><code className="text-xs" style={{ color: 'var(--secondary)' }}>{r.id}</code></td>
                  <td>
                    <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{r.device}</p>
                    <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{r.deviceCategory}</p>
                  </td>
                  <td><p className="text-xs max-w-[180px] truncate" style={{ color: 'var(--on-surface-variant)' }}>{r.issue}</p></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><StatusBadge status={r.priority} /></td>
                  <td className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{r.reportedDate}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                        style={{ background: 'rgba(22,163,74,0.15)', color: 'var(--primary)' }}>
                        {r.technician.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{r.technician.split(' ')[0]}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
