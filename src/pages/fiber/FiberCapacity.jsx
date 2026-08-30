import { useQuery } from '@tanstack/react-query'
import { getFiberCapacity } from '../../api/fiber.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'

const SV = { online: 'active', active: 'active', inactive: 'inactive', planned: 'pending', decommissioned: 'suspended' }
const Bar = ({ v, m, c = '#2563eb' }) => (
  <div className="mt-1 h-2 w-full rounded overflow-hidden" style={{ backgroundColor: 'var(--pb-raised)' }}>
    <div className="h-2 rounded" style={{ width: `${m > 0 ? Math.min((v / m) * 100, 100) : 0}%`, background: c }} />
  </div>
)
const T = { th: 'px-3 py-2 text-xs font-medium uppercase', td: 'px-3 py-1.5 text-sm' }

function Tbl({ title, head, children }) {
  return (
    <div className="rounded-lg border overflow-x-auto" style={{ backgroundColor: 'var(--pb-surface)', borderColor: 'var(--pb-border)' }}>
      <div className="px-3 py-2 font-semibold border-b" style={{ borderColor: 'var(--pb-border)' }}>{title}</div>
      <table className="min-w-full divide-y text-xs" style={{ borderColor: 'var(--pb-border)' }}>
        <thead><tr>{head.map((h) => <th key={h} className={T.th} style={{ color: 'var(--pb-text-3)' }}>{h}</th>)}</tr></thead>
        <tbody className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>{children}</tbody>
      </table>
    </div>
  )
}

export default function FiberCapacity() {
  const { data, isError } = useQuery({
    queryKey: ['fiber-capacity'],
        queryFn: () => getFiberCapacity({ per_page: 200 }),
    staleTime: 60_000,
  })
  if (!data) return <Spinner />
  const s = data.summary

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Fiber Capacity</h1>
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>OLT, PON-port and ONT utilization plus route and splitter inventory.</p>
        </div>
        {isError && <Badge label="Reload failed" variant="suspended" />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          ['OLTs', s.olts, '#2563eb'], ['PON Ports', s.pon_ports, '#7c3aed'],
          ['Registered ONTs', s.registered_onts, '#0ea5e9'], ['Max ONT Capacity', s.max_ont_capacity, '#059669'],
          ['ONT Util %', `${s.ont_utilization_pct}%`, '#dc2626'], ['Fiber Routes', s.routes, '#f59e0b'],
        ].map(([l, v, c]) => (
          <div key={l} className="card p-3 text-center">
            <div className="text-2xl font-bold" style={{ color: c }}>{v}</div>
            <div className="text-[10px]" style={{ color: 'var(--pb-text-2)' }}>{l}</div>
          </div>
        ))}
      </div>

      {data.olts?.length > 0 && (
        <Tbl title="OLTs" head={['OLT', 'Status', 'Ports', 'Active', 'Util %', 'Max ONTs', 'Registered']}>
          {data.olts.map((o) => (
            <tr key={o.id}>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.name}</td>
              <td className={T.td}><Badge label={o.status} variant={SV[o.status] || 'inactive'} /></td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.total_pon_ports}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.active_pon_ports}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.port_utilization_pct}%</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.max_ont_capacity}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{o.ont_count}</td>
            </tr>
          ))}
        </Tbl>
      )}

      {data.pon_ports?.length > 0 && (
        <Tbl title="PON Ports" head={['Port', 'OLT', 'Max ONTs', 'Registered', 'Util %']}>
          {data.pon_ports.map((p) => (
            <tr key={p.id}>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{p.name}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{p.olt}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{p.max_onts}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{p.registered_onts}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{p.utilization_pct}%<Bar v={p.registered_onts} m={p.max_onts} /></td>
            </tr>
          ))}
        </Tbl>
      )}

      {data.routes?.length > 0 && (
        <Tbl title="Fiber Routes" head={['Route', 'Source → Destination', 'km', 'Type', 'Connections']}>
          {data.routes.map((r) => (
            <tr key={r.id}>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{r.name}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{r.source} → {r.destination}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{r.length_km}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{r.cable_type}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{r.connection_count}</td>
            </tr>
          ))}
        </Tbl>
      )}

      {data.splitters?.length > 0 && (
        <Tbl title="Splitters" head={['Splitter', 'Ratio', 'Location', 'Status']}>
          {data.splitters.map((sp) => (
            <tr key={sp.id}>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{sp.name}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{sp.split_ratio}</td>
              <td className={T.td} style={{ color: 'var(--pb-text-1)' }}>{sp.location}</td>
              <td className={T.td}><Badge label={sp.status} variant={SV[sp.status] || 'inactive'} /></td>
            </tr>
          ))}
        </Tbl>
      )}
    </div>
  )
}
