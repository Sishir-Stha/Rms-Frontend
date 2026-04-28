import { BarChart3, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface ReportCard {
  id: 'repairs' | 'device'
  title: string
  description: string
  route: string
  color: string
  Icon: typeof BarChart3
}

const REPORT_CARDS: ReportCard[] = [
  {
    id: 'repairs',
    title: 'Monthly Repairs Report',
    description: 'Review monthly repair counts grouped by status from the repairs report API.',
    route: '/reports/repairs',
    color: '#62df7d',
    Icon: BarChart3,
  },
  {
    id: 'device',
    title: 'Device Request Report',
    description: 'Review approved, pending, and rejected request totals by department code.',
    route: '/reports/device',
    color: '#adc6ff',
    Icon: FileText,
  },
]

export default function Reports() {
  const navigate = useNavigate()

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Reports</h2>
        <p className="text-sm text-on-surface-variant">
          Choose a report to open its detailed analytics view
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_CARDS.map(({ id, title, description, route, color, Icon }) => (
          <button
            key={id}
            onClick={() => navigate(route)}
            className="section-card card-3d text-left group hover:border-opacity-40 transition-all duration-300"
            style={{ borderTop: `3px solid ${color}` }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-on-surface group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="text-xs font-semibold flex items-center gap-1" style={{ color }}>
                View Report {'->'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
