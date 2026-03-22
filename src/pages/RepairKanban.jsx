import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { REPAIRS } from '../data/dummyData'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const COLUMNS = [
  { id: 'Backlog', label: 'Backlog', color: '#879485' },
  { id: 'In Progress', label: 'In Progress', color: '#3b82f6' },
  { id: 'Under Review', label: 'Under Review', color: '#f59e0b' },
  { id: 'Completed', label: 'Completed', color: '#16a34a' },
]

export default function RepairKanban() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [cards, setCards] = useState(REPAIRS.map(r => ({ ...r, col: r.kanbanColumn || 'Backlog' })))
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const onDragStart = (id) => setDragging(id)
  const onDragOver = (e, colId) => { e.preventDefault(); setDragOver(colId) }
  const onDrop = (e, colId) => {
    e.preventDefault()
    if (!dragging) return
    const card = cards.find(c => c.id === dragging)
    if (colId === 'Completed' && card.col !== 'Completed') {
      setConfirm({ id: dragging, col: colId })
    } else {
      moveCard(dragging, colId)
    }
    setDragging(null); setDragOver(null)
  }
  const moveCard = (id, col) => {
    setCards(prev => prev.map(c => c.id === id ? {
      ...c, col,
      status: col === 'In Progress' ? 'In Progress' : col === 'Completed' ? 'Completed' : col === 'Under Review' ? 'Under Review' : 'Pending'
    } : c))
    showToast(`Card moved to ${col}`, 'success')
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl" style={{ color: 'var(--on-surface)' }}>Repair Kanban Board</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>Drag and drop repair tickets to update status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {COLUMNS.map(col => {
          const colCards = cards.filter(c => c.col === col.id)
          return (
            <div key={col.id}
              className="flex-shrink-0 flex flex-col rounded-2xl"
              style={{
                width: '280px',
                background: 'var(--kanban-col-bg)',
                border: `1px solid var(--border-color)`,
                borderTop: `3px solid ${col.color}`,
              }}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}>
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.color }} />
                  <span className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{col.label}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${col.color}20`, color: col.color }}>
                  {colCards.length}
                </span>
              </div>
              {/* Cards */}
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
                    onDoubleClick={() => navigate(`/repairs/${card.id}`)}
                    title="Double-click to open detail"
                    className="rounded-xl p-3 cursor-grab active:cursor-grabbing select-none"
                    style={{
                      background: dragging === card.id ? 'var(--kanban-card-dragging)' : 'var(--kanban-card-bg)',
                      border: '1px solid var(--border-color)',
                      opacity: dragging === card.id ? 0.5 : 1,
                      transform: 'translateZ(0)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.01) translateZ(0)'; e.currentTarget.style.boxShadow = '0 4px 16px var(--shadow)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateZ(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <code className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{card.id}</code>
                      <StatusBadge status={card.priority} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{card.device}</p>
                    <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--on-surface-variant)' }}>{card.issue}</p>
                    <div className="flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: 'rgba(98,223,125,0.15)', color: '#16a34a' }}>
                          {card.technician?.split(' ').map(n => n[0]).join('') || '?'}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{card.technician?.split(' ')[0]}</span>
                      </div>
                      {card.expectedCompletion && (
                        <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{card.expectedCompletion}</span>
                      )}
                    </div>
                  </div>
                ))}
                {colCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-xs text-center opacity-40"
                    style={{ color: 'var(--on-surface-variant)' }}>
                    <p>Drop cards here</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => confirm && moveCard(confirm.id, confirm.col)}
        title="Mark as Completed"
        message="Are you sure you want to mark this repair as completed?" />
    </div>
  )
}
