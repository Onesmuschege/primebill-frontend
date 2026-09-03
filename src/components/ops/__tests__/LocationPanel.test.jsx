import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LocationPanel from '../LocationPanel'

describe('LocationPanel (P2 §24)', () => {
  it('renders real coordinates with an external map deep-link', () => {
    render(<LocationPanel lat={-1.2921} lng={36.8219} label="GPS" />)
    expect(screen.getByText('GPS')).toBeInTheDocument()
    expect(screen.getByText('-1.2921, 36.8219')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Open in map/ })
    expect(link.getAttribute('href')).toContain('openstreetmap.org')
    expect(link.getAttribute('href')).toContain('mlat=-1.2921')
    // External map links must never share the app's session/credentials.
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('renders nothing when coordinates are absent — never invents a marker', () => {
    const { container } = render(<LocationPanel lat={null} lng={undefined} />)
    expect(container.firstChild).toBeNull()
  })
})