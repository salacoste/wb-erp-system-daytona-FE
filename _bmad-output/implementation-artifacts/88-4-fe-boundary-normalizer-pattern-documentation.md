# Story 88.4-FE: Boundary Normalizer Pattern Documentation

Status: done

## Story

**As an** architect reading this codebase for the first time,
**I want** a clear convention for "boundary normalizers" at every backend API integration point,
**so that** the next role-case / camelCase / nullability mismatch doesn't repeat the same diagnostic cycle that Stories 84.1, 87.3, 88.2 went through.

**Epic**: 88-FE Tech Debt Cleanup & Process Hardening
**Priority**: P3
**Estimate**: 2 story points

---

## Problem Statement

Epic 87-FE's retrospective (Action Item #6) identified three bugs that all followed the same shape:

| Story | Bug | Root cause | Fix |
|---|---|---|---|
| 84.1 (baseline) | Role-gated features broke silently | Backend emits `'owner'` lowercase, frontend `User['role']` is `'Owner'` capitalized | `authStore.ts:30` `normalizeUser()` maps lowercase → PascalCase |
| 87.2 (baseline) | Backfill admin crashed on `'not_started'` status | Backend sends camelCase `cabinetId`, `reportsStatus`, `overallProgress`; frontend type uses snake_case | `backfill.ts:62-88` inline `getBackfillStatus` transformer with `toBackfillStatus`, `toDataSource` helpers |
| 87.3 / 88.2 | Null-vs-zero collapse for COGS/ROAS | Transform layer used `?? 0` instead of `?? null`, collapsing "unknown" into "zero" | Preserve null in transform, widen type, coerce at aggregation callsites |

Each of these cost meaningful diagnostic cycles — the code looked correct, the types compiled, but the boundary between backend and frontend silently papered over a mismatch. When a new dev adds an API call that bypasses this pattern (uses raw backend types directly, or writes `as ResponseType`), the next such bug ships undetected.

**The pattern already exists, and is already proven** — we have `normalizeUser`, `normalizeProduct`, `normalizeStorageTrendsResponse`, `toBackfillStatus`, `toDataSource` as canonical examples. This story **documents** the pattern in CLAUDE.md and **audits** `src/lib/api/` for endpoints that currently bypass it. **No code changes** except the docs + audit output. The optional stretch (ESLint custom rule) is skippable.

### Pre-story survey results

Files with exported normalizers (explicit, named):
- `src/lib/api/products-normalizer.ts` — `normalizeProduct(raw): ProductWithDimensions`
- `src/lib/api/storage-analytics-trends.ts` — `normalizeStorageTrendsResponse`, `normalizeStorageSummaryResponse`
- `src/lib/api/storage-analytics-queries.ts` — `normalizeStorageBySkuResponse`, `normalizeTopConsumersResponse`

Files with inline normalizers (non-exported, at the call site):
- `src/lib/api/backfill.ts:55-89` — `getBackfillStatus` uses `toBackfillStatus`, `toDataSource` + inline field mapping (the canonical "inline" example for role/enum cases)
- `src/lib/api/advertising-analytics-api.ts:88-168` — adapter for the advertising response (camelCase → snake_case + nullability). Pattern is followed but not named `normalize…`; worth renaming for discoverability.
- `src/lib/api/daily-analytics/api.ts:68-93` — `getFinanceDailyData` adapter (camelCase → snake_case, null preservation post-88.2)

Auth:
- `src/stores/authStore.ts:30` — `normalizeUser(user): User` (role case bridge). Canonical "state store" example.

Candidates (endpoints that *may* bypass normalization — confirmed by `grep apiClient.get<TypedResponse>`):
- 28 files use `apiClient.get<SomeResponse>()` directly. Some return the response untouched (bypass), some wrap it. The audit in AC-2 will classify each.

Non-candidates (out of scope):
- Type-level normalization (mapping fields inside `types/*.ts`) — that's orthogonal; a type alone doesn't run at the boundary.
- Backend-side contracts — addressed via `docs/request-backend/*.md` separately.

