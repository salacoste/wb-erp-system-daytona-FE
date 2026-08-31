/**
 * Cabinet Tax Settings Hooks
 * Story 66.2-FE: Tax Settings Hooks
 * Epic 66-FE: Tax & Accounting Frontend
 *
 * Query and mutation hooks for cabinet tax/VAT configuration.
 * @see docs/epics/epic-66-fe-tax-accounting.md
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCabinetTaxSettings, updateCabinetTaxSettings } from '@/lib/api/cabinet'
import type { UpdateCabinetTaxRequest } from '@/types/cabinet'

/**
 * Query key factory for cabinet tax settings.
 * - `.all` invalidates every cabinet-tax query
 * - `.byId(id)` targets a specific cabinet
 */
export const cabinetTaxKeys = {
  all: ['cabinet-tax'] as const,
  byId: (cabinetId: string) => ['cabinet-tax', cabinetId] as const,
}

/**
 * Fetch cabinet tax & VAT settings.
 *
 * @param cabinetId - Cabinet UUID (disabled when empty string)
 * @returns React Query result with Cabinet data
 *
 * @example
 * const { data, isLoading } = useCabinetTaxSettings(activeCabinetId)
 * console.log(data?.taxSystem, data?.vatPayer)
 */
export function useCabinetTaxSettings(cabinetId: string) {
  return useQuery({
    queryKey: cabinetTaxKeys.byId(cabinetId),
    queryFn: () => getCabinetTaxSettings(cabinetId),
    enabled: !!cabinetId,
    staleTime: 60_000,
  })
}

/**
 * Mutation hook for updating cabinet tax & VAT settings.
 *
 * On success invalidates both `cabinet-tax` and `financial`
 * query families so dashboards reflect the new tax config.
 *
 * @param cabinetId - Cabinet UUID to update
 *
 * @example
 * const mutation = useUpdateTaxSettings(cabinetId)
 * mutation.mutate({ taxSystem: 'usn15', vatPayer: true, vatRate: 20 })
 */
export function useUpdateTaxSettings(cabinetId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    retry: false,
    mutationFn: (data: UpdateCabinetTaxRequest) => updateCabinetTaxSettings(cabinetId, data),

    onSuccess: updatedCabinet => {
      queryClient.setQueryData(cabinetTaxKeys.byId(cabinetId), updatedCabinet)
      // Invalidate cabinet tax cache so the form refreshes
      queryClient.invalidateQueries({ queryKey: cabinetTaxKeys.all })
      // Invalidate financial queries so dashboards pick up new tax rates
      queryClient.invalidateQueries({ queryKey: ['financial'] })
    },
  })
}
