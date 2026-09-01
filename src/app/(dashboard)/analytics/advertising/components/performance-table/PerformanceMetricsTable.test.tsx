import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PerformanceMetricsTable } from './PerformanceMetricsTable'
import type { AdvertisingItem, ViewByMode } from '@/types/advertising-analytics'

const item = (overrides: Partial<AdvertisingItem>): AdvertisingItem =>
  ({
    key: 'sku:12345',
    sku_id: '12345',
    campaign_id: 67890,
    imtId: 12345,
    views: 100,
    clicks: 10,
    orders: 5,
    spend: 500,
    total_sales: 2_000,
    revenue: 1_800,
    profit: 600,
    organic_sales: 800,
    organic_contribution: 50,
    roas: 3.6,
    roi: 1.2,
    ctr: 0.1,
    cpc: 50,
    conversion_rate: 0.05,
    profit_after_ads: 100,
    efficiency_status: 'good',
    ...overrides,
  }) as AdvertisingItem

function renderTable(viewBy: ViewByMode, data: AdvertisingItem[]) {
  return render(
    <PerformanceMetricsTable
      data={data}
      viewBy={viewBy}
      isLoading={false}
      sortBy="spend"
      sortOrder="desc"
      onSortChange={vi.fn()}
      page={1}
      pageSize={20}
      totalCount={data.length}
      onPageChange={vi.fn()}
    />
  )
}

describe('PerformanceMetricsTable interactions', () => {
  it('preserves exact SKU and campaign detail links in actionable identifier cells', () => {
    const { unmount } = renderTable('sku', [item({ sku_id: '12345' })])
    expect(screen.getByRole('link', { name: '12345' })).toHaveAttribute('href', '/products/12345')
    unmount()

    renderTable('campaign', [item({ key: 'campaign:67890', campaign_id: 67890 })])
    expect(screen.getByRole('link', { name: '67890' })).toHaveAttribute(
      'href',
      '/analytics/advertising/campaigns/67890'
    )
  })
})
