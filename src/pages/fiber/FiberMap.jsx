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
    queryKey: ['fiber-routes'], queryFn: () => getFiberRoutes({ per_page: 100 }),
  })
  const { data: splitters } = useQuery({
    queryKey: ['fiber-splitters'], queryFn: () => getFiberSplitters({ per_page: 100 }),
  })
  const { data: cabinets } = useQuery({
    queryKey: ['fiber-cabinets'], queryFn: () => getFiberCabinets({ per_page: 100 }),
  })
  const { data: distribution } = useQuery({
    queryKey: ['fiber-distribution'], queryFn: () => getDistributionPoints({ per_page: 100 }),
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

  // Field keys/enums below are kept in exact lockstep with the backend's
  // validation rules (FiberController@routesStore/splittersStore/
  // cabinetsStore/dpsStore) and each model's $fillable. Laravel's `sometimes`
  // rule silently drops any key the request doesn't send — so a mismatched
  // key here isn't a validation error, it's quiet data loss on save.
  const renderFields = () => {
    if (active === 'routes') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div><label className="label">Source</label><input className="input" value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
        <div><label className="label">Destination</label><input className="input" value={form.destination || ''} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
        <div><label className="label">Length (km)</label><input type="number" step="0.001" className="input" value={form.length_km ?? ''} onChange={(e) => setForm({ ...form, length_km: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div><label className="label">Cable Type</label><input className="input" value={form.cable_type || ''} onChange={(e) => setForm({ ...form, cable_type: e.target.value })} /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div className="md:col-span-2"><label className="label">Notes</label><input className="input" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </>
    )
    if (active === 'splitters') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>
          <label className="label">Split Ratio</label>
          <select className="input" value={form.split_ratio || ''} onChange={(e) => setForm({ ...form, split_ratio: e.target.value })}>
            <option value="">—</option>
            <option value="1:4">1:4</option>
            <option value="1:8">1:8</option>
            <option value="1:16">1:16</option>
            <option value="1:32">1:32</option>
            <option value="1:64">1:64</option>
          </select>
        </div>
        <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div><label className="label">Latitude</label><input type="number" step="any" className="input" value={form.location_lat ?? ''} onChange={(e) => setForm({ ...form, location_lat: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div><label className="label">Longitude</label><input type="number" step="any" className="input" value={form.location_lng ?? ''} onChange={(e) => setForm({ ...form, location_lng: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
      </>
    )
    if (active === 'cabinets') return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">—</option>
            <option value="fiber">Fiber</option>
            <option value="power">Power</option>
            <option value="distribution">Distribution</option>
          </select>
        </div>
        <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div><label className="label">Capacity</label><input className="input" value={form.capacity || ''} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div><label className="label">Latitude</label><input type="number" step="any" className="input" value={form.location_lat ?? ''} onChange={(e) => setForm({ ...form, location_lat: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div><label className="label">Longitude</label><input type="number" step="any" className="input" value={form.location_lng ?? ''} onChange={(e) => setForm({ ...form, location_lng: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><input className="input" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </>
    )
    return (
      <>
        <div><label className="label">Name *</label><input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="">—</option>
            <option value="fiber_hub">Fiber Hub</option>
            <option value="splice_tray">Splice Tray</option>
            <option value="drop_point">Drop Point</option>
          </select>
        </div>
        <div><label className="label">Location</label><input className="input" value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div><label className="label">Latitude</label><input type="number" step="any" className="input" value={form.location_lat ?? ''} onChange={(e) => setForm({ ...form, location_lat: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div><label className="label">Longitude</label><input type="number" step="any" className="input" value={form.location_lng ?? ''} onChange={(e) => setForm({ ...form, location_lng: e.target.value === '' ? '' : Number(e.target.value) })} /></div>
        <div className="md:col-span-2"><label className="label">Notes</label><input className="input" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </>
    )
  }

  const renderRow = (item) => {
    if (active === 'routes') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">
            {item.source || '—'} → {item.destination || '—'} · {item.length_km ?? 0}km
            {item.cable_type ? ` · ${item.cable_type}` : ''} · {item.status || 'active'}
          </p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    if (active === 'splitters') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">{item.split_ratio || '—'} · {item.location || '—'} · {item.status || 'active'}</p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    if (active === 'cabinets') return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">
            {item.type ? `${item.type} · ` : ''}{item.location || '—'} · Capacity {item.capacity || '—'} · {item.status || 'active'}
          </p>
        </div>
        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate({ key: active, id: item.id }) }} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={15} /></button>
      </div>
    )
    return (
      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <p className="font-medium text-sm">{item.name}</p>
          <p className="text-xs text-gray-500">
            {item.type ? `${item.type} · ` : ''}{item.location || '—'} · {item.status || 'active'}
          </p>
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
        {SECTIONS.map(({ key, label,
          // eslint-disable-next-line no-unused-vars -- used in JSX below
          icon: Icon }) => (
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
