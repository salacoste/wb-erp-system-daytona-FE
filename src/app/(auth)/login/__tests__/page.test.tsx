/**
 * Login Page Tests
 * Tests for src/app/(auth)/login/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'

// Mock LoginForm component
vi.mock('@/components/custom/LoginForm', () => ({
  LoginForm: () => <form aria-label="Форма входа" data-testid="login-form" />,
}))

// Import after mocks
import LoginPage from '../page'

describe('LoginPage', () => {
  it('should render without crash', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('renders exactly one level-one heading with the login purpose', () => {
    render(<LoginPage />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Войти в аккаунт', level: 1 })).toBeInTheDocument()
  })

  it('should render LoginForm component', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('renders the login form inside one semantic main landmark', () => {
    render(<LoginPage />)

    const main = screen.getByRole('main')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(within(main).getByRole('form', { name: 'Форма входа' })).toBeInTheDocument()
  })

  it('renders the login surface in a centered constrained layout', () => {
    render(<LoginPage />)

    const form = screen.getByRole('form', { name: 'Форма входа' })
    expect(form.parentElement).toHaveClass('max-w-md')
  })

  it('does not render protected navigation or AppShell content', () => {
    render(<LoginPage />)

    expect(screen.queryByRole('navigation', { name: /main navigation/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-shell')).not.toBeInTheDocument()
  })
})
