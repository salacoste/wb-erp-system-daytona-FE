/**
 * MSW Handlers for Unit Economics API
 * Epic 5 - Unit Economics Analytics
 * Story 5.1: API Integration - Test Mocks
 *
 * Provides mock handlers for testing unit economics hook and components.
 * Reference: docs/stories/5.1.unit-economics-backend-api.md
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  UnitEconomicsResponse,
  UnitEconomicsItem,
  UnitEconomicsSummary,
  CostsPct,
  CostsRub,
  ProfitabilityStatus,
} from '@/types/unit-economics';

// ============================================================================
// Mock Data Generators
// ============================================================================

/**
 * Generate mock costs percentages
 */
function generateMockCostsPct(_revenue: number): CostsPct {
  const cogs = 25 + Math.random() * 15; // 25-40%
  const commission = 10 + Math.random() * 10; // 10-20%
  const logistics_delivery = 5 + Math.random() * 5; // 5-10%
  const logistics_return = 1 + Math.random() * 3; // 1-4%
  const storage = 1 + Math.random() * 3; // 1-4%
  const paid_acceptance = Math.random() * 1; // 0-1%
  const penalties = Math.random() * 0.5; // 0-0.5%
  const other_deductions = Math.random() * 2; // 0-2%

  return {
    cogs,
    commission,
    logistics_delivery,
    logistics_return,
    storage,
    paid_acceptance,
    penalties,
    other_deductions,
    advertising: 0, // Future field
  };
}

/**
 * Generate mock costs in RUB from percentages
 */
function generateMockCostsRub(revenue: number, pct: CostsPct): CostsRub {
  return {
    cogs: Math.round(revenue * pct.cogs / 100),
    commission: Math.round(revenue * pct.commission / 100),
    logistics_delivery: Math.round(revenue * pct.logistics_delivery / 100),
    logistics_return: Math.round(revenue * pct.logistics_return / 100),
    storage: Math.round(revenue * pct.storage / 100),
    paid_acceptance: Math.round(revenue * pct.paid_acceptance / 100),
    penalties: Math.round(revenue * pct.penalties / 100),
    other_deductions: Math.round(revenue * pct.other_deductions / 100),
    advertising: 0,
  };
}

/**
 * Determine profitability status based on margin
 */
function getProfitabilityStatus(marginPct: number): ProfitabilityStatus {
  if (marginPct > 25) return 'excellent';
  if (marginPct > 15) return 'good';
  if (marginPct > 5) return 'warning';
  if (marginPct > 0) return 'critical';
  return 'loss';
}

/**
 * Generate a single mock unit economics item
 */
function generateMockItem(index: number, prefix = 'SKU'): UnitEconomicsItem {
  const revenue = Math.round(10000 + Math.random() * 90000); // 10k-100k
  const costs_pct = generateMockCostsPct(revenue);
  const costs_rub = generateMockCostsRub(revenue, costs_pct);

  const total_costs_pct =
    costs_pct.cogs +
    costs_pct.commission +
    costs_pct.logistics_delivery +
    costs_pct.logistics_return +
    costs_pct.storage +
    costs_pct.paid_acceptance +
    costs_pct.penalties +
    costs_pct.other_deductions;

  const net_margin_pct = 100 - total_costs_pct;
  const net_profit = Math.round(revenue * net_margin_pct / 100);

  return {
    sku_id: `${prefix}-${String(index + 1).padStart(4, '0')}`,
    product_name: `Товар ${index + 1} - ${['Платье', 'Куртка', 'Джинсы', 'Футболка', 'Обувь'][index % 5]}`,
    category: ['Одежда', 'Обувь', 'Аксессуары', 'Спорт'][index % 4],
    brand: ['BrandA', 'BrandB', 'BrandC', 'BrandD'][index % 4],
    revenue,
    units_sold: Math.round(10 + Math.random() * 100),
    costs_pct,
    costs_rub,
    total_costs_pct: Math.round(total_costs_pct * 10) / 10,
    net_margin_pct: Math.round(net_margin_pct * 10) / 10,
    net_profit,
    profitability_status: getProfitabilityStatus(net_margin_pct),
    has_cogs: Math.random() > 0.2, // 80% have COGS
  };
}

/**
 * Generate mock summary from items
 */
function generateMockSummary(items: UnitEconomicsItem[]): UnitEconomicsSummary {
  const total_revenue = items.reduce((sum, item) => sum + item.revenue, 0);
  const total_net_profit = items.reduce((sum, item) => sum + item.net_profit, 0);
  const avg_cogs_pct = items.reduce((sum, item) => sum + item.costs_pct.cogs, 0) / items.length;
  const avg_wb_fees_pct = items.reduce((sum, item) =>
    sum + item.costs_pct.commission + item.costs_pct.logistics_delivery +
    item.costs_pct.logistics_return + item.costs_pct.storage, 0
  ) / items.length;
  const avg_net_margin_pct = items.reduce((sum, item) => sum + item.net_margin_pct, 0) / items.length;

  return {
    total_revenue,
    total_net_profit,
    avg_cogs_pct: Math.round(avg_cogs_pct * 10) / 10,
    avg_wb_fees_pct: Math.round(avg_wb_fees_pct * 10) / 10,
    avg_net_margin_pct: Math.round(avg_net_margin_pct * 10) / 10,
    sku_count: items.length,
    profitable_sku_count: items.filter(i => i.net_margin_pct > 0).length,
    loss_making_sku_count: items.filter(i => i.net_margin_pct <= 0).length,
    missing_cogs_count: items.filter(i => !i.has_cogs).length,
  };
}

