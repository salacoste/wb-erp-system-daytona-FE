import type { Story1743OwnerStateException } from './owner-state-exceptions'

type IndependentlySourcedOwnerStateException = Story1743OwnerStateException & {
  sourceAssertion: string
}

export const STORY_174_3_OWNER_STATE_EXCEPTIONS_B: readonly IndependentlySourcedOwnerStateException[] = [
  {
    route: '/analytics/liquidity',
    rawOwnerState: 'benchmark unavailable',
    normalizedState: 'partial',
    reason:
      '/analytics/liquidity owner clause [benchmark unavailable]: the mapper always derives benchmarks when the response omits them, so this route cannot render an unavailable benchmark state.',
    canonicalOwnerDecision:
      '/analytics/liquidity owner clause [benchmark unavailable]: treat omitted backend benchmarks as an intentional computed fallback, not as a separately executable partial state.',
    source: 'src/lib/api/liquidity-summary-mapper.ts',
    sourceAssertion:
      '(raw.benchmarks as LiquidityBenchmarks | undefined) ?? computeBenchmarks(distribution, items),',
  },
  {
    route: '/analytics/liquidity',
    rawOwnerState: 'planner validating',
    normalizedState: 'pending',
    reason:
      '/analytics/liquidity owner clause [planner validating]: the planner is a read-only presentation of backend-provided scenarios and has no editable input or validation mutation.',
    canonicalOwnerDecision:
      '/analytics/liquidity owner clause [planner validating]: validation is inapplicable until the route owns an executable planner mutation contract.',
    source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidationPlannerModal.tsx',
    sourceAssertion: 'const scenarios = item.liquidation_scenarios || []',
  },
  {
    route: '/analytics/liquidity',
    rawOwnerState: 'submitting',
    normalizedState: 'pending',
    reason:
      '/analytics/liquidity owner clause [submitting]: the planner only renders backend-provided scenarios and does not invoke a submit mutation.',
    canonicalOwnerDecision:
      '/analytics/liquidity owner clause [submitting]: submission pending is inapplicable until the planner receives a mutation boundary.',
    source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidationPlannerModal.tsx',
    sourceAssertion: 'const scenarios = item.liquidation_scenarios || []',
  },
  {
    route: '/analytics/liquidity',
    rawOwnerState: 'success',
    normalizedState: 'default',
    reason:
      '/analytics/liquidity owner clause [success]: the planner has no mutation result; its visible recommended scenario is preview data, not a successful write.',
    canonicalOwnerDecision:
      '/analytics/liquidity owner clause [success]: do not relabel the static scenario preview as mutation success.',
    source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidationPlannerModal.tsx',
    sourceAssertion: 'const scenarios = item.liquidation_scenarios || []',
  },
  {
    route: '/analytics/liquidity',
    rawOwnerState: 'failure',
    normalizedState: 'error',
    reason:
      '/analytics/liquidity owner clause [failure]: the planner has no submit mutation that could produce a planner-owned failure.',
    canonicalOwnerDecision:
      '/analytics/liquidity owner clause [failure]: keep route and trend errors executable, but leave planner mutation failure inapplicable until that capability exists.',
    source: 'src/app/(dashboard)/analytics/liquidity/components/LiquidationPlannerModal.tsx',
    sourceAssertion: 'const scenarios = item.liquidation_scenarios || []',
  },
  {
    route: '/analytics/supply-planning',
    rawOwnerState: 'stale entity',
    normalizedState: 'stale',
    reason:
      '/analytics/supply-planning owner clause [stale entity]: the response exposes a raw stock timestamp but no freshness status or threshold from which the UI could truthfully classify an entity as stale.',
    canonicalOwnerDecision:
      '/analytics/supply-planning owner clause [stale entity]: do not invent a client freshness policy; require an API-owned status or threshold before making this state executable.',
    source: 'src/types/supply-planning/responses.ts',
    sourceAssertion: 'stocks_updated_at: string',
  },
  {
    route: '/analytics/supply-planning',
    rawOwnerState: 'export lifecycle',
    normalizedState: 'pending',
    reason:
      '/analytics/supply-planning owner clause [export lifecycle]: CSV export is a synchronous client-side function call with no queued job, promise state, or retry lifecycle.',
    canonicalOwnerDecision:
      '/analytics/supply-planning owner clause [export lifecycle]: verify the synchronous export action, but do not fabricate an asynchronous pending state.',
    source:
      'src/app/(dashboard)/analytics/supply-planning/components/SupplyPlanningTable.tsx',
    sourceAssertion:
      '<Button variant="outline" size="sm" onClick={() => exportSupplyTableCSV(processedData)}>',
  },
  {
    route: '/analytics/ai-admin/preferences',
    rawOwnerState: 'pristine',
    normalizedState: 'default',
    reason:
      '/analytics/ai-admin/preferences owner clause [pristine]: the only control persists immediately on toggle and there is no draft form or explicit Save boundary.',
    canonicalOwnerDecision:
      '/analytics/ai-admin/preferences owner clause [pristine]: treat the fetched toggle value as default data, not as a form-dirtiness lifecycle.',
    source:
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/AiPreferencesForm.tsx',
    sourceAssertion: 'onCheckedChange={handleCheckedChange}',
  },
  {
    route: '/analytics/ai-admin/preferences',
    rawOwnerState: 'dirty',
    normalizedState: 'default',
    reason:
      '/analytics/ai-admin/preferences owner clause [dirty]: toggling invokes persistence immediately, so no local dirty buffer exists.',
    canonicalOwnerDecision:
      '/analytics/ai-admin/preferences owner clause [dirty]: do not claim a dirty state for an immediately persisted switch.',
    source:
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/AiPreferencesForm.tsx',
    sourceAssertion: 'onCheckedChange={handleCheckedChange}',
  },
  {
    route: '/analytics/ai-admin/preferences',
    rawOwnerState: 'unsaved-change states',
    normalizedState: 'default',
    reason:
      '/analytics/ai-admin/preferences owner clause [unsaved-change states]: the route has no deferred Save action, navigation guard, or unsaved local value because toggle changes mutate immediately.',
    canonicalOwnerDecision:
      '/analytics/ai-admin/preferences owner clause [unsaved-change states]: leave unsaved-change handling inapplicable for this immediate-persistence interaction.',
    source:
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/AiPreferencesForm.tsx',
    sourceAssertion: 'onCheckedChange={handleCheckedChange}',
  },
  {
    route: '/analytics/ai-admin/preferences',
    rawOwnerState: 'validation error',
    normalizedState: 'error',
    reason:
      '/analytics/ai-admin/preferences owner clause [validation error]: the only editable control is a boolean switch that immediately persists a valid boolean value, so the route has no locally invalid input state.',
    canonicalOwnerDecision:
      '/analytics/ai-admin/preferences owner clause [validation error]: do not fabricate form validation for an immediate-persistence boolean control; keep executable mutation failure and conflict evidence instead.',
    source:
      'src/app/(dashboard)/analytics/ai-admin/preferences/components/AiPreferencesForm.tsx',
    sourceAssertion: 'onCheckedChange={handleCheckedChange}',
  },
  {
    route: '/analytics/models/[id]/evaluations',
    rawOwnerState: 'invalid model ID',
    normalizedState: 'error',
    reason:
      '/analytics/models/[id]/evaluations owner clause [invalid model ID]: the route contract accepts an opaque string identifier and delegates it unchanged; it has no syntax that can be classified as invalid.',
    canonicalOwnerDecision:
      '/analytics/models/[id]/evaluations owner clause [invalid model ID]: use the executable model-not-found state for unknown opaque IDs and do not invent client-side ID syntax validation.',
    source: 'src/app/(dashboard)/analytics/models/[id]/evaluations/page.tsx',
    sourceAssertion: 'return <EvaluationsList modelId={id} />',
  },
  {
    route: '/analytics/models/[id]/evaluations',
    rawOwnerState: 'unknown run status',
    normalizedState: 'default',
    reason:
      '/analytics/models/[id]/evaluations owner clause [unknown run status]: evaluation entries expose completed metric records and an evaluation date, but no run-status field to render or normalize.',
    canonicalOwnerDecision:
      '/analytics/models/[id]/evaluations owner clause [unknown run status]: require an API run-status field before treating unknown status as an executable UI state.',
    source: 'src/types/ai/evaluations.ts',
    sourceAssertion: 'evaluationDate: string',
  },
  {
    route: '/automation/installed-rules',
    rawOwnerState: 'stale status',
    normalizedState: 'stale',
    reason:
      '/automation/installed-rules owner clause [stale status]: rule timestamps are optional and the list has no canonical freshness threshold or stale-status field.',
    canonicalOwnerDecision:
      '/automation/installed-rules owner clause [stale status]: do not derive a stale badge from an optional timestamp without an owner-defined policy.',
    source: 'src/types/automation.ts',
    sourceAssertion: 'updatedAt?: string',
  },
  {
    route: '/automation/installed-rules',
    rawOwnerState: 'pending update',
    normalizedState: 'pending',
    reason:
      '/automation/installed-rules owner clause [pending update]: the list is presentational and routes update intent to the dedicated editor instead of mutating a row in place.',
    canonicalOwnerDecision:
      '/automation/installed-rules owner clause [pending update]: execute update pending on /automation/installed-rules/[id], not on the read-only list route.',
    source: 'src/components/custom/automation/InstalledRuleRow.tsx',
    sourceAssertion: 'href={ROUTES.AUTOMATION.installedRuleEditor(rule.id)}',
  },
  {
    route: '/automation/installed-rules',
    rawOwnerState: 'restricted action',
    normalizedState: 'permission',
    reason:
      '/automation/installed-rules owner clause [restricted action]: the list exposes navigation and status badges only; permission-gated writes are owned by the editor route.',
    canonicalOwnerDecision:
      '/automation/installed-rules owner clause [restricted action]: execute permission evidence on /automation/installed-rules/[id] and keep the list route read-only.',
    source: 'src/components/custom/automation/InstalledRuleRow.tsx',
    sourceAssertion: 'href={ROUTES.AUTOMATION.installedRuleEditor(rule.id)}',
  },
]
