import { describe, it, expect } from 'vitest'
import {
  PLATFORM_NAV,
  platformPageTitle,
  platformBreadcrumbs,
  derivePlatformNotifications,
} from '../platformNav'

describe('platformPageTitle', () => {
  it('maps known platform paths to their titles', () => {
    expect(platformPageTitle('/platform')).toBe('Command Center')
    expect(platformPageTitle('/platform/tenants')).toBe('Tenants')
    expect(platformPageTitle('/platform/tenants/7')).toBe('Tenant Detail')
    expect(platformPageTitle('/platform/billing')).toBe('Billing & Revenue')
    expect(platformPageTitle('/platform/audit-log')).toBe('Audit Log')
  })

  it('falls back to the console title for unknown paths', () => {
    expect(platformPageTitle('/platform/xyz')).toBe('Platform Console')
  })
})

describe('PLATFORM_NAV registry', () => {
  it('only contains routes that exist (no dead links)', () => {
    const allTargets = PLATFORM_NAV.flatMap((g) => g.items.map((i) => i.to))
    expect(allTargets).toEqual([
      '/platform',
      '/platform/tenants',
      '/platform/users',
      '/platform/settings',
      '/platform/subscriptions',
      '/platform/billing',
      '/platform/plans',
      '/platform/system',
      '/platform/analytics',
      '/platform/reports',
      '/platform/security',
      '/platform/audit-log',
    ])
  })

  it('groups follow the target IA and every group has items', () => {
    expect(PLATFORM_NAV.map((g) => g.group)).toEqual([
      'Overview', 'Operations', 'Commercial', 'Observability', 'Intelligence', 'Security',
    ])
    PLATFORM_NAV.forEach((g) => expect(g.items.length).toBeGreaterThan(0))
  })
})

describe('platformBreadcrumbs', () => {
  it('returns just the root crumb for the overview', () => {
    expect(platformBreadcrumbs('/platform')).toEqual([
      { label: 'Platform', href: '/platform' },
    ])
  })

  it('resolves tenant detail to Platform / Tenants / Tenant #N', () => {
    const crumbs = platformBreadcrumbs('/platform/tenants/42')
    expect(crumbs).toHaveLength(3)
    expect(crumbs[1]).toEqual({ label: 'Tenants', href: '/platform/tenants' })
    expect(crumbs[2]).toEqual({ label: 'Tenant #42', href: null })
  })

  it('appends the page title as the terminal crumb for flat pages', () => {
    const crumbs = platformBreadcrumbs('/platform/billing')
    expect(crumbs).toEqual([
      { label: 'Platform', href: '/platform' },
      { label: 'Billing & Revenue', href: null },
    ])
  })
})

describe('derivePlatformNotifications', () => {
  it('returns nothing for null/empty stats', () => {
    expect(derivePlatformNotifications(null)).toEqual([])
    expect(derivePlatformNotifications({})).toEqual([])
  })

  it('flags overdue PrimeBill invoices as action-required', () => {
    const items = derivePlatformNotifications({
      billing: { overdue_count: 2, outstanding_overdue_total: 15000 },
    })
    const action = items.find((i) => i.id === 'billing-overdue')
    expect(action).toBeTruthy()
    expect(action.tier).toBe('action')
    expect(action.title).toContain('2 overdue')
    expect(action.href).toBe('/platform/billing?status=overdue')
  })

  it('flags suspended tenants as alerts', () => {
    const items = derivePlatformNotifications({
      tenants: { by_status: { suspended: 3 } },
    })
    const alert = items.find((i) => i.id === 'tenants-suspended')
    expect(alert.tier).toBe('alert')
    expect(alert.title).toContain('3 suspended')
  })

  it('flags failed logins today as alerts', () => {
    const items = derivePlatformNotifications({
      security: { failed_logins_today: 4, security_events_this_week: 9 },
    })
    const alert = items.find((i) => i.id === 'security-failed-logins')
    expect(alert.tier).toBe('alert')
    expect(alert.title).toContain('4 failed logins')
  })

  it('flags only unhealthy infrastructure components', () => {
    const items = derivePlatformNotifications({
      infrastructure: {
        db: { status: 'connected' },
        queue: { status: 'stopped' },
        cache: { status: 'degraded' },
      },
    })
    const ids = items.map((i) => i.id)
    expect(ids).toContain('infra-queue')
    expect(ids).toContain('infra-cache')
    expect(ids).not.toContain('infra-db')
  })

  it('shows outstanding receivables as info only when nothing is overdue', () => {
    const withOverdue = derivePlatformNotifications({
      billing: { overdue_count: 1, outstanding_total: 5000 },
    })
    expect(withOverdue.find((i) => i.id === 'billing-outstanding')).toBeUndefined()

    const withoutOverdue = derivePlatformNotifications({
      billing: { overdue_count: 0, outstanding_total: 5000 },
    })
    const info = withoutOverdue.find((i) => i.id === 'billing-outstanding')
    expect(info.tier).toBe('info')
  })
})
