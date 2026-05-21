# AI/ML Forecast Module Architecture

**Authored**: 2026-05-17 — Story 109.6-FE (Epic 108-FE retro A-5)
**Target audience**: Epic 110-FE (Evaluations/Feedback/CSV Export) and Epic 111-FE (Admin features) contributors.

This document is the entry-point reference for the AI/ML Forecast module. It covers file structure, hook contracts, component composition, extension points, locked decisions, and anti-patterns to avoid. Read in full before touching any `src/types/ai/`, `src/lib/api/ai/`, or `src/hooks/use*Ai*` file.

---

## Purpose

The AI/ML Forecast module integrates with the backend AI engine (`/v1/ai/*` endpoints) to surface forecast readiness states, per-model performance metrics, and actionable training controls. It was built incrementally over Epics 108-FE and 109-FE, then documented here for forward-compatibility into Epics 110-111.

The module operates in three readiness states (collecting / sneak_preview / ready) driven by backend data availability. UI components and routes adapt per state. The architecture is intentionally additive — new epics extend, not replace, the existing infrastructure.

---

## File Structure

### Types — `src/types/ai/`

7 files. All canonical frontend types live here. **Never import raw backend shapes into components.**

| File | Domain | Key exports |
|------|--------|-------------|
| `index.ts` | Barrel re-export | Re-exports all types below + backward-compat for pre-108 consumers |
| `forecast.ts` | Forecast response + model types | `ForecastEntry`, `ModelType`, `MODEL_TYPES`, `MODEL_TYPE_LABELS` |
| `status.ts` | Readiness state + status response | `AiReadinessLevel`, `AiStatusResponse` |
| `system.ts` | Health + global system info | `AiHealthResponse`, `AiSystemInfo` |
| `models.ts` | Model list + detail | `AiModel`, `AiModelsResponse` |
| `trends-sneak.ts` | Trends + sneak-preview data | `AiTrendsResponse`, `AiSneakPreviewResponse` |
| `evaluations.ts` | Evaluations + feedback (stub) | `AiEvaluation`, `AiFeedback` — stubs for Epic 110 [[108.1-FE]] |
| `admin.ts` | Admin-only types (stub) | `AiAdminConfig` — stubs for Epic 111 [[108.1-FE]] |

**Backward-compat barrel**: `src/types/ai-forecast.ts` (pre-Epic 108 path) re-exports from `src/types/ai/index.ts`. Epic 103/104 consumers continue working without change.

### API Client — `src/lib/api/ai/`

7 files mirroring the types directory. Each file contains fetcher functions + `normalize*` boundary normalizers.

| File | Endpoints | Normalizers |
|------|-----------|-------------|
| `index.ts` | Barrel re-export | — |
| `forecast.ts` | `GET /v1/ai/forecast` | `normalizeForecastEntry` — maps `predictedUnits` → `predictedSales` |
| `status.ts` | `GET /v1/ai/status` | `normalizeAiStatus` — defaults unknown readinessLevel to `'collecting'` |
| `system.ts` | `GET /v1/ai/health`, `GET /v1/ai/system` | `normalizeAiHealth` |
| `models.ts` | `GET /v1/ai/models`, `GET /v1/ai/models/:id`, `POST /v1/ai/models/:id/train` | `normalizeAiModel` |
| `trends-sneak.ts` | `GET /v1/ai/trends`, `GET /v1/ai/sneak-preview` | `normalizeAiTrends`, `normalizeAiSneakPreview` |
| `evaluations.ts` | `GET /v1/ai/evaluations`, `POST /v1/ai/feedback` (stubs) | — |
| `admin.ts` | Admin endpoints (stubs) | — |

**Backward-compat barrel**: `src/lib/api/ai-forecast-api.ts` re-exports from `src/lib/api/ai/index.ts`.

---

## Hook Contracts

### Cabinet-Isolation Discipline [[97.5-FE]]

Every per-cabinet hook **must** scope its `queryKey` by `cabinetId`. Global hooks (health, system) are explicitly exempt with a JSDoc comment explaining why.

```typescript
// Per-cabinet: include cabinetId
export const aiStatusKeys = {
  byCabinet: (cabinetId: string | null) => ['ai', 'status', cabinetId] as const,
}

// Global (no cabinet context per backend guide):
export const aiHealthKeys = {
  all: ['ai', 'health'] as const,
}
```

