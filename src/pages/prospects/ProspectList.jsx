import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getProspects, deleteProspect, markProspectAsLost } from '../../api/leads.api'
import { useDebounce } from '../../hooks/useDebounce'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { prospectStageBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { Plus, Search, Eye, Trash2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import ProspectForm from './ProspectForm'

const PER_PAGE = 15

export default function ProspectList() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [stage, setStage]       = useState('')
  const [showForm, setShowForm] = useState(false)
  const [lostProspect, setLostProspect] = useState(null)
  const [lostReason, setLostReason] = useState('')
  const navigate                = useNavigate()
  const queryClient             = useQueryClient()

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['prospects', page, debouncedSearch, stage],
    queryFn:  () => getProspects({ page, search: debouncedSearch, pipeline_stage: stage, per_page: PER_PAGE }),
    placeholderData: (previousData) => previousData,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: deleteProspect,
    onSuccess: () => {
      toast.success('Prospect deleted')
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
    onError: () => toast.error('Failed to delete prospect'),
  })

  const lostMutation = useMutation({
    mutationFn: ({ id, reason }) => markProspectAsLost(id, reason),
    onSuccess: () => {
      toast.success('Prospect marked as lost')
      setLostProspect(null)
      setLostReason('')
      queryClient.invalidateQueries({ queryKey: ['prospects'] })
    },
    onError: () => toast.error('Failed to mark prospect as lost'),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStageChange = (e) => {
    setStage(e.target.value)
    setPage(1)
  }

  const handleMarkLost = () => {
    if (!lostReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    lostMutation.mutate({ id: lostProspect.id, reason: lostReason })
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = [
    {
      key:    'name',
      label:  'Prospect',
      render: (r) => (
        <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
          {r.first_name} {r.last_name}
        </span>
      ),
    },
    {
      key:    'phone',
      label:  'Phone',
      render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.phone}</span>,
    },
    {
      key:    'interested_package',
      label:  'Package',
      render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.interested_package || '—'}</span>,
    },
    {
      key:    'pipeline_stage',
      label:  'Stage',
      render: (r) => <span className={prospectStageBadge(r.pipeline_stage)}>{r.pipeline_stage.replace('_', ' ')}</span>,
    },
    {
      key:    'created_at',
      label:  'Created',
      render: (r) => (
        <span style={{ color: 'var(--pb-text-3)' }}>{formatDate(r.created_at)}</span>
      ),
    },
    {
      key:    'actions',
      label:  '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/prospects/${r.id}`)}
            className="p-1.5 rounded-lg transition-colors"
            title="View"
            style={{ color: '#60a5fa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Eye size={15} />
          </button>

          {r.status !== 'lost' && r.status !== 'converted' && (
            <button
              onClick={() => { setLostProspect(r); setLostReason('') }}
              className="p-1.5 rounded-lg transition-colors"
              title="Mark as Lost"
              style={{ color: '#f87171' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <XCircle size={15} />
            </button>
          )}

          <button
            onClick={() => { if (confirm('Delete this prospect?')) deleteMutation.mutate(r.id) }}
            disabled={deleteMutation.isPending}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
            style={{ color: '#f87171' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--pb-text-3)' }}
            />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search prospects..."
              className="input pl-9 w-56"
            />
          </div>

          <select
            value={stage}
            onChange={handleStageChange}
            className="input w-auto"
          >
            <option value="">All Stages</option>
            <option value="new">New</option>
            <option value="negotiation">Negotiation</option>
            <option value="survey_scheduled">Survey Scheduled</option>
            <option value="survey_completed">Survey Completed</option>
            <option value="installation_scheduled">Installation Scheduled</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Add Prospect
        </button>
      </div>

      {/* Table */}
      <div
        className="section"
        style={{ transition: 'opacity 150ms ease', opacity: isFetching && !isLoading ? 0.6 : 1 }}
      >
        <Table columns={columns} data={data?.data ?? []} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Add Prospect Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Prospect" size="lg">
        <ProspectForm
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['prospects'] })
          }}
        />
      </Modal>

      {/* Mark as Lost Modal */}
      <Modal isOpen={!!lostProspect} onClose={() => setLostProspect(null)} title="Mark Prospect as Lost">
        {lostProspect && (
          <div className="space-y-4">
            <p style={{ color: 'var(--pb-text-2)' }}>
              Mark <strong>{lostProspect.first_name} {lostProspect.last_name}</strong> as lost?
            </p>
            <div>
              <label className="label">Reason</label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input w-full min-h-[80px]"
                placeholder="Why is this prospect lost?"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
              <button onClick={() => setLostProspect(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleMarkLost}
                disabled={lostMutation.isPending}
                className="btn-primary min-w-[120px]"
              >
                {lostMutation.isPending ? 'Saving...' : 'Mark as Lost'}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}