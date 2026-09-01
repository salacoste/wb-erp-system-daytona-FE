import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { DateRange } from '@/types/date-range'

vi.mock('../components/AcquiringPeriodDetailPage', () => ({
  AcquiringPeriodDetailPage: () => null,
}))

import AcquiringPeriodRoute from '../page'

type PeriodPageProps = {
  initialRange?: DateRange
  initialRangeError?: string
}

describe('AcquiringPeriodRoute', () => {
  it('preserves the direct route default when no deep-link period is provided', async () => {
    const result = (await AcquiringPeriodRoute({})) as ReactElement<PeriodPageProps>

    expect(result.props).toEqual({})
  })

  it('hydrates a supported ISO period deep link without changing its calendar dates', async () => {
    const result = (await AcquiringPeriodRoute({
      searchParams: Promise.resolve({ from: '2026-08-01', to: '2026-08-31' }),
    })) as ReactElement<PeriodPageProps>

    expect(result.props.initialRange?.from).toEqual(new Date(2026, 7, 1))
    expect(result.props.initialRange?.to).toEqual(new Date(2026, 7, 31))
    expect(result.props.initialRangeError).toBeUndefined()
  })

  it('rejects missing or invalid deep-link period context without issuing an unbounded query', async () => {
    const invalidContexts = [
      { from: '2026-08-01' },
      { to: '2026-08-31' },
      { from: '2026-02-30', to: '2026-03-01' },
      { from: '2026-09-01', to: '2026-08-01' },
      { from: '2025-01-01', to: '2026-01-01' },
    ]

    for (const searchParams of invalidContexts) {
      const result = (await AcquiringPeriodRoute({
        searchParams: Promise.resolve(searchParams),
      })) as ReactElement<PeriodPageProps>

      expect(result.props.initialRange).toBeUndefined()
      expect(result.props.initialRangeError).toMatch(/Период в ссылке недоступен/)
    }
  })
})