Failure to scope by `cabinetId` causes stale data when the user switches cabinets — a production defect class with 4 prior instances in Epic 96 [[97.5-FE]].

---

## TanStack Query invalidation scoping decision tree

**Updated**: 2026-05-20 — Story 112.4-FE (Epic 111-FE retro A-4 action item)

When a mutation succeeds, choosing the right `invalidateQueries` scope balances correctness (stale
data refresh) vs. performance (avoiding unnecessary refetches). This decision tree applies to ALL
mutations in the AI module. Cabinet-scoping (Story 97.5-FE rule) is orthogonal — it is ALWAYS
required regardless of which level you choose.

### Decision Tree

```
Mutation succeeded. What should I invalidate?
│
├─ Does this mutation affect ALL AI subdomains simultaneously?
│  (e.g., a "reset all AI data" admin action that wipes models + evaluations + preferences)
│  YES → Level 1: ['ai']  ← DEFAULT: AVOID. See anti-pattern below.
│  NO  ↓
│
├─ Does this mutation affect ONE domain (evaluations, models, preferences, etc.)?
│  YES → Level 2: ['ai', domain, cabinetId]  ← STANDARD choice for domain-local mutations
│  NO  ↓
│
└─ Does this mutation affect a single entity within a domain (specific forecastId, modelId)?
   YES → Level 3: ['ai', domain, cabinetId, 'detail', entityId]  ← narrow, per-entity cache
```

### Level 1 — `['ai']` root invalidation

**Use**: Only when a single mutation may affect ALL AI subdomains simultaneously.

**Default: AVOID.** Root invalidation scopes into every AI cache prefix, including hooks that
have nothing to do with the mutation: `useAiHealth`, `useAiStatus`, `useAiTrends`,
`useAiSneakPreview`, `useAiPreferences`, `useAiForecast`, `useAiModels`, `useAiEvaluations`,
`useAiSkuAccuracy` — 9 sibling caches refetch unnecessarily (Story 110.4-FE F-1 lesson on
prefix scope-creep).

```typescript
// Level 1 — rarely correct; cite why all 9 sibling caches must refresh
await queryClient.invalidateQueries({ queryKey: ['ai'] })
// COMMENT: invalidating root because <explicit reason why all AI subdomains are stale>
```

### Level 2 — `['ai', domain, cabinetId]` domain-local invalidation

**Use**: Standard choice for mutations that affect one domain only.

Canonical examples from Epic 110–112:

```typescript
// feedback POST → evaluations cache only (Story 110.4-FE F-1: narrow scoping)
await queryClient.invalidateQueries({
  queryKey: ['ai', 'evaluations', cabinetId],
})

// model rollback → models cache for this cabinet
// (Story 112.1-FE F-2: intentional over-invalidation acceptable when documented in code)
await queryClient.invalidateQueries({
  queryKey: ['ai', 'models', cabinetId],
  // NOTE: intentionally invalidates the full models list (not just the rolled-back model's
  // detail) because the list status badge must update immediately after rollback.
})

// AI preferences toggle → preferences cache only (Story 112.2-FE AC-4: narrow invalidation default per spec)
await queryClient.invalidateQueries({
  queryKey: ['ai', 'preferences', cabinetId],
})
```

### Level 3 — `['ai', domain, cabinetId, 'detail', entityId]` per-entity invalidation

**Use**: For mutations that affect a single known entity and no other cache entries need refreshing.

```typescript
// Hypothetical: feedback on a specific forecastId only (if query shape supports it)
await queryClient.invalidateQueries({
  queryKey: ['ai', 'evaluations', cabinetId, 'detail', forecastId],
})
```

### Cabinet-scoping reminder

All Level 2 and Level 3 invalidations MUST include `cabinetId` (Story 97.5-FE rule). Omitting it
invalidates the same domain across ALL cabinets the user has visited in this session — a
cross-cabinet cache pollution defect.

```typescript
// Wrong — invalidates evaluations for every cabinet in cache
await queryClient.invalidateQueries({ queryKey: ['ai', 'evaluations'] })

// Correct — scoped to the active cabinet
await queryClient.invalidateQueries({ queryKey: ['ai', 'evaluations', cabinetId] })
```

