import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import CommandPalette from '../CommandPalette'

function renderWithProviders(ui) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  )
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    renderWithProviders(<CommandPalette />)
    expect(screen.queryByPlaceholderText(/command/i)).toBeNull()
  })

  it('opens on Ctrl+K', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByPlaceholderText(/command/i)).toBeTruthy()
  })

  it('closes on Escape', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByPlaceholderText(/command/i)).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByPlaceholderText(/command/i)).toBeNull()
  })

  it('filters commands by query', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText(/command/i), { target: { value: 'router' } })
    expect(screen.getByText('Go to Routers')).toBeTruthy()
    expect(screen.queryByText('Go to Clients')).toBeNull()
  })

  it('shows all commands when query is empty', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByText('Go to Dashboard')).toBeTruthy()
    expect(screen.getByText('Go to Clients')).toBeTruthy()
  })

  it('shows no results message when no match', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    fireEvent.change(screen.getByPlaceholderText(/command/i), { target: { value: 'xyznonexistent' } })
    expect(screen.getByText('No commands found')).toBeTruthy()
  })

  it('displays command count in footer', () => {
    renderWithProviders(<CommandPalette />)
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByText(/commands/)).toBeTruthy()
  })
})
