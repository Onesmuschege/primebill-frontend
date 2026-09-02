import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import EntityHeader from '../EntityHeader'
import StateChain from '../StateChain'
import RelationshipNav from '../RelationshipNav'
import { buildServiceStateChain } from '../../../utils/statusMeta'


function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

beforeEach(() => {})

// ---------------------------------------------------------------------------
// EntityHeader
// ---------------------------------------------------------------------------
describe('EntityHeader', () => {
  it('renders identity, status and metadata', () => {
    render(
      <EntityHeader
        typeLabel="Service"
        title="jdoe PPPoE"
        identifier="#ACC-1042"
        status={{ label: 'Active', toneClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }}
        badges={[{ label: '50 Mbps' }]}
        meta={[{ label: 'Plan', value: 'Fiber 50' }, { label: 'IP', value: '10.0.0.44' }]}
        lastUpdated="Updated 12s ago"
      />
    )
    expect(screen.getByRole('heading', { name: 'jdoe PPPoE' })).toBeInTheDocument()
    expect(screen.getByText('#ACC-1042')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('50 Mbps')).toBeInTheDocument()
    expect(screen.getByText('Fiber 50')).toBeInTheDocument()
    expect(screen.getByText('10.0.0.44')).toBeInTheDocument()
    expect(screen.getByText('Updated 12s ago')).toBeInTheDocument()
  })

  it('renders breadcrumb links for contextual navigation', () => {
    renderWithRouter(
      <EntityHeader
        title="jdoe PPPoE"
        breadcrumbs={[
          { label: 'Clients', to: '/clients' },
          { label: 'John Doe', to: '/clients/7' },
          { label: 'Services' },
        ]}
      />
    )
    expect(screen.getByRole('link', { name: 'Clients' })).toHaveAttribute('href', '/clients')
    expect(screen.getByRole('link', { name: 'John Doe' })).toHaveAttribute('href', '/clients/7')
    expect(screen.getByText('Services')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// StateChain
// ---------------------------------------------------------------------------
describe('StateChain', () => {
  it('renders stages and marks the active one with aria-current', () => {
    const items = buildServiceStateChain('ACTIVE')
    render(<StateChain items={items} ariaLabel="Service state" />)
    expect(screen.getByRole('list', { name: 'Service state' })).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Suspended')).toBeInTheDocument()
    // earlier flow stages are done, later are upcoming
    expect(items.find((i) => i.id === 'PENDING').state).toBe('done')
    expect(items.find((i) => i.id === 'PROVISIONING').state).toBe('done')
    expect(items.find((i) => i.id === 'SUSPENDED').state).toBe('upcoming')
    expect(items.find((i) => i.id === 'ACTIVE').state).toBe('active')
  })

  it('shows legal next states as detail (mirrored allowedTransitions)', () => {
    const items = buildServiceStateChain('SUSPENDED')
    const active = items.find((i) => i.state === 'active')
    expect(active.id).toBe('SUSPENDED')
    expect(active.detail).toContain('Active')
    expect(active.detail).toContain('Terminated')
  })

  it('falls back to a single unknown stage for unrecognized states', () => {
    const items = buildServiceStateChain('WEIRD_STATE')
    expect(items).toEqual([{ id: 'WEIRD_STATE', label: 'WEIRD_STATE', state: 'active' }])
  })

  it('renders failed/done stages with non-colour glyph parity', () => {
    render(
      <StateChain
        items={[
          { id: 'radius', label: 'RADIUS', state: 'done' },
          { id: 'mikrotik', label: 'MikroTik', state: 'failed' },
        ]}
        ariaLabel="Provisioning"
      />
    )
    const failedChip = screen.getByText('MikroTik').closest('span').parentElement
    expect(failedChip.textContent).toContain('✗')
    const doneChip = screen.getByText('RADIUS').closest('span').parentElement
    expect(doneChip.textContent).toContain('✓')
  })
})

// ---------------------------------------------------------------------------
// RelationshipNav
// ---------------------------------------------------------------------------
describe('RelationshipNav', () => {
  it('renders grouped entity links with counts', () => {
    renderWithRouter(
      <RelationshipNav
        groups={[
          {
            title: 'Billing',
            items: [
              { label: 'Invoices', to: '/billing/invoices', count: 4 },
              { label: 'Payments', to: '/billing/payments', count: 12 },
            ],
          },
          { title: 'Network', items: [{ label: 'Sessions', onClick: vi.fn() }] },
        ]}
      />
    )
    expect(screen.getByRole('link', { name: /Invoices/ })).toHaveAttribute('href', '/billing/invoices')
    expect(screen.getByLabelText('4 Invoices')).toBeInTheDocument()
    expect(screen.getByLabelText('12 Payments')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sessions/ })).toBeInTheDocument()
  })
})
