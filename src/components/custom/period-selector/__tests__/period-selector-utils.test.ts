import { afterEach, describe, expect, it, vi } from 'vitest'
import { getUniqueMonths } from '../period-selector-utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('getUniqueMonths', () => {
  it('does not expose a future calendar month from the current ISO week', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-30T09:00:00Z'))

    expect(getUniqueMonths(['2026-W27', '2026-W26', '2026-W25'])).toEqual(['2026-06'])
  })

  it('keeps current and past months sorted newest first', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-30T09:00:00Z'))

    expect(getUniqueMonths(['2026-W26', '2026-W22', '2026-W18'])).toEqual([
      '2026-06',
      '2026-05',
      '2026-04',
    ])
  })
})
