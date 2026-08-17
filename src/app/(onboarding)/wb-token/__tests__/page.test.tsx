/**
 * WB Token Onboarding Page Tests
 * Tests for src/app/(onboarding)/wb-token/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock WbTokenForm component
vi.mock('@/components/custom/WbTokenForm', () => ({
  WbTokenForm: () => <div data-testid="wb-token-form">WbTokenForm</div>,
}))

// useOnboardingGuard (FE-14) calls useRouter; provide a no-op router so the page renders in tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))

import WbTokenPage from '../page'

describe('WbTokenPage', () => {
  it('should render without crash', () => {
    render(<WbTokenPage />)
  })

  it('should show heading "Ввод WB API токена"', () => {
    render(<WbTokenPage />)

    expect(screen.getByRole('heading', { name: /ввод wb api токена/i })).toBeInTheDocument()
  })

  it('should show step description', () => {
    render(<WbTokenPage />)

    expect(screen.getByText(/шаг 2 из 3/i)).toBeInTheDocument()
  })

  it('should render the WbTokenForm component', () => {
    render(<WbTokenPage />)

    expect(screen.getByTestId('wb-token-form')).toBeInTheDocument()
  })

  // Story 167.7: landmark semantics after PageHeader/Card migration
  it('renders exactly one main landmark with a single h1', () => {
    const { container } = render(<WbTokenPage />)

    expect(container.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
