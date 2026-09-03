import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNetworkCommand } from '../../hooks/useNetworkCommand'
import EntityHeader from '../../components/ops/EntityHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { formatBytes } from '../../utils/formatBytes'
import { timeAgo } from '../../utils/formatDate'
import {
  Wifi, WifiOff, Server, Activity, AlertTriangle, Clock,
  Radio, Users, Zap, Shield, ChevronRight,
} from 'lucide-react'

function HealthCard({ icon, label, value, sub, tone }) {
  const Icon = icon
  const colors = {
    success: { fg: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    danger: { fg: '#f87171', bg: 'rgba(248,113,113,0.12)' },
    warning: { fg: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    info: { fg: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
    muted: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  }
  const c = colors[tone] || colors.info
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg" style={{ background: c.bg }}>
        <Icon size={18} style={{ color: c.fg }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
        <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{label}{sub && <span className="ml-1 font-medium">{sub}</span>}</p>
      </div>
    </div>
  )
}

function SectionHeader({ title, count, icon: Icon }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={16} style={{ color: 'var(--pb-text-3)' }} />}
      <h3 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>{title}</h3>
      {count > 0 && (
        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>{count}</span>
      )}
    </div>
  )
}

export default function NetworkCommandCenter() {
  const navigate = useNavigate()
  const {
    overview, routerHealth, routers, sessions, events, incidents,
    loading, counts,
  } = useNetworkCommand()

  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'routers', label: 'Routers', count: counts.offlineRouters },
    { key: 'sessions', label: 'Sessions', counts: null },
    { key: 'events', label: 'Events' },
    { key: 'incidents', label: 'Incidents', count: counts.openIncidents },
  ]

  return (
    <div className="space-y-6">
      <EntityHeader
        title="Network Command Center"
        subtitle="Infrastructure health, connectivity, and incidents"
        icon={Radio}
        meta={[
          { label: 'Routers', value: `${routerHealth.online}/${routerHealth.total}` },
          { label: 'Sessions', value: counts.activeSessions },
        ]}
        lastUpdated={overview.last_updated ? `Updated ${timeAgo(overview.last_updated)}` : loading ? 'Loading…' : undefined}
      />

      {/* Health cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <HealthCard icon={Wifi} label="Routers Online" value={`${routerHealth.pct}%`} sub={`${routerHealth.online}/${routerHealth.total}`} tone={routerHealth.pct >= 90 ? 'success' : routerHealth.pct >= 70 ? 'warning' : 'danger'} />
        <HealthCard icon={WifiOff} label="Routers Offline" value={counts.offlineRouters} tone={counts.offlineRouters === 0 ? 'success' : 'danger'} />
        <HealthCard icon={Users} label="Active Sessions" value={counts.activeSessions} tone="info" />
        <HealthCard icon={Shield} label="Auth Failures" value={counts.authFailures} tone={counts.authFailures === 0 ? 'success' : 'warning'} />
        <HealthCard icon={Zap} label="Provisioning Failures" value={counts.provisioningFailures} tone={counts.provisioningFailures === 0 ? 'success' : 'danger'} />
        <HealthCard icon={AlertTriangle} label="Open Incidents" value={counts.openIncidents} tone={counts.openIncidents === 0 ? 'success' : 'warning'} />
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'var(--pb-border)' }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-1.5"
              style={{ color: activeTab === tab.key ? '#818cf8' : 'var(--pb-text-3)', borderBottom: activeTab === tab.key ? '2px solid #818cf8' : '2px solid transparent' }}>
              {tab.label}
              {tab.count > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>{tab.count}</span>}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'overview' && <OverviewTab overview={overview} loading={loading} />}
          {activeTab === 'routers' && <RoutersTab routers={routers} loading={loading} onNavigate={navigate} />}
          {activeTab === 'sessions' && <SessionsTab sessions={sessions} loading={loading} />}
          {activeTab === 'events' && <EventsTab events={events} loading={loading} />}
          {activeTab === 'incidents' && <IncidentsTab incidents={incidents} loading={loading} onNavigate={navigate} />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ overview, loading }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  const alerts = overview.alerts || {}
  const sessions = overview.sessions || {}
  const hasAlerts = alerts.provisioning_failures > 0 || alerts.suspended_services > 0 || alerts.coa_failures > 0
  return (
    <div className="space-y-6">
      {hasAlerts && (
        <div>
          <SectionHeader title="Requires Attention" icon={AlertTriangle} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alerts.provisioning_failures > 0 && (
              <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(248,113,113,0.08)' }}>
                <div><p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Provisioning Failures</p><p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Last 24h</p></div>
                <span className="text-lg font-bold" style={{ color: '#f87171' }}>{alerts.provisioning_failures}</span>
              </div>
            )}
            {alerts.suspended_services > 0 && (
              <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(251,191,36,0.08)' }}>
                <div><p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Suspended Services</p><p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Billing</p></div>
                <span className="text-lg font-bold" style={{ color: '#fbbf24' }}>{alerts.suspended_services}</span>
              </div>
            )}
            {alerts.coa_failures > 0 && (
              <div className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'rgba(248,113,113,0.08)' }}>
                <div><p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>CoA Failures</p><p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Last 24h</p></div>
                <span className="text-lg font-bold" style={{ color: '#f87171' }}>{alerts.coa_failures}</span>
              </div>
            )}
          </div>
        </div>
      )}
      <div>
        <SectionHeader title="Traffic" icon={Activity} />
        <div className="p-3 rounded-lg flex items-center gap-3" style={{ background: 'var(--pb-raised)' }}>
          <Activity size={16} style={{ color: '#60a5fa' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Total Active Traffic</p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{formatBytes(sessions.traffic_bytes || 0)} across {sessions.total_active || 0} sessions</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoutersTab({ routers, loading, onNavigate }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (routers.length === 0) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No routers found.</p>
  return (
    <div className="space-y-2">
      {routers.map((r) => {
        const online = r.status === 'online'
        return (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded" style={{ background: online ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' }}>
                {online ? <Wifi size={14} style={{ color: '#34d399' }} /> : <WifiOff size={14} style={{ color: '#f87171' }} />}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{r.name || r.ip_address}</p>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{r.ip_address} · {r.type || 'mikrotik'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{r.last_seen ? timeAgo(r.last_seen) : 'Never'}</span>
              <StatusBadge status={r.status} />
              <button onClick={() => onNavigate(`/routers/${r.id}`)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>View</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SessionsTab({ sessions, loading }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (sessions.length === 0) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No active sessions.</p>
  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <Users size={16} style={{ color: '#60a5fa' }} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{s.username || s.account?.username}</p>
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{s.account?.client?.first_name} {s.account?.client?.last_name} · {s.ip_address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-right">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--pb-text-2)' }}>{formatBytes((s.bytes_in || 0) + (s.bytes_out || 0))}</p>
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{s.access_method}</p>
            </div>
            <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{timeAgo(s.session_start)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EventsTab({ events, loading }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (events.length === 0) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No network events.</p>
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded" style={{ background: e.severity === 'critical' ? 'rgba(248,113,113,0.12)' : e.severity === 'warning' ? 'rgba(251,191,36,0.12)' : 'rgba(96,165,250,0.12)' }}>
              <AlertTriangle size={14} style={{ color: e.severity === 'critical' ? '#f87171' : e.severity === 'warning' ? '#fbbf24' : '#60a5fa' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{e.event_type}</p>
              <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{e.description || e.message || '—'}</p>
            </div>
          </div>
          <span className="text-xs shrink-0" style={{ color: 'var(--pb-text-3)' }}>{timeAgo(e.created_at)}</span>
        </div>
      ))}
    </div>
  )
}

function IncidentsTab({ incidents, loading, onNavigate }) {
  if (loading) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Loading…</p>
  if (incidents.length === 0) return <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No open incidents.</p>
  return (
    <div className="space-y-2">
      {incidents.map((inc) => (
        <div key={inc.id} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--pb-raised)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded" style={{ background: inc.severity === 'critical' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)' }}>
              <AlertTriangle size={14} style={{ color: inc.severity === 'critical' ? '#f87171' : '#fbbf24' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--pb-text-1)' }}>{inc.title}</p>
              <p className="text-xs truncate" style={{ color: 'var(--pb-text-3)' }}>{inc.description || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={inc.status} />
            <button onClick={() => onNavigate(`/incidents/${inc.id}`)} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>View</button>
          </div>
        </div>
      ))}
    </div>
  )
}
