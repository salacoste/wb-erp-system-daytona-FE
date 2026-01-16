import { useState, useEffect } from 'react'
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
 * Custom hook for managing data import notification state
 * Tracks new data imports and manages notification visibility
 */
export function useDataImportNotification(hasData: boolean, isLoading: boolean) {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false)

  // Check for new import by looking at latest products_sync task
  useEffect(() => {
    if (!hasData || isLoading) return

    const checkForNewImport = async () => {
      try {
        const { cabinetId } = useAuthStore.getState()
        if (!cabinetId) return

        // Get all tasks (backend doesn't support filtering by type)
        // Filter client-side for products_sync tasks with completed status
        const response = await apiClient.get<{
          items: Task[]
          next_cursor?: string
        }>('/v1/tasks?limit=50')

        // Filter for completed products_sync tasks
        const completedProductsSyncTasks = (response.items || [])
          .filter(
            (task) =>
              task.type === 'products_sync' && task.status === 'completed',
          )
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime(),
          )

        const latestTask = completedProductsSyncTasks[0]
        if (!latestTask) return

        // Parse updated_at timestamp
        const taskTimestamp = new Date(latestTask.updated_at).getTime()
        const lastImport = getLastImportTimestamp()
        const dismissedAt = getDismissedTimestamp()

        // If we have a new completed task (newer than last known import)
        if (!lastImport || taskTimestamp > lastImport) {
          saveLastImportTimestamp(taskTimestamp)

          // Show notification if:
          // 1. User hasn't dismissed yet, OR
          // 2. New import is after dismissal
          if (!dismissedAt || taskTimestamp > dismissedAt) {
            setIsNotificationVisible(true)
          }
        }
      } catch (error) {
        // Silently fail - don't break the component if task check fails
        console.warn('Failed to check for new import:', error)
      }
    }

    // Only check if we have data and not loading
    // Debounce to avoid too many API calls
    const timeoutId = setTimeout(checkForNewImport, 1000)
    return () => clearTimeout(timeoutId)
  }, [hasData, isLoading])

  // Determine if notification should be shown on initial load
  useEffect(() => {
    if (!hasData || isLoading) {
      setIsNotificationVisible(false)
      return
    }

    const dismissedAt = getDismissedTimestamp()
    const lastImport = getLastImportTimestamp()

    // If user hasn't dismissed yet, show notification
    if (!dismissedAt) {
      // If we don't have a last import timestamp, set it to now (first time seeing data)
      if (!lastImport) {
        saveLastImportTimestamp(Date.now())
      }
      setIsNotificationVisible(true)
      return
    }

    // If we have a dismissed timestamp, check if there's a newer import
    if (lastImport && lastImport > dismissedAt) {
      setIsNotificationVisible(true)
      return
    }

    // Otherwise, hide notification (user dismissed and no new import detected yet)
    setIsNotificationVisible(false)
  }, [hasData, isLoading])

  const handleDismissNotification = () => {
    saveDismissedTimestamp(Date.now())
    setIsNotificationVisible(false)
  }

  // Function to manually trigger new import detection
  // This should be called after a successful products import/sync
  // Can be called from:
  // - Processing status page when products_sync completes
  // - Settings page after triggering manual sync
  // - Any component that detects new data import
  const markNewImport = () => {
    const currentTime = Date.now()
    saveLastImportTimestamp(currentTime)
    // Don't clear dismissed timestamp - let the comparison logic handle it
    // This way notification will show if new import is after dismissal
    setIsNotificationVisible(true)
  }

  // Expose markNewImport globally for external use
  // This allows other components to notify about new imports
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as { markDataImport?: () => void }).markDataImport =
        markNewImport
    }
  }, [])

  return {
    isNotificationVisible,
    handleDismissNotification,
    markNewImport,
  }
}

