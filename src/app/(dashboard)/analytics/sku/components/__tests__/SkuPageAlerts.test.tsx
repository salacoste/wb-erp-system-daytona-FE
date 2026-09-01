/**
 * Tests for SkuPageAlerts — 168.9 shadcn token migration pins.
 * Info banners/alerts blue → status-information; hint → muted-foreground.
 */

import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { OperatingProfitInfoBanner, NmIdFilterAlert, PeriodLabel } from '../SkuPageAlerts'

describe('OperatingProfitInfoBanner (168.9 tokens)', () => {
  it('uses status-information /30 border + /10 bg + icon token', () => {
    const { container } = renderWithProviders(<OperatingProfitInfoBanner />)
    const alert = container.querySelector('[data-slot="alert"]') ?? container.firstElementChild!
    expect(alert.classList.contains('border-status-information/30')).toBe(true)
    expect(alert.classList.contains('bg-status-information/10')).toBe(true)
    const icon = container.querySelector('svg.lucide-info')
    expect(icon?.classList.contains('text-status-information')).toBe(true)
  })
})

describe('NmIdFilterAlert (168.9 tokens)', () => {
  it('alert container + text use status-information / foreground', () => {
    const { container } = renderWithProviders(
      <NmIdFilterAlert nmIdFilter="12345" filteredProductName={null} onClear={vi.fn()} />
    )
    const alert = container.querySelector('div[role="alert"]') ?? container.firstElementChild!
    expect(alert.classList.contains('border-status-information/30')).toBe(true)
    expect(alert.classList.contains('bg-status-information/10')).toBe(true)
    const span = screen.getByText('12345').closest('span.text-sm')
    expect(span!.classList.contains('text-foreground')).toBe(true)
  })

  it('clear button uses text-status-information with tokenized hover bg', () => {
    renderWithProviders(
      <NmIdFilterAlert nmIdFilter="12345" filteredProductName={null} onClear={vi.fn()} />
    )
    const btn = screen.getByRole('button', { name: /Показать все/ })
    expect(btn.classList.contains('text-status-information')).toBe(true)
    expect(btn.classList.contains('hover:bg-status-information/10')).toBe(true)
  })

  it('keeps the active SKU filter and a visible reset action in filtered-empty state', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    renderWithProviders(
      <NmIdFilterAlert nmIdFilter="123" filteredProductName={null} onClear={onClear} />
    )

    expect(screen.getByText('123')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Показать все' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

describe('PeriodLabel (168.9 tokens)', () => {
  it('uses muted-foreground text on status-information /10 bg', () => {
    const { container } = renderWithProviders(
      <PeriodLabel weekStart="2026-01-05" weekEnd="2026-01-11" />
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.classList.contains('bg-status-information/10')).toBe(true)
    expect(el.classList.contains('text-muted-foreground')).toBe(true)
    const icon = container.querySelector('svg')
    expect(icon?.classList.contains('text-status-information')).toBe(true)
  })
})
