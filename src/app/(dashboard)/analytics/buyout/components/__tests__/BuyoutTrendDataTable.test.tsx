import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DailyBuyoutPoint } from '@/types/buyout-daily'
import { BUYOUT_TREND_DATA_TABLE_ID, BuyoutTrendDataTable } from '../BuyoutTrendDataTable'

const daily: DailyBuyoutPoint[] = [
  {
    date: '2026-08-29',
    buyoutRate: 83.456,
    returnRate: 6.789,
    ordersCount: 1234,
    returnsCount: 84,
  },
]

describe('BuyoutTrendDataTable', () => {
  it('exposes the exact chart period, units, series, precision, and values', () => {
    render(<BuyoutTrendDataTable daily={daily} from="2026-08-29" to="2026-08-31" />)

    const table = screen.getByRole('table', {
      name: /Данные графика ежедневной динамики выкупа; период: 2026-08-29 — 2026-08-31/,
    })
    expect(table).toHaveAttribute('id', BUYOUT_TREND_DATA_TABLE_ID)
    expect(screen.getByRole('columnheader', { name: 'Выкуп, %' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Возвраты, %' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /2026-08-29.*83,46.*6,79.*1\s234/ })).toBeInTheDocument()
  })
})
