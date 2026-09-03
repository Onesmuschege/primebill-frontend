import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import PlatformCommandPalette from '../PlatformCommandPalette'
import { usePlatformPalette } from '../../../hooks/usePlatformPalette'
import { getPlatformTenants } from '../../../api/platform.api'

// The palette searches tenants server-side — mock that endpoint only.
vi.mock('../../../api/platform.api', () => ({
  getPlatformTenants: vi.fn(),
}))

function Harness() {
  const palette = usePlatformPalette()
  return (
    <PlatformCommandPalette
      isOpen={palette.isOpen}
      close={palette.close}
      query={palette.query}
      setQuery={palette.setQuery}
      filteredCommands={palette.filteredCommands}
      execute={palette.execute}
    />
  )
}

function renderPalette() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Harness />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  getPlatformTenants.mockReset()
  getPlatformTenants.mockResolvedValue({ data: [], total: 0 })
})

describe('PlatformCommandPalette', () => {
  it('opens on Ctrl+K and lists platform commands', () => {
    renderPalette()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByLabelText('Platform command palette')).toBeTruthy()
    expect(screen.getByText('Go to Command Center')).toBeTruthy()
    expect(screen.getByText('Open system health')).toBeTruthy()
  })

  it('shows command sections when open with an empty query', () => {
    renderPalette()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    // Section headers; 'Operations' also appears as a command description,
    // so assert presence rather than uniqueness.
    expect(screen.getAllByText('Operations').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Commercial').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Security').length).toBeGreaterThan(0)
    expect(screen.getByText('Quick Actions')).toBeTruthy()
  })

  it('searches tenants server-side once the query is long enough', async () => {
    getPlatformTenants.mockResolvedValue({
      data: [
        { id: 7, name: 'Acme ISP', slug: 'acme' },
        { id: 9, name: 'Acme North', slug: 'acme-north' },
      ],
      total: 2,
    })
    renderPalette()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText(/search tenants/i), { target: { value: 'acme' } })

    await waitFor(() => {
      expect(getPlatformTenants).toHaveBeenCalledWith({ search: 'acme', per_page: 5 })
    }, { timeout: 1500 })
    await waitFor(() => {
      expect(screen.getByText('Acme ISP')).toBeTruthy()
      expect(screen.getByText('acme-north')).toBeTruthy()
    })
    // The tenants section header appears once results exist.
    expect(screen.getByText('Tenants')).toBeTruthy()
  })

  it('does not call the tenant endpoint for a 1-character query', () => {
    renderPalette()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText(/search tenants/i), { target: { value: 'a' } })
    expect(getPlatformTenants).not.toHaveBeenCalled()
  })

  it('closes on Escape', () => {
    renderPalette()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByLabelText('Platform command palette')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByLabelText('Platform command palette')).toBeNull()
  })
})
