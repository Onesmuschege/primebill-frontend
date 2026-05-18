import { TrendingUp, TrendingDown } from 'lucide-react'

const ACCENT_MAP = {
  primary: { accent: 'stat-accent-blue',   icon: 'rgba(37,99,235,0.15)',  iconText: '#60a5fa' },
  blue:    { accent: 'stat-accent-blue',   icon: 'rgba(37,99,235,0.15)',  iconText: '#60a5fa' },
  cyan:    { accent: 'stat-accent-cyan',   icon: 'rgba(6,182,212,0.15)',  iconText: '#22d3ee' },
  green:   { accent: 'stat-accent-green',  icon: 'rgba(16,185,129,0.15)', iconText: '#34d399' },
  orange:  { accent: 'stat-accent-orange', icon: 'rgba(245,158,11,0.15)', iconText: '#fbbf24' },
  red:     { accent: 'stat-accent-red',    icon: 'rgba(239,68,68,0.15)',  iconText: '#f87171' },
  purple:  { accent: 'stat-accent-purple', icon: 'rgba(139,92,246,0.15)', iconText: '#a78bfa' },
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
  trend,      // e.g. '+12%'
  trendDir,   // 'up' | 'down'
  onClick,
}) {
  const { accent, icon: iconBg, iconText } = ACCENT_MAP[color] ?? ACCENT_MAP.primary

  return (
    <div
      className={`card ${accent} ${onClick ? 'card-hover' : ''} relative overflow-hidden`}
      onClick={onClick}
      style={{ transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s' }}
    >
      {/* Subtle top-right glow blob */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${iconBg}, transparent 70%)` }}
      />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2 truncate"
            style={{ color: 'var(--pb-text-3)' }}>
            {title}
          </p>
          <p className="text-2xl font-bold tracking-tight leading-none"
            style={{ color: 'var(--pb-text-1)' }}>
            {value}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {subtitle && (
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                {subtitle}
              </p>
            )}
            {trend && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                trendDir === 'up' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {trendDir === 'up'
                  ? <TrendingUp size={11} />
                  : <TrendingDown size={11} />
                }
                {trend}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="shrink-0 ml-4 p-3 rounded-xl"
            style={{ backgroundColor: iconBg }}>
            <Icon size={22} style={{ color: iconText }} />
          </div>
        )}
      </div>
    </div>
  )
}