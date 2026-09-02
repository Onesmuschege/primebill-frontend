import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ServiceDetail from '../ServiceDetail'
import * as serviceNetworkApi from '../../../api/service-network.api'
import * as clientsApi from '../../../api/clients.api'

// ── Mocks: only the two real API modules the workspace consumes ────────────
vi.mock('../../../api/service-network.api', () => ({
  getServiceNetworkStatus: vi.fn(),
  suspendService: vi.fn(),
  restoreService: vi.fn(),
  disconnectService: vi.fn(),
  sendServiceCoA: vi.fn(),
}))
vi.mock('../../../api/clients.api', () => ({
  getClient: vi.fn(),
}))

// ActionRail performs permission-aware rendering via useAuth().hasPermission.
// The workspace spec grants all permissions — permission gating itself is
// covered by the ops foundation tests (opsActions.test.jsx).
vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ hasPermission: () => true }),
}))

// Authoritative payload shape copied from ServiceNetworkController::status —
// every field here exists in the real backend response.
const STATUS_PAYLOAD = {
  account: {
    id: 42,
    client_id: 7,
    username: 'jdoe-pppoe',
    type: 'pppoe',
    plan: { id: 3, name: 'Fiber 50', price: 2500 },
    nas: { id: 1, name: 'core-rtr-01' },
    nas_id: 1,
    access_method: 'pppoe',
  },
  is_entitled: true,
  service_state: 'ACTIVE',
  suspension_type: null,
  administrative_hold: false,
  access_method: 'pppoe',
  rate_limit_policy: '50M/10M',
  active_sessions: [
    {
      id: 91,
      ip_address: '10.10.0.44',
      bytes_in: 1536 * 1024,
      bytes_out: 512 * 1024,
      session_start: '2026-09-01T08:00:00Z',
      status: 'online',
    },
  ],
  recent_control_logs: [
    { id: 5, action: 'SUSPEND', username: 'jdoe-pppoe', status: 'success', error: null, result: 'ok', completed_at: '2026-09-01T09:00:00Z', created_at: '2026-09-01T09:00:00Z' },
    { id: 4, action: 'RESTORE', username: 'jdoe-pppoe', status: 'failed', error: 'NAS timeout', result: null, completed_at: '2026-09-01T08:50:00Z', created_at: '2026-08-31T08:50:00Z' },
  ],
}

function renderWorkspace() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/subscribers/services/42']}>
        <ServiceDetail />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  serviceNetworkApi.getServiceNetworkStatus.mockResolvedValue({ data: STATUS_PAYLOAD })
  clientsApi.getClient.mockResolvedValue({ id: 7, name: 'Jane Doe', email: 'jane@example.com' })
})

describe('ServiceDetail (Service 360 workspace)', () => {
  it('renders identity, plan and NAS from the authoritative status payload', async () => {
    renderWorkspace()
    // Plan name appears in BOTH the EntityHeader meta and the detail card —
    // assert on all occurrences rather than a single ambiguous node.
    await waitFor(() => expect(screen.getAllByText(/Fiber 50/).length).toBeGreaterThan(0))
    // Breadcrumb name comes from a SEPARATE non-blocking client query that
    // resolves after the status query — wait for it explicitly (§24 partial
    // states: the workspace must never blank while a related query loads).
    await waitFor(() => expect(screen.getByText('Jane Doe')).toBeInTheDocument())
    expect(screen.getByText('jdoe-pppoe')).toBeInTheDocument()
    expect(screen.getAllByText(/core-rtr-01/).length).toBeGreaterThan(0)
    // Breadcrumb keeps customer context (§8)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders the real service state chain — downstream stages not fabricated', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getAllByText(/Fiber 50/).length).toBeGreaterThan(0))
    // Scope INSIDE the state chain list: the EntityHeader status chip also
    // renders the label "Active", so unscoped queries would be ambiguous.
    const chain = screen.getByRole('list', { name: 'Service lifecycle state' })
    // getByText matches the inner label <span>; the chip (with the glyph) is
    // its parent span.
    const activeChip = within(chain).getByText('Active').closest('span').parentElement
    expect(activeChip.textContent).toContain('●')
    // ACTIVE is the current stage; SUSPENDED must appear as upcoming (○),
    // never as a completed state.
    const suspendedChip = within(chain).getByText('Suspended').closest('span').parentElement
    expect(suspendedChip.textContent).toContain('○')
  })

  it('shows entitlement and online-session badges', async () => {
    renderWorkspace()
    // "Entitled" appears both as an EntityHeader badge (rounded-full) and as a
    // detail-card row label — select the badge explicitly.
    await waitFor(() => {
      const badge = screen.getAllByText('Entitled').find((el) => el.className.includes('rounded-full'))
      expect(badge).toBeTruthy()
    })
    expect(screen.getByText('1 online')).toBeInTheDocument()
  })

  it('maps recent RADIUS control logs onto the operational timeline', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('SUSPEND')).toBeInTheDocument())
    expect(screen.getByText('RESTORE')).toBeInTheDocument()
    expect(screen.getByText('NAS timeout')).toBeInTheDocument()
  })

  it('renders the error state when the status endpoint fails', async () => {
    serviceNetworkApi.getServiceNetworkStatus.mockRejectedValueOnce({
      response: { data: { message: 'Forbidden' } },
    })
    renderWorkspace()
    await waitFor(() => expect(screen.getByText(/Could not load service/i)).toBeInTheDocument())
  })
})