### Closing rule

**When in doubt, scope NARROWLY. Over-invalidation is reversible (causes extra refetches, degrades
performance); cache-stale-after-mutation bugs are user-visible (shows outdated data, breaks trust).**
Over-invalidation that is intentional and narrow (e.g., Story 112.1-FE F-2 rollback invalidating
the full models list) is acceptable when documented with a comment explaining the intent.

---

### Polling Intervals

| Hook | Interval | Stop condition | Story |
|------|----------|----------------|-------|
| `useAiHealth` | 30 000 ms | Never (always poll) | [[108.2-FE]] |
| `useAiStatus` | 60 000 ms | `readinessLevel === 'ready'` | [[108.3-FE]] |
| `useTrainAiModel` training-trigger | 5 000 ms | `status === 'trained'` \| error | [[109.4-FE]] |
| All other hooks | No polling | — | — |

Polling is implemented via TanStack Query `refetchInterval` callback (not `useRef`/`setInterval`). The callback receives the query object and returns `false` to stop or an interval in ms.

```typescript
// Correct pattern (Story 108.3-FE, Story 109.4-FE)
refetchInterval: (query) => query.state.data?.readinessLevel === 'ready' ? false : 60_000

// Wrong pattern — do not use (Story 109.4-FE F-1 defect)
// const intervalRef = useRef<NodeJS.Timeout>()
// intervalRef.current = setInterval(() => refetch(), 5000)
```

### `enabled` Gates

All hooks that need `cabinetId` use:
```typescript
enabled: !!cabinetId
```

Hooks that are AI-preference-gated additionally check:
```typescript
enabled: !!cabinetId && aiEnabled === true
```

`useAiStatus` accepts an `enabled` prop so the parent can pass `aiEnabled` from `useAiPreferences`. This keeps the polling from firing when the AI engine is toggled off — without violating Rules of Hooks (hook is always called; only the `enabled` flag changes).

### Default Query Config

| Setting | Value | Rationale |
|---------|-------|-----------|
| `staleTime` | 60 000 ms | Matches poll interval; prevents double-fetch |
| `gcTime` | 300 000 ms (5 min) | Standard project default |
| `retry` | 1 | One retry on failure; prevents cascade on backend restart |

---

## Component Composition

### 3 Readiness States

The backend's `readinessLevel` field drives all UI branching:

| State | Meaning | Weeks of data | UI component |
|-------|---------|---------------|--------------|
| `collecting` | Not enough data yet | < 6 | `CollectingProgressTracker` |
| `sneak_preview` | Preliminary data | 6–11 | `SneakPreviewSection` |
| `ready` | Full AI enabled | 12+ | `ForecastTable` + `ForecastChart` + `ForecastMetrics` |

### State Machine — `resolveReadinessRoute` [[108.3-FE]]

The routing decision is a **pure function** (not a hook) in `src/app/(dashboard)/analytics/forecast/components/readiness-router.ts`. It maps `(readinessLevel, aiEnabled)` → a route string or `null`.

```typescript
// Pure function — testable without React
export function resolveReadinessRoute(
  readinessLevel: AiReadinessLevel | undefined,
  aiEnabled: boolean,
): string | null
```

`ForecastPageContent` calls `useAiStatus` → `resolveReadinessRoute` → renders the appropriate sub-component or redirects. The `useAiStatus` hook uses `shouldPollAiStatus` (also a pure function) for the `refetchInterval` callback.

### Component Tree (Forecast Page)

```
ForecastPageContent
├── ForecastPageHeader
│   ├── AiEngineStatusBadge    (health indicator, 30s polling)
│   └── AiPreferencesToggle    (enable/disable AI engine)
├── ForecastParamsCard         (model type selector + date range)
│   └── ModelTypeSelector      (7 types, shared MODEL_TYPE_LABELS)
└── [readinessLevel branch]
    ├── collecting  → CollectingProgressTracker
    │                 └── TopSkusTable
    ├── sneak_preview → SneakPreviewSection
    └── ready       → ForecastTable + ForecastChart + ForecastMetrics
```

### Component Tree (Models Page)

