'use client'

/**
 * TanStack Query hooks for Price Elasticity
 * GET /v1/products/price-elasticity (batch)
 * GET /v1/products/price-elasticity/{nmId} (single SKU)
 */

import { useQuery } from '@tanstack/react-query'
import {
  getPriceElasticityBatch,
  getPriceElasticitySku,
  priceElasticityQueryKeys,
} from '@/lib/api/price-elasticity'
import type { PriceElasticityBatchParams } from '@/types/price-elasticity'

/** Batch price elasticity for all SKUs (5min staleTime — backend caches) */
export function usePriceElasticityBatch(params: PriceElasticityBatchParams = {}) {
  return useQuery({
    queryKey: priceElasticityQueryKeys.batch(params),
    queryFn: () => getPriceElasticityBatch(params),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}

/** Single-SKU price elasticity (5min staleTime — backend caches) */
export function usePriceElasticitySku(nmId: number | null) {
  return useQuery({
    queryKey: priceElasticityQueryKeys.sku(nmId!),
    queryFn: () => getPriceElasticitySku(nmId!),
    enabled: nmId != null,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
  })
}
