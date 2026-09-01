/**
 * Bulk COGS Page Tests
 * Tests for src/app/(dashboard)/cogs/bulk/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock BulkCogsForm component
vi.mock('@/components/custom/BulkCogsForm', () => ({
  BulkCogsForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="bulk-cogs-form" onClick={onSuccess}>
      BulkCogsForm
    </div>
  ),
}))

// Import after mocks
import BulkCogsPage from '../page'

describe('BulkCogsPage', () => {
  it('should render without crash', () => {
    render(<BulkCogsPage />)

    expect(screen.getByTestId('bulk-cogs-form')).toBeInTheDocument()
  })

  it('should render page heading "Массовое назначение себестоимости"', () => {
    render(<BulkCogsPage />)

    expect(
      screen.getByRole('heading', { name: /массовое назначение себестоимости/i, level: 1 })
    ).toBeInTheDocument()
  })

  it('should render info alert with instructions', () => {
    render(<BulkCogsPage />)

    expect(screen.getByText(/как это работает/i)).toBeInTheDocument()
  })

  it('should render help tips section', () => {
    render(<BulkCogsPage />)

    expect(screen.getByText(/советы по использованию/i)).toBeInTheDocument()
  })

  it('should render BulkCogsForm', () => {
    render(<BulkCogsPage />)

    expect(screen.getByTestId('bulk-cogs-form')).toBeInTheDocument()
  })

  it('should render back button', () => {
    render(<BulkCogsPage />)

    const button = screen.getByRole('button', { name: 'Вернуться к себестоимости' })
    expect(button).toBeInTheDocument()
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
