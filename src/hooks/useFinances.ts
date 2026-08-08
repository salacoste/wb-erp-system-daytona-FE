/**
 * NEW-7 — Finances React Query hooks.
 *
 * Rate-limit-aware (WB): balance 1/min, documents 1/10s. Each hook carries its
 * own staleTime so TanStack doesn't refetch faster than WB allows (which would
 * surface a 503). Multi-source (AC4): balance + documents are independent hooks;
 * one failing never blanks the other.
 *
 * `useDownloadDocument` is a mutation: base64 → Blob → browser download
 * (download-blob.ts), with isError/rate-limit surfacing. Mirrors the project
 * mutation pattern (mockRejectedValueOnce in tests).
 */

'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import {
  getAccountBalance,
  getDocumentCategories,
  getFinanceDocuments,
  downloadDocument,
} from '@/lib/api/finances'
import { downloadDocumentResult } from '@/lib/finances/download-blob'
import {
  financesQueryKeys,
  BALANCE_STALE_TIME,
  BALANCE_GC_TIME,
  DOCUMENTS_STALE_TIME,
  DOCUMENTS_GC_TIME,
  CATEGORIES_STALE_TIME,
} from './useFinances-utils'

// Re-export query keys for consumers/tests (mirrors useLiquidity re-export).
export { financesQueryKeys } from './useFinances-utils'
import type { FinanceDocumentsQuery, DocumentsLocale, DocumentExtension } from '@/types/finances'

/** Shared hook options (enabled flag for cabinet-readiness gating). */
export interface UseFinancesOptions {
  /** Disable the query when the cabinet isn't ready (no auth/cabinet selected). */
  enabled?: boolean
}

/** GET /v1/finances/balance — WB account balance (rate-limited 1/min). */
export function useAccountBalance(options: UseFinancesOptions = {}) {
  const { enabled = true } = options
  return useQuery({
    queryKey: financesQueryKeys.balance(),
    queryFn: getAccountBalance,
    enabled,
    // 60s staleTime mirrors the WB 1/min rate limit — refetching sooner 503s.
    staleTime: BALANCE_STALE_TIME,
    gcTime: BALANCE_GC_TIME,
    // retry:1 — WB rate-limit 429s shouldn't hammer the backend.
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/finances/documents — filtered + paginated document list (1/10s). */
export function useFinanceDocuments(
  query: FinanceDocumentsQuery = {},
  options: UseFinancesOptions = {}
) {
  const { enabled = true } = options
  return useQuery({
    queryKey: financesQueryKeys.documents(query),
    queryFn: () => getFinanceDocuments(query),
    enabled,
    // 10s staleTime mirrors the WB 1/10s rate limit.
    staleTime: DOCUMENTS_STALE_TIME,
    gcTime: DOCUMENTS_GC_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** GET /v1/finances/documents/categories — filter options (stable, 5min). */
export function useFinanceDocumentCategories(
  locale?: DocumentsLocale,
  options: UseFinancesOptions = {}
) {
  const { enabled = true } = options
  return useQuery({
    queryKey: financesQueryKeys.categories(locale),
    queryFn: () => getDocumentCategories(locale),
    enabled,
    staleTime: CATEGORIES_STALE_TIME,
    retry: 1,
    refetchOnWindowFocus: false,
  })
}

/** Arguments to the download mutation. */
export interface DownloadDocumentArgs {
  serviceName: string
  extension: DocumentExtension
  locale?: DocumentsLocale
}

/**
 * Download-mutation: fetches base64 from BE → decodes to Blob → triggers the
 * browser download. `isError`/`error` surface WB rate-limit (429→503) or empty
 * documents. `onSuccess` returns true/false (false = empty/malformed base64).
 */
export function useDownloadDocument() {
  return useMutation<boolean, Error, DownloadDocumentArgs>({
    mutationFn: async ({ serviceName, extension, locale }) => {
      const result = await downloadDocument(serviceName, extension, locale)
      const fallbackName = buildFallbackFileName(serviceName, extension)
      return downloadDocumentResult(result, extension, fallbackName)
    },
  })
}

/** Build a fallback filename when the BE omits `fileName`. */
function buildFallbackFileName(serviceName: string, extension: DocumentExtension): string {
  // serviceName may contain slashes (e.g. "wildberries-ru/documents/ПА") — take
  // the last segment for a cleaner filename.
  const tail = serviceName.split('/').filter(Boolean).pop() ?? serviceName
  return `${tail || 'document'}.${extension}`
}
