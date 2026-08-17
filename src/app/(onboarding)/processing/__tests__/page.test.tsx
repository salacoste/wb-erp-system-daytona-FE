/**
 * Processing Status Onboarding Page Tests
 * Tests for src/app/(onboarding)/processing/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock ProcessingStatus component
vi.mock('@/components/custom/ProcessingStatus', () => ({
  ProcessingStatus: () => <div data-testid="processing-status">ProcessingStatus</div>,
}))

import ProcessingPage from '../page'

describe('ProcessingPage', () => {
  it('should render without crash', () => {
    render(<ProcessingPage />)
  })

  it('should show heading "Обработка данных"', () => {
    render(<ProcessingPage />)

    expect(screen.getByRole('heading', { name: /обработка данных/i })).toBeInTheDocument()
  })

  it('should show step description', () => {
    render(<ProcessingPage />)

    expect(screen.getByText(/шаг 3 из 3/i)).toBeInTheDocument()
  })

  it('should render the ProcessingStatus component', () => {
    render(<ProcessingPage />)

    expect(screen.getByTestId('processing-status')).toBeInTheDocument()
  })

  // Story 167.6: semantic landmark migration must keep the route accessible
  it('should expose a main landmark with the single h1', () => {
    render(<ProcessingPage />)

    expect(screen.getByRole('main')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Обработка данных')
  })
})
