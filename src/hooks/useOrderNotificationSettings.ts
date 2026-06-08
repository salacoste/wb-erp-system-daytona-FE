// ============================================================================
// FBS Order Notification Settings Hook
// Epic 132-FE: Story 132.2 — TanStack Query hooks
// Backend: GET/POST /v1/notifications/orders/settings
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOrderNotificationSettings,
  updateOrderNotificationSettings,
} from '@/lib/api/notifications'
import type { UpdateOrderNotificationSettingsDto } from '@/types/notifications'
import { logger } from '@/lib/logger'

/** Query keys for FBS order notification settings */
export const orderNotifQueryKeys = {
  all: ['orderNotificationSettings'] as const,
  settings: () => [...orderNotifQueryKeys.all, 'settings'] as const,
}

/**
 * Hook for reading FBS order notification settings
 * staleTime 60s — settings change rarely but users expect fresh data
 */
export function useOrderNotificationSettings() {
  const queryClient = useQueryClient()

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: orderNotifQueryKeys.settings(),
    queryFn: getOrderNotificationSettings,
    staleTime: 60 * 1000,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: UpdateOrderNotificationSettingsDto) =>
      updateOrderNotificationSettings(updates),

    onMutate: async newSettings => {
      await queryClient.cancelQueries({ queryKey: orderNotifQueryKeys.settings() })
      const previous = queryClient.getQueryData(orderNotifQueryKeys.settings())
      queryClient.setQueryData(orderNotifQueryKeys.settings(), (old: unknown) => ({
        ...(old && typeof old === 'object' ? old : {}),
        ...newSettings,
      }))
      return { previous }
    },

    onError: (err, _vars, context) => {
      queryClient.setQueryData(orderNotifQueryKeys.settings(), context?.previous)
      logger.error('Failed to update order notification settings:', err)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orderNotifQueryKeys.settings() })
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateMutation.mutate,
    updateSettingsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  }
}
