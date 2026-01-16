/**
 * Test Utilities
 *
 * Provides wrappers and utilities for testing React components and hooks.
 * Includes QueryClientProvider setup for TanStack Query hooks.
 */

import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Creates a fresh QueryClient for each test
 * Configured with test-appropriate settings
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster feedback
        retry: false,
        // Disable automatic refetching
        refetchOnWindowFocus: false,
        // Disable garbage collection during tests
        gcTime: Infinity,
        // Consider data stale immediately (tests control refetch)
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Props for QueryWrapper
 */
interface QueryWrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

/**
 * Wrapper component that provides QueryClient context
 */
export function QueryWrapper({
  children,
  queryClient,
}: QueryWrapperProps): React.ReactElement {
  const client = queryClient ?? createTestQueryClient();
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

/**
 * Creates a wrapper function for renderHook with QueryClient
 */
export function createQueryWrapper(
  queryClient?: QueryClient
): React.FC<{ children: ReactNode }> {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

/**
 * Renders a hook with QueryClient context
 *
 * @example
 * ```ts
 * const { result } = renderHookWithClient(() => useMyHook());
 * ```
 */
export function renderHookWithClient<TResult, TProps>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & {
    queryClient?: QueryClient;
  }
) {
  const { queryClient, ...renderOptions } = options ?? {};
  return renderHook(hook, {
    wrapper: createQueryWrapper(queryClient),
    ...renderOptions,
  });
}

/**
 * Mock auth state for tests
 * Sets up the Zustand auth store with test values
 */
export function setupMockAuth(overrides?: {
  token?: string;
  cabinetId?: string;
  isAuthenticated?: boolean;
}): void {
  useAuthStore.setState({
    token: overrides?.token ?? 'test-jwt-token',
    cabinetId: overrides?.cabinetId ?? 'test-cabinet-id',
    isAuthenticated: overrides?.isAuthenticated ?? true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'Owner',  // Valid roles: Owner, Manager, Analyst, Service
      cabinet_ids: [overrides?.cabinetId ?? 'test-cabinet-id'],
    },
  });
}

/**
 * Clear mock auth state
 */
export function clearMockAuth(): void {
  useAuthStore.setState({
    token: null,
    cabinetId: null,
    isAuthenticated: false,
    user: null,
  });
}
