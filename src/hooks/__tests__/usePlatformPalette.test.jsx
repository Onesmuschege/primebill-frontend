import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { usePlatformPalette, PLATFORM_COMMANDS } from '../usePlatformPalette'
import { PLATFORM_NAV } from '../../utils/platformNav'

// Harness wires the hook to the router so navigation can be asserted by
// which route renders.
function LocationProbe({ label }) {
  const { pathname, search } = useLocation()
  return <div data-testid="probe" data-path={pathname} data-search={search}>{label}</div>
}

function Harness() {
  const palette = usePlatformPalette()
  return (
    <>
      <button onClick={palette.open} aria-label="open-palette" />
      {palette.isOpen && (
        <ul>
          {palette.filteredCommands.map((cmd) => (
            <li key={cmd.id}>
              <button onClick={() => palette.execute(cmd)} data-cmd={cmd.id}>{cmd.label}</button>
            </li>
          ))}
        </ul>
      )}
      <Routes>
        <Route path="/platform" element={<LocationProbe label="overview" />} />
        <Route path="/platform/billing" element={<LocationProbe label="billing" />} />
        <Route path="/platform/tenants" element={<LocationProbe label="tenants" />} />
        <Route path="/platform/system" element={<LocationProbe label="system" />} />
        <Route path="/platform/audit-log" element={<LocationProbe label="audit" />} />
      </Routes>
    </>
  )
}

function renderHarness(initialEntry = '/platform') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness />
    </MemoryRouter>
  )
}

describe('PLATFORM_COMMANDS registry', () => {
  it('mirrors every nav item plus the quick actions', () => {
    const navTargets = PLATFORM_NAV.flatMap((g) => g.items.map((i) => i.to)).sort()
    const navCommandTargets = PLATFORM_COMMANDS
      .filter((c) => c.id.startsWith('nav-'))
      .map((c) => c.href)
      .sort()
    expect(navCommandTargets).toEqual(navTargets)

    const quick = PLATFORM_COMMANDS.filter((c) => c.section === 'Quick Actions')
    expect(quick.map((c) => c.id).sort()).toEqual([
      'qa-audit', 'qa-overdue', 'qa-suspended', 'qa-system', 'qa-trials',
    ])
  })
})

describe('usePlatformPalette', () => {
  it('opens on Ctrl+K and lists navigation commands', () => {
    renderHarness()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByText('Go to Command Center')).toBeTruthy()
    expect(screen.getByText('Go to Tenants')).toBeTruthy()
    expect(screen.getByText('Go to Billing & Revenue')).toBeTruthy()
  })

  it('overdue-invoices quick action deep-links into the filtered billing view', () => {
    renderHarness()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.click(screen.getByText('View overdue invoices'))
    const probe = screen.getByTestId('probe')
    expect(probe.dataset.path).toBe('/platform/billing')
    expect(probe.dataset.search).toBe('?status=overdue')
  })

  it('suspended-tenants quick action deep-links into the filtered tenants view', () => {
    renderHarness()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.click(screen.getByText('View suspended tenants'))
    const probe = screen.getByTestId('probe')
    expect(probe.dataset.path).toBe('/platform/tenants')
    expect(probe.dataset.search).toBe('?status=suspended')
  })

  it('closes on Escape', () => {
    renderHarness()
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByText('Go to Tenants')).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Go to Tenants')).toBeNull()
  })
})
