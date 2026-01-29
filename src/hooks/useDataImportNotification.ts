/**
 * Data Import Notification Hook - REFACTORED
 * Story 60.5-FE: Remove Data Duplication
 * Epic 60-FE: Dashboard & Analytics UX Improvements
 *
 * CHANGED: Uses toast (sonner) instead of inline Alert state.
 * Tracks new data imports and shows success toast notification.
 *
 * @see docs/stories/epic-60/story-60.5-fe-remove-data-duplication.md
 */

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import type { Task } from '@/types/api'
import {
  getLastImportTimestamp,
  saveLastImportTimestamp,
  getDismissedTimestamp,
  saveDismissedTimestamp,
} from '@/lib/notification-storage'

/**
 * Custom hook for managing data import notification via toast
 * Shows success toast when new data is imported
 */
export function useDataImportNotification(
  hasData: boolean,
  isLoading: boolean
): {
  markNewImport: () => void
} {
  // Track if toast has been shown in this session to avoid duplicates
  const hasShownToastRef = useRef(false)

  // Check for new import by looking at latest products_sync task
  useEffect(() => {
    if (!hasData || isLoading || hasShownToastRef.current) return

    const checkForNewImport = async (): Promise<void> => {
      try {
        const { cabinetId } = useAuthStore.getState()
        if (!cabinetId) return

        // Get all tasks (backend doesn't support filtering by type)
        const response = await apiClient.get<{
          items: Task[]
          next_cursor?: string
        }>('/v1/tasks?limit=50')

        // Filter for completed products_sync tasks
        const completedProductsSyncTasks = (response.items || [])
          .filter(task => task.type === 'products_sync' && task.status === 'completed')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

        const latestTask = completedProductsSyncTasks[0]
        if (!latestTask) return

        // Parse updated_at timestamp
        const taskTimestamp = new Date(latestTask.updated_at).getTime()
        const lastImport = getLastImportTimestamp()
        const dismissedAt = getDismissedTimestamp()

        // If we have a new completed task (newer than last known import)
        if (!lastImport || taskTimestamp > lastImport) {
          saveLastImportTimestamp(taskTimestamp)

          // Show toast if: user hasn't dismissed yet OR new import is after dismissal
          if (!dismissedAt || taskTimestamp > dismissedAt) {
            showSuccessToast()
          }
        }
      } catch (error) {
        // Silently fail - don't break the component if task check fails
        console.warn('Failed to check for new import:', error)
      }
    }

    // Only check if we have data and not loading
    const timeoutId = setTimeout(checkForNewImport, 1000)
    return () => clearTimeout(timeoutId)
  }, [hasData, isLoading])

  // Determine if toast should be shown on initial load
  useEffect(() => {
    if (!hasData || isLoading || hasShownToastRef.current) return

    const dismissedAt = getDismissedTimestamp()
    const lastImport = getLastImportTimestamp()

    // First time seeing data - save timestamp and show toast
    if (!dismissedAt) {
      if (!lastImport) {
        saveLastImportTimestamp(Date.now())
      }
      showSuccessToast()
      return
    }

    // Check if there's a newer import after dismissal
    if (lastImport && lastImport > dismissedAt) {
      showSuccessToast()
    }
  }, [hasData, isLoading])

  /**
   * Show success toast notification
   */
  const showSuccessToast = (): void => {
    if (hasShownToastRef.current) return
    hasShownToastRef.current = true

    toast.success('Данные успешно загружены!', {
      description: 'Вы можете начать работу с системой.',
      duration: 5000,
      onDismiss: () => {
        saveDismissedTimestamp(Date.now())
      },
    })
  }

  /**
   * Manually trigger new import notification
   * Call after successful products import/sync
   */
  const markNewImport = (): void => {
    const currentTime = Date.now()
    saveLastImportTimestamp(currentTime)
    hasShownToastRef.current = false // Reset to allow new toast
    showSuccessToast()
  }

  // Expose markNewImport globally for external use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { markDataImport?: () => void }).markDataImport = markNewImport
    }
  }, [])

  return {
    markNewImport,
  }
}
