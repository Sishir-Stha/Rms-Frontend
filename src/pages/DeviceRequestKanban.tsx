import { useState, type DragEvent, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { DEVICE_REQUESTS } from '../data/dummyData'
import type { DeviceRequestRecord, RequestKanbanColumn } from '../types/app'

interface DeviceRequestKanbanCard extends DeviceRequestRecord {
  col: RequestKanbanColumn
}

interface KanbanColumn {
  id: RequestKanbanColumn
  label: string
  color: string
}

interface ConfirmState {
  id: string
  col: RequestKanbanColumn
}

const COLUMNS: KanbanColumn[] = [
  { id: 'Pending', label: 'Pending', color: '#f59e0b' },
  { id: 'Approved', label: 'Approved', color: '#16a34a' },
  { id: 'Rejected', label: 'Rejected', color: '#dc2626' },
]

export default function DeviceRequestKanban() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cards, setCards] = useState<DeviceRequestKanbanCard[]>(
    DEVICE_REQUESTS.map((request) => ({
      ...request,
      col: request.kanbanColumn || 'Pending',
    })),
  )
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<RequestKanbanColumn | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)

  const onDragStart = (id: string) => setDragging(id)

  const onDragOver = (
    event: DragEvent<HTMLDivElement>,
    colId: RequestKanbanColumn,
  ) => {
    event.preventDefault()
    setDragOver(colId)
  }

  const moveCard = (id: string, col: RequestKanbanColumn) => {
    setCards((previousCards) =>
      previousCards.map((card) =>
        card.id === id
          ? {
              ...card,
              col,
              approvalStatus: col,
              approvalDate: new Date().toISOString().slice(0, 10),
              approvedBy: 'Admin User',
            }
          : card,
      ),
    )

    showToast(`Request moved to ${col}`, col === 'Approved' ? 'success' : 'info')
  }

  const onDrop = (
    event: DragEvent<HTMLDivElement>,
    colId: RequestKanbanColumn,
  ) => {
    event.preventDefault()

    if (!dragging) {
      return
    }

    if (colId === 'Rejected') {
      setConfirm({ id: dragging, col: colId })
    } else {
      moveCard(dragging, colId)
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

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
          Device Request Kanban
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>
          Drag requests to approve or reject them
        </p>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {COLUMNS.map((column) => {
          const columnCards = cards.filter((card) => card.col === column.id)

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
                    key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card.id)}
                    onDoubleClick={() => navigate(`/requests/${card.id}`)}
                    title="Double-click to open detail"
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background:
                        dragging === card.id
                          ? 'var(--kanban-card-dragging)'
                          : 'var(--kanban-card-bg)',
                      border: '1px solid var(--border-color)',
                      opacity: dragging === card.id ? 0.5 : 1,
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
                      {card.brand}
                    </p>
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
                    Drop here
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
            moveCard(confirm.id, confirm.col)
          }
        }}
        danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?"
      />
    </div>
  )
}
