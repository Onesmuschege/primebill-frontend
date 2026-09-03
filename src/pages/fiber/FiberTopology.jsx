import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { getOlt } from '../../api/fiber.api'
import EntityHeader from '../../components/ops/EntityHeader'
import RelationshipNav from '../../components/ops/RelationshipNav'
import ErrorState from '../../components/common/ErrorState'
import Skeleton from '../../components/common/Skeleton'
import { genericStatusTone } from '../../utils/statusMeta'
import { timeAgo } from '../../utils/formatDate'
import { Network, Radio, User, MapPin, Cpu } from 'lucide-react'

/**
 * FiberTopology — OLT → PON → ONT relationship visualisation (P2 §23).
 *
 * Data is the REAL OltController::show payload: the OLT record with
 * ponPorts (each carrying onts_count / registered_onts / max_onts) and
 * onts (each carrying serial, mac_address, rx/tx_signal, status,
 * pon_port_id and clientAccount:{id,username}).
 *
 * ONTs without a pon_port_id are rendered as Unassigned — never silently
 * attached to a port. Clicking an ONT's linked account deep-links to the
 * Service 360 workspace when one exists; no link is fabricated otherwise.
 */

const signalClass = (rx) => (rx == null ? 'text-slate-400' : rx >= -25 ? 'text-emerald-500' : rx >= -27 ? 'text-amber-500' : 'text-red-500')
const signalLabel = (rx) => (rx == null ? '—' : `${rx} dBm`)

