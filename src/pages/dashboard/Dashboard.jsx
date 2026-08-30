import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getTopDownloaders, getTrafficData } from '../../api/dashboard.api'
import StatCard from '../../components/dashboard/StatCard'
import DashboardListSection from '../../components/dashboard/DashboardListSection'
import { DASHBOARD_LIMITS } from '../../utils/dashboardLimits'
import { formatKES } from '../../utils/formatCurrency'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Wifi, Ticket, Activity } from 'lucide-react'
import Spinner from '../../components/common/Spinner'
import ErrorState from '../../components/common/ErrorState'

// Format ISO timestamp → "Jun 25 14:00"
function formatTrafficTime(raw) {
  if (!raw) return ''
  try {
    const d = new Date(raw)
    return d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })
      + ' ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return raw
  }
}

const mutedText = { color: 'var(--pb-text-3)' }
const chartCursor = { fill: 'rgba(37,99,235,0.08)' }

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErr, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    refetchInterval: 30000,
  })

  const { data: traffic } = useQuery({
    queryKey: ['dashboard-traffic'],
    queryFn: () => getTrafficData('day'),
    refetchInterval: 60000,
  })

  // Server-side limit: the widget only ever receives its render budget from
  // the API (validated 1–50 on the backend). This is a leaderboard of LIVE
  // radius sessions — there is no meaningful grand total, so the widget shows
  // a top-N ranking with a "View all" link to the RADIUS page instead.
  const { data: downloaders, isLoading: downloadersLoading } = useQuery({
    queryKey: ['top-downloaders', DASHBOARD_LIMITS.topDownloaders],
    queryFn: () => getTopDownloaders(DASHBOARD_LIMITS.topDownloaders),
  })

  if (statsError) {
    return (
      <ErrorState
        message={statsErr?.message ?? 'Failed to load dashboard'}
        onRetry={() => refetchStats()}
      />
    )
  }

  if (statsLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const stats = statsData

  // Format traffic data — shorten X-axis labels
  const trafficData = (traffic?.[0]?.traffic || []).map(point => ({
    ...point,
    timeLabel: formatTrafficTime(point.time),
  }))

  return (
    <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Income Today"
          value={formatKES(stats?.income_today?.amount)}
          subtitle={`${stats?.income_today?.count} payments`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Income This Month"
          value={formatKES(stats?.income_month?.amount)}
          subtitle={`${stats?.income_month?.count} payments`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users || 0}
          subtitle={`of ${stats?.total_users} total`}
          icon={Wifi}
          color="primary"
        />
        <StatCard
          title="Total Clients"
          value={stats?.total_users || 0}
          subtitle={`${stats?.account_status?.overdue} overdue`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Tickets, Account Status, SMS Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Tickets */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <Ticket size={18} />
            Tickets
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Open',    value: stats?.tickets?.open,    color: '#f87171' },
              { label: 'Pending', value: stats?.tickets?.pending, color: '#fbbf24' },
              { label: 'Solved',  value: stats?.tickets?.solved,  color: '#34d399' },
              { label: 'Total',   value: stats?.tickets?.total,   color: '#60a5fa' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--pb-raised)' }}>
                <p className="text-2xl font-bold" style={{ color }}>{value || 0}</p>
                <p className="text-xs mt-1" style={mutedText}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Account Status */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <Activity size={18} />
            Account Status
          </h3>
          <div className="space-y-3">
            {/* Online + Offline are a network-layer partition of total_clients */}
            {[
              { label: 'Online',  value: stats?.account_status?.online,  color: '#34d399' },
              { label: 'Offline', value: stats?.account_status?.offline, color: 'var(--pb-text-3)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{label}</span>
                </div>
                <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{value || 0}</span>
              </div>
            ))}
          </div>
          {/* Overdue is a billing-status count, not part of the online/offline
              split above — it can overlap with either, so it's shown as a
              separate figure rather than a third slice of the same total. */}
          <div
            className="mt-3 pt-3 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--pb-border)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f87171' }} />
              <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
                Overdue billing
                <span className="block text-xs" style={mutedText}>of {stats?.account_status?.total_clients ?? stats?.total_users ?? 0} total clients</span>
              </span>
            </div>
            <span className="font-semibold" style={{ color: '#f87171' }}>{stats?.account_status?.overdue || 0}</span>
          </div>
        </div>

        {/* SMS Stats */}
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>SMS Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Sent Today</span>
              <span className="font-semibold" style={{ color: '#34d399' }}>
                {stats?.sms_stats?.sent_today || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Failed</span>
              <span className="font-semibold" style={{ color: '#f87171' }}>
                {stats?.sms_stats?.failed || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Daily Network Traffic</h3>
        {trafficData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pb-border)" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }}
                interval={Math.floor(trafficData.length / 8)}
              />
              <YAxis tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <Tooltip
                cursor={chartCursor}
                contentStyle={{
                  backgroundColor: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '8px',
                  color: 'var(--pb-text-1)',
                }}
                labelStyle={{ color: 'var(--pb-text-2)' }}
              />
              <Area type="monotone" dataKey="tx_mbps" stroke="#34d399" fill="#34d399" fillOpacity={0.15} name="Upload Mbps" />
              <Area type="monotone" dataKey="rx_mbps" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} name="Download Mbps" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center" style={mutedText}>
            No traffic data available — connect a router to see live data
          </div>
        )}
      </div>

      {/* Top Downloaders — top-N leaderboard of live sessions (no grand total) */}
      <DashboardListSection
        title="Top Downloaders"
        icon={Activity}
        items={downloaders}
        limit={DASHBOARD_LIMITS.topDownloaders}
        isLoading={downloadersLoading}
        viewAllTo="/radius"
        emptyMessage="No active sessions"
        renderItem={(d, i) => (
          <div key={i} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid var(--pb-border)' }}>
            <span className="w-5 shrink-0 text-xs font-semibold" style={{ color: 'var(--pb-text-3)' }}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{d.username}</p>
              <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{d.client}</p>
            </div>
            <span className="text-xs shrink-0" style={{ color: '#60a5fa' }}>↓ {d.downloaded}</span>
            <span className="text-xs shrink-0" style={{ color: '#34d399' }}>↑ {d.uploaded}</span>
          </div>
        )}
      />

    </div>
  )
}