import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AutomationCommandCenter from '../AutomationCommandCenter'
import * as automationApi from '../../../api/automation.api'

vi.mock('../../../api/automation.api', () => ({
  getAutomationJobs: vi.fn(),
  getAutomationRules: vi.fn(),
  retryAutomationJob: vi.fn(),
}))

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AutomationCommandCenter />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('AutomationCommandCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pipeline state derived from real status_counts and failure queue', async () => {
    automationApi.getAutomationJobs.mockResolvedValue({
      status_counts: { processing: 2, done: 12, failed: 3 },
      failed_jobs: [
        { id: 7, event_type: 'service.activate', attempts: 2, error: 'Router timeout', failed_at: '2026-09-01T10:00:00Z' },
      ],
      recent: [
        { id: 1, type: 'job.processed', status: 'success', completed_at: '2026-09-01T09:59:00Z' },
      ],
    })
    automationApi.getAutomationRules.mockResolvedValue([
      { id: 1, name: 'Auto-suspend on overdue', event_type: 'invoice.overdue' },
    ])

    renderPage()

    // Header + state badges come from real counts
    expect(await screen.findByText('Automation command center')).toBeInTheDocument()
    expect(screen.getAllByText(/3 failed/).length).toBeGreaterThan(0)
    // Failed job surfaces in the work queue with its real error
    expect(await screen.findByText(/service\.activate #7/)).toBeInTheDocument()
    expect(screen.getByText('Router timeout')).toBeInTheDocument()
    // Rules snapshot renders the real rule
    expect(screen.getByText('Auto-suspend on overdue')).toBeInTheDocument()
  })

  it('renders a healthy state when there are no failures', async () => {
    automationApi.getAutomationJobs.mockResolvedValue({
      status_counts: { processing: 0, done: 5, failed: 0 },
      failed_jobs: [],
      recent: [],
    })
    automationApi.getAutomationRules.mockResolvedValue([])

    renderPage()

    expect(await screen.findByText('Automation command center')).toBeInTheDocument()
    expect(screen.getByText('No unresolved automation failures')).toBeInTheDocument()
  })
})
