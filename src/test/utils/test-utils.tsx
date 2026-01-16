/**
 * Test utilities for React Query and component testing
 * Story 24.11-FE: Unit Tests for Storage Analytics
 * Epic 24: Paid Storage Analytics (Frontend)
 */

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

/**
 * Creates a fresh QueryClient for each test
 * Configured with retry: false for predictable test behavior
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

/**
 * Creates a wrapper component with QueryClientProvider
 * Used for renderHook tests
 */
export function createQueryWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient()
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

/**
 * All-in-one providers wrapper for component testing
 */
interface AllProvidersProps {
  children: React.ReactNode
}

function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

// Re-export testing-library utilities
export * from '@testing-library/react'
export { renderWithProviders as render }
