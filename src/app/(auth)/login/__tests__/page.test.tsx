/**
 * Login Page Tests
 * Tests for src/app/(auth)/login/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock LoginForm component
vi.mock('@/components/custom/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}))

// Import after mocks
import LoginPage from '../page'

describe('LoginPage', () => {
  it('should render without crash', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('should render heading "Войти в аккаунт"', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /войти в аккаунт/i, level: 2 })).toBeInTheDocument()
  })

  it('should render LoginForm component', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('should render inside a centered layout container', () => {
    const { container } = render(<LoginPage />)

    // The page uses min-h-screen and items-center for centering
    const outerDiv = container.firstElementChild
    expect(outerDiv?.className).toContain('min-h-screen')
  })
})
