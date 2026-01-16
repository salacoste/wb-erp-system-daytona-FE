// ============================================================================
// Telegram Binding Hook
// Epic 34-FE: Story 34.1-FE
// Refactored: 2025-12-30 - Added query keys factory pattern
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  startTelegramBinding,
  getBindingStatus,
  unbindTelegram,
} from '@/lib/api/notifications';

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Query keys for Telegram binding.
 * Follows TanStack Query v5 patterns with factory functions.
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/query-keys
 */
export const telegramQueryKeys = {
  /** Base key for all telegram queries */
  all: ['telegram'] as const,

  /** Key for binding status queries */
  status: () => [...telegramQueryKeys.all, 'status'] as const,

  /** Key for notification preferences queries */
  preferences: () => [...telegramQueryKeys.all, 'preferences'] as const,
};

// ============================================================================
// Hook: useTelegramBinding
// ============================================================================

/**
 * Hook for managing Telegram binding flow
 *
 * Features:
 * - Start binding (generate code)
 * - Poll binding status (3s interval)
 * - Unbind Telegram
 * - Auto-stop polling when bound
 */
export function useTelegramBinding() {
  const queryClient = useQueryClient();

  // ============================================================================
  // Binding Status Query (with polling)
  // ============================================================================

  const {
    data: status,
    isLoading: isCheckingStatus,
    refetch: checkStatus,
  } = useQuery({
    queryKey: telegramQueryKeys.status(),
    queryFn: getBindingStatus,
    refetchInterval: (query) => {
      // Stop polling when bound or no binding in progress
      // React Query v5: query.state.data contains the data
      return query.state.data?.bound ? false : 3000; // 3 seconds
    },
    refetchIntervalInBackground: true,
    staleTime: 0, // Always fresh data during polling
  });

  // ============================================================================
  // Start Binding Mutation
  // ============================================================================

  const startBinding = useMutation({
    mutationFn: startTelegramBinding,
    onSuccess: () => {
      // Start polling by refetching status
      checkStatus();
    },
    onError: (error) => {
      console.error('Failed to start binding:', error);
    },
  });

  // ============================================================================
  // Unbind Mutation
  // ============================================================================

  const unbind = useMutation({
    mutationFn: unbindTelegram,
    onSuccess: () => {
      // Invalidate all notification-related queries
      queryClient.invalidateQueries({ queryKey: telegramQueryKeys.status() });
      queryClient.invalidateQueries({ queryKey: telegramQueryKeys.preferences() });
    },
    onError: (error) => {
      console.error('Failed to unbind Telegram:', error);
    },
  });

  return {
    // Status
    status,
    isCheckingStatus,
    isBound: status?.bound || false,

    // Actions
    startBinding: startBinding.mutate,
    unbind: unbind.mutate,
    checkStatus,

    // Loading states
    isStartingBinding: startBinding.isPending,
    isUnbinding: unbind.isPending,

    // Errors
    bindingError: startBinding.error,
    unbindError: unbind.error,
  };
}
