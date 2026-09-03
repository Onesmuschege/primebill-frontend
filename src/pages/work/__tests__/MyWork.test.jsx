import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import MyWork from '../MyWork'
import * as ticketsApi from '../../../api/tickets.api'
import * as invoicesApi from '../../../api/invoices.api'
import * as paymentsApi from '../../../api/payments.api'

const mockTickets = {
  data: [
    { id: 1024, subject: 'No internet', priority: 'high', status: 'open', created_at: '2026-08-30T10:00:00Z', assigned_to: null, client_id: 7 },
    { id: 1025, subject: 'Slow speeds', priority: 'medium', status: 'open', created_at: '2026-08-29T08:00:00Z', assigned_to: { name: 'Jane' }, client_id: 8 },
  ],
  meta: { total: 2 },
}

const mockInvoices = {
  data: [
    { id: 842, invoice_number: 'INV-00842', status: 'overdue', due_date: '2026-08-25', created_at: '2026-08-01', client: { first_name: 'John', last_name: 'Doe' }, client_id: 7 },
  ],
  meta: { total: 1 },
}

const mockPayments = {
  data: [
    { id: 991, reference: 'PAY-991', status: 'failed', created_at: '2026-08-29T14:30:00Z', client: { first_name: 'Alice' }, client_id: 9 },
  ],
  meta: { total: 1 },
}

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('MyWork', () => {
  beforeEach(() => {
    vi.spyOn(ticketsApi, 'getTickets').mockResolvedValue(mockTickets)
    vi.spyOn(invoicesApi, 'getInvoices').mockResolvedValue(mockInvoices)
    vi.spyOn(paymentsApi, 'getPayments').mockResolvedValue(mockPayments)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders summary cards for all three sources', async () => {
    renderWithProviders(<MyWork />)
    await waitFor(() => expect(screen.getByText('Open Tickets')).toBeTruthy())
    expect(screen.getByText('Overdue Invoices')).toBeTruthy()
    expect(screen.getByText('Failed Payments')).toBeTruthy()
  })

  it('renders normalised work items from all sources', async () => {
    renderWithProviders(<MyWork />)
    await waitFor(() => expect(screen.getByText(/Ticket #1024/)).toBeTruthy())
    expect(screen.getByText(/INV-00842/)).toBeTruthy()
    expect(screen.getByText(/PAY-991/)).toBeTruthy()
  })

  it('shows owners when present', async () => {
    renderWithProviders(<MyWork />)
    await waitFor(() => expect(screen.getByText('Jane')).toBeTruthy())
    expect(screen.getByText('Unassigned')).toBeTruthy()
  })
})