```
/analytics/models  →  ModelListSection
                       ├── per-row: TrainModelButton (5s polling when training)
                       └── row click → /analytics/models/[id]/performance
                                       └── ModelPerformanceDetail
                                           └── MAPE trend chart (recharts)
```

Route helpers (never inline templates):
- `buildModelPerformanceRoute(id)` in `src/lib/routes.ts` [[109.5-FE]]

### Locked Decisions (Epic 109 Spec)

These decisions are closed — do not revisit without an explicit retro action item:

| ID | Decision | Rationale |
|----|----------|-----------|
| Q1 | Separate `/analytics/models` route (not embedded in forecast page) | Avoids page-size violation; models page has its own data contract |
| Q2 | `spread = max(0.10, 1 − confidence) × predictedSales` for confidence band | Matches backend guide formula; preserves minimum visible band |
| Q3 | Visual UAT deferred until test cabinet reaches `ready` state | `collecting` state is the only observable state in test environment |
| Q4 | Per-row Train button (not page-level) | Each model trains independently; page-level button misleads users |

---

## Extension Points for Epic 110-FE (Evaluations + Feedback + CSV Export)

Story 108.1 pre-created stub files for all Epic 110 domain objects [[108.1-FE]]:
- `src/types/ai/evaluations.ts` — `AiEvaluation`, `AiFeedback` types
- `src/lib/api/ai/evaluations.ts` — fetcher stubs for `GET /v1/ai/evaluations` and `POST /v1/ai/feedback`

### Adding Evaluations List
1. Implement `normalizeAiEvaluation` in `src/lib/api/ai/evaluations.ts`.
2. Create `useAiEvaluations` hook in `src/hooks/useAiEvaluations.ts` — scope queryKey by `cabinetId` (per-cabinet data).
3. Add `EvaluationsSection` component under `src/app/(dashboard)/analytics/models/components/`.
4. Register route in `src/lib/routes.ts` using `buildXxxRoute` pattern [[109.5-FE]].

### Adding Feedback (POST mutation)
Follow the `useTrainAiModel` pattern [[109.4-FE]]:
- `useMutation` with `mutationFn` calling `postAiFeedback`.
- Optimistic update: `onMutate` → cache update → `onError` rollback.
- Invalidate `aiEvaluationsKeys.byCabinet(cabinetId)` on `onSuccess`.

### CSV Export
- Add export button to `ModelListSection` or `ModelPerformanceDetail`.
- Client-side CSV generation using existing `formatCurrency`/`formatPercentage` formatters (Russian locale).
- No new backend endpoint needed if data is already in the query cache.

---

## Extension Points for Epic 111-FE (Admin Features, Owner-Only)

### Admin Role-Gating Pattern [[109.3-FE]]

The `isAdmin` check is performed via the auth store:
```typescript
// Sidebar.tsx:29 (Story 109.3 precedent)
const isAdmin = user?.role === 'owner' || user?.role === 'manager'
```

Admin-only components should follow this pattern:
```typescript
const { user } = useAuthStore()
const canAccess = user?.role === 'owner'
if (!canAccess) return null  // or redirect to /dashboard
```

### Registering Admin-Only Routes
1. Add route constant in `src/lib/routes.ts` with `ADMIN_` prefix.
2. Register in Next.js `app/(dashboard)/analytics/admin/page.tsx`.
3. Guard in `Sidebar.tsx` conditional render (existing pattern: `{isAdmin && <NavItem />}`).

### Model Rollback Flow
- Add `POST /v1/ai/models/:id/rollback` fetcher in `src/lib/api/ai/models.ts`.
- Add `useRollbackAiModel` hook mirroring `useTrainAiModel`.
- Surface in `ModelPerformanceDetail` with the same `disabled-while-pending` pattern used by `TrainModelButton`.

---

## Anti-Patterns to Avoid

### 1. Re-declaring `MODEL_TYPE_LABELS` [[109.3-FE]]

`MODEL_TYPE_LABELS` and `MODEL_TYPES` are defined once in `src/types/ai/forecast.ts` and re-exported via `src/types/ai/index.ts`. Do not declare a local copy in any component or hook file. Story 109.3 Task 2 extracted this from a per-component declaration — do not regress.

