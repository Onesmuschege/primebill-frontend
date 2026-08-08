import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLead, convertLeadToProspect, markLeadAsLost } from '../../api/leads.api'
import Modal from '../../components/common/Modal'
import { leadStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { ArrowLeft, Edit2, UserPlus, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import LeadForm from './LeadForm'

export default function LeadDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [showEdit, setShowEdit]       = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [showLost, setShowLost]       = useState(false)
  const [lostReason, setLostReason]   = useState('')
  const [convertForm, setConvertForm] = useState({
    interested_package: '',
    installation_type: 'fiber',
    installation_fee_quoted: '',
    notes: '',
  })

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => getLead(id).then(r => r.data.data),
  })

  const convertMutation = useMutation({
    mutationFn: (data) => convertLeadToProspect(id, data),
    onSuccess: (res) => {
      toast.success('Lead converted to prospect!')
      setShowConvert(false)
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
      // Navigate to the new prospect
      const prospectId = res?.data?.data?.id
      if (prospectId) navigate(`/prospects/${prospectId}`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Conversion failed'),
  })

  const lostMutation = useMutation({
    mutationFn: (reason) => markLeadAsLost(id, reason),
    onSuccess: () => {
      toast.success('Lead marked as lost')
      setShowLost(false)
      setLostReason('')
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to mark as lost'),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const infoFields = [
    { label: 'Phone',     value: lead?.phone },
    { label: 'Alt Phone', value: lead?.alt_phone || '—' },
    { label: 'Email',     value: lead?.email || '—' },
    { label: 'Address',   value: lead?.address || '—' },
    { label: 'Town',      value: lead?.town || '—' },
    { label: 'County',    value: lead?.county || '—' },
    { label: 'Source',    value: lead?.source?.replace('_', ' ') || '—' },
    { label: 'Interested Plan', value: lead?.interest_plan || '—' },
    { label: 'Assigned To', value: lead?.assigned_to ? `${lead.assigned_to?.first_name} ${lead.assigned_to?.last_name}` : '—' },
    { label: 'Created',   value: formatDate(lead?.created_at) },
  ]

  const canConvert = lead?.status !== 'converted' && lead?.status !== 'lost'
  const canMarkLost = lead?.status !== 'lost' && lead?.status !== 'converted'

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/leads')}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--pb-text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--pb-text-3)'}
      >
        <ArrowLeft size={15} /> Back to Leads
      </button>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
              {lead?.first_name?.[0]}{lead?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
                {lead?.first_name} {lead?.last_name}
              </h2>
              <span className={leadStatusBadge(lead?.status)}>{lead?.status?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowEdit(true)} className="btn-secondary">
              <Edit2 size={14} /> Edit
            </button>
            {canConvert && (
              <button onClick={() => setShowConvert(true)} className="btn-primary">
                <UserPlus size={14} /> Convert to Prospect
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

        {lead?.notes && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--pb-text-3)' }}>Notes</p>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{lead.notes}</p>
          </div>
        )}

        {lead?.lost_reason && (
          <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: '#f87171' }}>Lost Reason</p>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{lead.lost_reason}</p>
          </div>
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Lead" size="lg">
        <LeadForm
          initialData={lead}
          onSuccess={() => {
            setShowEdit(false)
            queryClient.invalidateQueries({ queryKey: ['lead', id] })
            queryClient.invalidateQueries({ queryKey: ['leads'] })
          }}
        />
      </Modal>

      {/* ── Convert to Prospect Modal ── */}
      <Modal isOpen={showConvert} onClose={() => setShowConvert(false)} title="Convert to Prospect" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); convertMutation.mutate(convertForm) }} className="space-y-4">
          <div>
            <label className="label">Interested Package</label>
            <input
              value={convertForm.interested_package}
              onChange={(e) => setConvertForm({ ...convertForm, interested_package: e.target.value })}
              className="input"
              placeholder="e.g. Home Fiber 10Mbps"
            />
          </div>
          <div>
            <label className="label">Installation Type</label>
            <select
              value={convertForm.installation_type}
              onChange={(e) => setConvertForm({ ...convertForm, installation_type: e.target.value })}
              className="input"
            >
              <option value="fiber">Fiber</option>
              <option value="wireless">Wireless</option>
              <option value="pppoe">PPPoE</option>
            </select>
          </div>
          <div>
            <label className="label">Installation Fee Quoted (KES)</label>
            <input
              type="number"
              min="0"
              value={convertForm.installation_fee_quoted}
              onChange={(e) => setConvertForm({ ...convertForm, installation_fee_quoted: e.target.value })}
              className="input"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              value={convertForm.notes}
              onChange={(e) => setConvertForm({ ...convertForm, notes: e.target.value })}
              className="input w-full min-h-[80px]"
              placeholder="Additional notes for the prospect..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button type="button" onClick={() => setShowConvert(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={convertMutation.isPending} className="btn-primary">
              {convertMutation.isPending ? 'Converting...' : 'Convert to Prospect'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Mark Lost Modal ── */}
      <Modal isOpen={showLost} onClose={() => setShowLost(false)} title="Mark Lead as Lost">
        <div className="space-y-4">
          <div>
            <label className="label">Reason</label>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              className="input w-full min-h-[80px]"
              placeholder="Why is this lead lost?"
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