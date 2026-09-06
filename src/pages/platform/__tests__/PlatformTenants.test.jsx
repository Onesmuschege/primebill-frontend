import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PlatformTenants from '../PlatformTenants'
import * as platformApi from '../../../api/platform.api'

// Mock the platform API surface so the table renders against controlled data.
vi.mock('../../../api/platform.api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getPlatformTenants: vi.fn(),
    createTenant: vi.fn(),
    updateTenant: vi.fn(),
    suspendTenant: vi.fn(),
    activateTenant: vi.fn(),
    archiveTenant: vi.fn(),
  }
})

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } })
}

function renderPage() {
  const queryClient = makeQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlatformTenants />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

// Mirrors the backend paginated slice: { data, meta: { total, last_page, ... } }.
function mockPaginatedResponse({ page = 1, perPage = 20, total = 40, tenants } = {}) {
  const data = tenants ?? [
    { id: 1, name: 'Acme ISP', slug: 'acme', status: 'active', plan: 'professional', client_count: 120, created_at: '2026-08-01T00:00:00Z' },
    { id: 2, name: 'Coastlink ISPs', slug: 'coastlink', status: 'suspended', plan: 'starter', client_count: 40, created_at: '2026-08-05T00:00:00Z' },
  ]

  const slice = data.slice((page - 1) * perPage, page * perPage)
  return {
    data: slice,
    meta: {
      current_page: page,
      per_page: perPage,
      total,
      last_page: Math.ceil(total / perPage),
      from: (page - 1) * perPage + 1,
      to: Math.min(page * perPage, total),
    },
  }
}

describe('PlatformTenants — server-side pagination (P2A)', () => {
  beforeEach(() => {
    platformApi.getPlatformTenants.mockReset()
    // total: 40 → last_page = 2, so the Pagination component renders.
    platformApi.getPlatformTenants.mockResolvedValue(mockPaginatedResponse({ total: 40, tenants: [] }))
  })

  it('requests the first page on initial load with default sort', async () => {
    renderPage()
    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenCalledWith({
        page: 1,
        per_page: 20,
        search: undefined,
        status: undefined,
        sort: 'created_at',
        direction: 'desc',
      })
    })
  })

  it('fires a new request with page: 2 when the page-2 button is clicked', async () => {
    platformApi.getPlatformTenants
      .mockResolvedValueOnce(mockPaginatedResponse({ page: 1, total: 40, tenants: [{ id: 1, name: 'Acme First', slug: 'acme-first', status: 'active', plan: 'starter', client_count: 10, created_at: '2026-01-01T00:00:00Z' }] }))
      .mockResolvedValueOnce(mockPaginatedResponse({ page: 2, total: 40, tenants: [{ id: 99, name: 'Page2 ISP', slug: 'p2', status: 'active', plan: 'enterprise', client_count: 5, created_at: '2026-09-01T00:00:00Z' }] }))

    renderPage()
    await waitFor(() => expect(platformApi.getPlatformTenants).toHaveBeenCalledTimes(1))

    // The Pagination component renders numbered <button> elements — click '2'.
    const page2Btn = await screen.findByRole('button', { name: '2' })
    fireEvent.click(page2Btn)

    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2 }))
    })
  })
})

describe('PlatformTenants — URL sync & debounced search (P2A)', () => {
  beforeEach(() => {
    platformApi.getPlatformTenants.mockReset()
    platformApi.getPlatformTenants.mockResolvedValue(mockPaginatedResponse({ total: 2, tenants: [] }))
  })

  it('syncs the search parameter to the API after the 300ms debounce', async () => {
    renderPage()
    await waitFor(() => expect(platformApi.getPlatformTenants).toHaveBeenCalledTimes(1))

    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'acme' } })

    // The debounce timer (300ms) pushes the trimmed value into the query key.
    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'acme' })
      )
    }, { timeout: 1000 })
  })

  it('syncs the status filter when a status option is selected', async () => {
    renderPage()
    await waitFor(() => expect(platformApi.getPlatformTenants).toHaveBeenCalledTimes(1))

    // The status filter is a native <select> — change fires setPage(1) + refetch.
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'suspended' } })

    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'suspended' })
      )
    })
  })

  it('updates the sort key and direction when a sortable column header is clicked', async () => {
    renderPage()
    await waitFor(() => expect(platformApi.getPlatformTenants).toHaveBeenCalledTimes(1))

    // Sortable headers are <th> elements; clicking "Clients" maps to client_count.
    // findByText awaits the initial query resolving (spinner → table).
    fireEvent.click(await screen.findByText('Clients'))

    await waitFor(() => {
      expect(platformApi.getPlatformTenants).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'client_count', direction: 'asc' })
      )
    })
  })
})

describe('PlatformTenants — loading & error states (P2A)', () => {
  beforeEach(() => {
    platformApi.getPlatformTenants.mockReset()
    platformApi.getPlatformTenants.mockResolvedValue(mockPaginatedResponse({ total: 1, tenants: [] }))
  })

  it('renders a spinner while the tenant list is being fetched', async () => {
    platformApi.getPlatformTenants.mockReturnValue(new Promise(() => {})) // never resolves
    renderPage()
    // The Table component renders a Spinner (a div with .animate-spin) when loading.
    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).not.toBeNull()
    })
  })

  it('renders the empty state when the tenant query fails', async () => {
    // No onError handler on the query itself; a rejected query leaves the table
    // at its empty message (no fabricated error banner).
    platformApi.getPlatformTenants.mockRejectedValueOnce(new Error('Network error'))
    renderPage()

    await waitFor(() => {
      expect(screen.getByText('No tenants yet')).toBeTruthy()
    })
  })
})