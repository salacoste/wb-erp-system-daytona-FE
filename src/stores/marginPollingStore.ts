/**
 * Store for tracking margin calculation polling status
 * Story 4.8: Margin Recalculation Polling & Real-time Updates
 * Request #14 Frontend Integration
 */

import { create } from 'zustand'

interface MarginPollingState {
  /** Set of product IDs currently being polled */
  pollingProducts: Set<string>
  /** Add product to polling set */
  addPollingProduct: (nmId: string) => void
  /** Remove product from polling set */
  removePollingProduct: (nmId: string) => void
  /** Check if product is being polled */
  isPolling: (nmId: string) => boolean
  /** Clear all polling products */
  clearPolling: () => void
}

/**
 * Zustand store for tracking which products are currently being polled
 * Used by ProductList to show "Расчёт..." badge for products in polling
 */
export const useMarginPollingStore = create<MarginPollingState>((set, get) => ({
  pollingProducts: new Set<string>(),

  addPollingProduct: (nmId: string) => {
    set((state) => {
      const newSet = new Set(state.pollingProducts)
      newSet.add(nmId)
      console.log(`🔍 [Polling Store] Adding product ${nmId} to polling:`, {
        pollingProducts: Array.from(newSet),
      })
      return { pollingProducts: newSet }
    })
  },

  removePollingProduct: (nmId: string) => {
    set((state) => {
      const newSet = new Set(state.pollingProducts)
      const wasRemoved = newSet.delete(nmId)
      console.log(`🔍 [Polling Store] Removing product ${nmId} from polling:`, {
        wasRemoved,
        remainingProducts: Array.from(newSet),
      })
      return { pollingProducts: newSet }
    })
  },

  isPolling: (nmId: string) => {
    return get().pollingProducts.has(nmId)
  },

  clearPolling: () => {
    set({ pollingProducts: new Set() })
  },
}))

