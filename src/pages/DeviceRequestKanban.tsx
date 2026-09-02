import { useEffect, useState, useMemo, useCallback, type DragEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import DateRangeFilterKanban, { type QuickFilter } from '../components/DateRangeFilterKanban'
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
import { canManageKanban, canMoveKanbanStatus, getUserAccess } from '../utils/access-control'

const getLocalDateString = (date: Date | string | undefined | null): string => {
  if (!date) return ''
  if (typeof date === 'string') {
    const trimmed = date.trim()
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
    if (match) return match[1]
    const d = new Date(trimmed)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }
    return ''
  }
  if (date instanceof Date && !isNaN(date.getTime())) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  return ''
}

interface KanbanColumn { id: RequestApprovalStatus; label: string; color: string }
interface ConfirmState { requestId: number; col: Extract<RequestApprovalStatus, 'Rejected'> }

const COLUMNS: KanbanColumn[] = [
  { id: 'Requested', label: 'Requested', color: '#bac5ee' },
  { id: 'Pending', label: 'Recommended', color: '#f59e0b' },
  { id: 'Approved', label: 'Approved', color: '#16a34a' },
  { id: 'Rejected', label: 'Rejected', color: '#dc2626' },
  { id: 'Fulfilled', label: 'Fulfilled', color: '#0891b2' },
]

const VALID_TRANSITIONS: Record<RequestApprovalStatus, RequestApprovalStatus[]> = {
  'Requested': ['Pending', 'Rejected'],
  'Pending': ['Requested', 'Rejected', 'Approved', 'Fulfilled'],
  'Approved': ['Rejected', 'Fulfilled'],
  'Rejected': ['Requested', 'Pending'],
  'Fulfilled': ['Requested', 'Pending'],
}

