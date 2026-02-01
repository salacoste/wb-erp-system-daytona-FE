/**
 * Query Mock Utilities for TanStack Query v5 Tests
 *
 * Helper functions to create complete UseQueryResult mock objects
 * with all required properties for type-safe testing.
 *
 * @see https://tanstack.com/query/latest/docs/react/reference/useQuery
 */

import type { UseQueryResult, QueryObserverResult } from '@tanstack/react-query'
import { vi } from 'vitest'

/**
 * Creates a complete UseQueryResult mock with all TanStack Query v5 properties.
 *
 * @param data - The data to return (use undefined for loading/error states)
 * @param overrides - Partial overrides for specific properties
 * @returns Complete UseQueryResult mock object
 *
 * @example
 * // Success state with data
 * vi.mocked(useMyHook).mockReturnValue(
 *   createMockQueryResult({ items: [] })
 * )
 *
 * @example
 * // Loading state
 * vi.mocked(useMyHook).mockReturnValue(
 *   createMockQueryResult(undefined, { isLoading: true, isPending: true, status: 'pending' })
 * )
 *
 * @example
 * // Error state
 * vi.mocked(useMyHook).mockReturnValue(
 *   createMockQueryResult(undefined, {
 *     isError: true,
 *     error: new Error('Failed to fetch'),
 *     status: 'error'
 *   })
 * )
 */
export function createMockQueryResult<T>(
  data: T,
  overrides?: Partial<UseQueryResult<T, Error>>
): UseQueryResult<T, Error> {
  const isSuccess = data !== undefined && !overrides?.isError && !overrides?.isLoading
  const isLoading = overrides?.isLoading ?? false
  const isError = overrides?.isError ?? false
  const error = overrides?.error ?? null

  // Determine status based on state
  let status: 'pending' | 'error' | 'success' = 'success'
  if (isLoading || overrides?.isPending) {
    status = 'pending'
  } else if (isError) {
    status = 'error'
  }

  return {
    data: data as T,
    dataUpdatedAt: isSuccess ? Date.now() : 0,
    error,
    errorUpdatedAt: isError ? Date.now() : 0,
    errorUpdateCount: isError ? 1 : 0,
    failureCount: isError ? 1 : 0,
    failureReason: error,
    fetchStatus: isLoading ? 'fetching' : 'idle',
    isError,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isFetching: isLoading,
    isInitialLoading: false,
    isLoading,
    isLoadingError: false,
    isPaused: false,
    isPending: isLoading || overrides?.isPending || false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess,
    promise: Promise.resolve(data),
    refetch: vi.fn().mockResolvedValue({
      data,
      isSuccess: true,
    } as QueryObserverResult<T, Error>),
    status,
    ...overrides,
  } as UseQueryResult<T, Error>
}

/**
 * Creates a loading state UseQueryResult mock.
 * Convenience wrapper for loading states.
 *
 * @example
 * vi.mocked(useMyHook).mockReturnValue(createLoadingQueryResult<MyType>())
 */
export function createLoadingQueryResult<T>(): UseQueryResult<T, Error> {
  return createMockQueryResult<T>(undefined as T, {
    isLoading: true,
    isPending: true,
    status: 'pending',
    fetchStatus: 'fetching',
    isFetched: false,
    isFetchedAfterMount: false,
    isSuccess: false,
  })
}

/**
 * Creates an error state UseQueryResult mock.
 * Convenience wrapper for error states.
 *
 * @param error - The error object (defaults to generic error, use null to test null error handling)
 * @param overrides - Additional overrides (e.g., custom refetch mock)
 *
 * @example
 * vi.mocked(useMyHook).mockReturnValue(
 *   createErrorQueryResult<MyType>(new Error('Network error'))
 * )
 *
 * @example
 * // Test null error handling
 * vi.mocked(useMyHook).mockReturnValue(
 *   createErrorQueryResult<MyType>(null)
 * )
 *
 * @example
 * // With custom refetch mock
 * const mockRefetch = vi.fn()
 * vi.mocked(useMyHook).mockReturnValue(
 *   createErrorQueryResult<MyType>(new Error('Error'), { refetch: mockRefetch })
 * )
 */
export function createErrorQueryResult<T>(
  error: Error | null = new Error('An error occurred'),
  overrides?: Pick<Partial<UseQueryResult<T, Error>>, 'refetch'>
): UseQueryResult<T, Error> {
  return createMockQueryResult<T>(undefined as T, {
    isError: true,
    error: error ?? undefined,
    status: 'error',
    isSuccess: false,
    isFetched: true,
    isFetchedAfterMount: true,
    refetch: overrides?.refetch,
  })
}

/**
 * Creates a successful UseQueryResult mock with data.
 * Convenience wrapper for success states.
 *
 * @param data - The data to return
 *
 * @example
 * vi.mocked(useMyHook).mockReturnValue(
 *   createSuccessQueryResult({ items: mockItems })
 * )
 */
export function createSuccessQueryResult<T>(data: T): UseQueryResult<T, Error> {
  return createMockQueryResult(data)
}
