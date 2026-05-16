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
  1. `<Area />` confidence band — shaded region between `(predictedUnits - confidence*X)` and `(predictedUnits + confidence*X)` where X = some sensible spread (e.g., predictedUnits * (1 - confidence) for low-confidence days widens the band; verify with backend or use ±20%)
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
- Placement decision: side panel on `/analytics/forecast` OR separate route — DECIDE in spec author session

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
- Integrate button into ModelListSection (per-row "Train" action OR section-level)

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

## Risks / Open Questions

1. **Model Management placement**: side panel vs separate route — decide at Story 109.3 spec time based on UX intent. Default: side panel (less navigation).
2. **Confidence band visual spread**: backend guide doesn't specify the spread formula. Default: ±(1 - confidence) × predictedUnits. Verify with PM/UX or use simple ±20%.
3. **Visual UAT pending from Epic 108-FE retro A-2**: should run BEFORE Epic 109 starts to validate Epic 108 components render correctly. Defer or block?
4. **TrainModelButton placement**: per-row action vs section-level button. Both have merit. Decide at Story 109.4.
5. **MAPE chart Y-axis range**: typical MAPE values 5-30%. Y-axis bounds? Auto-scale vs fixed 0-100? Default: auto-scale with min/max from data.