export default function DeviceRequestKanban() {
  const { currentUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const access = getUserAccess(currentUser?.email)

  const [cards, setCards] = useState<DeviceRequestListItem[]>([])
  const [dragging, setDragging] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<RequestApprovalStatus | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [clickTimeout, setClickTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [filterMode, setFilterMode] = useState<'default' | 'custom' | 'all'>('default')

  const getOneMonthAgo = () => {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    return getLocalDateString(d)
  }

  const [dateFrom, setDateFrom] = useState(getOneMonthAgo())
  const [dateTo, setDateTo] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('default')

    const getCardStatusDate = useCallback((card: DeviceRequestListItem): string => {
    switch (card.approvalStatus) {
      case 'Requested': return getLocalDateString(card.requestDate)
      case 'Pending': return getLocalDateString(card.recommendedDate) || getLocalDateString(card.approvalDate) || getLocalDateString(card.requestDate)
      case 'Approved':
      case 'Rejected': return getLocalDateString(card.approvalDate) || getLocalDateString(card.requestDate)
      case 'Fulfilled': return getLocalDateString(card.fulfilledDate) || getLocalDateString(card.approvalDate) || getLocalDateString(card.requestDate)
      default: return getLocalDateString(card.requestDate)
    }
  }, [])

  // UPDATED: Anjana now sees Recommended (Pending) column too
  const visibleColumns = useMemo(() => {
    return COLUMNS.filter((col) => {
      if (currentUser?.email?.trim().toLowerCase() === 'anjana@yetiairlines.com') {
        // Anjana sees: Recommended, Approved, Rejected, Fulfilled
        return col.id === 'Pending' || col.id === 'Approved' || col.id === 'Rejected' || col.id === 'Fulfilled'
      }
      if (col.id === 'Requested' && !access.canViewRequested) return false
      if (col.id === 'Pending' && !access.canViewRecommended) return false
      if (col.id === 'Rejected' && !access.canViewRejected) return false
      if (col.id === 'Fulfilled' && !access.canViewFulfilled) return false
      return true
    })
  }, [currentUser?.email, access.canViewRequested, access.canViewRecommended, access.canViewRejected, access.canViewFulfilled])

  const loadBoard = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const requestCards = await fetchDeviceRequests({ approvalStatus: '', deviceType: '' }, signal)
      if (!signal?.aborted) {
        const today = new Date()
        const oneMonthAgo = new Date(today)
        oneMonthAgo.setMonth(today.getMonth() - 1)
        const oneMonthAgoStr = getLocalDateString(oneMonthAgo)
        const filteredCards = requestCards.filter((card) => {
          if (filterMode === 'all') return true
          const cardDate = getCardStatusDate(card)
          if (filterMode === 'custom' && (dateFrom || dateTo)) {
            if (dateFrom && cardDate < dateFrom) return false
            if (dateTo && cardDate > dateTo) return false
            return true
          }
          if (filterMode === 'default') {
            if (card.approvalStatus === 'Approved' || card.approvalStatus === 'Rejected' || card.approvalStatus === 'Fulfilled') {
              if (cardDate && cardDate < oneMonthAgoStr) return false
            }
          }
          return true
        })
        setCards(filteredCards)
      }
    } catch (error) {
      if (!signal?.aborted) setErrorMessage(error instanceof Error ? error.message : 'Unable to load request board.')
    } finally {
      if (!signal?.aborted) setIsLoading(false)
    }
  }, [filterMode, dateFrom, dateTo, getCardStatusDate])

  useEffect(() => {
    const abortController = new AbortController()
    void loadBoard(abortController.signal)
    return () => { abortController.abort() }
  }, [loadBoard])

  useEffect(() => {
    const unsubscribe = subscribeToDeviceRequestsChanged(() => { void loadBoard() })
    return unsubscribe
  }, [loadBoard])

  const isAnjana = currentUser?.email?.trim().toLowerCase() === 'anjana@yetiairlines.com'

   // NEW: decides whether a card can be dragged at all for the current user
  const canDragCard = (status: RequestApprovalStatus): boolean => {
    const email = currentUser?.email
    if (!canManageKanban(email)) return false

    const user = email?.trim().toLowerCase()

    // Anjana: Recommended & Rejected are strictly view-only
    // (Fulfilled stays draggable so she can do Fulfilled -> Approved)
    if (user === 'anjana@yetiairlines.com' && (status === 'Pending' || status === 'Rejected')) return false

    // Sudharshan: Fulfilled is strictly view-only
    if (user === 'sudharshan@yetiairlines.com' && status === 'Fulfilled') return false

    // Only draggable if the user has at least one allowed destination from this status
    // (This makes Requested/Recommended/Rejected read-only for default users,
    //  because their only allowed moves are Approved <-> Fulfilled)
    return COLUMNS.some((col) => canMoveKanbanStatus(email, status, col.id))
  }

  const onDragStart = (requestId: number) => {
    setClickTimeout(null)
    if (!canManageKanban(currentUser?.email)) {
      showToast('You do not have permission to move requests', 'error')
      return
    }
    setDragging(requestId)
  }

  // UPDATED: use the central permission logic instead of VALID_TRANSITIONS
  const onDragOver = (event: DragEvent<HTMLDivElement>, colId: RequestApprovalStatus) => {
    event.preventDefault()
    if (!canManageKanban(currentUser?.email)) return

    if (dragging !== null) {
      const draggedCard = cards.find((c) => c.requestId === dragging)
      if (draggedCard) {
        // Allows Anjana Fulfilled -> Approved, blocks anything not permitted per user
        if (!canMoveKanbanStatus(currentUser?.email, draggedCard.approvalStatus, colId)) return
      }
    }

    setDragOver(colId)
  }

  const updateCard = (updatedCard: DeviceRequestListItem) => {
    setCards((previousCards) => previousCards.map((card) => card.requestId === updatedCard.requestId ? updatedCard : card))
  }

  const moveCard = async (requestId: number, col: RequestApprovalStatus, fromStatus?: RequestApprovalStatus) => {
    const targetCard = cards.find((card) => card.requestId === requestId)
    if (!targetCard) return
    const currentStatus = fromStatus || targetCard.approvalStatus
    if (!canMoveKanbanStatus(currentUser?.email, currentStatus, col)) {
      showToast(`You are not allowed to move from ${formatDeviceRequestStatus(currentStatus)} to ${formatDeviceRequestStatus(col)}`, 'error')
      return
    }
    const previousCards = cards
    const todayStr = getLocalDateString(new Date())
    let optimisticCard: DeviceRequestListItem
    switch (col) {
      case 'Requested': optimisticCard = { ...targetCard, approvalStatus: col }; break
      case 'Pending': optimisticCard = { ...targetCard, approvalStatus: col, recommendedDate: todayStr }; break
      case 'Approved': optimisticCard = { ...targetCard, approvalStatus: col, approvedById: currentUser?.id ?? targetCard.approvedById, approvedBy: currentUser?.name ?? targetCard.approvedBy, approvalDate: todayStr }; break
      case 'Rejected': optimisticCard = { ...targetCard, approvalStatus: col, approvedById: currentUser?.id ?? targetCard.approvedById, approvedBy: currentUser?.name ?? targetCard.approvedBy, approvalDate: todayStr }; break
      case 'Fulfilled': optimisticCard = { ...targetCard, approvalStatus: col, fulfilledDate: todayStr }; break
      default: optimisticCard = { ...targetCard, approvalStatus: col }
    }
    setCards((currentCards) => currentCards.map((card) => card.requestId === requestId ? optimisticCard : card))
    try {
      if (col === 'Approved' || col === 'Rejected') {
        if (!currentUser) { setCards(previousCards); showToast('You must be logged in to review requests', 'error'); return }
        const updatedCard = await approveDeviceRequestById(requestId, { approval_status: col, approved_by: currentUser.id })
        if (updatedCard) updateCard(updatedCard)
        showToast(`Request moved to ${formatDeviceRequestStatus(col)}`, col === 'Approved' ? 'success' : 'info')
        return
      }
      const updatedCard = await moveDeviceRequestCard(requestId, col)
      if (updatedCard) updateCard(updatedCard)
      showToast(`Request moved to ${formatDeviceRequestStatus(col)}`, 'info')
    } catch (error) {
      setCards(previousCards)
      showToast(error instanceof Error ? error.message : 'Failed to move device request.', 'error')
    }
  }

   const onDrop = async (
    event: DragEvent<HTMLDivElement>,
    colId: RequestApprovalStatus
  ) => {
    event.preventDefault()
    if (dragging === null) return

    if (!canManageKanban(currentUser?.email)) {
      showToast('You do not have permission to move requests', 'error')
      setDragging(null)
      setDragOver(null)
      return
    }

    const targetCard = cards.find((card) => card.requestId === dragging)

    // Safety guard: block any move the user is not allowed to make
    if (!targetCard || !canMoveKanbanStatus(currentUser?.email, targetCard.approvalStatus, colId)) {
      setDragging(null)
      setDragOver(null)
      return
    }

    if (colId === 'Rejected') {
      setConfirm({ requestId: dragging, col: colId })
    } else {
      await moveCard(dragging, colId, targetCard.approvalStatus)
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
        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>Loading request board...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>Device Request Kanban</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Drag requests through the status workflow</p>
        </div>
        <DateRangeFilterKanban
          quickFilter={quickFilter}
          fromDate={dateFrom}
          toDate={dateTo}
          onApply={(mode, from, to, quick) => { setFilterMode(mode); setDateFrom(from); setDateTo(to); setQuickFilter(quick) }}
        />
      </div>

      {errorMessage ? (
        <div className="section-card mb-5"><p className="text-sm" style={{ color: 'var(--error-text)' }}>{errorMessage}</p></div>
      ) : null}

      <div className="flex gap-5 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {visibleColumns.map((column) => {
          const columnCards = cards.filter((card) => card.approvalStatus === column.id)
          return (
            <div key={column.id} className="flex-shrink-0 flex flex-col rounded-2xl flex-1" style={{ minWidth: '280px', background: 'var(--kanban-col-bg)', border: '1px solid var(--border-color)', borderTop: `3px solid ${column.color}` }} onDragOver={(event) => onDragOver(event, column.id)} onDrop={(event) => void onDrop(event, column.id)}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{column.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${column.color}20`, color: column.color }}>{columnCards.length}</span>
              </div>
              <div className="flex-1 p-3 space-y-3 transition-colors" style={{ minHeight: '200px', background: dragOver === column.id ? 'var(--kanban-col-hover)' : undefined }}>
                {columnCards.map((card) => {
                  // UPDATED: Anjana cannot drag Recommended, Rejected, or Fulfilled cards
                  const isAnjanaViewOnly = isAnjana && (card.approvalStatus === 'Pending' || card.approvalStatus === 'Rejected' || card.approvalStatus === 'Fulfilled')
                  return (
                    <div
                      key={card.requestId}
                      draggable={canDragCard(card.approvalStatus)}
                      onDragStart={() => onDragStart(card.requestId)}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (clickTimeout) { clearTimeout(clickTimeout); setClickTimeout(null); navigate(`/requests/${card.requestId}`) }
                        else { const timeout = setTimeout(() => { setClickTimeout(null) }, 250); setClickTimeout(timeout) }
                      }}
                      title="Double-click to open detail"
                      className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
                      style={{
                        background: dragging === card.requestId ? 'var(--kanban-card-dragging)' : 'var(--kanban-card-bg)',
                        border: '1px solid var(--border-color)',
                        opacity: dragging === card.requestId ? 0.5 : 1,
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                      onMouseEnter={handleCardMouseEnter}
                      onMouseLeave={handleCardMouseLeave}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <code className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{card.id}</code>
                        <StatusBadge status={card.priority} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{card.deviceType}</p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--primary)' }}>{card.brand || '-'}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={formatDeviceRequestStatus(card.approvalStatus)} />
                      </div>
                      <div className="mt-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <div>
                          <p className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>{card.requestedBy}</p>
                          <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{card.department}</p>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{getCardStatusDate(card)}</span>
                      </div>
                    </div>
                  )
                })}
                {columnCards.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-xs opacity-40" style={{ color: 'var(--on-surface-variant)' }}>
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
            const targetCard = cards.find((card) => card.requestId === confirm.requestId)
            if (targetCard) void moveCard(confirm.requestId, confirm.col, targetCard.approvalStatus)
          }
        }}
        danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?"
      />
    </div>
  )
}