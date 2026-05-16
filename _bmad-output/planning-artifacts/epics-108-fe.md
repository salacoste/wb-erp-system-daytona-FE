# Epic 108-FE: AI Foundation + Readiness States

**Priority**: P1 (foundational — unblocks all subsequent AI/ML frontend work)
**Estimate**: ~10 SP (range [8, 13])
**Source**: Backend `docs/AI-FRONTEND-INTEGRATION-GUIDE.md` (parent repo, 425 lines) — 16 endpoints across 5 functional areas. Current FE uses only `GET /v1/ai/forecast`.
**Created**: 2026-05-16

## Phased Roadmap (4 epics covering full AI/ML integration)

Epic 108-FE is the foundation for 3 subsequent epics:

| Epic | Scope | SP | Status |
|---|---|---|---|
| **Epic 108-FE** (this) | Types/API client expansion (16 endpoints) + Health + Preferences + 3-state Readiness UI | ~10 | Planning |
| **Epic 109-FE** | Forecast Enrichment (modelType selector, naiveBaseline/aiVsNaive/explanation/rollbackNotice) + Model Management (list, training, performance) | ~10 | Backlog |
| **Epic 110-FE** | Evaluations + Feedback + CSV Export | ~6 | Backlog |
| **Epic 111-FE** | Admin Features (anomaly resolution, model rollback) — role-gated | ~4 | Backlog |

## Objective

Expand the AI Forecast page from its current single-endpoint state (`GET /v1/ai/forecast`) to a state-aware multi-component page that handles all 3 backend readiness states (`collecting`, `sneak_preview`, `ready`). Build foundation types/API client/hooks for all 16 endpoints so subsequent epics (109/110/111) can consume them without re-doing infrastructure.

## Design Decisions

1. **Visual design**: Use backend guide's ASCII mockups as wireframe references + project's existing design system (shadcn/ui Card/Table/Alert/Badge components + Tailwind CSS + red primary `#E53935` per `docs/front-end-spec.md`). Pixel-perfect UX design can come later if needed.
2. **Role gating**: Epic 108 endpoints (`/status`, `/trends`, `/sneak-preview`, `/health`, `/preferences`) are NOT role-gated — all roles can access. Admin endpoints (`/admin/*`, `/anomalies/:id/resolve`) are out of scope (Epic 111).
3. **Include sneak_preview state**: full 3-state coverage. Skipping `sneak_preview` would create a UX gap for cabinets in the 6-11-week window. Adds ~2 SP for completeness.
4. **Russian locale**: all user-facing copy in Russian (per CLAUDE.md user-personas). Backend ASCII mockups are in English — translate to Russian during implementation.

## Stories

### Story 108.1-FE: Expand types + API client for 16 endpoints (~3 SP)

Foundation story — types + API client + Boundary Normalizers for all 16 endpoints. Subsequent stories consume these without re-creating.

**Tasks**:
- Expand `src/types/ai-forecast.ts` with type definitions for:
  - `AiHealthResponse`, `AiPreferences`, `AiStatusResponse` (readiness state machine)
  - `AiTrendsResponse`, `AiSneakPreviewResponse`
  - `AiModel`, `AiModelListResponse`, `ModelTrainRequest`, `ModelTrainResponse`, `ModelPerformanceResponse`
  - `AiEvaluationListResponse`, `SkuAccuracyListResponse`
  - `AiFeedbackRequest`, `AnomalyResolveRequest`
  - `AdminModelListResponse`, `ModelRollbackRequest`
  - Enums: `ReadinessLevel`, `ModelType` (7 variants), `ModelStatus`, `Engine`, `DriftStatus`, `FeedbackType`, `ResolutionCause`
- Extend the existing `AiForecastResponse` (Epic 103) with new optional fields per backend guide:
  - `predictions[].forecastDate` → already mapped to `date`
  - `predictions[].predictedRevenue`, `naiveBaseline`, `aiVsNaive`, `nmId`, `vendorCode` (new fields; some optional)
  - `explanation?: string`, `rollbackNotice?: { previousVersion, rollbackDate, reason }`