function OntNode({ ont }) {
  const linked = ont.clientAccount
  return (
    <div className="border rounded-lg p-3 text-xs space-y-1" style={{ borderColor: 'var(--pb-border)', background: 'var(--pb-raised)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-medium" style={{ color: 'var(--pb-text-1)' }}>{ont.serial || `ONT #${ont.id}`}</span>
        <span className={`badge ${
          ont.status === 'online' ? 'badge-active'
          : ont.status === 'offline' ? 'badge-suspended'
          : 'bg-slate-100 text-slate-500'
        }`}>{ont.status || 'unknown'}</span>
      </div>
      <div style={{ color: 'var(--pb-text-3)' }}>
        {ont.vendor || ont.model ? `${ont.vendor || ''} ${ont.model || ''}`.trim() : '—'}
        {ont.mac_address ? ` · ${ont.mac_address}` : ''}
      </div>
      <div className="flex items-center gap-3">
        <span>Rx <span className={signalClass(ont.rx_signal)}>{signalLabel(ont.rx_signal)}</span></span>
        {linked ? (
          <Link
            to={`/subscribers/services/${linked.id}`}
            className="inline-flex items-center gap-1 font-medium hover:underline"
            style={{ color: '#818cf8' }}
            title="Open the linked service workspace"
          >
            <User size={11} /> {linked.username}
          </Link>
        ) : (
          <span title="Not linked to a service account">unlinked</span>
        )}
      </div>
      {ont.last_seen && (
        <div className="text-[10px]" style={{ color: 'var(--pb-text-3)' }}>
          seen {timeAgo(ont.last_seen)}
        </div>
      )}
    </div>
  )
}

function PonPortNode({ port, onts }) {
  return (
    <div className="space-y-2">
      <div className="border rounded-lg p-3" style={{ borderColor: 'rgba(96,165,250,0.4)', background: 'rgba(96,165,250,0.06)' }}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--pb-text-1)' }}>
            <Radio size={12} style={{ color: '#60a5fa' }} /> {port.name || `PON #${port.id}`}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            port.status === 'active' ? 'badge-active' : 'badge-suspended'
          }`}>{port.status}</span>
        </div>
        <div className="mt-1 text-[11px]" style={{ color: 'var(--pb-text-3)' }}>
          {port.technology || '—'} · {port.registered_onts != null ? `${port.registered_onts}/${port.max_onts ?? '∞'} ONTs` : `${onts.length} ONTs`}
          {port.onts_count != null && ` · ${port.onts_count} in tree`}
        </div>
      </div>
      {onts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-3" style={{ borderLeft: '2px solid var(--pb-border, #e2e8f0)' }}>
          {onts.map((o) => <OntNode key={o.id} ont={o} />)}
        </div>
      ) : (
        <p className="pl-3 text-[11px]" style={{ color: 'var(--pb-text-3)' }}>No ONTs on this port.</p>
      )}
    </div>
  )
}
export default function FiberTopology() {
  const { id } = useParams()
  const query = useQuery({
    queryKey: ['olt', id],
    queryFn: () => getOlt(id),
    retry: false,
  })

  if (query.isError) {
    return (
      <ErrorState
        title="Could not load OLT topology"
        message={query.error?.response?.data?.message || query.error?.message}
        onRetry={query.refetch}
      />
    )
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const olt = query.data
  const ports = olt?.ponPorts || []
  const onts = olt?.onts || []
  const portIds = new Set(ports.map((p) => String(p.id)))
  const grouped = ports.map((p) => ({
    ...p,
    onts: onts.filter((o) => String(o.pon_port_id) === String(p.id)),
  }))
  const unassigned = onts.filter((o) => !o.pon_port_id || !portIds.has(String(o.pon_port_id)))

  const statusTone = genericStatusTone(olt?.status || 'unknown')

  return (
    <div className="space-y-4">
      <EntityHeader
        typeLabel="FIBER TOPOLOGY"
        title={olt?.name || `OLT #${id}`}
        status={{ label: olt?.status || 'unknown', tone: statusTone }}
        badges={[
          { label: `${ports.length} PON ports` },
          { label: `${onts.length} ONTs` },
          ...(olt?.location ? [{ label: olt.location }] : []),
        ]}
        meta={[
          { label: 'Vendor', value: `${olt?.vendor || '—'}${olt?.model ? ` ${olt.model}` : ''}`.trim() },
          { label: 'IP', value: olt?.ip_address || '—' },
          ...(olt?.location_lat != null && olt?.location_lng != null
            ? [{ label: 'Location', value: `${olt.location_lat}, ${olt.location_lng}` }]
            : []),
        ]}
        lastUpdated={olt?.updated_at ? `Updated ${timeAgo(olt.updated_at)}` : undefined}
      />

      <RelationshipNav
        links={[
          { label: 'OLTs', to: '/fiber/olts' },
          { label: 'Capacity', to: '/fiber/capacity' },
          { label: 'Network command', to: '/network-command' },
        ]}
      />

      <div className="card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Network size={16} style={{ color: '#60a5fa' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>OLT → PON → ONT</h2>
          <span className="text-[11px]" style={{ color: 'var(--pb-text-3)' }}>real backend relationships only</span>
        </div>

        {/* OLT root node */}
        <div className="rounded-lg border p-3 flex items-center gap-3 max-w-md"
          style={{ borderColor: 'rgba(96,165,250,0.5)', background: 'rgba(96,165,250,0.08)' }}>
          <div className="p-2 rounded-lg" style={{ background: 'rgba(96,165,250,0.15)' }}>
            <Cpu size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--pb-text-1)' }}>{olt?.name}</p>
            <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
              {olt?.vendor || '—'} {olt?.model || ''} · {olt?.ip_address || '—'}
            </p>
          </div>
        </div>

        {/* PON ports + their ONTs */}
        {grouped.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>This OLT has no PON ports configured.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {grouped.map((p) => <PonPortNode key={p.id} port={p} onts={p.onts} />)}
          </div>
        )}

        {/* Unassigned ONTs — shown separately, never silently attached */}
        {unassigned.length > 0 && (
          <div className="rounded-lg border p-3 space-y-2" style={{ borderColor: 'rgba(250,204,21,0.4)', background: 'rgba(250,204,21,0.05)' }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#fbbf24' }}>
              <MapPin size={12} /> Unassigned ONTs ({unassigned.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unassigned.map((o) => <OntNode key={o.id} ont={o} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}