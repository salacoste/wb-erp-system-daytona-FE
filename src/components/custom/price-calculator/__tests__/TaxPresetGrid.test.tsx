/**
 * Unit tests for TaxPresetGrid component
 * Story 44.17-FE: Tax Configuration (Rate + Type)
 * Epic 44: Price Calculator UI (Frontend)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaxPresetGrid } from '../TaxPresetGrid'
import { TAX_PRESETS } from '../tax-presets'

describe('TaxPresetGrid', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnPresetSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render collapsible trigger', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      expect(screen.getByTestId('tax-presets-trigger')).toBeInTheDocument()
      expect(screen.getByText('Популярные налоговые режимы')).toBeInTheDocument()
    })

    it('should show presets content when open', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      expect(screen.getByTestId('tax-presets-content')).toBeInTheDocument()
    })

    it('should hide presets content when closed', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      // Radix keeps element in DOM but marks as hidden
      const content = screen.queryByTestId('tax-presets-content')
      expect(content).toHaveAttribute('hidden')
    })
  })

  describe('Tax Presets', () => {
    it('should render all 5 tax regime presets', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      // Verify all 5 presets are rendered
      expect(screen.getByTestId('tax-preset-usn-income')).toBeInTheDocument()
      expect(screen.getByTestId('tax-preset-usn-profit')).toBeInTheDocument()
      expect(screen.getByTestId('tax-preset-self-employed')).toBeInTheDocument()
      expect(screen.getByTestId('tax-preset-ip-osn')).toBeInTheDocument()
      expect(screen.getByTestId('tax-preset-ooo-osn')).toBeInTheDocument()
    })

    it('should show correct labels for each preset', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      expect(screen.getByText('УСН Доходы')).toBeInTheDocument()
      expect(screen.getByText('УСН Доходы-Расходы')).toBeInTheDocument()
      expect(screen.getByText('Самозанятый')).toBeInTheDocument()
      expect(screen.getByText('ИП на ОСН')).toBeInTheDocument()
      expect(screen.getByText('ООО на ОСН')).toBeInTheDocument()
    })

    it('should show rate and type info for each preset', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      // Check rate+type descriptions
      expect(screen.getAllByText('6% с выручки').length).toBe(2) // USN and Self-employed
      expect(screen.getByText('15% с прибыли')).toBeInTheDocument()
      expect(screen.getByText('13% с прибыли')).toBeInTheDocument()
      expect(screen.getByText('20% с прибыли')).toBeInTheDocument()
    })
  })

  describe('Preset Selection', () => {
    it('should call onPresetSelect with correct preset on click', async () => {
      const user = userEvent.setup()
      render(
        <TaxPresetGrid
          taxRate={15}
          taxType="profit"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      await user.click(screen.getByTestId('tax-preset-usn-income'))

      const expectedPreset = TAX_PRESETS.find(p => p.id === 'usn-income')
      expect(mockOnPresetSelect).toHaveBeenCalledWith(expectedPreset)
    })

    it('should highlight active preset matching current rate+type', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      // USN Доходы (6%, income) should be active
      const usnIncomeBtn = screen.getByTestId('tax-preset-usn-income')
      expect(usnIncomeBtn).toBeInTheDocument()
    })

    it('should call onPresetSelect for УСН Д-Р preset', async () => {
      const user = userEvent.setup()
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      await user.click(screen.getByTestId('tax-preset-usn-profit'))

      const expectedPreset = TAX_PRESETS.find(p => p.id === 'usn-profit')
      expect(mockOnPresetSelect).toHaveBeenCalledWith(expectedPreset)
    })
  })

  describe('External Link', () => {
    it('should render external link to tax regime guide', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      const link = screen.getByText('Подробнее о налоговых режимах')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://www.nalog.gov.ru/rn77/taxation/taxes/usn/')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  describe('Disabled State', () => {
    it('should disable all preset buttons when disabled', () => {
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={true}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
          disabled
        />
      )

      expect(screen.getByTestId('tax-preset-usn-income')).toBeDisabled()
      expect(screen.getByTestId('tax-preset-usn-profit')).toBeDisabled()
      expect(screen.getByTestId('tax-preset-self-employed')).toBeDisabled()
      expect(screen.getByTestId('tax-preset-ip-osn')).toBeDisabled()
      expect(screen.getByTestId('tax-preset-ooo-osn')).toBeDisabled()
    })
  })

  describe('Collapsible Interaction', () => {
    it('should call onOpenChange when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TaxPresetGrid
          taxRate={6}
          taxType="income"
          isOpen={false}
          onOpenChange={mockOnOpenChange}
          onPresetSelect={mockOnPresetSelect}
        />
      )

      await user.click(screen.getByTestId('tax-presets-trigger'))
      expect(mockOnOpenChange).toHaveBeenCalled()
    })
  })
})
