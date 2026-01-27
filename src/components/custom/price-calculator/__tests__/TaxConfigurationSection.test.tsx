/**
 * Unit tests for TaxConfigurationSection component
 * Story 44.17-FE: Tax Configuration (Rate + Type)
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxConfigurationSection } from '../TaxConfigurationSection'

describe('TaxConfigurationSection', () => {
  const mockOnTaxRateChange = vi.fn()
  const mockOnTaxTypeChange = vi.fn()
  const mockOnVatPayerChange = vi.fn()
  const mockOnVatRateChange = vi.fn()

  // Default props including VAT configuration
  const defaultProps = {
    taxRate: 6,
    taxType: 'income' as const,
    onTaxRateChange: mockOnTaxRateChange,
    onTaxTypeChange: mockOnTaxTypeChange,
    isVatPayer: false,
    vatRate: 20,
    onVatPayerChange: mockOnVatPayerChange,
    onVatRateChange: mockOnVatRateChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render tax rate input', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue(6)
    })

    it('should render tax type toggle buttons', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByTestId('tax-type-income')).toBeInTheDocument()
      expect(screen.getByTestId('tax-type-profit')).toBeInTheDocument()
    })

    it('should render Russian labels', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByText('Ставка налога')).toBeInTheDocument()
      expect(screen.getByText('Тип налога')).toBeInTheDocument()
      expect(screen.getByText('С выручки')).toBeInTheDocument()
      expect(screen.getByText('С прибыли')).toBeInTheDocument()
    })

    it('should render quick rate preset buttons', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByTestId('tax-rate-preset-6')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-13')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-15')).toBeInTheDocument()
      expect(screen.getByTestId('tax-rate-preset-20')).toBeInTheDocument()
    })
  })

  describe('Tax Rate Input', () => {
    it('should call onTaxRateChange when rate is changed', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      await user.clear(input)
      await user.type(input, '15')

      expect(mockOnTaxRateChange).toHaveBeenCalled()
    })

    it('should have min=0 and max=50 constraints', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      const input = screen.getByTestId('tax-rate-input')
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('max', '50')
    })
  })

  describe('Tax Type Toggle', () => {
    it('should highlight income button when taxType is income', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      // Income button should be in secondary variant (selected state)
      const incomeButton = screen.getByTestId('tax-type-income')
      expect(incomeButton).toBeInTheDocument()
    })

    it('should call onTaxTypeChange when profit is clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByTestId('tax-type-profit'))
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('profit')
    })

    it('should call onTaxTypeChange when income is clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} taxRate={15} taxType="profit" />)

      await user.click(screen.getByTestId('tax-type-income'))
      expect(mockOnTaxTypeChange).toHaveBeenCalledWith('income')
    })
  })

  describe('Preset Buttons', () => {
    it('should apply 6% preset when clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} taxRate={15} taxType="profit" />)

      await user.click(screen.getByTestId('tax-rate-preset-6'))
      expect(mockOnTaxRateChange).toHaveBeenCalledWith(6)
    })

    it('should apply 15% preset when clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByTestId('tax-rate-preset-15'))
      expect(mockOnTaxRateChange).toHaveBeenCalledWith(15)
    })

    it('should apply 20% preset when clicked', async () => {
      const user = userEvent.setup()
      render(<TaxConfigurationSection {...defaultProps} />)

      await user.click(screen.getByTestId('tax-rate-preset-20'))
      expect(mockOnTaxRateChange).toHaveBeenCalledWith(20)
    })
  })

  describe('High Tax Rate Warning', () => {
    it('should show warning for tax rates > 20%', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={25} />)

      expect(screen.getByTestId('high-tax-warning')).toBeInTheDocument()
      expect(screen.getByText('Высокая ставка налога')).toBeInTheDocument()
    })

    it('should not show warning for tax rates <= 20%', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={20} />)

      expect(screen.queryByTestId('high-tax-warning')).not.toBeInTheDocument()
    })
  })

  describe('Tax Impact Preview', () => {
    it('should show tax amount when calculatedTaxAmount is provided', () => {
      render(
        <TaxConfigurationSection
          {...defaultProps}
          calculatedTaxAmount={73.04}
          recommendedPrice={1217.39}
        />
      )

      expect(screen.getByTestId('tax-impact-preview')).toBeInTheDocument()
    })

    it('should not show preview when calculatedTaxAmount is 0', () => {
      render(
        <TaxConfigurationSection
          {...defaultProps}
          taxRate={0}
          calculatedTaxAmount={0}
        />
      )

      expect(screen.queryByTestId('tax-impact-preview')).not.toBeInTheDocument()
    })
  })

  describe('Matching Preset Badge', () => {
    it('should show matching preset badge for USN 6%', () => {
      render(<TaxConfigurationSection {...defaultProps} />)

      expect(screen.getByTestId('matching-preset-badge')).toBeInTheDocument()
    })

    it('should show matching preset badge for USN 15%', () => {
      render(<TaxConfigurationSection {...defaultProps} taxRate={15} taxType="profit" />)

      expect(screen.getByTestId('matching-preset-badge')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(<TaxConfigurationSection {...defaultProps} disabled />)

      expect(screen.getByTestId('tax-rate-input')).toBeDisabled()
      expect(screen.getByTestId('tax-type-income')).toBeDisabled()
      expect(screen.getByTestId('tax-type-profit')).toBeDisabled()
    })

    it('should disable preset buttons when disabled', () => {
      render(<TaxConfigurationSection {...defaultProps} disabled />)

      expect(screen.getByTestId('tax-rate-preset-6')).toBeDisabled()
      expect(screen.getByTestId('tax-rate-preset-20')).toBeDisabled()
    })
  })
})
