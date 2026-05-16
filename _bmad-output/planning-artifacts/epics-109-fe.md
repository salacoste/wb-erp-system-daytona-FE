# Epic 109-FE: Forecast Enrichment + Model Management

**Priority**: P2 (depends on Epic 108-FE foundation, which is shipped)
**Estimate**: ~10 SP (range [8, 13]) — expected ~50% faster than Epic 108 due to Epic 108 foundation
**Source**: Backend `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` § "2. Forecast Endpoint" + § "3. Model Management" + Epic 108-FE retro action items A-1, A-3, A-4, A-5
**Created**: 2026-05-16

## Phased Roadmap Context

Epic 109-FE is story 2 of 4 in AI/ML integration phased roadmap (from Epic 108-FE spec):

| Epic | Scope | SP | Status |
|---|---|---|---|
| Epic 108-FE | Types/API client (16 endpoints) + Health + Preferences + 3-state Readiness UI | ~10 | ✅ Done |
| **Epic 109-FE** (this) | Forecast Enrichment + Model Management | ~10 | Planning |
| Epic 110-FE | Evaluations + Feedback + CSV Export | ~6 | Backlog |
| Epic 111-FE | Admin Features (role-gated) | ~4 | Backlog |

## Foundation provided by Epic 108-FE

| Domain | Already exists |
|---|---|
| Types/normalizers/fetchers for 16 endpoints | `src/types/ai/`, `src/lib/api/ai/` (7 files each) |
| `ModelType` enum + `MODEL_TYPES` constant (7 variants) | `src/types/ai/forecast.ts` |
| Hooks | `useAiHealth`, `useAiPreferences`, `useAiStatus`, `useAiTrends`, `useAiSneakPreview` |
| UI components | `AiEngineStatusBadge`, `AiPreferencesToggle`, `ForecastPageHeader`, `ForecastParamsCard`, `CollectingProgressTracker`, `SneakPreviewSection`, `TopSkusTable` |
| Pure helpers | `resolveReadinessRoute`, `shouldPollAiStatus`, `nullPreservingSum` |
| `getAiModels`, `postModelTrain`, `getModelPerformance` fetchers + normalizers | Story 108.1 |

## Objective

Enhance the AI Forecast page's `'ready'` state with full model selection + enriched forecast data display + visual chart. Add new Model Management section/page for listing, training, and inspecting models. Apply Epic 108-FE retro action items (a11y lint, AI module architecture doc, scripted commit-count helper).

## Design Decisions

1. **Reuse Epic 108 foundation**: NO infrastructure duplication. All types/fetchers/hooks already exist; Stories below consume them directly per Epic 108 retro A-1.
2. **Forecast chart library**: use **recharts** (matches existing project pattern — `DailyTrendChart`, `MonitorWeeklyChart`, etc.). Per Pattern 2 § Raw-SVG vs chart-library decision (Epic 92-FE), line+area charts with confidence band warrant recharts (jsdom-mockable; visual band requires gradient/area).
3. **Russian locale**: all user-facing copy in Russian. Model type labels: "Прогноз продаж" / "Прогноз выручки" / "Конверсия в поиске" / etc.
4. **Model Management surface**: place in same forecast page OR separate `/analytics/models` route — decision in Story 109.4 spec. Default: side panel on forecast page (less navigation overhead).
5. **Training UX**: trigger button + 5s polling per backend guide. Show inline spinner + progress estimate. 422 prerequisites + 429 rate-limit + 202 duplicate handling per backend guide § Error Handling.

## Stories

### Story 109.1-FE: ModelType selector + enriched forecast response fields (~2 SP)

Wire 7 model types into the forecast UI and surface new response fields.

**Tasks**:
- Add `<ModelTypeSelector />` component using `MODEL_TYPES` constant from `src/types/ai/forecast.ts` (already defined Story 108.1)
- Russian labels per modelType: map keys to user-facing strings
  - `sales_forecast` → "Прогноз продаж"
  - `daily_revenue_forecast` → "Прогноз выручки (день)"
  - `search_conversion_forecast` → "Конверсия в поиске"
  - `weekly_margin_forecast` → "Маржинальность (неделя)"
  - `funnel_stage_prediction` → "Конверсия воронки"
  - `demand_forecast` → "Прогноз спроса"
  - `stockout_risk` → "Риск out-of-stock"
- Integrate into `ForecastParamsCard` (Epic 108) — add 4th filter control alongside Уровень / nmId / Горизонт
- Pass `modelType` to `useAiForecast(params)` (extend `AiForecastParams` if needed — already has `modelType?: ModelType`)
- Update `ForecastTable` (Epic 103) to display new prediction fields:
  - `naiveBaseline` (money, `number | null`) — "Базовая оценка" column
  - `aiVsNaive` (string "+12.3%") — "AI vs базовая" column with green/red color per sign
  - `predictedRevenue` (`number` 0 or actual) — "Прогноз выручки" column (visible only when modelType is revenue-class)
  - `nmId` / `vendorCode` — already displayed in some tables
