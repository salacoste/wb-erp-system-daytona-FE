import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { DataCompletenessTable } from '../DataCompletenessTable'
import type { DashboardDataCompleteness } from '../../types/monitoring'

describe('DataCompletenessTable — empty-tables guard (no fabricated 0%)', () => {
  // Live: dashboard.dataCompleteness = { overallHealth:'healthy', tables:[] }. getOverallPercent([])
  // returns 0 as an empty-array guard, so the old code rendered "0% — Все данные загружены" + a 0%
  // bar (self-contradictory). The guard must show the health label alone, no fabricated 0%.
  it('shows the health label WITHOUT a "0%" or progress bar when no rows exist', () => {
    const data: DashboardDataCompleteness = { overallHealth: 'healthy', tables: [] }
    renderWithProviders(<DataCompletenessTable data={data} isLoading={false} />)
    expect(screen.getByText('Все данные загружены')).toBeInTheDocument()
    expect(screen.getByText(/Детализация по источникам недоступна/)).toBeInTheDocument()
    // The fabricated "0% — …" prefix and the per-source table must NOT appear
    expect(screen.queryByText(/0% —/)).not.toBeInTheDocument()
    expect(screen.queryByText('Состояние источников данных')).not.toBeInTheDocument()
  })

  it('renders the recomputed percent + per-source table when rows exist', () => {
    const data: DashboardDataCompleteness = {
      overallHealth: 'healthy',
      tables: [
        { table: 'orders', displayName: 'Заказы', completenessRatio: 1, status: 'complete' },
        { table: 'sales', displayName: 'Продажи', completenessRatio: 0.9, status: 'complete' },
      ],
    }
    renderWithProviders(<DataCompletenessTable data={data} isLoading={false} />)
    // (1 + 0.9) / 2 = 0.95 → 95 % (locale-formatted)
    expect(screen.getByText(/95\s%\s—\sВсе данные загружены/)).toBeInTheDocument()
    expect(screen.getByText('Состояние источников данных')).toBeInTheDocument()
  })
})
