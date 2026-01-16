/**
 * Unit Tests for useLiquidity Hook
 * Epic 7 - Liquidity Analysis (Ликвидность товаров)
 * Story 7.1: API Integration
 *
 * Tests:
 * - Successful data fetching
 * - Loading states
 * - Error handling
 * - Query parameter handling
 * - Cache behavior
 * - Convenience hooks (useIlliquidStock, useHighlyLiquidStock, etc.)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  useLiquidity,
  useLiquidityTrends,
  useIlliquidStock,
  useHighlyLiquidStock,
  useLiquidityByCategory,
  useLiquiditySummary,
  liquidityQueryKeys,
  useInvalidateLiquidityQueries,
} from '../useLiquidity';
import {
  renderHookWithClient,
  setupMockAuth,
  clearMockAuth,
} from '@/test/test-utils';
import type { LiquidityQueryParams } from '@/types/liquidity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('useLiquidity', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch liquidity data with default parameters', async () => {
      const { result } = renderHookWithClient(() => useLiquidity());

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
      const params: LiquidityQueryParams = {
        category_filter: 'illiquid',
        sort_by: 'stock_value',
        sort_order: 'desc',
        limit: 50,
        include_liquidation_scenarios: true,
      };

      const { result } = renderHookWithClient(() => useLiquidity(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.meta.cabinet_id).toBeDefined();
    });

    it('should include liquidation scenarios for illiquid items', async () => {
      const params: LiquidityQueryParams = {
        category_filter: 'illiquid',
        include_liquidation_scenarios: true,
      };

      const { result } = renderHookWithClient(() => useLiquidity(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      const illiquidItems = result.current.data?.data.filter(
        (item) => item.liquidity_category === 'illiquid'
      );
      // Illiquid items should have liquidation scenarios
      illiquidItems?.forEach((item) => {
        if (item.liquidation_scenarios) {
          expect(item.liquidation_scenarios.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('loading states', () => {
    it('should show loading state while fetching', async () => {
      const { result } = renderHookWithClient(() => useLiquidity());

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
        useLiquidity({}, { enabled: false })
      );

      // Should not be loading when disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const params: LiquidityQueryParams = {
        category_filter: 'error' as LiquidityQueryParams['category_filter'],
      };

      const { result } = renderHookWithClient(() => useLiquidity(params));

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
        http.get(`${API_BASE_URL}/v1/analytics/liquidity`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHookWithClient(() => useLiquidity());

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
        http.get(`${API_BASE_URL}/v1/analytics/liquidity`, () => {
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

      const { result } = renderHookWithClient(() => useLiquidity());

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
      const params: LiquidityQueryParams = {
        category_filter: 'illiquid',
        sort_by: 'turnover_days',
      };

      const key = liquidityQueryKeys.list(params);
      expect(key).toEqual(['liquidity', 'list', params]);
    });

    it('should generate different keys for different params', () => {
      const params1: LiquidityQueryParams = { category_filter: 'illiquid' };
      const params2: LiquidityQueryParams = { category_filter: 'highly_liquid' };

      const key1 = liquidityQueryKeys.list(params1);
      const key2 = liquidityQueryKeys.list(params2);

      expect(key1).not.toEqual(key2);
    });

    it('should have correct trends query key structure', () => {
      const key = liquidityQueryKeys.trends(90);
      expect(key).toEqual(['liquidity', 'trends', 90]);
    });
  });
});

describe('useLiquidityTrends', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  it('should fetch trends data with default period', async () => {
    const { result } = renderHookWithClient(() => useLiquidityTrends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.trends).toBeInstanceOf(Array);
    expect(result.current.data?.insights).toBeInstanceOf(Array);
  });

  it('should fetch trends with custom period', async () => {
    const { result } = renderHookWithClient(() =>
      useLiquidityTrends({ period: 30 })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });
});

describe('convenience hooks', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('useIlliquidStock', () => {
    it('should fetch only illiquid SKUs with liquidation scenarios', async () => {
      const { result } = renderHookWithClient(() => useIlliquidStock());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('useHighlyLiquidStock', () => {
    it('should fetch only highly liquid SKUs', async () => {
      const { result } = renderHookWithClient(() => useHighlyLiquidStock());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('useLiquidityByCategory', () => {
    it('should fetch SKUs by category', async () => {
      const { result } = renderHookWithClient(() =>
        useLiquidityByCategory('low_liquid')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
    });
  });

  describe('useLiquiditySummary', () => {
    it('should fetch summary with minimal data', async () => {
      const { result } = renderHookWithClient(() => useLiquiditySummary());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.summary).toBeDefined();
    });
  });
});

describe('helper hooks', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('useInvalidateLiquidityQueries', () => {
    it('should return a function', () => {
      const { result } = renderHookWithClient(() =>
        useInvalidateLiquidityQueries()
      );

      expect(typeof result.current).toBe('function');
    });

    it('should invalidate queries when called', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      const { result } = renderHookWithClient(() =>
        useInvalidateLiquidityQueries()
      );

      result.current();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Liquidity] Invalidating all liquidity queries'
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('summary data structure', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  it('should have correct distribution structure', async () => {
    const { result } = renderHookWithClient(() => useLiquidity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const distribution = result.current.data?.summary.distribution;
    expect(distribution).toBeDefined();
    expect(distribution?.highly_liquid).toBeDefined();
    expect(distribution?.medium_liquid).toBeDefined();
    expect(distribution?.low_liquid).toBeDefined();
    expect(distribution?.illiquid).toBeDefined();

    // Each distribution item should have required fields
    expect(distribution?.highly_liquid.count).toBeGreaterThanOrEqual(0);
    expect(distribution?.highly_liquid.value).toBeGreaterThanOrEqual(0);
    expect(distribution?.highly_liquid.pct).toBeGreaterThanOrEqual(0);
  });

  it('should have correct benchmarks structure', async () => {
    const { result } = renderHookWithClient(() => useLiquidity());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const benchmarks = result.current.data?.summary.benchmarks;
    expect(benchmarks).toBeDefined();
    expect(benchmarks?.your_avg_turnover).toBeDefined();
    expect(benchmarks?.target_avg_turnover).toBeDefined();
    expect(benchmarks?.industry_avg_turnover).toBeDefined();
    expect(benchmarks?.overall_status).toBeDefined();
    expect(['excellent', 'good', 'warning', 'critical']).toContain(
      benchmarks?.overall_status
    );
  });
});
