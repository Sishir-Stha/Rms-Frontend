import { useEffect, type MouseEvent, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { ModalSize } from '../types/app'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: ModalSize
}

const SIZE_MAP: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-3xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.style.background = 'var(--surface-container)'
  }

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.style.background = 'transparent'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--modal-overlay)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className={`w-full ${SIZE_MAP[size]} animate-fade-in rounded-2xl shadow-ambient`}
        style={{ background: 'var(--modal-bg)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <h2
            className="font-display font-bold text-base"
            style={{ color: 'var(--on-surface)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{ color: 'var(--on-surface-variant)' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
