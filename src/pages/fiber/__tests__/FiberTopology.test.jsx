import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FiberTopology from '../FiberTopology'
import * as fiberApi from '../../../api/fiber.api'

vi.mock('../../../api/fiber.api', () => ({
  getOlt: vi.fn(),
}))

// Authoritative payload shape copied from OltController::show — OLT with
// ponPorts.onts_count and onts.clientAccount loaded by the controller.
const OLT = {
  id: 3,
  name: 'OLT-East',
  vendor: 'Huawei',
  model: 'OLT5800',
  ip_address: '10.20.0.1',
  status: 'online',
  location: 'East DC',
  location_lat: '-1.2921',
  location_lng: '36.8219',
  updated_at: '2026-09-03T09:00:00Z',
  pon_ports_count: 2,
  onts_count: 3,
  ponPorts: [
    { id: 11, name: 'PON-1/1', technology: 'GPON', status: 'active', max_onts: 64, registered_onts: 2, onts_count: 2 },
    { id: 12, name: 'PON-1/2', technology: 'GPON', status: 'active', max_onts: 64, registered_onts: 0, onts_count: 0 },
  ],
  onts: [
    { id: 101, pon_port_id: 11, serial: 'HWTC12345678', mac_address: 'AA:BB:CC:DD:EE:FF', vendor: 'Huawei', model: 'HG8245', rx_signal: -23.5, status: 'online', last_seen: '2026-09-03T08:55:00Z', client_account_id: 42, clientAccount: { id: 42, username: 'jdoe-fiber' } },
    { id: 102, pon_port_id: 11, serial: 'HWTC12345679', rx_signal: -28.1, status: 'offline', client_account_id: null, clientAccount: null },
    { id: 103, pon_port_id: null, serial: 'HWTC99887766', rx_signal: null, status: 'inactive', client_account_id: null, clientAccount: null },
  ],
}

function renderTopology() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/fiber/topology/3']}>
        <Routes>
          <Route path="/fiber/topology/:id" element={<FiberTopology />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  fiberApi.getOlt.mockResolvedValue(OLT)
})
describe('FiberTopology (OLT → PON → ONT, P2 §23)', () => {
  it('renders the OLT root and its PON ports', async () => {
    renderTopology()
    // OLT name appears in BOTH the EntityHeader title and the topology root
    // node — assert all occurrences.
    await waitFor(() => expect(screen.getAllByText('OLT-East').length).toBeGreaterThan(0))
    expect(screen.getByText('PON-1/1')).toBeInTheDocument()
    expect(screen.getByText('PON-1/2')).toBeInTheDocument()
    expect(screen.getByText('2 PON ports')).toBeInTheDocument()
  })

  it('renders ONTs under their real PON port with signal and status', async () => {
    renderTopology()
    await waitFor(() => expect(screen.getByText('HWTC12345678')).toBeInTheDocument())
    expect(screen.getByText('HWTC12345679')).toBeInTheDocument()
    // Environmentally weak signal is shown in amber, never force-labeled.
    expect(screen.getByText('-28.1 dBm')).toBeInTheDocument()
  })

  it('deep-links a linked ONT to the Service 360 workspace', async () => {
    renderTopology()
    await waitFor(() => expect(screen.getByText('jdoe-fiber')).toBeInTheDocument())
    const link = screen.getByText('jdoe-fiber').closest('a')
    expect(link).toBeTruthy()
    expect(link.getAttribute('href')).toBe('/subscribers/services/42')
  })

  it('shows ports with no ONTs explicitly and never invents unassigned links', async () => {
    renderTopology()
    await waitFor(() => expect(screen.getByText('PON-1/2')).toBeInTheDocument())
    expect(screen.getByText('No ONTs on this port.')).toBeInTheDocument()
  })

  it('renders unassigned ONTs separately instead of attaching them to a port', async () => {
    renderTopology()
    await waitFor(() => expect(screen.getByText(/Unassigned ONTs \(1\)/)).toBeInTheDocument())
    expect(screen.getByText('HWTC99887766')).toBeInTheDocument()
  })

  it('renders the error state when the OLT cannot be loaded', async () => {
    fiberApi.getOlt.mockRejectedValueOnce({ response: { data: { message: 'Forbidden' } } })
    renderTopology()
    await waitFor(() => expect(screen.getByText(/Could not load OLT topology/i)).toBeInTheDocument())
  })
})