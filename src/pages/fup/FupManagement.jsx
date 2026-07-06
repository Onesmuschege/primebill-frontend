import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RotateCcw, AlertTriangle, Zap } from 'lucide-react'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { useState } from 'react'

export default function FupManagement() {
  const [page, setPage] = useState(1)
  const qc = useQueryClient()

  const { data: statsData } = useQuery({
    queryKey: ['fup-stats'],
    queryFn: () => api.get('/fup/stats').then(r => r.data.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['fup-accounts', page],
    queryFn: () =>
      api.get('/fup/logs', {
        params: {
          page,
        },
      }).then(r => r.data.data),
  })

  const resetMutation = useMutation({
    mutationFn: (accountId) => api.post(`/fup/reset/${accountId}`),

    onSuccess: (r) => {
      toast.success(r.data.message)

      qc.invalidateQueries({
        queryKey: ['fup-accounts'],
      })

      qc.invalidateQueries({
        queryKey: ['fup-stats'],
      })
    },

    onError: () => {
      toast.error('Failed to reset FUP')
    },
  })

  const columns = [
    {
      key: 'username',
      label: 'Username',
      render: row => (
        <span className="font-mono text-sm font-medium">
          {row.username}
        </span>
      ),
    },

    {
      key: 'client',
      label: 'Client',
      render: row =>
        row.client
          ? `${row.client.first_name ?? ''} ${row.client.last_name ?? ''}`.trim()
          : '-',
    },

    {
      key: 'plan',
      label: 'Plan',
      render: row => row.plan?.name ?? '-',
    },

    {
      key: 'fup',
      label: 'FUP Cap',
      render: row =>
        row.plan?.fup_limit
          ? `${row.plan.fup_limit} GB`
          : 'Unlimited',
    },

    {
      key: 'speed',
      label: 'Speed',
      render: row =>
        row.plan?.speed_down
          ? `${(row.plan.speed_down / 1024).toFixed(0)} Mbps`
          : '—',
    },

    {
      key: 'status',
      label: 'Status',
      render: row => (
        <span
          className={
            row.status === 'active'
              ? 'badge badge-active'
              : 'badge badge-suspended'
          }
        >
          {row.status}
        </span>
      ),
    },

    {
      key: 'actions',
      label: '',
      render: row => (
        <button
          onClick={() => resetMutation.mutate(row.id)}
          className="btn-secondary text-xs flex items-center gap-1"
          disabled={resetMutation.isPending}
        >
          <RotateCcw size={12} />
          Reset FUP
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            FUP Management
          </h1>

          <p className="page-subtitle">
            Fair Usage Policy — monitor and reset client data caps
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card stat-accent-orange">
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={20}
              style={{ color: '#f59e0b' }}
            />

            <div>
              <p className="text-2xl font-bold">
                {statsData?.throttled_events_this_month ?? 0}
              </p>

              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--pb-text-2)' }}
              >
                Throttle Events This Month
              </p>
            </div>
          </div>
        </div>

        <div className="card stat-accent-blue">
          <div className="flex items-center gap-3">
            <Zap
              size={20}
              style={{ color: '#60a5fa' }}
            />

            <div>
              <p className="text-2xl font-bold">
                {statsData?.affected_accounts ?? 0}
              </p>

              <p
                className="text-xs mt-0.5"
                style={{ color: 'var(--pb-text-2)' }}
              >
                Accounts Affected
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="section-header">
          <span className="section-title">
            Accounts with FUP Plans
          </span>
        </div>

        <Table
          columns={columns}
          data={data?.data ?? []}
          loading={isLoading}
        />

        <Pagination
          meta={data?.meta}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}