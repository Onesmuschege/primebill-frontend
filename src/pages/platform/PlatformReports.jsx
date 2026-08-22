import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  getPlatformRevenueReport,
  getPlatformTenantsReport,
  getPlatformUsageReport,
  exportPlatformReport,
} from '../../api/platform.api'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import Spinner from '../../components/common/Spinner'
import { BarChart3, TrendingUp, Users, Database, Download, BarChart as BarIcon } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const REPORT_TYPES = [
  { key: 'revenue', label: 'Revenue', icon: TrendingUp, needsRange: true },
  { key: 'tenants', label: 'Tenants', icon: Users,     needsRange: true },
  { key: 'usage',   label: 'Usage',   icon: Database,  needsRange: false },
]

// ── Shared style helpers (mirrors the --pb-* tokens used across the app) ────
const mutedText = { color: 'var(--pb-text-3)' }
const chartCursor = { fill: 'rgba(167,139,250,0.08)' }

function StatCard({ label, value, color }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm mt-1" style={mutedText}>{label}</p>
    </div>
  )
}

function ReportTable({ headers, rows, renderRow, emptyMessage = 'No records found.' }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="table w-full text-sm">
        <thead><tr>
          {headers.map(h => <th key={h} style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }}>{h}</th>)}
        </tr></thead>
        <tbody>
          {!rows?.length && (
            <tr><td colSpan={headers.length} className="px-4 py-10 text-center" style={mutedText}>{emptyMessage}</td></tr>
          )}
          {rows?.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  )
}

