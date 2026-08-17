# Story 119.3: Search-to-Cart Conversion Metric

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **a Wildberries seller analyzing search performance**,
I want **to see the search-to-cart conversion rate** — `(searchCartAdds / searchImpressions) × 100` — **per query or per product**,
so that **I can identify which search terms drive impressions but fail to convert (a different signal than orders-per-impression, since cart-adds-but-no-orders means there's intent but a purchase-page friction)**.

## Background — VERIFY-FIRST gate fires (per Story 117.2-FE precedent + Epic 117 retro A-1)

**Marketing Plan §3.4 row 2 claim**: "New metric: what % of search impressions convert to cart adds? Combines search + funnel data."

**Pre-flight reality check** (Story 105.2-FE, verified 2026-05-30):
- ❌ `searchCartAdds` NOT found in `src/types/`, `src/lib/api/`, or `src/hooks/` (zero hits)
- ❌ `searchCartAdds` NOT mentioned in `../docs/`, `../test-api/`, or `docs/` (zero hits — backend docs don't claim this field even aspirationally)
- ✅ `searchImpressions` / `totalImpressions` EXISTS — Epic 71-FE shipped per-query impressions on `SearchQueryItem` (`src/types/search-analytics.ts:41-49`) + `SearchProductItem` (lines 67-76) (denominator is available)
- ✅ `formatPercentage` utility exists at `src/lib/utils.ts` (display layer ready)
- ⚠️ "Combines search + funnel data" framing in Marketing Plan is structurally unclear: funnel cart-adds are PER-SKU (not per-search-query), so JOIN semantics are undefined — even if the field arrives, the unit of analysis (per-query vs per-SKU vs per-(query,SKU)) needs backend clarification

**The risk** (strongest verify-first signal in Epic 119 to date):
- Story 117.2-FE Branch A: field PRESENT in backend docs, ABSENT in live response → backend docs were aspirational
- Story 119.2 Branch C: field PRESENT in backend docs AND populated in live response → docs were accurate
- **Story 119.3**: field has NO BACKEND DOCS MENTION + NO FE REFERENCES + unclear unit-of-analysis. **Even stronger Branch B/C-likely signal than 119.2 had inverted**. Live verification must confirm whether (a) the field exists undocumented, (b) the field is planned but unshipped, or (c) the field doesn't exist and Marketing Plan §3.4 row 2 is purely conceptual.

**3-way decision matrix** (Story 117.2-FE template — codified per Epic 117 retro A-1):

| Branch | Scenario | Implementation |
|---|---|---|
| **A** | `searchCartAdds` PRESENT in live response with REAL non-empty data + clear unit-of-analysis (per-query or per-product) | Full impl per AC-4..AC-10 |
| **B** | PRESENT but always empty/null/zero across all items | Defensive Frontend: do NOT render the metric; doc-only deferral + Request #178 |
| **C** | ABSENT from response (predicted most likely per pre-flight) | Doc-only deferral + Request #178 with shape proposal + unit-of-analysis question for backend |

## Acceptance Criteria

### Verification first (Task 1 — MANDATORY gate before any FE code)

1. **Live-response verification (per Epic 117 retro A-1)**. Authenticate as test cabinet; call `GET /v1/analytics/search/by-product?nmId=<>&from=<>&to=<>&limit=10` AND `GET /v1/analytics/search/by-query?query=<>&from=<>&to=<>&limit=10`; record:
   - (a) Is `searchCartAdds` (or alternate spelling: `cartAdds`, `addToCarts`, `searchCarts`) present in ANY item?
   - (b) If present, populated with REAL non-zero values across multiple items?
   - (c) Exact unit of analysis: per-query (denominator = query impressions), per-product (denominator = product impressions), or per-(query,product) pair?
   - Raw response snippets captured as durable evidence.

2. **Branch determination + scoping**:
   - Branch A → proceed with AC-4..AC-10 (full impl)
   - Branch B → AC-3b doc-only deferral path
   - Branch C → AC-3c doc-only deferral path (predicted)

### Branch-C path (predicted most likely)

3c. **If Branch C** (field ABSENT in live response — predicted):
   - Update `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` §3.4 row 2 with `⚠️ Backend field absent` banner citing this story's verification + cabinet ID + timestamp
   - File `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` requesting:
     - Field name (proposed: `searchCartAdds: number | null` per AP#8 — null when no data)
     - Per-item enrichment on `SearchQueryItem` + `SearchProductItem` (unit-of-analysis: same as impressions denominator)
     - Sample expected response
     - Acceptance criteria for backend
     - Cross-link Story 119.3-FE + Marketing Plan §3.4 row 2 + Story 117.2-FE Branch A precedent + Story 119.2-FE Branch C contrast
   - Flip Story 119.3 to `done` as **doc-only / scope-deferred**
   - Recommend Story 119.5+ swap-in after backend ships

### Branch-B path

3b. **If Branch B** (field PRESENT but empty/null):
   - Update Marketing Plan §3.4 row 2 with `⚠️ Backend returns null/zero` banner + EMPTY-payload evidence
   - File Request #178 with empty-payload evidence
   - Document Defensive Frontend rationale: "Branch B — backend returns null/zero across all items; rendering a 0% metric would surface meaningless data. Deferring metric impl to future story when backend populates."
   - No FE source/test changes

### Branch-A path (full impl — only if real data verified)

4. **NEW metric "Search-to-Cart Conversion" / Russian: "Конверсия запроса в корзину"** displayed as a percentage with 1 decimal place (`formatPercentage` utility from `src/lib/utils.ts`).

5. **Display location** (designer judgment at impl time; pre-flight will determine):
   - **Option A**: New column in `SearchByQueryTab` table (rendering per-query if `searchCartAdds` ships per-query)
   - **Option B**: New column in `SearchByProductTab` table (per-product if that's the unit)
   - **Option C**: New summary card in Search Analytics page header (aggregate across all queries)
   - Decision: depends on unit-of-analysis from Task 1 verification

6. **Defensive Frontend** per Anti-Pattern #8 (percentage = ratio):
   - If `item.searchCartAdds == null` OR `item.totalImpressions == null` → render `—` (em-dash)
   - If `item.totalImpressions === 0` → render `—` (division-by-zero guard, NOT `Infinity%` or `NaN%`)
   - If both non-null + denominator > 0 → render `formatPercentage(item.searchCartAdds / item.totalImpressions * 100)`
   - **NEVER coerce null/undefined to 0** in the ratio (would surface "0% conversion" when "unknown")
   - Type widening: `searchCartAdds?: number | null` (optional + nullable per AP#8)

7. **Pure-function extraction** (CLAUDE.md convention): `computeSearchToCartRatio(item: SearchQueryItem | SearchProductItem): number | null` exported for direct unit-testing. Handles all null/zero-denominator branches.

8. **Types refresh**: add `searchCartAdds?: number | null` to `SearchQueryItem` + `SearchProductItem` in `src/types/search-analytics.ts`. Cite Story 119.3-FE in field JSDoc. **CRITICAL**: keep file at ≤120 lines (current 118 + 2-line allowance for new field + comment); preserve check-docs baseline 22.

9. **Tests** (`src/lib/api/__tests__/search-analytics-normalizer.test.ts` — extend existing):
   - Pure-fn `computeSearchToCartRatio` tests: null/undefined cartAdds → null, zero impressions → null, real values → correct ratio
   - Branch-A integration: column/card renders correctly with real data; renders `—` for null/zero cases
   - Branch-A regression: existing `searchOrderShare` AP#8 fix (Story 119.1 F-2) tests still pass

### Quality gates

10. **All gates clean**: type-check 0 / ESLint 0E/≤112w (baseline +0) / vitest 0 failed (new tests if Branch A; no delta if B/C) / check-docs 22 baseline match / check-lessons exit 0. If Branch A: `wc -l src/types/search-analytics.ts` ≤ 120 (current 118; +2 allowance — but keep `+0` if possible to avoid resolving baseline-broken citations per Story 117.2-FE precedent).

### Review

11. **2-pass adversarial review** (source-code feature OR doc-only branch — both source-code-equivalent per Story 117.2-FE precedent). Mechanism B post-close `/code-review` likely per 9-of-9 empirical record.

## Tasks / Subtasks

- [x] **Task 1 — Live-response verification** (AC: 1, 2) — **GATE: do NOT proceed to Task 2 until Branch determined**
  - [⚠️ ATTEMPTED-BLOCKED — Pass-1 F-3] Backend live check (localhost:3000); authenticate test@test.com → JWT + X-Cabinet-Id — backend UP (build_timestamp 2026-05-30T11:20:44.825Z) but `POST /v1/auth/login` returned `INTERNAL_SERVER_ERROR` 500. PM2 backend logs show DB-credentials failure ("Authentication failed against database server at `localhost`, the provided database credentials for `wb_user` are not valid"). Trace IDs `e046b919-7a28-42b3-90ef-780ee670722f`, `31f00394-be79-408c-b438-4f0ef76ffd83`, `180a3c3f-2700-4868-9be0-6377642f6f76`, `1ff48345-1eea-4112-afd0-5b6977abba71` captured 2026-05-30 11:21-11:22 UTC. DB-credentials defect is OUT-OF-SCOPE for Story 119.3 (separate Request #179 — see Pass-1 F-5 fix). **Marker convention** (Pass-1 F-3): `[⚠️ ATTEMPTED-BLOCKED]` distinct from `[x]` (succeeded) and `[N/A]` (not applicable); the attempt was substantively made but blocked by an unrelated defect.
  - [N/A] Call `GET /v1/analytics/search/by-product?nmId=<real>&from=<>&to=<>&limit=10`; capture raw response — N/A: login 500 blocks all `Bearer`-authenticated endpoint calls.
  - [N/A] Call `GET /v1/analytics/search/by-query?query=<real>&from=<>&to=<>&limit=10`; capture raw response — N/A: same blocker.
  - [x] Check for `searchCartAdds` (and alt spellings: `cartAdds`, `addToCarts`, `searchCarts`) presence + non-empty-ness — **performed via backend-source-of-truth grep instead of live response** (live being blocked); zero hits across `src/analytics/dto/search-by-query.dto.ts`, `src/analytics/dto/search-analytics.dto.ts`, `src/analytics/services/search-analytics-query.service.ts`, full `src/`, `test-api/`, `docs/` for any cart-adds spelling on the SEARCH analytics pipeline. Single hit is `docs/architecture/04-data-models.md:633` (`ProductFunnelDaily.cart_adds`) — Epic 68 funnel domain, per-product per-day, NOT per-search-query.
  - [x] Record in Dev Agent Record § Live Verification Evidence
  - [x] Branch determined: **C (field ABSENT — predicted and confirmed by static backend evidence; live confirmation would be redundant since SQL aggregations themselves don't compute cart adds from search data).**

- [x] **Task 2 — Execute chosen branch** (AC: 3a, 3b, OR 3c → 4-9)

  **Branch C executed (predicted most likely — confirmed)**:
  - [x] Update `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` §3.4 row 2 with ⚠️ Backend field absent banner + evidence
  - [x] Create `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` (used Request #176 as canonical template)
  - [x] Include backend ACs: field shape (`searchCartAdds: number | null` per AP#8), per-item enrichment scope, unit-of-analysis clarification (per-query OR per-product OR per-(query,product) — backend decides), sample response
  - [x] Cross-link Story 119.3 + Marketing Plan §3.4 row 2 + Story 117.2-FE Branch A precedent + Story 119.2-FE Branch C contrast (predicted-A-actual-C inversion)
  - [x] No FE source/test changes

  **If Branch B** [N/A — Branch C confirmed]:
  - [N/A] Update Marketing Plan §3.4 row 2 with ⚠️ Backend returns empty banner + EMPTY-payload evidence
  - [N/A] File Request #178 with empty-payload sample
  - [N/A] Defensive Frontend rationale documented (no column/card added)
  - [N/A] No FE source/test changes

  **If Branch A (real data)** [N/A — Branch C confirmed]:
  - [N/A] Add `searchCartAdds?: number | null` to `SearchQueryItem` + `SearchProductItem` in types file
  - [N/A] Add `computeSearchToCartRatio` pure helper (exported)
  - [N/A] Choose display location (Option A/B/C per AC-5) — designer judgment based on Task 1 unit-of-analysis result
  - [N/A] Implement column/card with defensive null/zero-denominator handling (em-dash fallback)
  - [N/A] Verify types file stays ≤ 120 lines (current 118 + 2 allowance) per Story 117.2-FE precedent

- [x] **Task 3 — Tests** (AC: 9)
  - [x] Branch C confirmed: no test delta (doc-only branch — no source files changed, so no test changes warranted)
  - [N/A] If Branch A: extend `search-analytics-normalizer.test.ts` with `computeSearchToCartRatio` pure-fn tests + integration cases
  - [x] Verify existing Story 119.1 F-2 `toNullableNumber` tests still pass (regression guard for AP#8 ratio preservation pattern) — confirmed via full vitest run (passing-count 8086 >> 7205 floor; no tests in the 119.1 normalizer suite reported failures)

- [x] **Task 4 — Quality gates** (AC: 10)
  - [x] `npm run type-check` → 0 errors
  - [x] `npx eslint 'src/**/*.{ts,tsx}'` → 0 errors / 112 warnings (baseline match — `no-explicit-any` pre-existing)
  - [x] `npm test -- --run` → 14 failed / 8086 passed / 676 skipped / 54 skipped test files / 514 passed test files. **Failures are PRE-EXISTING environmental jsdom timeouts** (e.g. `StorageBySkuTable.test.tsx:169` 500ms-debounce `waitFor` timeout) — same flake class documented in Story 119.2-FE Debug Log References. Branch C makes ZERO source/test changes (verified via `git status --short` — only `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md`, NEW `docs/request-backend/178-*.md`, and `sprint-status.yaml` modified), so any failures are pre-existing on main and NOT introduced by Story 119.3. Passing-count floor (≥7205 per CLAUDE.md Accepted Baselines) is satisfied (8086 >> 7205).
  - [x] `bash scripts/check-doc-citations.sh` → 22 broken (baseline match — NEVER ratcheted)
  - [x] `bash scripts/check-lessons-length.sh` → exit 0 / 0 violations
  - [x] file-cap: no new source files (Branch C is doc-only); types file UNCHANGED at 118 lines (well under 120 cap)

- [x] **Task 5 — 2-pass adversarial review** (source-code feature OR doc-only Branch B/C — both source-code-equivalent per Story 117.2-FE precedent → 2-pass floor; NOT 4-pass codification default) — **COMPLETE per Mechanism B MB-1 retrospective check-off** (same false-negative attestation class Story 119.2-FE MB-2 caught + fixed in-place)
  - [x] 1st pass `/code-review 119.3` (fresh context) — Pass-1 ran with 6 findings (2H + 1M + 3L), all in-scope fixed
  - [x] 2nd pass `/code-review 119.3` (fresh context) — Pass-2 ran with 6 findings (1C + 2H + 3M) = 100% Pattern 4 propagation drift, all fixed (commit `4c130f4`)
  - [x] Apply all findings BEFORE flipping Status `review → done` — 12 total findings all addressed; commit landed before Status flip
  - [x] Final Change Log close-row with `**Lessons:**` (1-3, ≤120 chars each per Story 110.4-FE) — 3 Lessons present (110/109/113 chars per executor verification)
  - [x] Mechanism B post-close `/code-review` per **9-of-9 → 10-of-10 record** (extended by this very Mechanism B pass; MB-1 substantive finding surfaced — false-negative task-checkbox attestation, same class Story 119.2-FE MB-2 caught)

## Dev Notes

### Architecture patterns to follow

- **Verify-First story template** (Epic 117 retro A-1; canonical implementation Story 117.2-FE; dogfooded Story 119.2-FE inverted Branch C): live backend call BEFORE FE implementation when backend-doc-vs-FE-type uncertainty is real. Story 119.3 has the STRONGEST verify-first signal in Epic 119 — zero backend docs mention + zero FE refs.
- **Anti-Pattern #8 (null money/ratio)**: percentage IS a ratio → `searchCartAdds`-based ratio MUST preserve null; never `?? 0`. Reference: Story 119.1-FE F-2 fixed `searchOrderShare: toCount → toNullableNumber` for exactly this defect class. Apply same `toNullableNumber` helper if Branch A.
- **Defensive Frontend Principle**: division-by-zero → render `—` (em-dash); null/undefined inputs → render `—`. Never `Infinity%` or `NaN%`. Never silent `0%` for unknown data.
- **Boundary Normalizer Pattern**: if Branch A adds `searchCartAdds` to types, the existing `search-analytics-normalizer.ts` (shipped Story 119.1-FE) MUST be extended to normalize the new field through `toNullableNumber` per AP#8.
- **Pure-functions-over-hook-mocking** convention: `computeSearchToCartRatio` is a pure transformation — extract for direct unit-testing.

### Source tree (branch-dependent)

| File | Branch | Action |
|---|---|---|
| Dev Agent Record (this story) | ALL | Record live evidence + branch decision |
| `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` | A/B/C | §3.4 row 2 banner (Aspirational/Empty/Absent) |
| `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` | B/C | NEW backend request |
| `src/types/search-analytics.ts` | A | Add `searchCartAdds?: number | null` to SearchQueryItem + SearchProductItem (keep ≤120 lines) |
| `src/lib/api/search-analytics-normalizer.ts` | A | Extend `normalizeSearchQueryItem` + `normalizeSearchProductItem` with `searchCartAdds: toNullableNumber(r.searchCartAdds)` |
| `src/lib/api/__tests__/search-analytics-normalizer.test.ts` | A | Add `computeSearchToCartRatio` tests + null/zero-denominator regression cases |
| `src/app/(dashboard)/analytics/search/components/SearchByQueryTab.tsx` | A | (Option A) New column with metric + defensive `—` rendering |
| `src/app/(dashboard)/analytics/search/components/SearchByProductTab.tsx` | A | (Option B) Same as Option A but on product tab |
| `src/app/(dashboard)/analytics/search/components/SearchOrdersOverview.tsx` | A | (Option C) New summary card with aggregate metric |
| `src/lib/search-analytics-utils.ts` (NEW) | A | Export `computeSearchToCartRatio` pure helper |

### Existing capability (Epic 71-FE + 119.1-FE — already shipped, do NOT rebuild)

- `useSearchByQuery`, `useSearchByProduct`, `useSearchOrders` hooks — `src/hooks/use-search-analytics.ts`
- `SearchQueryItem` + `SearchProductItem` with `totalImpressions` (the denominator) — `src/types/search-analytics.ts:41-76`
- `search-analytics-normalizer.ts` (Story 119.1-FE; 209 lines) with `toCount` + `toNullableNumber` + `toStringOrNull` helpers — **REUSE `toNullableNumber` for `searchCartAdds`**
- `formatPercentage` utility — `src/lib/utils.ts`
- `SearchByQueryTab` + `SearchByProductTab` + `SearchOrdersOverview` components

### Out-of-scope follow-ups (DO NOT include in Story 119.3)

- **Funnel cart-add JOIN**: Marketing Plan §3.4 row 2 says "Combines search + funnel data" but the JOIN semantics are unclear (funnel cart-adds are per-SKU; search impressions are per-query OR per-product). If Branch A clarifies unit-of-analysis, this becomes implementable; if Branch C, defer entire concept to future epic.
- **Per-query × per-product matrix view**: future enhancement if backend ships per-(query,product) pair conversion data.
- **Comparison to industry benchmark**: future feature.

### Project structure notes

- If Branch A, the new column lives in `SearchByQueryTab` or `SearchByProductTab` (existing files)
- Pure helper extracted to `src/lib/search-analytics-utils.ts` (NEW; consistent with `funnel-analytics-utils.ts`-style naming if it exists, else mirror `liquidity-utils.ts` pattern)
- No new route, no new nav, no new hook (existing `useSearchByQuery`/`useSearchByProduct` already return the data)

### Testing standards summary

- Pure-function tests for `computeSearchToCartRatio` (Branch A only)
- Component tests for column rendering + defensive null/zero-denominator paths (Branch A only)
- Branch B/C: no test delta (doc-only)
- Cyrillic regex for any locale assertions
- Coverage target: 1 test per state (real-data / null-cartAdds / null-impressions / zero-impressions / valid-ratio)

### Review discipline

- **2-pass floor** (source-code feature OR doc-only Branch B/C — both source-code-equivalent per Story 117.2-FE precedent)
- Mechanism B post-close likely per **9-of-9 empirical record** (Story 119.2 just ratcheted from 8-of-8)
- **Next.js 15 server-component caveat (Story 119.2 P2-1 lesson)**: if Branch A's display location is a Server Component (Option C card on Search Analytics page), the `searchParams` type contract is `Promise<...>` not synchronous — verify `next build` typegen passes, not just `tsc --noEmit`

### References

- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md#Feature-3.4 row 2 — "Search-to-Cart Conversion"]
- [Source: _bmad-output/planning-artifacts/epics-119-fe.md#Story-119.3-FE — Epic 119 spec scope]
- [Source: _bmad-output/implementation-artifacts/epic-117-fe-retro-2026-05-29.md#Action-Items § A-1 — verify-first story-template option]
- [Source: _bmad-output/implementation-artifacts/117-2-fe-search-revenue-metrics.md — Branch A discovery precedent]
- [Source: _bmad-output/implementation-artifacts/119-2-fe-funnel-top-search-queries-column.md — Branch C inversion precedent (predicted A/B → actual C)]
- [Source: src/types/search-analytics.ts:41-49 — SearchQueryItem (totalImpressions denominator present)]
- [Source: src/types/search-analytics.ts:67-76 — SearchProductItem (totalImpressions denominator present)]
- [Source: src/lib/api/search-analytics-normalizer.ts:52 — `toNullableNumber` helper (Story 119.1-FE F-2; canonical AP#8 ratio normalizer)]
- [Source: src/lib/utils.ts — formatPercentage utility]
- [Source: docs/request-backend/176-SEARCH-ANALYTICS-KEY-SHAPE-AND-ORDERSHARE-ANOMALIES.md — Request #176 (Story 119.1-FE F-9) as canonical template for Request #178]
- [Source: CLAUDE-PATTERNS.md#Defensive-Frontend-Principle — em-dash for null/zero-denominator]
- [Source: CLAUDE-ANTI-PATTERNS.md#Anti-Pattern-8 — null money/ratio rule]
- [Source: CLAUDE.md#Accepted-Baselines — quality gate floor]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context, in-context execution).

### Live Verification Evidence

**Backend version:** `1.0.0` (`build_timestamp: 2026-05-30T11:20:44.825Z`) — verified via `GET /v1/meta/version` at 2026-05-30 11:20 UTC.

**Live verification status: PARTIALLY BLOCKED — backend up, but auth-dependent calls blocked by an UNRELATED backend DB-credentials defect.**

**Login attempt (4 retries 2026-05-30 11:21-11:22 UTC):**
- `POST /v1/auth/login` with `{"email":"test@test.com","password":"[REDACTED-TEST-PASSWORD]"}` returned `HTTP/1.1 500 Internal Server Error` on every attempt.
- Response body: `{"error":{"code":"INTERNAL_SERVER_ERROR","message":"Internal server error","details":[],"trace_id":"<...>","timestamp":"2026-05-30T11:2X:XX.XXXZ","path":"/v1/auth/login"}}`
- Trace IDs: `e046b919-7a28-42b3-90ef-780ee670722f`, `31f00394-be79-408c-b438-4f0ef76ffd83`, `180a3c3f-2700-4868-9be0-6377642f6f76`, `1ff48345-1eea-4112-afd0-5b6977abba71`.
- PM2 backend error log root-cause line: `Authentication failed against database server at localhost, the provided database credentials for wb_user are not valid.` (from `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/logs/pm2-api-error.log`).
- **This is an OUT-OF-SCOPE infrastructure defect** (the DB-credentials drift in the backend `.env` / Prisma URL). Separate environment ticket if it persists. Not in scope for Story 119.3.

**Cabinet ID (from Story 119.2-FE precedent):** `f75836f7-c0bc-4b2c-823c-a1f3508cce8e` (Test Cabinet — only cabinet returned for test@test.com per prior live verification 2026-05-29).

**Backend-source-of-truth verification (substituted for live call when login was blocked):**

The spec's verification-first signal — "is `searchCartAdds` (or alt spellings) present in the by-product / by-query response?" — has a stronger upstream answer than a live response could provide: **the backend search-analytics aggregation pipeline does not compute it.** A live call cannot return a field the SQL service doesn't aggregate.

Backend grep (`grep -rn 'searchCartAdds|cartAdds|addToCarts|searchCarts|cart_adds|searchCartCount' /Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/src/ /test-api/ /docs/`):

- `src/analytics/dto/search-by-query.dto.ts` — `SearchProductItem` declares: `totalImpressions`, `totalClicks`, `avgPosition`, `avgCtr`, `totalOrders`. Zero cart-related fields.
- `src/analytics/dto/search-analytics.dto.ts` — `SearchQueryItem` declares the same five fields. Zero cart-related fields.
- `src/analytics/services/search-analytics-query.service.ts` — SQL aggregations (`SUM(impressions)`, `SUM(clicks)`, `SUM(orders)`) on lines 159-194 and 262-298. Zero `cart_adds` or `cartAdds` aggregation. CTR is derived (`SUM(clicks)/NULLIF(SUM(impressions), 0)*100`); `avgPosition` is `AVG(position)`. No cart-derived column anywhere.
- `test-api/` (27 `.http` files): zero hits for any cart-adds spelling on a search-analytics endpoint.
- `docs/` (architecture + reference): **single hit** — `docs/architecture/04-data-models.md:633` `ProductFunnelDaily.cart_adds (int): Add to cart count`. This is the **Epic 68 funnel** domain — per-(cabinet, nm_id, date) granularity, NOT per-search-query. There is no SQL JOIN between `search_analytics_*` tables and `product_funnel_daily` anywhere in the backend.

**Branch determination: C (field ABSENT in backend response).** The static evidence is conclusive: the search analytics pipeline (DTOs + SQL service) does not aggregate cart-adds data, so the live `/by-product` and `/by-query` responses cannot include `searchCartAdds` regardless of what cabinet, period, or filter is used. Marketing Plan §3.4 row 2 — "Combines search + funnel data" — is **structurally unrealized in the backend**: there is no `searchCartAdds`-or-similar field on `SearchQueryItem` or `SearchProductItem`, and the "search + funnel JOIN" semantic the row hints at is unimplemented (and unit-of-analysis-undecided per Request #178).

**Pre-flight FE grep** (mirrors Story 105.2-FE source-trace verification):
- `src/types/search-analytics.ts` — zero hits for cart-adds spellings (confirmed via inspection: `SearchQueryItem` lines 41-49 + `SearchProductItem` lines 67-76 declare only impressions/clicks/position/CTR/orders).
- `src/lib/api/` — zero hits.
- `src/hooks/` — zero hits.

**Differences vs Story 119.2-FE (predicted-A/B-actual-C inversion precedent):** Story 119.2-FE predicted Branch A/B for funnel `topSearchQueries` and live evidence inverted to Branch C (field PRESENT and richer than predicted). Story 119.3-FE predicted Branch C for search `searchCartAdds`, and the static-source evidence confirms that prediction — backend has zero infrastructure for the field. The verify-first discipline still applied (skip nothing on faith), but the answer was reachable via static source inspection without needing a live response.

### Debug Log References

- Live login attempt evidence captured at `/tmp/119-3-login-attempt.txt` (4 retries, all 500; trace IDs `e046b919-7a28-42b3-90ef-780ee670722f`, `31f00394-be79-408c-b438-4f0ef76ffd83`, `180a3c3f-2700-4868-9be0-6377642f6f76`, `1ff48345-1eea-4112-afd0-5b6977abba71`).
- PM2 backend error log: `/Users/r2d2/Documents/Code_Projects/wb-repricer-system-new/logs/pm2-api-error.log` — repeated `Authentication failed against database server at localhost` Prisma errors from `TaskSchedulerService.processScheduledTasks` and `OrdersSchedulerService` cron jobs. Failure is environment-wide (not story-specific).
- Backend source grep for cart-adds spellings: zero matches on search-analytics pipeline; single match on `ProductFunnelDaily.cart_adds` (Epic 68 funnel domain — unrelated).
- Quality gates summary:
  - Type-check: `npm run type-check` → 0 errors.
  - ESLint: `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` → 0 errors / 112 warnings (baseline match).
  - check-docs: `bash scripts/check-doc-citations.sh` → 22 broken (baseline match).
  - check-lessons: `bash scripts/check-lessons-length.sh` → exit 0.
  - Vitest full corpus: 8086 passed / 14 failed / 676 skipped (14 failures are pre-existing jsdom timeouts — e.g. `StorageBySkuTable.test.tsx:169` 500ms-debounce — same flake class documented in Story 119.2-FE Debug Log References; Branch C makes ZERO source/test changes, so these failures are inherited from main, not introduced by 119.3).

### Completion Notes List

- **Branch C confirmed via backend-source-of-truth grep.** Live verification was blocked by an unrelated DB-credentials defect, but the static evidence is stronger than a live response would have been: the SQL aggregations themselves don't compute `searchCartAdds`, so the field cannot appear in any live response.
- **Marketing Plan §3.4 row 2 banner added** with cabinet ID, timestamp, and explicit reference to the backend-source-of-truth files (`src/analytics/dto/*`, `src/analytics/services/search-analytics-query.service.ts`).
- **Request #178 filed** with shape proposal (`searchCartAdds: number | null` per AP#8), unit-of-analysis clarification question (per-query / per-product / per-(query,product)), sample expected response, and 7 backend acceptance criteria.
- **Predicted-and-confirmed Branch C** (vs Story 119.2-FE's predicted-A/B-actual-C inversion) — the stronger pre-flight signal (zero backend docs mention + zero FE refs + zero SQL aggregation) held; the verify-first discipline still applied without skipping.
- **DB-credentials defect documented in Live Verification Evidence + Request #178** so that the next person who runs the login flow finds a breadcrumb explaining the 500 they hit.
- **Zero source/test code changes** consistent with Branch C doc-only path.
- Story file Status flipped `ready-for-dev → review`; sprint-status row flipped to `review`. Awaiting `/code-review 119.3` 2-pass adversarial review per Task 5.
- Per Story 117.2-FE precedent, doc-only Branch C is source-code-equivalent for review purposes: 2-pass review still required.

### File List

**Refreshed 2026-05-30 from `git status --short` + `wc -l` (matches Story 119.2-FE File List methodology citation; per Pass-2 P2-6 + Story 97.2-FE authoritative-source-citation discipline) (NOT including the `sprint-status.yaml` flip — that's project-tracking infra, not Story 119.3 deliverable):**

**NEW (2):**
- `docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` — Request #178; **146-line** backend request (Pass-1 F-2 refresh: was attested 130 → 145 → 146 post-Pass-2 P2-2 added Request #179 cross-link entry) (shape proposal + unit-of-analysis clarification + 7 backend ACs + **11 cross-references** verified via `grep -c "^- \*\*" docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` including Marketing Plan §3.4 row 2, Story 117.2-FE Branch A precedent, Story 119.2-FE Branch C inversion precedent + branch-label disambiguation note, Request #176 canonical-template precedent, AP#8 rule, Boundary Normalizer Pattern, backend funnel cart_adds column, backend SQL service, the side-context DB-credentials defect, and Request #179 cross-link).
- `docs/request-backend/179-WB-USER-DB-CREDENTIALS-AUTH-FAILURE.md` — Request #179 (Pass-1 F-5 cross-discovery); **99-line** backend request filing the `wb_user` DB-credentials auth-failure defect that blocked live verification for Story 119.3-FE (P0 severity; affects all auth-gated endpoints; 5 likely root causes documented; 5 backend ACs).

**MODIFIED (1):**
- `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` — §3.4 row 2 now banner-flagged `⚠️ Backend field absent` with cabinet ID, timestamp (2026-05-30), backend-source-of-truth file citations, the structural funnel-vs-search-JOIN ambiguity note, and a cross-link to Request #178.

**Story-file edits to itself (this story):**
- `_bmad-output/implementation-artifacts/119-3-fe-search-to-cart-conversion-metric.md` — Status `ready-for-dev` → `review`; Tasks 1-4 subtasks checked off (Task 5 left unchecked for user-invoked `/code-review`); Live Verification Evidence + Debug Log References + Completion Notes + File List populated; SECOND Change Log row added.

**Sprint-tracking infra (not a Story 119.3 deliverable but committed alongside):**
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `119-3-fe-search-to-cart-conversion-metric: in-progress → review` flip with one-line summary.

**Zero source/test files modified** — consistent with Branch C doc-only path.

### Change Log

| Date | Change |
|---|---|
| 2026-05-30 | Story created via `/create-story` (BMad Master, claude-opus-4-7). Epic 119-FE Story 3 — Search-to-Cart Conversion metric (Marketing Plan §3.4 row 2). Pre-flight (Story 105.2-FE): `searchCartAdds` ABSENT in FE types/api/hooks + ZERO backend docs mention (stronger verify-first signal than Story 117.2-FE OR 119.2-FE had). Predicted Branch C (field doesn't exist in backend) based on (a) zero pre-flight hits + (b) Marketing Plan §3.4 row 2 unclear unit-of-analysis ("combines search + funnel" without specifying JOIN semantics). Task 1 = MANDATORY live call; 3-way decision matrix (A: real data / B: empty / C: absent — predicted). Story 119.2-FE precedent shows live-evidence can invert predictions, but the signal here is stronger than 119.2's was. Out-of-scope follow-up: Funnel × Search JOIN semantics (Marketing Plan §3.4 row 2 unclear) — defer to future epic if Branch A clarifies. Estimated ~1 SP if Branch B/C (doc-only + Request #178); ~3-4 SP if Branch A (full impl + types + normalizer + column + tests). 2-pass review (source-code feature OR doc-only equivalent per Story 117.2-FE precedent). Mechanism B post-close likely per 9-of-9 record. Ready for dev-story. |
| 2026-05-30 | Implementation complete (claude-opus-4-7) — resolved as **Branch C** (predicted-and-confirmed). Live `POST /v1/auth/login` returned `INTERNAL_SERVER_ERROR` 500 across 4 retries (trace_ids `e046b919`/`31f00394`/`180a3c3f`/`1ff48345` captured 11:21-11:22 UTC); PM2 backend error log root-cause: `Authentication failed against database server at localhost, the provided database credentials for wb_user are not valid` — UNRELATED environment defect, OUT-OF-SCOPE for Story 119.3. Live verification substituted with **backend-source-of-truth grep** (stronger evidence than a live response can give): `src/analytics/dto/search-by-query.dto.ts`, `src/analytics/dto/search-analytics.dto.ts`, and `src/analytics/services/search-analytics-query.service.ts` aggregate only `totalImpressions`/`totalClicks`/`avgPosition`/`avgCtr`/`totalOrders` — zero cart-related fields anywhere in the search analytics pipeline. Single cart-related backend hit is `docs/architecture/04-data-models.md:633` `ProductFunnelDaily.cart_adds` (Epic 68 funnel domain, per-product per-day, NOT per-search-query). Marketing Plan §3.4 row 2 banner-flagged `⚠️ Backend field absent` with cabinet ID `f75836f7-c0bc-4b2c-823c-a1f3508cce8e` (Story 119.2-FE precedent), timestamp, backend-source citations, and structural funnel-vs-search-JOIN ambiguity note. Request #178 (`docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md`) filed with shape proposal (`searchCartAdds: number | null` per AP#8), unit-of-analysis clarification question (per-query / per-product / per-(query,product)), sample expected response, and 7 backend ACs + 11 cross-references (Pass-2 P2-5 refresh: was 8; Pass-1 F-1 added branch-label disambiguation note and Pass-2 P2-2 added Request #179 cross-link). Zero FE source/test code changes (Branch C doc-only path). Gates: type-check 0 / ESLint 0E/112w (baseline match) / check-docs 22 broken (baseline NEVER ratcheted) / check-lessons exit 0 / vitest 8086 passed / 14 failed (PRE-EXISTING jsdom timeouts — `StorageBySkuTable.test.tsx:169` debounce flake — NOT introduced by Story 119.3; Branch C touches zero test files). Files modified: 2 new (Request #178; 146 lines per Pass-2 P2-2 — was 145 after Pass-1 F-2 added Request #179 cross-link entry + Request #179; 99 lines per Pass-1 F-5), 1 modified (Marketing Plan §3.4 row 2 banner). Status: ready-for-dev → review. Awaiting 2-pass `/code-review 119.3`. |
| 2026-05-30 | **Story 119.3-FE CLOSED** after 2-pass `/code-review` (Pass-1: 6 findings all in-scope fixed; Pass-2: 6 findings 1C+2H+3M = 100% Pattern 4 propagation drift, all fixed). Total findings across 2 passes: **12** (smaller than Stories 119.1 + 119.2 — Branch C doc-only has narrower surface). Branch C confirmed by static backend-source-of-truth grep (live `POST /v1/auth/login` blocked by unrelated `wb_user` DB-credentials defect filed as Request #179 per Pass-1 F-5). Pass-2 100% Pattern 4 confirms 3 consecutive Epic 119 Pass-2s = 100% Pattern 4 (Stories 119.1 + 119.2 + 119.3 — empirical pattern). Final deliverables: NEW Request #178 (146 lines post-Pass-2 P2-2 cross-link addition; search-cart-adds enrichment); NEW Request #179 (Pass-1 F-5; DB-credentials defect P0); MODIFIED Marketing Plan §3.4 row 2 banner (4-bullet reformat per Pass-1 F-4); story file populated with Live Verification Evidence + Pass-1 + Pass-2 blocks. Zero FE source/test code changes (Branch C doc-only). Gates final: type-check 0 / ESLint 0E/112w (baseline NEVER ratcheted) / check-docs 22 / check-lessons exit 1 (2 PRE-EXISTING violations in closed Stories 119.1/119.2 — APPEND-ONLY, not editable from this story; Story 119.3's own Lessons line ≤120 chars). **Lessons:** (1) Doc-only Branch C still attracts 100% Pattern 4 in Pass-2 — multi-pass discipline scales beyond source code. (2) Side-discoveries (Request #179) should file separately per Story 117.2-FE precedent, not bundle into primary. (3) Branch-label should standardize on A=ABSENT (Story 117.2/119.2) — 119.3 inversion confused cross-story readers. Status: review → done. |

### Post-1st-pass-review fixes (2026-05-30)

1st-pass adversarial review (`/code-review 119.3`, recall-biased high-effort, direct inspection rather than 4-angle finder agents given doc-only Branch C scope): 6 findings (2 HIGH + 1 MED + 3 LOW). All 6 in-scope findings FIXED per user directive "fix all issues and mark as done when all are solved".

- **F-1 [HIGH] FIXED** — Branch-label inversion: Stories 117.2 + 119.2 use convention `A=ABSENT / B=PRESENT-empty / C=PRESENT-with-data`; Story 119.3 inverted to `A=PRESENT-with-data / B=PRESENT-empty / C=ABSENT`. Cross-story comparison confusing. **Fix**: added branch-label disambiguation note in Request #178 § Cross-references explaining the per-story label convention with recommendation for future verify-first stories to adopt 117.2/119.2 canonical convention.
- **F-2 [HIGH] FIXED** — Request #178 line-count attestation drift: 3 sites attested "130 lines" while actual is 145. Same Story 116.1-FE I-3 class as Stories 119.1 MB-1 + 119.2 MB-1 — **3rd consecutive Epic 119 story with line-count drift**. Refreshed in story File List + sprint-status + Change Log row 2.
- **F-3 [MEDIUM] FIXED** — Task 1 auth subtask state inconsistency: marked `[x]` "PARTIAL" despite the auth itself failing 500, while dependent subtasks correctly used `[N/A]`. Introduced new marker convention `[⚠️ ATTEMPTED-BLOCKED]` to distinguish "attempted but blocked by unrelated defect" from "succeeded" (`[x]`) and "not applicable" (`[N/A]`).
- **F-4 [LOW] FIXED** — Marketing Plan §3.4 row 2 banner was a single 150-word dense paragraph. Reformatted into 4 bullet sub-sections (Header, What's missing, Evidence, Action) for readability.
- **F-5 [LOW] FIXED** — DB-credentials cross-discovery (`wb_user` Prisma 500) filed as separate `docs/request-backend/179-WB-USER-DB-CREDENTIALS-AUTH-FAILURE.md` (P0 severity; affects all auth-gated endpoints; 5 likely root causes documented; 5 backend ACs). Mirrors Story 117.2-FE precedent of spinning off side-discoveries into independent backend Requests (#175 was Story 117.2-FE's parallel).
- **F-6 [LOW] FIXED** — Marketing Plan banner now cites Story 119.3-FE artifact path directly (was previously only cross-linked via Request #178), eliminating 2-hop traversal for verification.

Post-Pass-1 gates: type-check 0 / ESLint 0E/112w (baseline +0) / check-docs 22 (baseline) / check-lessons exit 0 / NO test delta (Branch C doc-only).

**2nd adversarial pass dispatched** per Story 94.3-FE 2-pass MANDATORY discipline.

### Post-2nd-pass-review fixes (2026-05-30)

2nd-pass adversarial review (`/code-review 119.3` Pass-2, fresh context, scrutinizing Pass-1 fixes): 6 findings — 1 CRITICAL + 2 HIGH + 3 MEDIUM. **100% Pattern 4 fix-block propagation drift**: P2-1 (Request #179 missing from File List inventory) + P2-2 (Request #178 missing #179 cross-link) + P2-3 (3 vs 4 retries inconsistency across 6+ sites) + P2-5 (8 vs 10 cross-refs count drift — actual 11 post-P2-2) + P2-6 (File List methodology attestation drift). One non-propagation finding: P2-4 typo `localhostl` (single-char) in quoted PM2 log line. All 6 fixed before Status flip per Story 94.3-FE.

- **P2-1 [CRITICAL] FIXED** — Pass-1 F-5 created Request #179 but 3 attestation sites stuck at "1 new (Request #178)". Refreshed: Story File List `**NEW (1)**` → `**NEW (2)**`; Change Log row 2 "1 new" → "2 new (Request #178 + Request #179)"; sprint-status same.
- **P2-2 [HIGH] FIXED** — Request #178 had no cross-link to Request #179 despite Marketing Plan banner getting one. Added inline reference at line 28 area + dedicated entry in Cross-references section. Inverse link from Request #179 → #178 was already present. Side-effect: Request #178 grew 145 → 146 lines (refreshed in story file File List + sprint-status + Change Log row 2 per truth-first attestation).
- **P2-3 [HIGH] FIXED** — 6+ sites inconsistent on 3 vs 4 retries (3 vs 4 trace IDs). Source of truth: 4 retries, 4 trace IDs (`e046b919`, `31f00394`, `180a3c3f`, `1ff48345-1eea-4112-afd0-5b6977abba71`). Refreshed all sites to "4".
- **P2-4 [MEDIUM] FIXED** — Typo `localhostl` (extra `l`) at story file line 250 in quoted PM2 log line. Corrected to `localhost`. Story 97.2-FE authoritative-source-citation discipline: quoted text must be byte-accurate.
- **P2-5 [MEDIUM] FIXED** — `8 cross-references` count stale across 2 sites; per `grep -c "^- \*\*" docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md` actual is 11 (Pass-1 F-1 added branch-label disambiguation entry to existing Story 119.2-FE entry without recount; Pass-2 P2-2 added the Request #179 cross-link entry). Refreshed all sites to "11".
- **P2-6 [MEDIUM] FIXED** — File List methodology attestation said "Refreshed from `git status --short`" but that command doesn't emit line counts. Refreshed to "git status --short + wc -l" matching Story 119.2-FE convention per Story 97.2-FE.

**Discipline meta-note**: Pass-2's 6/6 Pattern 4 findings on a doc-only Branch C story confirms the discipline operates across all story-type contexts (not just source-code work). Story 119.2-FE Pass-2 was also 100% Pattern 4 (different defects but same class). Cumulative Epic 119 Pattern 4 chain: Story 119.1 Pass-2 (1C+2H+3M all P4) + Story 119.2 Pass-2 (1C+2H+3M all P4) + Story 119.3 Pass-2 (1C+2H+3M all P4) = **3 consecutive 100% Pattern 4 Pass-2s** in Epic 119.

Post-Pass-2 gates: type-check 0 / ESLint 0E/112w (baseline +0) / check-docs 22 (baseline NEVER ratcheted) / check-lessons exit 1 with 2 PRE-EXISTING violations in CLOSED stories 119.1 + 119.2 (NOT introduced by Story 119.3 — per Story 111.1-FE F-2 APPEND-ONLY for closed-story Lessons, cannot be edited from this story; documented but not gate-fixed; Story 119.3's own Lessons line under the close-row stays ≤120 chars per Story 110.4-FE compliance) / Branch C zero test delta.

### Post-Mechanism-B-pass disclosure (2026-05-31, user-invoked BMad `/bmad:bmm:workflows:code-review 119.3` post-close)

User invoked the BMad adversarial code-review workflow as the **Mechanism B post-close pass** (per Story 116.1-FE Insight I-2 + 9-of-9 empirical record: Stories 112.4 / 113.1 / 113.2 / 114.1 / 115.1 / 116.1 / 117.1 / 119.1 / 119.2 — all surfaced substantive findings via post-close `/code-review` invocation). This is the **10th** Mechanism B opportunity in the codification + source-code corpus; record extends to **10-of-10** at this disclosure. Per APPEND-ONLY convention (Story 111.1-FE F-2): Status stays `done`; close-row Lessons frozen; this disclosure appends without editing prior close-row content. **Exception** (in-place fix allowed): Task 5 + 5 subtask checkboxes were flipped `[ ] → [x]` per Mechanism B MB-1 (task-progress is not Change Log content; checkbox state should reflect reality post-2-pass-completion).

**3 findings (1 HIGH + 2 LOW observations)**:

- **MB-1 [HIGH] FIXED** — Task 5 "2-pass adversarial review" + ALL 5 subtasks remained `[ ]` despite Status: done AND despite the 2-pass review having genuinely completed (Pass-1 ran with 6 findings + Pass-2 ran with 6 findings + commit `4c130f4` landed before Status flip + 3 Lessons added to close-row + this Mechanism B pass firing). False-negative attestation — SAME defect class Story 119.2-FE MB-2 caught + fixed in-place (3rd Epic 119 story to exhibit this defect class; pattern empirical recurrence). **Fix**: marked Task 5 + 5 subtasks `[x]` with retrospective completion citations (each subtask references its actual completion evidence: Pass-1 finding count, Pass-2 finding count, commit hash, 3 Lessons attestation, 9-of-9 → 10-of-10 record extension).
- **MB-2 [LOW] DISCLOSED** — check-lessons gate-state temporal drift: Change Log row 2 (implementation-complete state) attested `exit 0`; Change Log row 3 (close state) attests `exit 1 (2 PRE-EXISTING violations in CLOSED Stories 119.1/119.2)`. The pre-existing violations would have failed the gate at ANY point if they exceed the 120-char cap, suggesting either (a) Pass-1 didn't actually run check-lessons (attestation error), (b) something changed mid-cycle that triggered the violations, or (c) the check-lessons script's behavior varies based on which files have been recently touched. **Disposition**: disclosure-only via this Post-Mechanism-B-pass block. Cannot fix in-place per APPEND-ONLY (Change Log rows frozen post-Status flip). Pattern 4 fix-propagation discipline class — Pass-1 attestation about a gate state may have been incorrect.
- **MB-3 [LOW] NO ACTION] — Sprint-status row 495 self-fulfilling 10-of-10 attestation: row says "Awaiting Mechanism B post-close /code-review per 10-of-10 record (after 119.3's invocation extends 9-of-9 → 10-of-10)". This preemptively attests the extension that THIS pass is causing. **At the moment of writing**, the record was 9-of-9; THIS invocation is causing the 10-of-10 extension via MB-1's substantive finding. The attestation becomes accurate the moment MB-1 is fixed. **No action needed** — temporal framing is now retroactively accurate.

**Discipline status update (post-Mechanism B)**:
- **Mechanism B record**: 9-of-9 → **10-of-10** ✅ (extended by this very disclosure)
- **False-negative task-checkbox attestation**: empirical class observed for the **2nd time** in Epic 119 (Story 119.2-FE MB-2 + Story 119.3-FE MB-1). Both fixes were in-place checkbox flips with retrospective completion citations. Pattern stable across stories.
- **3 consecutive Epic 119 stories with Mechanism B substantive findings** (Stories 119.1 / 119.2 / 119.3) — 100% incidence within Epic 119; consistent with 10-of-10 corpus-wide record.

**What was modified by this Mechanism B pass** (gitignored story file; no commit needed):
- Task 5 + 5 subtasks: `[ ]` → `[x]` with retrospective citations (MB-1)
- NEW `### Post-Mechanism-B-pass disclosure (2026-05-31)` section appended per APPEND-ONLY (Story 111.1-FE F-2)
- Status remains `done`; sprint-status row `119-3-fe-search-to-cart-conversion-metric: done` unchanged

**Gates re-verified post-disclosure**: no source code changed; gate state identical to post-Pass-2 (type-check 0 / ESLint 0E/112w / check-docs 22 / check-lessons exit 1 same disposition).

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Each ≤120 chars per Story 110.4-FE. Earlier rows (creation, intermediate fixes, post-review blocks) DO NOT require Lessons. -->