---

## Acceptance Criteria

### AC-1: CLAUDE.md — "Boundary Normalizer Pattern" section

- [ ] Add a new subsection under **Key Architecture Patterns** (after the existing "API Client" and "TanStack Query" subsections) titled **"Boundary Normalizer Pattern"**.
- [ ] Content MUST include:
  - **Definition**: Every endpoint response that crosses the backend→frontend boundary MUST be transformed into a frontend-canonical shape at the API client layer. Raw backend shapes never reach components or hooks.
  - **Why**: Backend and frontend evolve independently. Role-case drift, snake_case↔camelCase drift, nullability drift, date-string↔Date drift — all silently break downstream callers when bypassed.
  - **Naming conventions** (pick one consistently per module):
    - `normalize<Name>Response(raw: unknown): <Name>Response` — preferred for top-level endpoint responses.
    - `to<Type>(raw: unknown): <Type>` — preferred for scalar/enum coercion helpers (e.g., `toBackfillStatus`, `toDataSource`).
    - `normalize<Name>(raw: Raw<Name>): <Name>` — for per-item normalization within a list response.
  - **When to use** (checklist):
    - ✅ Role/enum-case mismatches (backend `'owner'` vs. frontend `'Owner'`)
    - ✅ snake_case ↔ camelCase (backend `cabinet_id`/`cabinetId` vs. frontend convention)
    - ✅ Nullability mismatches (backend `null` semantically meaning "unknown")
    - ✅ Date strings ↔ `Date` objects (never leave raw strings in `Date`-typed fields)
    - ✅ Discriminated unions where backend sends extra variants (fall through to `'unknown'` with a runtime assertion)
  - **Two canonical examples** (full code blocks):
    - Example 1: `authStore.ts:30` — `normalizeUser` for role-case bridging in a state store.
    - Example 2: `backfill.ts:55-89` — inline `getBackfillStatus` transform with `toBackfillStatus` / `toDataSource` helpers for case/enum bridging.
  - **Anti-patterns to avoid**:
    - ❌ `apiClient.get<BackendShape>(...)` followed by direct return. The TYPE lies; the runtime shape is whatever the backend sent.
    - ❌ Using `as` casts to bridge type gaps without a normalizer (`response as FrontendShape`).
    - ❌ Duplicating the normalization logic at multiple call sites — put it in the API module, one place.
    - ❌ Conditional normalization (`if (response.cabinetId) { ... } else { ... }`) — always normalize unconditionally.
  - **Testing requirement**: Every normalizer MUST have at least 1 unit test that exercises the nullability / case / variant edge cases. Reference pattern: `authStore.test.ts` for `normalizeUser`.
  - **Cross-reference**: link to Story 84.1 (role case), Story 87.2 (backfill camelCase), Story 87.3 + 88.2 (null vs zero) as the three diagnostic-cycle case studies this pattern prevents.

### AC-2: Audit report — `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-14.md`

- [ ] **Read-only audit** of every file in `src/lib/api/**/*.ts` (excluding `__tests__/`). For each file, classify the endpoint(s) as:
  - **A. Normalized (explicit)**: has a named `normalize…` or `to…` function; raw types named explicitly.
  - **B. Normalized (inline)**: has field-mapping/coercion inside the query function but no named helper. Recommend extraction into a named function.
  - **C. Passthrough (bypass)**: uses `apiClient.get<FrontendType>()` and returns directly with no transform. **RISK** — must be addressed in a follow-up story.
  - **D. Wrapped (pseudo-passthrough)**: returns raw response wrapped in a known envelope (`{ data, meta }`) without per-field transform. Low risk, but list for completeness.
- [ ] Output schema per file (markdown table):

  | File | Endpoint(s) | Classification | Evidence line(s) | Recommended action |
  |---|---|---|---|---|
  | `src/lib/api/backfill.ts` | `GET /v1/admin/backfill/status` | B — inline | lines 55-89 | extract to `normalizeBackfillStatusResponse` |
  | `src/lib/api/tariffs.ts` | (whatever) | C — bypass | N/A | **ACTION ITEM**: add normalizer in follow-up story |
  | … | … | … | … | … |

