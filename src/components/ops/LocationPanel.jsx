import { MapPin, ExternalLink } from 'lucide-react'

/**
 * LocationPanel — honest location intelligence (P2 §24).
 *
 * Renders a REAL coordinate pair (lat/lng) with an external map deep-link.
 * PrimeBill does not ship a bundled map library; coordinates come from the
 * backend (clients.gps_lat/gps_lng, routers.location_lat/location_lng,
 * olt.location_lat/location_lng) and the operator opens the pin in a real
 * map provider. When coordinates are absent, nothing is rendered — PrimeBill
 * never invents a marker position.
 */
export default function LocationPanel({ lat, lng, label = 'Location' }) {
  if (lat == null || lng == null) return null
  const href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=17/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`
  return (
    <div className="card p-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-xs min-w-0">
        <span className="p-1.5 rounded-md shrink-0" style={{ background: 'rgba(96,165,250,0.12)' }}>
          <MapPin size={13} style={{ color: '#60a5fa' }} />
        </span>
        <div className="min-w-0">
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>{label}</p>
          <p className="font-mono truncate" style={{ color: 'var(--pb-text-3)' }}>
            {lat}, {lng}
          </p>
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-xs font-medium shrink-0 hover:underline"
        style={{ color: '#818cf8' }}
      >
        Open in map <ExternalLink size={11} />
      </a>
    </div>
  )
}