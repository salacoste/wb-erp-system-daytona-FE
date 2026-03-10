// ============================================================================
// Telegram Metrics - Shared Helpers
// Epic 34-FE: Monitoring & Analytics
// Extracted from telegram-metrics.ts - getUserContext helper
// ============================================================================

import { useAuthStore } from '@/stores/authStore'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current user context for all events
 * Safely accesses Zustand store (SSR-safe)
 */
export function getUserContext() {
  // SSR-safe check
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const { cabinetId } = useAuthStore.getState()
    return {
      cabinet_id: cabinetId || undefined,
    }
  } catch {
    // Fallback if store not initialized
    return {}
  }
}
