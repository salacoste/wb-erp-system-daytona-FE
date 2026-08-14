/**
 * Story 167.4 direct route tests for src/app/(auth)/register/page.tsx.
 */

import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'

vi.mock('@/components/custom/RegistrationForm', () => ({
  RegistrationForm: () => <form aria-label="Форма регистрации" data-testid="registration-form" />,
}))

import RegisterPage from '../page'

describe('RegisterPage', () => {
  it('[REG-ROUTE-01] preserves one registration heading and one semantic login link', () => {
    render(<RegisterPage />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Регистрация', level: 1 })).toBeInTheDocument()

    const loginLinks = screen.getAllByRole('link', { name: 'Войти' })
    expect(loginLinks).toHaveLength(1)
    expect(loginLinks[0]).toHaveAttribute('href', '/login')
  })

  it('[REG-ROUTE-01] preserves the registration purpose and form composition', () => {
    render(<RegisterPage />)

    expect(screen.getByText('Создайте аккаунт для доступа к системе')).toBeInTheDocument()
    expect(screen.getByText(/уже есть аккаунт/i)).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'Форма регистрации' })).toBeInTheDocument()
  })

  it('[REG-ROUTE-02] contains the complete route content in exactly one semantic main', () => {
    render(<RegisterPage />)

    const main = screen.getByRole('main')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(within(main).getByRole('heading', { name: 'Регистрация', level: 1 })).toBeInTheDocument()
    expect(within(main).getByRole('form', { name: 'Форма регистрации' })).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login')
  })
})
