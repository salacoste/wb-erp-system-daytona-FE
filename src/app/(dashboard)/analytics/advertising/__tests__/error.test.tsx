import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() },
}))

import AdvertisingAnalyticsError from '../error'

describe('AdvertisingAnalyticsError', () => {
  it('keeps route identity visible and invokes the boundary reset action', () => {
    const reset = vi.fn()

    render(<AdvertisingAnalyticsError error={new Error('route failed')} reset={reset} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Рекламная аналитика' })).toBeVisible()
    expect(screen.getByText('Произошла ошибка')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Попробовать снова' }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
