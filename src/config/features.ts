/**
 * Feature Flags Configuration
 *
 * Manages feature toggles for progressive rollout and A/B testing.
 *
 * 🎯 USAGE:
 * ```typescript
 * import { features } from '@/config/features'
 *
 * if (features.epic37MergedGroups.enabled) {
 *   // Render Epic 37 UI
 * }
 *
 * if (features.epic37MergedGroups.useRealApi) {
 *   // Call real backend API
 * } else {
 *   // Use mock data
 * }
 * ```
 *
 * 🔧 ENVIRONMENT VARIABLES:
 * - NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED (default: true)
 * - NEXT_PUBLIC_EPIC_37_USE_REAL_API (default: false)
 *
 * Set in .env.local or .env.production:
 * ```bash
 * # Enable Epic 37 feature
 * NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED=true
 *
 * # Use mock data during development (default)
 * NEXT_PUBLIC_EPIC_37_USE_REAL_API=false
 *
 * # Switch to real API after Story 37.0 complete
 * NEXT_PUBLIC_EPIC_37_USE_REAL_API=true
 * ```
 */

// ============================================================================
// Epic 37: Merged Group Table Display (Склейки)
// ============================================================================

/**
 * Epic 37 Feature Flag Configuration
 */
export interface Epic37FeatureConfig {
  enabled: boolean
  useRealApi: boolean
  debug: boolean
}

export const epic37MergedGroups: Epic37FeatureConfig = {
  enabled: process.env.NEXT_PUBLIC_EPIC_37_MERGED_GROUPS_ENABLED === 'true' || true,
  useRealApi: process.env.NEXT_PUBLIC_EPIC_37_USE_REAL_API === 'true' || true,
  debug: process.env.NODE_ENV === 'development',
}

// ============================================================================
// Jam URLs Configuration
// ============================================================================

/**
 * Jam subscription URLs configuration
 *
 * Used by RequireJam component for subscription upgrade CTAs.
 */
export interface JamUrlsConfig {
  /** Main Jam subscription page */
  subscription: string
  /** Jam info/landing page */
  info: string
}

export const jamUrls: JamUrlsConfig = {
  subscription:
    process.env.NEXT_PUBLIC_JAM_SUBSCRIPTION_URL || 'https://seller.wildberries.ru/jam',
  info: process.env.NEXT_PUBLIC_JAM_INFO_URL || 'https://seller.wildberries.ru/jam',
}

// ============================================================================
// All Feature Flags
// ============================================================================

/**
 * Global feature flags registry
 */
export const features = {
  epic37MergedGroups,
  jamUrls,
}

// ============================================================================
// Type Exports
// ============================================================================

export type Features = typeof features
export type FeatureKey = keyof Features
