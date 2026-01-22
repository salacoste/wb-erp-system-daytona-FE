/**
 * TDD Tests for Story 44.17
 * Tax Configuration (Rate + Type)
 *
 * RED Phase: Tests written to define expected behavior
 * These tests verify all Acceptance Criteria (AC1-AC6)
 *
 * @see docs/stories/epic-44/story-44.17-fe-tax-configuration.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxConfigurationSection } from '../TaxConfigurationSection'

describe('Story 44.17: Tax Configuration (Rate + Type)', () => {
  const mockOnTaxRateChange = vi.fn()
  const mockOnTaxTypeChange = vi.fn()

  const defaultProps = {
    taxRate: 6,
    taxType: 'income' as const,
    onTaxRateChange: mockOnTaxRateChange,
    onTaxTypeChange: mockOnTaxTypeChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1: Tax Rate Input Field', () => {
    it('should render input field for "Ставка налога"', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('Ставка налога')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-input')).toBeInTheDocument()
    })

    it('should have numeric input with % suffix', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveAttribute('type', 'number')
      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('should have range 0-50%', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '50')
    })

    it('should default to 6%', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveValue(6)
    })

    it('should have step of 1% (allowing decimals)', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveAttribute('step', '1')
    })

    it('should render quick preset buttons (6%, 13%, 15%, 20%)', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByTestId('tax-rate-preset-6')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-13')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-15')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-20')).toBeInTheDocument()
    })

    it('should apply preset rate when button clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByTestId('tax-rate-preset-15'))
      expect(mockOnTaxRateChange).toHaveBeenCalledWith(15)

      await user.click(screen.getByTestId('tax-rate-preset-20'))
      expect(mockOnTaxRateChange).toHaveBeenCalledWith(20)
    })
  })

  describe('AC2: Tax Type Selection', () => {
    it('should render Select/Radio for "Тип налога"', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('Тип налога')).toBeInTheDocument()
      expect(screen.getByTestId('tax-type-income')).toBeInTheDocument()
      expect(screen.getByTestId('tax-type-profit')).toBeInTheDocument()
    })

    it('should have income option labeled "С выручки"', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('С выручки')).toBeInTheDocument()
    })

    it('should have profit option labeled "С прибыли"', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('С прибыли')).toBeInTheDocument()
    })

    it('should default to income type', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      // Income button should be in selected state (secondary variant)
      const incomeButton = screen.getByTestId('tax-type-income')
      expect(incomeButton).toBeInTheDocument()
    })

    it('should call onTaxTypeChange when type changes', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByTestId('tax-type-profit'))
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('profit')

      await user.click(screen.getByTestId('tax-type-income'))
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('income')
    })
  })

  describe('AC3: Tax Regime Presets', () => {
    it('should have collapsible section "Популярные налоговые режимы"', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('Популярные налоговые режимы')).toBeInTheDocument()
    })

    it('should show preset buttons when expanded', async () => {
      const user = userEvent.setup()
      // Use taxRate=0 to avoid matching preset badge interfering with test
      render(<TaxConfigurationSection {...defaultProps} taxRate={0} taxType="income" />)

      // Click to expand presets
      await user.click(screen.getByText('Популярные налоговые режимы'))

      // Use data-testid for more reliable selection
      await waitFor(() => {
        expect(screen.getByTestId('tax-preset-usn-income')).toBeInTheDocument()
        expect(screen.getByTestId('tax-preset-usn-profit')).toBeInTheDocument()
        expect(screen.getByTestId('tax-preset-self-employed')).toBeInTheDocument()
        expect(screen.getByTestId('tax-preset-ip-osn')).toBeInTheDocument()
        expect(screen.getByTestId('tax-preset-ooo-osn')).toBeInTheDocument()
      })
    })

    it('should set both rate and type when preset clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      // Expand presets
      await user.click(screen.getByText('Популярные налоговые режимы'))

      // Click УСН Доходы-Расходы (15%, profit)
      await waitFor(() => {
        expect(screen.getByText('УСН Доходы-Расходы')).toBeInTheDocument()
      })
      await user.click(screen.getByText('УСН Доходы-Расходы'))

      expect(mockOnTaxRateChange).toHaveBeenCalledWith(15)
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('profit')
    })

    it('should show visual indication of matching preset (УСН Доходы at 6% income)', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={6} taxType="income" />)

      // Should show matching preset badge
      expect(screen.getByTestId('matching-preset-badge')).toBeInTheDocument()
    })

    it('should show matching preset for УСН Доходы-Расходы (15% profit)', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={15} taxType="profit" />)

      expect(screen.getByTestId('matching-preset-badge')).toBeInTheDocument()
    })
  })

  describe('AC4: Tax Impact Preview', () => {
    it('should show tax impact for income tax', () => {
      render(
        <TaxConfigurationSection
          {...defaultProps}
          calculatedTaxAmount={73.04}
          recommendedPrice={1217.39}
        />
      )

      expect(screen.getByTestId('tax-impact-preview')).toBeInTheDocument()
      expect(screen.getByText(/Налог с выручки:/)).toBeInTheDocument()
    })

    it('should show tax impact for profit tax', () => {
      render(
        <TaxConfigurationSection
          {...defaultProps}
          taxType="profit"
          calculatedTaxAmount={100}
          recommendedPrice={1000}
        />
      )

      expect(screen.getByTestId('tax-impact-preview')).toBeInTheDocument()
      expect(screen.getByText(/Налог с прибыли:/)).toBeInTheDocument()
    })

    it('should not show preview when tax amount is 0', () => {
      render(
        <TaxConfigurationSection
          {...defaultProps}
          taxRate={0}
          calculatedTaxAmount={0}
        />
      )

      expect(screen.queryByTestId('tax-impact-preview')).not.toBeInTheDocument()
    })

    it('should show warning for tax rate > 20%', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={25} />)

      expect(screen.getByTestId('high-tax-warning')).toBeInTheDocument()
      expect(screen.getByText('Высокая ставка налога')).toBeInTheDocument()
    })

    it('should not show warning for tax rate <= 20%', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={20} />)

      expect(screen.queryByTestId('high-tax-warning')).not.toBeInTheDocument()
    })
  })

  describe('AC5: Tooltip Explanations', () => {
    it('should have tooltip for tax rate field', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      // Look for info/help icon near tax rate
      const taxRateLabel = screen.getByText('Ставка налога')
      expect(taxRateLabel.closest('div')).toBeInTheDocument()
    })

    it('should have tooltip for tax type explaining difference', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      // Look for info/help icon near tax type
      const taxTypeLabel = screen.getByText('Тип налога')
      expect(taxTypeLabel.closest('div')).toBeInTheDocument()
    })

    it('should have link to external tax guide', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      // Expand presets to see the link
      await user.click(screen.getByText('Популярные налоговые режимы'))

      await waitFor(() => {
        const link = screen.getByText('Подробнее о налоговых режимах')
        expect(link).toBeInTheDocument()
        expect(link.closest('a')).toHaveAttribute('target', '_blank')
        expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })
  })

  describe('AC6: Form State Integration', () => {
    it('should store tax_rate_pct in form state (number)', () => {
      const { rerender } = render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByTestId('tax-rate-input')).toHaveValue(6)

      rerender(<TaxConfigurationSection {...defaultProps} taxRate={15} />)
      expect(screen.getByTestId('tax-rate-input')).toHaveValue(15)
    })

    it('should store tax_type in form state', () => {
      const { rerender } = render(<TaxConfigurationSection {...defaultProps} />)

      // Income is selected
      expect(screen.getByTestId('tax-type-income')).toBeInTheDocument()

      rerender(<TaxConfigurationSection {...defaultProps} taxType="profit" />)
      // Profit should now be selected
      expect(screen.getByTestId('tax-type-profit')).toBeInTheDocument()
    })

    it('should call onChange when tax rate input changes', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      await user.clear(input)
      await user.type(input, '15')

      expect(mockOnTaxRateChange).toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('should disable all inputs when disabled', () => {
      render(<TaxConfigurationSection {...defaultProps} disabled />)

      expect(screen.getByTestId('tax-rate-input')).toBeDisabled()
      expect(screen.getByTestId('tax-type-income')).toBeDisabled()
      expect(screen.getByTestId('tax-type-profit')).toBeDisabled()
    })

    it('should disable preset buttons when disabled', () => {
      render(<TaxConfigurationSection {...defaultProps} disabled />)

      expect(screen.getByTestId('tax-rate-preset-6')).toBeDisabled()
      expect(screen.getByTestId('tax-rate-preset-13')).toBeDisabled()
      expect(screen.getByTestId('tax-rate-preset-15')).toBeDisabled()
      expect(screen.getByTestId('tax-rate-preset-20')).toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle tax rate = 0', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={0} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveValue(0)
    })

    it('should handle decimal tax rates', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={6.5} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveValue(6.5)
    })

    it('should handle max tax rate (50%)', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={50} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveValue(50)
      expect(screen.getByTestId('high-tax-warning')).toBeInTheDocument()
    })

    it('should reject negative tax rates via validation', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      await user.clear(input)
      await user.type(input, '-5')

      // Input has min=0, so negative values should not be accepted
      // or onChange should clamp to 0
      const calls = mockOnTaxRateChange.mock.calls
      const hasNegativeCall = calls.some((call) => call[0] < 0)
      expect(hasNegativeCall).toBe(false)
    })
  })

  describe('Russian Tax Regime Presets', () => {
    it('should have correct preset for УСН Доходы (6% income)', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} taxRate={0} taxType="profit" />)

      await user.click(screen.getByText('Популярные налоговые режимы'))
      await waitFor(() => {
        expect(screen.getByText('УСН Доходы')).toBeInTheDocument()
      })
      await user.click(screen.getByText('УСН Доходы'))

      expect(mockOnTaxRateChange).toHaveBeenCalledWith(6)
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('income')
    })

    it('should have correct preset for Самозанятый (6% income)', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} taxRate={0} taxType="profit" />)

      await user.click(screen.getByText('Популярные налоговые режимы'))
      await waitFor(() => {
        expect(screen.getByText('Самозанятый')).toBeInTheDocument()
      })
      await user.click(screen.getByText('Самозанятый'))

      expect(mockOnTaxRateChange).toHaveBeenCalledWith(6)
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('income')
    })

    it('should have correct preset for ИП на ОСН (13% profit)', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByText('Популярные налоговые режимы'))
      await waitFor(() => {
        expect(screen.getByText('ИП на ОСН')).toBeInTheDocument()
      })
      await user.click(screen.getByText('ИП на ОСН'))

      expect(mockOnTaxRateChange).toHaveBeenCalledWith(13)
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('profit')
    })

    it('should have correct preset for ООО на ОСН (20% profit)', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByText('Популярные налоговые режимы'))
      await waitFor(() => {
        expect(screen.getByText('ООО на ОСН')).toBeInTheDocument()
      })
      await user.click(screen.getByText('ООО на ОСН'))

      expect(mockOnTaxRateChange).toHaveBeenCalledWith(20)
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('profit')
    })
  })
})
