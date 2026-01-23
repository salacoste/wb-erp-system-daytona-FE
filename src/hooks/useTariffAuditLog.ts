// ============================================================================
// Tariff Audit Log Hook
// Epic 52-FE: Story 52-FE.4 - Audit Log Viewer
// Fetches audit trail with pagination and filtering
// ============================================================================

import { useQuery } from '@tanstack/react-query'
import { getTariffAuditLog } from '@/lib/api/tariffs-admin'
import { tariffQueryKeys } from '@/hooks/tariff-query-keys'
import type { TariffAuditParams, TariffAuditResponse } from '@/types/tariffs-admin'

/**
 * Hook to fetch tariff audit log with pagination and filtering
 *
 * @param params - Query parameters: page, limit, field_name
 * @returns Query result with paginated audit entries
 *
 * @example
 * ```tsx
 * const [page, setPage] = useState(1)
 * const [fieldFilter, setFieldFilter] = useState<string | undefined>()
 *
 * const { data, isLoading, isError, error, refetch } = useTariffAuditLog({
 *   page,
 *   limit: 50,
 *   field_name: fieldFilter,
 * })
 *
 * if (isLoading) return <Loading />
 * if (isError) return <Error message={error.message} onRetry={refetch} />
 *
 * return (
 *   <>
 *     <AuditTable entries={data.data} />
 *     <Pagination
 *       page={data.meta.page}
 *       totalPages={data.meta.total_pages}
 *       onPageChange={setPage}
 *     />
 *   </>
 * )
 * ```
 */
export function useTariffAuditLog(params: TariffAuditParams = {}) {
  return useQuery<TariffAuditResponse, Error>({
    queryKey: tariffQueryKeys.auditLog(params),
    queryFn: () => getTariffAuditLog(params),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  })
}
