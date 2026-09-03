import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SavedViewsBar from '../SavedViewsBar'

describe('SavedViewsBar', () => {
  beforeEach(() => localStorage.clear())

  it('renders the toolbar with no saved views and a save button', () => {
    render(<SavedViewsBar viewType="tickets" config={{ status: 'open' }} onApply={vi.fn()} />)
    expect(screen.getByText('No saved view')).toBeTruthy()
    expect(screen.getByText('Save view')).toBeTruthy()
    expect(screen.getByText('saved on this device')).toBeTruthy()
  })

  it('saves the current configuration and lists it in the selector', () => {
    const onApply = vi.fn()
    render(<SavedViewsBar viewType="tickets" config={{ status: 'open', sort: 'priority' }} onApply={onApply} />)

    fireEvent.click(screen.getByText('Save view'))
    // Inline form appears; type a name and submit.
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Open High Priority' } })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('Open High Priority')).toBeTruthy()
    // Saved view is now selected — no longer the placeholder.
    expect(screen.queryByText('No saved view')).toBeNull()
  })

  it('applies the config when a saved view is selected', () => {
    const onApply = vi.fn()
    // Pre-seed a saved view via a first interaction.
    const first = render(<SavedViewsBar viewType="tickets2" config={{ status: 'overdue' }} onApply={onApply} />)
    fireEvent.click(first.getByText('Save view'))
    fireEvent.change(first.getByLabelText('View name'), { target: { value: 'Overdue Only' } })
    fireEvent.click(first.getByText('Save'))
    expect(onApply).not.toHaveBeenCalled() // mount-restore runs only if an active view existed before this mount
    first.unmount()

    const onApply2 = vi.fn()
    const second = render(
      <SavedViewsBar viewType="tickets2" config={{ status: 'overdue' }} onApply={onApply2} />
    )
    // Restore-on-mount applies the saved config automatically.
    expect(onApply2).toHaveBeenCalledWith({ status: 'overdue' })

    // Switching back to the placeholder and reselecting the view.
    fireEvent.change(second.getByLabelText('Saved views'), { target: { value: '' } })
    fireEvent.change(second.getByLabelText('Saved views'), { target: { value: 'Overdue Only' } })
    expect(onApply2).toHaveBeenLastCalledWith({ status: 'overdue' })
  })

  it('deletes the active saved view', () => {
    const onApply = vi.fn()
    render(<SavedViewsBar viewType="tickets3" config={{ status: 'open' }} onApply={onApply} />)
    fireEvent.click(screen.getByText('Save view'))
    fireEvent.change(screen.getByLabelText('View name'), { target: { value: 'Temp View' } })
    fireEvent.click(screen.getByText('Save'))

    fireEvent.click(screen.getByText('Delete'))
    // Placeholder option returns; saved view is gone.
    expect(screen.getByText('No saved view')).toBeTruthy()
    expect(screen.queryByText('Temp View')).toBeNull()
    expect(screen.queryByText('Delete')).toBeNull()
  })
})