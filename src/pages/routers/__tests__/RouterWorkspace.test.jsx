import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RouterWorkspace from '../RouterWorkspace'
import * as routersApi from '../../../api/routers.api'

vi.mock('../../../api/routers.api', () => ({
  getRouter: vi.fn(),
  getRouterHealth: vi.fn(),
  getRouterResources: vi.fn(),
  getRouterSessions: vi.fn(),
  testRouterConnection: vi.fn(),
}))

// ActionRail uses useAuth().hasPermission — grant all for workspace rendering.
vi.mock('../../../context/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({ hasPermission: () => true }),
}))

// Authoritative payloads copied from RouterController / RouterHealthService.
const ROUTER = {
  id: 9,
  name: 'core-rtr-01',
  ip_address: '10.0.0.1',
  port: 8728,
  type: 'mikrotik',
  vendor: 'MikroTik',
  model: 'RB4011',
  location: 'Nairobi DC',
  status: 'online',
  health_state: 'healthy',
  last_health_check_at: '2026-09-03T09:00:00Z',
  routeros_version: '7.15.3',
  device_type: 'nas',
  nas_identifier: 'NAS-01',
  radius_ip: '10.0.0.1',
  radius_auth_port: 1812,
  coa_port: 3799,
  location_lat: '-1.2921',
  location_lng: '36.8219',
}

const HEALTH = {
  router_id: 9,
  name: 'core-rtr-01',
  configured: true,
  reachable: true,
  synchronized: true,
  provisioning_ready: true,
  health_state: 'healthy',
  label: 'Healthy',
  routeros_version: '7.15.3',
  last_sync_age_seconds: 90,
  last_health_error: null,
}

const RESOURCES = {
  uptime: '3d11h25m40s',
  version: '7.15.3 (stable)',
  'cpu-load': '2',
  'free-memory': '121 MiB',
  'total-memory': '244 MiB',
  'board-name': 'RB4011iGS+',
  'cpu-count': '4',
  'cpu-frequency': '1400MHz',
  'architecture-name': 'arm',
}

const SESSIONS = {
  data: [
    { name: 'jdoe-pppoe', service: 'pppoe', address: '10.10.0.44', 'caller-id': '', uptime: '1h2m3s', 'session-id': '0x1', 'bytes-in': 1536 * 1024, 'bytes-out': 512 * 1024 },
  ],
  meta: {},
}

function renderWorkspace() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/routers/9']}>
        <Routes>
          <Route path="/routers/:id" element={<RouterWorkspace />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  routersApi.getRouter.mockResolvedValue(ROUTER)
  routersApi.getRouterHealth.mockResolvedValue(HEALTH)
  routersApi.getRouterResources.mockResolvedValue(RESOURCES)
  routersApi.getRouterSessions.mockResolvedValue(SESSIONS)
  routersApi.testRouterConnection.mockResolvedValue({ connected: true })
})
describe('RouterWorkspace (advanced diagnostics, P2 §22)', () => {
  it('renders identity from the real router record', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('core-rtr-01')).toBeInTheDocument())
    expect(screen.getByText('Healthy')).toBeInTheDocument()
    // Meta identifies NAS + location from real fields.
    await waitFor(() => expect(screen.getByText('10.0.0.1:8728')).toBeInTheDocument())
    expect(screen.getByText('NAS-01')).toBeInTheDocument()
  })

  it('renders the probe chain with done states from the authoritative probe', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('Live probe')).toBeInTheDocument())
    const reachableChip = screen.getByText('Reachable').closest('span').parentElement
    expect(reachableChip.textContent).toContain('✓')
    const provisionChip = screen.getByText('Provisioning ready').closest('span').parentElement
    expect(provisionChip.textContent).toContain('✓')
  })

  it('marks unreachable probes as FAILED, never fabricated as healthy', async () => {
    routersApi.getRouterHealth.mockResolvedValue({
      ...HEALTH,
      reachable: false,
      synchronized: false,
      provisioning_ready: false,
      health_state: 'unavailable',
      label: 'Unavailable',
      last_health_error: 'Router did not respond to the RouterOS API probe',
    })
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('Unavailable')).toBeInTheDocument())
    const reachableChip = screen.getByText('Reachable').closest('span').parentElement
    expect(reachableChip.textContent).toContain('✗')
    expect(screen.getByText(/Router did not respond/)).toBeInTheDocument()
  })

  it('renders RouterOS resources and active session bytes truthfully', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('RouterOS resources')).toBeInTheDocument())
    expect(screen.getByText('3d11h25m40s')).toBeInTheDocument() // uptime
    await waitFor(() => expect(screen.getByText('jdoe-pppoe')).toBeInTheDocument())
    expect(screen.getByText('10.10.0.44')).toBeInTheDocument()
    expect(screen.getByText('1.5 MB')).toBeInTheDocument() // 1536 KiB down
    expect(screen.getByText('512.0 KB')).toBeInTheDocument() // 512 KiB up
  })

  it('shows an explicit no-data state when MikroTik resources are empty', async () => {
    routersApi.getRouterResources.mockResolvedValue({})
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('RouterOS resources')).toBeInTheDocument())
    expect(screen.getByText(/did not respond to the RouterOS API/)).toBeInTheDocument()
  })

  it('runs the probe action and invalidates related queries', async () => {
    renderWorkspace()
    await waitFor(() => expect(screen.getByText('core-rtr-01')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Probe / Test connection'))
    await waitFor(() => expect(routersApi.testRouterConnection).toHaveBeenCalledWith('9'))
  })

  it('renders error state when the router record cannot be loaded', async () => {
    routersApi.getRouter.mockRejectedValueOnce({ response: { data: { message: 'Forbidden' } } })
    renderWorkspace()
    await waitFor(() => expect(screen.getByText(/Could not load router/i)).toBeInTheDocument())
  })
})