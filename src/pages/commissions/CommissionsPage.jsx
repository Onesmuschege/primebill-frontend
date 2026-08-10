import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getCommissions, getCommissionSummary, approveCommission, payCommission,
} from '../../api/commissions.api'
import Table from '../../components/common/Table'
import Spinner from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { formatKES as money } from '../../utils/formatCurrency'

const STATUS_VARIANT = {
  pending: 'pending',
  approved: 'active',
  paid: 'paid',
  rejected: 'suspended',
}

const Stat = ({ label, value }) => (
  <div className="card p-4">
    <div className="text-xl font-semibold" style={{ color: 'var(--pb-text-1)' }}>{value ?? '—'}</div>
    <div className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{label}</div>
  </div>
)

export default function CommissionsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const list = useQuery({
    queryKey: ['commissions', page, status],
    queryFn: async () => {
      const res = await getCommissions({ page, per_page: 20, status: status || undefined })
      const body = res.data?.data
      const data = body?.data ?? (Array.isArray(body) ? body : [])
      const meta = body?.meta ?? body ?? {}
      return { data, meta }
    },
  })
  const summary = useQuery({
    queryKey: ['commissions-summary'],
    queryFn: async () => {
      const res = await getCommissionSummary()
      return res.data?.data ?? res.data
    },
  })

  const act = useMutation({
    mutationFn: ({ type, id, ...rest }) =>
      type === 'approve'
        ? approveCommission(id)
        : payCommission(id, rest),
    onSuccess: () => {
      toast.success('Commission updated')
      qc.invalidateQueries(['commissions'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Action failed'),
  })

  const s = summary.data || {}

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Sales Commissions</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Track, approve and pay sales commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Total Earned" value={money(s.total_earned)} />
        <Stat label="Pending" value={money(s.pending)} />
        <Stat label="Paid" value={money(s.paid)} />
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="input text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          loading={list.isLoading}
          data={list.data?.data || []}
          emptyMessage="No commissions found"
          columns={[
            { key: 'id', label: 'ID' },
            {
              key: 'client',
              label: 'Client',
              render: (r) => r.client?.full_name || r.client?.name || '—',
            },
            {
              key: 'amount',
              label: 'Amount',
              render: (r) => <span className="font-semibold">{money(r.amount)}</span>,
            },
            {
              key: 'commission_rate',
              label: 'Rate',
              render: (r) => (r.commission_rate != null ? `${Number(r.commission_rate)}%` : '—'),
            },
            {
              key: 'status',
              label: 'Status',
              render: (r) => <Badge label={r.status || 'pending'} variant={STATUS_VARIANT[r.status] || 'pending'} />,
            },
            {
              key: 'created_at',
              label: 'Date',
              render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'),
            },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {r.status === 'pending' && (
                    <button
                      onClick={() => act.mutate({ type: 'approve', id: r.id })}
                      className="px-2.5 py-1 rounded-lg text-xs text-white"
                      style={{ background: '#2563eb' }}
                    >Approve</button>
                  )}
                  {(r.status === 'approved' || r.status === 'paid') && (
                    <button
                      onClick={() => act.mutate({ type: 'pay', id: r.id })}
                      disabled={act.isPending && r.status === 'paid'}
                      className="px-2.5 py-1 rounded-lg text-xs text-white"
                      style={{ background: r.status === 'paid' ? '#6b7280' : '#10b981' }}
                    >{r.status === 'paid' ? 'Paid' : 'Mark Paid'}</button>
                  )}
                </div>
              ),
            },
          ]}
        />
        <Pagination meta={list.data?.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}