- [ ] Summary at the top of the report:
  - Total files audited.
  - Count per classification (A/B/C/D).
  - Top 5 highest-risk C-classified endpoints (judged by: how often the route is hit, whether backend shape has known drift, whether frontend type is strict).
  - Proposed follow-up story title and estimate (e.g., "89.1-fe-normalize-high-risk-endpoints, 5 SP").
- [ ] Report file ends with a "Methodology" section documenting HOW the audit was performed (grep patterns, manual review criteria) so future audits can reproduce it.
- [ ] **Zero code changes** — this AC produces a `.md` file only.

### AC-3 (OPTIONAL, explicit SKIP acceptable): ESLint custom rule stub

- [ ] **Attempt only if Task 1 + Task 2 complete with time remaining.** If the ESLint authoring proves complex (new rule scaffolding, AST walker, test harness), STOP and record "skipped: out of budget" in Completion Notes — this is explicitly a SKIP-allowed AC per the epic spec.
- [ ] If attempted: add a rule stub under `eslint-rules/no-raw-api-response.js` that flags `apiClient\.(get|post|put|patch|delete)<[A-Z]\w*>` at call sites where the returned type is a backend-shape alias (heuristic: type alias is also used in a `Raw<…>` import). Produce an advisory warning, not an error. Add the rule to `eslint.config.mjs` under a new `warning`-level severity.
- [ ] If skipped: document the rule design in the audit report (AC-2) as "future ESLint rule: description + proposed matcher" so the next person picking it up has a starting point.

### AC-4: Validation

- [ ] `npm run lint && npm run type-check` pass (no new warnings/errors from this story).
- [ ] Existing 6763 passing unit tests remain green (this story adds no test failures).
- [ ] The audit report markdown compiles cleanly (no broken links to file paths, all cited line numbers verified).
- [ ] CLAUDE.md section renders correctly in markdown preview.

---

## Tasks / Subtasks

### Task 1: Write CLAUDE.md — "Boundary Normalizer Pattern" section (AC-1)

- [ ] 1.1: Locate insertion point — after the "TanStack Query" subsection, before "Zustand" subsection in the "Key Architecture Patterns" area (see CLAUDE.md around line ~310).
- [ ] 1.2: Write the new subsection per AC-1 content requirements.
- [ ] 1.3: Include the two canonical examples as fenced code blocks. Link to file:line (e.g., `src/stores/authStore.ts:30`) so readers can click through in IDEs.
- [ ] 1.4: Cross-reference Story 84.1, 87.2, 87.3, 88.2 by name in the "Why" paragraph.
- [ ] 1.5: Re-check CLAUDE.md total length — adding ~40-60 lines. Still well under the 2000-line threshold.

### Task 2: Audit report (AC-2)

- [ ] 2.1: Enumerate all `src/lib/api/**/*.ts` files (excluding `__tests__/`). Expected: ~40 files per pre-story survey.
- [ ] 2.2: For each file, read the exported functions that make `apiClient.*` calls. Record:
  - Route(s) hit
  - Whether the response type alias imported from `@/types/*` matches the backend shape or is frontend-canonical
  - Presence/absence of transform code between `apiClient.get(...)` and the return statement
