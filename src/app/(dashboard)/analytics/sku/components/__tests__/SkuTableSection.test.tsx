/**
 * Tests for SkuTableSection — 168.9 shadcn token migration pins
 * (empty state + HelpCard information tints).
 */

import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SkuTableSection } from '../SkuTableSection'

describe('SkuTableSection (168.9 tokens)', () => {
  it('empty state: semantic border-border + bg-muted/50 + muted text', () => {
    const { container } = renderWithProviders(
      <SkuTableSection skuData={[]} showHistoricalSpp={false} />
    )
    const empty = container.querySelector('div.rounded-lg.border-border') as HTMLElement
    expect(empty).not.toBeNull()
    expect(empty.classList.contains('bg-muted/50')).toBe(true)
    expect(
      screen.getByText('Нет данных за выбранную неделю').classList.contains('text-muted-foreground')
    ).toBe(true)
  })

  it('HelpCard: status-information /30 border + /10 bg, foreground title', () => {
    const { container } = renderWithProviders(
      <SkuTableSection skuData={[]} showHistoricalSpp={false} />
    )
    const helpCard = container.querySelector('div.border-status-information\\/30')
    expect(helpCard).not.toBeNull()
    expect(helpCard!.classList.contains('bg-status-information/10')).toBe(true)
    expect(screen.getByText('Как использовать анализ').classList.contains('text-foreground')).toBe(
      true
    )
  })
})
