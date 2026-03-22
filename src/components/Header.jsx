import React, { useState } from 'react'
import { Bell, Search, LogOut, Menu, Sun, Moon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/repairs': 'Repair Management',
  '/repair-kanban': 'Repair Kanban',
  '/requests': 'Device Requests',
  '/request-kanban': 'Request Kanban',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

const NOTIFICATIONS = [
  { id: 1, text: 'REP-006 marked as Critical', time: '5m ago', dot: 'var(--error-text)' },
  { id: 2, text: 'REQ-015 approved by Admin', time: '1h ago', dot: 'var(--success)' },
  { id: 3, text: 'Network switch under review', time: '2h ago', dot: 'var(--warning)' },
]

export default function Header({ onMenuClick }) {
  const { currentUser, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const [showNotif, setShowNotif] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const [search, setSearch] = useState('')

  const title = PAGE_TITLES[location.pathname] || 'RepairMS'

  return (
    <header
      className="flex items-center gap-3 px-5 py-0 flex-shrink-0"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--header-border)',
        height: '56px',
      }}
    >
      {/* Menu toggle */}
      <button id="menu-toggle-btn" onClick={onMenuClick} className="btn-ghost p-1.5 rounded-lg flex-shrink-0">
        <Menu size={18} />
      </button>

      {/* Page title */}
      <h1 className="font-bold text-base hidden md:block flex-shrink-0"
        style={{ color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
        {title}
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-xs ml-2">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }} />
          <input
            id="global-search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="input-field pl-8 py-1.5 text-sm w-full"
          />
        </div>
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        id="theme-toggle-btn"
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{
          background: isDark ? 'rgba(129,140,248,0.08)' : 'rgba(79,70,229,0.06)',
          color: isDark ? 'var(--primary)' : 'var(--primary)',
          border: '1px solid var(--border-strong)',
        }}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
        <span className="hidden sm:block">{isDark ? 'Light' : 'Dark'}</span>
      </button>

      {/* Bell */}
      <div className="relative">
        <button
          id="notifications-btn"
          onClick={() => { setShowNotif(!showNotif); setShowUser(false) }}
          className="btn-ghost p-2 rounded-lg relative"
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--error-text)' }} />
        </button>
        {showNotif && (
          <div className="absolute right-0 top-11 w-72 section-card z-50 animate-fade-in"
            style={{ padding: '16px', boxShadow: 'var(--shadow-lg)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--muted)' }}>Notifications</p>
            <div className="space-y-3">
              {NOTIFICATIONS.map(n => (
                <div key={n.id} className="flex gap-3 items-start">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: n.dot }} />
                  <div>
                    <p className="text-sm" style={{ color: 'var(--on-surface)' }}>{n.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          id="user-menu-btn"
          onClick={() => { setShowUser(!showUser); setShowNotif(false) }}
          className="flex items-center gap-2 btn-ghost p-1.5 rounded-lg"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}>
            {currentUser?.avatar || 'AU'}
          </div>
          <span className="text-sm font-medium hidden lg:block" style={{ color: 'var(--on-surface)' }}>
            {currentUser?.name}
          </span>
        </button>
        {showUser && (
          <div className="absolute right-0 top-11 w-52 section-card z-50 animate-fade-in"
            style={{ padding: '12px', boxShadow: 'var(--shadow-lg)' }}>
            <div className="pb-3 mb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{currentUser?.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{currentUser?.email}</p>
              <span className="badge badge-info mt-2">Administrator</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 w-full text-sm btn-ghost rounded-lg py-1.5"
              style={{ color: 'var(--error-text)', justifyContent: 'flex-start' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