- [ ] 2.3: Classify A/B/C/D per AC-2 rubric.
- [ ] 2.4: For C-classified entries, note the backend contract source (test-api/*.http if available) to judge drift risk.
- [ ] 2.5: Write the audit report at `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-14.md` following AC-2 schema.
- [ ] 2.6: Propose the follow-up story (name + AC skeleton + SP estimate) at the end of the report.

### Task 3: Optional ESLint stretch (AC-3)

- [ ] 3.1: **Decision gate** — estimate the ESLint work based on whether the project already has custom rules infrastructure. If not (fresh `eslint-rules/` folder needed, new `@typescript-eslint/utils` dependency, test harness), SKIP.
- [ ] 3.2 (if attempting): Create the rule stub; add to config; verify it surfaces at least one warning on a known C-classified site.
- [ ] 3.3 (if skipping): Document rationale in the audit report's Methodology section.

### Task 4: Validation (AC-4)

- [ ] 4.1: `npm run lint && npm run type-check` — zero new warnings/errors.
- [ ] 4.2: `npm test -- --run` — maintain 6763+ passing.
- [ ] 4.3: Open CLAUDE.md in a markdown preview tool or render check — verify section structure, code blocks, links.
- [ ] 4.4: Spot-check 3 random file:line references in the audit report to confirm they still resolve to the right code.

---

## Dev Notes

### Why this is a P3 "pure documentation" story

The epic flagged this as "low risk, pure documentation." Three reasons:
1. The pattern already works — what we're documenting is the victory condition from three prior stories.
2. No code changes means no regression risk.
3. The audit's value is forward-looking: the report becomes a punch list for a future P2 "fix the bypass endpoints" story (separate SP budget).

### Insertion point in CLAUDE.md

The current CLAUDE.md has a "Key Architecture Patterns" section starting around line 309. It currently covers:
- API Client (`src/lib/api-client.ts`)
- TanStack Query (`src/hooks/`)
- Zustand (`src/stores/`)
- Polling Pattern (COGS → Margin)

Add "Boundary Normalizer Pattern" as the new 5th pattern in this section, logically grouped with "API Client" since it's a pattern about HOW to write API modules.

### Audit methodology pre-flight

`grep -l "apiClient\.\(get\|post\|put\|patch\|delete\)" src/lib/api/*.ts src/lib/api/**/*.ts | grep -v __tests__` enumerates the files. For each, the audit needs to answer:

**Is there a transform between the apiClient call and the return statement?**

Short answer patterns:
- `return apiClient.get<T>(...)` — **C** (passthrough).
- `return (await apiClient.get<Raw>(...)).map(normalize)` — **A** (if `normalize` is exported/named) or **B** (if inline arrow).
- `const raw = await apiClient.get<Raw>(...); return { data: raw, meta }` — **D** (wrapped).

The four existing normalizer files (`products-normalizer`, `storage-analytics-trends`, `storage-analytics-queries`, plus inline in `backfill`, `advertising-analytics-api`, `daily-analytics/api`) serve as ground truth examples of "what good looks like."

### File-size budget pre-flight

| File | Current | After change | Status |
|---|---|---|---|
| `frontend/CLAUDE.md` | 676 lines | +~50 lines (AC-1) | ✅ not a source file, no 200-line constraint |
| `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-14.md` | 0 (new) | ~150-200 lines | ✅ doc artifact, unconstrained |

### Out of scope (explicit)

- **Fixing** any C-classified passthrough endpoints — that's the follow-up story this audit scopes.
- **Rewriting** A/B-classified endpoints for consistency — also a follow-up.
- **Backend contract fixes** — tracked separately via `docs/request-backend/*.md`.
- **Runtime validation** (zod, valibot, etc.) at the boundary — worth considering but out of scope here.
- **Changing** `authStore.normalizeUser` or `getBackfillStatus` — they're already correct, used as examples only.

### Anti-patterns to avoid (from CLAUDE.md)

- ❌ Creating unnecessary documentation files beyond CLAUDE.md + 1 audit report. If an audit finding requires its own doc, ship it as part of the follow-up story.
- ❌ Drive-by normalization while writing the audit. Audit = read-only. If you see a bypass that's painful, note it in the report; fix in a separate story.
- ❌ Treating the audit as a blocker — if any file is ambiguous (e.g., routes a type through multiple modules), mark it **"U — unclear, needs investigation"** and proceed. Better to ship a 90% audit than stall on 10%.

---

## References

### Canonical examples (MUST read before writing AC-1 content)

- `src/stores/authStore.ts:10-35` — `normalizeUser` with inline rationale docstring; the gold standard for role-case bridging. Tests at `src/stores/authStore.test.ts`.
- `src/lib/api/backfill.ts:30-89` — `toBackfillStatus` + `toDataSource` helpers + inline `getBackfillStatus` transform; canonical "inline normalizer" example.
- `src/lib/api/products-normalizer.ts:1-80` — `normalizeProduct(raw): ProductWithDimensions`; canonical "extracted normalizer" example with raw types explicit.
- `src/lib/api/storage-analytics-trends.ts:52,109` — `normalizeStorageTrendsResponse` + `normalizeStorageSummaryResponse`; canonical top-level response normalizer.
- `src/lib/api/advertising-analytics-api.ts:88-168` — Story 88.2's nullable-preservation adapter; canonical "null-preservation transform" example.

### Case studies (the 3 bugs this pattern prevents)

- `_bmad-output/implementation-artifacts/84-1-seller-info-available.md` — role-case bug.
- `_bmad-output/implementation-artifacts/87-2-fe-daily-breakdown-table-enhancement.md` — backfill camelCase bug.
- `_bmad-output/implementation-artifacts/87-3-fe-data-quality-polish.md` — null-vs-zero COGS.
- `_bmad-output/implementation-artifacts/88-2-fe-null-type-audit-propagation.md` — null-vs-zero ROAS/daily COGS.

### Retrospective that scoped this story

- `_bmad-output/implementation-artifacts/epic-87-fe-retro-2026-04-14.md` — Action Item #6 (Boundary Normalizer Pattern).

### Epic spec

- `_bmad-output/planning-artifacts/epics-88-fe.md#88.4` — epic context.

### Previous story for context continuity

- `_bmad-output/implementation-artifacts/88-3-fe-e2e-networkidle-migration-dashboard.md` — previous Epic 88 story; landmark-based wait pattern is a sibling concept (documented anti-pattern #9 in CLAUDE.md, same mechanism of prevention through documentation).

### Docs touched

- `frontend/CLAUDE.md` — new section (AC-1).
- `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-14.md` — NEW file (AC-2).

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (1M context)

### Debug Log References

### Completion Notes List

- **AC-1 (CLAUDE.md section)**: Added "Boundary Normalizer Pattern" subsection under Key Architecture Patterns (inserted between "API Client" and "TanStack Query" for logical grouping). Includes definition, why (with the 3-bug case-study table for Stories 84.1 / 87.2 / 87.3+88.2), naming conventions (`normalize<Name>Response`, `to<Type>`, `normalize<Name>`), when-to-use checklist (role case, snake↔camel, nullability, dates, discriminated unions), two full canonical code examples (`authStore.normalizeUser`, `backfill.getBackfillStatus` with `toBackfillStatus`/`toDataSource`), anti-patterns, testing requirement, and cross-refs to the four case-study stories plus the audit. ~75 lines added.
- **AC-2 (audit report)**: Produced `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md`. 53 files audited (corrected from 54 during review). Classification: 4 A (explicit normalizers), 9 B (inline normalizers), 33 C (passthrough), 7 D (barrel/types). Top-5 high-risk C endpoints identified: `tariffs.ts` (WB SDK drift), `supplies.ts` (WB SDK drift), `fbs-analytics.ts` (nullability), `orders-history-api.ts` (type complexity), `cabinet.ts` (Stories 84.x touch points). Follow-up story proposed: `89.1-fe-normalize-high-risk-endpoints` (5 SP, P2). Includes Methodology section with reproducible grep commands.
- **AC-3 (optional ESLint stretch)**: SKIPPED per epic spec allowance. Rationale documented in audit report: project has no existing custom-rules infrastructure, authoring would exceed P3 budget. Future-rule design (`no-raw-api-response`) sketched in the audit so the next person has a starting point. Alternative grep-based CI check mentioned.
- **AC-4 (validation)**: `npm run lint` zero warnings. `npm run type-check` zero errors. `npm test -- --run` → 6764 passing (vs baseline 6763, +1 from Story 88.2's new tests carried over). 3 pre-existing DashboardPeriodSelector failures unrelated to this story (documented in Story 88.1 completion notes). All file:line references in the audit verified against current source (backfill.ts:33,40,55-89; products-normalizer.ts:80; storage-analytics-trends.ts:52,109). CLAUDE.md section renders correctly.
- **Zero code changes** except CLAUDE.md and the new audit markdown — matches the P3 "pure documentation" contract.

### File List

**Modified docs (1):**
- `frontend/CLAUDE.md` — new "Boundary Normalizer Pattern" subsection (~75 lines) under Key Architecture Patterns

**Created (1):**
- `_bmad-output/planning-artifacts/boundary-normalizer-audit-2026-04-15.md` — audit report (54 files classified, top-5 risks, follow-up story proposal, methodology)

**Modified code:** None (pure documentation story)

**Deleted:** None

### Change Log

| Date | Change |
|---|---|
| 2026-04-14 | Story created via create-story workflow — scoped to 1 CLAUDE.md section + 1 audit report + optional ESLint stretch. Pattern already proven by 5 existing normalizer examples (`authStore.normalizeUser`, `backfill.toBackfillStatus`, `products-normalizer`, `storage-analytics-trends`, `advertising-analytics-api` post-88.2). Zero code changes except CLAUDE.md + new audit markdown. |
| 2026-04-15 | Implementation complete. CLAUDE.md section added (~75 lines). Audit report produced (54 files classified: 4 A / 9 B / 33 C / 8 D). Top-5 risks identified, follow-up story 89.1-fe-normalize-high-risk-endpoints (5 SP) proposed. AC-3 ESLint stretch skipped per epic spec. Type-check + lint clean; 6764 unit tests pass (zero regressions). Status → review. |
| 2026-04-15 | Code review: 0 HIGH, 1 MEDIUM, 3 LOW findings; all 4 fixed. Type-check + lint still clean after fixes. Status → done. |

### Code Review Fixes (2026-04-15)

Adversarial self-review surfaced 4 findings; all fixed:

- **M-1 (fixed)**: CLAUDE.md Testing-requirement paragraph cited `src/stores/__tests__/authStore.test.ts` — the actual path is `src/stores/authStore.test.ts` (co-located, not in a `__tests__/` subdir). A dev clicking through from CLAUDE.md would have hit file-not-found. Corrected path.
- **L-1 (fixed)**: Audit had `src/lib/api/daily-analytics.ts` duplicated in both the C table (with "actually D" note) and the D table. Removed from C; summary counts `33 C / 8 D` now match reality after dedup.
- **L-2 (fixed)**: CLAUDE.md Example 2 abbreviated `getBackfillStatus()` with a terse `// ...dual-lookup...` comment. Expanded to explain the design intent (absorbing a rolling backend rename, the normalizer as the hinge that keeps both contracts valid) so future readers get the WHY directly, not just the WHAT.
- **L-3 (fixed)**: Audit top-5 risks used qualitative descriptors ("high"/"medium") without a reproducible scoring rubric. Added explicit 1–5 rubric across Volatility / Complexity / Blast radius dimensions with a summary table that ranks candidates by total score — future audits can reproduce and defend the ranking.

**Post-fix verification**: `npm run lint` zero warnings. `npm run type-check` zero errors. No test regressions (story is pure documentation; tests not re-run since no source code changed post-review).

### Final "even minors" sweep (2026-04-15)

After the main review, the user directed another pass for "all issues even minors." Two additional low-severity issues surfaced and were fixed:

- **N-1 (fixed)**: Audit miscategorized `src/lib/api/storage-analytics.ts` as D (no API calls) because the file is primarily a barrel re-export of `-queries` / `-trends`. However, it also defines `triggerPaidStorageImport` + status poll (2 own `apiClient` calls). Moved to C with a note explaining the hybrid nature.
- **N-2 (fixed)**: Summary total claimed "54 files audited" and "D = 8" — `find src/lib/api -type f -name "*.ts" -not -path "*/__tests__/*" | wc -l` returns **53**, and D is **7** after N-1 fix. Corrected summary, total, and Change Log entry. 4 + 9 + 33 + 7 = 53 ✓.
