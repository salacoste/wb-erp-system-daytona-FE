/**
 * Unit Tests for useSupplyPlanning Hook
 * Epic 6 - Supply Planning & Stockout Prevention
 * Story 6.1: API Integration - AC 6, 7, 8
 *
 * Tests:
 * - Successful data fetching
 * - Loading states
 * - Error handling
 * - Query parameter handling
 * - Cache behavior
 * - Convenience hooks (useStockoutRisks, useReorderNeeded)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useSupplyPlanning,
  useStockoutRisks,
  useReorderNeeded,
  useSupplyPlanningSummary,
  supplyPlanningQueryKeys,
  useInvalidateSupplyPlanningQueries,
} from '../useSupplyPlanning';
import {
  renderHookWithClient,
  createTestQueryClient,
  setupMockAuth,
  clearMockAuth,
} from '@/test/test-utils';
import type { SupplyPlanningQueryParams } from '@/types/supply-planning';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('useSupplyPlanning', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch supply planning data with default parameters', async () => {
      const { result } = renderHookWithClient(() => useSupplyPlanning());

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.meta).toBeDefined();
      expect(result.current.data?.summary).toBeDefined();
      expect(result.current.data?.data).toBeInstanceOf(Array);
      expect(result.current.error).toBeNull();
    });

    it('should fetch data with custom parameters', async () => {
      const params: SupplyPlanningQueryParams = {
        week: '2025-W50',
        velocity_weeks: 8,
        safety_stock_days: 14,
        sort_by: 'days_until_stockout',
        sort_order: 'asc',
        limit: 50,
      };

      const { result } = renderHookWithClient(() => useSupplyPlanning(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.meta.velocity_weeks).toBe(8);
    });

    it('should handle empty data response', async () => {
      const params: SupplyPlanningQueryParams = {
        week: 'empty',
      };

      const { result } = renderHookWithClient(() => useSupplyPlanning(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toHaveLength(0);
      expect(result.current.data?.summary.total_skus).toBe(0);
    });
  });

  describe('loading states', () => {
    it('should show loading state while fetching', async () => {
      const { result } = renderHookWithClient(() => useSupplyPlanning());

      // Check initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should respect enabled option', async () => {
      const { result } = renderHookWithClient(() =>
        useSupplyPlanning({}, { enabled: false })
      );

      // Should not fetch when disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const params: SupplyPlanningQueryParams = {
        week: 'error',
      };

      const { result } = renderHookWithClient(() => useSupplyPlanning(params));

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeDefined();
      expect(result.current.data).toBeUndefined();
    });

    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/supply-planning`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHookWithClient(() => useSupplyPlanning());

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeDefined();
    });

    it('should handle 401 Unauthorized', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/supply-planning`, () => {
          return HttpResponse.json(
            {
              error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
              },
            },
            { status: 401 }
          );
        })
      );

      const { result } = renderHookWithClient(() => useSupplyPlanning());

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeDefined();
    });

    it('should handle 403 Forbidden', async () => {
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/supply-planning`, () => {
          return HttpResponse.json(
            {
              error: {
                code: 'FORBIDDEN',
                message: 'Access denied',
              },
            },
            { status: 403 }
          );
        })
      );

      const { result } = renderHookWithClient(() => useSupplyPlanning());

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeDefined();
    });
  });

  describe('query keys', () => {
    it('should generate correct query keys', () => {
      const params: SupplyPlanningQueryParams = {
        week: '2025-W50',
        show_only: 'stockout_risk',
      };

      const keys = supplyPlanningQueryKeys.list(params);

      expect(keys).toEqual(['supply-planning', 'list', params]);
    });

    it('should have consistent base key', () => {
      expect(supplyPlanningQueryKeys.all).toEqual(['supply-planning']);
    });

    it('should generate detail key', () => {
      const skuId = 'SKU-001';
      const keys = supplyPlanningQueryKeys.detail(skuId);

      expect(keys).toEqual(['supply-planning', 'detail', 'SKU-001']);
    });
  });

  describe('cache behavior', () => {
    it('should cache data between renders', async () => {
      const queryClient = createTestQueryClient();
      const params: SupplyPlanningQueryParams = {};

      // First render
      const { result, rerender } = renderHookWithClient(
        () => useSupplyPlanning(params),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstData = result.current.data;

      // Rerender should use cached data
      rerender();

      expect(result.current.data).toBe(firstData);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('refetch behavior', () => {
    it('should refetch data on manual trigger', async () => {
      const { result } = renderHookWithClient(() => useSupplyPlanning());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Trigger refetch
      await result.current.refetch();

      // Data should still be present after refetch
      expect(result.current.data).toBeDefined();
    });
  });

  describe('parameter changes', () => {
    it('should refetch when show_only changes', async () => {
      const queryClient = createTestQueryClient();
      let showOnly: 'stockout_risk' | 'reorder_needed' | undefined = undefined;

      const { result, rerender } = renderHookWithClient(
        () => useSupplyPlanning({ show_only: showOnly }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.data.length).toBeGreaterThan(0);

      // Change filter
      showOnly = 'stockout_risk';
      rerender();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Filtered data should still be defined
      expect(result.current.data?.data).toBeDefined();
    });
  });
});

describe('useStockoutRisks', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
  });

  it('should fetch only stockout risk items', async () => {
    const { result } = renderHookWithClient(() => useStockoutRisks());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    // All items should be at-risk (out_of_stock, critical, or warning)
    result.current.data?.data.forEach((item) => {
      expect(['out_of_stock', 'critical', 'warning']).toContain(
        item.stockout_risk
      );
    });
  });

  it('should respect additional parameters', async () => {
    const { result } = renderHookWithClient(() =>
      useStockoutRisks({
        sort_by: 'days_until_stockout',
        sort_order: 'asc',
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe('useReorderNeeded', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
  });

  it('should fetch only items needing reorder', async () => {
    const { result } = renderHookWithClient(() => useReorderNeeded());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe('useSupplyPlanningSummary', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
  });

  it('should fetch summary with minimal data', async () => {
    const { result } = renderHookWithClient(() => useSupplyPlanningSummary());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.summary).toBeDefined();
  });
});

describe('useInvalidateSupplyPlanningQueries', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
  });

  it('should invalidate queries when called', async () => {
    const queryClient = createTestQueryClient();

    // First, fetch some data
    const { result: dataResult } = renderHookWithClient(
      () => useSupplyPlanning(),
      { queryClient }
    );

    await waitFor(() => {
      expect(dataResult.current.isSuccess).toBe(true);
    });

    // Get the invalidate function
    const { result: invalidateResult } = renderHookWithClient(
      () => useInvalidateSupplyPlanningQueries(),
      { queryClient }
    );

    // Invalidate
    invalidateResult.current();

    // Query should refetch
    await waitFor(() => {
      expect(dataResult.current.isSuccess).toBe(true);
    });
  });
});

describe('supplyPlanningQueryKeys', () => {
  it('should have correct structure', () => {
    expect(supplyPlanningQueryKeys.all).toEqual(['supply-planning']);

    const params: SupplyPlanningQueryParams = {
      week: '2025-W50',
      show_only: 'stockout_risk',
    };
    expect(supplyPlanningQueryKeys.list(params)).toEqual([
      'supply-planning',
      'list',
      params,
    ]);
  });
});
