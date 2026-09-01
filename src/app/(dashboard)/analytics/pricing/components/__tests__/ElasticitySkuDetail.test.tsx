import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  it('toggles the exact SKU elasticity row by keyboard', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(
      <table>
        <tbody>
          <ElasticitySkuDetail item={item} isExpanded={false} onToggle={onToggle} />
        </tbody>
      </table>
    )

    const action = screen.getByRole('button', { name: 'Показать эластичность SKU 12345678' })
    const row = action.closest('tr')
    expect(row).toHaveRole('row')
    expect(row).not.toHaveAttribute('role')
    expect(row).not.toHaveAttribute('tabindex')
    expect(row?.querySelectorAll('td')).toHaveLength(7)
    action.focus()
    expect(action).toHaveFocus()
    expect(action).toHaveAttribute('aria-expanded', 'false')
    await user.keyboard('{Enter}')
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('announces the collapse action while expanded', () => {
    render(
      <table>
        <tbody>
          <ElasticitySkuDetail item={item} isExpanded onToggle={vi.fn()} />
        </tbody>
      </table>
    )

    expect(
      screen.getByRole('button', { name: 'Скрыть эластичность SKU 12345678' })
    ).toHaveAttribute('aria-expanded', 'true')
  })
})