- Extend `src/lib/api/ai-forecast-api.ts` with fetcher functions:
  - `getAiHealth()`, `getAiPreferences()`, `patchAiPreferences(body)`, `getAiStatus()`, `getAiTrends()`, `getAiSneakPreview()`, `getAiModels()`, `postModelTrain(body)`, `getModelPerformance(id)`, `getEvaluations(params)`, `getSkuAccuracy(format?)`, `postFeedback(body)`, `patchAnomalyResolve(id, body)`, `getAdminModels(params)`, `patchModelRollback(id, body)`
  - Each with Boundary Normalizer transforming raw response → frontend-canonical shape
  - Defensive Frontend Principle: null preservation for nullable fields, `?? []` for arrays
- Unit tests for all new normalizers (each gets ≥1 test for nullability/case/edges)
- NO new hooks in this story (next stories add hooks as needed)
- NO UI changes in this story (foundation only)

**Acceptance criteria**:
- All 16 endpoints have types + fetcher + normalizer
- Each normalizer has ≥1 unit test
- All baseline gates green
- File size <200 lines per file (extract subdirectories if needed)
- 2-pass adversarial review

### Story 108.2-FE: Health + preferences hooks + UI (~1.5 SP)

User-facing AI on/off toggle + engine health badge.

**Tasks**:
- `useAiHealth()` hook with 30s polling interval (`refetchInterval: 30_000`)
- `useAiPreferences()` hook (query) + `useUpdateAiPreferences()` (mutation, optimistic update)
- Header status badge component: green dot if `engineConnected: true`, red dot if `false`, "stale" badge if `cachedPredictionsAvailable: true` after engine outage
- AI on/off toggle in forecast page settings area: PATCH `/v1/ai/preferences` with optimistic update
- Empty state for `aiEnabled: false`: replace entire forecast page with "AI отключён" alert + enable button
- Russian copy (refined during implementation for better UX — full sentences instead of fragments): "Движок: подключён", "Движок: офлайн", "Движок: офлайн (кэш доступен)", "AI прогнозы включены", "AI прогнозы отключены"

**Acceptance criteria**:
- Health polling works WITHOUT `cabinetId` in queryKey (global endpoint per backend guide line 305 "no cabinet context needed" — documented exception to Story 97.5-FE discipline; cabinetId IS in preferences queryKey)
- Preferences toggle persists across page reload
- aiEnabled=false hides full forecast UI gracefully
- All baseline gates green
- 2-pass adversarial review

### Story 108.3-FE: Readiness state machine (~2 SP)

The core UX router — branches the page into 3 substates based on backend's readiness state.

**Tasks**:
- `useAiStatus()` hook with 60s polling (only when `readinessLevel !== 'ready'` — once ready, polling can stop)
- Refactor `ForecastPageContent` to render different sections based on `readinessLevel`:
  - `'collecting'` → render `<CollectingProgressTracker />` (Story 108.4)
  - `'sneak_preview'` → render `<SneakPreviewSection />` (Story 108.5)
  - `'ready'` → render existing forecast UI (current Epic 103/104 implementation)
