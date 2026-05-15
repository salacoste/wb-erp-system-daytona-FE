# CLAUDE-PATTERNS.md

Frontend architectural patterns — extracted from `CLAUDE.md` for size hygiene. Three patterns lived inline because they were load-bearing for every PR review; they still are, but the prose is large enough that hosting it here keeps the main file under the 40 KB harness threshold.

> Source pointer in main file: `CLAUDE.md` § "Defensive Frontend Principle", "Boundary Normalizer Pattern", "Multi-Source Orchestration & Visualization Patterns" (each section is now a short pointer + sub-heading list, with full prose here).

Sections:
- [Defensive Frontend Principle](#defensive-frontend-principle-story-894-fe-from-epic-87-fe-retro)
- [Boundary Normalizer Pattern](#boundary-normalizer-pattern)
- [Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)](#multi-source-orchestration--visualization-patterns-epic-92-fe)

---

## Defensive Frontend Principle (Story 89.4-FE, from Epic 87-FE retro)

**The principle:** Frontend never silently transforms data it doesn't own — it **indicates**. When an anomaly is detected in backend-sourced data, render a warning indicator, preserve the raw value, and file a backend ticket. Do NOT "fix" the display by swapping fields, coercing nulls, or clamping values — that erases evidence of the real bug.

**What counts as "data you don't own":**
- Any field from a backend API response.
- Any field computed server-side (e.g., `netProfit`, `totalOperatingProfit`, `operatingProfit`).
- Any field sourced from the WB SDK via the backend proxy.
- **Counterexample**: data the frontend itself computes (local aggregations, UI state, derived totals from already-normalized inputs) — you own that; transform it freely.

**Four anomaly categories you'll encounter:**

| Anomaly | ❌ Don't | ✅ Do |
|---|---|---|
| Field inversion / swap (e.g., `salePrice > price × 1.2` — threshold avoids false positives on legitimate adjustments) | Silently swap in the transform. | Render a warning icon + tooltip near the cell; keep raw values visible. |
| `null` where a number is expected (e.g., `cogs: null`) | `?? 0` in the transform. | Preserve null end-to-end, render `—`, add a footnote. *(See anti-pattern #8.)* |
| Impossible negative value (e.g., `organicSales: -1200`) | `Math.max(0, value)`. | Show the raw value + a warning. |
| Missing / empty response | Fall back to stale cache silently. | Render a distinct empty-state with a link to the related backend ticket. |

**Concrete illustration** (matches the `❌ BAD / ✅ GOOD` style of adjacent anti-patterns):

```typescript
// ❌ BAD — silently "fixes" the backend anomaly, evidence erased
function transform(raw: { price: number; salePrice: number }) {
  if (raw.salePrice > raw.price * 1.2) {
    return { price: raw.salePrice, salePrice: raw.price } // swapped
  }
  return raw
}

// ✅ GOOD — raw values preserved, anomaly surfaced via a flag consumers can render
function transform(raw: { price: number; salePrice: number }) {
  const anomalous = raw.salePrice > raw.price * 1.2
  return { ...raw, anomalous } // UI renders AlertTriangle + tooltip when anomalous
}
// Cite backend ticket in a comment near the detector:
// // PENDING BACKEND: request #165 — price/salePrice inversion
```

**"Show an indicator" recipe:**
- Icon: `lucide-react` `AlertTriangle` — amber for advisory, red for blocking.
- Tooltip: one sentence explaining the anomaly (template: `` `Аномалия: <what> в <ratio> раз. Возможна ошибка данных на стороне WB.` ``; real example lives in `src/components/custom/orders/OrdersTableRow.tsx`).
- Footnote: `<p className="text-xs text-amber-700 mt-2">…</p>` near tables.
- Link: include a code comment pointing to the ticket: `// PENDING BACKEND: request #NNN — <one-line>`.

**"File a backend ticket" recipe:**
- Create `docs/request-backend/NNN-SHORT-DESCRIPTION.md` (next sequential number — grep the folder first).
- Follow the existing format: Problem → Root Cause → Impact → Fix Scope → Reproduction → Resolution.
- Cross-reference the ticket in any PR or story that surfaces the anomaly.

**Canonical worked example — orders price inversion:**
Story 87.3-FE found backend occasionally returning `price < salePrice` (field inversion). Rather than swapping them in the API transform, the team rendered an `AlertTriangle` warning in the orders table and filed `docs/request-backend/165-ORDERS-PRICE-SALEPRICE-INVERSION.md`. Raw values stayed visible; the bug is now traceable, and the backend fix will remove the indicator naturally. See also `DailyCogsGapFootnote` (Story 88.2-FE) for the null-COGS equivalent.

**Related references:**
- **Anti-pattern #8 (null-vs-zero)** in `CLAUDE-ANTI-PATTERNS.md` — a specific case of this principle applied to nullable money/ratio fields.
- **Boundary Normalizer Pattern** (below) — the shape-drift flavor: normalize at the boundary, preserve null, never paper over mismatches.
- **`PENDING BACKEND:` convention** — anomaly-indicator code should always carry a `// PENDING BACKEND: request #NNN` comment so the indicator and the ticket stay linked.

---

## Boundary Normalizer Pattern

Every endpoint response that crosses the backend→frontend boundary MUST be transformed into a frontend-canonical shape at the API client layer. **Raw backend shapes never reach components or hooks.**

**Why this matters.** Backend and frontend evolve independently. Three separate bugs (Stories 84.1, 87.2, 87.3 / 88.2) each shipped because a transform was missing or silently collapsed a mismatch:

| Story | Drift | Silent collapse |
|---|---|---|
| 84.1 | Role case: backend `'owner'` vs frontend `'Owner'` | Role-gated features broke |
| 87.2 | Field naming: backend `cabinetId`/`reportsStatus` (camelCase) vs frontend `cabinet_id`/`status` (snake_case) | Backfill admin crashed on unknown `'not_started'` status |
| 87.3 / 88.2 | Nullability: backend `null` meaning "unknown" | `?? 0` in transform collapsed "unknown" into "zero" — misleading `0 ₽` / `0.0x ROAS` cells |

Each of these cost meaningful diagnostic cycles. The code looked correct, the types compiled, but the boundary silently papered over a mismatch.

**Naming conventions** (pick one consistently per module):
- `normalize<Name>Response(raw: unknown): <Name>Response` — preferred for top-level endpoint responses.
- `to<Type>(raw: unknown): <Type>` — preferred for scalar/enum coercion (e.g., `toBackfillStatus`, `toDataSource`).
- `normalize<Name>(raw: Raw<Name>): <Name>` — per-item normalization inside a list response.

**When to use** (checklist):
- ✅ Role/enum case mismatches (`'owner'` vs `'Owner'`)
- ✅ snake_case ↔ camelCase between contracts
- ✅ Nullability where backend `null` semantically means "unknown" (see anti-pattern #8)
- ✅ Date strings ↔ `Date` objects (never leave raw strings in `Date`-typed fields)
- ✅ Discriminated unions with new backend variants (fall through to a `'unknown'` sentinel)

**Canonical examples** (read these first when adding a new endpoint):

Example 1 — role-case bridging in a state store (`src/stores/authStore.ts:23-35`):
```typescript
const ROLE_CASE_MAP: Record<string, User['role']> = {
  owner: 'Owner', manager: 'Manager', analyst: 'Analyst', service: 'Service',
}

function normalizeUser(user: User): User {
  const incoming = user.role as unknown as string
  const canonical = ROLE_CASE_MAP[incoming.toLowerCase()] ?? user.role
  if (canonical === user.role) return user
  return { ...user, role: canonical }
}
// All entry points (setUser, login, refreshToken, persisted-state migration)
// route the user through normalizeUser — single source of truth.
```

Example 2 — inline transform with scalar coercers (`src/lib/api/backfill.ts:33-89`):
```typescript
function toBackfillStatus(raw: unknown): BackfillStatus {
  const s = String(raw ?? '')
  return VALID_STATUSES.has(s as BackfillStatus) ? (s as BackfillStatus) : 'not_started'
}
function toDataSource(raw: unknown): DataSource { /* same pattern */ }

export async function getBackfillStatus(): Promise<BackfillStatusResponse> {
  const raw = await apiClient.get<Record<string, unknown>[]>(`${BASE_URL}/status`, {
    skipDataUnwrap: true,
  })
  // Backend: camelCase (cabinetId, reportsStatus, overallProgress)
  // Frontend: snake_case (cabinet_id, status, progress). Normalize here.
  return (raw ?? []).map(item => ({
    // Dual-lookup (`item.cabinetId ?? item.cabinet_id`) is deliberate — it absorbs a
    // rolling backend rename without a breaking frontend change. When the backend
    // stabilizes on one casing, drop the fallback branch; until then the normalizer
    // is the hinge that keeps both contracts valid simultaneously.
    cabinet_id: (item.cabinetId ?? item.cabinet_id ?? '') as string,
    status: toBackfillStatus(item.reportsStatus ?? item.status),
    data_source: toDataSource(item.dataSource ?? item.data_source),
    // ...repeat dual-lookup for every field (full code at src/lib/api/backfill.ts:55-89)
  }))
}
```

**Anti-patterns to avoid:**
- ❌ `apiClient.get<BackendShape>(...)` followed by direct return — the TYPE lies; runtime shape is whatever the backend sent.
- ❌ `response as FrontendShape` cast to paper over a mismatch — use a normalizer, not an assertion.
- ❌ Duplicating normalization at multiple call sites — put it in the API module, one place.
- ❌ Conditional normalization (`if (response.cabinetId) { ... } else { ... }`) — always normalize unconditionally so the transform is proof, not a guess.

**Testing requirement.** Every normalizer MUST have at least 1 unit test exercising the nullability / case / variant edge cases. Reference: `src/stores/authStore.test.ts` for `normalizeUser`. Without the test, a silent regression can drop into the transform as easily as it can into a consumer.

**Cross-reference.** The three diagnostic case studies this pattern prevents: Story 84.1 (role case), Story 87.2 (backfill camelCase → snake_case), Story 87.3 + 88.2 (null vs zero). The Story 88.4 audit at `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md` classifies every file in `src/lib/api/` by normalizer presence.

### API-client rate-limit status-code coverage discipline

**Origin**: Story 96.9-FE 3rd-pass M3-2 (12-test foundation at Story 96.9 close, extended to 16 by Story 96.12-FE M-2 work) + Story 96.12-FE Decision 6 + M-2 (429 + body-fallback extension to 16 tests) → Story 97.3-FE codification (Epic 96-FE retro § A-3).

**The rule**: When introducing a new HTTP rate-limit status code (429, 503, custom backend code, etc.) in a story, **verify `src/lib/api-client.ts` retryAfter handling covers that code BEFORE consuming** the code in any consumer hook / component. Add the code to the canonical retryAfter test suite at `src/lib/__tests__/api-client.retry-after.test.ts`. Cite the verification commands + line numbers in the story's Debug Log per the **Pattern 4 § Authoritative-source-citation discipline** sub-section (locate authoritatively via `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md` — line numbers shift as the file grows; section-name lookup is stable).

**Empirical evidence** — 2 sequential extensions where rate-limit code coverage in api-client raced consumer adoption (Epic 96 retro § A-3):

| Story | Discovery | Resolution |
|---|---|---|
| 96.9-FE (3rd-pass M3-2) | `src/lib/api-client.ts` had 503 retryAfter capture but NO direct test coverage of the validation regex / range / gating logic — relied on indirect coverage via consumer tests. The 3rd-pass review surfaced the structural gap. | Added `src/lib/__tests__/api-client.retry-after.test.ts` (now 16 tests covering bounds, sign rejection, decimal rejection, whitespace trim, empty string, missing header, HTTP-date format, 502 gating). |
| 96.12-FE (Decision 6 + M-2) | New 429 flow needed for FBS export polling — api-client was 503-only. Without extending api-client first, consumer would have raced the coverage. | Extended api-client `if (status === 503)` → `if (status === 503 \|\| status === 429)`; added body-fallback for 429 (`{ retryAfter: N }` parsing — header may be absent on JSON APIs); accepted string-typed retryAfter values per M-2 review fix. |

**Pattern**: each rate-limit code introduction was a sequential api-client extension with retroactive test coverage. The codification's purpose is to make future introductions **upfront extensions, not retroactive ones**.

**Canonical examples** (current authoritative state via `grep -n "retryAfter\|503\|429" src/lib/api-client.ts` — verify line numbers at edit time as they may shift):

- `src/lib/api-client.ts:112` — current rate-limit status code coverage: `if (response.status === 503 || response.status === 429)`.
- `src/lib/api-client.ts:120-139` — body-fallback parsing for 429 when `Retry-After` header is absent (typical of JSON APIs); accepts string-typed retryAfter values. Authoritative range via `sed -n '120,139p' src/lib/api-client.ts` — block opens at the `// Fallback: parse body` comment (L120) and closes at the inner `if` block's terminator (L139).
- `src/lib/__tests__/api-client.retry-after.test.ts` — direct test coverage of validation logic (16 tests at codification time per `grep -c "^  it\|^  test"`).

**Mechanism** (operational checklist — apply when introducing a new rate-limit code in any future story):

1. Identify the new rate-limit status code (429, 503, custom backend code).
2. Run `grep -n "retryAfter\|<code>" src/lib/api-client.ts` to verify current coverage authoritatively (per Pattern 4 § Authoritative-source-citation discipline).
3. **If gap**: extend `api-client.ts` retryAfter handling to cover the new code BEFORE consuming it in any hook / component. Update body-fallback parsing if the new code may arrive without a `Retry-After` header (Story 96.12-FE precedent).
4. Add tests to `src/lib/__tests__/api-client.retry-after.test.ts` mirroring the existing test pattern (validation regex, range bounds, sign / decimal rejection, header-absent body-fallback, code gating). Story 96.9-FE 3rd-pass M3-2's 12-test foundation extended to 16 by Story 96.12-FE M-2 work.
5. Cite verification commands + line numbers in the story's Debug Log + File List per Pattern 4 § Authoritative-source-citation discipline.

**Cross-reference.** Story 96.9-FE Post-3rd-pass-review fixes M3-2 (origin of test coverage requirement); Story 96.12-FE Decision 6 + M-2 (origin of 429 + body-fallback extension); Epic 96-FE retro § A-3 (action item that produced this codification); **Pattern 4 § Authoritative-source-citation discipline** sub-section (Story 97.2-FE codification — the at-cite-time verification source method this discipline depends on; locate via `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md`); **Pattern 4 § Fix-block propagation discipline** sub-section (Story 97.1-FE codification — sibling discipline for after-the-fact prose synchronization; locate via `grep -n "^#### Fix-block propagation" CLAUDE-PATTERNS.md`). Section-name-only citations preferred over line numbers — line numbers shift as CLAUDE-PATTERNS.md grows (verified empirically: Story 97.3 insertion shifted both Pattern 4 sub-sections by 33 lines).

**Related.** This discipline is sibling to the Boundary Normalizer Pattern's main rule ("transform raw backend shapes at the API client layer"): both target API-LAYER coverage at the boundary, but the main pattern handles SHAPE coverage (field-name casing, nullability) while this discipline handles ERROR-PATH coverage (rate-limit retryAfter handling). Together they specify the full Boundary Normalizer contract.

---

## Multi-Source Orchestration & Visualization Patterns (Epic 92-FE)

These 4 patterns emerged from Epic 92-FE's retrospective (`_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md`, Insights #2/#3/#6/#7) and were tribal knowledge scattered across 6 story files. Codifying them here makes them grep-and-cite-able at PR review time — the same standard as the **Boundary Normalizer Pattern** above. The retro contains the full diagnostic history; this section contains the enforceable house rules.

(Insight #8 — the "mirrors X — keep in sync" middle-ground pattern for deferred rule-of-two extractions — is a tactical pattern already documented across retros; Story 93.1's extraction convention is the canonical example. Not re-documented here to avoid duplication.)

*Retro artifacts live under `_bmad-output/implementation-artifacts/` (gitignored — local to the author's filesystem; not distributed with the repo).*

### Pattern 1: Parallel-hook + independent-state-machine orchestration

**When to use**: multi-source dashboards where partial failure should degrade gracefully — primary data loaded + 1-2 supplementary widgets can each fail independently without blanking the page.

**Canonical example**: `src/app/(dashboard)/monitor/components/MonitorPageContent.tsx` — 3 hooks (`useMonitorSummary` primary, `useDailyMetrics` + `usePipelineGrid` supplementary), each rendered through its own skeleton/error/success state machine inside a shared `hasData` wrapper.

**Shape** (adapted from `MonitorPageContent.tsx`):
```typescript
export function MonitorPageContent() {
  const { data, isLoading, isError } = useMonitorSummary()
  // Memoize — prevents refetch storm on every render.
  const { weekFrom, weekTo } = useMemo(() => ({ weekFrom: format(subDays(new Date(), 6), 'yyyy-MM-dd'), weekTo: format(new Date(), 'yyyy-MM-dd') }), [])
  const dailyQuery = useDailyMetrics({ from: weekFrom, to: weekTo, mode: 'week' })
  const dailyData = dailyQuery.data ?? []  // ?? [] — empty array is valid; see Pattern 3 empty-fixture contract
  const { pipelineFrom, pipelineTo } = useMemo(() => { /* same memoization pattern */ }, [])
  const pipelineQuery = usePipelineGrid({ from: pipelineFrom, to: pipelineTo, resolution: 'day' })
  const hasData = !!data; const showSkeleton = isLoading && !hasData; const showFullError = isError && !isLoading && !hasData
  if (showSkeleton) return <Skeleton />
  if (showFullError) return <Alert>{/* error alert with retry */}</Alert>
  if (!hasData) return null
  return (
    <>
      {/* Primary blocks — render when hasData */}
      <MonitorKpiCards kpi={data.kpi} />
      <MonitorMetricsTable periods={data.periods} />
      {/* Supplementary — independent 3-branch: skeleton / error / data */}
      {dailyQuery.isLoading && !dailyQuery.data && <Skeleton />}
      {dailyQuery.isError  && !dailyQuery.data && <RetryButton onClick={dailyQuery.refetch} />}
      {dailyQuery.data && <MonitorWeeklyChart data={dailyData} />}
      {pipelineQuery.data && <MonitorPipelineHealth pipelines={pipelineQuery.data.pipelines} />}
    </>
  )
}
```

**Anti-pattern to avoid** (see also `CLAUDE-ANTI-PATTERNS.md` for the tactical list):
```typescript
// ❌ BAD — full-page error when ANY hook fails; blanks KPI cards for a pipeline-health failure
const { data: summary } = useMonitorSummary()
const { data: pipeline } = usePipelineGrid(/* params */)
if (!summary || !pipeline) return <ErrorPage />  // one failure kills the whole page
```

**Cross-reference.** Story 92.4-FE (introduced pattern), Story 92.5-FE (copy with buyout gauge + pipeline), Story 92.6-FE (E2E coverage of graceful degradation per hook).

**Testing requirement**: E2E coverage MUST include graceful-degradation paths (primary success + supplementary failure, and vice versa). See `e2e/monitor.spec.ts` Error states describe block for canonical examples.

---

### Pattern 2: Raw-SVG vs chart-library decision rule

Recharts lowers dev cost for complex interactive charts but raises test cost: jsdom doesn't render SVG sizes, so Recharts children (lines, axes) don't mount — unit tests require pre-planned `vi.mock` at the top of the test file. Raw SVG has more geometry upfront but is trivially testable — no mocking needed. Story 92.5-FE chose raw SVG for `MonitorBuyoutGauge` specifically to avoid Story 92.4-FE's recharts jsdom pain discovered mid-sprint. **Test-harness cost is load-bearing, not a dev-ergonomics-only choice.**

**Decision rule**:
- Semi-circular gauges, simple arcs, progress rings, small static shapes → **raw SVG**
- Line charts, bar charts, area charts, complex interactive (zoom / pan / brush / tooltip) → **recharts** + pre-plan jsdom mocks in the test file before writing any component code

**Canonical pairs**:
- Raw SVG: `src/app/(dashboard)/monitor/components/MonitorBuyoutGauge.tsx` (Epic 92 origin) + `src/app/(dashboard)/monitoring/components/HealthScoreWidget.tsx` (Epic 68 original precedent)
- Recharts: `src/app/(dashboard)/monitor/components/MonitorWeeklyChart.tsx` + `src/components/custom/dashboard/MonthlyPatternsChart.tsx`

**When you MUST use recharts** — pre-plan the jsdom mock strategy in the test file setup before writing the component. See Story 92.4-FE's retro for the `LineChart`/`Line`/`XAxis` mock template. Do not discover the mock requirement at test-writing time.

**Cross-reference.** Story 92.4-FE (recharts jsdom pain diagnosis), Story 92.5-FE (raw SVG chosen to avoid it).

---

### Pattern 3: Story-1 fixture seeding for new domains

**The rule**: any new epic touching a new domain MUST create `src/test/fixtures/<domain>-empty.ts` alongside types + normalizer in Story 1 of the epic. Downstream stories' unit tests AND E2E fixture helpers reuse it.

**Why**: retroactive extraction (what Epic 92 did in Story 92.6-FE) forces every downstream story to re-implement empty-data inline until the extraction happens. Upfront cost in Story 1 is ~30 lines; retroactive refactor is ~100+ lines across N story test files.

**Canonical example**: `src/test/fixtures/monitor-empty.ts` — shared between unit tests (`src/app/(dashboard)/monitor/components/__tests__/MonitorPageContent.test.tsx`) and E2E helpers (`e2e/fixtures/monitor-fixtures.ts`). The E2E file wraps the same factories with `page.route` handlers.

**Module shape** (adapted from `src/test/fixtures/monitor-empty.ts`):
```typescript
// Shared empty-fixture factories — consumed by unit tests AND e2e/fixtures/.
// Convention: money/ratio fields use null (CLAUDE-ANTI-PATTERNS.md anti-pattern #8); count fields use 0.
import type { MonitorSummaryResponse } from '@/app/(dashboard)/monitor/types/monitor-summary'
import type { PipelineHealthGrid } from '@/app/(dashboard)/monitoring/types/monitoring-grid'
import type { DailyMetrics } from '@/types/daily-metrics'

export function emptyMonitorSummary(): MonitorSummaryResponse { /* counts=0, money=null */ }
export function emptyPipelineGrid(): PipelineHealthGrid     { /* pipelines: [] */ }
export function emptyDailyMetrics(): DailyMetrics[]         { return [] }
```

**Checklist for Story 1 of any new-domain epic**:
1. Types defined in `src/types/<domain>.ts` or `src/app/(dashboard)/<domain>/types/`
2. Normalizer defined in `src/lib/api/<domain>.ts` (`normalize<Domain>Response`)
3. Shared-fixture module created at `src/test/fixtures/<domain>-empty.ts`
4. E2E fixture wrapper at `e2e/fixtures/<domain>-fixtures.ts` with `page.route` handlers (if E2E spec is planned)
5. At least one unit test in the first downstream test file imports from the shared-fixture module — proves the wiring before the module accumulates consumers

**Cross-reference.** Story 92.6-FE (retroactive extraction that motivated this rule), Epic 92 retro AI #5 (shared-fixture module should be seeded in Story 1 of any new-domain epic, not retroactively). Fixtures should consume the normalized types produced by the **Boundary Normalizer Pattern** (above) — never raw backend shapes.

**Testing requirement**: the shared-fixture module MUST have ≥1 test consuming it in the first downstream test file (proves the wiring). Without this, regressions slip silently into fixture factories.

---

### Pattern 4: Spec-grep discipline for story handoff

**The rule**: story authors must grep every field name / function name / type name listed in the spec's `Data sources / fields consumed` section against the actual source file BEFORE marking the story `ready-for-dev`. Prevents ghost fields and stale references from reaching the executor.

**Case studies**:

- **Story 92.4-FE H-3 structural fix** — spec listed 3 chart lines sourced from `DailyMetrics.salesCount` / `DailyMetrics.returnsCount`. Those fields didn't exist on the `DailyMetrics` type (`src/types/daily-metrics.ts`) **at spec-handoff time** (they were added later as the H-3 structural fix). The primary dev silently adapted to 2 chart lines; review caught the structural drift and flagged it as a hard review issue → required upstream type extension + aggregation change to restore the intended 3-line chart. Had the spec author grepped `src/types/daily-metrics.ts` for `salesCount` / `returnsCount` before handoff, the structural work would have been scoped into Story 92.4-FE upfront and the review round-trip avoided.

- **Epic 91-FE Story 91.2-FE sent-but-not-consumed field** — spec added `operatingProfit: number` to `FinanceDailyResponseItem` (`src/lib/api/daily-analytics/api.ts:48`) on the premise that "backend already sends it since Epics 89-91." The field exists in multiple consumer locations (`src/types/daily-metrics.ts`, `src/components/custom/sku-financials/`), but no consumer actually mapped it in the PR. Review caught it; field kept with a comment documenting "received but unmapped" status. Grep-for-new-field-USAGE (not existence) is the discipline: `grep -rn 'operatingProfit' src/components/ src/hooks/` would have shown no NEW consumer in the PR diff.

**Handoff checklist** (run before marking `ready-for-dev`):
1. For every `<filename>.ts:<field>` citation in the spec, run `grep -n '<field>' <filename>.ts`.
2. Confirm: field exists, type matches spec's assumption, nullability matches spec's handling (`number | null` vs `number` — see `CLAUDE-ANTI-PATTERNS.md` #8 for why nullability mismatches bite).
3. If any confirmation fails, fix the spec or file a structural-work task BEFORE handoff — do not leave discovery to the executor.
4. Cite the grep results in the spec's "Pre-flight" section so the executor knows verification happened.
5. For new field ADDITIONS, also grep consumer directories (`src/components/`, `src/hooks/`) for planned usage — no consumers = candidate sent-but-not-consumed duplication.
6. When the spec or any documentation prose cites "grep returns N" / "field doesn't exist" / quantitative codebase claim, run the grep at writing time and cite the count + file scope inline. Don't trust the retrospective's framing — retros are summaries, not verifications.
7. For every Acceptance Criterion framed as "no X" (constraint — e.g., "no script modification", "no new files", "CLAUDE.md only"), grep the codebase for prior cases of X. If a precedent exists under analogous reasoning, mark the AC as DEFAULT-OVERRIDABLE; otherwise mark ABSOLUTE. Document the precedent-grep result inline in the AC so the reviewer doesn't repeat the work.
8. After applying any fix that modifies prose / numbers / citations / quoted phrases, perform a TARGETED `grep -rn '<exact phrase>' <story-file> <source-files> <parallel-docs>` and review the FULL output. Untouched occurrences are findings. Author intuition systematically underestimates the parallel-locations search space (11+ recurrence chain across Epics 94-96).
9. When citing numerical/date/state facts about the codebase (line counts, commit dates, presence/absence, ratios), use git-canonical sources (`git log`, `git blame`, `git diff` body) over filesystem metadata (mtime, atime) over author memory. Cite the source method inline (e.g., `via grep -c`, `via git log --diff-filter=A`). Avoids the 3-instance 'weak-proxy-cited-as-canonical' chain (Stories 95.1, 95.3, 96.16).
10. For any new TanStack Query hook in multi-tenant context (cabinet-switching consumers), scope the `queryKey` by `cabinetId` and add a cabinet-isolation test suite (4 cabinets × cache-collision scenarios via `renderHook` + QueryClient wrapper) as part of Story 1 of any new-domain epic. Avoids the 4-instance Epic 96 cabinet-isolation defect class (Stories 96.11 / 96.12 / 96.13 / 96.14).

**Cross-reference.** Story 92.4-FE retro H-3 (spec cited chart lines sourced from `DailyMetrics.salesCount`/`returnsCount`, which didn't exist at handoff time; caught in review as a structural fix requiring upstream type extension + aggregation change), Epic 91-FE retro "What Didn't Go Well" #2, Story 93.3-FE (spec-grep surfaced that 2 of 3 target sites were already documented → downscoped the story before a single line of code was written — the rule working in the positive direction). **See also** the **Documentation-example verification** sub-section below — extends the same grep-discipline from spec field-citations to documentation prose claims.

#### Fix-block propagation discipline (Stories 94.6 → 96.16, Epic 97-FE A-1 codification)

**The rule**: After applying any fix, perform a TARGETED grep for the EXACT phrase(s) modified across ALL story-related files (story spec + source files + parallel docs + Change Log rows + Tasks/Subtasks). **Author intuition about "parallel locations" systematically underestimates the search space.**

**Empirical evidence** — 11+ recurrence chain across Epics 94-96 (Epic 95-FE retro § C-1 + Epic 96-FE retro § C-6):

| Story | 2nd-pass M-NEW manifestation |
|---|---|
| 94.6 | Numerical citations un-propagated across story file |
| 94.7 | Narrative attribution un-propagated to 6 story-file locations |
| 95.1 | 1st-pass fix synced 5 prose locations of `PENDING BACKEND` markers but missed identical markers in Tasks 2.4 / 3.4 of story file |
| 95.2 | 1st-pass L-2 fix synced source file but missed AC-1 verbatim quote |
| 95.3 | Author EXPLICITLY claimed proactive re-scan; 2nd-pass STILL found drift at line 84 (same-phrase parallel) |
| 96.10 | M2-3 story file test count drift Tasks/Subtasks vs CLAUDE.md baseline (7052/7054/7055) |
| 96.11 | M2-1 timezone-related test brittleness across multiple test files |
| 96.13 | M2-3 dash-assertion drift across 5 section tests + L2-3 premature Lessons-line at wrong row |
| 96.14 | M-4 header full-form drift |
| 96.15 | L2-1 Change Log timeline drift across multiple rows (2026-05-09 → 2026-05-08) |
| 96.16 | L2-1 "20 hits" prose drift across 3 sections (only Debug Log corrected, 2 missed) |

**The most damning case is Story 95.3**: the author EXPLICITLY claimed *"I proactively re-scanned all parallel locations"*, and the 2nd-pass review STILL found drift at line 84 (a same-phrase parallel occurrence). **The discipline does not depend on author intent; it requires a mechanical grep step.** Without the mechanical step, even a vigilant author misses occurrences.

**Mechanism** (the discipline as an operational checklist):

1. Identify the EXACT phrase modified — not the category. *"the file count was 20"* is the phrase; *"the file count"* is the category. Grep on phrases, not categories.
2. Run `grep -rn '<exact phrase>' <story-file> <source-files> <parallel-docs>` standalone — **never piped through `head` / `tail` / `wc -l`** (truncation hides hits per Story 96.16 H-1 — the very pattern this discipline addresses).
3. Review the FULL output, not the first N lines.
4. Every untouched occurrence is a finding. Apply the fix at each occurrence in the same pass.

**Optional scripted enforcement**: `scripts/check-fix-propagation.sh` (Story 97.1-FE, default path) — takes `BEFORE_PHRASE` and a list of files as args; greps for `BEFORE_PHRASE`, exits 0 if 0 hits, 1 if any hit (with per-hit `file:line` output). See script header for usage.

**Related.** CLAUDE.md § "Two-pass review discipline" — empirical countermeasure for the same defect class. The 2-pass discipline catches fix-block propagation drift in 100% of the 11+ documented recurrences below. (Independently, the 2-pass discipline has held without failure across the 24 consecutive stories of Epics 94-96 per Epic 96-FE retro § S-1 — that number is the validation streak, not the recurrence count.) The fix-block propagation discipline + 2-pass review together are the two structural countermeasures; neither alone is sufficient.

#### Documentation-example verification (Story 94.5-FE, Epic 94-FE A-7 codification)

The Pattern 4 grep-discipline applies not only to spec field-citations but also to **documentation prose** that cites quantitative codebase state — "grep returns N", "field X doesn't exist", "no consumer mapped Y", "<file>:<line> contains Z". Authors MUST run the grep at writing time and cite the result inline; don't trust a retrospective's framing — retros are summaries, not verifications. **Canonical case study**: Story 93.4-FE's first writing (artifact `_bmad-output/implementation-artifacts/93-4-fe-codify-epic-92-patterns-in-claude-md.md:93`) claimed `operatingProfit` had "0 call sites." The empirical grep returns 60 references across 21 src/ files (`grep -rn 'operatingProfit' src --include='*.ts' --include='*.tsx'`). The 2nd-pass post-merge code-review caught the falsehood (Story 93.4-FE M-NEW-2 finding); corrected text now lives in this section's Pattern 4 case study above with the more accurate "no consumer actually mapped it in the PR" framing. Cost: one preventable post-merge follow-up commit. Mechanic: checklist item 6 (above) is the at-handoff-time reminder; this paragraph is the read-once internalization.

#### Constraint precedent-grep (Story 94.7-FE, Epic 94-FE A-6 codification)

Acceptance Criteria framed as "no X" (e.g., "no script modification", "no new files", "CLAUDE.md only", "no test changes") must be classified ABSOLUTE or DEFAULT-OVERRIDABLE at spec-authoring time. Run a precedent-grep for prior cases of X — if any prior story did X under analogous reasoning, the constraint is DEFAULT-OVERRIDABLE (reviewer may invoke the precedent to override without separate justification). Otherwise ABSOLUTE (reviewer override requires explicit justification beyond precedent). Mark the classification IN the AC. **Canonical case study**: Story 93.5-FE's spec set AC-7 *"### AC-7: No script modification"* as default. Story 89.3-FE had already added `EXCLUDE_PATHS` to `scripts/check-doc-citations.sh` for the analogous reason of filtering demonstratively-bad citations. The 89-3 precedent existed at Story 93.5 spec-authoring time; the spec author didn't grep for it. The 2nd-pass review surfaced it: M-NEW-2 (baseline-arithmetic finding) revealed the spec file's citations were double-scanned, triggering the AC-7 override decision which invoked the 89-3 EXCLUDE_PATHS pattern; L-NEW-1 was the downstream CLAUDE.md escape-hatch documentation step. AC-7 was overridden mid-flight + EXCLUDE_PATHS was added for the 93-5 spec file. Cost: one preventable review round-trip — the spec author had access to the precedent and could have classified AC-7 as DEFAULT-OVERRIDABLE upfront with the override-condition documented. Mechanic: checklist item 7 (above) is the at-handoff-time reminder; this paragraph is the read-once internalization. Scope: applies to ALL "no X" framings (scope-discipline ACs, file-restriction ACs, behavior-prohibition ACs) — not just script-modification.

#### Authoritative-source-citation discipline (Stories 95.1 → 96.16, Epic 97-FE A-2 codification)

**The rule**: When claiming numerical / date / state facts about the codebase, prefer git-canonical sources (`git log`, `git blame`, `git diff` body) over filesystem metadata (`mtime`, `atime`, file size) over author memory. **Cite the source method inline** so reviewers can verify (e.g., `via grep -c`, `via git log --diff-filter=A`, `via cat <file> | wc -l`).

**Empirical evidence** — 3 documented sub-class instances across Epics 95-96 (Epic 95-FE retro § C-2 + Epic 96-FE retro § C-5):

| Story | Sub-class | Manifestation | Authoritative source it should have cited |
|---|---|---|---|
| 95.1 (M-1) | summary-visualization-misread | `git diff --stat` `+++--` visualization read as "insertions" — the leading number is touched lines (additions + deletions), NOT insertions | Raw `git diff` body — count `+` and `-` lines individually |
| 95.3 (M-1) | filesystem-metadata-cited-as-canonical | `ls -la` mtime cited as "shipped to main" date | `git log --diff-filter=A -- <path>` first-add commit timestamp |
| 96.16 (H-1) | pipe-truncation-read-as-count | `grep ... \| head -20` output's line count taken as the `wc -l` total | Standalone `grep ... \| wc -l`, OR review the FULL grep output |

**The pattern in plain prose**: each instance is "I used the easier method to extract the fact, but the easier method was lossy." The discipline is NOT "always use the hardest method" — it's **"when CLAIMING the fact, cite the AUTHORITATIVE source you derived it from, OR run the harder method to verify."** The author chose convenience (a stat summary, a filesystem mtime, a pipe-truncated grep) and treated the convenient output as if it were the canonical source.

**Mechanism** (the discipline as an operational checklist):

1. Identify the FACT being claimed — line count, commit date, presence/absence, ratio, etc.
2. Identify what AUTHORITATIVE source produces that fact — git command, raw grep output, parsed config file. Prefer git-canonical → filesystem metadata → author memory in that order.
3. Extract via the authoritative method — NOT the convenient proxy.
4. Cite the source method inline so the reviewer can verify (e.g., `(via grep -c, returned 128)`, `(via git log --diff-filter=A 8a3f9e2)`).

**Cross-reference.** Epic 95-FE retro § A-2 (origin), Epic 96-FE retro § A-2 (carry-forward). Stories 95.1 / 95.3 / 96.16 each had a 1st-pass review M-1 / H-1 finding of this defect class — three different sub-classes, same root pattern. Story 97.2-FE codifies this pattern as a sibling discipline to **Fix-block propagation discipline** (above) — both address attestation-class drift, but at different points in the workflow: fix-block propagation catches drift AFTER applying a fix; authoritative-source-citation catches drift BEFORE the claim is written.

**Related.** Pattern 4 § Fix-block propagation discipline (above — sibling sub-section, both target attestation-class drift). CLAUDE.md § "Two-pass review discipline" (empirical countermeasure for the same defect class — fresh-context reviewers reliably catch weak-proxy citations because they don't share the author's anchoring on the convenient extraction method).

#### Multi-tenant cabinet-isolation discipline (Stories 96.11, 96.12, 96.13, 96.14, Epic 97-FE A-5 codification)

**Origin**: Stories 96.11-FE H2-1 + 96.12-FE M2-2 + 96.13-FE M2-5 + 96.14-FE M-2 + H2-1 → Story 97.5-FE codification (Epic 96-FE retro § A-5 + § S-3 — 4-of-7 new-surface stories in Epic 96 manifested this defect class via 2nd-pass review).

**The rule**: For any new TanStack Query hook in multi-tenant context (any consumer that switches between cabinets), **scope the `queryKey` by `cabinetId`** — bare `[domain, ...params]` is a code smell; canonical form is `[domain, cabinetId, ...params]`. Add a **cabinet-isolation test suite as part of Story 1 of any new-domain epic**. The test suite has two acceptable tiers: **(Tier 1 — minimum bar)** factory-only string-equality tests verifying the query-key factory includes `cabinetId` (different cabinets produce different keys); **(Tier 2 — preferred)** runtime tests via `renderHook` + custom `QueryClient` wrapper exercising 4 cabinets × cache-collision scenarios with overlapping params. Tier 1 prevents the defect class structurally (cabinetId in key ⇒ no cache collision); Tier 2 verifies runtime behavior end-to-end. Don't let 2nd-pass review catch the absence retroactively.

**Empirical evidence** — 4 documented instances in Epic 96 (per Epic 96-FE retro § S-3):

| Story | Defect manifestation | Fix |
|---|---|---|
| 96.11 (H2-1) | `fbsStockQueryKeys` lacked `cabinetId` scoping → cross-cabinet cache leak when user switches cabinets mid-FBS-stock-view | Added `cabinetId` to query keys + 6-test isolation suite at `src/hooks/__tests__/fbs-stock-cabinet-isolation.test.ts` |
| 96.12 (M2-2) | FBS export polling raced with cabinet-switch — `useEffect` reset on cabinetId change was missing → cross-cabinet polling state leak | Added `useEffect(() => { /* reset polling */ }, [cabinetId])` |
| 96.13 (M2-5) | `useFbsEnhanced` hook lacked cabinet-isolation tests; cabinet-switch could surface stale data | Added 4 isolation tests to `src/hooks/__tests__/use-fbs-enhanced.test.ts` |
| 96.14 (M-2 + H2-1) | Buyout reconciliation hook cabinet-switch + earlier tests were INADEQUATE for the hook's complex cache-invalidation contract (factory-only Tier 1 tests don't exercise runtime cache behavior) | Upgraded from Tier 1 factory-only to Tier 2 runtime tests via `renderHook` + QueryClient wrapper exercising 4-cabinet × cache-collision scenarios at `src/hooks/__tests__/use-buyout-reconciliation.test.ts` — Tier 2 is the right tier for this hook |

**The pattern in plain prose**: each new-surface domain introduced a TanStack Query hook whose query key didn't scope by `cabinetId` — the author wrote `[domain, params]` instead of `[domain, cabinetId, params]`. The defect doesn't surface in single-cabinet testing; only cabinet-switching scenarios reveal it. **Each instance was caught via 2nd-pass review, never by author intuition** — same recursive-irony pattern as the 11+ documented recurrence chain (above). **Story 1 of any new-domain epic should preemptively add the isolation suite** rather than letting 2nd-pass review catch it retroactively.

**Canonical examples** (current authoritative paths via `grep -rln "cabinet.*isolation\|cabinetId.*query.*key" src/hooks/__tests__/`; shape verified via `grep -c "renderHook\|QueryClient" <file>` at edit time):

- **Tier 1 (factory-only string-equality)**:
  - `src/hooks/__tests__/fbs-stock-cabinet-isolation.test.ts` — Story 96.11 H2-1 fix; dedicated isolation test file. 0 `renderHook`/`QueryClient` hits — verifies the query-key FACTORY includes `cabinetId` via string-equality assertions on `JSON.stringify(queryKey)`. Lightweight; structurally prevents the defect class without runtime overhead.
  - `src/hooks/__tests__/use-fbs-enhanced.test.ts` — Story 96.13 M2-5 fix; dedicated isolation test file (4 tests under a single `describe('fbsEnhancedQueryKeys — multi-tenant cabinet isolation (M2-5)')` block; structurally identical to fbs-stock-cabinet-isolation, NOT integrated alongside main hook tests). 0 `renderHook`/`QueryClient` hits.
- **Tier 2 (runtime via renderHook + QueryClient)**:
  - `src/hooks/__tests__/use-buyout-reconciliation.test.ts` — Story 96.14 M-2 + H2-1 fix; full hook test with cabinet-isolation via `renderHook` + custom `QueryClient` wrapper (12 `renderHook`/`QueryClient` hits per `grep -c`). Exercises actual TanStack Query cache invalidation across cabinet switches end-to-end. Upgraded from Tier 1 factory-only tests (which were INADEQUATE for this hook's complex cache-invalidation contract — Tier 1 is acceptable as a category but insufficient for hooks with non-trivial cache invariants); preferred shape for hooks with complex cache-invalidation contracts.

**Mechanism** (the discipline as an operational checklist):

1. When introducing a new TanStack Query hook, draft the query key. Ask: "Will any consuming surface switch between cabinets without unmounting the component tree?"
2. If yes (any cabinet-switching context — most dashboard-style multi-tenant surfaces qualify), scope the key: `[domain, cabinetId, ...params]`. Bare `[domain, ...params]` is a code smell.
3. As part of Story 1 of any new-domain epic, add a cabinet-isolation test suite. Choose the tier per the hook's complexity: **Tier 1 (factory-only)** for hooks with simple cache contracts — string-equality assertions on `JSON.stringify(queryKey)` confirming `cabinetId` is in the key; **Tier 2 (renderHook + QueryClient)** for hooks with complex cache-invalidation contracts — runtime tests exercising 4 cabinets with overlapping params to verify no cache collision via the actual TanStack Query cache.
4. Reference one of the canonical examples above as the test template: `fbs-stock-cabinet-isolation.test.ts` or `use-fbs-enhanced.test.ts` (both Tier 1 dedicated isolation files) for factory-only; `use-buyout-reconciliation.test.ts` for Tier 2 renderHook + QueryClient.
5. Cite the verification in story Debug Log per **Pattern 4 § Authoritative-source-citation discipline** (above — locate authoritatively via `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md`).

**Cross-reference.** Stories 96.11-FE Post-2nd-pass-review fixes H2-1; 96.12-FE Post-2nd-pass-review fixes M2-2; 96.13-FE Post-2nd-pass-review fixes M2-5; 96.14-FE Post-2nd-pass-review fixes M-2 + H2-1; Epic 96-FE retro § A-5 (action item that produced this codification); Epic 96-FE retro § S-3 (the 4-of-7 empirical evidence breakdown); **Pattern 4 § Authoritative-source-citation discipline** sub-section (Story 97.2-FE codification — locate via `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md`); **Pattern 4 § Fix-block propagation discipline** sub-section (Story 97.1-FE codification — locate via `grep -n "^#### Fix-block propagation" CLAUDE-PATTERNS.md`). Section-name-only citations preferred over `:N` line numbers per Story 97.3-FE L2-1 lesson — line numbers shift recursively as CLAUDE-PATTERNS.md grows (verified empirically: Story 97.3 insertion shifted Pattern 4 sub-sections by 33 lines; Story 97.5's own insertion appended ~39 lines AT END of Pattern 4 — earlier sub-section line numbers UNCHANGED, but future codifications inserting in the middle WOULD shift downstream sub-sections).

**Related.** This discipline is sibling to all Pattern 4 sub-sections — together they form the attestation discipline cluster the 2-pass review process (CLAUDE.md § Two-pass review discipline § "Why this is structurally permanent") catches. Cabinet-isolation specifically targets **multi-tenant cache-collision** as a sub-class of attestation drift: the author's mental model of the query (`[domain, params]`) and the runtime reality (cache-keyed by query-key tuple) drift when `cabinetId` is omitted; only cabinet-switching scenarios surface it.

## Anti-Pattern #8 Exceptions (Story 106.3-FE, from Epic 105-FE + 106-FE)

**Background**: CLAUDE.md § Known Anti-Patterns #8 says `?? 0` on money/ratio fields lies — preserve `null`, render `—`. Story 105.1-FE added an ESLint rule that flags this. Story 106-FE triaged the 64 pre-existing allowlists and found that 63 of 64 are LEGITIMATE exceptions — the `?? 0` is correct semantically. This section codifies the 6 patterns where `?? 0` is justified, so future authors can classify their use case before adding an `eslint-disable-next-line no-restricted-syntax` comment.

**Format for the allowlist comment**:
```typescript
// eslint-disable-next-line no-restricted-syntax -- <PATTERN-NAME>: <one-line specific rationale>
```

### Pattern: BACKEND-CONTRACT-NON-NULL

**Trigger**: The backend service explicitly types the field as `number` (not nullable). Verified by reading the response DTO at the source, the test-api/*.http example, or the controller signature.

**Canonical example**: `src/app/(dashboard)/analytics/shared/calculate-margin-stats.ts:25`
```typescript
// eslint-disable-next-line no-restricted-syntax -- BACKEND-CONTRACT-NON-NULL: CabinetExpenses.sales_gross is typed number in /v1/finance/cabinet-expenses response
revenue: data.sales_gross ?? 0,
```

**Anti-pattern (don't confuse)**: If the backend response shape declares the field optional (`field?: number`) or explicitly nullable (`field: number | null`), this pattern does NOT apply. Use the genuine null-preservation pattern from CLAUDE.md Anti-Pattern #8.

### Pattern: SEMANTIC-ZERO

**Trigger**: 0 is the legitimate "no activity" value for this field. The distinction `null = unknown` vs `0 = no activity` collapses for this specific field because both mean the same thing operationally.

**Canonical example**: `src/lib/daily/aggregation.ts:59` (advertising spend on a day with no ads)
```typescript
// eslint-disable-next-line no-restricted-syntax -- SEMANTIC-ZERO: total_spend 0 = no ads ran that day (Story 91.2-FE)
advertising: advertising?.total_spend ?? 0,
```

Also `src/components/custom/price-calculator/PriceCalculatorResults.tsx:74` (`vat_pct: 0` = non-VAT payer in RU tax classification).

**Anti-pattern (don't confuse)**: `revenue: 0` is NOT a semantic-zero (it could mean "ad ran but generated no revenue" OR "we don't have attribution data" — distinct states). The pattern requires that the field's domain *cannot* distinguish the two.

### Pattern: AGGREGATION-REDUCE

**Trigger**: A `reduce`/`fold` operation summing values across items (weeks, days, SKUs). Null per item = no contribution to the sum. The reducer's output is a single aggregate value where null per item is correctly elided.

**Canonical example**: `src/app/(dashboard)/analytics/advertising/utils/over-attribution-utils.ts:22-25`
```typescript
const totalRevenue = items.reduce(
  // eslint-disable-next-line no-restricted-syntax -- AGGREGATION-REDUCE: revenue null per week = no data; treated as 0 contribution to sum (Story 88.2-FE)
  (sum, item) => sum + (item.revenue ?? 0),
  0
)
```

**Anti-pattern (don't confuse)**: If the aggregate is itself displayed AND the "all items null" case should render as `—` (not `0`), the AGGREGATION-REDUCE pattern is insufficient — use `nullPreservingSum` from `src/lib/aggregation-helpers.ts` (Story 107.1-FE; canonical use site: `table-columns.ts` calculateTotals reducer).

### Pattern: DISPLAY-GUARD

**Trigger**: Null = absent line item, but the row is rendered for visual consistency (table layout, breakdown chart, structured comparison). Value of `0` in the rendered cell is the intended UX.

**Canonical example**: `src/components/custom/pnl-waterfall/OtherAdjustmentsRows.tsx:52`
```typescript
// eslint-disable-next-line no-restricted-syntax -- DISPLAY-GUARD: wb_promotion_cost null = absent; visibility guard checks > 0
{(deductions?.wb_promotion_cost ?? 0) > 0 && (
  <Row label="WB Продвижение" value={deductions.wb_promotion_cost} />
)}
```

**Anti-pattern (don't confuse)**: If the cell would render the literal "0₽" to the user (vs being hidden/skipped), the user sees fake "zero data" when the true state is "unknown." Use a `—` render guard instead.

### Pattern: DEBUG-LOG

**Trigger**: Field used only in `console.log` / debug output / boolean checks — never rendered to user-facing UI. Null→0 collapse in log strings is harmless.

**Canonical example**: `src/lib/daily/aggregation.ts:73`
```typescript
// eslint-disable-next-line no-restricted-syntax -- DEBUG-LOG: wb_sales_gross used only in boolean check; not user-visible
if ((finance?.wb_sales_gross ?? 0) > 0) {
  console.debug('[daily] day has sales:', { date, sales: finance.wb_sales_gross })
}
```

**Anti-pattern (don't confuse)**: If the boolean check determines whether to RENDER a UI element (vs whether to LOG), the result is user-visible behavior — not DEBUG-LOG. Use DISPLAY-GUARD pattern instead.

### Pattern: TEST-ASSERTION

**Trigger**: A TypeScript type guard earlier in scope narrows the field to non-null, but TypeScript doesn't propagate the narrowing into the assertion expression. `?? 0` is compiler-appeasement, not runtime fallback.

**Canonical example**: `src/hooks/__tests__/useAdvertisingAnalytics.test.ts:415`
```typescript
// At line 410: expect(result.current.data?.revenue).toBeGreaterThan(0)  // already narrows to non-null
// At line 415: but TypeScript still wants:
// eslint-disable-next-line no-restricted-syntax -- TEST-ASSERTION: revenue asserted non-null above via type guard; ?? 0 is compiler-only
expect(result.current.data!.revenue ?? 0).toBe(1000)
```

**Anti-pattern (don't confuse)**: If the test is asserting behavior on a real null case (not narrowing), the `?? 0` IS a real fallback and the test is wrong. Use `.toBeNull()` instead.

### Process: classifying a new allowlist

When you encounter a new `?? 0` violation that the ESLint rule flags:

1. **Read the backend contract** for the field. Is it explicitly `number` (BACKEND-CONTRACT-NON-NULL)? Or `number | null`?
2. **If `number | null`**: can `0` and `null` be operationally distinguished? If NO → SEMANTIC-ZERO. If YES → see below.
3. **What's the code doing?** Reduce/fold → AGGREGATION-REDUCE. Rendering a row → DISPLAY-GUARD. Logging → DEBUG-LOG. Test assertion → TEST-ASSERTION.
4. **If none of the patterns fit**: the violation is a REAL Anti-Pattern #8 — convert to `?? null` and widen the type. Add a display `—` guard at the consumer.
5. Use the comment format: `// eslint-disable-next-line no-restricted-syntax -- <PATTERN-NAME>: <one-line rationale specific to this field>`.

**Cross-reference**: CLAUDE.md § Known Anti-Patterns #8 (the underlying anti-pattern this section provides exceptions to); Story 105.1-FE (ESLint rule); Story 106.1-FE (canonical "real violation fix" example: net_profit nullability); Story 106.2-FE (sweep that established the 6-pattern taxonomy); Epic 106-FE retrospective.
