import type {
  Story1743OwnerVariantScenario,
  Story1743RouteStateScenarioMap,
} from './owner-state-scenario-types'
import { exact, owner, variant } from './owner-state-scenario-types'
import { STORY_174_3_OWNER_VARIANT_SCENARIOS_B_ADDITIONAL } from './owner-state-evidence-b-additional'

export const STORY_174_3_ROUTE_STATE_SCENARIOS_B: Story1743RouteStateScenarioMap = {
  '/analytics/storage': {
    pending: exact(
      'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
      'processing renders without the unknown hint by default',
      [
        exact(
          'src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx',
          'sends the exact paid-storage date payload and treats accepted pending as processing'
        ),
      ]
    ),
    error: exact(
      'src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx',
      'uses a safe generic failure fallback and retains the selected whole range for retry',
      [
        exact(
          'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
          'error shows the safe nested message, stable code, and whole-range retry scope'
        ),
      ]
    ),
  },
  '/analytics/advertising/campaigns/[advertId]': {
    error: exact(
      'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
      'renders a distinct error instead of passing an invalid nmId to the recommendation card',
      [
        exact(
          'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
          'shows error alert for non-numeric advertId'
        ),
        exact(
          'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
          'shows error alert for NaN advertId'
        ),
      ]
    ),
    loading: exact(
      'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
      'renders skeleton when cabinetId is null'
    ),
  },
  '/analytics/category': {
    partial: exact(
      'src/app/(dashboard)/analytics/category/__tests__/page.test.tsx',
      'does not render StorageComparisonCard when no expenses data'
    ),
  },
  '/analytics/ai-admin/anomalies': {
    error: exact(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
      'shows 409-conflict message on ApiError 409, distinct from generic (Story 171.1 gap 5)',
      [
        exact(
          'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
          'shows generic error message on non-403 failure'
        ),
      ]
    ),
    pending: exact(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
      'announces submitting politely once: aria-busy form + sr-only polite status (gap 7)'
    ),
  },
  '/analytics/forecast': {
    loading: exact(
      'src/app/(dashboard)/analytics/forecast/components/__tests__/CollectingProgressTracker.test.tsx',
      'renders progress percentage'
    ),
  },
  '/analytics/models/[id]/evaluations/sku-accuracy': {
    error: exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/page.test.tsx',
      'F-5: malformed ?nmId=abc renders an explicit invalid-parameter error'
    ),
  },
  '/analytics/models/[id]/evaluations': {
    empty: exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx',
      'empty evaluations: renders non-destructive Alert'
    ),
    'not-found': exact(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx',
      'model-not-found: renders Alert with link to MODELS list'
    ),
  },
  '/automation/installed-rules': {
    loading: exact(
      'src/app/(dashboard)/automation/installed-rules/__tests__/InstalledRulesPageContent.test.tsx',
      'renders the loading state'
    ),
    empty: exact(
      'src/app/(dashboard)/automation/installed-rules/__tests__/InstalledRulesPageContent.test.tsx',
      'renders the empty state with a keyboard-accessible link to the templates gallery'
    ),
    error: exact(
      'src/app/(dashboard)/automation/installed-rules/__tests__/InstalledRulesPageContent.test.tsx',
      'renders the error state with a "Повторить" button that calls refetch'
    ),
  },
  '/automation/installed-rules/[id]': {
    loading: exact(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'renders the loading state'
    ),
    'not-found': exact(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'renders the not-found (404) error state without a retry button'
    ),
    permission: exact(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'renders the authorization (401) error state with an explanatory body'
    ),
    error: exact(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'preserves unsaved input + shows actionable error on mutation failure',
      [
        exact(
          'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
          'blocks Save when validation fails (empty name disables Save)'
        ),
      ]
    ),
  },
}

