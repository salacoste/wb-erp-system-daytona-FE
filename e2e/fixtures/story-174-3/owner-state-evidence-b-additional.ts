import type { Story1743OwnerVariantScenario } from './owner-state-scenario-types'
import { exact, owner, variant } from './owner-state-scenario-types'

export const STORY_174_3_OWNER_VARIANT_SCENARIOS_B_ADDITIONAL: readonly Story1743OwnerVariantScenario[] =
  [
    variant(
      '/analytics/ai-admin/models',
      'rollback ineligible',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/AdminModelsList.test.tsx',
        'F-10: Откатить button disabled for rolled_back status'
      )
    ),
    variant(
      '/analytics/ai-admin/models',
      'pending',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/RollbackDialog.test.tsx',
        'pending: confirm disabled + spinner while mutation is in flight (171.2 pin)'
      )
    ),
    variant(
      '/analytics/forecast',
      'preference-required',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/AiPreferencesToggle.test.tsx',
        'shows "AI прогнозы отключены" when aiEnabled=false'
      )
    ),
    variant(
      '/analytics/forecast',
      'progress',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/CollectingProgressTracker.test.tsx',
        'renders progress percentage'
      )
    ),
    variant(
      '/analytics/forecast',
      'engine degraded',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/AiEngineStatusBadge.test.tsx',
        'renders "Движок: офлайн (кэш доступен)" on offline-cache state'
      )
    ),
    variant(
      '/analytics/forecast',
      'unavailable',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/AiEngineStatusBadge.test.tsx',
        'renders "Движок: офлайн" on offline state'
      )
    ),
    variant(
      '/analytics/forecast',
      'forecast ready',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/readiness-router.test.ts',
        'returns "ready" when level is ready and no error'
      )
    ),
    variant(
      '/analytics/forecast',
      'missing confidence band',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/ForecastTable.test.tsx',
        'confidence null renders "—" not 0% (anti-pattern #8)'
      )
    ),
    variant(
      '/analytics/forecast',
      'polling failure states',
      'error',
      owner(
        'src/app/(dashboard)/analytics/forecast/components/__tests__/readiness-router.test.ts',
        'returns "ready" when isError is true with collecting level — defensive fallback'
      )
    ),
    variant(
      '/analytics/forecast-accuracy',
      'insufficient sample',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/ForecastAccuracyPageContent.test.tsx',
        'labels a zero-observation response as insufficient sample instead of successful accuracy'
      )
    ),
    variant(
      '/analytics/forecast-accuracy',
      'undefined metric',
      'default',
      owner(
        'src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/ForecastAccuracyPageContent.test.tsx',
        'renders an undefined metric as a dash instead of a valid zero percentage'
      )
    ),
    variant(
      '/analytics/forecast-accuracy',
      'one-breakdown partial states',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/forecast-accuracy/components/__tests__/ForecastAccuracyPageContent.test.tsx',
        'keeps the populated horizon breakdown when the SKU breakdown is unavailable'
      )
    ),
    variant(
      '/analytics/models',
      'unknown status',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/ModelListSection.test.tsx',
        'unknown status renders its raw value in a neutral badge instead of crashing'
      )
    ),
    variant(
      '/analytics/models',
      'training unavailable',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx',
        'error other → renders "Ошибка запуска обучения: {message}"'
      )
    ),
    variant(
      '/analytics/models',
      'already-running',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx',
        'success duplicate (202) → shows "Обучение уже идёт" inline'
      )
    ),
    variant(
      '/analytics/models',
      'pending',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx',
        'pending button has aria-busy=true'
      )
    ),
    variant(
      '/analytics/models',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx',
        'success queued (201) → shows "Запущено" inline with role=status aria-live=polite'
      )
    ),
    variant(
      '/analytics/models',
      'restricted action states',
      'permission',
      owner(
        'src/app/(dashboard)/analytics/models/components/__tests__/TrainModelButton.test.tsx',
        'error 403 renders a distinct restricted-action message'
      )
    ),
    variant(
      '/analytics/models/[id]/evaluations',
      'partial metric states',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/evaluations/components/__tests__/EvaluationsList.test.tsx',
        'AP#8: cabinetMape null renders em-dash not 0'
      )
    ),
    variant(
      '/analytics/models/[id]/evaluations/sku-accuracy',
      'undefined versus zero metric',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyTable.test.tsx',
        'keeps an undefined metric distinct from a valid zero metric in adjacent SKU rows'
      )
    ),
    variant(
      '/analytics/models/[id]/evaluations/sku-accuracy',
      'row-level partial states',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/evaluations/sku-accuracy/components/__tests__/SkuAccuracyTable.test.tsx',
        'AP#8: null avgAiMape renders em-dash not 0'
      )
    ),
    variant(
      '/analytics/models/[id]/performance',
      'insufficient sample',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
        'null case → DRIFT_NULL_CONFIG is muted + Недостаточно данных'
      )
    ),
    variant(
      '/analytics/models/[id]/performance',
      'undefined versus zero metric',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
        'returns Russian-locale "0,0 %" with no + sign for zero delta',
        undefined,
        [
          exact(
            'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
            'returns null when currentMape is null (AP#8 compliance)'
          ),
        ]
      )
    ),
    variant(
      '/analytics/models/[id]/performance',
      'mixed summary',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
        'F-3: prev present, current null → delta renders em-dash, color is neutral'
      )
    ),
    variant(
      '/analytics/models/[id]/performance',
      'chart',
      'default',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
        'happy path: recharts LineChart rendered (mocked)'
      )
    ),
    variant(
      '/analytics/models/[id]/performance',
      'table partial states',
      'partial',
      owner(
        'src/app/(dashboard)/analytics/models/[id]/performance/components/__tests__/ModelPerformanceDetail.test.tsx',
        'evaluation table: null cabinetMape renders em-dash (AP#8)'
      )
    ),
    variant(
      '/dashboard',
      'missing COGS',
      'default',
      owner(
        'src/app/(dashboard)/dashboard/components/__tests__/dashboard-status.test.ts',
        '`missingCogs` requires coverage < 100 AND a positive missing count'
      )
    ),
    variant(
      '/dashboard',
      'success',
      'default',
      owner(
        'src/app/(dashboard)/dashboard/components/__tests__/dashboard-status.test.ts',
        'returns count 0 and null severity when nothing is active'
      )
    ),
    variant(
      '/automation/installed-rules/[id]',
      'save pending',
      'pending',
      owner(
        'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
        'renders save pending as a disabled busy action with retained form values'
      )
    ),
    variant(
      '/analytics/liquidity',
      'error',
      'error',
      owner(
        'src/app/(dashboard)/analytics/liquidity/components/__tests__/LiquidityTrendChart.test.tsx',
        'renders error + retry control when isError (RU)'
      )
    ),
    variant(
      '/analytics/storage',
      'submission',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx',
        'sends the exact paid-storage date payload and treats accepted pending as processing'
      )
    ),
    variant(
      '/analytics/storage',
      'pending',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
        'pending processing state keeps indeterminate progress and expected time visible'
      )
    ),
    variant(
      '/analytics/storage',
      'processing',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
        'processing renders without the unknown hint by default'
      )
    ),
    variant(
      '/analytics/storage',
      'failure',
      'error',
      owner(
        'src/app/(dashboard)/analytics/storage/components/__tests__/useStorageImport.test.tsx',
        'uses a safe generic failure fallback and retains the selected whole range for retry'
      )
    ),
    variant(
      '/analytics/storage',
      'per-section error states',
      'error',
      owner(
        'src/app/(dashboard)/analytics/storage/components/__tests__/PaidStorageImportStatus.test.tsx',
        'error shows the safe nested message, stable code, and whole-range retry scope'
      )
    ),
    variant(
      '/analytics/advertising/campaigns/[advertId]',
      'invalid `advertId`',
      'error',
      owner(
        'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
        'shows error alert for non-numeric advertId'
      )
    ),
    variant(
      '/analytics/advertising/campaigns/[advertId]',
      'invalid `nmId`',
      'error',
      owner(
        'src/app/(dashboard)/analytics/advertising/campaigns/[advertId]/__tests__/page.test.tsx',
        'renders a distinct error instead of passing an invalid nmId to the recommendation card'
      )
    ),
    variant(
      '/analytics/advertising/campaigns/[advertId]',
      'error states',
      'error',
      owner(
        'src/components/custom/advertising/__tests__/BidRecommendationsCard.test.tsx',
        'shows error alert when isError is true'
      )
    ),
    variant(
      '/analytics/brand-share',
      'first-use no-selection',
      'empty',
      owner(
        'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
        'renders the brand select and the category select (disabled until brand chosen)'
      )
    ),
    variant(
      '/analytics/brand-share',
      'empty',
      'empty',
      owner(
        'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
        'renders the empty-state message when the report window is empty'
      )
    ),
    variant(
      '/analytics/brand-share',
      'invalid date range',
      'error',
      owner(
        'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
        'invalid date range: destructive hint shown, values RETAINED, no other branch disabled'
      )
    ),
    variant(
      '/analytics/brand-share',
      'upstream WB 503',
      'error',
      owner(
        'src/components/custom/analytics/__tests__/BrandShareView.test.tsx',
        'surfaces a friendly RU 503 error state with a retry button'
      )
    ),
    variant(
      '/analytics/search',
      'invalid',
      'error',
      owner(
        'src/app/(dashboard)/analytics/search/__tests__/search-deep-link.test.tsx',
        'unknown ?tab= falls back to orders (no fabricated tabs)'
      )
    ),
    variant(
      '/analytics/search',
      'error',
      'error',
      owner(
        'src/app/(dashboard)/analytics/search/components/__tests__/SearchPositionTrendsTab.test.tsx',
        'movers error ≠ history blank: shared-fetch failure renders per-section error chrome while the OWN-fetch history chart still renders'
      )
    ),
    variant(
      '/analytics/ai-admin/anomalies',
      'conflict',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
        'shows 409-conflict message on ApiError 409, distinct from generic (Story 171.1 gap 5)'
      )
    ),
    variant(
      '/analytics/ai-admin/anomalies',
      'resolve validating',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
        'submit button is disabled until cause is selected'
      )
    ),
    variant(
      '/analytics/ai-admin/anomalies',
      'submitting',
      'pending',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
        'announces submitting politely once: aria-busy form + sr-only polite status (gap 7)'
      )
    ),
    variant(
      '/analytics/ai-admin/anomalies',
      'failure',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/anomalies/components/__tests__/ResolveAnomalyDialog.test.tsx',
        'shows generic error message on non-403 failure'
      )
    ),
    variant(
      '/analytics/ai-admin/models',
      'conflict',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/RollbackDialog.test.tsx',
        'error 409: shows conflict-specific message AND retains entered reason (171.2 gap-6)'
      )
    ),
    variant(
      '/analytics/ai-admin/models',
      'failure',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/models/components/__tests__/RollbackDialog.test.tsx',
        'error: shows generic message for non-403 error'
      )
    ),
    variant(
      '/analytics/ai-admin/preferences',
      'failure',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
        'network error fires toast.error with generic retry message'
      )
    ),
    variant(
      '/analytics/ai-admin/preferences',
      'conflict',
      'error',
      owner(
        'src/app/(dashboard)/analytics/ai-admin/preferences/components/__tests__/AiPreferencesForm.test.tsx',
        '409 conflict uses the generic retry message without losing the current toggle value'
      )
    ),
    variant(
      '/dashboard',
      'partial',
      'partial',
      owner(
        'src/app/(dashboard)/dashboard/components/__tests__/DashboardContent.previousPeriod.test.tsx',
        'keeps available current-period metrics visible while finance is transitioning'
      )
    ),
    variant(
      '/dashboard',
      'incomplete period',
      'partial',
      owner(
        'src/components/custom/dashboard/__tests__/IncompleteWeekBanner.test.tsx',
        'shows banner for current (incomplete) week'
      )
    ),
    variant(
      '/automation/installed-rules/[id]',
      'validation error',
      'error',
      owner(
        'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
        'blocks Save when validation fails (empty name disables Save)'
      )
    ),
    variant(
      '/automation/installed-rules/[id]',
      'failure',
      'error',
      owner(
        'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
        'preserves unsaved input + shows actionable error on mutation failure'
      )
    ),
    variant(
      '/automation/installed-rules/[id]',
      'conflict where supported',
      'error',
      owner(
        'src/app/(dashboard)/automation/installed-rules/editor/__tests__/InstalledRuleEditor.test.tsx',
        'preserves edited values when a 409 conflict is returned by the save mutation'
      )
    ),
  ]
