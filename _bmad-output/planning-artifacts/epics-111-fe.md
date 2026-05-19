# Epic 111-FE: Epic 110-FE Carry-Forward (Scope-Cut)

**Status**: done (closed 2026-05-20 after Story 111.1 close)
**Priority**: P2
**Estimated**: 0.5 SP shipped (originally placeholder ~4 SP, scope-cut)
**Source**: Epic 110-FE retrospective Action Items A-1 + A-2
**Spec date**: 2026-05-20 (retrospective spec authoring per `/bmad:bmm:workflows:create-story 111.1` decision flow)

---

## Original Placeholder vs Actual Scope

The original `sprint-status.yaml` placeholder for Epic 111-FE read:

> **AI Admin Features (P3, ~4 SP, role-gated) — anomaly resolution, model rollback admin UI (Owner role only)**

When `/bmad:bmm:workflows:create-story 111.1` was invoked on 2026-05-19, the user chose **"Carry-forward bundle (A-1 + A-2)"** for Story 111.1 scope rather than admin-feature work. After Story 111.1 closed, the user instructed (1) commit, (2) author this Epic 111-FE spec, (3) flip Epic 111-FE → done — explicitly **scope-cutting the admin features out of Epic 111** and treating Story 111.1's carry-forward work as the entirety of Epic 111-FE.

The originally-placeholder admin features (anomaly resolution UI + model rollback admin UI + AI preferences admin UI) are deferred to **Epic 112-FE** (TBD authoring; see "Deferred Scope" section below).

---

## Epic Summary

**Objective**: Ship two prevention scaffolds that surfaced during Epic 110-FE's 2-pass + 3-pass adversarial review chains, before continuing into AI module feature work. The scaffolds make it less likely that future stories will re-encounter defects already caught and codified during Epic 110.

**Single story delivered**:

### Story 111.1-FE: Epic 110-FE carry-forward — opaque-ID anti-pattern + lessons-length validator (0.5 SP)

Closed 2026-05-19 after 3-pass adversarial review (9 + 6 + 2 = 17 findings resolved across different defect classes). Ships:

- **CLAUDE-ANTI-PATTERNS.md § 10** — `formatNumber(opaqueId)` mangles search-key copy-paste (Russian non-breaking space). Use `String(id)` for opaque numeric IDs (nmId, productId, forecastId-as-number). Canonical: Story 110.3-FE F-8.
- **CLAUDE.md Known Anti-Patterns** list bumped from 9 → 10 entries with inline canonical-Story reference.
- **CLAUDE.md APPEND-ONLY convention** for closed-story Change Log rows (2nd-pass F-2 codification — prevents the in-cell-trim-on-closed-story defect that 1st-pass introduced).
- **`scripts/check-lessons-length.sh`** — char-count validator (Python `len()`, Story 94.4-FE convention verbatim) with `KNOWN_CARRYOVER_ALLOWLIST` of 16 pre-existing violation stories, Python3 ≥3.6 check, malformed-row WARN, local-only-dev-tooling header.
- **`scripts/test-check-lessons-length.sh`** — 18-case self-test (positive boundary tests + Cyrillic + allowlist-skip + malformed-period detection + edge cases).
- **`npm run check:lessons`** ergonomic script entry.

---

## Dependencies

- Epic 110-FE foundation (closed 2026-05-19) — Story 110.3-FE F-8 surfaced the opaque-ID rule; Stories 110.3+110.4 3rd-pass surfaced the char-count meta-pattern requiring mechanical validation
- Story 94.4-FE Lessons-line convention (2026-04-25 codification)
- Story 89.3-FE doc-citation validator (script structure precedent)
- Story 105.1-FE Anti-Pattern #8 ESLint rule self-test (test structure precedent)
- Story 97.1-FE fix-block propagation + Story 97.2-FE authoritative-source-citation disciplines (defect-class precedents — actively cited during 1st/2nd/3rd-pass reviews)
- Story 110.5-FE F-1 retrospective action: `scripts/check-lessons-length.sh` was the Action Item A-2 deliverable

## Risks / Open Questions

| # | Question | Resolution |
|---|---|---|
| 1 | Char-count vs byte-count for Lessons cap | **Char-count** — matches Story 94.4-FE convention verbatim. 1st-pass initially used byte-count; 2nd-pass F-1 corrected. (See Story 111.1-FE Post-2nd-pass review block for the full attestation chain.) |
| 2 | How to handle 16 pre-existing violation stories (closed before validator existed) | **Explicit `KNOWN_CARRYOVER_ALLOWLIST` array in the validator script** (2nd-pass F-1 fix). Date-gate approach rejected (1st-pass attempted; 2nd-pass caught rationale was factually wrong by 24 days). Each allowlist entry emits stderr WARN to keep them visible as Epic 112 cleanup targets. |
| 3 | Should the validator gate CI? | **No** — local-only dev tooling. The corpus (`_bmad-output/implementation-artifacts/`) is gitignored, so the validator is non-reproducible across machines. NOT added to `CLAUDE.md § Accepted Baselines`. Run `npm run check:lessons` locally before flipping a story to `done`. |
| 4 | Anomaly resolution + model rollback admin UI scope | **Deferred to Epic 112-FE** (see Deferred Scope section). Story 111.1 was the only Epic 111-FE deliverable. |

