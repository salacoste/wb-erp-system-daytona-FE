/**
 * Unit tests for PercentageCostsFormSection component
 * Story 44.2-FE: Input Form Component
 * Story 44.18-FE: DRR Input
 * Story 44.19-FE: SPP Display
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { PercentageCostsFormSection } from '../PercentageCostsFormSection'

// Test form data interface
interface TestFormData {
  buyback_pct: number
}

// Helper props type
interface RenderOptions {
  drrValue?: number
  sppValue?: number
  buybackValue?: number
  disabled?: boolean
}

// Helper to render PercentageCostsFormSection with form context
function renderPercentageCostsFormSection(options: RenderOptions = {}) {
  const {
    drrValue = 5,
    sppValue = 0,
    buybackValue = 98,
    disabled = false,
  } = options

  const mockOnDrrChange = vi.fn()
  const mockOnSppChange = vi.fn()

  function Wrapper() {
    const { control } = useForm<TestFormData>({
      defaultValues: { buyback_pct: buybackValue },
    })

    return (
      <PercentageCostsFormSection<TestFormData>
        control={control}
        drrValue={drrValue}
        sppValue={sppValue}
        onDrrChange={mockOnDrrChange}
        onSppChange={mockOnSppChange}
        disabled={disabled}
      />
    )
  }

  const result = render(<Wrapper />)
  return { ...result, mockOnDrrChange, mockOnSppChange }
}

describe('PercentageCostsFormSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render section header with Russian text', () => {
      renderPercentageCostsFormSection()

      expect(screen.getByText('Процентные расходы (%)')).toBeInTheDocument()
    })

    it('should render buyback percentage label', () => {
      renderPercentageCostsFormSection()

      expect(screen.getByText('Процент выкупа')).toBeInTheDocument()
    })

    it('should render percent icon', () => {
      const { container } = renderPercentageCostsFormSection()

      const icon = container.querySelector('.lucide-percent')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('DRR Slider Integration (Story 44.18)', () => {
    it('should render DRR slider component', () => {
      renderPercentageCostsFormSection()

      // DRR slider has a specific test id
      expect(screen.getByTestId('drr-slider')).toBeInTheDocument()
    })

    it('should render DRR with Russian label', () => {
      renderPercentageCostsFormSection()

      expect(
        screen.getByText('DRR (Доля рекламных расходов)')
      ).toBeInTheDocument()
    })

    it('should display DRR value from props', () => {
      renderPercentageCostsFormSection({ drrValue: 10 })

      const drrInput = screen.getByTestId('drr-input')
      expect(drrInput).toHaveValue(10)
    })
  })

  describe('SPP Input Integration (Story 44.19)', () => {
    it('should render SPP input component', () => {
      renderPercentageCostsFormSection()

      expect(screen.getByTestId('spp-slider')).toBeInTheDocument()
    })

    it('should render SPP with Russian label', () => {
      renderPercentageCostsFormSection()

      expect(
        screen.getByText('СПП (Скидка постоянного покупателя)')
      ).toBeInTheDocument()
    })

    it('should display SPP value from props', () => {
      renderPercentageCostsFormSection({ sppValue: 15 })

      const sppInput = screen.getByTestId('spp-input')
      expect(sppInput).toHaveValue(15)
    })
  })

  // Story 44.30: Updated - now uses BuybackSlider instead of MarginSlider
  describe('Buyback Slider Integration', () => {
    it('should render buyback slider (via BuybackSlider)', () => {
      renderPercentageCostsFormSection()

      // BuybackSlider renders a spinbutton for number input
      const spinbuttons = screen.getAllByRole('spinbutton')
      expect(spinbuttons.length).toBeGreaterThan(0)
    })

    it('should have tooltip for buyback field', () => {
      renderPercentageCostsFormSection()

      // Tooltip trigger buttons should be present
      const tooltipTriggers = screen.getAllByRole('button')
      expect(tooltipTriggers.length).toBeGreaterThan(0)
    })
  })

  // Story 44.30: Updated styling tests - color changed from purple to emerald
  describe('Styling', () => {
    it('should have emerald background color scheme', () => {
      const { container } = renderPercentageCostsFormSection()

      const section = container.querySelector('.bg-emerald-50')
      expect(section).toBeInTheDocument()
    })

    it('should have emerald left border', () => {
      const { container } = renderPercentageCostsFormSection()

      const section = container.querySelector('.border-l-emerald-400')
      expect(section).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have hidden icon for screen readers', () => {
      const { container } = renderPercentageCostsFormSection()

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]')
      expect(hiddenIcons.length).toBeGreaterThan(0)
    })
  })
})
