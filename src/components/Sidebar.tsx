import type { Dispatch, SetStateAction } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  KanbanSquare,
  LayoutDashboard,
  Monitor,
  Settings,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isAdminAllowedNavPath, isAdminDepartment } from '../utils/access-control'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: Dispatch<SetStateAction<boolean>>
}

interface NavItem {
  icon: LucideIcon
  label: string
  to: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Wrench, label: 'Repair Management', to: '/repairs' },
  { icon: KanbanSquare, label: 'Repair Kanban', to: '/repair-kanban' },
  { icon: Monitor, label: 'Device Requests', to: '/requests' },
  { icon: KanbanSquare, label: 'Request Kanban', to: '/request-kanban' },
  { icon: BarChart3, label: 'Reports', to: '/reports' },
  { icon: Settings, label: 'Settings', to: '/settings' },
]

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { currentUser } = useAuth()
  const location = useLocation()
  const visibleNavItems = isAdminDepartment(currentUser?.department)
    ? NAV_ITEMS.filter((item) => isAdminAllowedNavPath(item.to))
    : NAV_ITEMS

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0 relative z-20"
      style={{
        width: isOpen ? '228px' : '60px',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--header-border)',
        transition: 'width 0.25s ease',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '1px solid var(--header-border)', height: '56px' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'var(--primary)' }}
        >
          <Wrench size={14} color="white" strokeWidth={2.5} />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <span
              className="font-bold text-sm whitespace-nowrap tracking-tight"
              style={{ color: 'var(--sidebar-text)' }}
            >
              RepairMS
            </span>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="px-4 pt-5 pb-2">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            Main Menu
          </p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {visibleNavItems.map(({ icon: Icon, label, to }) => {
          const isActive =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)

          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-item ${isActive ? 'active' : ''} ${!isOpen ? 'justify-center px-2' : ''}`}
              title={!isOpen ? label : undefined}
            >
              <Icon size={17} className="flex-shrink-0" />
              {isOpen && <span className="whitespace-nowrap overflow-hidden">{label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {isOpen ? (
        <div className="p-3" style={{ borderTop: '1px solid var(--header-border)' }}>
          <div
            className="flex items-center gap-3 px-2 py-2 rounded-lg"
            style={{ background: 'var(--sidebar-user-bg)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            >
              {currentUser?.avatar ?? 'AU'}
            </div>
            <div className="overflow-hidden">
              <p
                className="text-xs font-semibold truncate"
                style={{ color: 'var(--sidebar-text)' }}
              >
                {currentUser?.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--primary)' }}>
                {currentUser?.department ?? 'IT'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="p-2 flex justify-center"
          style={{ borderTop: '1px solid var(--header-border)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
          >
            {currentUser?.avatar ?? 'AU'}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full flex items-center justify-center z-30 hover:scale-110"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-strong)',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 0.15s ease',
        }}
      >
        {isOpen ? (
          <ChevronLeft size={11} style={{ color: 'var(--muted)' }} />
        ) : (
          <ChevronRight size={11} style={{ color: 'var(--muted)' }} />
        )}
      </button>
    </aside>
  )
}
