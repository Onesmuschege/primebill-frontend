import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import NetworkCommandCenter from '../NetworkCommandCenter'
import * as networkApi from '../../../api/network.api'
import * as incidentsApi from '../../../api/incidents.api'

const mockOverview = {
  routers: { total: 10, online: 9, offline: 1 },
  radius: { online: 42, auth_failures: 3 },
  sessions: { active_pppoe: 30, active_hotspot: 12, total_active: 42, traffic_bytes: 1048576000 },
  alerts: { suspended_services: 5, provisioning_failures: 2, coa_failures: 1 },
  last_updated: '2026-08-30T14:00:00Z',
}

const mockRouters = {
  data: [
    { id: 1, name: 'Core-Router-1', ip_address: '10.0.0.1', status: 'online', type: 'mikrotik', last_seen: '2026-08-30T13:55:00Z' },
    { id: 2, name: 'Edge-Router-2', ip_address: '10.0.0.2', status: 'offline', type: 'mikrotik', last_seen: '2026-08-29T10:00:00Z' },
  ],
  meta: { total: 2 },
}

const mockSessions = {
  data: [
    { id: 101, username: 'jdoe', ip_address: '192.168.1.10', access_method: 'pppoe', bytes_in: 1024000, bytes_out: 2048000, session_start: '2026-08-30T12:00:00Z', account: { username: 'jdoe', client: { first_name: 'John', last_name: 'Doe' } } },
  ],
  meta: { total: 1 },
}

const mockEvents = { data: [{ id: 201, event_type: 'RADIUS_REJECT', severity: 'warning', description: 'Auth failed', created_at: '2026-08-30T13:00:00Z' }] }
const mockIncidents = { data: [{ id: 301, title: 'OLT-3 Down', severity: 'critical', status: 'open', description: 'PON port failure' }], meta: { total: 1 } }

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('NetworkCommandCenter', () => {
  beforeEach(() => {
    vi.spyOn(networkApi, 'getNetworkOverview').mockResolvedValue(mockOverview)
    vi.spyOn(networkApi, 'getNetworkRouters').mockResolvedValue(mockRouters)
    vi.spyOn(networkApi, 'getNetworkSessions').mockResolvedValue(mockSessions)
    vi.spyOn(networkApi, 'getNetworkEvents').mockResolvedValue(mockEvents)
    vi.spyOn(incidentsApi, 'getIncidents').mockResolvedValue(mockIncidents)
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders health cards from overview', async () => {
    renderWithProviders(<NetworkCommandCenter />)
    await waitFor(() => expect(screen.getByText('90%')).toBeTruthy())
    expect(screen.getByText('Routers Online')).toBeTruthy()
    expect(screen.getByText('Auth Failures')).toBeTruthy()
  })

  it('renders routers with status', async () => {
    renderWithProviders(<NetworkCommandCenter />)
    await waitFor(() => expect(screen.getByText('90%')).toBeTruthy())
    fireEvent.click(screen.getByText('Routers'))
    await waitFor(() => expect(screen.getByText('Core-Router-1')).toBeTruthy())
    expect(screen.getByText('Edge-Router-2')).toBeTruthy()
  })

  it('renders active sessions', async () => {
    renderWithProviders(<NetworkCommandCenter />)
    await waitFor(() => expect(screen.getByText('90%')).toBeTruthy())
    fireEvent.click(screen.getByText('Sessions'))
    await waitFor(() => expect(screen.getByText('jdoe')).toBeTruthy())
  })

  it('shows open incidents in health cards', async () => {
    renderWithProviders(<NetworkCommandCenter />)
    await waitFor(() => expect(screen.getByText('Open Incidents')).toBeTruthy())
  })
})
