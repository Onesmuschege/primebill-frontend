import {
  LayoutDashboard, Building2, UserCog, CreditCard, ReceiptText,
  Activity, TrendingUp, BarChart3, Lock, ScrollText,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Platform console information architecture — the single registry consumed by
// PlatformLayout (sidebar + breadcrumbs) and the command palette.
//
// Groups follow the master-prompt target IA (§4) but only contain routes that
// actually exist today. Sections whose backend capability is still a documented
// gap (Platform Services, Security events, Jobs & Queues, …) are deliberately
// absent — no dead links, no fake destinations. The registry is the growth
// point: adding a real route later means adding one entry here.
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORM_NAV = [
  {
    group: 'Overview',
    items: [
      { to: '/platform', icon: LayoutDashboard, label: 'Command Center' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { to: '/platform/tenants', icon: Building2, label: 'Tenants' },
      { to: '/platform/users', icon: UserCog, label: 'Platform Users' },
    ],
  },
  {
    group: 'Commercial',
    items: [
      { to: '/platform/subscriptions', icon: CreditCard, label: 'Subscriptions' },
      { to: '/platform/billing', icon: ReceiptText, label: 'Billing & Revenue' },
    ],
  },
  {
    group: 'Observability',
    items: [
      { to: '/platform/system', icon: Activity, label: 'System Health' },
    ],
  },
  {
    group: 'Intelligence',
    items: [
      { to: '/platform/analytics', icon: TrendingUp, label: 'Analytics' },
      { to: '/platform/reports', icon: BarChart3, label: 'Reports' },
    ],
  },
  {
    group: 'Security',
    items: [
      { to: '/platform/security', icon: Lock, label: 'Security Center' },
      { to: '/platform/audit-log', icon: ScrollText, label: 'Audit Log' },
    ],
  },
]

// Page titles for the top bar — pathname → label.
const TITLE_OVERRIDES = [
  { match: (p) => p === '/platform', label: 'Command Center' },
  { match: (p) => /^\/platform\/tenants\/\d+$/.test(p), label: 'Tenant Detail' },
  { match: (p) => p.startsWith('/platform/tenants'), label: 'Tenants' },
  { match: (p) => p.startsWith('/platform/users'), label: 'Platform Users' },
  { match: (p) => p.startsWith('/platform/subscriptions'), label: 'Subscriptions' },
  { match: (p) => p.startsWith('/platform/billing'), label: 'Billing & Revenue' },
  { match: (p) => p.startsWith('/platform/analytics'), label: 'Analytics' },
  { match: (p) => p.startsWith('/platform/reports'), label: 'Reports' },
  { match: (p) => p.startsWith('/platform/audit-log'), label: 'Audit Log' },
  { match: (p) => p.startsWith('/platform/security'), label: 'Security Center' },
  { match: (p) => p.startsWith('/platform/system'), label: 'System Health' },
]

/**
 * Page title for a platform pathname.
 * @param {string} pathname
 * @returns {string}
 */

/**
 * Breadcrumbs for a platform pathname, derived from the nav registry so
 * labels never drift from the sidebar.
 *
 * /platform/tenants/7 → [
 *   { label: 'Platform', href: '/platform' },
 *   { label: 'Tenants', href: '/platform/tenants' },
 *   { label: 'Tenant #7', href: null },
 * ]
 *
 * @param {string} pathname
 * @returns {{label: string, href: string|null}[]}
 */
export function platformBreadcrumbs(pathname) {
  const crumbs = [{ label: 'Platform', href: '/platform' }]
  if (pathname === '/platform') return crumbs

  const tenantDetail = pathname.match(/^\/platform\/tenants\/(\d+)$/)
  if (tenantDetail) {
    crumbs.push({ label: 'Tenants', href: '/platform/tenants' })
    crumbs.push({ label: `Tenant #${tenantDetail[1]}`, href: null })
    return crumbs
  }

  const title = platformPageTitle(pathname)
  if (title !== 'Platform Console') {
    crumbs.push({ label: title, href: null })
  }
  return crumbs
}

/**
 * Derive the platform notification list from the real /platform/stats payload.
 * Pure — no fetching, no fabricated conditions: an entry only appears when the
 * backend reports the condition.
 *
 * @param {object|null} stats  the payload of getPlatformStats()
 * @returns {{id: string, tier: 'action'|'alert'|'info', title: string, detail: string, href: string}[]}
 */
export function derivePlatformNotifications(stats) {
  if (!stats || typeof stats !== 'object') return []
  const items = []
  const billing = stats.billing || {}
  const security = stats.security || {}
  const infra = stats.infrastructure || {}
  const tenants = stats.tenants || {}

  // Action required — PrimeBill is owed money by its tenants.
  if ((billing.overdue_count ?? 0) > 0) {
    items.push({
      id: 'billing-overdue',
      tier: 'action',
      title: `${billing.overdue_count} overdue PrimeBill invoice${billing.overdue_count === 1 ? '' : 's'}`,
      detail: `KES ${Number(billing.outstanding_overdue_total ?? 0).toLocaleString()} overdue across tenant accounts`,
      href: '/platform/billing?status=overdue',
    })
  }

  // Alerts — suspended tenants and today's failed logins (real counts only).
  if ((tenants.by_status?.suspended ?? 0) > 0) {
    items.push({
      id: 'tenants-suspended',
      tier: 'alert',
      title: `${tenants.by_status.suspended} suspended tenant${tenants.by_status.suspended === 1 ? '' : 's'}`,
      detail: 'Tenant access is locked platform-wide',
      href: '/platform/tenants',
    })
  }
  if ((security.failed_logins_today ?? 0) > 0) {
    items.push({
      id: 'security-failed-logins',
      tier: 'alert',
      title: `${security.failed_logins_today} failed login${security.failed_logins_today === 1 ? '' : 's'} today`,
      detail: `${security.security_events_this_week ?? 0} security events this week`,
      href: '/platform/security',
    })
  }

  // Infrastructure — one alert per component not reporting a healthy status.
  const INFRA_OK = ['operational', 'healthy', 'running', 'connected']
  for (const key of ['db', 'cache', 'queue', 'redis', 'storage']) {
    const comp = infra[key]
    if (comp && comp.status && !INFRA_OK.includes(comp.status)) {
      items.push({
        id: `infra-${key}`,
        tier: 'alert',
        title: `${key.toUpperCase()} degraded`,
        detail: `Reported status: ${comp.status}`,
        href: '/platform/system',
      })
    }
  }

  // Information — PrimeBill receivables snapshot (only when something outstanding).
  if ((billing.outstanding_total ?? 0) > 0 && (billing.overdue_count ?? 0) === 0) {
    items.push({
      id: 'billing-outstanding',
      tier: 'info',
      title: `KES ${Number(billing.outstanding_total).toLocaleString()} outstanding`,
      detail: 'Draft/sent PrimeBill invoices awaiting payment',
      href: '/platform/billing',
    })
  }

  return items
}

export function platformPageTitle(pathname) {
  const hit = TITLE_OVERRIDES.find((t) => t.match(pathname))
  return hit ? hit.label : 'Platform Console'
}
