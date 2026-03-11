/**
 * Unit Tests for useUnitEconomics Hook
 * Epic 5 - Unit Economics Analytics
 * Story 5.1: API Integration - AC 6, 7, 8
 *
 * Tests:
 * - Successful data fetching
 * - Loading states
 * - Error handling
 * - Query parameter handling
 * - Cache behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import {
  useUnitEconomics,
  unitEconomicsKeys,
  invalidateUnitEconomics,
} from '../useUnitEconomics';
import {
  renderHookWithClient,
  createTestQueryClient,
  setupMockAuth,
  clearMockAuth,
} from '@/test/test-utils';
// Mock data exports available for component tests:
// import { mockUnitEconomicsResponse, mockEmptyUnitEconomicsResponse } from '@/mocks/handlers/unit-economics';
import type { UnitEconomicsQueryParams } from '@/types/unit-economics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('useUnitEconomics', () => {
  beforeEach(() => {
    setupMockAuth();
  });

  afterEach(() => {
    clearMockAuth();
    vi.clearAllMocks();
  });

  describe('successful data fetching', () => {
    it('should fetch unit economics data with required week parameter', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      // Wait for data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify data structure
      expect(result.current.data).toBeDefined();
      expect(result.current.data?.meta.week).toBe('2025-W50');
      expect(result.current.data?.summary).toBeDefined();
      expect(result.current.data?.data).toBeInstanceOf(Array);
      expect(result.current.error).toBeNull();
    });

    it('should fetch data with all optional parameters', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
        view_by: 'brand',
        sort_by: 'net_margin_pct',
        sort_order: 'asc',
        limit: 50,
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.meta.view_by).toBe('brand');
    });

    it('should handle empty data response', async () => {
      // Use special 'empty' week to trigger empty response
      const params: UnitEconomicsQueryParams = {
        week: 'empty',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toHaveLength(0);
      expect(result.current.data?.summary.sku_count).toBe(0);
    });
  });

  describe('loading states', () => {
    it('should show loading state while fetching', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      // Check initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);
      expect(result.current.isPending).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should not fetch when week is empty', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      // Should not be loading (enabled: false)
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should respect enabled option', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(() =>
        useUnitEconomics(params, { enabled: false })
      );

      // Should not fetch when disabled
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      // Use special 'error' week to trigger error response
      const params: UnitEconomicsQueryParams = {
        week: 'error',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      // Wait for error state (may take a moment due to internal processing)
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
      // Override handler to simulate network error
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, () => {
          return HttpResponse.error();
        })
      );

      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 5000 }
      );

      expect(result.current.error).toBeDefined();
    });

    it('should handle validation errors (missing week)', async () => {
      // Override handler to return validation error
      server.use(
        http.get(`${API_BASE_URL}/v1/analytics/unit-economics`, () => {
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
        })
      );

      const params: UnitEconomicsQueryParams = {
        week: '2025-W50', // Will still send but handler returns error
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

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
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
        view_by: 'sku',
      };

      const keys = unitEconomicsKeys.list(params);

      expect(keys).toEqual(['unit-economics', 'list', params]);
    });

    it('should have consistent base key', () => {
      expect(unitEconomicsKeys.all).toEqual(['unit-economics']);
    });
  });

  describe('cache behavior', () => {
    it('should cache data between renders', async () => {
      const queryClient = createTestQueryClient();
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      // First render
      const { result, rerender } = renderHookWithClient(
        () => useUnitEconomics(params),
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

    it('should invalidate cache correctly', async () => {
      const queryClient = createTestQueryClient();
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(
        () => useUnitEconomics(params),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify data exists before invalidation
      expect(result.current.data).toBeDefined();

      // Invalidate cache - this marks queries as stale and triggers refetch
      await invalidateUnitEconomics(queryClient);

      // After invalidation, the query refetches - wait for success again
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Data should still be valid after refetch
      expect(result.current.data?.meta.week).toBe('2025-W50');
    });
  });

  describe('refetch behavior', () => {
    it('should refetch data on manual trigger', async () => {
      const params: UnitEconomicsQueryParams = {
        week: '2025-W50',
      };

      const { result } = renderHookWithClient(() => useUnitEconomics(params));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Trigger refetch
      await result.current.refetch();

      // Data should still be present after refetch
      expect(result.current.data).toBeDefined();
      // Verify it's still valid data
      expect(result.current.data?.meta.week).toBe('2025-W50');
    });
  });

  describe('parameter changes', () => {
    it('should refetch when week changes', async () => {
      const queryClient = createTestQueryClient();
      let week = '2025-W50';

      const { result, rerender } = renderHookWithClient(
        () => useUnitEconomics({ week }),
        { queryClient }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.meta.week).toBe('2025-W50');

      // Change week
      week = '2025-W49';
      rerender();

      await waitFor(() => {
        expect(result.current.data?.meta.week).toBe('2025-W49');
      });
    });
  });
});

describe('unitEconomicsKeys', () => {
  it('should have correct structure', () => {
    expect(unitEconomicsKeys.all).toEqual(['unit-economics']);

    const params: UnitEconomicsQueryParams = {
      week: '2025-W50',
      view_by: 'sku',
    };
    expect(unitEconomicsKeys.list(params)).toEqual([
      'unit-economics',
      'list',
      params,
    ]);
  });
});
