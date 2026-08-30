import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getLeads, deleteLead, markLeadAsLost } from '../../api/leads.api'
import { useDebounce } from '../../hooks/useDebounce'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { leadStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { Plus, Search, Eye, Trash2, XCircle, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import LeadForm from './LeadForm'

const PER_PAGE = 15

export default function LeadList() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [lostLead, setLostLead] = useState(null)
  const [lostReason, setLostReason] = useState('')
    const navigate                = useNavigate()
  const queryClient             = useQueryClient()

  // ── Confirmation surface (replaces ad-hoc window.confirm) ──────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const askConfirm = (message, onConfirm) => {
    setConfirmMessage(message)
    setPendingConfirm(() => onConfirm)
    setConfirmOpen(true)
  }

  const debouncedSearch = useDebounce(search, 400)

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['leads', page, debouncedSearch, status],
    queryFn:  () => getLeads({ page, search: debouncedSearch, status, per_page: PER_PAGE }),
    placeholderData: (previousData) => previousData,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      toast.success('Lead deleted')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => toast.error('Failed to delete lead'),
  })

  const lostMutation = useMutation({
    mutationFn: ({ id, reason }) => markLeadAsLost(id, reason),
    onSuccess: () => {
      toast.success('Lead marked as lost')
      setLostLead(null)
      setLostReason('')
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: () => toast.error('Failed to mark lead as lost'),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1)
  }

  const handleMarkLost = () => {
    if (!lostReason.trim()) {
      toast.error('Please provide a reason')
      return
    }
    lostMutation.mutate({ id: lostLead.id, reason: lostReason })
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = [
    {
      key:    'name',
      label:  'Lead',
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
      key:    'email',
      label:  'Email',
      render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.email || '—'}</span>,
    },
    {
      key:    'source',
      label:  'Source',
      render: (r) => (
        <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
          {r.source.replace('_', ' ')}
        </span>
      ),
    },
    {
      key:    'status',
      label:  'Status',
      render: (r) => <span className={leadStatusBadge(r.status)}>{r.status.replace('_', ' ')}</span>,
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
            onClick={() => navigate(`/leads/${r.id}`)}
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
              onClick={() => { setLostLead(r); setLostReason('') }}
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
                        onClick={() => askConfirm('Delete this lead?', () => deleteMutation.mutate(r.id))}
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

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load leads'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['leads'] })}
      />
    )
  }

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
              placeholder="Search leads..."
              className="input pl-9 w-56"
            />
          </div>

          <select
            value={status}
            onChange={handleStatusChange}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="survey_required">Survey Required</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Add Lead
        </button>
      </div>

      {/* Table */}
      <div
        className="section"
        style={{ transition: 'opacity 150ms ease', opacity: isFetching && !isLoading ? 0.6 : 1 }}
      >
                {isLoading && (data?.data?.length ?? 0) === 0 ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (data?.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads"
            description="Try adjusting the search or filters above."
          />
        ) : (
          <>
            <Table columns={columns} data={data?.data ?? []} loading={isFetching} />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add Lead Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Lead" size="lg">
        <LeadForm
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['leads'] })
          }}
        />
      </Modal>

      {/* Mark as Lost Modal */}
      <Modal isOpen={!!lostLead} onClose={() => setLostLead(null)} title="Mark Lead as Lost">
        {lostLead && (
          <div className="space-y-4">
            <p style={{ color: 'var(--pb-text-2)' }}>
              Mark <strong>{lostLead.first_name} {lostLead.last_name}</strong> as lost?
            </p>
            <div>
              <label className="label">Reason</label>
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                className="input w-full min-h-[80px]"
                placeholder="Why is this lead lost?"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
              <button onClick={() => setLostLead(null)} className="btn-secondary">
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