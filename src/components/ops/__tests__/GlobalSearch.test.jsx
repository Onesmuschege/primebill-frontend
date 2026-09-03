import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import GlobalSearch from '../GlobalSearch'
import * as clientsApi from '../../../api/clients.api'
import * as invoicesApi from '../../../api/invoices.api'
import * as paymentsApi from '../../../api/payments.api'
import * as ticketsApi from '../../../api/tickets.api'
import * as routersApi from '../../../api/routers.api'

const mockClients = { data: [{ id: 1, first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '123' }], meta: { total: 1 } }
const mockInvoices = { data: [{ id: 1, invoice_number: 'INV-001', client: { first_name: 'John', last_name: 'Doe' } }], meta: { total: 1 } }
const mockPayments = { data: [], meta: { total: 0 } }
const mockTickets = { data: [], meta: { total: 0 } }
const mockRouters = { data: [], meta: { total: 0 } }

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.spyOn(clientsApi, 'getClients').mockResolvedValue(mockClients)
    vi.spyOn(invoicesApi, 'getInvoices').mockResolvedValue(mockInvoices)
    vi.spyOn(paymentsApi, 'getPayments').mockResolvedValue(mockPayments)
    vi.spyOn(ticketsApi, 'getTickets').mockResolvedValue(mockTickets)
    vi.spyOn(routersApi, 'getRouters').mockResolvedValue(mockRouters)
  })

  afterEach(() => { vi.restoreAllMocks() })

  it('renders nothing when closed', () => {
    renderWithProviders(<GlobalSearch isOpen={false} onClose={vi.fn()} />)
    expect(screen.queryByPlaceholderText(/Search/)).toBeNull()
  })

  it('renders search input when open', () => {
    renderWithProviders(<GlobalSearch isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByPlaceholderText(/Search/)).toBeTruthy()
  })

  it('shows min query message for short queries', () => {
    renderWithProviders(<GlobalSearch isOpen={true} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: 'a' } })
    expect(screen.getByText(/at least 2 characters/)).toBeTruthy()
  })

  it('renders grouped results for valid query', async () => {
    renderWithProviders(<GlobalSearch isOpen={true} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: 'John' } })
    await waitFor(() => expect(screen.getByText('John Doe')).toBeTruthy())
    expect(screen.getByText('Clients (1)')).toBeTruthy()
    expect(screen.getByText('Invoices (1)')).toBeTruthy()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    renderWithProviders(<GlobalSearch isOpen={true} onClose={onClose} />)
    fireEvent.click(screen.getByText(/Esc to close/).closest('.fixed').querySelector('.absolute'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows no results message when nothing matches', async () => {
    vi.spyOn(clientsApi, 'getClients').mockResolvedValue({ data: [], meta: { total: 0 } })
    vi.spyOn(invoicesApi, 'getInvoices').mockResolvedValue({ data: [], meta: { total: 0 } })
    renderWithProviders(<GlobalSearch isOpen={true} onClose={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText(/Search/), { target: { value: 'xyz123' } })
    await waitFor(() => expect(screen.getByText(/No results/)).toBeTruthy())
  })
})