- Display `explanation?: string` as subtitle above the table (when present)
- Display `rollbackNotice` Alert (existing from Epic 103) when present

**Acceptance criteria**:
- ModelTypeSelector renders 7 options with Russian labels
- Selector value persists in URL query param OR component state (decide based on existing `useAiForecast` pattern)
- ForecastTable shows all new columns when data available
- `aiVsNaive` rendered with semantic color (positive green / negative red)
- explanation rendered as subtitle (truncate if >200 chars)
- All baseline gates green
- 2-pass adversarial review

### Story 109.2-FE: Forecast chart with confidence band (~2 SP)

Visual chart of predictions over horizon.

**Tasks**:
- New component `<ForecastChart />` using recharts `<ComposedChart />`
- Layers (z-order bottom→top):
  1. `<Area />` confidence band — shaded region between `(predictedUnits − spread)` and `(predictedUnits + spread)`. **Spread formula (LOCKED 2026-05-17)**: `spread = max(0.10, 1 - confidence) × predictedUnits`. The 10% floor prevents the band from visually collapsing on `confidence ≥ 0.9` days (zero-width band looks broken). Encodes per-day confidence as requested by users + matches the "confidence cone" idiom. Extract as pure helper `getForecastBand(predictedUnits, confidence): { lower, upper }` for direct unit-test coverage. If backend later publishes a canonical spread formula, swap in the helper without touching chart layers.
  2. `<Line />` naiveBaseline — dashed gray line for comparison
  3. `<Line />` predictedUnits — solid colored line (primary brand `#E53935`)
  4. Optional: `<ReferenceLine />` at `today` if historical context present
- X-axis: dates (format DD.MM per Russian locale via `formatDate`)
- Y-axis: predicted units (rounded if no decimals needed)
- Tooltip: show all 3 values + confidence%
- Empty state: when `predictions.length === 0`, show fallback alert (reuse existing pattern)
- Pattern 2 compliance: recharts + `vi.mock` setup for jsdom SVG sizing (Epic 92-FE precedent)

**Acceptance criteria**:
- Chart renders with all 3 layers
- Tooltip shows correct values + Russian labels
- Confidence band visible (low confidence = wider band)
- Works in jsdom for tests (mock recharts dimensions if needed)
- All baseline gates green
- 2-pass adversarial review

### Story 109.3-FE: Model list page/section (~2 SP)

List all models with status, version, MAPE.

