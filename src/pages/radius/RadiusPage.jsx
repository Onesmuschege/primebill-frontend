import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRadiusSessions, getRadiusStats } from '../../api/radius.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import { formatDateTime } from '../../utils/formatDate'
import { Search, Radio, Wifi } from 'lucide-react'

function formatBytes(mb) {
  if (!mb) return '0 MB'
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(0)} MB`
}

function formatDuration(seconds) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function RadiusPage() {
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['radius-sessions', page, search],
    queryFn: () => getRadiusSessions({ page, search, per_page: 20 }),
  })

  const { data: stats } = useQuery({
    queryKey: ['radius-stats'],
    queryFn: () => getRadiusStats(),
  })

  const sessions = data?.data ?? []

  const columns = [
    { key: 'username',    label: 'Username',   render: (r) => (
      <span className="font-mono text-sm font-medium">{r.username}</span>
    )},
    { key: 'nas_ip',     label: 'NAS IP',     render: (r) => (
      <span className="font-mono text-xs text-gray-500">{r.nas_ip_address || '—'}</span>
    )},
    { key: 'framed_ip',  label: 'Framed IP',  render: (r) => (
      <span className="font-mono text-xs text-gray-500">{r.framed_ip_address || '—'}</span>
    )},
    { key: 'upload',     label: 'Upload',     render: (r) => formatBytes(r.acct_input_octets / 1048576) },
    { key: 'download',   label: 'Download',   render: (r) => formatBytes(r.acct_output_octets / 1048576) },
    { key: 'duration',   label: 'Duration',   render: (r) => formatDuration(r.acct_session_time) },
    { key: 'status',     label: 'Status',     render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        r.acct_stop_time ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
      }`}>
        {r.acct_stop_time ? 'Stopped' : 'Active'}
      </span>
    )},
    { key: 'start_time', label: 'Start Time', render: (r) => (
      <span className="text-xs text-gray-500">{formatDateTime(r.acct_start_time)}</span>
    )},
  ]

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load RADIUS sessions'}
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Active Sessions', value: stats.active_sessions || 0,  color: 'text-green-600', icon: Wifi },
            { label: 'Total Sessions',  value: stats.total_sessions || 0,   color: 'text-gray-800',  icon: Radio },
            { label: 'Unique Users',    value: stats.unique_users || 0,     color: 'text-blue-600',  icon: Radio },
          ].map(({ label, value, color,
            // eslint-disable-next-line no-unused-vars -- used in JSX below
            icon: Icon }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gray-50 ${color}`}><Icon size={20} /></div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search by username..."
            className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
      </div>

            <div className="card p-0 overflow-hidden">
        {isLoading && sessions.length === 0 ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Wifi}
            title="No RADIUS sessions"
            description="No sessions match the current search."
          />
        ) : (
          <>
            <Table columns={columns} data={sessions} loading={isLoading} />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}