## Carry-Forward Status

| Epic 110 AI | Description | Status | Evidence |
|---|---|---|---|
| A-1 | Document opaque-ID `String(id)` rule in CLAUDE.md Known Anti-Patterns | ✅ Done | Story 111.1-FE: CLAUDE-ANTI-PATTERNS.md § 10 + CLAUDE.md list entry #10 |
| A-2 | Implement `scripts/check-lessons-length.sh` mechanical validator | ✅ Done | Story 111.1-FE: validator + 18-case self-test + npm run check:lessons + 16-story allowlist |
| A-3 | Visual UAT for AI evaluations + feedback when test cabinet has data | ⏳ Deferred to Epic 112+ | Still no `ready`-state test cabinet available |
| A-4 | Document TanStack Query invalidation scoping decision tree | ⏳ Deferred to Epic 112-FE | Originally an Epic 110 retro action; not addressed in Epic 111 |
| A-5 | Extract `<EvaluationsHeaderCard>` presenter from EvaluationsList (204 lines) | ⏳ Deferred to Epic 112-FE | Pre-refactor for next feature touching EvaluationsList |

**Carry-forward delta**: 2 of 5 Epic 110 retro items closed (A-1, A-2). 3 carry forward to Epic 112+ (A-3 visual UAT, A-4 invalidation scoping doc, A-5 EvaluationsHeaderCard extraction).

---

## Deferred Scope — Candidate Epic 112-FE: AI Admin Features

The original Epic 111-FE placeholder scope (anomaly resolution + model rollback admin UI + Owner role gating) is **deferred** to a future Epic 112-FE. Backend foundation is already in place from Story 108.1:

**Backend contracts available** (verified in `test-api/99-ai.http`):
- `GET /v1/ai/admin/models` (line 497) — cross-cabinet model management
- `PATCH /v1/ai/admin/models/{id}/rollback` (line 559) — model rollback with reason
- `PATCH /v1/ai/anomalies/{id}/resolve` (line 829) — mark anomaly as resolved
- `GET /v1/ai/preferences` + `PATCH /v1/ai/preferences` (lines 732/775) — AI feature toggle preferences

**Frontend foundation already shipped** (Story 108.1):
- `src/types/ai/admin.ts` — admin model management types
- `src/lib/api/ai/admin.ts` — `getAdminModels`, `patchModelRollback` fetchers
- `src/lib/api/ai/system.ts:71` — `patchAnomalyResolve` fetcher
- `src/types/ai/system.ts:49` — `AnomalyResolveRequest`
- `src/stores/authStore.ts:15` — `role === 'Owner'` capitalization convention

**Proposed Epic 112-FE stories** (TBD authoring; ~4 SP):

1. **Story 112.1-FE — Anomaly resolution admin UI** (~1 SP)
   - New page `/analytics/ai-admin/anomalies` (Owner-role-gated)
   - List anomalies (backend endpoint TBD — currently `PATCH /resolve/:id` exists but no GET list endpoint)
   - "Mark resolved" button per anomaly + confirmation dialog
   - Cache invalidation on resolve

2. **Story 112.2-FE — Model rollback admin UI** (~1.5 SP)
   - New page `/analytics/ai-admin/models` (Owner-role-gated)
   - Cross-cabinet model list (via `GET /v1/ai/admin/models`)
   - Rollback action per model with "Reason" required textarea + version-picker (rollback to v{N})
   - Confirmation dialog with destructive-action warning
   - Optimistic cache invalidation

3. **Story 112.3-FE — AI preferences admin UI** (~0.5 SP)
   - New page `/analytics/ai-admin/preferences` (Owner-role-gated)
   - Toggle AI features (forecast, evaluations, feedback, anomaly detection) via `PATCH /v1/ai/preferences`
   - Each toggle has descriptive sub-text

4. **Story 112.4-FE — Carry-over A-3/A-4/A-5 + Epic 112 retro** (~1 SP)
   - A-3: visual UAT once test cabinet has data
   - A-4: TanStack Query invalidation scoping decision tree in `docs/process/ai-module-architecture.md`
   - A-5: Extract `<EvaluationsHeaderCard>` from `EvaluationsList.tsx` (204 lines → ~150)
   - Epic 112-FE retrospective

5. **Story 112.5-FE — 16-story KNOWN_CARRYOVER_ALLOWLIST cleanup** (~0.5 SP)
   - For each of the 16 stories in `scripts/check-lessons-length.sh`'s allowlist, add a new dated disclosure row (APPEND-ONLY per CLAUDE.md convention) acknowledging the over-cap Lessons + reference Story 111.1-FE for context
   - Remove resolved entries from the allowlist
   - Goal: allowlist eventually empty; all stories pass the validator natively

**Total Epic 112-FE estimate**: ~4.5 SP

---

## Quality Gate Final State (Epic 111-FE close)

