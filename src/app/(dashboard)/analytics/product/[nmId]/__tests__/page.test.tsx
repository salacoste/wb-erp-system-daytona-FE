/**
 * Tests for the Unified Product Analytics server page (Stories 120.5 + 120.6-FE).
 * Closes the AC1↔AC5 traceability gap: the `await params` unwrap is the riskiest
 * line in the story (a sync refactor passes tsc but breaks `next build`), so it
 * gets a behavioral regression guard here — check:next-params is a grep, not a test.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { emptyUnifiedProductData } from '@/test/fixtures/unified-product-empty'

// Mock the data hook — the server page renders the client component which uses it
vi.mock('@/hooks/use-unified-product-analytics', () => ({
  useUnifiedProductAnalytics: vi.fn().mockReturnValue({
    data: emptyUnifiedProductData(),
    isLoading: false,
    isError: false,
  }),
}))

import ProductAnalyticsPage from '../page'

describe('ProductAnalyticsPage (server component)', () => {
  it('awaits params and forwards the opaque nmId to the content shell', async () => {
    // params is a Promise per the Next.js 15 contract — the page must await it
    const element = await ProductAnalyticsPage({ params: Promise.resolve({ nmId: '00123' }) })
    render(element)
    // Leading zeros preserved end-to-end (AP#10) → proves the value flowed through unmangled
    expect(screen.getByRole('heading', { name: 'Аналитика товара #00123' })).toBeInTheDocument()
  })
})
