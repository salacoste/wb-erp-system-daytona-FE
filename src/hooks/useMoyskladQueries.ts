'use client'

/**
 * МойСклад read-only query hooks (health + mappings) + link mutation.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 *
 * Sync polling (useMoyskladSync) lives in ./useMoyskladSync.ts for the 200-line cap.
 * Anti-pattern #8: money/nmId/matchedBy null is preserved by the normalizer.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMoyskladHealth,
  getMoyskladMappings,
  getMoyskladOrganizations,
  linkMapping,
  type MoyskladMappingsParams,
} from '@/lib/api/moysklad'
import { getMoyskladStockDb, type MoyskladStockDbParams } from '@/lib/api/moysklad-stock'

/** Centralized МойСклад query keys (scope `['moysklad', ...]`). */
export const moyskladQueryKeys = {
  all: ['moysklad'] as const,
  health: ['moysklad', 'health'] as const,
  organizations: ['moysklad', 'organizations'] as const,
  mappings: (params: MoyskladMappingsParams) => ['moysklad', 'mappings', params] as const,
  stockDb: (params: MoyskladStockDbParams) => ['moysklad', 'stock-db', params] as const,
}

const HEALTH_STALE_TIME = 60_000

/** GET /v1/moysklad/health — config check (no live МС call); always enabled. */
export function useMoyskladHealth() {
  return useQuery({
    queryKey: moyskladQueryKeys.health,
    queryFn: getMoyskladHealth,
    staleTime: HEALTH_STALE_TIME,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}

/** GET /v1/moysklad/organizations — юрлица (lazy; enabled only when needed). */
export function useMoyskladOrganizations(enabled = true) {
  return useQuery({
    queryKey: moyskladQueryKeys.organizations,
    queryFn: getMoyskladOrganizations,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

/**
 * GET /v1/moysklad/mappings with the matched filter.
 * `matched=true` → matched only; `false` → pending; omitted → all.
 */
export function useMoyskladMappings(params: MoyskladMappingsParams = {}) {
  return useQuery({
    queryKey: moyskladQueryKeys.mappings(params),
    queryFn: () => getMoyskladMappings(params),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
  })
}

/**
 * GET /v1/moysklad/stock-db — cached МС stock snapshots (OUR DB, read-only).
 * `date` omitted → latest snapshot date. Invalid `date` → 400 surfaced as error.
 * retry disabled so an invalid-date 400 shows immediately (not retried).
 */
export function useMoyskladStockDb(params: MoyskladStockDbParams = {}) {
  return useQuery({
    queryKey: moyskladQueryKeys.stockDb(params),
    queryFn: () => getMoyskladStockDb(params),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 0,
  })
}

/** POST /v1/moysklad/mappings/:id/link — manual link; invalidates mappings on success. */
export function useLinkMapping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, nmId }: { id: string; nmId: number }) => linkMapping(id, nmId),
    onSuccess: () => {
      // Invalidate ALL mapping views (matched/pending/all split counts change after a link).
      queryClient.invalidateQueries({ queryKey: ['moysklad', 'mappings'] })
    },
  })
}
