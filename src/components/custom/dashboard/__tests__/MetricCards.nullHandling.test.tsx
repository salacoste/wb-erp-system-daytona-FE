/**
 * TDD Tests for MetricCards Null Handling
 * Story: null vs undefined Standardization
 *
 * Tests verify that all MetricCard components handle null values consistently.
 * Standard: Use `null` for missing data, display "—" or appropriate placeholder.
 *
 * @see docs/epics/epic-62-fe-dashboard-presentation.md
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'

import { OrdersMetricCard } from '../OrdersMetricCard'
import { AdvertisingMetricCard } from '../AdvertisingMetricCard'
import { LogisticsMetricCard } from '../LogisticsMetricCard'
import { StorageMetricCard } from '../StorageMetricCard'
import { ExpenseMetricCard } from '../ExpenseMetricCard'
import { DollarSign } from 'lucide-react'

// =============================================================================
// OrdersMetricCard Null Handling Tests
// =============================================================================

describe('OrdersMetricCard null handling', () => {
  describe('value is null', () => {
    it('displays "—" when totalAmount is null', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={null}
          totalOrders={null}
          previousAmount={null}
          isLoading={false}
        />
      )

      // Should display dash for missing value
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('does not display comparison when totalAmount is null', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={null}
          totalOrders={100}
          previousAmount={50000}
          isLoading={false}
        />
      )

      // Comparison badge should not appear when current value is null
      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })

    it('does not display order count when totalOrders is null', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={100000}
          totalOrders={null}
          previousAmount={null}
          isLoading={false}
        />
      )

      // Order count subtitle should be empty
      expect(screen.queryByText(/заказ/)).not.toBeInTheDocument()
    })
  })

  describe('previousValue is null', () => {
    it('displays value but hides comparison when previousAmount is null', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={100000}
          totalOrders={50}
          previousAmount={null}
          isLoading={false}
        />
      )

      // Value should be displayed
      expect(screen.getByRole('article')).toBeInTheDocument()
      const content = screen.getByRole('article').textContent
      expect(content).toMatch(/100.*000/)

      // Comparison should NOT be shown
      expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
    })
  })

  describe('consistent behavior with undefined (to be standardized)', () => {
    it('handles undefined same as null for totalAmount', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={undefined}
          totalOrders={undefined}
          previousAmount={undefined}
          isLoading={false}
        />
      )

      // Should display dash (same behavior as null)
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// ExpenseMetricCard (Base) Null Handling Tests
// =============================================================================

describe('ExpenseMetricCard null handling', () => {
  const baseProps = {
    title: 'Test Expense',
    tooltip: 'Test tooltip',
    icon: DollarSign,
    valueColor: 'text-red-500',
    isLoading: false,
    error: null,
  }

  describe('value is null', () => {
    it('displays "—" when value is null', () => {
      renderWithProviders(<ExpenseMetricCard {...baseProps} value={null} previousValue={null} />)

      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('does not calculate revenue percentage when value is null', () => {
      renderWithProviders(
        <ExpenseMetricCard
          {...baseProps}
          value={null}
          previousValue={null}
          revenueTotal={1000000}
        />
      )

      // Revenue percentage subtitle should not appear
      expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
    })
  })

  describe('previousValue is null', () => {
    it('displays value but hides comparison when previousValue is null', () => {
      renderWithProviders(
        <ExpenseMetricCard {...baseProps} value={50000} previousValue={null} revenueTotal={null} />
      )

      // Value should be displayed
      expect(screen.getByTestId('metric-value').textContent).toMatch(/50.*000/)

      // Comparison should NOT be shown (no TrendIndicator)
      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument()
    })
  })

  describe('revenueTotal is null', () => {
    it('does not show revenue percentage when revenueTotal is null', () => {
      renderWithProviders(
        <ExpenseMetricCard {...baseProps} value={50000} previousValue={40000} revenueTotal={null} />
      )

      // Revenue percentage should not appear
      expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
    })

    it('does not show revenue percentage when revenueTotal is 0', () => {
      renderWithProviders(
        <ExpenseMetricCard {...baseProps} value={50000} previousValue={40000} revenueTotal={0} />
      )

      // Division by zero protection - should not show percentage
      expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
    })
  })

  describe('all values null', () => {
    it('renders minimal state when all values are null', () => {
      renderWithProviders(
        <ExpenseMetricCard {...baseProps} value={null} previousValue={null} revenueTotal={null} />
      )

      // Should still render card with title
      expect(screen.getByText('Test Expense')).toBeInTheDocument()
      // Value should be dash
      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })
  })
})

// =============================================================================
// AdvertisingMetricCard Null Handling Tests
// =============================================================================

describe('AdvertisingMetricCard null handling', () => {
  it('displays "—" when totalSpend is null', () => {
    renderWithProviders(
      <AdvertisingMetricCard totalSpend={null} previousSpend={null} isLoading={false} />
    )

    expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
  })

  it('hides comparison when previousSpend is null', () => {
    renderWithProviders(
      <AdvertisingMetricCard totalSpend={50000} previousSpend={null} isLoading={false} />
    )

    expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
  })

  it('hides revenue percentage when revenueTotal is null', () => {
    renderWithProviders(
      <AdvertisingMetricCard
        totalSpend={50000}
        previousSpend={40000}
        revenueTotal={null}
        isLoading={false}
      />
    )

    expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
  })
})

// =============================================================================
// LogisticsMetricCard Null Handling Tests
// =============================================================================

describe('LogisticsMetricCard null handling', () => {
  it('displays "—" when logisticsCost is null', () => {
    renderWithProviders(
      <LogisticsMetricCard logisticsCost={null} previousLogisticsCost={null} isLoading={false} />
    )

    expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
  })

  it('hides comparison when previousLogisticsCost is null', () => {
    renderWithProviders(
      <LogisticsMetricCard logisticsCost={50000} previousLogisticsCost={null} isLoading={false} />
    )

    expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
  })

  it('hides revenue percentage when revenueTotal is null', () => {
    renderWithProviders(
      <LogisticsMetricCard
        logisticsCost={50000}
        previousLogisticsCost={40000}
        revenueTotal={null}
        isLoading={false}
      />
    )

    expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
  })
})

// =============================================================================
// StorageMetricCard Null Handling Tests
// =============================================================================

describe('StorageMetricCard null handling', () => {
  it('displays "—" when storageCost is null', () => {
    renderWithProviders(
      <StorageMetricCard storageCost={null} previousStorageCost={null} isLoading={false} />
    )

    expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
  })

  it('hides comparison when previousStorageCost is null', () => {
    renderWithProviders(
      <StorageMetricCard storageCost={50000} previousStorageCost={null} isLoading={false} />
    )

    expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
  })

  it('hides revenue percentage when revenueTotal is null', () => {
    renderWithProviders(
      <StorageMetricCard
        storageCost={50000}
        previousStorageCost={40000}
        revenueTotal={null}
        isLoading={false}
      />
    )

    expect(screen.queryByText(/от выручки/)).not.toBeInTheDocument()
  })
})

// =============================================================================
// Cross-Component Consistency Tests
// =============================================================================

describe('cross-component null handling consistency', () => {
  describe('all cards display "—" for null primary value', () => {
    it('OrdersMetricCard shows "—" for null', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={null}
          totalOrders={null}
          previousAmount={null}
          isLoading={false}
        />
      )
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    it('AdvertisingMetricCard shows "—" for null', () => {
      renderWithProviders(
        <AdvertisingMetricCard totalSpend={null} previousSpend={null} isLoading={false} />
      )
      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('LogisticsMetricCard shows "—" for null', () => {
      renderWithProviders(
        <LogisticsMetricCard logisticsCost={null} previousLogisticsCost={null} isLoading={false} />
      )
      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })

    it('StorageMetricCard shows "—" for null', () => {
      renderWithProviders(
        <StorageMetricCard storageCost={null} previousStorageCost={null} isLoading={false} />
      )
      expect(screen.getByTestId('metric-value')).toHaveTextContent('—')
    })
  })

  describe('all cards hide comparison for null previous value', () => {
    const cards = [
      {
        name: 'AdvertisingMetricCard',
        component: (
          <AdvertisingMetricCard totalSpend={50000} previousSpend={null} isLoading={false} />
        ),
      },
      {
        name: 'LogisticsMetricCard',
        component: (
          <LogisticsMetricCard
            logisticsCost={50000}
            previousLogisticsCost={null}
            isLoading={false}
          />
        ),
      },
      {
        name: 'StorageMetricCard',
        component: (
          <StorageMetricCard storageCost={50000} previousStorageCost={null} isLoading={false} />
        ),
      },
    ]

    cards.forEach(({ name, component }) => {
      it(`${name} hides comparison when previous is null`, () => {
        renderWithProviders(component)
        expect(screen.queryByTestId('comparison-badge')).not.toBeInTheDocument()
      })
    })
  })
})

// =============================================================================
// Edge Cases
// =============================================================================

describe('edge cases', () => {
  describe('zero vs null distinction', () => {
    it('displays 0 as value, not as "—"', () => {
      renderWithProviders(
        <AdvertisingMetricCard totalSpend={0} previousSpend={1000} isLoading={false} />
      )

      // Should show 0, not dash
      const valueText = screen.getByTestId('metric-value').textContent
      expect(valueText).toMatch(/0/)
      expect(valueText).not.toBe('—')
    })

    it('shows comparison when current is 0 but previous is not null', () => {
      renderWithProviders(
        <AdvertisingMetricCard totalSpend={0} previousSpend={1000} isLoading={false} />
      )

      // Comparison should show -100% (complete reduction in spend = good for expense)
      const card = screen.getByRole('article')
      expect(card.textContent).toMatch(/100/)
    })
  })

  describe('negative values (edge case for refunds)', () => {
    it('handles negative values without crashing', () => {
      renderWithProviders(
        <OrdersMetricCard
          totalAmount={-5000}
          totalOrders={10}
          previousAmount={10000}
          isLoading={false}
        />
      )

      expect(screen.getByRole('article')).toBeInTheDocument()
    })
  })
})
