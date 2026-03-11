// ============================================================================
// Tariff Settings Query Keys
// Epic 52-FE: Story 52-FE.7 - Page Layout, Types & Integration
// Follows TanStack Query v5 patterns with factory functions
// ============================================================================

import type { TariffAuditParams } from '@/types/tariffs-admin'

/**
 * Query keys for tariff settings.
 * Follows TanStack Query v5 patterns with factory functions.
 *
 * Key hierarchy:
 * - ['tariffs'] - Base key for all tariff queries
 * - ['tariffs', 'settings'] - Current tariff settings
 * - ['tariffs', 'history'] - Version history
 * - ['tariffs', 'audit', params] - Audit log with filters
 *
 * @see https://tanstack.com/query/latest/docs/react/guides/query-keys
 */
export const tariffQueryKeys = {
  /** Base key for all tariff queries */
  all: ['tariffs'] as const,

  /** Key for current tariff settings queries */
  settings: () => [...tariffQueryKeys.all, 'settings'] as const,

  /** Key for version history queries */
  versionHistory: () => [...tariffQueryKeys.all, 'history'] as const,

  /** Key for audit log queries with optional filters */
  auditLog: (params?: TariffAuditParams) =>
    [...tariffQueryKeys.all, 'audit', params] as const,
}
