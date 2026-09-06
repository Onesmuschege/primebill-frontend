import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PlatformDashboard from '../PlatformDashboard'
import * as platformApi from '../../../api/platform.api'
import { formatKES } from '../../../utils/formatCurrency'

// The Command Center consumes /platform/stats + tenant preview plus the four
// deepened feeds (analytics, billing stats, security overview, usage report).
vi.mock('../../../api/platform.api', () => ({
  getPlatformStats: vi.fn(),
  getPlatformTenants: vi.fn(),
  getPlatformTenant: vi.fn(),
  getPlatformRevenueAnalytics: vi.fn(),
  getPlatformBillingStats: vi.fn(),
  getPlatformSecurityOverview: vi.fn(),
  getPlatformUsageReport: vi.fn(),
  suspendTenant: vi.fn(),
  activateTenant: vi.fn(),
}))

// recharts ResponsiveContainer can't measure in jsdom — stub with passthrough
// components that record the data they receive so tests can assert the chart
// consumes the real analytics series.
const rechartsState = vi.hoisted(() => ({ areaData: null, barData: null }))
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ data }) => {
    rechartsState.areaData = data
    return <svg data-testid="paid-trend-chart" />
  },
  BarChart: ({ data }) => {
    rechartsState.barData = data
    return <svg data-testid="plan-mix-chart" />
  },
  Area: () => null,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: vi.fn(), error: vi.fn() },
}))

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderPage() {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlatformDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// ── Payload fixtures mirroring PlatformAdminService::getStats() ────────────
function quietStats() {
  return {
    overview: {
      total_tenants: 12,
      active_tenants: 8,
      trial_tenants: 2,
      suspended_tenants: 2,
      mrr: 150000,
      arr: 1800000,
      total_payments: 340,
      total_revenue: 4200000,
    },
    tenants: { by_status: { active: 8, trial: 2, suspended: 2 }, by_plan: { starter: 6, professional: 4, enterprise: 2 }, growth_rate: 4, new_this_month: 1 },
    revenue: { today: 25000, this_month: 600000, this_year: 5200000, monthly: [{ month: '2026-08', total: 150000 }, { month: '2026-09', total: 165000 }], by_method: { mpesa: 340000, cash: 260000 } },
    clients: { total: 540, by_status: { active: 486, suspended: 54 }, growth_rate: 3, new_this_month: 12 },
    infrastructure: {
      routers: { total: 5, online: 5, health_percentage: 96 },
      database: { status: 'connected', driver: 'mysql' },
      queue: { default: 'database', status: 'running' },
      cache: { driver: 'file', status: 'healthy' },
    },
    security: { failed_logins_today: 0, successful_logins_today: 64, security_events_this_week: 2, platform_admins: 3 },
    activity: [
      { id: 1, user: 'op@primebill.test', action: 'auth.login.success', model: 'User', model_id: 1, created_at: '2026-09-05T21:00:00Z' },
      { id: 2, user: 'admin@acme.test', action: 'tenant.updated', model: 'Tenant', model_id: 7, created_at: '2026-09-05T20:30:00Z' },
    ],
    billing: { outstanding_total: 0, overdue_count: 0 },
    ops_queues: {
      expiring_trials: { available: true, label: 'Expiring trials', count: 0, items: [] },
      overdue_accounts: { available: true, label: 'Tenants owing PrimeBill', count: 0, items: [] },
      near_limit: { available: true, label: 'Tenants near limits', count: 0, items: [] },
      failed_jobs: { available: true, label: 'Failed jobs', count: 0, items: [] },
      security_events: { available: true, label: 'Security events (7d)', count: 0, items: [] },
      failed_integrations: { available: false, label: 'Failed integrations', count: 0, items: [] },
      incidents: { available: false, label: 'Unresolved incidents', count: 0, items: [] },
    },
  }
}

function criticalStats() {
  const stats = quietStats()
  // Two failed background jobs → Layer-1 status escalates to critical.
  stats.ops_queues.failed_jobs.count = 2
  stats.ops_queues.overdue_accounts.count = 1
  return stats
}

function paginatedTenants() {
  return {
    data: [
      { id: 1, name: 'Acme ISP', slug: 'acme', status: 'active', plan: 'professional', client_count: 120, max_clients: 500, revenue: 150000, outstanding_invoices: 0, created_at: '2026-08-01T00:00:00Z' },
      { id: 2, name: 'Coastlink ISPs', slug: 'coastlink', status: 'suspended', plan: 'starter', client_count: 40, max_clients: 200, revenue: 30000, outstanding_invoices: 5000, created_at: '2026-08-05T00:00:00Z' },
    ],
    meta: { total: 2, current_page: 1, per_page: 8, last_page: 1 },
  }
}

const tenantDetail = {
  id: 1,
  name: 'Acme ISP',
  slug: 'acme',
  status: 'active',
  plan: 'professional',
  plan_expires_at: '2026-12-01T00:00:00Z',
  trial_ends_at: null,
  created_at: '2026-08-01T00:00:00Z',
  client_count: 120,
  max_clients: 500,
  storage_used_mb: 2048,
  storage_quota_gb: 50,
  api_calls_used: 4000,
  api_calls_per_month: 50000,
  max_users: 25,
  revenue: 150000,
  recent_payments: [{ id: 1, amount: 5000, method: 'mpesa', created_at: '2026-09-04T10:00:00Z' }],
}

// ── Deepened-feed fixtures mirroring the real backend aggregations ──────────
// /platform/analytics (PlatformAnalyticsController), /platform/billing/stats,
// /platform/security/overview and /platform/reports/usage.
const analyticsFixture = {
  mrr: { mrr: 150000, arr: 1800000, new_this_month: 12000, churned_this_month: 5000, active_count: 8, trial_count: 2 },
  monthly_trend: [
    { period: '2026-08', total: 140000 },
    { period: '2026-09', total: 155000 },
  ],
  by_plan: [
    { plan_id: 1, plan_name: 'Starter', revenue: 90000, tenant_count: 6 },
    { plan_id: 2, plan_name: 'Professional', revenue: 120000, tenant_count: 4 },
  ],
  by_method: [],
  invoice_status: { paid: { count: 12, total: 500000 }, overdue: { count: 2, total: 40000 } },
}
const billingStatsFixture = { total_invoices: 24, outstanding_total: 95000, paid_this_month: 320000, overdue_count: 2 }
const securityOverviewFixture = {
  failed_logins_today: 0,
  failed_logins_this_week: 3,
  successful_logins_today: 64,
  successful_logins_this_week: 420,
  security_events_this_week: 2,
}
const usageReportFixture = {
  total: 2,
  categories: { clients: 'clients_pct', routers: 'routers_pct', api_calls: 'api_calls_pct', storage: 'storage_pct' },
  rows: [
    { tenant_id: 1, name: 'Acme ISP', clients_pct: 62.5, routers_pct: 40, api_calls_pct: 81.2, storage_pct: 33.3 },
    { tenant_id: 2, name: 'Coastlink ISPs', clients_pct: 92.4, routers_pct: 55, api_calls_pct: 76, storage_pct: 12.5 },
  ],
}

function setupFeeds(overrides = {}) {
  platformApi.getPlatformRevenueAnalytics.mockResolvedValue(overrides.analytics ?? analyticsFixture)
  platformApi.getPlatformBillingStats.mockResolvedValue(overrides.billingStats ?? billingStatsFixture)
  platformApi.getPlatformSecurityOverview.mockResolvedValue(overrides.security ?? securityOverviewFixture)
  platformApi.getPlatformUsageReport.mockResolvedValue(overrides.usage ?? usageReportFixture)
}

describe('PlatformDashboard — Command Center KPIs (Phase 1 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platformApi.getPlatformStats.mockResolvedValue(quietStats())
    platformApi.getPlatformTenants.mockResolvedValue(paginatedTenants())
    platformApi.getPlatformTenant.mockResolvedValue(tenantDetail)
    setupFeeds()
  })

  it('renders the four primary KPI cards from /platform/stats', async () => {
    renderPage()
    expect(await screen.findByText('Total Tenants')).toBeTruthy()
    expect(screen.getByText('Total Clients')).toBeTruthy()
    expect(screen.getByText('Platform MRR')).toBeTruthy()
    expect(screen.getByText('Outstanding (PrimeBill)')).toBeTruthy()
  })

  it('derives an "All systems nominal" Layer-1 status when queues are quiet', async () => {
    renderPage()
    expect(await screen.findByText('All systems nominal')).toBeTruthy()
  })

  it('escalates Layer-1 status to critical when failed jobs exist', async () => {
    platformApi.getPlatformStats.mockResolvedValue(criticalStats())
    renderPage()
    // failed_jobs 2 + overdue 1 = 3 actionable, level critical → "3 critical".
    expect(await screen.findByText('3 critical')).toBeTruthy()
  })

  it('renders revenue bars for the monthly 12-month series', async () => {
    renderPage()
    expect(await screen.findByText('Monthly Platform Revenue (12 months)')).toBeTruthy()
    // Bars render the short month label (m.month.slice(5)) under each column.
    await waitFor(() => {
      expect(screen.getAllByText('08').length).toBeGreaterThan(0)
      expect(screen.getAllByText('09').length).toBeGreaterThan(0)
    })
  })

  it('renders real ops queues and honest backend-gap badges', async () => {
    renderPage()
    expect(await screen.findByText('Requires attention')).toBeTruthy()
    expect(screen.getByText('Expiring trials')).toBeTruthy()
    expect(screen.getByText('Failed integrations')).toBeTruthy()
    expect(screen.getAllByText('backend gap').length).toBe(2)
  })

  it('renders the recent platform activity feed', async () => {
    renderPage()
    expect(await screen.findByText('Recent Platform Activity')).toBeTruthy()
    expect(screen.getByText('op@primebill.test')).toBeTruthy()
  })
})

