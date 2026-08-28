/**
 * TelegramStatusCard tests — Epic 68-FE
 * Focus: deliveryRate is a 0-1 ratio (request #149). StatusMetrics must
 * gate color on the 0-1 scale and render via the comma+NBSP locale formatter.
 * Regex locale assertions (frontend/CLAUDE.md) — `\s` matches the NBSP separator.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TelegramStatusCard } from './TelegramStatusCard'
import type { DashboardTelegram } from '../types/monitoring'

function makeTelegram(overrides: Partial<DashboardTelegram> = {}): DashboardTelegram {
  return { status: 'active', deliveryRate7d: 0.95, recentFailures: 0, ...overrides }
}

describe('TelegramStatusCard — StatusMetrics deliveryRate (0-1 ratio)', () => {
  it('renders 0.95 ratio as "95,0 %" in green', () => {
    render(
      <TelegramStatusCard telegram={makeTelegram({ deliveryRate7d: 0.95 })} isLoading={false} />
    )
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/95,0\s%/)
    expect(value.className).toContain('text-status-success')
  })

  it('renders 0.85 ratio as "85,0 %" in yellow', () => {
    render(
      <TelegramStatusCard telegram={makeTelegram({ deliveryRate7d: 0.85 })} isLoading={false} />
    )
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/85,0\s%/)
    expect(value.className).toContain('text-status-warning')
  })

  it('renders 0.5 ratio as "50,0 %" in red', () => {
    render(
      <TelegramStatusCard telegram={makeTelegram({ deliveryRate7d: 0.5 })} isLoading={false} />
    )
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/50,0\s%/)
    expect(value.className).toContain('text-status-error')
  })

  it('renders a perfect 1 ratio as "100,0 %" in green', () => {
    render(<TelegramStatusCard telegram={makeTelegram({ deliveryRate7d: 1 })} isLoading={false} />)
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/100,0\s%/)
    expect(value.className).toContain('text-status-success')
  })

  it('renders 0.8 ratio as "80,0 %" in yellow (exact >= 0.8 boundary)', () => {
    render(
      <TelegramStatusCard telegram={makeTelegram({ deliveryRate7d: 0.8 })} isLoading={false} />
    )
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/80,0\s%/)
    expect(value.className).toContain('text-status-warning')
  })

  it('renders "0,0 %" in red for a zero delivery rate (the ?? 0 fallback value)', () => {
    // The component's `deliveryRate7d ?? 0` fallback only fires when `telegram` is
    // undefined — but that routes to NotConfiguredCta, not StatusMetrics. The reachable
    // equivalent in StatusMetrics is an explicit 0, which renders the same red 0,0 %.
    render(
      <TelegramStatusCard
        telegram={makeTelegram({ status: 'offline', deliveryRate7d: 0 })}
        isLoading={false}
      />
    )
    const value = screen.getByLabelText(/Процент доставки за 7 дней/)
    expect(value.textContent).toMatch(/0,0\s%/)
    expect(value.className).toContain('text-status-error')
  })
})
