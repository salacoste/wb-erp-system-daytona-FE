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
})