// ============================================================================
// Pre-generated Mock Data
// ============================================================================

/**
 * Pre-generated mock items for consistent testing
 */
export const mockUnitEconomicsItems: UnitEconomicsItem[] = Array.from(
  { length: 10 },
  (_, i) => generateMockItem(i)
);

/**
 * Pre-generated mock summary
 */
export const mockUnitEconomicsSummary: UnitEconomicsSummary =
  generateMockSummary(mockUnitEconomicsItems);

/**
 * Standard mock response
 */
export const mockUnitEconomicsResponse: UnitEconomicsResponse = {
  meta: {
    week: '2025-W50',
    cabinet_id: 'test-cabinet-id',
    view_by: 'sku',
    generated_at: new Date().toISOString(),
  },
  summary: mockUnitEconomicsSummary,
  data: mockUnitEconomicsItems,
};

/**
 * Empty response for testing empty states
 */
export const mockEmptyUnitEconomicsResponse: UnitEconomicsResponse = {
  meta: {
    week: '2025-W50',
    cabinet_id: 'test-cabinet-id',
    view_by: 'sku',
    generated_at: new Date().toISOString(),
  },
  summary: {
    total_revenue: 0,
    total_net_profit: 0,
    avg_cogs_pct: 0,
    avg_wb_fees_pct: 0,
    avg_net_margin_pct: 0,
    sku_count: 0,
    profitable_sku_count: 0,
    loss_making_sku_count: 0,
    missing_cogs_count: 0,
  },
  data: [],
};

// ============================================================================
// MSW Handlers
// ============================================================================

/**
 * Base API URL - matches apiClient configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Unit Economics API handlers for MSW
 *
 * Note: Backend returns responses without wrapper (meta, summary, data at top level).
 * The apiClient extracts `response.data` if present, so we use `items` instead of `data`
 * to avoid unwrapping issues, OR we wrap in { data: response } format.
 *
 * Based on backend pattern, we wrap the full response in a `data` field.
 */
export const unitEconomicsHandlers = [
  /**
   * GET /v1/analytics/unit-economics
   * Returns unit economics data with optional filtering/sorting
   */
  http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, async ({ request }) => {
    const url = new URL(request.url);
    const week = url.searchParams.get('week');
    const viewBy = url.searchParams.get('view_by') || 'sku';
    const sortBy = url.searchParams.get('sort_by') || 'revenue';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    // Simulate network delay
    await delay(100);

    // Validate required parameter
    if (!week) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parameter "week" is required',
            details: [{ field: 'week', issue: 'missing' }],
          },
        },
        { status: 400 }
      );
    }

    // Check for special test week that triggers empty response
    if (week === 'empty') {
      // Wrap in data field for apiClient compatibility
      return HttpResponse.json({ data: mockEmptyUnitEconomicsResponse });
    }

    // Check for special test week that triggers error
    if (week === 'error') {
      return HttpResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Internal server error',
          },
        },
        { status: 500 }
      );
    }

    // Generate items based on limit
    let items = Array.from({ length: Math.min(limit, 50) }, (_, i) =>
      generateMockItem(i)
    );

    // Apply sorting
    items.sort((a, b) => {
      const fieldA = sortBy === 'revenue' ? a.revenue : a.net_margin_pct;
      const fieldB = sortBy === 'revenue' ? b.revenue : b.net_margin_pct;
      return sortOrder === 'desc' ? fieldB - fieldA : fieldA - fieldB;
    });

    // Apply limit
    items = items.slice(0, limit);

    const response: UnitEconomicsResponse = {
      meta: {
        week,
        cabinet_id: 'test-cabinet-id',
        view_by: viewBy as UnitEconomicsResponse['meta']['view_by'],
        generated_at: new Date().toISOString(),
      },
      summary: generateMockSummary(items),
      data: items,
    };

    // Wrap in data field for apiClient compatibility
    // apiClient extracts response.data automatically
    return HttpResponse.json({ data: response });
  }),
];

/**
 * Error handler for testing error scenarios
 */
export const unitEconomicsErrorHandlers = [
  http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, async () => {
    await delay(100);
    return HttpResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Internal server error',
          trace_id: 'test-trace-id',
        },
      },
      { status: 500 }
    );
  }),
];

/**
 * Slow handler for testing loading states
 */
export const unitEconomicsSlowHandlers = [
  http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, async ({ request }) => {
    const url = new URL(request.url);
    const week = url.searchParams.get('week');

    // Simulate slow network
    await delay(2000);

    // Wrap in data field for apiClient compatibility
    return HttpResponse.json({
      data: {
        ...mockUnitEconomicsResponse,
        meta: {
          ...mockUnitEconomicsResponse.meta,
          week: week || '2025-W50',
        },
      },
    });
  }),
];
