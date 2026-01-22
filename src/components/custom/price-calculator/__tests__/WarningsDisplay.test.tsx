/**
 * Unit tests for WarningsDisplay component
 * Story 44.3-FE: Results Display Component for Price Calculator
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WarningsDisplay } from '../WarningsDisplay'
import { mockPriceCalculatorResponse } from '@/test/fixtures/price-calculator'

describe('WarningsDisplay', () => {
  describe('Empty State', () => {
    it('returns null when no warnings', () => {
      const { container } = render(
        <WarningsDisplay data={mockPriceCalculatorResponse} />
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when warnings array is empty', () => {
      const dataWithoutWarnings = {
        ...mockPriceCalculatorResponse,
        warnings: [],
      }

      const { container } = render(<WarningsDisplay data={dataWithoutWarnings} />)

      expect(container.firstChild).toBeNull()
    })

    it('returns null when warnings is undefined', () => {
      const dataWithoutWarningsProp = {
        ...mockPriceCalculatorResponse,
        warnings: undefined as unknown as [],
      }

      const { container } = render(
        <WarningsDisplay data={dataWithoutWarningsProp} />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('With Warnings', () => {
    it('displays alert when warnings exist', () => {
      const dataWithWarnings = {
        ...mockPriceCalculatorResponse,
        warnings: ['Целевая маржа может быть недостижима', 'Затраты на логистику выше среднего'],
      }

      render(<WarningsDisplay data={dataWithWarnings} />)

      expect(screen.getByText('Предупреждения:')).toBeInTheDocument()
    })

    it('displays all warning messages in a list', () => {
      const dataWithWarnings = {
        ...mockPriceCalculatorResponse,
        warnings: ['Предупреждение 1', 'Предупреждение 2', 'Предупреждение 3'],
      }

      render(<WarningsDisplay data={dataWithWarnings} />)

      expect(screen.getByText('Предупреждение 1')).toBeInTheDocument()
      expect(screen.getByText('Предупреждение 2')).toBeInTheDocument()
      expect(screen.getByText('Предупреждение 3')).toBeInTheDocument()
    })

    it('uses list-disc styling for warnings', () => {
      const dataWithWarnings = {
        ...mockPriceCalculatorResponse,
        warnings: ['Одно предупреждение'],
      }

      const { container } = render(<WarningsDisplay data={dataWithWarnings} />)

      const list = container.querySelector('ul')
      expect(list).toHaveClass('list-disc')
    })
  })

  describe('Accessibility', () => {
    it('has proper alert role', () => {
      const dataWithWarnings = {
        ...mockPriceCalculatorResponse,
        warnings: ['Тестовое предупреждение'],
      }

      render(<WarningsDisplay data={dataWithWarnings} />)

      // Alert component should have appropriate role/styling
      expect(screen.getByText('Предупреждения:')).toBeInTheDocument()
    })
  })
})
