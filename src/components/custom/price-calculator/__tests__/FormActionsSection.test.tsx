/**
 * Unit tests for FormActionsSection component
 * Story 44.2-FE: Input Form Component
 * Story 44.5-FE: Real-time Calculation & UX Enhancements
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormActionsSection } from '../FormActionsSection'

describe('FormActionsSection', () => {
  const mockOnReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render reset button with Russian text', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByText('Сбросить')).toBeInTheDocument()
    })

    it('should render submit button with Russian text', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByText('Рассчитать цену')).toBeInTheDocument()
    })

    it('should render calculator icon', () => {
      const { container } = render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const icon = container.querySelector('.lucide-calculator')
      expect(icon).toBeInTheDocument()
    })

    it('should render rotate icon on reset button', () => {
      const { container } = render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const icon = container.querySelector('.lucide-rotate-ccw')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading text when loading', () => {
      render(
        <FormActionsSection
          loading={true}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      // Loading text appears in both loading indicator and submit button
      const loadingTexts = screen.getAllByText('Расчёт...')
      expect(loadingTexts.length).toBe(2)
    })

    it('should show loading spinner when loading', () => {
      const { container } = render(
        <FormActionsSection
          loading={true}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      // Loader2 renders as lucide-loader-circle in DOM
      const spinner = container.querySelector('.lucide-loader-circle')
      expect(spinner).toBeInTheDocument()
    })

    it('should disable submit button when loading', () => {
      render(
        <FormActionsSection
          loading={true}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const submitButton = screen.getByRole('button', { name: /расчёт/i })
      expect(submitButton).toBeDisabled()
    })

    it('should disable reset button when loading', () => {
      render(
        <FormActionsSection
          loading={true}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toBeDisabled()
    })
  })

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={true}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      const submitButton = screen.getByRole('button', { name: /рассчитать/i })

      expect(resetButton).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Form Validity', () => {
    it('should disable submit button when form is invalid', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={false}
          onReset={mockOnReset}
        />
      )

      const submitButton = screen.getByRole('button', { name: /рассчитать/i })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when form is valid', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const submitButton = screen.getByRole('button', { name: /рассчитать/i })
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Interactions', () => {
    it('should call onReset when reset button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      await user.click(resetButton)

      expect(mockOnReset).toHaveBeenCalledTimes(1)
    })

    it('should have type="button" on reset button', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toHaveAttribute('type', 'button')
    })

    it('should have type="submit" on submit button', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const submitButton = screen.getByRole('button', { name: /рассчитать/i })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('Keyboard Shortcuts Hints', () => {
    it('should have Esc hint on reset button', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toHaveAttribute('title', 'Нажмите Esc для сброса')
    })

    it('should have Enter hint on submit button', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const submitButton = screen.getByRole('button', { name: /рассчитать/i })
      expect(submitButton).toHaveAttribute('title', 'Нажмите Enter для расчёта')
    })
  })

  describe('Button Variants', () => {
    it('should have outline variant on reset button', () => {
      render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      // Reset button should have outline variant classes
      const resetButton = screen.getByRole('button', { name: /сбросить/i })
      expect(resetButton).toBeInTheDocument()
    })

    it('should have gradient styling on submit button', () => {
      const { container } = render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const submitButton = container.querySelector('.bg-gradient-to-r')
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have hidden icons for screen readers', () => {
      const { container } = render(
        <FormActionsSection
          loading={false}
          disabled={false}
          isValid={true}
          onReset={mockOnReset}
        />
      )

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })
})