describe('PlatformDashboard — tenant preview & detail (Phase 1 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platformApi.getPlatformStats.mockResolvedValue(quietStats())
    platformApi.getPlatformTenants.mockResolvedValue(paginatedTenants())
    platformApi.getPlatformTenant.mockResolvedValue(tenantDetail)
    setupFeeds()
  })

  it('renders the server-side tenant preview slice with the real total', async () => {
    renderPage()
    expect(await screen.findByText('Acme ISP')).toBeTruthy()
    expect(screen.getByText('Coastlink ISPs')).toBeTruthy()
    // Footer shows the real backend total for the current filter.
    await waitFor(() => expect(screen.getByText(/Showing 2 of 2/)).toBeTruthy())
  })

  it('re-queries the preview server-side when a status filter is chosen', async () => {
    renderPage()
    await screen.findByText('Acme ISP')

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'suspended' } })

    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenCalledWith({
        per_page: 8,
        search: undefined,
        status: 'suspended',
      })
    })
  })

  it('opens a detail modal with quota usage and recent payments on view', async () => {
    renderPage()
    const viewBtn = (await screen.findAllByTitle('View tenant'))[0]
    fireEvent.click(viewBtn)

    await waitFor(() => {
      expect(platformApi.getPlatformTenant).toHaveBeenCalledWith(1)
    })
    // Modal content for the opened tenant.
    expect(await screen.findByText('Quota Usage')).toBeTruthy()
    expect(screen.getByText(/Recent Payments/)).toBeTruthy()
    // 'mpesa' also appears in the Revenue-by-Method card — assert multiple.
    expect(screen.getAllByText(tenantDetail.recent_payments[0].method).length).toBeGreaterThan(0)
  })
})

