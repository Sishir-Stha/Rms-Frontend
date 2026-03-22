import React, { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const styles = {
    success: { bg: 'bg-surface-container-highest border-primary/30', icon: '✓', iconColor: 'text-primary', textColor: 'text-on-surface' },
    error: { bg: 'bg-surface-container-highest border-error/30', icon: '✕', iconColor: 'text-error', textColor: 'text-on-surface' },
    info: { bg: 'bg-surface-container-highest border-secondary/30', icon: 'ℹ', iconColor: 'text-secondary', textColor: 'text-on-surface' },
    warning: { bg: 'bg-surface-container-highest border-warning/30', icon: '⚠', iconColor: 'text-warning', textColor: 'text-on-surface' },
  }
  const s = styles[toast.type] || styles.info
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-ambient animate-fade-in min-w-64 max-w-sm ${s.bg}`}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <span className={`text-lg font-bold ${s.iconColor}`}>{s.icon}</span>
      <span className={`text-sm flex-1 ${s.textColor}`}>{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-on-surface-variant hover:text-on-surface text-lg leading-none">×</button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