**Tasks**:
- New hook `useAiModels()` — uses existing `getAiModels` fetcher (Story 108.1). cabinetId in queryKey.
- New component `<ModelListSection />`:
  - Table columns: Тип, Движок, Версия, Статус, MAPE, Обучен
  - Status color badges: 'active' → green, 'training' → blue (animated dot), 'degraded' → amber, 'retired' → gray
  - Status labels in Russian: "Активна" / "Обучается" / "Деградировала" / "Снята"
  - MAPE column with null-handling (`?? '—'` per Anti-Pattern #8)
  - Engine column: "MindsDB" or "Prophet" (display as-is per backend guide)
  - Click model row → drill-down to performance detail (Story 109.5)
- **Placement (LOCKED 2026-05-17)**: separate `/analytics/models` route (NOT a side panel on `/analytics/forecast`). Rationale: (1) Epic 111-FE planned role-gating (Owner-only model rollback) is trivial on a dedicated route; (2) Epic 110-FE evaluations + feedback naturally nest under `/analytics/models/[id]/evaluations`; (3) `/analytics/forecast` already renders 7+ sections in `ready` state — adding model list would overload cognitive density; (4) cost is +1 route file + 1 sidebar entry. Story 109.3 must add the sidebar entry under "Analytics" group near `/analytics/forecast`.

**Acceptance criteria**:
- ModelListSection renders all models with correct status colors + Russian labels
- MAPE renders `—` for null
- Click navigates to performance detail
- All baseline gates green
- 2-pass adversarial review

### Story 109.4-FE: Model training trigger + polling (~2 SP)

Trigger model training + poll for completion.

**Tasks**:
- New mutation hook `useTrainAiModel()` — uses existing `postModelTrain` fetcher (Story 108.1)
- New component `<TrainModelButton />`:
  - Button "Обучить модель" — triggers POST `/v1/ai/models/train` with `modelType` body
  - On success (201 queued): show inline spinner + "Обучение запущено..."
  - Start polling `useAiModels()` every 5s per backend guide
  - When polled `useAiModels` shows the matching modelType `status === 'active'` → "Готово!" + stop polling
  - Handle 422 (insufficient data): show alert with `weeksCollected`/`weeksRequired` + `cogsCoveragePct`
  - Handle 429 (rate limit): show "Превышен лимит обучения, попробуйте через час"
  - Handle 202 (duplicate): show "Обучение уже идёт"
- **Placement (LOCKED 2026-05-17)**: per-row "Обучить" button in the model list `<TrainModelButton modelType={row.modelType} />`. Button is disabled when `row.status === 'training'` and shows inline spinner + "Обучение запущено..." once mutation fires. Rationale: (1) user mental model in `/analytics/models` IS the row (they're scanning models); (2) per-row state is required for 5s polling indicator anyway; (3) section-level button + selector would duplicate the ModelTypeSelector from Story 109.1 (UI redundancy); (4) 7 buttons is visually clean as compact icon-or-text buttons in a Status column.

**Acceptance criteria**:
- Training trigger works with all 7 model types
- 5s polling continues until status transitions
- 422/429/202 error states render correctly with Russian copy
- Polling stops on success or unmount
- All baseline gates green
- 2-pass adversarial review

### Story 109.5-FE: Model performance detail + MAPE trend chart (~1.5 SP)

Detail view for a specific model's performance over time.

**Tasks**:
- New hook `useModelPerformance(modelId)` — uses existing `getModelPerformance` fetcher (Story 108.1)
- New component `<ModelPerformanceDetail modelId={...} />`:
  - Header: model name + version + status
  - Drift status badge: `driftStatus === 'improving'` → green, `'stable'` → blue, `'degrading'` → red. Russian labels: "Улучшается" / "Стабильно" / "Деградирует"
  - MAPE trend chart: line chart using recharts. X-axis: evaluationDate, Y-axis: cabinetMape
  - Previous version comparison: if `previousVersionMetrics` present, show "Сравнение с v{N-1}: MAPE X% → Y% (delta)"
  - skuCount column under evaluation rows

**Acceptance criteria**:
- Performance detail renders for given modelId
- MAPE trend chart shows historical data
- Drift status badge colored correctly with Russian label
- Previous version comparison rendered when present
- All baseline gates green
- 2-pass adversarial review

### Story 109.6-FE: Tests + polish + retrospective + Epic 108 retro A-3/A-4/A-5 (~1 SP)

Final quality-gate sweep + retro + apply Epic 108 retro action items.

**Tasks**:
- Run all baseline gates
- **A-3 from Epic 108 retro**: Author `scripts/count-test-changes.sh` — given a commit hash, outputs "+X new test files, +Y new test cases" via grep on `it()` blocks. Address 4th occurrence of commit-message count drift.
- **A-4 from Epic 108 retro**: Add ESLint a11y rule for icon-only interactive elements. Investigate `eslint-plugin-jsx-a11y` rule list; verify if `jsx-a11y/role-has-required-aria-props` or similar catches the TrendIcon pattern. Enable + fix any violations.
- **A-5 from Epic 108 retro**: Author `docs/process/ai-module-architecture.md` — entry-point document for Epic 110/111 contributors. Cover: file structure, hook contracts (cabinetId scoping, polling intervals), component composition, extension points.
- File Epic 109-FE retrospective
- Update sprint-status: all Epic 109 stories + epic + retrospective → done

**Acceptance criteria**:
- All quality gates baseline-clean
- A-3, A-4, A-5 codified (scripts + docs)
- Retrospective filed
- Epic 109-FE marked done

## Dependencies

- Epic 108-FE foundation (shipped) — all infrastructure types/fetchers/hooks
- recharts library (already in project — used by `DailyTrendChart`, `MonitorWeeklyChart`)
- shadcn/ui Badge component (verify available; add via CLI if missing)
- Epic 92-FE Pattern 2 § Raw-SVG vs chart-library decision rule
- CLAUDE.md disciplines (all)
- Story 105.1-FE ESLint Anti-Pattern #8 rule
- Story 105.2-FE pre-flight verification workflow step
- Story 106.3-FE Anti-Pattern #8 Exceptions taxonomy

## Risks / Open Questions — RESOLVED 2026-05-17

| # | Question | Resolution | Affects |
|---|---|---|---|
| 1 | Model Management placement | **LOCKED: separate `/analytics/models` route** (not side panel). Cleaner separation; trivial role-gating for Epic 111; natural parent for Epic 110 evaluations under `/analytics/models/[id]/`. See Story 109.3 task list. | 109.3 |
| 2 | Confidence band spread formula | **LOCKED: `spread = max(0.10, 1 − confidence) × predictedUnits`**. Per-day confidence-aware; 10% floor prevents visual collapse on high-confidence days. Pure helper `getForecastBand`. See Story 109.2 task list. | 109.2 |
| 3 | Visual UAT for Epic 108 | **LOCKED: parallel, not blocking**. Partial UAT run 2026-05-17 — collecting state + engine badge + AI toggle verified. Filed 2 polish issues at `frontend/docs/polish/epic-108-uat-findings-2026-05-17.md`. `ready` + `sneak_preview` UAT deferred until test cabinets exist in those states. | none (parallel) |
| 4 | TrainModelButton placement | **LOCKED: per-row "Обучить" button** with row-level `disabled` when `status === 'training'`. Matches user mental model; per-row state required for polling indicator anyway. See Story 109.4 task list. | 109.4 |
| 5 | MAPE chart Y-axis range | **PROPOSED: auto-scale with min/max from data + 10% padding**. If MAPE outliers ≥ 100%, clamp display at 100% with a "Outlier capped" overlay. Final decision at Story 109.5 spec time once we see real MAPE samples. | 109.5 |
