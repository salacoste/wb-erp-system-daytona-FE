import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ElasticitySkuDetail } from '../ElasticitySkuDetail'
import type { PriceElasticityItem } from '@/types/price-elasticity'

vi.mock('@/hooks/usePriceElasticity', () => ({
  usePriceElasticitySku: () => ({ data: undefined, isLoading: false }),
}))

const item: PriceElasticityItem = {
  nmId: 12345678,
  elasticity: -1.25,
  rSquared: 0.82,
  dataPoints: 42,
  source: 'orders',
  confidence: 'high',
}

describe('ElasticitySkuDetail interactions', () => {
  it('toggles the exact SKU elasticity row by keyboard', () => {
    const onToggle = vi.fn()
    render(
      <table>
        <tbody>
          <ElasticitySkuDetail item={item} isExpanded={false} onToggle={onToggle} />
        </tbody>
      </table>
    )

    const row = screen.getByRole('button', { name: 'Показать эластичность SKU 12345678' })
    row.focus()
    expect(row).toHaveFocus()
    expect(row).toHaveAttribute('aria-expanded', 'false')
    fireEvent.keyDown(row, { key: 'Enter' })
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
