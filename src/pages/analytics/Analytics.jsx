import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import api from '../../api/axiosInstance'
import Spinner from '../../components/common/Spinner'
import { TrendingUp, Users, DollarSign, Wifi } from 'lucide-react'

const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

const KES = (n) => `KES ${Number(n || 0).toLocaleString()}`

export default function Analytics() {
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['analytics-income'],
    queryFn: () => api.get('/analytics/income').then(r => r.data.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
  })

  if (incomeLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const planDist = stats?.plan_distribution || []

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Revenue trends, client growth, and plan distribution</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: DollarSign, label: 'Revenue This Month', value: KES(stats?.income_month?.amount), color: 'stat-accent-blue' },
          { icon: TrendingUp, label: 'Revenue Today',      value: KES(stats?.income_today?.amount), color: 'stat-accent-cyan' },
          { icon: Users,      label: 'Total Clients',      value: stats?.total_users || 0,          color: 'stat-accent-green' },
          { icon: Wifi,       label: 'Active Users',       value: stats?.active_users || 0,         color: 'stat-accent-purple' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className={`card ${color}`}>
            <div className="flex items-center gap-3">
              <Icon size={20} style={{ color: '#60a5fa' }} />
              <div>
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-2)' }}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly income bar chart */}
      <div className="card">
        <h3 className="font-semibold mb-4">Monthly Revenue</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={income?.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={v => KES(v)}
              cursor={{ fill: 'rgba(37,99,235,0.08)' }}
              contentStyle={{
                background: 'var(--pb-surface)',
                border: '1px solid var(--pb-border)',
                borderRadius: '8px',
                color: 'var(--pb-text-1)',
              }}
            />
            <Bar dataKey="total" fill="#2563eb" radius={[4,4,0,0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client growth area chart */}
        <div className="card">
          <h3 className="font-semibold mb-4">Client Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={income?.client_growth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'currentColor' }} />
              <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} />
              <Tooltip contentStyle={{
                background: 'var(--pb-surface)',
                border: '1px solid var(--pb-border)',
                borderRadius: '8px',
              }} />
              <Area type="monotone" dataKey="count" stroke="#06b6d4"
                fill="rgba(6,182,212,0.12)" name="New Clients" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution pie */}
        <div className="card">
          <h3 className="font-semibold mb-4">Plan Distribution</h3>
          {planDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={planDist} dataKey="count" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`}>
                  {planDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{
                  background: 'var(--pb-surface)',
                  border: '1px solid var(--pb-border)',
                  borderRadius: '8px',
                }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center"
              style={{ color: 'var(--pb-text-3)' }}>No plan data available</div>
          )}
        </div>
      </div>

      {/* Payment method breakdown */}
      <div className="card">
        <h3 className="font-semibold mb-4">Payment Methods</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={income?.payment_methods || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }}
              tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="method" tick={{ fontSize: 11, fill: 'currentColor' }} />
            <Tooltip formatter={v => KES(v)} cursor={{ fill: 'rgba(37,99,235,0.08)' }} contentStyle={{
              background: 'var(--pb-surface)',
              border: '1px solid var(--pb-border)',
              borderRadius: '8px',
            }} />
            <Bar dataKey="total" radius={[0,4,4,0]} name="Amount">
              {(income?.payment_methods || []).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}