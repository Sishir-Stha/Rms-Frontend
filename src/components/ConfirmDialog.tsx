import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  danger?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  danger = false,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-ambient animate-fade-in"
        style={{
          background: 'var(--modal-bg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: danger
                  ? 'rgba(220,38,38,0.12)'
                  : 'rgba(173,198,255,0.1)',
              }}
            >
              <AlertTriangle
                size={20}
                style={{
                  color: danger ? 'var(--error)' : 'var(--secondary)',
                }}
              />
            </div>
            <div className="flex-1">
              <h3
                className="font-display font-bold text-base"
                style={{ color: 'var(--on-surface)' }}
              >
                {title}
              </h3>
              <p
                className="text-sm mt-1"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {message}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-xl">
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className={danger ? 'btn-danger' : 'btn-primary'}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
