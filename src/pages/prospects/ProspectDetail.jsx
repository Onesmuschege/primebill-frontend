import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProspect, advanceProspect, markProspectAsWon, markProspectAsLost
} from '../../api/leads.api'
import { getClients } from '../../api/clients.api'
import Modal from '../../components/common/Modal'
import { prospectStageBadge, prospectStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { ArrowLeft, Edit2, ArrowRight, Trophy, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import ProspectForm from './ProspectForm'

const NEXT_STAGE = {
  new: 'negotiation',
  negotiation: 'survey_scheduled',
  survey_scheduled: 'survey_completed',
  survey_completed: 'installation_scheduled',
  installation_scheduled: 'won',
}

export default function ProspectDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [showEdit, setShowEdit]     = useState(false)
  const [showAdvance, setShowAdvance] = useState(false)
  const [showWon, setShowWon]       = useState(false)
  const [showLost, setShowLost]     = useState(false)
  const [lostReason, setLostReason] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clients, setClients]       = useState([])

  const { data: prospect, isLoading } = useQuery({
    queryKey: ['prospect', id],
    queryFn: () => getProspect(id).then(r => r.data.data),
  })

  // NOTE: getClients() already calls unwrapList() internally and resolves to
  // { data: [], meta: {} } — NOT a raw axios response — so only one .data
  // unwrap is needed here (see the same fix in InvoiceList.jsx / TicketList.jsx).
  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => getClients({ per_page: 100 }).then(r => r.data),
    enabled: showWon,
  })

  const advanceMutation = useMutation({
    mutationFn: (stage) => advanceProspect(id, stage),
    onSuccess: () => {
      toast.success('Pipeline stage advanced')
      setShowAdvance(false)
      queryClient.invalidateQueries({ queryKey: ['prospect', id] })
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Advance failed'),
  })

  const wonMutation = useMutation({
    mutationFn: (clientId) => markProspectAsWon(id, clientId),
    onSuccess: () => {
      toast.success('Prospect marked as won!')
      setShowWon(false)
      queryClient.invalidateQueries({ queryKey: ['prospect', id] })
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark as won'),
  })

  const lostMutation = useMutation({
    mutationFn: (reason) => markProspectAsLost(id, reason),
    onSuccess: () => {
      toast.success('Prospect marked as lost')
      setShowLost(false)
      setLostReason('')
      queryClient.invalidateQueries({ queryKey: ['prospect', id] })
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark as lost'),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const infoFields = [
    { label: 'Phone',     value: prospect?.phone },
    { label: 'Alt Phone', value: prospect?.alt_phone || '—' },
    { label: 'Email',     value: prospect?.email || '—' },
    { label: 'Address',   value: prospect?.address || '—' },
    { label: 'Town',      value: prospect?.town || '—' },
    { label: 'County',    value: prospect?.county || '—' },
    { label: 'Package',   value: prospect?.interested_package || '—' },
    { label: 'Installation Type', value: prospect?.installation_type || '—' },
    { label: 'Installation Fee', value: prospect?.installation_fee_quoted ? `KES ${Number(prospect.installation_fee_quoted).toLocaleString()}` : '—' },
    { label: 'Assigned To', value: prospect?.assigned_to ? `${prospect.assigned_to?.first_name} ${prospect.assigned_to?.last_name}` : '—' },
    { label: 'Converted Client', value: prospect?.converted_to_client_id ? `#${prospect.converted_to_client_id}` : '—' },
    { label: 'Created',   value: formatDate(prospect?.created_at) },
  ]

  const currentStage = prospect?.pipeline_stage
  const nextStage = NEXT_STAGE[currentStage]
  const canAdvance = nextStage && prospect?.status !== 'lost' && prospect?.status !== 'converted'
  const canMarkWon = currentStage !== 'won' && prospect?.status !== 'lost' && prospect?.status !== 'converted'
  const canMarkLost = prospect?.status !== 'lost' && prospect?.status !== 'converted'

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/prospects')}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--pb-text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--pb-text-3)'}
      >
        <ArrowLeft size={15} /> Back to Prospects
      </button>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #2563eb)' }}>
              {prospect?.first_name?.[0]}{prospect?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
                {prospect?.first_name} {prospect?.last_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={prospectStageBadge(prospect?.pipeline_stage)}>{prospect?.pipeline_stage?.replace('_', ' ')}</span>
                <span className={prospectStatusBadge(prospect?.status)}>{prospect?.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="btn-secondary">
              <Edit2 size={14} /> Edit
            </button>
            {canAdvance && (
              <button onClick={() => setShowAdvance(true)} className="btn-primary">
                <ArrowRight size={14} /> Advance Stage
              </button>
            )}
            {canMarkWon && (
              <button onClick={() => { setClients(clientsData || []); setShowWon(true) }} className="btn-primary" style={{ background: '#059669' }}>
                <Trophy size={14} /> Mark Won
              </button>
            )}
            {canMarkLost && (
              <button onClick={() => setShowLost(true)} className="btn-secondary" style={{ color: '#f87171' }}>
                <XCircle size={14} /> Mark Lost
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ borderTop: '1px solid var(--pb-border)' }}>
          {infoFields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: 'var(--pb-text-3)' }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
            </div>
          ))}
        </div>

        {prospect?.notes && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--pb-text-3)' }}>Notes</p>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{prospect.notes}</p>
          </div>
        )}

        {prospect?.lost_reason && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#f87171' }}>Lost Reason</p>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{prospect.lost_reason}</p>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Prospect" size="lg">
        <ProspectForm
          initialData={prospect}
          onSuccess={() => {
            setShowEdit(false)
            queryClient.invalidateQueries({ queryKey: ['prospect', id] })
            queryClient.invalidateQueries({ queryKey: ['prospects'] })
          }}
        />
      </Modal>

      {/* ── Advance Stage Modal ── */}
      <Modal isOpen={showAdvance} onClose={() => setShowAdvance(false)} title="Advance Pipeline Stage">
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            Advance <strong>{prospect?.first_name} {prospect?.last_name}</strong> from <strong>{currentStage?.replace('_', ' ')}</strong> to <strong>{nextStage?.replace('_', ' ')}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button onClick={() => setShowAdvance(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => advanceMutation.mutate(nextStage)}
              disabled={advanceMutation.isPending}
              className="btn-primary min-w-[120px]"
            >
              {advanceMutation.isPending ? 'Saving...' : 'Advance Stage'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Mark Won Modal ── */}
      <Modal isOpen={showWon} onClose={() => setShowWon(false)} title="Mark Prospect as Won">
        <div className="space-y-4">
          <p style={{ color: 'var(--pb-text-2)' }}>
            Select the client this prospect converted to:
          </p>
          <div>
            <label className="label">Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="input w-full"
            >
              <option value="">Select a client...</option>
              {clients?.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button onClick={() => setShowWon(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => { if (selectedClientId) wonMutation.mutate(selectedClientId) }}
              disabled={wonMutation.isPending || !selectedClientId}
              className="btn-primary min-w-[120px]"
              style={{ background: '#059669' }}
            >
              {wonMutation.isPending ? 'Saving...' : 'Mark Won'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Mark Lost Modal ── */}
      <Modal isOpen={showLost} onClose={() => setShowLost(false)} title="Mark Prospect as Lost">
        <div className="space-y-4">
          <div>
            <label className="label">Reason</label>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Why is this prospect lost?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button onClick={() => setShowLost(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => { if (lostReason.trim()) lostMutation.mutate(lostReason) }}
              disabled={lostMutation.isPending || !lostReason.trim()}
              className="btn-primary min-w-[120px]"
            >
              {lostMutation.isPending ? 'Saving...' : 'Mark as Lost'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}