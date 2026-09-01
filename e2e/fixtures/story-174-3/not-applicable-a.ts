import type { Story1743NonDefaultState } from './state-scenarios'

const notApplicable = (...states: readonly Story1743NonDefaultState[]) => states

export const STORY_174_3_NOT_APPLICABLE_A: Readonly<
  Record<string, readonly Story1743NonDefaultState[]>
> = Object.freeze({
  '/': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/login': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/register': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'partial',
    'permission',
    'not-found'
  ),
  '/cabinet': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'not-found'
  ),
  '/processing': notApplicable(
    'empty',
    'filtered-empty',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/wb-token': notApplicable('refresh', 'filtered-empty', 'stale', 'partial', 'partial-success'),
  '/analytics': notApplicable(
    'filtered-empty',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/alerts': notApplicable(
    'stale',
    'partial',
    'partial-success',
    'not-found'
  ),
  '/analytics/dashboard': notApplicable(
    'filtered-empty',
    'partial-success',
    'not-found'
  ),
  '/analytics/finance-history': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/orders': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/pricing': notApplicable(
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/product/[nmId]': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success'
  ),
  '/analytics/reorder': notApplicable(
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/sku': notApplicable(
    'error',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/time-period': notApplicable(
    'filtered-empty',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/unit-economics': notApplicable(
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring/period': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/acquiring/reports/[id]': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success'
  ),
  '/analytics/buyout': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/buyout-reconciliation': notApplicable(
    'refresh',
    'filtered-empty',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/fbs-enhanced': notApplicable(
    'refresh',
    'filtered-empty',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/fbs-stock': notApplicable(
    'refresh',
    'filtered-empty',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/funnel': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/gaps': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/liquidity': notApplicable(
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/returns': notApplicable(
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/storage': notApplicable(
    'refresh',
    'filtered-empty',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/supply-planning': notApplicable(
    'filtered-empty',
    'stale',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/advertising': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/advertising/campaigns/[advertId]': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/brand': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/brand-share': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/category': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/analytics/cross-reference': notApplicable(
    'loading',
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/search': notApplicable(
    'filtered-empty',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
})