```typescript
// Wrong
const MODEL_TYPE_LABELS = { linear: 'Линейная', ... }  // local copy

// Correct
import { MODEL_TYPE_LABELS } from '@/types/ai'
```

### 2. Bypassing the Boundary Normalizer [[108.1-FE]]

Raw backend shapes must never reach components. Every `apiClient.get<BackendShape>()` call must be followed by a `normalize*` function before the result leaves the API layer.

```typescript
// Wrong — type lies, raw shape reaches hook
const data = await apiClient.get<FrontendShape>('/v1/ai/models')

// Correct
const raw = await apiClient.get<BackendAiModel[]>('/v1/ai/models')
return raw.map(normalizeAiModel)
```

### 3. Inline Route Templates Instead of `buildXxxRoute` [[109.5-FE]]

Story 109.5 F-6 caught inline template literals for dynamic routes. All route patterns belong in `src/lib/routes.ts`.

```typescript
// Wrong
router.push(`/analytics/models/${model.id}/performance`)

// Correct
import { buildModelPerformanceRoute } from '@/lib/routes'
router.push(buildModelPerformanceRoute(model.id))
```

### 4. `useRef` Polling Instead of TanStack `refetchInterval` [[109.4-FE]]

Story 109.4 F-1 (HIGH severity): using `useRef` to hold a `setInterval` handle for polling creates cleanup bugs and bypasses TanStack Query's cache lifecycle. Always use `refetchInterval` callback.

### 5. `?? 0` on MAPE / Money / Ratio Fields (AP#8)

MAPE, revenue, margin, and ratio fields are nullable. `?? 0` lies — `null` means "unknown", not zero. Use `?? null` and render `—` for null values. ESLint enforces this for known field-name patterns via `no-restricted-syntax` in `eslint.config.js`.

```typescript
// Wrong
const mape = entry.mape ?? 0

// Correct
const mape = entry.mape ?? null
// In JSX: {mape !== null ? formatPercentage(mape) : '—'}
```

### 6. Status Values as Raw Strings in UI (WCAG + Defensive Frontend)

Status badges must use the `Badge` component with semantic variant, not raw strings. Story 109.5 F-1 (CRITICAL): raw English `status` string rendered instead of localized Badge.

```typescript
// Wrong
<span>{model.status}</span>

// Correct
<Badge variant={statusVariant(model.status)}>
  {MODEL_STATUS_LABELS[model.status]}
</Badge>
```

---

## 2-Pass Review Discipline Reminder

This module involves polling hooks, async mutations, and multi-branch rendering — exactly the code classes where the 2-pass adversarial review discipline finds the most defects [[94.3-FE]], [[97.1-FE]], [[97.4-FE]].

Per CLAUDE.md § Two-pass review discipline: every behavior-changing source change (new hooks, new normalizers, new polling logic, new mutations) requires TWO adversarial review passes in fresh contexts before commit. The consecutive-story streak entered Epic 110 at **50+**. Do not break it.

Stories where 2-pass review caught HIGH or CRITICAL defects in this module:

| Story | Severity | What was caught |
|-------|----------|-----------------|
| 108.1-FE | HIGH | Confidence scale 0-100 vs 0-1 ambiguity |
| 108.2-FE | HIGH | `useMutation` 4th generic missing → unsafe cast |
| 108.3-FE | HIGH | Unconditional polling when AI disabled |
| 108.5-FE | HIGH | TrendIcon missing aria-label + Russian text (WCAG) |
| 109.4-FE | HIGH | `useRef` polling instead of `refetchInterval` |
| 109.5-FE | CRITICAL | Raw English status string instead of Badge component |

---

## Related Process Documents

- `docs/process/two-repo-coordination.md` — backend/frontend sync mechanism [[107.3-FE]]
- `docs/process/halt-vs-prose-investigation-2026-05.md` — enforcement vs prose analysis [[97.7-FE]]
- `CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern — canonical normalizer spec
- `CLAUDE-PATTERNS.md` § Multi-Source Orchestration — multi-hook dashboard patterns
- `CLAUDE-ANTI-PATTERNS.md` — full AP#1–9 reference with code examples
- `docs/api-integration-guide.md` — full AI endpoint catalog with HTTP examples
