import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getTopDownloaders, getTrafficData } from '../../api/dashboard.api'
import StatCard from '../../components/dashboard/StatCard'
import { formatKES } from '../../utils/formatCurrency'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Wifi, Ticket, Activity } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

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
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const { data: traffic } = useQuery({
    queryKey: ['dashboard-traffic'],
    queryFn: () => getTrafficData('day').then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: downloaders } = useQuery({
    queryKey: ['top-downloaders'],
    queryFn: () => getTopDownloaders().then(r => r.data.data),
  })

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
            {[
              { label: 'Online',  value: stats?.account_status?.online,  color: '#34d399' },
              { label: 'Offline', value: stats?.account_status?.offline, color: 'var(--pb-text-3)' },
              { label: 'Overdue', value: stats?.account_status?.overdue, color: '#f87171' },
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

      {/* Top Downloaders */}
      <div className="card p-0 overflow-hidden">
        <h3 className="font-semibold px-5 pt-5 pb-1" style={{ color: 'var(--pb-text-1)' }}>Top Downloaders</h3>
        {downloaders && downloaders.length > 0 ? (
          <table className="table w-full text-sm mt-3">
            <thead>
              <tr>
                {['#', 'Username', 'Client', 'Downloaded', 'Uploaded'].map(h => (
                  <th key={h} style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {downloaders.map((d, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--pb-text-3)', borderBottom: '1px solid var(--pb-border)' }} className="px-4 py-2">{i + 1}</td>
                  <td style={{ color: 'var(--pb-text-1)', borderBottom: '1px solid var(--pb-border)' }} className="px-4 py-2 font-medium">{d.username}</td>
                  <td style={{ color: 'var(--pb-text-2)', borderBottom: '1px solid var(--pb-border)' }} className="px-4 py-2">{d.client}</td>
                  <td style={{ color: '#60a5fa', borderBottom: '1px solid var(--pb-border)' }} className="px-4 py-2">{d.downloaded}</td>
                  <td style={{ color: '#34d399', borderBottom: '1px solid var(--pb-border)' }} className="px-4 py-2">{d.uploaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-8" style={mutedText}>No active sessions</p>
        )}
      </div>

    </div>
  )
}