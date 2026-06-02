/**
 * Search Analytics empty-shape fixtures — Story 119.1-FE
 * Pattern 3 (CLAUDE.md § Multi-Source Orchestration): Story-1 fixture seeding
 * for new domains. Originating precedent: Story 92.6-FE (retroactive-extraction
 * tax avoidance). Mirrors src/test/fixtures/monitor-empty.ts (Story 92.1-FE).
 *
 * Convention: counts use 0 (AP#8 exception); ratio/money fields use null per
 * Anti-Pattern #8 (null = unknown, 0 = known zero — never collapse them).
 * `searchOrderShare` is null here per the Story 119.1-FE 1st-pass F-2 widening
 * (SearchOrdersSummary.searchOrderShare: number | null).
 */

import type {
  SearchByProductResponse,
  SearchByQueryResponse,
  SearchOrdersResponse,
} from '@/types/search-analytics'

/** Empty by-product response: no queries driving traffic. */
export function emptySearchByProductResponse(
  overrides?: Partial<SearchByProductResponse>
): SearchByProductResponse {
  return {
    nmId: 0,
    period: { from: '', to: '' },
    queries: [],
    totalQueries: 0,
    ...overrides,
  }
}

/** Empty by-query response: no products ranking for the term. */
export function emptySearchByQueryResponse(
  overrides?: Partial<SearchByQueryResponse>
): SearchByQueryResponse {
  return {
    query: '',
    period: { from: '', to: '' },
    products: [],
    totalProducts: 0,
    ...overrides,
  }
}

/** Empty search-orders response: no organic search attribution. */
export function emptySearchOrdersResponse(
  overrides?: Partial<SearchOrdersResponse>
): SearchOrdersResponse {
  return {
    period: { from: '', to: '' },
    groupBy: 'query',
    items: [],
    // searchOrderShareInflated: false keeps this fixture normalize-stable (the
    // normalizer always emits the boolean per F-6 / Request #176 resolution).
    summary: { totalSearchOrders: 0, searchOrderShare: null, searchOrderShareInflated: false },
    ...overrides,
  }
}
