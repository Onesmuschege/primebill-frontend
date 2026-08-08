import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOlt, getPonPorts, getOltsOnts, createPonPort,
  createOnt, pollOntSignal, deleteOnt,
} from '../../api/fiber.api'
import Spinner from '../../components/common/Spinner'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Activity, Plus, RefreshCw, Trash2, Radio,
} from 'lucide-react'

const ONT_STATUS = {
  online:   'badge-active',
  offline:  'badge-suspended',
  inactive: 'bg-gray-100 text-gray-500',
}

const SIGNAL_STYLE = (rx) => {
  if (rx === null || rx === undefined) return 'bg-gray-100 text-gray-500'
  if (rx >= -25) return 'bg-green-50 text-green-600'
  if (rx >= -27) return 'bg-amber-50 text-amber-600'
  return 'bg-red-50 text-red-600'
}

const EMPTY_ONT = { serial_number: '', mac_address: '', model: '', status: 'inactive' }
const EMPTY_PON = { port_number: '', slot: 0, status: 'active' }

export default function OltDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showOntModal, setShowOntModal] = useState(false)
  const [showPonModal, setShowPonModal] = useState(false)
  const [ontForm, setOntForm] = useState(EMPTY_ONT)
  const [ponForm, setPonForm] = useState(EMPTY_PON)

  const { data: olt, isLoading } = useQuery({
    queryKey: ['olt', id],
    queryFn: () => getOlt(id).then(r => r.data.data),
  })

  const { data: ponPorts } = useQuery({
    queryKey: ['pon-ports', id],
    queryFn: () => getPonPorts(id, { per_page: 50 }).then(r => r.data),
  })

  const { data: onts } = useQuery({
    queryKey: ['olts-onts', id],
    queryFn: () => getOltsOnts(id, { per_page: 100 }).then(r => r.data),
  })

  const createPonMutation = useMutation({
    mutationFn: (data) => createPonPort(id, data),
    onSuccess: () => { toast.success('PON port created'); setShowPonModal(false); setPonForm(EMPTY_PON); queryClient.invalidateQueries(['pon-ports', id]) },
  })

  const createOntMutation = useMutation({
    mutationFn: (data) => createOnt(id, data),
    onSuccess: () => { toast.success('ONT registered'); setShowOntModal(false); setOntForm(EMPTY_ONT); queryClient.invalidateQueries(['olts-onts', id]) },
  })

  const pollSignalMutation = useMutation({
    mutationFn: () => pollOntSignal(id),
    onSuccess: () => { toast.success('Signal levels updated'); queryClient.invalidateQueries(['olts-onts', id]) },
  })

  const deleteOntMutation = useMutation({
    mutationFn: (ontId) => deleteOnt(id, ontId),
    onSuccess: () => { toast.success('ONT removed'); queryClient.invalidateQueries(['olts-onts', id]) },
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/fiber/olts')} className="p-1.5 rounded-lg hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{olt?.name}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
              {olt?.vendor} {olt?.model} · {olt?.ip_address}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => pollSignalMutation.mutate()} className="btn-secondary flex items-center gap-2"
            disabled={pollSignalMutation.isPending}>
            <RefreshCw size={15} /> {pollSignalMutation.isPending ? 'Polling...' : 'Poll Signal'}
          </button>
          <button onClick={() => setShowPonModal(true)} className="btn-secondary flex items-center gap-2">
            <Plus size={15} /> Add PON Port
          </button>
          <button onClick={() => setShowOntModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Register ONT
          </button>
        </div>
      </div>

      {/* PON Ports */}
      <div className="card p-5">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Radio size={16} className="text-blue-600" /> PON Ports
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {ponPorts?.data?.length === 0 && <p className="text-sm text-gray-500 col-span-full">No PON ports yet.</p>}
          {ponPorts?.data?.map(port => (
            <div key={port.id} className="border rounded-lg p-3">
              <p className="font-medium text-sm">PON {port.port_number}</p>
              <p className="text-xs text-gray-500">Slot {port.slot}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-2 inline-block ${port.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {port.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ONTs */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity size={16} className="text-blue-600" /> Registered ONTs
          </h2>
          <span className="text-xs text-gray-500">{onts?.data?.length ?? 0} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b" style={{ background: 'var(--pb-raised)' }}>
                <th className="px-4 py-3">Serial</th>
                <th className="px-4 py-3">MAC</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">PON</th>
                <th className="px-4 py-3">RX Signal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {onts?.data?.length === 0 && (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No ONTs registered.</td></tr>
              )}
              {onts?.data?.map(ont => (
                <tr key={ont.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{ont.serial_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{ont.mac_address || '—'}</td>
                  <td className="px-4 py-3">{ont.model || '—'}</td>
                  <td className="px-4 py-3">PON {ont.pon_port?.port_number || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SIGNAL_STYLE(ont.rx_signal)}`}>
                      {ont.rx_signal !== null && ont.rx_signal !== undefined ? `${ont.rx_signal} dBm` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ONT_STATUS[ont.status] || 'bg-gray-100'}`}>
                      {ont.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => { if (confirm('Remove this ONT?')) deleteOntMutation.mutate(ont.id) }}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50" title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add PON Modal */}
      {showPonModal && (
        <Modal title={`Add PON Port — ${olt?.name}`} onClose={() => setShowPonModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createPonMutation.mutate(ponForm) }} className="space-y-4">
            <div>
              <label className="label">Port Number *</label>
              <input className="input" value={ponForm.port_number} onChange={(e) => setPonForm({ ...ponForm, port_number: e.target.value })} required placeholder="e.g. 0/1/1" />
            </div>
            <div>
              <label className="label">Slot</label>
              <input type="number" className="input" value={ponForm.slot} onChange={(e) => setPonForm({ ...ponForm, slot: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={ponForm.status} onChange={(e) => setPonForm({ ...ponForm, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowPonModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createPonMutation.isPending}>Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Register ONT Modal */}
      {showOntModal && (
        <Modal title={`Register ONT — ${olt?.name}`} onClose={() => setShowOntModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createOntMutation.mutate(ontForm) }} className="space-y-4">
            <div>
              <label className="label">Serial Number *</label>
              <input className="input" value={ontForm.serial_number} onChange={(e) => setOntForm({ ...ontForm, serial_number: e.target.value })} required placeholder="HWTC12345678" />
            </div>
            <div>
              <label className="label">MAC Address</label>
              <input className="input" value={ontForm.mac_address} onChange={(e) => setOntForm({ ...ontForm, mac_address: e.target.value })} placeholder="AA:BB:CC:DD:EE:FF" />
            </div>
            <div>
              <label className="label">Model</label>
              <input className="input" value={ontForm.model} onChange={(e) => setOntForm({ ...ontForm, model: e.target.value })} placeholder="e.g. HG8245H" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowOntModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createOntMutation.isPending}>Register</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
