/**
 * Test fixtures for Price Calculator
 * Story 44.1-FE: TypeScript Types & API Client
 * Epic 44: Price Calculator UI (Frontend)
 */

import type {
  PriceCalculatorRequest,
  PriceCalculatorResponse,
  PriceCalculatorErrorResponse,
  ErrorCode,
  TwoLevelPricingFormData,
  TwoLevelPricingResult,
} from '@/types/price-calculator'

// ============================================================================
// Request Fixtures
// ============================================================================

export const mockPriceCalculatorRequest: PriceCalculatorRequest = {
  target_margin_pct: 20.0,
  cogs_rub: 1500.0,
  logistics_forward_rub: 200.0,
  logistics_reverse_rub: 150.0,
  buyback_pct: 98.0,
  advertising_pct: 5.0,
  storage_rub: 50.0,
  vat_pct: 20,
  acquiring_pct: 1.5,
  commission_pct: 10.0,
}

export const mockMinimalPriceCalculatorRequest: PriceCalculatorRequest = {
  target_margin_pct: 15.0,
  cogs_rub: 1000.0,
  logistics_forward_rub: 100.0,
  logistics_reverse_rub: 80.0,
  buyback_pct: 97.0,
  advertising_pct: 3.0,
  storage_rub: 30.0,
}

export const mockPriceCalculatorRequestWithOverrides: PriceCalculatorRequest = {
  ...mockPriceCalculatorRequest,
  overrides: {
    commission_pct: 8.0,
    nm_id: 147205694,
  },
}

// ============================================================================
// Response Fixtures
// ============================================================================

export const mockPriceCalculatorResponse: PriceCalculatorResponse = {
  meta: {
    cabinet_id: 'test-cabinet-id',
    calculated_at: '2025-01-17T10:30:00Z',
  },
  result: {
    recommended_price: 2500.0,
    target_margin_pct: 20.0,
    actual_margin_rub: 500.0,
    actual_margin_pct: 20.0,
  },
  // cost_breakdown is now FixedCosts directly (not wrapped)
  cost_breakdown: {
    cogs: 1500.0,
    logistics_forward: 200.0,
    logistics_reverse_effective: 3.0,
    logistics_total: 203.0,
    storage: 50.0,
    fixed_total: 1753.0,
  },
  // percentage_breakdown is now at root level with simple number values
  percentage_breakdown: {
    commission_wb: 250.0,
    commission_pct: 10.0,
    acquiring: 37.5,
    advertising: 125.0,
    vat: 416.67,
    margin: 500.0,
    percentage_total: 1329.17,
  },
  intermediate_values: {
    buyback_rate_pct: 0.02,
    return_rate_pct: 2.0,
    logistics_effective: 0.015,
    total_percentage_rate: 0.565,
  },
  warnings: [],
}

export const mockPriceCalculatorResponseWithWarnings: PriceCalculatorResponse = {
  ...mockPriceCalculatorResponse,
  warnings: [
    'Target margin may not be achievable with current cost structure',
    'Logistics cost is above average for this product category',
  ],
}

export const mockLowMarginResponse: PriceCalculatorResponse = {
  ...mockPriceCalculatorResponse,
  result: {
    recommended_price: 1800.0,
    target_margin_pct: 20.0,
    actual_margin_rub: -200.0,
    actual_margin_pct: -11.11,
  },
  warnings: [
    'Negative margin: recommended price does not achieve target margin',
    'Consider reducing costs or increasing target price',
  ],
}

// ============================================================================
// Error Response Fixtures
// ============================================================================

export const mockValidationErrorResponse: PriceCalculatorErrorResponse = {
  code: 'VALIDATION_ERROR',
  message: 'Validation failed',
  details: [
    { field: 'target_margin_pct', issue: 'Must be between 0 and 100' },
    { field: 'cogs_rub', issue: 'Must be positive' },
  ],
  trace_id: 'trace-123',
}

export const mockUnauthorizedErrorResponse: PriceCalculatorErrorResponse = {
  code: 'UNAUTHORIZED',
  message: 'Authentication required',
  trace_id: 'trace-456',
}

export const mockRateLimitedResponse: PriceCalculatorErrorResponse = {
  code: 'RATE_LIMITED',
  message: 'Too many requests',
  trace_id: 'trace-789',
}

export const mockInternalErrorResponse: PriceCalculatorErrorResponse = {
  code: 'INTERNAL_ERROR',
  message: 'Internal server error',
  trace_id: 'trace-101',
}

// ============================================================================
// Error Codes Type
// ============================================================================

export const errorCodes: ErrorCode[] = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'NETWORK_ERROR',
]

// ============================================================================
// Two-Level Pricing Fixtures (Story 44.20)
// ============================================================================

/** Standard two-level pricing form data for testing */
export const mockTwoLevelPricingFormData: TwoLevelPricingFormData = {
  fulfillment_type: 'FBO',
  cogs_rub: 500,
  logistics_forward_rub: 120,
  logistics_reverse_rub: 180,
  buyback_pct: 80,
  storage_rub: 25,
  acceptance_cost: 19,
  acquiring_pct: 1.5,
  drr_pct: 5,
  target_margin_pct: 15,
  tax_rate_pct: 6,
  tax_type: 'income',
  spp_pct: 10,
}

/** FBS variant (no storage/acceptance costs) */
export const mockTwoLevelPricingFormDataFBS: TwoLevelPricingFormData = {
  ...mockTwoLevelPricingFormData,
  fulfillment_type: 'FBS',
}

/** Expected result for standard form data */
export const mockTwoLevelPricingResult: TwoLevelPricingResult = {
  minimumPrice: 903.23,
  recommendedPrice: 1217.39,
  customerPrice: 1095.65,
  priceGap: { rub: 314.16, pct: 34.78 },
  fixedCosts: {
    cogs: 500,
    logisticsForward: 120,
    logisticsReverseEffective: 36,
    storage: 25,
    acceptance: 19,
    total: 700,
  },
  percentageCosts: {
    commissionWb: { pct: 15, rub: 182.61 },
    acquiring: { pct: 1.5, rub: 18.26 },
    taxIncome: { pct: 6, rub: 73.04 },
    total: { pct: 22.5, rub: 273.91 },
  },
  variableCosts: {
    drr: { pct: 5, rub: 60.87 },
    total: { pct: 5, rub: 60.87 },
  },
  margin: { pct: 15, rub: 182.61, afterTax: null },
}
