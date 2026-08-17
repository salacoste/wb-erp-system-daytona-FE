/**
 * Cabinet Creation Onboarding Page Tests
 * Tests for src/app/(onboarding)/cabinet/page.tsx
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@/test/utils/test-utils'

const guardMocks = vi.hoisted(() => ({
  useOnboardingGuard: vi.fn(),
}))

// Mock CabinetCreationForm component
vi.mock('@/components/custom/CabinetCreationForm', () => ({
  CabinetCreationForm: () => (
    <form aria-label="Форма создания кабинета" data-testid="cabinet-creation-form" />
  ),
}))

vi.mock('@/hooks/useOnboardingGuard', () => ({
  useOnboardingGuard: guardMocks.useOnboardingGuard,
}))

import CabinetCreationPage from '../page'

describe('CabinetCreationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crash', () => {
    render(<CabinetCreationPage />)
  })

  it('should show heading "Создание кабинета"', () => {
    render(<CabinetCreationPage />)

    expect(screen.getByRole('heading', { name: /создание кабинета/i })).toBeInTheDocument()
  })

  it('should show step description', () => {
    render(<CabinetCreationPage />)

    expect(screen.getByText(/шаг 1 из 3/i)).toBeInTheDocument()
  })

  it('should render the CabinetCreationForm component', () => {
    render(<CabinetCreationPage />)

    expect(screen.getByTestId('cabinet-creation-form')).toBeInTheDocument()
  })

  it('[CABINET-ROUTE-LOCK-01] consumes the shared onboarding guard once per render', () => {
    render(<CabinetCreationPage />)

    expect(guardMocks.useOnboardingGuard).toHaveBeenCalledTimes(1)
  })

  it('[CABINET-ROUTE-RED-01] presents the visible current step and form inside one semantic main', () => {
    render(<CabinetCreationPage />)

    const main = screen.getByRole('main')
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(
      within(main).getByRole('heading', { name: 'Создание кабинета', level: 1 })
    ).toBeInTheDocument()
    expect(within(main).getByText(/шаг 1 из 3/i)).toBeInTheDocument()
    expect(within(main).getByRole('form', { name: 'Форма создания кабинета' })).toBeInTheDocument()
  })
})
