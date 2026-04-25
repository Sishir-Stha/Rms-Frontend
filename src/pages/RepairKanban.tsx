import { useEffect, useMemo, useState, type DragEvent, type MouseEvent } from 'react'
import { RefreshCw } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { fetchRepairs, moveRepairCard } from '../services/repair.service'
import type { RepairKanbanColumn, RepairStatus } from '../types/app'
import type { RepairListItem } from '../types/repair.types'

interface RepairKanbanCard extends RepairListItem {
  col: RepairKanbanColumn
}

interface KanbanColumn {
  id: RepairKanbanColumn
  label: string
  color: string
}

interface ConfirmState {
  id: string
  col: RepairKanbanColumn
}

const COLUMNS: KanbanColumn[] = [
  { id: 'Backlog', label: 'Backlog', color: '#879485' },
  { id: 'In Progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'Resolved', label: 'Resolved', color: '#f59e0b' },
  { id: 'Closed', label: 'Closed', color: '#16a34a' },
]

const getStatusFromColumn = (column: RepairKanbanColumn): RepairStatus => {
  switch (column) {
    case 'In Progress':
      return 'In Progress'
    case 'Resolved':
      return 'Resolved'
    case 'Closed':
      return 'Closed'
    case 'Backlog':
    default:
      return 'Pending'
  }
}

export default function RepairKanban() {
  const { showToast } = useToast()
  const [cards, setCards] = useState<RepairKanbanCard[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<RepairKanbanColumn | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const abortController = new AbortController()

    const loadRepairs = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const response = await fetchRepairs(
          {
            status: '',
            device_name: '',
          },
          abortController.signal,
        )

        if (!abortController.signal.aborted) {
          setCards(
            response.map((repair) => ({
              ...repair,
              col: repair.kanbanColumn || 'Backlog',
            })),
          )
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          return
        }

        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load repairs.',
        )
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadRepairs()

    return () => {
      abortController.abort()
    }
  }, [refreshKey])

  const onDragStart = (id: string) => setDragging(id)

  const onDragOver = (
    event: DragEvent<HTMLDivElement>,
    colId: RepairKanbanColumn,
  ) => {
    event.preventDefault()
    setDragOver(colId)
  }

  const moveCard = (id: string, col: RepairKanbanColumn) => {
    const targetCard = cards.find((card) => card.id === id)

    if (!targetCard) {
      return
    }

    const previousCards = cards
    const optimisticCards = previousCards.map((card) =>
      card.id === id
        ? {
            ...card,
            col,
            kanbanColumn: col,
            status: getStatusFromColumn(col),
          }
        : card,
    )

    setCards(optimisticCards)

    void (async () => {
      try {
        await moveRepairCard(targetCard.repairId, col)
        showToast(`Card moved to ${col}`, 'success')
      } catch (error) {
        setCards(previousCards)
        showToast(
          error instanceof Error ? error.message : 'Failed to move repair.',
          'error',
        )
      }
    })()
  }

  const onDrop = (
    event: DragEvent<HTMLDivElement>,
    colId: RepairKanbanColumn,
  ) => {
    event.preventDefault()

    if (!dragging) {
      return
    }

    const card = cards.find((item) => item.id === dragging)

    if (colId === 'Closed' && card?.col !== 'Closed') {
      setConfirm({ id: dragging, col: colId })
    } else {
      moveCard(dragging, colId)
    }

    setDragging(null)
    setDragOver(null)
  }

  const handleCardMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'scale(1.01) translateZ(0)'
    event.currentTarget.style.boxShadow = '0 4px 16px var(--shadow)'
  }

  const handleCardMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    event.currentTarget.style.transform = 'translateZ(0)'
    event.currentTarget.style.boxShadow = 'none'
  }

  const columnsWithCards = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        cards: cards.filter((card) => card.col === column.id),
      })),
    [cards],
  )

  return (
    <div className="p-6">
      <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
            Repair Kanban Board
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
            Backend-driven repair board grouped by kanban column
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

      {isLoading ? (
        <div className="section-card flex items-center justify-center min-h-[360px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-on-surface-variant">Loading repair board...</p>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="section-card flex flex-col items-center justify-center min-h-[360px] text-center px-6">
          <p className="text-base font-semibold" style={{ color: 'var(--error)' }}>
            Unable to load repair board
          </p>
          <p className="text-sm mt-2 text-on-surface-variant">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setRefreshKey((currentValue) => currentValue + 1)}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
          {columnsWithCards.map((column) => {
            const columnCards = column.cards

            return (
            <div
              key={column.id}
              className="flex-shrink-0 flex flex-col rounded-2xl"
              style={{
                width: '280px',
                background: 'var(--kanban-col-bg)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${column.color}`,
              }}
              onDragOver={(event) => onDragOver(event, column.id)}
              onDrop={(event) => onDrop(event, column.id)}
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
                    key={card.repairId}
                    draggable
                    onDragStart={() => onDragStart(card.id)}
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background:
                        dragging === card.id
                          ? 'var(--kanban-card-dragging)'
                          : 'var(--kanban-card-bg)',
                      border: '1px solid var(--border-color)',
                      opacity: dragging === card.id ? 0.5 : 1,
                      transform: 'translateZ(0)',
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
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>
                      {card.device}
                    </p>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>
                      {card.issue}
                    </p>
                    <div
                      className="flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: 'rgba(98,223,125,0.15)', color: '#16a34a' }}
                        >
                          {card.reportedBy
                            .split(' ')
                            .map((name) => name[0])
                            .join('') || '?'}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {card.reportedBy.split(' ')[0]}
                        </span>
                      </div>
                      {card.expectedCompletion && (
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
                          {card.expectedCompletion}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {columnCards.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center py-8 text-xs text-center opacity-40"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    <p>Drop cards here</p>
                  </div>
                )}
              </div>
            </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) {
            moveCard(confirm.id, confirm.col)
          }
        }}
        title="Mark as Closed"
        message="Are you sure you want to move this repair to Closed?"
      />
    </div>
  )
}
