/**
 * Cabinet Creation Onboarding Page Tests
 * Tests for src/app/(onboarding)/cabinet/page.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/utils/test-utils'

// Mock CabinetCreationForm component
vi.mock('@/components/custom/CabinetCreationForm', () => ({
  CabinetCreationForm: () => <div data-testid="cabinet-creation-form">CabinetCreationForm</div>,
}))

import CabinetCreationPage from '../page'

describe('CabinetCreationPage', () => {
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
})
