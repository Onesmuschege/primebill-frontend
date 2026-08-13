import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkOrder, getWorkOrderParts, addWorkOrderPart,
  getWorkOrderAttachments, addWorkOrderAttachment,
} from '../../api/work-orders.api'
import {
  verifyWorkOrder, getWorkOrderStatusHistory,
} from '../../api/work-orders.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

export default function WorkOrderDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [tab, setTab] = useState('materials')
  const [pf, setPf] = useState({ part_name: '', quantity: 1, unit_cost: '' })
  const [af, setAf] = useState({ file_name: '', file_path: '', category: 'photo', description: '' })
  const [verifying, setVerifying] = useState(false)
  const [verificationNotes, setVerificationNotes] = useState('')

  const woQ = useQuery({ queryKey: ['work-order', id], queryFn: () => getWorkOrder(id), retry: false })
  const partsQ = useQuery({ queryKey: ['wo-parts', id], queryFn: () => getWorkOrderParts(id), enabled: !!id })
  const attQ = useQuery({ queryKey: ['wo-atts', id], queryFn: () => getWorkOrderAttachments(id), enabled: !!id })
  const historyQ = useQuery({ queryKey: ['wo-history', id], queryFn: () => getWorkOrderStatusHistory(id), enabled: !!id })

  const invalidate = () => {
    qc.invalidateQueries(['wo-parts', id])
    qc.invalidateQueries(['wo-history', id])
    qc.invalidateQueries(['work-order', id])

    qc.invalidateQueries(['wo-atts', id])
  }

  const addPart = useMutation({
    mutationFn: (p) => addWorkOrderPart(id, p),
    onSuccess: () => { toast.success('Part added'); setPf({ part_name: '', quantity: 1, unit_cost: '' }); invalidate() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to add part'),
  })
  const addAtt = useMutation({
    mutationFn: (p) => addWorkOrderAttachment(id, p),
    onSuccess: () => { toast.success('Evidence attached'); setAf({ file_name: '', file_path: '', category: 'photo', description: '' }); invalidate() },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to attach'),
  })
  const verify = useMutation({
    mutationFn: () => verifyWorkOrder(id, verificationNotes),
    onSuccess: () => { toast.success('Work order verified'); setVerifying(false); setVerificationNotes(''); invalidate() },
    onError: (e) => toast.error(e.response?.data?.message || 'Verification failed'),
  })

  if (woQ.isLoading) return <Spinner />
  const wo = woQ.data?.data
  const parts = partsQ.data?.data ?? []
  const atts = attQ.data?.data ?? []
  const history = historyQ.data?.data ?? []
  const sv = { scheduled: 'pending', dispatched: 'info', in_progress: 'pending', completed: 'active', cancelled: 'suspended' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{wo?.title || 'Work Order'}</h1>
          <div className="flex gap-2 items-center mt-1 text-sm text-gray-600">
            <Badge label={wo?.status} variant={sv[wo?.status] || 'inactive'} />
            {wo?.verified_at && <Badge label="verified" variant="active" />}
            <span>WO #{wo?.work_order_number} · {wo?.priority} priority</span>
          </div>
        </div>
        <nav className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setTab('materials')} className={`px-3 py-1 text-sm rounded ${tab === 'materials' ? 'bg-white shadow' : ''}`}>Materials</button>
          <button onClick={() => setTab('evidence')} className={`px-3 py-1 text-sm rounded ${tab === 'evidence' ? 'bg-white shadow' : ''}`}>Evidence</button>
          <button onClick={() => setTab('timeline')} className={`px-3 py-1 text-sm rounded ${tab === 'timeline' ? 'bg-white shadow' : ''}`}>Timeline</button>
        </nav>
<div className="flex items-center gap-2">
          {wo?.status === 'completed' && !wo?.verified_at && !verifying && (
            <button onClick={() => setVerifying(true)}
              className="px-3 py-1.5 text-sm font-medium text-white rounded bg-green-600 hover:bg-green-700">Verify work</button>
          )}
          {verifying && (
            <div className="flex items-center gap-2">
              <input value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Verification notes" className="input text-sm w-48" />
              <button onClick={() => verify.mutate()} disabled={verify.isPending}
                className="px-3 py-1.5 text-sm font-medium text-white rounded bg-green-600 hover:bg-green-700 disabled:opacity-50">
                {verify.isPending ? 'Verifying…' : 'Confirm'}
              </button>
              <button onClick={() => setVerifying(false)} className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            </div>
          )}
        </div>
      </div>

      {tab === 'materials' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h2 className="font-medium">Add material</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="input text-sm" placeholder="Part name *" required value={pf.part_name}
                onChange={(e) => setPf({ ...pf, part_name: e.target.value })} />
              <input className="input text-sm" placeholder="Part number" value={pf.part_number}
                onChange={(e) => setPf({ ...pf, part_number: e.target.value })} />
              <input className="input text-sm" type="number" min={1} placeholder="Quantity" value={pf.quantity}
                onChange={(e) => setPf({ ...pf, quantity: e.target.value })} />
              <input className="input text-sm" type="number" step="0.01" placeholder="Unit cost" value={pf.unit_cost}
                onChange={(e) => setPf({ ...pf, unit_cost: e.target.value })} />
              <input className="input text-sm col-span-2" placeholder="Notes" value={pf.notes}
                onChange={(e) => setPf({ ...pf, notes: e.target.value })} />
            </div>
            <button disabled={addPart.isPending || !pf.part_name} onClick={() => addPart.mutate(pf)}
              className="px-3 py-1.5 text-sm font-medium text-white rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {addPart.isPending ? 'Adding…' : 'Add part'}
            </button>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">Materials ({parts.length})</h2>
            {parts.length === 0 ? (
              <p className="text-sm text-gray-400">No parts recorded yet.</p>
            ) : parts.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-gray-50 rounded p-2 text-sm">
                <div>
                  <div className="font-medium">{p.part_name}</div>
                  <div className="text-xs text-gray-500">{p.part_number} · qty {p.quantity} · {p.status}</div>
                </div>
                {p.unit_cost && <span className="text-xs text-gray-600">${Number(p.unit_cost).toFixed(2)}/ea</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'evidence' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <h2 className="font-medium">Attach evidence</h2>
            <div className="grid grid-cols-2 gap-3">
              <input className="input text-sm" placeholder="File name *" required value={af.file_name}
                onChange={(e) => setAf({ ...af, file_name: e.target.value })} />
              <input className="input text-sm" placeholder="File path / URL *" required value={af.file_path}
                onChange={(e) => setAf({ ...af, file_path: e.target.value })} />
              <select className="input text-sm" value={af.category} onChange={(e) => setAf({ ...af, category: e.target.value })}>
                <option value="photo">Photo</option>
                <option value="document">Document</option>
                <option value="signature">Signature</option>
                <option value="receipt">Receipt</option>
              </select>
              <input className="input text-sm" value={af.description} onChange={(e) => setAf({ ...af, description: e.target.value })} placeholder="Description" />
            </div>
            <button disabled={addAtt.isPending || !af.file_name || !af.file_path} onClick={() => addAtt.mutate(af)}
              className="px-3 py-1.5 text-sm font-medium text-white rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {addAtt.isPending ? 'Attaching…' : 'Attach'}
            </button>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">Evidence ({atts.length})</h2>
            {atts.length === 0 ? (
              <p className="text-sm text-gray-400">No evidence attached.</p>
            ) : atts.map((a) => (
              <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded p-2 text-sm">
                <span className="text-xs font-medium text-gray-500">{a.category}</span>
                <div className="flex-1">
                  <div className="font-medium">{a.file_name}</div>
                  <div className="text-xs text-gray-500">{a.description}</div>
                </div>
                <Badge label={a.category} variant="info" />
              </div>
            ))}
          </div>
        </div>
      )}
{tab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-medium mb-2">Lifecycle</h2>
            <p className="text-sm text-gray-600">
              {wo?.status === 'completed' && wo?.verified_at
                ? `✅ Verified ${new Date(wo.verified_at).toLocaleString()}${wo?.verified_by?.name ? ` by ${wo.verified_by.name}` : ''} — ${wo?.verification_notes || 'no notes'}`
                : 'This work order is ' + (wo?.status || 'unknown') + (wo?.status === 'completed' ? ' and awaiting verification.' : '.')}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="font-medium mb-4">Status history ({history.length})</h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-400">No transitions recorded yet.</p>
            ) : (
              <ol className="relative border-l border-gray-200 ml-2 space-y-5">
                {history.map((h) => (
                  <li key={h.id} className="ml-5">
                    <span className={`absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white ${h.to_status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <div className="text-sm font-medium text-gray-800">
                      {h.from_status || '—'} → {h.to_status}
                    </div>
                    <div className="text-xs text-gray-500">
                      {h.reason && <span>{h.reason} · </span>}
                      {h.changed_by?.name ? `${h.changed_by.name} · ` : ''}
                      {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
