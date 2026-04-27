import { useEffect, useState } from 'react'
import {
  CheckCircle,
  Clock,
  Monitor,
  RefreshCw,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardMetrics } from '../services/dashboard.service'
import type { DashboardMetrics } from '../types/dashboard.types'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: number
  color: string
  description: string
}

interface DashboardCardConfig {
  key: keyof DashboardMetrics
  label: string
  icon: LucideIcon
  color: string
  description: string
}

const DASHBOARD_CARDS: DashboardCardConfig[] = [
  {
    key: 'totalRepairs',
    label: 'Total Repairs',
    icon: Wrench,
    color: '#3b82f6',
    description: 'All repair tickets currently tracked.',
  },
  {
    key: 'pendingRepairs',
    label: 'Pending Repairs',
    icon: Clock,
    color: '#f59e0b',
    description: 'Repair tickets waiting for completion.',
  },
  {
    key: 'deviceRequests',
    label: 'Device Requests',
    icon: Monitor,
    color: '#16a34a',
    description: 'Active device request submissions.',
  },
  {
    key: 'resolvedToday',
    label: 'Resolved Today',
    icon: CheckCircle,
    color: '#8b5cf6',
    description: 'Repairs closed during the current day.',
  },
]

function StatCard({ icon: Icon, label, value, color, description }: StatCardProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let currentValue = 0
    const endValue = value

    if (endValue === 0) {
      setCount(0)
      return
    }

    const step = endValue / (900 / 16)

    const timer = window.setInterval(() => {
      currentValue += step

      if (currentValue >= endValue) {
        setCount(endValue)
        window.clearInterval(timer)
      } else {
        setCount(Math.floor(currentValue))
      }
    }, 16)

    return () => {
      window.clearInterval(timer)
    }
  }, [value])

  return (
    <div className="section-card card-3d relative overflow-hidden cursor-default">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5"
        style={{
          background: color,
          filter: 'blur(30px)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1a` }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p
        className="font-display font-extrabold text-3xl mb-1"
        style={{ color: 'var(--on-surface)', textShadow: `0 0 40px ${color}30` }}
      >
        {count.toLocaleString()}
      </p>
      <p className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>
        {label}
      </p>
      <p className="text-xs mt-1" style={{ color: 'var(--on-surface-variant)' }}>
        {description}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const abortController = new AbortController()

    const loadDashboardMetrics = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetchDashboardMetrics(abortController.signal)

        if (!abortController.signal.aborted) {
          setMetrics(response)
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load dashboard metrics.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboardMetrics()

    return () => {
      abortController.abort()
    }
  }, [refreshKey])

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="p-6 space-y-6 relative overflow-hidden">
      <div
        className="orb w-96 h-96 -top-32 -right-32 animate-float-slow pointer-events-none"
        style={{ background: '#16a34a' }}
      />
      <div
        className="orb w-64 h-64 bottom-0 left-1/3 animate-float pointer-events-none"
        style={{ background: '#3b82f6', animationDelay: '1s' }}
      />

      <div
        className="section-card relative overflow-hidden"
        style={{ borderLeft: '4px solid var(--primary)', background: 'var(--welcome-bg)' }}
      >
        <div
          className="absolute right-0 top-0 bottom-0 w-32 flex items-center justify-center"
          style={{ opacity: 0.07 }}
        >
          <Wrench size={80} style={{ color: 'var(--primary)' }} />
        </div>
        <div className="flex items-center justify-between gap-4 relative flex-wrap">
          <div>
            <h2
              className="font-display font-bold text-xl"
              style={{ color: 'var(--on-surface)' }}
            >
              Welcome back, {currentUser?.name ?? 'there'}!
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--on-surface-variant)' }}>
              Live dashboard metrics for {todayLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
            className="btn-secondary flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="section-card flex items-center justify-center min-h-[220px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>
              Loading dashboard metrics...
            </p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="section-card flex flex-col items-center justify-center min-h-[220px] text-center">
          <p className="text-base font-semibold" style={{ color: 'var(--error)' }}>
            Unable to load dashboard data
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--on-surface-variant)' }}>
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      ) : metrics ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
          style={{ perspective: '1000px' }}
        >
          {DASHBOARD_CARDS.map((card) => (
            <StatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={metrics[card.key]}
              color={card.color}
              description={card.description}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
