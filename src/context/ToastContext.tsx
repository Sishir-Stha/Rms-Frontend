import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ToastMessage, ToastType } from '../types/app'

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

interface ToastProviderProps {
  children: ReactNode
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: number) => void
}

interface ToastItemProps {
  toast: ToastMessage
  onRemove: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const TOAST_STYLES: Record<
  ToastType,
  { bg: string; icon: string; iconColor: string; textColor: string }
> = {
  success: {
    bg: 'bg-surface-container-highest border-primary/30',
    icon: '✓',
    iconColor: 'text-primary',
    textColor: 'text-on-surface',
  },
  error: {
    bg: 'bg-surface-container-highest border-error/30',
    icon: '✕',
    iconColor: 'text-error',
    textColor: 'text-on-surface',
  },
  info: {
    bg: 'bg-surface-container-highest border-secondary/30',
    icon: 'i',
    iconColor: 'text-secondary',
    textColor: 'text-on-surface',
  },
  warning: {
    bg: 'bg-surface-container-highest border-warning/30',
    icon: '!',
    iconColor: 'text-warning',
    textColor: 'text-on-surface',
  },
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = Date.now()

      setToasts((previousToasts) => [...previousToasts, { id, message, type }])

      window.setTimeout(() => {
        setToasts((previousToasts) =>
          previousToasts.filter((toast) => toast.id !== id),
        )
      }, duration)
    },
    [],
  )

  const removeToast = useCallback((id: number) => {
    setToasts((previousToasts) =>
      previousToasts.filter((toast) => toast.id !== id),
    )
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (!toasts.length) {
    return null
  }

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const style = TOAST_STYLES[toast.type]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-ambient animate-fade-in min-w-64 max-w-sm ${style.bg}`}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <span className={`text-lg font-bold ${style.iconColor}`}>{style.icon}</span>
      <span className={`text-sm flex-1 ${style.textColor}`}>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-on-surface-variant hover:text-on-surface text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