| Gate | Command | Result | Baseline |
|---|---|---|---|
| ESLint | `npx eslint 'src/**/*.ts' 'src/**/*.tsx'` | **0 errors / 112 warnings** | ✅ Matches (0E/112w) |
| TypeScript | `npm run type-check` | **0 errors** | ✅ Matches (0) |
| Vitest | `npm test -- --run` | **7810 passing / 0 failed / 676 skipped** | ✅ Above floor (7205) |
| Doc citations | `bash scripts/check-doc-citations.sh` | **22 broken — baseline match** | ✅ Matches |
| Lessons-length | `bash scripts/check-lessons-length.sh` | **exit 0 (16 allowlist WARNs, 24 lessons enforced, 0 violations)** | ✅ New gate (local-only) |
| Lessons-length self-test | `bash scripts/test-check-lessons-length.sh` | **18/18 PASS** | ✅ New gate (local-only) |

---

## Streak Summary

Epic 111-FE preserved the 2-pass adversarial review discipline streak through its single story:

- **55+ at Epic 110-FE close** (50+ at Epic 109 close + 5 stories in Epic 110)
- **+1 from Story 111.1-FE** → **56+ at Epic 111-FE close**

Story 111.1-FE's 3-pass review chain was particularly instructive:
- **1st pass** (9 findings): caught CRITICAL + 4 HIGH defects but ACTIVELY CREATED a CRITICAL spec-drift (retained date-gate with factually wrong "pre-discipline" rationale)
- **2nd pass** (6 findings): caught the 1st-pass-created CRITICAL spec-drift + the in-cell trim attestation modification
- **3rd pass** (2 findings): caught a 4-way self-contradiction the 2nd-pass author created while writing the F-2 fix

This 3-pass chain validates the meta-pattern: **the human/LLM authoring narrative is systematically less reliable than mechanical grep verification**. Each pass found defects the prior author's narrative confidently asserted as fact.

---

## Action Items for Epic 112-FE

### A-1: Author Epic 112-FE spec for admin features

**Context**: Epic 111-FE scope-cut the originally-planned admin features. Backend foundation is in place (Story 108.1).

**Action**: Author `_bmad-output/planning-artifacts/epics-112-fe.md` with Stories 112.1-112.5 outlined above. Each story should follow the Story 110.x foundation pattern: types/fetcher/hook/component layered build.

**Owner**: SM agent on Epic 112-FE kickoff
**Success criterion**: Epic 112-FE spec authored with 5 stories scoped, sprint-status updated with story stubs.

### A-2: Carry forward Epic 110 retro items A-3 / A-4 / A-5

**Context**: Epic 110 retro had 5 action items. Epic 111 closed 2 (A-1, A-2). The remaining 3 carry forward.

**Action**: When authoring Epic 112-FE, ensure Story 112.4-FE (or equivalent) explicitly addresses:
- A-3 visual UAT for AI evaluations/feedback (when test cabinet has data)
- A-4 TanStack Query invalidation scoping decision tree
- A-5 `<EvaluationsHeaderCard>` extraction from `EvaluationsList.tsx`

**Owner**: SM agent on Epic 112-FE kickoff
**Success criterion**: All three Epic 110 carry-forward items have explicit Story-112.x.x acceptance criteria.

### A-3: Extend authoritative-source-citation discipline to validators

**Context**: Story 111.1-FE 3rd-pass F-1 caught the 2nd-pass author asserting "Story 110.2 added to allowlist" without grep-verifying their own claim against the validator's actual `KNOWN_CARRYOVER_ALLOWLIST` array contents.

**Action**: Extend Story 97.2-FE authoritative-source-citation discipline with a new sub-rule: "When asserting state changes to a validator script's data, grep-verify the runtime state (the script's actual array contents / config / regex) after applying the change. Author memory is insufficient even within the same edit." Add to `frontend/CLAUDE.md` § Two-pass review discipline OR Multi-Source Orchestration Pattern 4 section.

**Owner**: SM agent during Epic 112-FE retro (or dedicated discipline-codification story)
**Success criterion**: `frontend/CLAUDE.md` contains the explicit grep-verify-validator-state sub-rule with Story 111.1-FE 3rd-pass F-1 as canonical reference.

### A-4: KNOWN_CARRYOVER_ALLOWLIST cleanup

**Context**: 16 stories in the allowlist were closed before the validator existed (between 2026-04-25 Story 94.4-FE codification and 2026-05-19 Story 111.1-FE validator deployment). Each story has overlong Lessons lines that violate the convention but cannot be edited in-place (APPEND-ONLY convention).

**Action**: For each of the 16 allowlist stories, add a new dated disclosure row to the story's Change Log explaining the violation context + referencing Story 111.1-FE. Then remove each story from the allowlist. Goal: allowlist eventually empty, all stories pass the validator natively.

**Owner**: Dev executor on Story 112.5-FE
**Success criterion**: `scripts/check-lessons-length.sh` `KNOWN_CARRYOVER_ALLOWLIST=()` is empty AND `bash scripts/check-lessons-length.sh` exits 0 with no WARN output.