describe('PlatformDashboard — enhanced cockpit stats (analytics / billing / security / usage)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platformApi.getPlatformStats.mockResolvedValue(quietStats())
    platformApi.getPlatformTenants.mockResolvedValue(paginatedTenants())
    platformApi.getPlatformTenant.mockResolvedValue(tenantDetail)
    setupFeeds()
  })

  it('surfaces net MRR movement from the real /platform/analytics deltas', async () => {
    renderPage()
    expect(await screen.findByText('Net MRR Movement')).toBeTruthy()
    // 12,000 new − 5,000 churned = 7,000 net — computed, not fabricated.
    // formatKES emits NBSP separators the default normalizer won't collapse,
    // so assertions normalize before matching.
    const nbsp = (s) => s.replace(/\u00A0/g, ' ')
    await waitFor(() => {
      expect(screen.getByText(formatKES(7000).replace(/\u00A0/g, ' '), { normalizer: nbsp })).toBeTruthy()
    })
    // Glyph-level variance (·/−) makes exact matching brittle — assert on the
    // semantic content of the single subtitle node instead.
    expect(
      screen.getByText(
        (content) => content.startsWith('+') && content.includes('12,000 new') && content.includes('5,000 churned this month')
      )
    ).toBeTruthy()
  })

  it('uses the deepened billing stats for the collected-this-month card', async () => {
    renderPage()
    expect(await screen.findByText('Collected This Month')).toBeTruthy()
    const nbsp = (s) => s.replace(/\u00A0/g, ' ')
    await waitFor(() => {
      expect(screen.getByText(formatKES(320000).replace(/\u00A0/g, ' '), { normalizer: nbsp })).toBeTruthy()
    })
    expect(screen.getByText('24 invoices total · 2 overdue')).toBeTruthy()
  })

  it('computes the weekly login success rate from the security overview feed', async () => {
    renderPage()
    expect(await screen.findByText('Login Success (7d)')).toBeTruthy()
    // 420 passed / (420 + 3) = 99.29% → 99%.
    await waitFor(() => expect(screen.getByText('99%')).toBeTruthy())
    expect(screen.getByText(/420 passed · 3 failed this week/)).toBeTruthy()
  })

  it('shows peak quota usage and the hottest tenant from the usage report', async () => {
    renderPage()
    expect(await screen.findByText('Peak Quota Usage')).toBeTruthy()
    // Coastlink at 92.4% clients is the tightest tenant.
    await waitFor(() => {
      expect(screen.getByText('Coastlink ISPs is closest to a limit')).toBeTruthy()
    })
    // Peak per category: clients 92% (Coastlink), api calls 81% (Acme).
    expect(screen.getAllByText('92%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('81%').length).toBeGreaterThanOrEqual(1)
    // The headroom panel names the hottest tenant in its caption.
    expect(screen.getByText(/hottest: Coastlink ISPs/)).toBeTruthy()
  })

  it('renders the paid-revenue trend and plan-mix charts from the analytics series', async () => {
    renderPage()
    await screen.findByTestId('paid-trend-chart')
    expect(screen.getByTestId('plan-mix-chart')).toBeTruthy()
    // The trend consumes the real periods (sliced to YY-MM) and totals.
    expect(rechartsState.areaData).toEqual([
      { period: '26-08', total: 140000 },
      { period: '26-09', total: 155000 },
    ])
    // The plan-mix chart consumes the per-plan revenue rows.
    expect(rechartsState.barData.map((r) => r.plan_name)).toEqual(['Starter', 'Professional'])
  })

  it('renders honest empty states when the analytics feed has no data yet', async () => {
    setupFeeds({
      analytics: { mrr: {}, monthly_trend: [], by_plan: [], by_method: [], invoice_status: {} },
      usage: { total: 0, categories: {}, rows: [] },
    })
    renderPage()
    expect(await screen.findByText('No paid invoice data yet')).toBeTruthy()
    expect(screen.getByText('No plan revenue data yet')).toBeTruthy()
    expect(screen.getByText('No usage report data yet')).toBeTruthy()
    // Peak Quota Usage card falls back to an honest dash.
    expect(screen.getByText('No quota usage data yet')).toBeTruthy()
  })

  it('keeps the primary stats up when a deepened feed fails', async () => {
    platformApi.getPlatformRevenueAnalytics.mockRejectedValue(new Error('boom'))
    renderPage()
    // /platform/stats cards still render; the analytics-derived card degrades
    // to its zero-value fallback instead of taking the page down.
    expect(await screen.findByText('Total Tenants')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText('Net MRR Movement')).toBeTruthy()
    })
  })
})