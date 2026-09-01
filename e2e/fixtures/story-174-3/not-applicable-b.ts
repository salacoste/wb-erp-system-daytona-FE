import type { Story1743NonDefaultState } from './state-scenarios'

const notApplicable = (...states: readonly Story1743NonDefaultState[]) => states

export const STORY_174_3_NOT_APPLICABLE_B: Readonly<
  Record<string, readonly Story1743NonDefaultState[]>
> = Object.freeze({
  '/analytics/ai-admin/anomalies': notApplicable(
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
  '/analytics/ai-admin/models': notApplicable(
    'refresh',
    'stale',
    'partial',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/ai-admin/preferences': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'partial-success',
    'not-found'
  ),
  '/analytics/forecast': notApplicable(
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
  '/analytics/forecast-accuracy': notApplicable(
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
  '/analytics/models': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/analytics/models/[id]/evaluations': notApplicable(
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
  '/analytics/models/[id]/evaluations/sku-accuracy': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success'
  ),
  '/analytics/models/[id]/performance': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success'
  ),
  '/dashboard': notApplicable(
    'filtered-empty',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/automation/canned-rules': notApplicable(
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
  '/automation/installed-rules': notApplicable(
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
  '/automation/installed-rules/[id]': notApplicable(
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
  '/cogs': notApplicable(
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
  '/cogs/bulk': notApplicable(
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
  '/cogs/history': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/cogs/price-calculator': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/communications': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/finances': notApplicable('refresh', 'stale', 'permission', 'partial-success', 'not-found'),
  '/monitor': notApplicable(
    'refresh',
    'filtered-empty',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/monitoring': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/moysklad': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders': notApplicable(
    'refresh',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders/fbo': notApplicable(
    'refresh',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/orders/integrity': notApplicable(
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
  '/products': notApplicable(
    'loading',
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/settings': notApplicable(
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
  '/settings/backfill': notApplicable(
    'filtered-empty',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/cabinet': notApplicable(
    'empty',
    'filtered-empty',
    'error',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/settings/expenses': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/notifications': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/settings/tariffs': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'partial-success',
    'not-found'
  ),
  '/settings/tax': notApplicable(
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'partial-success',
    'not-found'
  ),
  '/shipments': notApplicable('partial-success', 'not-found'),
  '/shipments/[id]': notApplicable('filtered-empty', 'stale', 'permission', 'partial-success'),
  '/shipments/box-types': notApplicable(
    'refresh',
    'filtered-empty',
    'error',
    'stale',
    'partial',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/shipments/sku-packaging': notApplicable(
    'refresh',
    'stale',
    'permission',
    'pending',
    'partial-success',
    'not-found'
  ),
  '/supplies': notApplicable(
    'refresh',
    'filtered-empty',
    'stale',
    'partial',
    'permission',
    'partial-success',
    'not-found'
  ),
  '/supplies/[id]': notApplicable(
    'refresh',
    'empty',
    'filtered-empty',
    'stale',
    'partial',
    'pending',
    'partial-success'
  ),
})
