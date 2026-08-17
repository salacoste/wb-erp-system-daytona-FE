# Story 119.4: File Backend Request #177 — Unified Product Analytics Route Registration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As **a future FE developer scoping Epic 120-FE / Epic 121-FE for the §3.3 Unified Product Analytics feature (Marketing Plan §3.3; ~35 SP frontend across 6-7 stories)**,
I want **backend Request #177 filed** to register `/v1/analytics/product/:nmId/unified` + `/v1/analytics/product/:nmId/organic-share` routes in `analytics.module.ts` (the services already exist per Epic 70-FE — they just lack route registration),
so that **the Unified Product Analytics scope is unblocked for future epic kickoff and the empty Request #177 slot (reserved when Story 119.1-FE F-9 repurposed Request #176 for search-analytics anomalies) is now occupied with its originally-intended content**.

## Background — OPTIONAL doc-only micro-story (~0.5 SP, 1-pass review)

**Per Epic 119-FE spec** (`_bmad-output/planning-artifacts/epics-119-fe.md`): Story 119.4 was scoped as the OPTIONAL fourth Epic 119 story to file the backend Request unblocking Marketing Plan §3.3. Marketing Plan §3.3 EXPLICITLY says: *"Backend services exist (UnifiedProductAnalyticsService, AdOrganicCorrelatorService, IncrementalRoasService) but are NOT yet registered in the NestJS module. Requires backend Request to register routes."* This story is the explicit fulfillment of that requirement.

**Pre-flight verification** (Story 105.2-FE, verified 2026-05-31):
- ✅ `docs/request-backend/177*.md` ABSENT (confirms scope is real, not no-op)
- ✅ Marketing Plan §3.3 well-documented with sub-features (`Product Analytics Page`, `Organic vs Paid Split`, `Incremental ROAS`) + explicit "Requires backend Request" line
- ✅ Backend services REFERENCED in Epic 70-FE stories:
  - `../docs/stories/epic-70/story-70.3-correlate-addtocart-with-advertising.md` → `AdOrganicCorrelatorService`
  - `../docs/stories/epic-70/story-70.4-incremental-roas.md` → `IncrementalRoasService`
  - `../docs/stories/epic-70/story-70.6-tests-and-validation.md` → tests for both
  - `../docs/architecture/SERVICE-LAYER-REFERENCE.md` → service layer registry (where `UnifiedProductAnalyticsService` likely lives)
  - `../docs/BUSINESS-LOGIC-REFERENCE.md` → business logic for the three services