function PctBar({ value }) {
  const clamped = Math.max(0, Math.min(100, value || 0))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--pb-raised)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamped}%`,
            background: clamped >= 90 ? '#f87171' : clamped >= 70 ? '#fbbf24' : '#a78bfa',
          }}
        />
      </div>
      <span className="text-xs w-12 text-right tabular-nums" style={{ color: 'var(--pb-text-3)' }}>{value}%</span>
    </div>
  )
}
function RevenueReport({ data }) {
  const daily = data?.daily || []
  const byMethod = data?.by_method || {}
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Income" value={formatKES(data?.total)} color="#60a5fa" />
        <StatCard label="Payments" value={formatNumber(data?.count)} color="#a78bfa" />
        {Object.entries(byMethod).map(([method, amount]) => (
          <StatCard key={method} label={method} value={formatKES(amount)} color="#34d399" />
        ))}
      </div>
      {daily.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Daily Revenue (all tenants)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="platRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pb-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatKES(v)} cursor={chartCursor}
                contentStyle={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--pb-text-2)' }} />
              <Area type="monotone" dataKey="amount" stroke="#a78bfa" fill="url(#platRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      <ReportTable
        headers={['Tenant', 'Revenue']}
        rows={data?.by_tenant || []}
        renderRow={(row, i) => (
          <tr key={i}>
            <td className="px-4 py-3" style={{ color: 'var(--pb-text-1)' }}>{row.name}</td>
            <td className="px-4 py-3 font-medium" style={{ color: '#a78bfa' }}>{formatKES(row.amount)}</td>
          </tr>
        )}
      />
    </div>
  )
}

function TenantsReport({ data }) {
  const series = data?.signups_series || []
  const byPlan = data?.by_plan || {}
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Signups" value={formatNumber(data?.signups)} color="#34d399" />
        <StatCard label="Cancelled" value={formatNumber(data?.cancelled)} color="#f87171" />
        <StatCard label="Suspended" value={formatNumber(data?.suspended)} color="#fbbf24" />
        <StatCard label="Plan Changes" value={formatNumber(data?.plan_changes)} color="#60a5fa" />
      </div>
      {series.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Signups per Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pb-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} allowDecimals={false} />
              <Tooltip cursor={chartCursor}
                contentStyle={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--pb-text-2)' }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {Object.keys(byPlan).length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>Signups by Plan</h3>
          <div className="flex items-center gap-2" style={{ color: 'var(--pb-text-2)' }}>
            <BarIcon size={15} style={{ color: '#a78bfa' }} />
            {Object.entries(byPlan).map(([plan, count]) => (
              <span key={plan} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--pb-raised)' }}>
                <span className="capitalize">{plan}</span>
                <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UsageReport({ data }) {
  const rows = data?.rows || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Tenants Tracked" value={formatNumber(data?.total)} color="#a78bfa" />
      </div>
      <ReportTable
        headers={['Tenant', 'Plan', 'Clients', 'Routers', 'API Calls', 'Storage']}
        rows={rows}
        emptyMessage="No tenant usage data."
        renderRow={(row, i) => (
          <tr key={i}>
            <td className="px-4 py-3" style={{ color: 'var(--pb-text-1)' }}>{row.name}</td>
            <td className="px-4 py-3 text-sm capitalize" style={{ color: 'var(--pb-text-2)' }}>{row.plan}</td>
            <td className="px-4 py-3 min-w-40"><PctBar value={row.clients_pct} /></td>
            <td className="px-4 py-3 min-w-40"><PctBar value={row.routers_pct} /></td>
            <td className="px-4 py-3 min-w-40"><PctBar value={row.api_calls_pct} /></td>
            <td className="px-4 py-3 min-w-40"><PctBar value={row.storage_pct} /></td>
          </tr>
        )}
      />
      <p className="text-xs" style={mutedText}>
        Percentages show how close each tenant is to its stored quota limit — client/router counts are real cross-tenant
        tallies; API-call and storage usage come directly from each tenant's stored usage columns.
      </p>
    </div>
  )
}

const RENDERERS = {
  revenue: RevenueReport,
  tenants: TenantsReport,
  usage:   UsageReport,
}

// ── Main Platform Reports Page ───────────────────────────────────────────────
export default function PlatformReports() {
  const [type, setType] = useState('revenue')
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  const needsRange = REPORT_TYPES.find(t => t.key === type)?.needsRange

  const revenueQuery = useQuery({
    queryKey: ['platform-report-revenue', from, to],
    queryFn: () => getPlatformRevenueReport({ from, to }).then(r => r.data.data),
    enabled: type === 'revenue' && !!from && !!to,
  })
  const tenantsQuery = useQuery({
    queryKey: ['platform-report-tenants', from, to],
    queryFn: () => getPlatformTenantsReport({ from, to }).then(r => r.data.data),
    enabled: type === 'tenants' && !!from && !!to,
  })
  const usageQuery = useQuery({
    queryKey: ['platform-report-usage'],
    queryFn: () => getPlatformUsageReport().then(r => r.data.data),
    enabled: type === 'usage',
  })

  const active = type === 'revenue' ? revenueQuery : type === 'tenants' ? tenantsQuery : usageQuery

  const handleExport = async () => {
    if (type === 'usage') { toast.error('Usage report has no CSV export'); return }
    try {
      const res = await exportPlatformReport(type, { from, to })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `platform-${type}-report-${from}-to-${to}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  const ReportRenderer = RENDERERS[type]
  const data = active.data
  const isLoading = active.isLoading

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
          <BarChart3 size={18} style={{ color: '#a78bfa' }} />
          Platform Reports
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
          Cross-tenant aggregates across every ISP on PrimeBill — real stored data, nothing fabricated.
        </p>
      </div>

      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {REPORT_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={type === key
                ? { backgroundColor: '#7c3aed', color: '#fff' }
                : { backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {needsRange && (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm py-1.5 w-36" />
              <span style={mutedText}>to</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm py-1.5 w-36" />
            </>
          )}
          <button onClick={handleExport} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20"><Spinner size="lg" /></div>
      ) : data ? (
        <ReportRenderer data={data} />
      ) : (
        <div className="card text-center py-16" style={mutedText}>
          No data found for the selected report.
        </div>
      )}
    </div>
  )
}

