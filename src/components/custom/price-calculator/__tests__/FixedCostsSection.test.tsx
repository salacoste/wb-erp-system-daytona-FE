/**
 * Unit tests for FixedCostsSection component
 * Story 44.2-FE: Input Form Component
 * Story 44.15-FE: Storage field conditional on FBO fulfillment type
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { FixedCostsSection } from '../FixedCostsSection'
import type { FulfillmentType } from '@/types/price-calculator'

// Test form data interface
interface TestFormData {
  cogs_rub: number
  logistics_forward_rub: number
  logistics_reverse_rub: number
  storage_rub: number
}

// Helper to render FixedCostsSection with form context
function renderFixedCostsSection(
  fulfillmentType: FulfillmentType = 'FBO',
  disabled = false
) {
  function Wrapper() {
    const {
      register,
      formState: { errors },
    } = useForm<TestFormData>({
      defaultValues: {
        cogs_rub: 500,
        logistics_forward_rub: 100,
        logistics_reverse_rub: 50,
        storage_rub: 20,
      },
    })

    return (
      <FixedCostsSection<TestFormData>
        register={register}
        errors={errors}
        disabled={disabled}
        fulfillmentType={fulfillmentType}
      />
    )
  }

  return render(<Wrapper />)
}

describe('FixedCostsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render section header with Russian text', () => {
      renderFixedCostsSection()

      expect(
        screen.getByText('Фиксированные затраты (₽)')
      ).toBeInTheDocument()
    })

    it('should render COGS input with Russian label', () => {
      renderFixedCostsSection()

      expect(screen.getByText('Себестоимость (COGS)')).toBeInTheDocument()
      expect(screen.getByLabelText(/себестоимость/i)).toBeInTheDocument()
    })

    it('should render logistics forward input', () => {
      renderFixedCostsSection()

      expect(screen.getByText('Логистика к клиенту')).toBeInTheDocument()
    })

    it('should render logistics reverse input', () => {
      renderFixedCostsSection()

      expect(screen.getByText('Логистика возврата')).toBeInTheDocument()
    })

    it('should render package icon', () => {
      const { container } = renderFixedCostsSection()

      const icon = container.querySelector('.lucide-package')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Storage Field - FBO vs FBS (Story 44.15)', () => {
    it('should render storage field for FBO fulfillment type', () => {
      renderFixedCostsSection('FBO')

      expect(screen.getByText('Хранение')).toBeInTheDocument()
      expect(screen.getByLabelText('Хранение')).toBeInTheDocument()
    })

    it('should NOT render storage field for FBS fulfillment type', () => {
      renderFixedCostsSection('FBS')

      expect(screen.queryByText('Хранение')).not.toBeInTheDocument()
    })
  })

  describe('Input Constraints', () => {
    it('should have min=0 on COGS input', () => {
      renderFixedCostsSection()

      const input = screen.getByLabelText(/себестоимость/i)
      expect(input).toHaveAttribute('min', '0')
    })

    it('should have step=0.01 on COGS input', () => {
      renderFixedCostsSection()

      const input = screen.getByLabelText(/себестоимость/i)
      expect(input).toHaveAttribute('step', '0.01')
    })

    it('should have number type on all inputs', () => {
      renderFixedCostsSection()

      const cogsInput = screen.getByLabelText(/себестоимость/i)
      const logisticsForwardInput = screen.getByLabelText('Логистика к клиенту')
      const logisticsReverseInput = screen.getByLabelText('Логистика возврата')

      expect(cogsInput).toHaveAttribute('type', 'number')
      expect(logisticsForwardInput).toHaveAttribute('type', 'number')
      expect(logisticsReverseInput).toHaveAttribute('type', 'number')
    })

    it('should have placeholder 0,00 on inputs', () => {
      renderFixedCostsSection()

      const cogsInput = screen.getByLabelText(/себестоимость/i)
      expect(cogsInput).toHaveAttribute('placeholder', '0,00')
    })
  })

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      renderFixedCostsSection('FBO', true)

      const cogsInput = screen.getByLabelText(/себестоимость/i)
      const logisticsForwardInput = screen.getByLabelText('Логистика к клиенту')
      const logisticsReverseInput = screen.getByLabelText('Логистика возврата')
      const storageInput = screen.getByLabelText('Хранение')

      expect(cogsInput).toBeDisabled()
      expect(logisticsForwardInput).toBeDisabled()
      expect(logisticsReverseInput).toBeDisabled()
      expect(storageInput).toBeDisabled()
    })

    it('should NOT disable inputs when disabled prop is false', () => {
      renderFixedCostsSection('FBO', false)

      const cogsInput = screen.getByLabelText(/себестоимость/i)
      expect(cogsInput).not.toBeDisabled()
    })
  })

  describe('Styling', () => {
    it('should have blue background color scheme', () => {
      const { container } = renderFixedCostsSection()

      const section = container.querySelector('.bg-blue-50')
      expect(section).toBeInTheDocument()
    })

    it('should have blue left border', () => {
      const { container } = renderFixedCostsSection()

      const section = container.querySelector('.border-l-blue-400')
      expect(section).toBeInTheDocument()
    })
  })

  describe('Tooltips', () => {
    it('should render tooltip trigger for COGS field', () => {
      renderFixedCostsSection()

      // Look for multiple info buttons (one per field with tooltip)
      const infoButtons = screen.getAllByRole('button')
      expect(infoButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper htmlFor/id linking', () => {
      renderFixedCostsSection()

      const cogsInput = screen.getByLabelText(/себестоимость/i)
      expect(cogsInput).toHaveAttribute('id', 'cogs_rub')
    })

    it('should have hidden icon for screen readers', () => {
      const { container } = renderFixedCostsSection()

      const icon = container.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})
