import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BillingOperations from '../BillingOperations'
import * as invoicesApi from '../../../api/invoices.api'
import * as paymentsApi from '../../../api/payments.api'
import * as collectionsApi from '../../../api/collections.api'

const mockOverdue = {
  data: [
    { id: 1, invoice_number: 'INV-001', status: 'overdue', balance: 2000, due_date: '2026-08-25', client_id: 7, client: { first_name: 'John', last_name: 'Doe' } },
  ],
  meta: { total: 1 },
}

const mockFailedPayments = {
  data: [
    { id: 50, reference: 'PAY-050', status: 'failed', amount: 1500, created_at: '2026-08-29T14:30:00Z', client: { first_name: 'Alice', last_name: 'Smith' } },
  ],
  meta: { total: 1 },
}

const mockUnallocated = {
  data: [
    { id: 60, reference: 'PAY-060', status: 'completed', amount: 3000, allocated_amount: 0, created_at: '2026-08-28T10:00:00Z', client: { first_name: 'Bob', last_name: 'Jones' } },
  ],
  meta: { total: 1 },
}

const mockAging = { buckets: [{ label: '0-30 days', total_amount: 5000, invoice_count: 3 }] }

const mockDunningRuns = { data: [{ invoice_id: 1, step_name: 'SMS Reminder', status: 'executed', executed_at: '2026-08-26' }] }

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('BillingOperations', () => {
  beforeEach(() => {
    vi.spyOn(invoicesApi, 'getInvoices').mockResolvedValueOnce(mockOverdue).mockResolvedValueOnce({ data: [], meta: { total: 0 } })
    vi.spyOn(paymentsApi, 'getPayments').mockResolvedValueOnce(mockFailedPayments).mockResolvedValueOnce(mockUnallocated)
    vi.spyOn(collectionsApi, 'getAging').mockResolvedValue({ data: mockAging })
    vi.spyOn(collectionsApi, 'getDunningRuns').mockResolvedValue(mockDunningRuns)
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders summary cards', async () => {
    renderWithProviders(<BillingOperations />)
    await waitFor(() => expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Unallocated').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Failed Payments').length).toBeGreaterThan(0)
  })

  it('renders overdue invoices with dunning state', async () => {
    renderWithProviders(<BillingOperations />)
    await waitFor(() => expect(screen.getByText('INV-001')).toBeTruthy())
    expect(screen.getByText('SMS Reminder')).toBeTruthy()
  })

  it('renders failed payments', async () => {
    renderWithProviders(<BillingOperations />)
    await waitFor(() => expect(screen.getByText('PAY-050')).toBeTruthy())
  })

  it('renders unallocated in summary', async () => {
    renderWithProviders(<BillingOperations />)
    await waitFor(() => expect(screen.getAllByText('Unallocated').length).toBeGreaterThan(0))
    expect(screen.getAllByText('Unallocated').length).toBeGreaterThan(0)
  })
})
