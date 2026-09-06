import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPlatformRevenueAnalytics } from '../../api/platform.api'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/common/Spinner'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import { DollarSign, TrendingUp, TrendingDown, Users, CreditCard, AlertTriangle, BarChart3 } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const mutedText = { color: "var(--pb-text-3)" }
const chartGrid = { strokeDasharray: "3 3", stroke: "rgba(148,163,184,0.15)" }
const COLORS = ["#a78bfa", "#34d399", "#60a5fa", "#fbbf24", "#f87171"]

function CurrencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="card px-3 py-2 text-xs">
      <p className="font-medium mb-1" style={{ color: "var(--pb-text-1)" }}>{label}</p>
      <p style={{ color: "var(--pb-text-2)" }}>{formatKES(payload[0].value)}</p>
    </div>
  )
}

export default function PlatformSubscriptionAnalytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['platform-revenue-analytics'],
    queryFn: () => getPlatformRevenueAnalytics(),
    refetchInterval: 60000,
    meta: { onError: () => toast.error('Failed to load revenue analytics') },
  })

  if (isLoading) return <div className="flex justify-center items-center py-16"><Spinner size="lg" /></div>
  if (error || !data?.data) return <div className="card text-center py-16" style={mutedText}>Failed to load analytics.</div>

  const a = data.data
  const mrr = a.mrr || {}
  const trend = a.monthly_trend || []
  const byPlan = a.by_plan || []
  const invoiceStatus = a.invoice_status || {}
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "var(--pb-text-1)" }}>Revenue Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--pb-text-2)" }}>PrimeBill revenue metrics and subscription trends across all tenants.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="MRR" value={formatKES(mrr.mrr ?? 0)} subtitle={`ARR ${formatKES(mrr.arr ?? 0)}`} icon={DollarSign} color="green" trend={mrr.new_this_month > 0 ? `+${formatKES(mrr.new_this_month)} new` : undefined} trendDir="up" />
        <StatCard title="Active Subscriptions" value={formatNumber(mrr.active_count ?? 0)} subtitle={`${formatNumber(mrr.trial_count ?? 0)} in trial`} icon={Users} color="blue" />
        <StatCard title="New This Month" value={formatKES(mrr.new_this_month ?? 0)} subtitle="MRR from new subscriptions" icon={TrendingUp} color="cyan" />
        <StatCard title="Churned This Month" value={formatKES(mrr.churned_this_month ?? 0)} subtitle="MRR lost to churn" icon={TrendingDown} color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="card">
          <h3 className="font-semibold px-6 pt-5 pb-2" style={{ color: "var(--pb-text-1)" }}>12-Month Revenue Trend</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: "var(--pb-text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--pb-text-3)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `KES ${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#a78bfa" strokeWidth={2} fill="url(#revGrad)" name="Revenue" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center text-sm" style={mutedText}>No paid invoice data yet.</div>
          )}
        </div>
        {/* Revenue by Plan */}
        <div className="card">
          <h3 className="font-semibold px-6 pt-5 pb-2" style={{ color: "var(--pb-text-1)" }}>Revenue by Plan</h3>
          {byPlan.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byPlan} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="plan_name" tick={{ fontSize: 10, fill: "var(--pb-text-3)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--pb-text-3)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `KES ${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CurrencyTooltip />} />
                <Bar dataKey="revenue" radius={[4,4,0,0]} name="Revenue">
                  {byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-16 text-center text-sm" style={mutedText}>No plan revenue data yet.</div>
          )}
        </div>
      </div>

      {/* Invoice Status Summary */}
      <div className="card">
        <h3 className="font-semibold px-6 pt-5 pb-3" style={{ color: "var(--pb-text-1)" }}>Invoice Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 px-6 pb-5">
          {Object.entries(invoiceStatus).map(([status, info]) => (
            <div key={status} className="text-center rounded-lg p-3" style={{ background: "var(--pb-raised)" }}>
              <p className="text-xs font-medium uppercase tracking-wider" style={mutedText}>{status}</p>
              <p className="text-lg font-bold" style={{ color: "var(--pb-text-1)" }}>{formatNumber(info?.count ?? 0)}</p>
              <p className="text-xs" style={mutedText}>{formatKES(info?.total ?? 0)}</p>
            </div>
          ))}
          {Object.keys(invoiceStatus).length === 0 && <p className="col-span-full text-center text-sm" style={mutedText}>No invoice data.</p>}
        </div>
      </div>
    </div>
  )
}
