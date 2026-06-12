/**
 * Advertising Analytics Data Transformers - Epic 37 Story 37.1
 *
 * Transforms backend API responses to frontend-compatible types.
 * Request #88: Supports new nested structure for merged groups.
 *
 * @see docs/request-backend/88-epic-37-individual-product-metrics.md
 * @see frontend/docs/stories/epic-37/STORY-37.1-INTEGRATION-PLAN.md
 */

import type { AdvertisingGroup, MergedGroupProduct } from '@/types/advertising-analytics'
import { logger } from '@/lib/logger'

function toNumber(raw: unknown, fallback = 0): number {
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback
}

function toNullableNumber(raw: unknown): number | null {
  if (raw == null) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function toFiniteNumberOrNull(raw: unknown): number | null {
  if (raw == null) return null
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

function flatMetrics(item: Record<string, unknown>) {
  return {
    totalViews: toNumber(item.views),
    totalClicks: toNumber(item.clicks),
    totalOrders: toNumber(item.orders),
    totalSpend: toNumber(item.spend),
    totalRevenue: toNumber(item.revenue),
    totalSales: toNumber(item.total_sales ?? item.totalSales),
    organicSales: toNumber(item.organic_sales ?? item.organicSales),
    organicContribution: toNumber(item.organic_contribution ?? item.organicContribution),
    roas: toNullableNumber(item.roas),
    roi: toNullableNumber(item.roi),
    ctr: toNumber(item.ctr),
    cpc: toNullableNumber(item.cpc),
    conversionRate: toNumber(item.conversion_rate ?? item.conversionRate),
    profitAfterAds: toNumber(item.profit_after_ads ?? item.profitAfterAds),
  }
}

function normalizeFlatProduct(
  raw: Record<string, unknown>,
  imtId: number | null,
  isMainProduct: boolean,
  fallbackMetrics: ReturnType<typeof flatMetrics>
): MergedGroupProduct {
  return {
    nmId: Number(raw.nmId ?? raw.sku_id ?? 0),
    vendorCode: String(
      raw.vendorCode ?? raw.product_name ?? raw.label ?? raw.nmId ?? raw.sku_id ?? ''
    ),
    imtId: raw.imtId != null ? Number(raw.imtId) : imtId,
    isMainProduct,
    totalViews: toNumber(raw.totalViews, fallbackMetrics.totalViews),
    totalClicks: toNumber(raw.totalClicks, fallbackMetrics.totalClicks),
    totalOrders: toNumber(raw.totalOrders ?? raw.orders, fallbackMetrics.totalOrders),
    totalSpend: toNumber(raw.totalSpend ?? raw.spend, fallbackMetrics.totalSpend),
    totalRevenue: toNumber(raw.totalRevenue ?? raw.revenue, fallbackMetrics.totalRevenue),
    totalSales: toNumber(raw.totalSales ?? raw.total_sales, fallbackMetrics.totalSales),
    organicSales: toNumber(raw.organicSales ?? raw.organic_sales, fallbackMetrics.organicSales),
    organicContribution: toNumber(
      raw.organicContribution ?? raw.organic_contribution,
      fallbackMetrics.organicContribution
    ),
    roas: toNullableNumber(raw.roas) ?? fallbackMetrics.roas,
    roi: toNullableNumber(raw.roi) ?? fallbackMetrics.roi,
    ctr: toNumber(raw.ctr, fallbackMetrics.ctr),
    cpc: toNullableNumber(raw.cpc) ?? fallbackMetrics.cpc,
    conversionRate: toNumber(
      raw.conversionRate ?? raw.conversion_rate,
      fallbackMetrics.conversionRate
    ),
    profitAfterAds: toNumber(
      raw.profitAfterAds ?? raw.profit_after_ads,
      fallbackMetrics.profitAfterAds
    ),
  }
}

function normalizeFlatIndividual(item: Record<string, unknown>): AdvertisingGroup | null {
  if (item.type !== 'individual') return null

  const nmId = Number(item.sku_id ?? item.nmId ?? 0)
  if (!nmId) return null

  const vendorCode = String(item.product_name ?? item.vendorCode ?? item.label ?? nmId)
  const imtId = item.imtId != null ? Number(item.imtId) : null
  const metrics = flatMetrics(item)
  const product = normalizeFlatProduct({ ...item, nmId, vendorCode }, imtId, true, metrics)

  return {
    type: 'individual',
    imtId,
    mainProduct: { nmId, vendorCode },
    productCount: 1,
    aggregateMetrics: metrics,
    products: [product],
  }
}

function normalizeFlatMergedGroup(item: Record<string, unknown>): AdvertisingGroup | null {
  if (item.type !== 'merged_group') return null

  const imtId = toFiniteNumberOrNull(item.imtId)
  if (imtId == null) return null

  const metrics = flatMetrics(item)
  const main = (item.mainProduct ?? {}) as Record<string, unknown>
  const mainNmId = toFiniteNumberOrNull(main.nmId)
  const mainVendorCode =
    typeof main.vendorCode === 'string' && main.vendorCode ? main.vendorCode : '—'
  const mergedProducts = Array.isArray(item.mergedProducts) ? item.mergedProducts : []
  const productsSource = Array.isArray(item.products) ? item.products : mergedProducts
  const products = productsSource
    .map(raw => {
      const product = (raw ?? {}) as Record<string, unknown>
      const explicitMain = typeof product.isMainProduct === 'boolean' ? product.isMainProduct : null
      const isMainProduct = explicitMain ?? (mainNmId != null && Number(product.nmId) === mainNmId)
      return normalizeFlatProduct(product, imtId, isMainProduct, metrics)
    })
    .filter(product => product.nmId > 0)

  if (mainNmId == null && products.length === 0) return null

  return {
    type: 'merged_group',
    imtId,
    mainProduct: {
      nmId: mainNmId ?? 0,
      vendorCode: mainVendorCode,
      name: typeof main.name === 'string' ? main.name : undefined,
    },
    productCount: Number(item.productCount ?? products.length),
    aggregateMetrics: metrics,
    products,
  }
}

/**
 * Transform backend merged group response to frontend AdvertisingGroup.
 *
 * Supports all live contracts seen in QA:
 * - Request #88 nested merged_group rows with aggregateMetrics/products.
 * - Legacy flat merged_group rows with mergedProducts and top-level metrics.
 * - Flat individual rows in imtId mode, normalized as one-product groups.
 *
 * @param backendItem - Raw backend response item
 * @returns Validated AdvertisingGroup or null if invalid
 */
export function transformMergedGroup(
  backendItem: unknown,
  options: { warn?: boolean } = {}
): AdvertisingGroup | null {
  const item = backendItem as Record<string, unknown>
  const shouldWarn = options.warn ?? true

  if (item.type !== 'merged_group' && item.type !== 'individual') {
    if (shouldWarn) logger.warn('[Transformer] Invalid type:', item.type)
    return null
  }

  if (!item.aggregateMetrics || !Array.isArray(item.products)) {
    const flatGroup = normalizeFlatMergedGroup(item) ?? normalizeFlatIndividual(item)
    if (flatGroup) return flatGroup

    if (shouldWarn) {
      logger.warn('[Transformer] Missing required fields:', {
        hasAggregateMetrics: !!item.aggregateMetrics,
        hasProducts: Array.isArray(item.products),
      })
    }
    return null
  }

  if (item.type === 'merged_group' && toFiniteNumberOrNull(item.imtId) == null) {
    if (shouldWarn) logger.warn('[Transformer] merged_group requires imtId')
    return null
  }

  const mainProduct = item.mainProduct as Record<string, unknown> | undefined
  if (!mainProduct?.nmId) {
    if (shouldWarn) logger.warn('[Transformer] Invalid mainProduct:', mainProduct)
    return null
  }

  return item as unknown as AdvertisingGroup
}

/**
 * Transform array of backend items, filtering only valid merged/individual groups.
 *
 * @param backendData - Array of raw backend response items
 * @returns Array of validated AdvertisingGroup items
 *
 * @example
 * const apiResponse = await getAdvertisingAnalytics({ groupBy: 'imtId' });
 * const groups = transformMergedGroups(apiResponse.data);
 */
export function transformMergedGroups(backendData: unknown[]): AdvertisingGroup[] {
  if (!Array.isArray(backendData)) {
    logger.error('[Transformer] Expected array, got:', typeof backendData)
    return []
  }

  const transformed: AdvertisingGroup[] = []
  let droppedCount = 0

  backendData.forEach(rawItem => {
    const item = transformMergedGroup(rawItem, { warn: false })
    if (item) {
      transformed.push(item)
    } else {
      droppedCount++
    }
  })

  if (droppedCount > 0) {
    const payload = { droppedCount, totalCount: backendData.length }
    if (droppedCount === backendData.length) {
      logger.warn('[Transformer] Dropped all advertising group rows:', payload)
    } else {
      logger.debug('[Transformer] Dropped invalid advertising group rows:', payload)
    }
  }

  return transformed
}

/**
 * Filter only merged_group types (exclude standalone products).
 *
 * Use this when you only want grouped products, not individual ones.
 *
 * @param groups - Array of AdvertisingGroup items
 * @returns Only merged_group types
 */
export function filterMergedGroupsOnly(groups: AdvertisingGroup[]): AdvertisingGroup[] {
  return groups.filter(group => group.type === 'merged_group')
}

/**
 * Filter only individual types (standalone products).
 *
 * @param groups - Array of AdvertisingGroup items
 * @returns Only individual types
 */
export function filterIndividualProductsOnly(groups: AdvertisingGroup[]): AdvertisingGroup[] {
  return groups.filter(group => group.type === 'individual')
}
