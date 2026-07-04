'use client'

/**
 * useProductDictionaries — S3 hook for brand/subject/tnved filter dropdowns.
 * Reference: docs/request-backend/223-product-dictionaries-backend-contract.md
 */
import { useQuery } from '@tanstack/react-query'
import {
  getProductDictionaries,
  productDictionariesQueryKeys,
} from '@/lib/api/product-dictionaries'
import type { ProductDictionaries } from '@/types/product-dictionaries'

/**
 * Fetch the cabinet's product dictionaries (brands / subjects / tnveds with counts).
 * Values change only as the catalog syncs → longer staleTime than product lists.
 */
export function useProductDictionaries(includeDiscontinued = false) {
  return useQuery<ProductDictionaries, Error>({
    queryKey: productDictionariesQueryKeys.list(includeDiscontinued),
    queryFn: () => getProductDictionaries(includeDiscontinued),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  })
}
