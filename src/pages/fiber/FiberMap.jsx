import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getFiberRoutes, createFiberRoute, deleteFiberRoute,
  getFiberSplitters, createFiberSplitter, deleteFiberSplitter,
  getFiberCabinets, createFiberCabinet, deleteFiberCabinet,
  getDistributionPoints, createDistributionPoint, deleteDistributionPoint,
} from '../../api/fiber.api'
import toast from 'react-hot-toast'
import { Plus, Trash2, Route, GitFork, Boxes, MapPin } from 'lucide-react'

const SECTIONS = [
  { key: 'routes',        label: 'Fiber Routes',   icon: Route },
  { key: 'splitters',     label: 'Splitters',      icon: GitFork },
  { key: 'cabinets',      label: 'Cabinets',       icon: Boxes },
  { key: 'distribution',  label: 'Distribution Points', icon: MapPin },
]

export default function FiberMap() {
  const [active, setActive] = useState('routes')
  const queryClient = useQueryClient()

  const { data: routes } = useQuery({
    queryKey: ['fiber-routes'], queryFn: () => getFiberRoutes({ per_page: 100 }).then(r => r.data),
  })
  const { data: splitters } = useQuery({
    queryKey: ['fiber-splitters'], queryFn: () => getFiberSplitters({ per_page: 100 }).then(r => r.data),
  })
  const { data: cabinets } = useQuery({
    queryKey: ['fiber-cabinets'], queryFn: () => getFiberCabinets({ per_page: 100 }).then(r => r.data),
  })
  const { data: distribution } = useQuery({
    queryKey: ['fiber-distribution'], queryFn: () => getDistributionPoints({ per_page: 100 }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: ({ key, data }) => {
      if (key === 'routes') return createFiberRoute(data)
      if (key === 'splitters') return createFiberSplitter(data)
      if (key === 'cabinets') return createFiberCabinet(data)
      return createDistributionPoint(data)
    },
    onSuccess: () => { toast.success('Created'); queryClient.invalidateQueries(['fiber-routes']); queryClient.invalidateQueries(['fiber-splitters']); queryClient.invalidateQueries(['fiber-cabinets']); queryClient.invalidateQueries(['fiber-distribution']) },
  })

  const deleteMutation = useMutation({
    mutationFn: ({ key, id }) => {
      if (key === 'routes') return deleteFiberRoute(id)
      if (key === 'splitters') return deleteFiberSplitter(id)
      if (key === 'cabinets') return deleteFiberCabinet(id)
      return deleteDistributionPoint(id)
    },
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries(['fiber-routes']); queryClient.invalidateQueries(['fiber-splitters']); queryClient.invalidateQueries(['fiber-cabinets']); queryClient.invalidateQueries(['fiber-distribution']) },
  })

  const datasets = {
    routes: routes?.data ?? [],
    splitters: splitters?.data ?? [],
    cabinets: cabinets?.data ?? [],
    distribution: distribution?.data ?? [],
  }

  const [form, setForm] = useState({})
  const [showForm, setShowForm] = useState(false)

  const openAdd = () => { setForm({}); setShowForm(true) }

  const renderFields = () => {
    if (active === 'routes') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Start Location</label><input className="input" value={form.start_location || ''} onChange={(e) => setForm({ ...form, start_location: e.target.value })} /></div>
        <div><label className="label">End Location</label><input className="input" value={form.end_location || ''} onChange={(e) => setForm({ ...form, end_location: e.target.value })} /></div>
        <div><label className="label">Length (m)</label><input type="number" className="input" value={form.length_meters || ''} onChange={(e) => setForm({ ...form, length_meters: Number(e.target.value) })} /></div>
      </>
    )
    if (active === 'splitters') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Ratio</label><input className="input" value={form.ratio || ''} onChange={(e) => setForm({ ...form, ratio: e.target.value })} placeholder="e.g. 1:32" /></div>
        <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      </>
    )
    if (active === 'cabinets') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><label className="label">Capacity</label><input className="input" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
      </>
    )
    return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Location / Address</label><input className="input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div><label className="label">Ports</label><input type="number" className="input" value={form.port_count || ''} onChange={(e) => setForm({ ...form, port_count: Number(e.target.value) })} /></div>
      </>
    )
  }

  const renderRow = (item) => {
    if (active === 'routes') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">{item.start_location || '—'} → {item.end_location || '—'} · {item.length_meters || 0}m</p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    if (active === 'splitters') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">{item.ratio || '—'} · {item.location || '—'}</p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    if (active === 'cabinets') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">{item.location || '—'} · Capacity {item.capacity || '—'}</p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">{item.address || '—'} · {item.port_count || 0} ports</p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Fiber Infrastructure</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>Routes, splitters, cabinets, and distribution points</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={15} /> Add</button>
      </div>

      <div className="flex gap-1 rounded-lg border p-1 w-fit">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${active === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <div className="card p-4 space-y-2">
        {showForm && (
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b pb-4 mb-2"
            onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ key: active, data: form }); setShowForm(false) }}>
            {renderFields()}
            <div className="flex justify-end gap-2 md:col-span-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}
        {datasets[active].length === 0 && !showForm && (
          <p className="text-sm text-gray-500 py-6 text-center">No {SECTIONS.find(s => s.key === active).label.toLowerCase()} yet.</p>
        )}
        {datasets[active].map(renderRow)}
      </div>
    </div>
  )
}
