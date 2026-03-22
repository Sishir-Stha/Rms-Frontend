import React, { useState } from 'react'
import { Plus, Trash2, Tag, Building2, Wrench, Settings as SettingsIcon } from 'lucide-react'
import { VENDORS as initVendors, DEPARTMENTS as initDepts, DEVICE_CATEGORIES, REPAIRS } from '../data/dummyData'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'

const REPAIR_STATUSES = [
  { name: 'Pending', description: 'Ticket submitted, not yet assigned', color: '#f59e0b' },
  { name: 'In Progress', description: 'Actively being worked on by a technician', color: '#adc6ff' },
  { name: 'Under Review', description: 'Repair done, awaiting quality check', color: '#879485' },
  { name: 'Completed', description: 'Fully resolved and closed', color: '#62df7d' },
]
const REQUEST_STATUSES = [
  { name: 'Pending', description: 'Awaiting admin review', color: '#f59e0b' },
  { name: 'Approved', description: 'Request approved for procurement', color: '#62df7d' },
  { name: 'Rejected', description: 'Request declined with reason', color: '#ffb4ab' },
]

function Section({ title, icon: Icon, children }) {
  return (
    <div className="section-card space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/15">
        <Icon size={17} className="text-primary" />
        <h3 className="font-display font-bold text-base text-on-surface">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { showToast } = useToast()
  const [vendors, setVendors] = useState(initVendors)
  const [depts, setDepts] = useState(initDepts)
  const [newVendor, setNewVendor] = useState('')
  const [newDept, setNewDept] = useState('')
  const [deleteVendor, setDeleteVendor] = useState(null)
  const [deleteDept, setDeleteDept] = useState(null)

  const addVendor = () => {
    if (!newVendor.trim()) return showToast('Enter a vendor name', 'error')
    if (vendors.find(v => v.name.toLowerCase() === newVendor.toLowerCase())) return showToast('Vendor already exists', 'warning')
    setVendors(prev => [...prev, { id: Date.now(), name: newVendor.trim(), contact: 'N/A', specialization: 'General', rating: 4.0 }])
    showToast('Vendor added', 'success'); setNewVendor('')
  }
  const addDept = () => {
    if (!newDept.trim()) return showToast('Enter a department name', 'error')
    if (depts.find(d => d.name.toLowerCase() === newDept.toLowerCase())) return showToast('Department already exists', 'warning')
    setDepts(prev => [...prev, { id: Date.now(), name: newDept.trim(), code: newDept.trim().slice(0,3).toUpperCase(), headCount: 0 }])
    showToast('Department added', 'success'); setNewDept('')
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="font-display font-bold text-xl text-on-surface">Settings</h2>
        <p className="text-sm text-on-surface-variant">Configure system preferences and data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vendor Management */}
        <Section title="Vendor Management" icon={Building2}>
          <div className="flex gap-2">
            <input value={newVendor} onChange={e => setNewVendor(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addVendor()}
              placeholder="New vendor name…" className="input-field flex-1" />
            <button onClick={addVendor} className="btn-primary px-4"><Plus size={15} /></button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vendors.map(v => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{v.name}</p>
                  <p className="text-xs text-on-surface-variant">{v.specialization} · ★ {v.rating}</p>
                </div>
                <button onClick={() => setDeleteVendor(v.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Department Management */}
        <Section title="Department Management" icon={Building2}>
          <div className="flex gap-2">
            <input value={newDept} onChange={e => setNewDept(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDept()}
              placeholder="New department name…" className="input-field flex-1" />
            <button onClick={addDept} className="btn-primary px-4"><Plus size={15} /></button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {depts.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div>
                  <p className="text-sm font-medium text-on-surface">{d.name}</p>
                  <p className="text-xs text-on-surface-variant">{d.code} · {d.headCount} staff</p>
                </div>
                <button onClick={() => setDeleteDept(d.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/10 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Device Categories */}
        <Section title="Device Categories" icon={Tag}>
          <div className="space-y-2">
            {DEVICE_CATEGORIES.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="text-xl">{c.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-on-surface">{c.name}</p>
                  <p className="text-xs text-on-surface-variant">{c.description}</p>
                </div>
                <span className="text-xs font-bold text-primary">{c.count}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Status Configuration */}
        <Section title="Repair Status Types" icon={Wrench}>
          <div className="space-y-2">
            {REPAIR_STATUSES.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</p>
                  <p className="text-xs text-on-surface-variant">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-outline-variant/15">
            <p className="text-xs font-semibold text-on-surface mb-2">Request Status Types</p>
            <div className="space-y-2">
              {REQUEST_STATUSES.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: s.color }}>{s.name}</p>
                    <p className="text-xs text-on-surface-variant">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <ConfirmDialog isOpen={!!deleteVendor} onClose={() => setDeleteVendor(null)} danger
        onConfirm={() => { setVendors(p => p.filter(v => v.id !== deleteVendor)); showToast('Vendor removed', 'info'); setDeleteVendor(null) }}
        title="Remove Vendor" message="Are you sure you want to remove this vendor?" />
      <ConfirmDialog isOpen={!!deleteDept} onClose={() => setDeleteDept(null)} danger
        onConfirm={() => { setDepts(p => p.filter(d => d.id !== deleteDept)); showToast('Department removed', 'info'); setDeleteDept(null) }}
        title="Remove Department" message="Are you sure you want to remove this department?" />
    </div>
  )
}