- Pattern 1 (Epic 92-FE) independent state-machine orchestration: each branch has its own loading/error/data states; one substate failure doesn't break the page
- Defensive guard: unknown `readinessLevel` value falls back to `'ready'` state (don't blank the page)

**Acceptance criteria**:
- 3 distinct UI states render correctly
- Polling stops automatically when `readinessLevel === 'ready'`
- Defensive fallback for unknown enum values
- All baseline gates green
- 2-pass adversarial review

### Story 108.4-FE: Collecting state UI + trends (~1.5 SP)

For new cabinets with insufficient data — show progress + top SKUs from `/v1/ai/trends`.

**Tasks**:
- `useAiTrends()` hook
- `<CollectingProgressTracker />` component:
  - Progress bar: `progressPct` (visual) + "X of Y weeks collected"
  - Missing requirements list: `missingRequirements` array with checkmark/warning icons
  - Estimated activation date: `estimatedActivationDate` (null = "still collecting")
- `<TopSkusTable />` (sub-component): "Top 5 SKUs by volume" from `topSkus` field of `/trends`
- Russian copy: "Сбор данных", "X из Y недель собрано", "Ожидаемая активация", "Топ-5 SKU по объёму"

**Acceptance criteria**:
- Progress visualization renders correctly for various data points
- Missing requirements display with appropriate icons
- Top SKUs table fetches and renders
- All baseline gates green
- 2-pass adversarial review

### Story 108.5-FE: Sneak-preview state UI (~1.5 SP)

For cabinets with 6-11 weeks of data — partial AI active with disclaimers.

**Tasks**:
- `useAiSneakPreview()` hook
- `<SneakPreviewSection />` component:
  - Disclaimer alert (always visible): "Низкая уверенность — сбор данных продолжается"
  - SKU table: `skuForecasts` array
  - Columns: Артикул, Среднее/день, Тренд (↑/→/↓ icons), Диапазон 7 дней (low-high)
- Trend icon helper: `'up' → ↑`, `'down' → ↓`, `'stable' → →`
- Russian copy: "Низкая уверенность", "Артикул", "Среднее/день", "Тренд", "Диапазон 7 дней", "Растёт"/"Стабильно"/"Снижается"

**Acceptance criteria**:
- Disclaimer always visible at top of section
- Trend arrows render correctly per trend value
- Table handles empty `skuForecasts` array gracefully
- All baseline gates green
- 2-pass adversarial review

### Story 108.6-FE: Tests + polish + retrospective (~0.5 SP)

Final quality-gate sweep + Epic 108-FE retrospective.

**Tasks**:
- Run all baseline gates (lint, tsc, vitest, doc-citations, ESLint rule names)
- Verify pre-flight discipline applied (any AC already shipped → close as no-op)
- File Epic 108-FE retrospective at `_bmad-output/implementation-artifacts/epic-108-fe-retro-{date}.md`
- Update sprint-status: epic-108-fe + 6 stories + retrospective → done
- Document Epic 109/110/111 readiness based on Epic 108 foundation

**Acceptance criteria**:
- All quality gates baseline-clean
- Retrospective filed
- Epic 108-FE marked done

## Dependencies

- Backend: `GET /v1/ai/health`, `/preferences`, `/status`, `/trends`, `/sneak-preview` — all live per backend guide 2026-05-16
- Epic 103-FE: existing forecast page + AiForecastResponse type
- Epic 104-FE: existing AdvertisingDailyData enrichment patterns (Boundary Normalizer)
- Epic 105-FE: ESLint Anti-Pattern #8 rule (new code must comply)
- Epic 105.2-FE: pre-flight verification step (apply to each story)
- Epic 106.3-FE: Anti-Pattern #8 Exceptions taxonomy (use canonical pattern names in any new allowlists)
- Epic 107.1-FE: `nullPreservingSum` helper (use for any new reducers if needed)
- Story 97.5-FE: multi-tenant cabinet-isolation discipline (cabinetId in all new queryKeys)

## Risks / Open Questions

1. **`AiStatusResponse` shape** — backend guide doesn't explicitly define the full shape; reverse-engineer from ASCII mockups (`weeksCollected`, `progressPct`, `missingRequirements`, `estimatedActivationDate`, `readinessLevel`). May need backend clarification mid-story if shape mismatches.
2. **Polling interval cleanup**: `useAiStatus` polls every 60s — when `readinessLevel === 'ready'`, polling should stop (or slow to 10min). Need TanStack Query `enabled` toggle or `refetchInterval` callback returning `false`.
3. **Page-level loading state**: with 3+ parallel hooks (`useAiHealth`, `useAiPreferences`, `useAiStatus`) the page needs orchestrated loading (Pattern 1 independent state-machine). Avoid blank page on slow initial fetch.
4. **Sneak-preview `trend` enum**: backend guide shows `'up' | 'stable' | 'down'` — confirm exact strings vs e.g., `'increasing'` / `'decreasing'`. Use defensive default to `'stable'`.
5. **AI-disabled state**: when `aiEnabled: false`, all forecast endpoints return empty per backend guide. Need to short-circuit page to "AI disabled" UI without firing dependent queries (waste of network).
