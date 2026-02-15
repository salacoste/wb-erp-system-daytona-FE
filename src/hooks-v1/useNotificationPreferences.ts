// ============================================================================
// Notification Preferences Hook
// Epic 34-FE: Story 34.1-FE
// Refactored: 2025-12-30 - Use query keys factory from useTelegramBinding
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '@/lib/api/notifications';
import type { UpdatePreferencesRequestDto } from '@/types/notifications';
import { telegramQueryKeys } from './useTelegramBinding';

/**
 * Hook for managing notification preferences
 *
 * Features:
 * - Fetch current preferences
 * - Update preferences (partial updates)
 * - Optimistic updates for better UX
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  // ============================================================================
  // Preferences Query
  // ============================================================================

  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: telegramQueryKeys.preferences(),
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ============================================================================
  // Update Preferences Mutation
  // ============================================================================

  const updatePreferences = useMutation({
    mutationFn: (updates: UpdatePreferencesRequestDto) =>
      updateNotificationPreferences(updates),

    // Optimistic update for instant UI feedback
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: telegramQueryKeys.preferences() });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData(telegramQueryKeys.preferences());

      // Optimistically update to new value
      queryClient.setQueryData(telegramQueryKeys.preferences(), (old: any) => ({
        ...old,
        ...newPreferences,
        preferences: {
          ...old?.preferences,
          ...newPreferences.preferences,
        },
        quiet_hours: {
          ...old?.quiet_hours,
          ...newPreferences.quiet_hours,
        },
      }));

      return { previousPreferences };
    },

    // On error, rollback
    onError: (err, newPreferences, context) => {
      queryClient.setQueryData(
        telegramQueryKeys.preferences(),
        context?.previousPreferences
      );
      console.error('Failed to update preferences:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: telegramQueryKeys.preferences() });
    },
  });

  return {
    // Data
    preferences,
    isLoading,
    error,

    // Actions
    updatePreferences: updatePreferences.mutate,
    updatePreferencesAsync: updatePreferences.mutateAsync,

    // Loading state
    isUpdating: updatePreferences.isPending,

    // Error
    updateError: updatePreferences.error,
  };
}
