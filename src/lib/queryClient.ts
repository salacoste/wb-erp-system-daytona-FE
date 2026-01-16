import { QueryClient } from '@tanstack/react-query'

/**
 * QueryClient configuration for TanStack Query
 * Used for server state management and API data fetching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache time: 5 minutes
      gcTime: 1000 * 60 * 5,
      // Stale time: 1 minute (data considered fresh)
      staleTime: 1000 * 60,
      // Retry failed requests
      retry: 1,
      // Refetch on window focus (for real-time feel)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
    },
  },
})

