import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { SupplyPlanningItem } from '@/types/supply-planning'
import { SupplyPlanningHeader } from '../SupplyPlanningHeader'
import { ActionCell } from '../SupplyPlanningRowCells'
import { SupplyTablePagination } from '../SupplyTablePagination'
import { getCardStyles } from '../supply-risk-card-styles'

const criticalItem = {
  stockout_risk: 'critical',
} as SupplyPlanningItem

describe('Supply Planning accessible controls', () => {
  it('names both planning selectors', () => {
    render(
      <SupplyPlanningHeader
        safetyStockDays={14}
        velocityWeeks={4}
        onSafetyStockChange={vi.fn()}
        onVelocityWeeksChange={vi.fn()}
        onRefresh={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox', { name: 'Страховой запас' })).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: 'Период расчёта скорости продаж' })
    ).toBeInTheDocument()
  })

  it('names the page-size selector', () => {
    render(
      <SupplyTablePagination
        startIndex={0}
        endIndex={25}
        totalItems={30}
        activeFilter={null}
        pageSize={25}
        currentPage={1}
        totalPages={2}
        pageSizeOptions={[25, 50]}
        onPageSizeChange={vi.fn()}
        onPageChange={vi.fn()}
      />
    )

    expect(screen.getByRole('combobox', { name: 'Товаров на странице' })).toBeInTheDocument()
  })

  it('keeps the compact row action named when its visible label is hidden on mobile', () => {
    render(
      <table>
        <tbody>
          <tr>
            <ActionCell item={criticalItem} />
          </tr>
        </tbody>
      </table>
    )

    expect(screen.getByRole('button', { name: 'Срочно' })).toBeInTheDocument()
  })

  it('uses foreground text for every risk-card label while retaining status icons', () => {
    for (const status of [
      'out_of_stock',
      'critical',
      'warning',
      'low',
      'healthy',
      'unknown',
    ] as const) {
      expect(getCardStyles(status, false).label).toBe('text-foreground')
    }
    expect(getCardStyles('healthy', false).icon).toContain('text-status-success')
  })
})