export const STORY_174_3_OWNER_VARIANT_SCENARIOS_B: readonly Story1743OwnerVariantScenario[] = [
  variant(
    '/analytics/forecast-accuracy',
    'valid zero error',
    'default',
    owner(
      'src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/ForecastAccuracyPageContent.test.tsx',
      'renders valid zero error as 0% and keeps it distinct from an undefined metric'
    )
  ),
  variant(
    '/analytics/models/[id]/evaluations/sku-accuracy',
    'missing',
    'default',
    owner(
      'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/page.test.tsx',
      'renders SkuAccuracyOverview when no ?nmId= param'
    )
  ),
  variant(
    '/analytics/storage',
    'alert',
    'default',
    owner(
      'src/app/(dashboard)/analytics/storage/components/__tests__/StorageAlertBanner.test.tsx',
      'renders when highRatioCount > 0'
    )
  ),
  variant(
    '/analytics/storage',
    'import idle',
    'default',
    owner(
      'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
      'idle form renders labelled date inputs'
    )
  ),
  variant(
    '/analytics/storage',
    'success',
    'default',
    owner(
      'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
      'success is a focusable bounded live summary with status-success icon'
    )
  ),
  variant(
    '/analytics/advertising/campaigns/[advertId]',
    'absent',
    'default',
    owner(
      'src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx',
      'shows "select product" message when nmId is undefined'
    )
  ),
  variant(
    '/analytics/advertising',
    'sync-gap',
    'default',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/SyncGapsTimeline.test.tsx',
      'marks days within a gap as missing'
    )
  ),
  variant(
    '/analytics/advertising',
    'over-attribution',
    'default',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/OverAttributionBanner.test.tsx',
      'renders banner with correct count text (1 товар)'
    )
  ),
  variant(
    '/analytics/advertising',
    'multi-campaign warning',
    'default',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/MultiCampaignWarningBanner.test.tsx',
      'renders alert when warningCount > 0 and not dismissed'
    )
  ),
  variant(
    '/analytics/advertising',
    'discrepancy',
    'default',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/AdCostDiscrepancyCard.test.tsx',
      'renders delta row with severity for normal discrepancy (≤5%)'
    )
  ),
  variant(
    '/analytics/advertising',
    'daily-series',
    'default',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/DailyTrendChart.test.tsx',
      'renders chart title and legend toggles with data'
    )
  ),
  variant(
    '/analytics/cross-reference',
    'selected chart point',
    'default',
    owner(
      'src/app/(dashboard)/analytics/cross-reference/components/__tests__/scatter-selected-point.test.tsx',
      'clicking a point shows the detail line with product identity + tooltip-precision values, then clears'
    )
  ),
  variant(
    '/analytics/search',
    'deep-linked tab',
    'default',
    owner(
      'src/app/(dashboard)/analytics/search/__tests__/search-deep-link.test.tsx',
      '?tab=position-trends activates the Позиции tab'
    )
  ),
  variant(
    '/analytics/ai-admin/anomalies',
    'unknown anomaly type',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/AnomaliesList.test.tsx',
      'empty anomalyType renders muted «Неизвестный тип» fallback (gap 6)'
    )
  ),
  variant(
    '/analytics/ai-admin/anomalies',
    'success',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
      'shows success toast and calls onOpenChange(false) on success'
    )
  ),
  variant(
    '/analytics/ai-admin/models',
    'unknown model status',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
      '171.2 gap-6: unknown status renders raw value in outline badge (known-set fallback)'
    )
  ),
  variant(
    '/analytics/ai-admin/models',
    'success',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/RollbackDialog.test.tsx',
      'success: shows toast and calls onOpenChange(false)'
    )
  ),
  variant(
    '/analytics/ai-admin/preferences',
    'save success',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
      'success toast renders on mutation success (via onSuccess callback)'
    )
  ),
  variant(
    '/automation/installed-rules',
    'populated',
    'default',
    owner(
      'src/app/(dashboard)/automation/installed-rules/__tests__/InstalledRulesPageContent.test.tsx',
      'renders the populated list when rules exist'
    )
  ),
  variant(
    '/automation/installed-rules/[id]',
    'pristine',
    'default',
    owner(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'renders the populated form from normalized data'
    )
  ),
  variant(
    '/automation/installed-rules/[id]',
    'dirty form',
    'default',
    owner(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'fires the unsaved-changes guard when leaving with dirty edits'
    )
  ),
  variant(
    '/automation/installed-rules/[id]',
    'warning acknowledgement',
    'default',
    owner(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'requires the writeback acknowledgement before enabling Save on an activating change'
    )
  ),
  variant(
    '/automation/installed-rules/[id]',
    'success',
    'default',
    owner(
      'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
      'shows the success status alert on mutation success'
    )
  ),
  variant(
    '/analytics/liquidity',
    'preview',
    'default',
    owner(
      'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTable.test.tsx',
      'expands the exact SKU by keyboard and opens its liquidation planner without cross-triggering'
    )
  ),
  variant(
    '/analytics/liquidity',
    'partial trend states',
    'partial',
    owner(
      'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTrendChart.test.tsx',
      'AC2: renders ONLY the BE-provided points — no synthesized days (90 in -> 90 sr rows)'
    )
  ),
  variant(
    '/analytics/returns',
    'valid zero-returns',
    'default',
    owner(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnRateCell.test.tsx',
      'colours a genuine 0% green (not the same as unknown)'
    )
  ),
  variant(
    '/analytics/returns',
    'unknown reason',
    'default',
    owner(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnReasonsPieChart.test.tsx',
      'renders the neutral label with muted fallbacks, not status tokens'
    )
  ),
  variant(
    '/analytics/returns',
    'missing comparison',
    'default',
    owner(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnsSummaryCards.test.tsx',
      'shows dash when compareEnabled is true but no prev data'
    )
  ),
  variant(
    '/analytics/returns',
    'partial-series states',
    'partial',
    owner(
      'src/app/(dashboard)/analytics/returns/components/__tests__/ReturnTrendChart.test.tsx',
      'keeps a partial backend day series visible without synthesizing missing dates'
    )
  ),
  variant(
    '/analytics/storage',
    'week-filter mismatch',
    'default',
    owner(
      'src/app/(dashboard)/analytics/storage/components/__tests__/WeekFilterBadge.test.tsx',
      'formats week correctly: 2025-W47 → W47'
    )
  ),
  variant(
    '/analytics/storage',
    'validation',
    'default',
    owner(
      'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportDialog.test.tsx',
      'keeps invalid paid-storage dates visible and associates the validation message'
    )
  ),
  variant(
    '/analytics/supply-planning',
    'no-risk',
    'default',
    owner(
      'src/app/(dashboard)/analytics/supply-planning/components/__tests__/SupplyRiskCards.test.tsx',
      'renders all 5 risk cards'
    )
  ),
  variant(
    '/analytics/supply-planning',
    'selected',
    'default',
    owner(
      'src/app/(dashboard)/analytics/supply-planning/components/__tests__/SupplyRiskCards.test.tsx',
      'shows active indicator for selected card'
    )
  ),
  variant(
    '/analytics/supply-planning',
    'cost',
    'default',
    owner(
      'src/app/(dashboard)/analytics/supply-planning/components/__tests__/useSupplyTableFilters.test.ts',
      'renders "—" for undefined/null (no COGS), never a fabricated "0 ₽"'
    )
  ),
  variant(
    '/analytics/supply-planning',
    'trend partial states',
    'partial',
    owner(
      'src/app/(dashboard)/analytics/supply-planning/components/__tests__/supply-planning-presentation-source-contracts.test.tsx',
      'null velocity → sr-only alternative says «Нет данных»'
    )
  ),
  variant(
    '/analytics/advertising',
    'partial comparison',
    'partial',
    owner(
      'src/app/(dashboard)/analytics/advertising/components/__tests__/AdCostDiscrepancyCard.test.tsx',
      'renders card with only platformSpend (actualDeduction null)'
    )
  ),
  variant(
    '/analytics/advertising',
    'route-boundary error states',
    'error',
    owner(
      'src/app/(dashboard)/analytics/advertising/__tests__/error.test.tsx',
      'keeps route identity visible and invokes the boundary reset action'
    )
  ),
  variant(
    '/analytics/advertising/campaigns/[advertId]',
    'no recommendation',
    'empty',
    owner(
      'src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx',
      'renders an explicit empty recommendation state when every bid tier is unavailable'
    )
  ),
  variant(
    '/analytics/advertising/campaigns/[advertId]',
    'recommendation partial',
    'partial',
    owner(
      'src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx',
      'keeps available bid tiers visible while marking an unavailable tier with a dash'
    )
  ),
  variant(
    '/analytics/brand',
    'missing-COGS',
    'default',
    owner(
      'src/components/custom/MarginByBrandTable.test.tsx',
      'renders «—» for COGS-dependent cells when cogs === 0'
    )
  ),
  variant(
    '/analytics/brand',
    'negative-margin',
    'default',
    owner(
      'src/components/custom/MarginByBrandTable.test.tsx',
      'renders a negative-margin brand row with the shared error-colour badge'
    )
  ),
  variant(
    '/analytics/brand',
    'storage-comparison unavailable',
    'partial',
    owner(
      'src/app/(dashboard)/analytics/brand/__tests__/page.test.tsx',
      'keeps brand margin data visible when storage comparison is unavailable'
    )
  ),
  variant(
    '/analytics/brand',
    'export lifecycle states',
    'pending',
    owner(
      'src/components/custom/__tests__/ExportDialog.lifecycle.test.tsx',
      'renders the delegated by-brand export pending state with the route defaults',
      undefined,
      [
        exact(
          'src/components/custom/MarginByBrandTable.source-contracts.test.tsx',
          'ExportDialog pin: by-brand default type + week defaults'
        ),
      ]
    )
  ),
  variant(
    '/analytics/brand-share',
    'cascading dependency loading',
    'loading',
    owner(
      'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
      'shows each cascading dependency loading state without hiding the filter context'
    )
  ),
  variant(
    '/analytics/brand-share',
    'null-share states',
    'default',
    owner(
      'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
      'renders the chart when report data is present (null percents preserved as gaps)'
    )
  ),
  variant(
    '/analytics/category',
    'unknown category',
    'default',
    owner(
      'src/components/custom/MarginByCategoryTable.test.tsx',
      'should show "(Без категории)" for items without category'
    )
  ),
  variant(
    '/analytics/category',
    'missing-COGS',
    'default',
    owner(
      'src/components/custom/MarginByCategoryTable.test.tsx',
      'renders «—» for COGS-dependent cells when cogs === 0'
    )
  ),
  variant(
    '/analytics/category',
    'negative margin',
    'default',
    owner(
      'src/components/custom/MarginByCategoryTable.test.tsx',
      'renders a negative-margin category row with the shared error-colour badge'
    )
  ),
  variant(
    '/analytics/category',
    'export lifecycle',
    'pending',
    owner(
      'src/components/custom/__tests__/ExportDialog.lifecycle.test.tsx',
      'renders the delegated by-category export pending state with the route defaults',
      undefined,
      [
        exact(
          'src/components/custom/MarginByCategoryTable.source-contracts.test.tsx',
          'ExportDialog pin: by-category default type + week defaults'
        ),
      ]
    )
  ),
  variant(
    '/analytics/cross-reference',
    'valid no-overlap',
    'default',
    owner(
      'src/app/(dashboard)/analytics/cross-reference/utils/__tests__/ad-search-correlation-utils.test.ts',
      'returns 0 jaccard for disjoint sets'
    )
  ),
  variant(
    '/analytics/cross-reference',
    'indeterminate correlation',
    'default',
    owner(
      'src/app/(dashboard)/analytics/cross-reference/utils/__tests__/ad-search-correlation-utils.test.ts',
      'returns null when fewer than 3 data points'
    )
  ),
  variant(
    '/analytics/search',
    'unknown seller',
    'default',
    owner(
      'src/app/(dashboard)/analytics/search/__tests__/SearchSellerBadge.test.tsx',
      'shows fallback name + keyboard-accessible warning when unavailable'
    )
  ),
  variant(
    '/analytics/search',
    'results-updating states',
    'refresh',
    owner(
      'src/app/(dashboard)/analytics/search/components/__tests__/SearchPositionTrendsTab.test.tsx',
      'keeps the current search results visible while a background refresh is pending'
    )
  ),
  variant(
    '/analytics/ai-admin/anomalies',
    'already-resolved',
    'default',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
      'retains cause and note input after 409-conflict failure (AC-2, gap 5)'
    )
  ),
  variant(
    '/analytics/ai-admin/anomalies',
    'restricted administrator states',
    'permission',
    owner(
      'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/AnomaliesList.test.tsx',
      'shows denied Alert for Analyst role'
    )
  ),
  ...STORY_174_3_OWNER_VARIANT_SCENARIOS_B_ADDITIONAL,
]
