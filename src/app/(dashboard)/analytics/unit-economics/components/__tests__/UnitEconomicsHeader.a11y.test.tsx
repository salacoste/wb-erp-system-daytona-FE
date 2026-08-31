import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UnitEconomicsHeader } from '../UnitEconomicsHeader'

describe('UnitEconomicsHeader accessibility', () => {
  it('uses a labelled radio group without dangling tab-panel references', async () => {
    const onViewByChange = vi.fn()
    const user = userEvent.setup()
    render(
      <UnitEconomicsHeader
        selectedWeek="2026-W35"
        weekOptions={[{ value: '2026-W35', label: 'Неделя 35' }]}
        viewBy="sku"
        onWeekChange={vi.fn()}
        onViewByChange={onViewByChange}
        onRefresh={vi.fn()}
        onExport={vi.fn()}
      />
    )

    expect(screen.getByRole('radiogroup', { name: 'Группировка данных' })).toBeVisible()
    expect(screen.getByRole('radio', { name: 'SKU' })).toHaveAttribute('aria-checked', 'true')
    const category = screen.getByRole('radio', { name: 'Категория' })
    expect(category).not.toHaveAttribute('aria-controls')
    await user.click(category)
    expect(onViewByChange).toHaveBeenCalledWith('category')
  })
})
