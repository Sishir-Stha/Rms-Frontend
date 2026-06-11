import { useEffect, useState, type DragEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  approveDeviceRequestById,
  fetchDeviceRequests,
  moveDeviceRequestCard,
  subscribeToDeviceRequestsChanged,
} from '../services/device-request.service'
import type { RequestApprovalStatus } from '../types/app'
import type { DeviceRequestListItem } from '../types/device-request.types'
import { formatDeviceRequestStatus } from '../utils/device-request-status'
import { canUpdateRequestKanbanStatus } from '../utils/access-control'

interface KanbanColumn {
  id: RequestApprovalStatus
  label: string
  color: string
}

interface ConfirmState {
  requestId: number
  col: Extract<RequestApprovalStatus, 'Rejected'>
}

const COLUMNS: KanbanColumn[] = [
  { id: 'Requested', label: 'Requested', color: '#bac5ee' },
  { id: 'Pending', label: 'Recommended', color: '#f59e0b' },
  { id: 'Approved', label: 'Approved', color: '#16a34a' },
  { id: 'Rejected', label: 'Rejected', color: '#dc2626' },
]

export default function DeviceRequestKanban() {
  const { currentUser } = useAuth()
  const canManageKanban = canUpdateRequestKanbanStatus(
  currentUser?.email,
)
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cards, setCards] = useState<DeviceRequestListItem[]>([])
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<RequestApprovalStatus | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadBoard = async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const requestCards = await fetchDeviceRequests(
        { approvalStatus: '', deviceType: '' },
        signal,
      )

      if (!signal?.aborted) {
        setCards(requestCards)
      }
    } catch (error) {
      if (!signal?.aborted) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load request board.',
        )
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    const abortController = new AbortController()
    void loadBoard(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToDeviceRequestsChanged(() => {
      void loadBoard()
    })

    return unsubscribe
  }, [])

  const onDragStart = (requestId: number) => {
  if (!canManageKanban) return
  setDragging(requestId)
}

  const onDragOver = (
    event: DragEvent<HTMLDivElement>,
    colId: RequestApprovalStatus,
  ) => {
    event.preventDefault()
    setDragOver(colId)
  }

  const updateCard = (updatedCard: DeviceRequestListItem) => {
    setCards((previousCards) =>
      previousCards.map((card) =>
        card.requestId === updatedCard.requestId ? updatedCard : card,
      ),
    )
  }

  const moveCard = async (
    requestId: number,
    col: RequestApprovalStatus,
  ) => {
    const targetCard = cards.find((card) => card.requestId === requestId)

    if (!targetCard) {
      return
    }

    const previousCards = cards
    const today = new Date().toISOString().slice(0, 10)
    const optimisticCard: DeviceRequestListItem =
      col === 'Approved' || col === 'Rejected'
        ? {
            ...targetCard,
            approvalStatus: col,
            approvedById: currentUser?.id ?? targetCard.approvedById,
            approvedBy: currentUser?.name ?? targetCard.approvedBy,
            approvalDate: today,
          }
        : {
            ...targetCard,
            approvalStatus: col,
            approvedById: null,
            approvedBy: null,
            approvalDate: null,
          }

    setCards((currentCards) =>
      currentCards.map((card) =>
        card.requestId === requestId ? optimisticCard : card,
      ),
    )

    try {
      if (col === 'Approved' || col === 'Rejected') {
        if (!currentUser) {
          setCards(previousCards)
          showToast('You must be logged in to review requests', 'error')
          return
        }

        const updatedCard = await approveDeviceRequestById(requestId, {
          approval_status: col,
          approved_by: currentUser.id,
        })

        if (updatedCard) {
          updateCard(updatedCard)
        }

        showToast(
          `Request moved to ${formatDeviceRequestStatus(col)}`,
          col === 'Approved' ? 'success' : 'info',
        )
        return
      }

      const updatedCard = await moveDeviceRequestCard(requestId, col)

      if (updatedCard) {
        updateCard(updatedCard)
      }

      showToast(`Request moved to ${formatDeviceRequestStatus(col)}`, 'info')
    } catch (error) {
      setCards(previousCards)
      showToast(
        error instanceof Error ? error.message : 'Failed to move device request.',
        'error',
      )
    }
  }

  const onDrop = async (
  event: DragEvent<HTMLDivElement>,
  colId: RequestApprovalStatus,
) => {
  if (!canManageKanban) return
    event.preventDefault()

    if (dragging === null) {
      return
    }

    if (colId === 'Rejected') {
      setConfirm({ requestId: dragging, col: colId })
    } else {
      await moveCard(dragging, colId)
    }

    setDragging(null)
    setDragOver(null)
  }

  const handleCardMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'scale(1.01)'
    event.currentTarget.style.boxShadow = '0 4px 16px var(--shadow)'
  }

  const handleCardMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = ''
    event.currentTarget.style.boxShadow = 'none'
  }

  if (isLoading) {
    return (
      <div className="p-6 flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>
          Loading request board...
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
          Device Request Kanban
        </h2>
        <p
  className="text-sm mt-0.5"
  style={{ color: 'var(--on-surface-variant)' }}
>
  {canManageKanban
    ? 'Drag requests through the status workflow'
    : 'View request workflow status'}
</p>
      </div>

      {errorMessage ? (
        <div className="section-card mb-5">
          <p className="text-sm" style={{ color: 'var(--error-text)' }}>
            {errorMessage}
          </p>
        </div>
      ) : null}

      <div className="flex gap-5 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {COLUMNS.map((column) => {
          const columnCards = cards.filter((card) => card.approvalStatus === column.id)

          return (
            <div
              key={column.id}
              className="flex-shrink-0 flex flex-col rounded-2xl flex-1"
              style={{
                minWidth: '280px',
                background: 'var(--kanban-col-bg)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${column.color}`,
              }}
              onDragOver={(event) => onDragOver(event, column.id)}
              onDrop={(event) => void onDrop(event, column.id)}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: column.color }}
                  />
                  <span className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>
                    {column.label}
                  </span>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${column.color}20`, color: column.color }}
                >
                  {columnCards.length}
                </span>
              </div>
              <div
                className="flex-1 p-3 space-y-3 transition-colors"
                style={{
                  minHeight: '200px',
                  background: dragOver === column.id ? 'var(--kanban-col-hover)' : undefined,
                }}
              >
                {columnCards.map((card) => (
                  <div
                    key={card.requestId}
                    draggable={canManageKanban}
                    onDragStart={() => onDragStart(card.requestId)}
                    onClick={() => navigate(`/requests/${card.requestId}`)}
                    title="Click to open detail"
                    className={`rounded-xl p-3 select-none ${
  canManageKanban
    ? 'cursor-grab active:cursor-grabbing'
    : 'cursor-pointer'
}`}
                    style={{
                      background:
                        dragging === card.requestId
                          ? 'var(--kanban-card-dragging)'
                          : 'var(--kanban-card-bg)',
                      border: '1px solid var(--border-color)',
                      opacity: dragging === card.requestId ? 0.5 : 1,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={handleCardMouseEnter}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>
                        {card.id}
                      </code>
                      <StatusBadge status={card.priority} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>
                      {card.deviceType}
                    </p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--primary)' }}>
                      {card.brand || '-'}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={formatDeviceRequestStatus(card.approvalStatus)} />
                    </div>
                    <div
                      className="mt-3 pt-2 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                    >
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>
                          {card.requestedBy}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {card.department}
                        </p>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                        {card.requestDate}
                      </span>
                    </div>
                  </div>
                ))}
                {columnCards.length === 0 && (
                  <div
                    className="flex items-center justify-center py-8 text-xs opacity-40"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    {cards.length === 0 ? 'No requests found' : 'Drop here'}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            void moveCard(confirm.requestId, confirm.col)
          }
        }}
        danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?"
      />
    </div>
  )
}
