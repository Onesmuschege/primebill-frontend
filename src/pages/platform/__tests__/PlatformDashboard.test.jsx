import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PlatformDashboard from '../PlatformDashboard'
import * as platformApi from '../../../api/platform.api'

// The Command Center only consumes the /platform/stats + tenant preview endpoints.
vi.mock('../../../api/platform.api', () => ({
  getPlatformStats: vi.fn(),
  getPlatformTenants: vi.fn(),
  getPlatformTenant: vi.fn(),
  suspendTenant: vi.fn(),
  activateTenant: vi.fn(),
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
describe('PlatformDashboard — Command Center KPIs (Phase 1 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    platformApi.getPlatformStats.mockResolvedValue(quietStats())
    platformApi.getPlatformTenants.mockResolvedValue(paginatedTenants())
    platformApi.getPlatformTenant.mockResolvedValue(tenantDetail)
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