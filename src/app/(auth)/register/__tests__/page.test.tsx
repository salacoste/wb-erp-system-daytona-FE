/**
 * Register Page Tests
 * Tests for src/app/(auth)/register/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock RegistrationForm component
vi.mock('@/components/custom/RegistrationForm', () => ({
  RegistrationForm: () => <div data-testid="registration-form">RegistrationForm</div>,
}))

// Import after mocks
import RegisterPage from '../page'

describe('RegisterPage', () => {
  it('should render without crash', () => {
    render(<RegisterPage />)

    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
  })

  it('should render heading "Регистрация"', () => {
    render(<RegisterPage />)

    expect(screen.getByRole('heading', { name: /регистрация/i, level: 1 })).toBeInTheDocument()
  })

  it('should render registration subtitle', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/создайте аккаунт для доступа к системе/i)).toBeInTheDocument()
  })

  it('should render link to login page', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByRole('link', { name: /войти/i })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('should render "Уже есть аккаунт?" text', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/уже есть аккаунт/i)).toBeInTheDocument()
  })

  it('should render RegistrationForm component', () => {
    render(<RegisterPage />)

    expect(screen.getByTestId('registration-form')).toBeInTheDocument()
  })
})
