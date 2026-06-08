/**
 * Unit tests for route-helpers
 * Route builder helpers for dynamic routes
 */

import { describe, it, expect } from 'vitest'
import {
  buildSupplyDetailRoute,
  buildShipmentDetailRoute,
  buildCampaignDetailRoute,
  buildModelPerformanceRoute,
  buildModelEvaluationsRoute,
  buildModelSkuAccuracyRoute,
  buildProductAnalyticsRoute,
} from '../route-helpers'

// ============================================================================
// buildSupplyDetailRoute
// ============================================================================

describe('buildSupplyDetailRoute', () => {
  it('builds correct supply detail path', () => {
    expect(buildSupplyDetailRoute('abc-123')).toBe('/supplies/abc-123')
  })

  it('handles numeric-like IDs', () => {
    expect(buildSupplyDetailRoute('42')).toBe('/supplies/42')
  })

  it('handles UUID format', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(buildSupplyDetailRoute(uuid)).toBe(`/supplies/${uuid}`)
  })

  it('handles empty string', () => {
    expect(buildSupplyDetailRoute('')).toBe('/supplies/')
  })
})

// ============================================================================
// buildShipmentDetailRoute
// ============================================================================

describe('buildShipmentDetailRoute', () => {
  it('builds correct shipment detail path', () => {
    expect(buildShipmentDetailRoute('ship-456')).toBe('/shipments/ship-456')
  })

  it('handles numeric ID', () => {
    expect(buildShipmentDetailRoute('99')).toBe('/shipments/99')
  })
})

// ============================================================================
// buildCampaignDetailRoute
// ============================================================================

describe('buildCampaignDetailRoute', () => {
  it('builds correct campaign detail path', () => {
    expect(buildCampaignDetailRoute(12345)).toBe('/analytics/advertising/campaigns/12345')
  })

  it('handles zero', () => {
    expect(buildCampaignDetailRoute(0)).toBe('/analytics/advertising/campaigns/0')
  })

  it('handles large number', () => {
    expect(buildCampaignDetailRoute(999999)).toBe('/analytics/advertising/campaigns/999999')
  })
})

// ============================================================================
// buildModelPerformanceRoute
// ============================================================================

describe('buildModelPerformanceRoute', () => {
  it('builds model performance path', () => {
    expect(buildModelPerformanceRoute('model-1')).toBe('/analytics/models/model-1/performance')
  })

  it('handles UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(buildModelPerformanceRoute(uuid)).toBe(`/analytics/models/${uuid}/performance`)
  })
})

// ============================================================================
// buildModelEvaluationsRoute
// ============================================================================

describe('buildModelEvaluationsRoute', () => {
  it('builds model evaluations path', () => {
    expect(buildModelEvaluationsRoute('model-5')).toBe('/analytics/models/model-5/evaluations')
  })
})

// ============================================================================
// buildModelSkuAccuracyRoute
// ============================================================================

describe('buildModelSkuAccuracyRoute', () => {
  it('builds SKU accuracy path', () => {
    expect(buildModelSkuAccuracyRoute('model-5')).toBe(
      '/analytics/models/model-5/evaluations/sku-accuracy'
    )
  })
})

// ============================================================================
// buildProductAnalyticsRoute
// ============================================================================

describe('buildProductAnalyticsRoute', () => {
  it('builds product analytics path', () => {
    expect(buildProductAnalyticsRoute('12345678')).toBe('/analytics/product/12345678')
  })

  it('handles string nmId', () => {
    expect(buildProductAnalyticsRoute('nm-999')).toBe('/analytics/product/nm-999')
  })
})
