import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getClients, deleteClient, suspendClient, activateClient } from '../../api/clients.api'
import { useDebounce } from '../../hooks/useDebounce'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { clientStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { Plus, Search, Eye, UserX, UserCheck, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import ClientForm from './ClientForm'

// Centralised constant — change once to affect the query call and any
// "showing X of Y" copy that references it.
const PER_PAGE = 15

export default function ClientList() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate                = useNavigate()
    const queryClient = useQueryClient()

  // ── Confirmation surface (replaces ad-hoc window.confirm) ──────────────────
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState(null)
  const askConfirm = (message, onConfirm) => {
    setConfirmMessage(message)
    setPendingConfirm(() => onConfirm)
    setConfirmOpen(true)
  }

  // Debounced search — the input value (`search`) updates on every keystroke
  // so the field stays responsive. The query key uses `debouncedSearch` so
  // the API call only fires 400ms after the user stops typing.
  // Without this: typing "Wanyama" fires 7 requests. With it: fires 1.
  const debouncedSearch = useDebounce(search, 400)

    const { data, isLoading, isFetching, isError, error } = useQuery({
    // debouncedSearch in the key — not `search`.
    // page resets to 1 when search/status change (handled in the handlers below).
    queryKey: ['clients', page, debouncedSearch, status],
    queryFn:  () => getClients({ page, search: debouncedSearch, status, per_page: PER_PAGE }),

    // keepPreviousData equivalent in TanStack Query v5.
    // When the user changes page, the previous page's rows stay visible at
    // reduced opacity (see the transition wrapper below) instead of flashing
    // empty while the next page loads. Eliminates the blank-table flicker.
    placeholderData: (previousData) => previousData,
  })

  // ── Mutations ──────────────────────────────────────────────────────────────

  const suspendMutation = useMutation({
    mutationFn: suspendClient,
    onSuccess: () => {
      toast.success('Client suspended')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => toast.error('Failed to suspend client'),
  })

  const activateMutation = useMutation({
    mutationFn: activateClient,
    onSuccess: () => {
      toast.success('Client activated')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => toast.error('Failed to activate client'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      toast.success('Client deleted')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => toast.error('Failed to delete client'),
  })

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (e) => {
    setSearch(e.target.value)
    setPage(1) // Reset to page 1 on new search — avoids "page 3 of 1" state.
  }

  const handleStatusChange = (e) => {
    setStatus(e.target.value)
    setPage(1)
  }

  // ── Columns ────────────────────────────────────────────────────────────────

  const columns = [
    {
      key:    'name',
      label:  'Client',
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
      key:    'town',
      label:  'Town',
      render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.town || '—'}</span>,
    },
    {
      key:    'status',
      label:  'Status',
      render: (r) => <span className={clientStatusBadge(r.status)}>{r.status}</span>,
    },
    {
      key:    'created_at',
      label:  'Joined',
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
            onClick={() => navigate(`/clients/${r.id}`)}
            className="p-1.5 rounded-lg transition-colors"
            title="View"
            style={{ color: '#60a5fa' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Eye size={15} />
          </button>

          {r.status === 'active' ? (
            <button
              onClick={() => suspendMutation.mutate(r.id)}
              disabled={suspendMutation.isPending}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Suspend"
              style={{ color: '#fbbf24' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserX size={15} />
            </button>
          ) : (
            <button
              onClick={() => activateMutation.mutate(r.id)}
              disabled={activateMutation.isPending}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-50"
              title="Activate"
              style={{ color: '#34d399' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <UserCheck size={15} />
            </button>
          )}

          <button
                        onClick={() => askConfirm('Delete this client?', () => deleteMutation.mutate(r.id))}
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
        message={error?.message ?? 'Failed to load clients'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
      />
    )
  }

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">

          {/* Search — value from `search` (instant), query uses `debouncedSearch` */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--pb-text-3)' }}
            />
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder="Search clients..."
              className="input pl-9 w-56"
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={handleStatusChange}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Table card
          isFetching (not isLoading) drives the opacity transition:
          - isLoading  = true only on the very first load (no cached data at all)
          - isFetching = true on every background refetch, page change, filter change
          The table skeleton (from the loading prop) shows on first load.
          The opacity fade shows on subsequent navigations, keeping the old rows
          visible while new ones arrive — no blank flash.
      */}
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
            title="No clients"
            description="Try adjusting the search or filters above."
          />
        ) : (
          <>
            <Table columns={columns} data={data?.data ?? []} loading={isFetching} />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Add Client Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Client" size="lg">
        <ClientForm
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['clients'] })
          }}
        />
            </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        message={confirmMessage}
        confirmLabel="Delete"
        destructive
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          const fn = pendingConfirm
          setConfirmOpen(false)
          setPendingConfirm(null)
          fn && fn()
        }}
      />
    </div>
  )
}