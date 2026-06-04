/**
 * Tests for ProductAnalyticsContent — Unified Product Analytics shell (Story 120.5-FE).
 * Covers: header render, opaque-id handling (AP#10), all four tabs, default tab
 * placeholder, and tab switching.
 */

import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { emptyUnifiedProduct } from '@/test/fixtures/unified-product-empty'
import { UNIFIED_PRODUCT_TABS, UNIFIED_PRODUCT_TAB_LABELS } from '@/types/unified-product'
import { ProductAnalyticsContent } from '../ProductAnalyticsContent'

describe('ProductAnalyticsContent', () => {
  it('renders the product header with the nmId', () => {
    const { nmId } = emptyUnifiedProduct()
    render(<ProductAnalyticsContent nmId={nmId} />)
    expect(screen.getByRole('heading', { name: `Аналитика товара #${nmId}` })).toBeInTheDocument()
  })

  it('renders an opaque nmId via String() without mangling leading zeros (AP#10)', () => {
    render(<ProductAnalyticsContent nmId="00123" />)
    // formatNumber would drop leading zeros / group digits — String() must preserve verbatim
    expect(screen.getByRole('heading', { name: 'Аналитика товара #00123' })).toBeInTheDocument()
    expect(screen.queryByText(/#123\b/)).toBeNull()
  })

  it('renders all four tabs with their Russian labels', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    for (const tab of UNIFIED_PRODUCT_TABS) {
      expect(screen.getByRole('tab', { name: UNIFIED_PRODUCT_TAB_LABELS[tab] })).toBeInTheDocument()
    }
    // tablist has an accessible name
    expect(screen.getByRole('tablist', { name: 'Разделы аналитики товара' })).toBeInTheDocument()
  })

  it('shows the first tab (Обзор) placeholder by default', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    // Radix mounts only the active panel → getByRole('tabpanel') singular is valid here
    const panel = screen.getByRole('tabpanel')
    expect(
      within(panel).getByText(`Раздел «${UNIFIED_PRODUCT_TAB_LABELS.overview}» в разработке`)
    ).toBeInTheDocument()
  })

  it('switches the active tab on click for every tab', async () => {
    const user = userEvent.setup()
    render(<ProductAnalyticsContent nmId="1" />)

    // Cover all four tab→placeholder mappings, not just one
    for (const tab of UNIFIED_PRODUCT_TABS) {
      const label = UNIFIED_PRODUCT_TAB_LABELS[tab]
      await user.click(screen.getByRole('tab', { name: label }))
      const panel = screen.getByRole('tabpanel')
      expect(within(panel).getByText(`Раздел «${label}» в разработке`)).toBeInTheDocument()
    }
  })

  it('renders a back link to the analytics hub', () => {
    render(<ProductAnalyticsContent nmId="1" />)
    expect(screen.getByRole('link', { name: /Назад к аналитике/ })).toHaveAttribute(
      'href',
      '/analytics'
    )
  })
})

describe('emptyUnifiedProduct fixture (Pattern 3 seed)', () => {
  it('returns a default opaque nmId and merges overrides', () => {
    expect(emptyUnifiedProduct().nmId).toBe('887604577')
    expect(emptyUnifiedProduct({ nmId: '999' }).nmId).toBe('999')
  })
})
