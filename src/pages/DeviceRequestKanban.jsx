import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEVICE_REQUESTS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const COLUMNS = [
  { id: 'Pending', label: 'Pending', color: '#f59e0b' },
  { id: 'Approved', label: 'Approved', color: '#16a34a' },
  { id: 'Rejected', label: 'Rejected', color: '#dc2626' },
]

export default function DeviceRequestKanban() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cards, setCards] = useState(DEVICE_REQUESTS.map(r => ({ ...r, col: r.kanbanColumn || 'Pending' })))
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const onDragStart = (id) => setDragging(id)
  const onDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId) }
  const onDrop = (e, colId) => {
    e.preventDefault()
    if (!dragging) return
    if (colId === 'Rejected') {
      setConfirm({ id: dragging, col: colId })
    } else {
      moveCard(dragging, colId)
    }
    setDragging(null); setDragOver(null)
  }
  const moveCard = (id, col) => {
    setCards(prev => prev.map(c => c.id === id ? {
      ...c, col, approvalStatus: col,
      approvalDate: new Date().toISOString().slice(0, 10),
      approvedBy: 'Admin User'
    } : c))
    showToast(`Request moved to ${col}`, col === 'Approved' ? 'success' : 'info')
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>Device Request Kanban</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Drag requests to Approve or Reject them</p>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.col === col.id)
          return (
            <div key={col.id}
              className="flex-shrink-0 flex flex-col rounded-2xl flex-1"
              style={{
                minWidth: '280px',
                background: 'var(--kanban-col-bg)',
                border: '1px solid var(--border-color)',
                borderTop: `3px solid ${col.color}`,
              }}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{col.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${col.color}20`, color: col.color }}>{colCards.length}</span>
              </div>
              <div
                className="flex-1 p-3 space-y-3 transition-colors"
                style={{
                  minHeight: '200px',
                  background: dragOver === col.id ? 'var(--kanban-col-hover)' : undefined,
                }}>
                {colCards.map(card => (
                  <div key={card.id}
                    draggable
                    onDragStart={() => onDragStart(card.id)}
                    onDoubleClick={() => navigate(`/requests/${card.id}`)}
                    title="Double-click to open detail"
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background: dragging === card.id ? 'var(--kanban-card-dragging)' : 'var(--kanban-card-bg)',
                      border: '1px solid var(--border-color)',
                      opacity: dragging === card.id ? 0.5 : 1,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{card.id}</code>
                      <StatusBadge status={card.priority} />
                    </div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{card.deviceType}</p>
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--primary)' }}>{card.brand}</p>
                    <div className="mt-3 pt-2 flex items-center justify-between"
                      style={{ borderTop: '1px solid var(--border-color)' }}>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--on-surface)' }}>{card.requestedBy}</p>
                        <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{card.department}</p>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{card.requestDate}</span>
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-xs opacity-40"
                    style={{ color: 'var(--on-surface-variant)' }}>Drop here</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => confirm && moveCard(confirm.id, confirm.col)} danger
        title="Reject Request"
        message="Are you sure you want to reject this device request?" />
    </div>
  )
}