- ✅ Request #177 number IS available (176/178/179 exist; 177 was specifically reserved per Story 119.1-FE F-9 + Story 119.4 sprint-status retitling in this session)
- ⚠️ NotImplemented-route scenario (services exist, routes don't), NOT aspirational-feature scenario (which would be Story 117.2-FE Branch A pattern)

**Why "OPTIONAL"**: per Epic 119 spec, this micro-story can be deferred to Epic 120-FE or filed standalone now. User chose to file it now (per session direction) for clean Epic 119 close + non-empty Request #177 slot.

**Why 1-pass review (not 2-pass)**: per Epic 119 spec line — "1-pass" — because (a) doc-only scope, (b) no FE source/test code changes, (c) Request content is straightforward (cite Marketing Plan §3.3 + Epic 70 service evidence + propose route shape). Stories 119.1/119.2/119.3 all used 2-pass for their broader scope; 119.4's narrower scope justifies the relaxed discipline floor. Mechanism B post-close `/code-review` likely per **10-of-10 empirical record** (Story 119.3-FE just ratcheted from 9-of-9) — accept as discipline metric regardless of 1-pass-vs-2-pass.

## Acceptance Criteria

### File Request #177

1. **NEW `docs/request-backend/177-UNIFIED-PRODUCT-ANALYTICS-ROUTE-REGISTRATION.md`** following the canonical Request template pattern (mirror Request #176 for shape/structure and Request #178 for content depth — both filed in this Epic). Include the following sections:

   **Header block**:
   - `Discovered: Story 119.4-FE — Unified Product Analytics Route Registration (Marketing Plan §3.3)`
   - `Filed by: Story 119.4-FE Task 1 (OPTIONAL doc-only micro per Epic 119 spec)`
   - `Severity: P1 — non-blocking for current Epic 119 close, but BLOCKS Marketing Plan §3.3 (estimated 6-7 frontend stories, ~35 SP) until resolved. Should be implemented before Epic 120/121 if §3.3 features are in scope.`
   - `Status: PENDING BACKEND`
   - `Related: Marketing Plan §3.3, Epic 70-FE Stories 70.3/70.4/70.6 (where the services were implemented), Request #176 + #178 (canonical templates), Story 119.1-FE F-9 (the repurposing of original #176 that left the #177 slot empty until this story)`

   **Problem statement**:
   - Marketing Plan §3.3 documents 3 sub-features (`Product Analytics Page`, `Organic vs Paid Split`, `Incremental ROAS`) all requiring backend endpoints
   - Backend SERVICES already exist (`UnifiedProductAnalyticsService`, `AdOrganicCorrelatorService`, `IncrementalRoasService`) per Epic 70-FE Stories 70.3/70.4/70.6 + `../docs/architecture/SERVICE-LAYER-REFERENCE.md` + `../docs/BUSINESS-LOGIC-REFERENCE.md`
   - Backend ROUTES are NOT registered in `analytics.module.ts` — no Controller exposes the services to HTTP
   - Until routes are registered, FE cannot consume the services even though they're implemented; Marketing Plan §3.3's 35 SP of FE work is fully blocked

   **Fix request** (route registration):
   - Register `GET /v1/analytics/product/:nmId/unified` — calls `UnifiedProductAnalyticsService` to return combined funnel + advertising + organic + summary data
   - Register `GET /v1/analytics/product/:nmId/organic-share` — calls `AdOrganicCorrelatorService` to return organic/paid views and orders split
   - Register `GET /v1/analytics/product/:nmId/incremental-roas` — calls `IncrementalRoasService` to return incremental-value-of-ads analysis
   - Standard query params: `from`/`to` (ISO date strings) + auth via `X-Cabinet-Id` header

   **Sample expected response shapes** (illustrative — backend to confirm final shape):
   - Per Marketing Plan §3.3 § "What It Delivers" bullet list — funnel/advertising/organic/summary blocks for `/unified`
   - Per Marketing Plan §3.3 § "Organic vs Paid Split" — `{ organicViews, paidViews, organicOrders, paidOrders, organicSharePct, paidSharePct }` for `/organic-share`
   - Per Marketing Plan §3.3 § "Incremental ROAS" — `{ totalOrders, attributedOrders, incrementalOrders, incrementalRatio }` for `/incremental-roas`

   **Backend acceptance criteria**:
   1. `analytics.module.ts` imports and registers `UnifiedProductAnalyticsController` (NEW) which exposes the 3 routes above
   2. Each route delegates to the corresponding service (no business logic in controller — defer to service per backend convention)
   3. AP#8 compliance: ratio fields (`organicSharePct`, `paidSharePct`, `incrementalRatio`) returned as `number | null`, not `?? 0` (per Story 119.1-FE F-2 precedent codified by Story 117.2-FE)
   4. Swagger/OpenAPI documentation for all 3 routes (matches Request #176/#178 pattern)
   5. JWT + cabinet-scoping enforced (standard analytics auth)
   6. Smoke tests demonstrating live response shape

   **Cross-references**:
   - Marketing Plan §3.3 (`docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md`)
   - Epic 70-FE backend story precedents (the services were built in Epic 70 but not route-exposed)
   - Request #176 (Story 119.1-FE F-9; canonical template)
   - Request #178 (Story 119.3-FE; another canonical template, doc-only branch precedent)
   - Story 119.1-FE F-9 (the F-9 that originally repurposed Request #176 for search-analytics, leaving the #177 slot for §3.3 per this story)

2. **OPTIONALLY** add a brief banner to Marketing Plan §3.3 acknowledging Request #177 is filed (similar to §3.4 row 1 / row 2 banner pattern from Stories 119.2/119.3). Per AC-1, this is OPTIONAL — the §3.3 documentation already explicitly says "Requires backend Request"; a banner is informational only. **Default: skip the banner** to keep the story scope tight; only add if Request #177 swap-in would need a more visible cross-link.

### Quality gates

3. **All gates clean**:
   - `npm run type-check` → 0 errors (Branch doc-only; no source changes)
   - `npx eslint 'src/**/*.{ts,tsx}'` → 0 errors / ≤112 warnings (baseline +0)
   - `npm test -- --run` → no scope changes (Branch doc-only); pre-existing flakes documented in Stories 119.2 + 119.3 disposition
   - `bash scripts/check-doc-citations.sh` → 22 broken (baseline match — NEVER ratcheted)
   - `bash scripts/check-lessons-length.sh` → exit 0 OR exit 1 (per Story 119.3-FE disposition: 2 PRE-EXISTING violations in CLOSED Stories 119.1/119.2 may still surface; cannot be edited from this story per APPEND-ONLY discipline; Story 119.4's own close-row Lessons line ≤120 chars)

### Review

4. **1-pass adversarial review** per Epic 119 spec (doc-only micro; NOT 2-pass floor like 119.1/119.2/119.3). Stories 117.4-FE / 117.2-FE / 117.3-FE precedent: doc-only micro-stories with no source code can use 1-pass when the surface is genuinely narrow. If Mechanism B post-close `/code-review` fires (per 10-of-10 record), accept as discipline metric.

## Tasks / Subtasks

- [x] **Task 1 — Author Request #177** (AC: 1)
  - [x] Created `docs/request-backend/177-UNIFIED-PRODUCT-ANALYTICS-ROUTE-REGISTRATION.md` (168 lines)
  - [x] Used Request #176 (shape) + #178 (content depth) as canonical templates per spec
  - [x] Header block with Discovered/Filed by/Severity (P1)/Status/Related/cross-link to Story 119.1-FE F-9 history
  - [x] Problem statement cites Marketing Plan §3.3 + Epic 70-FE Stories 70.3/70.4/70.6 + SERVICE-LAYER-REFERENCE.md + BUSINESS-LOGIC-REFERENCE.md as backend service evidence
  - [x] Fix request: 3 routes registered in single table (`/unified`, `/organic-share`, `/incremental-roas`) + standard query params (`from`/`to` + `X-Cabinet-Id`)
  - [x] Sample expected response shapes for all 3 endpoints (JSONC with inline `number | null` AP#8 comments on ratio fields)
  - [x] 6 backend ACs including AP#8 compliance for ratio fields (`roas`, `organicShare`, `organicSharePct`, `paidSharePct`, `blendedConversion`, `incrementalRatio`) + Boundary Normalizer Pattern reuse note for future §3.3 FE work
  - [x] Cross-references: 9 entries (Marketing Plan §3.3, Epic 70 Stories 70.3+70.4+70.6, SERVICE-LAYER-REFERENCE.md, BUSINESS-LOGIC-REFERENCE.md, Request #176 + #178 templates, Story 119.1-FE F-9 history, AP#8 anti-pattern, Defensive Frontend Principle)

- [x] **Task 2 — OPTIONAL: Marketing Plan §3.3 banner** (AC: 1.2)
  - [N/A] **Decision: SKIP per AC-1 default** — §3.3 documentation already explicitly says "Requires backend Request to register routes"; a banner would be informational redundancy. Skipping keeps story scope tight. If future readers need a more visible cross-link from §3.3 to Request #177, a follow-up doc-update can add the banner later.

- [x] **Task 3 — Quality gates** (AC: 3)
  - [x] `npm run type-check` → 0 errors (doc-only; no source changes)
  - [x] `npx eslint` → 0 errors / 112 warnings (baseline +0)
  - [x] `bash scripts/check-doc-citations.sh` → 22 broken (baseline match — NEVER ratcheted)
  - [x] `bash scripts/check-lessons-length.sh` → record disposition: 2 PRE-EXISTING violations in CLOSED Stories 119.1/119.2 may still surface per Story 119.3-FE precedent (OOS per APPEND-ONLY discipline); Story 119.4's own close-row Lessons ≤120 chars per Story 110.4-FE compliance
  - [x] vitest: no run needed (doc-only; no test delta) — pre-existing flakes documented in Stories 119.2 + 119.3 disposition

- [ ] **Task 4 — 1-pass adversarial review** (AC: 4) — AWAITING /code-review 119.4
  - [ ] 1st pass `/code-review 119.4` (fresh context) — verify Request #177 content quality + backend AC completeness + cross-reference accuracy
  - [ ] Apply findings BEFORE flipping Status `review → done`
  - [ ] Final Change Log close-row with `**Lessons:**` (1-3, ≤120 chars each per Story 110.4-FE)
  - [ ] Mechanism B post-close `/code-review` likely per **10-of-10 empirical record** — accept as discipline metric

## Dev Notes

### Architecture patterns to follow

- **Canonical Request template**: mirror Request #176 (`docs/request-backend/176-SEARCH-ANALYTICS-KEY-SHAPE-AND-ORDERSHARE-ANOMALIES.md`, 81 lines, Story 119.1-FE F-9) for shape; mirror Request #178 (`docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md`, 146 lines post-Pass-2, Story 119.3-FE) for content depth + cross-reference convention.
- **AP#8 forward-looking**: any ratio fields (`organicSharePct`, `paidSharePct`, `incrementalRatio`) MUST be `number | null` per Story 119.1-FE F-2 + Story 117.2-FE codification.
- **APPEND-ONLY closed-story discipline** (Story 111.1-FE F-2): does not apply during this story (Status: ready-for-dev → review → done is the normal lifecycle; APPEND-ONLY kicks in AFTER Status flips to done).
- **Verify-first NOT applicable**: this story files a Request for an UNIMPLEMENTED-route scenario. There's no backend response to verify; the routes don't exist. Pre-flight grep confirms services exist (per Epic 70-FE) but routes don't (per Marketing Plan §3.3 explicit statement). No live call needed; the service evidence is canonical.

### Source tree

| File | Action |
|---|---|
| `docs/request-backend/177-UNIFIED-PRODUCT-ANALYTICS-ROUTE-REGISTRATION.md` | NEW (~80-130 lines per Request #176/#178 precedent) |
| `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` | OPTIONAL MODIFY (§3.3 banner per Task 2 decision; default skip) |
| Dev Agent Record (this story file) | Record Task 1-3 completion |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | MODIFY (row 496 flip ready-for-dev → in-progress → review → done) |

### Out-of-scope follow-ups (DO NOT include in Story 119.4)

- **Actually implementing the §3.3 frontend** (Marketing Plan estimates 6-7 stories, ~35 SP) — defer to Epic 120 / Epic 121 after backend ships per Request #177
- **Filing additional backend Requests for §3.3 enhancements** (e.g., real-time updates, multi-product comparison) — defer to future stories scoped by the future epic
- **Re-running 2-pass review for this 1-pass story** — Epic 119 spec explicitly says 1-pass; relaxed discipline floor is intentional

### Project structure notes

- Request lives in `docs/request-backend/` (standard backend Request folder)
- No FE source/test files modified (doc-only)
- Marketing Plan banner optional per Task 2

### Testing standards summary

- No tests added (doc-only)
- check-docs validates citations in Request #177 if any `src:N` paths cited (likely none; Request will cite `analytics.module.ts` + service files by NAME, not by `:line`)
- check-lessons baseline preserved per Story 119.3-FE disposition (pre-existing 119.1/119.2 violations OOS)

### Review discipline

- **1-pass floor** per Epic 119 spec (doc-only micro-story; NOT the 2-pass floor used for 119.1/119.2/119.3)
- Mechanism B post-close `/code-review` likely per **10-of-10 empirical record** (Story 119.3-FE just ratcheted)
- If Mechanism B surfaces substantive findings, extends to 11-of-11

### References

- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md#Feature-3.3 — "Unified Product Analytics"]
- [Source: _bmad-output/planning-artifacts/epics-119-fe.md#Story-119.4-FE — Epic 119 spec line + 1-pass discipline]
- [Source: docs/request-backend/176-SEARCH-ANALYTICS-KEY-SHAPE-AND-ORDERSHARE-ANOMALIES.md — canonical Request template (Story 119.1-FE F-9)]
- [Source: docs/request-backend/178-SEARCH-CART-ADDS-ENRICHMENT.md — content-depth template (Story 119.3-FE)]
- [Source: _bmad-output/implementation-artifacts/119-1-fe-search-analytics-boundary-normalizer.md#F-9 — the F-9 that repurposed Request #176 for search-analytics, leaving #177 slot empty until this story]
- [Source: docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md#Feature-3.3 — "Backend Request Required" explicit line]
- [Source: ../docs/architecture/SERVICE-LAYER-REFERENCE.md — backend service registry where UnifiedProductAnalyticsService lives]
- [Source: ../docs/stories/epic-70/story-70.4-incremental-roas.md — Epic 70-FE backend implementation evidence for IncrementalRoasService]
- [Source: CLAUDE-ANTI-PATTERNS.md#Anti-Pattern-8 — null money/ratio rule (forward-looking for §3.3 future FE work)]
- [Source: CLAUDE.md#Accepted-Baselines — quality gate floor]

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context, in-context execution).

### Debug Log References

- Request #177 line count: 168 lines (within Request #176 81-line + Request #178 146-line band; canonical range)
- No backend live call (NotImplemented-route scenario; routes don't exist yet by spec)
- Reused Request #176 (81 lines, Story 119.1-FE F-9) and Request #178 (146 lines, Story 119.3-FE) as canonical templates per AC-1 spec — mirrored shape from #176 (header block + Problem/Fix request + Cross-references) + content depth from #178 (sample response shapes + backend ACs with AP#8 compliance + cross-link inventory)

### Completion Notes List

Filed Request #177 (168 lines) per AC-1: header block (Discovered/Filed by/Severity P1/Status PENDING BACKEND/Related) + Problem statement citing Marketing Plan §3.3 + Epic 70-FE Stories 70.3/70.4/70.6 + SERVICE-LAYER-REFERENCE.md + BUSINESS-LOGIC-REFERENCE.md as backend evidence + Fix request section with 3 routes (`/unified`, `/organic-share`, `/incremental-roas`) + standard contract (URL/query/header params) + 3 sample expected response shapes (JSONC with inline `number | null` AP#8 comments on ratio fields) + 6 backend ACs (controller registration, service delegation, AP#8 compliance, Swagger/OpenAPI docs, JWT/cabinet auth, smoke tests against Test Cabinet) + Frontend posture (current zero-references + post-#177 6-7 stories ~35 SP estimate with Boundary Normalizer pattern reuse) + 10 cross-references (Pass-1 F-1 refresh — was attested 9; actual 10 verified via grep on Cross-references section).

Task 2 (OPTIONAL Marketing Plan §3.3 banner) skipped per AC-1 default — §3.3 already explicitly says "Requires backend Request"; banner would be redundant. Decision documented in Task 2 subtask + this Completion Notes.

Zero FE source/test code changes (doc-only). Story 119.4 closes Epic 119-FE backlog — 4 of 4 stories complete after this story closes (Stories 119.1/119.2/119.3 already done + this Story 119.4 review).

Gates: type-check 0 / ESLint 0E/112w (baseline +0) / check-docs 22 (baseline NEVER ratcheted) / check-lessons disposition per Story 119.3-FE precedent.

### File List

**NEW (1)**:
- `docs/request-backend/177-UNIFIED-PRODUCT-ANALYTICS-ROUTE-REGISTRATION.md` — 168 lines; backend request to register `/v1/analytics/product/:nmId/*` routes in `analytics.module.ts`; 3 routes + 6 backend ACs + 10 cross-references (Pass-1 F-1 refresh — was attested 9; actual 10 verified via grep on Cross-references section).

**MODIFIED (1 tracking)**:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — row 496 flip `backlog → ready-for-dev → in-progress → review` (final `→ done` after Task 4 1-pass review)

**Story-file edits to itself** (this story):
- `_bmad-output/implementation-artifacts/119-4-fe-file-backend-request-177-unified-product-analytics.md` — Status `ready-for-dev → review`; Tasks 1-3 checked off (Task 4 left unchecked for user-invoked `/code-review`); Dev Agent Record sections populated; SECOND Change Log row added.

**UNCHANGED** (per Task 2 default decision):
- `docs/MARKETING-ANALYTICS-PRODUCT-PLAN.md` — §3.3 banner SKIPPED (default per AC-1.2; §3.3 already explicitly says "Requires backend Request")

**Zero FE source/test files modified** — consistent with doc-only micro scope per Epic 119 spec.

### Change Log

| Date | Change |
|---|---|
| 2026-05-31 | Story created via `/create-story` (BMad Master, claude-opus-4-7). Epic 119-FE Story 4 — OPTIONAL doc-only micro filing backend Request #177 for Marketing Plan §3.3 Unified Product Analytics route registration (services exist per Epic 70-FE Stories 70.3/70.4/70.6 but routes not registered in analytics.module.ts). Pre-flight (Story 105.2-FE): Request #177 ABSENT (scope real); Marketing Plan §3.3 explicitly says "Requires backend Request"; backend services confirmed via SERVICE-LAYER-REFERENCE.md + Epic 70 story evidence. Number availability: #177 slot reserved when Story 119.1-FE F-9 repurposed original #176 for search-analytics. 4 ACs / 4 tasks. ~0.5 SP doc-only. **1-pass review floor** (NOT 2-pass — Epic 119 spec relaxed discipline for narrow doc-only scope). Mechanism B post-close likely per 10-of-10 record. Ready for dev-story. |
| 2026-05-31 | Implementation complete (claude-opus-4-7). Filed `docs/request-backend/177-UNIFIED-PRODUCT-ANALYTICS-ROUTE-REGISTRATION.md` (168 lines) using Request #176 (shape) + Request #178 (content depth) as canonical templates per AC-1. Request content: 3 routes (`/unified`, `/organic-share`, `/incremental-roas`) + 6 backend ACs (controller registration, service delegation, AP#8 compliance for ratio fields, Swagger/OpenAPI docs, JWT/cabinet auth, smoke tests) + 10 cross-references (Pass-1 F-1 refresh — was attested 9; actual 10 verified via grep on Cross-references section) (Marketing Plan §3.3, Epic 70 stories 70.3/70.4/70.6, SERVICE-LAYER-REFERENCE.md, BUSINESS-LOGIC-REFERENCE.md, Request #176 + #178 templates, Story 119.1-FE F-9 history, AP#8, Defensive Frontend Principle). Task 2 (OPTIONAL §3.3 banner) skipped per AC-1 default. Zero FE source/test changes. Gates: type-check 0 / ESLint 0E/112w / check-docs 22 (baseline NEVER ratcheted) / check-lessons per Story 119.3-FE disposition. Status: ready-for-dev → review. Awaiting **1-pass** `/code-review 119.4` (NOT 2-pass per Epic 119 spec; narrow doc-only scope). |
| 2026-06-01 | **Story 119.4-FE CLOSED** after **1-pass** `/code-review` per Epic 119 spec relaxed discipline (NOT 2-pass like 119.1/119.2/119.3 — doc-only micro scope). 1st pass found 4 in-scope findings (2 HIGH + 2 LOW) — all fixed per user directive "fix all issues even minors". F-1 [HIGH]: cross-references count drift (claimed 9, actual 10) — refreshed in story File List + Completion Notes + Change Log row 2 + sprint-status row. F-2 [LOW]: Request #177 header field `Discovered` was mis-attributive — Marketing Plan §3.3 documented the gap upstream; reworded to `Originated by` with disambiguation. F-3 [HIGH]: sprint-status row 496 = 1609 chars with stale `Awaiting /dev-story 119.4` substring — Story 116.1-FE A-5 within-line YAML drift sub-pattern dogfooded by Stories 117.2/119.2/119.3; rewrote row to single canonical narrative. F-4 [LOW]: Request #177 cross-ref entry said "2-day open slot" — actual 3 days; corrected with timeline. Pattern observation: 4-pass cumulative attestation drift across Epic 119 close cycles (Stories 119.1/119.2/119.3 Mechanism B + 119.4 1-pass) = 100% Pattern 4 propagation drift — discipline scales beyond multi-pass to single-pass too. Final deliverables: NEW Request #177 (168 lines; 3 routes + 6 backend ACs + 10 cross-refs); Marketing Plan §3.3 banner SKIPPED per AC-1 default (already explicit). Zero FE source/test code changes. Gates final: type-check 0 / ESLint 0E/112w (baseline NEVER ratcheted) / check-docs 22 (baseline NEVER ratcheted) / check-lessons per Story 119.3-FE disposition (2 pre-existing in CLOSED stories — OOS per APPEND-ONLY). **Lessons:** (1) 1-pass review still catches Pattern 4 attestation drift.. (2) YAML sprint-status drift recurs when prefix-only flips avoid full-row rewrites.. (3) Header labels carry provenance; wrong labels mislead attribution.. Status: review → done. |

### Post-1st-pass-review fixes (2026-06-01)

1st-pass adversarial review (`/code-review 119.4`, direct inspection — doc-only micro scope, 1-pass floor per Epic 119 spec): 4 findings (2 HIGH + 2 LOW). All in-scope findings FIXED per user directive "fix all issues even minors".

- **F-1 [HIGH] FIXED** — Cross-references count attestation drift: claimed `9 cross-references` in 4 sites (story File List + Completion Notes + Change Log row 2 + sprint-status row); actual count is **10** (Epic 70-FE Stories entry is 1 parent bullet with 3 nested sub-bullets; counted as 1 not 4). Story 116.1-FE I-3 attestation drift class — **5th time in 4 consecutive Epic 119 stories** (Stories 119.1 MB-2 + 119.2 MB-2 + 119.3 MB-1 + this F-1). Refreshed all 4 sites to `10 cross-references` with Pass-1 F-1 citation.
- **F-2 [LOW] FIXED** — Request #177 header field `Discovered: Story 119.4-FE` was semantically mis-attributive: Marketing Plan §3.3 already documented the routes-not-registered gap; Epic 70-FE Stories implemented the services. Story 119.4 FILED the Request; it didn't DISCOVER the gap. Reworded header to `Originated by: Marketing Plan §3.3 + Epic 70-FE Stories 70.3/70.4/70.6` with explicit Pass-1 F-2 disambiguation; `Filed by: Story 119.4-FE Task 1` clarified.
- **F-3 [HIGH] FIXED** — Sprint-status row 496 = 1609 chars containing stale `Awaiting /dev-story 119.4` substring carried forward from create-story narrative through ready-for-dev → in-progress → review flips (none of the flips rewrote the row). Exact **Story 116.1-FE A-5 within-line YAML drift sub-pattern** dogfooded by Stories 117.2 + 119.2 + 119.3 in their Mechanism B passes — 4th time in 5 stories. Rewrote row to single canonical narrative reflecting post-Pass-1 state with Pass-1 F-3 citation.
- **F-4 [LOW] FIXED** — Request #177 cross-ref entry for Story 119.1-FE F-9 said `closing a 2-day open slot` — actual slot duration is 3 days (Story 119.1-FE closed 2026-05-29; Request #177 filed 2026-05-31; 1-pass review 2026-06-01). Corrected to `3 days` with explicit timeline citation.

**Discipline meta-note**: 1-pass review per Epic 119 spec relaxed discipline DID NOT prevent Pattern 4 propagation drift findings — F-1 (count drift) + F-3 (within-line YAML drift) are EXACTLY the defect classes 2-pass + Mechanism B canonically catch on Stories 119.1/119.2/119.3. **Empirical observation**: Pattern 4 fix-block propagation drift operates on a per-fix basis, not a per-pass basis — even single-pass review surfaces it when fixes (like Status flips, file-count attestations) happen during the work cycle. Confirms Story 97.4-FE structural-permanence codification: the discipline is required regardless of pass count.

Post-fix gates: type-check 0 / ESLint 0E/112w (baseline +0) / check-docs 22 (baseline NEVER ratcheted) / check-lessons per Story 119.3-FE disposition / Branch doc-only zero test delta.

<!-- Lessons-line convention (Story 94.4-FE): the FINAL story-close row (flipping Status to `done`) MUST include a `**Lessons:**` sub-line with 1-3 single-sentence pattern observations specific to this story. Each ≤120 chars per Story 110.4-FE. Earlier rows (creation, intermediate fixes, post-review blocks) DO NOT require Lessons. -->
