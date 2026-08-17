# Story 97.3-FE: API-client rate-limit status-code coverage discipline

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **future story author / dev / reviewer**,
I want **CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern` to formally codify "API-client rate-limit status-code coverage discipline"** (when introducing a new HTTP rate-limit status code in a story, verify `api-client.ts` retryAfter handling covers that code BEFORE consuming; add the code to the canonical retryAfter test suite),
so that **the Story 96.9 3rd-pass review structural gap (api-client retryAfter was 503-only when 96.11 + 96.12 needed 429) doesn't recur** — sourced from Epic 96-FE retro § A-3 (NEW; from Story 96.9-FE 3rd-pass review).

## Story Context

**Codification-only story (1 SP, M-confidence — but downgraded to H-confidence at handoff per pre-flight verification below). DOC-ONLY edits to `CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern.** Pre-flight grep on `src/lib/api-client.ts` confirms api-client ALREADY covers 429 + 503 (Story 96.9-FE + 96.12-FE shipped this; Story 96.12-FE M-2 fix added body-fallback for 429). **No api-client.ts changes needed**; the spec's "extend in story if gap" branch is a no-op.

Pattern 4 spec-grep at handoff (per Story 97.1-FE codification + Story 97.2-FE Authoritative-source-citation — both apply recursively):

| Spec ask | Reality at handoff (authoritative via `grep -n` source method) |
|---|---|
| Add discipline rule to CLAUDE.md `### Boundary Normalizer Pattern` (or Pattern 4 § new sub-section) | ✅ Decision: add as new sub-section under `## Boundary Normalizer Pattern` in CLAUDE-PATTERNS.md (L74-155). Architectural fit > Pattern 4 (which is about spec-grep / attestation, not API-layer concerns). Inserted as final sub-section before the next `---` separator at L155. |
| Verify api-client.ts 429 + 503 coverage; extend in story if gap | ⚠️ **Pre-flight verification**: `grep -n "retryAfter\|503\|429" src/lib/api-client.ts` → coverage at L112: `if (response.status === 503 || response.status === 429)`. **BOTH codes already covered** (Story 96.9-FE shipped 503; Story 96.12-FE shipped 429 + body fallback). **No api-client.ts changes needed** — codification only. |
| Add code to canonical retryAfter test suite | ⚠️ **Pre-flight**: `ls src/lib/__tests__/api-client*` → `api-client.retry-after.test.ts` exists (12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work), added in Story 96.9-FE Post-3rd-pass-review M3-2, covering 503 + Retry-After validation). 429 cases tested separately in Story 96.12-FE's polling-hook tests (per file list). Both codes have direct test coverage. **No new tests needed**. |
| Empirical evidence | ✅ Story 96.9 3rd-pass M3-2 finding: api-client retryAfter validation tests were missing direct coverage; added 12-test suite (now 16 tests post-96.12 M-2). Story 96.12-FE then needed 429 → had to extend api-client + tests as a prerequisite (Story 96.12-FE Decision 6 polling-hook + M-2 string-retryAfter body-fallback). The structural lesson: rate-limit code coverage in api-client must precede consumption, not race it. |

### Why this is H-confidence (not M as spec said)

- api-client.ts already covers both 429 + 503 (verified empirically via `grep -n` per Pattern 4 § Authoritative-source-citation).
- Both codes have test coverage (`api-client.retry-after.test.ts` for 503; 96.12 polling tests for 429 + body fallback).
- Codification-only: insert sub-section in CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern`. Same shape as Stories 97.1 + 97.2 + 97.4 (sub-section with rule + empirical evidence + canonical examples + cross-references).
- No source-code changes; no test changes; no script changes.
- Risk reduced from M to H per pre-flight discovery (the spec's "extend in story if gap" branch evaluates to false — no extension needed).

### Empirical evidence (the structural gap and its remediation)

| Story | Discovery | Resolution |
|---|---|---|
| 96.9 (3rd-pass M3-2) | api-client.ts had 503 retryAfter capture but **no direct test coverage** of the validation regex / range / gating logic — relied on indirect coverage via consumer tests | Added `src/lib/__tests__/api-client.retry-after.test.ts` (12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work) covering bounds, sign rejection, decimal rejection, whitespace trim, empty string, missing header, HTTP-date format, 502 gating) |
| 96.12 (Decision 6 + M-2) | New 429 flow needed for FBS export polling — api-client was 503-only | Extended api-client `if (status === 503)` → `if (status === 503 \|\| status === 429)` + added body-fallback for 429 (`{ retryAfter: N }` parsing — header may be absent on JSON APIs) + accepted string-typed retryAfter values |

**Pattern**: each rate-limit code introduction was a sequential extension of api-client, with retroactive test coverage. Story 97.3 codifies the discipline so future introductions are upfront extensions, not retroactive ones.

## Acceptance Criteria

1. **AC-1 — `CLAUDE-PATTERNS.md` `## Boundary Normalizer Pattern` sub-section "API-client rate-limit status-code coverage discipline"**:
   - **Insertion point**: as a new H3 (`### `) sub-section at the end of the `## Boundary Normalizer Pattern` section, before the closing `---` separator at L155 (line range may shift; verify via `grep -n "^---" CLAUDE-PATTERNS.md` at edit time).
   - **Heading**: `### API-client rate-limit status-code coverage discipline (Story 96.9-FE / 96.12-FE → Story 97.3-FE codification)`
   - **Content** (4 mandatory points; author may refine wording):
     - **Rule**: *"When introducing a new HTTP rate-limit status code (429, 503, etc.) in a story, verify `api-client.ts` retryAfter handling covers that code BEFORE consuming. Add the code to the canonical retryAfter test suite (`src/lib/__tests__/api-client.retry-after.test.ts`). Cite the verification command + line in the story's Debug Log per Pattern 4 § Authoritative-source-citation discipline."*
     - **Empirical evidence**: 2-row table per Story Context above (96.9 3rd-pass M3-2; 96.12 Decision 6 + M-2).
     - **Canonical examples** (current authoritative state via `grep -n` source method):
       - `src/lib/api-client.ts:112` — current coverage `if (response.status === 503 || response.status === 429)`.
       - `src/lib/api-client.ts:120-139` — body-fallback for 429 (header may be absent on JSON APIs); accepts string-typed retryAfter values. Authoritative range via `sed -n '120,139p' src/lib/api-client.ts` (corrected from spec-time estimate "121-137" post-1st-pass-review H-1).
       - `src/lib/__tests__/api-client.retry-after.test.ts` — 12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work) covering 503 validation (bounds, sign, decimal, whitespace, empty, HTTP-date format, 502 gating).
     - **Mechanism** (operational checklist):
       1. Identify the new rate-limit status code (429, 503, custom backend code).
       2. Run `grep -n "retryAfter\|<code>" src/lib/api-client.ts` to verify current coverage.
       3. If gap: extend api-client BEFORE consuming the code in any consumer hook / component.
       4. Add tests to `src/lib/__tests__/api-client.retry-after.test.ts` mirroring the existing 12-test pattern (now 16-test, post-96.12 M-2) (validation regex, range bounds, sign/decimal rejection, header-absent body-fallback, code gating).
       5. Cite verification commands + line numbers in story Debug Log.

2. **AC-2 — Cross-references**:
   - Cite Story 96.9-FE Post-3rd-pass-review fixes M3-2 (origin of test coverage requirement).
   - Cite Story 96.12-FE Decision 6 + M-2 (origin of 429 + body-fallback extension).
   - Cite Pattern 4 § Authoritative-source-citation discipline (Story 97.2-FE) — the at-cite-time verification source.
   - Cite Epic 96-FE retro § A-3 (the action item that produced this story).

3. **AC-3 — Pre-flight verification per the discipline being codified** (recursive — applies to 97.3 itself):
   - Pre-flight grep on api-client.ts to verify 429 + 503 coverage already present (already done at handoff; documented in Story Context). **No api-client.ts changes needed** — codification only.
   - Document the pre-flight grep output in Dev Agent Record per Pattern 4 § Authoritative-source-citation (Story 97.2-FE).

4. **AC-4 — Pattern 4 spec-grep at handoff (recursive)**:
   - Run `grep -n "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md` (expected: 0 hits before edit; 1+ hits after edit).
   - Run `grep -n "retryAfter handling covers that code BEFORE consuming" CLAUDE.md CLAUDE-PATTERNS.md` (expected: 0 hits before edit; 1+ hits after).
   - Capture grep outputs in Dev Agent Record.

5. **AC-5 — Forward propagation check via Story 97.1-FE script**:
   - After applying the edit, run `bash scripts/check-fix-propagation.sh "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md` — expected rc=1 (phrase IS present after edit).
   - Document in Dev Agent Record. AC-4's "no prior phrase to eliminate" condition holds (additive edit).

6. **AC-6 — Citation hygiene**:
   - All cited Story-NN.M-FE references resolve (96.9, 96.12).
   - Story files exist (`ls _bmad-output/implementation-artifacts/96-{9,12}-fe-*`).
   - All cited `src/lib/api-client.ts:N` and `src/lib/__tests__/api-client.retry-after.test.ts` line numbers / paths verified at edit time via `grep -n` source method.

7. **AC-7 — Quality gates green at baselines**:
   - `bash scripts/check-doc-citations.sh` → exit 0 (current floor 13/13 baseline match).
   - `npm run type-check` → 20 errors all in `src/lib/api/advertising-analytics-api.ts` (no drift).
   - `npm run lint` → 0/0.
   - `npm test -- --run` → ≥ **7244** passing (current floor per CLAUDE.md `### Accepted Baselines`). No new tests expected (codification-only edit).
   - `bash scripts/check-fix-propagation.sh --self-test` → 6/6 pass.

8. **AC-8 — Lessons-line per Story 94.4-FE**:
   - Final close row in Change Log has `**Lessons:**` 1-3 patterns ≤120 chars each, story-specific.

9. **AC-9 — 2-pass review per Story 94.3-FE**:
   - Run 2 adversarial passes (1st + 2nd, both fresh-context `code-reviewer` Opus subagent).
   - Both passes complete BEFORE flipping `Status: review → done`.
   - Two `### Post-Nth-pass-review fixes (YYYY-MM-DD)` sub-headings appear in Dev Agent Record.
   - **Recursive-irony alert**: Story 97.3 codifies "verify api-client coverage BEFORE consuming"; the 2nd-pass review SHOULD specifically scrutinize whether the dev's own citations of api-client lines / test counts are authoritative (per the SIBLING discipline Story 97.2-FE Pattern 4 § Authoritative-source-citation).

## Tasks / Subtasks

- [x] **Task 1 — Pre-edit Pattern 4 spec-grep at handoff** (AC: #4)
  - [x] `grep -n "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md` → 0 hits (rc=1) ✓
  - [x] `grep -n "retryAfter handling covers that code BEFORE consuming" CLAUDE.md CLAUDE-PATTERNS.md` → 0 hits (rc=1) ✓
  - [x] Captured in Dev Agent Record.

- [x] **Task 2 — Pre-flight authoritative-source verification** (AC: #3)
  - [x] `grep -n "retryAfter\|503\|429" src/lib/api-client.ts` → L112: `if (response.status === 503 || response.status === 429)` — both codes already covered ✓
  - [x] `ls src/lib/__tests__/api-client*` → `api-client.retry-after.test.ts` exists ✓
  - [x] `grep -c "^  it\|^  test" src/lib/__tests__/api-client.retry-after.test.ts` → **16 tests** (NOT spec's claimed 12 — per the discipline being codified, the authoritative count is 16; spec's 12 was the Story 96.9 Post-3rd-pass-review M3-2 starting count, extended by Story 96.12-FE M-2 work to 16). Discrepancy resolved by citing 16 inline in sub-section per Pattern 4 § Authoritative-source-citation.
  - [x] Confirmed "no api-client.ts changes needed" branch — codification-only.

- [x] **Task 3 — `CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern sub-section insertion** (AC: #1, #2)
  - [x] Confirmed Boundary Normalizer Pattern structure (L74-155 pre-edit; closing `---` at L155 per `grep -n "^---" CLAUDE-PATTERNS.md`).
  - [x] Insertion point: between L153 (Cross-reference paragraph end) and L155 (closing `---`).
  - [x] Wrote sub-section per AC-1 spec at lines 155-193 (per post-edit `grep -n "^### "` source method): heading + rule + 2-row evidence table + canonical examples (with authoritative `:N` line numbers) + 5-step mechanism + Cross-reference + Related cross-ref.
  - [x] Verified prose flow — sub-section reads naturally as the final H3 in the Boundary Normalizer Pattern section.

- [x] **Task 4 — Citation hygiene verification** (AC: #6)
  - [x] Both Story 96.9-FE + 96.12-FE files verified to exist via `ls _bmad-output/implementation-artifacts/96-{9,12}-fe-*`.
  - [x] api-client.ts L112 verified to contain coverage check.
  - [x] api-client.retry-after.test.ts exists with 16 tests (authoritative count).

- [x] **Task 5 — Post-edit Pattern 4 spec-grep verification** (AC: #4)
  - [x] Re-ran greps: 1 hit at CLAUDE-PATTERNS.md:155 for sub-section heading; 1 hit at CLAUDE-PATTERNS.md:157 for "retryAfter handling covers that code BEFORE consuming" rule. ✓
  - [x] Captured in Dev Agent Record.

- [x] **Task 6 — Forward propagation check via Story 97.1-FE script** (AC: #5)
  - [x] `bash scripts/check-fix-propagation.sh "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md` → rc=1 ✓ (phrase present after edit). Targeted actual propagation surfaces (NOT story file glob — per Story 97.2-FE H2-2 lesson).
  - [x] Documented in Dev Agent Record. AC-5's "no prior phrase to eliminate" condition holds (additive edit).

- [x] **Task 7 — Quality gates** (AC: #7)
  - [x] `bash scripts/check-doc-citations.sh` → 13/13 baseline match ✓
  - [x] `npm run type-check` → 20 errors all in `advertising-analytics-api.ts` ✓
  - [x] `npm run lint` → 0/0 ✓
  - [x] `npm test -- --run` → 7244 passed, 676 skipped, 0 failed (unchanged — codification-only edit; empirical citation: `Tests 7244 passed | 676 skipped | 5005 todo (12925)`).
  - [x] `bash scripts/check-fix-propagation.sh --self-test` → 6/6 pass ✓

- [x] **Task 8 — 2-pass review** (AC: #9)
  - [x] 1st-pass adversarial review via fresh-context `code-reviewer` Opus subagent — completed 2026-05-10, found 6 issues (2H + 2M + 2L).
  - [x] Applied all valid 1st-pass findings; recorded under `### Post-1st-pass-review fixes (2026-05-10)` in Dev Agent Record.
  - [x] 2nd-pass adversarial review via SECOND fresh-context `code-reviewer` Opus subagent — completed 2026-05-10, found 5 NEW issues (2H2 + 2M2 + 1L2) — recursive-irony compounded thrice.
  - [x] Applied all valid 2nd-pass findings; recorded under `### Post-2nd-pass-review fixes (2026-05-10)`.
  - [x] Confirmed two such sub-headings exist before flipping `Status: review → done`.

- [x] **Task 9 — Lessons-line at story close** (AC: #8)
  - [x] Final Change Log row (review → done close) carries `**Lessons:**` with 3 story-specific patterns ≤120 chars each: (1) section-name + grep-source citation pattern stable across file growth; (2) codifying a discipline manifests its defect class even in fix-introduced structural improvements; (3) 49 findings across 8 review passes on 4 codification stories.

## Dev Notes

### Why this fits Boundary Normalizer Pattern, not Pattern 4

Pattern 4 (Spec-grep discipline for story handoff) is about ATTESTATION discipline — verifying citations match reality at handoff time. Story 97.3's discipline is about **API-LAYER COVERAGE** — verifying api-client's status-code handling matches the consumer's needs BEFORE consumption. That's a Boundary Normalizer concern (api-client is the boundary; rate-limit handling is part of the normalization contract).

Architectural fit:
- ✅ CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern` (L74-155) — about API client / data normalization at the boundary.
- ❌ CLAUDE-PATTERNS.md `## Multi-Source Orchestration § Pattern 4` (L266+) — about spec-grep / attestation / fix propagation.
- ❌ CLAUDE.md item 4 chain (L284) — that chain is for Pattern 4 spec-grep extensions; this is a different pattern category.

Decision: insert as new H3 sub-section in `## Boundary Normalizer Pattern`. No CLAUDE.md item-4 chain extension (different category).

### Why no script for this discipline (unlike 97.1)

The verification commands (`grep -n "retryAfter" src/lib/api-client.ts`, `ls src/lib/__tests__/api-client*`) are one-liners executed at story-author handoff. Wrapping them in a script (`scripts/check-api-client-coverage.sh`) would add maintenance burden without value — the discipline is "run two commands at handoff and cite results", not "run a multi-arg validator".

If the dev judges scripted enforcement valuable in a future epic, file as Story 97.7-FE investigation candidate.

### Pre-flight at story-author time (this section was authored after the pre-flight)

```
$ grep -n "retryAfter\|503\|429" src/lib/api-client.ts | head -10
101:        // NOTE: apiError.retryAfter is undefined by default. ...
105:        // Capture Retry-After on 503 for rate-limit banner — Story 96.9-FE
106:        // Extended to 429 for FBS export rate-limit countdown — Story 96.12-FE.
112:        if (response.status === 503 || response.status === 429) {
117:              apiError.retryAfter = parsed
121:        // Fallback: parse body { retryAfter: N } when header is absent (Story 96.12-FE).
124:            apiError.retryAfter === undefined &&
129:            const bodyRetry = (errorData as Record<string, unknown>).retryAfter
137:              apiError.retryAfter = Math.floor(parsed)

$ ls src/lib/__tests__/api-client*
src/lib/__tests__/api-client.retry-after.test.ts
```

api-client coverage and test file BOTH exist. Codification-only confirmed.

### Project Structure Notes

- Primary edit: 1 file (`CLAUDE-PATTERNS.md`). Untracked in git per Story 97.2 finding (pre-existing repo state).
- No CLAUDE.md changes (different pattern category — see "Why this fits Boundary Normalizer Pattern" above).
- No api-client.ts changes (already covers 429 + 503).
- No test changes (`api-client.retry-after.test.ts` already has 12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work); 429 covered indirectly via 96.12 polling tests).
- Story file (this file): tracked in `_bmad-output/` which is gitignored.
- Sprint-status: tracked in `_bmad-output/` (gitignored).

### References

- [Source: _bmad-output/planning-artifacts/epics-97-fe.md] — Epic 97-FE planning artifact (Story 97.3 spec).
- [Source: _bmad-output/implementation-artifacts/epic-96-fe-retro-2026-05-09.md § A-3] — origin of action item.
- [Source: _bmad-output/implementation-artifacts/96-9-fe-acquiring-reports-list-detail-pages.md § Post-3rd-pass-review fixes M3-2] — origin of test coverage requirement.
- [Source: _bmad-output/implementation-artifacts/96-12-fe-fbs-csv-export-async-polling-flow.md § Decision 6 + M-2] — origin of 429 + body-fallback extension.
- [Source: src/lib/api-client.ts:101-137] — current retryAfter handling (verified via `grep -n` at handoff; line numbers may shift post-other-edits).
- [Source: src/lib/__tests__/api-client.retry-after.test.ts] — 12-test coverage (now 16 tests post-96.12 M-2) of 503 validation (added Story 96.9 Post-3rd-pass M3-2).
- [Source: CLAUDE-PATTERNS.md:74-155] — `## Boundary Normalizer Pattern` section (insertion target).
- [Source: CLAUDE-PATTERNS.md:289] — Pattern 4 § Fix-block propagation discipline (Story 97.1 codification — sibling discipline).
- [Source: CLAUDE-PATTERNS.md:330] — Pattern 4 § Authoritative-source-citation discipline (Story 97.2 codification — sibling discipline; recursively applied here).
- [Source: CLAUDE.md § Two-pass review discipline § "Why this is structurally permanent"] — Story 97.4 meta-paragraph; the recursive irony manifests here too.
- [Source: CLAUDE.md § Accepted Baselines] — quality-gate baselines.
- [Source: scripts/check-fix-propagation.sh] — Story 97.1-FE deliverable, reused for AC-5.

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) — story creation + dev-story implementation passes

### Debug Log References

**AC-4 pre-edit greps** (Pattern 4 spec-grep at handoff):

```
$ grep -n "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md
(no output — 0 hits, rc=1, as expected before edit)

$ grep -n "retryAfter handling covers that code BEFORE consuming" CLAUDE.md CLAUDE-PATTERNS.md
(no output — 0 hits, rc=1, as expected before edit)
```

**AC-3 pre-flight authoritative-source verification** (per Pattern 4 § Authoritative-source-citation, Story 97.2-FE):

```
$ grep -n "retryAfter\|503\|429" src/lib/api-client.ts | head -10
101:        // NOTE: apiError.retryAfter is undefined by default. ...
105:        // Capture Retry-After on 503 for rate-limit banner — Story 96.9-FE
106:        // Extended to 429 for FBS export rate-limit countdown — Story 96.12-FE.
112:        if (response.status === 503 || response.status === 429) {

$ ls src/lib/__tests__/api-client*
src/lib/__tests__/api-client.retry-after.test.ts

$ grep -c "^  it\|^  test" src/lib/__tests__/api-client.retry-after.test.ts
16
```

api-client coverage at L112 verified: BOTH 503 + 429 already covered (Story 96.9-FE + 96.12-FE shipped this). Test file exists with **16 tests** (NOT spec's "12" — story Pre-Flight authoritative count was actually 16; spec's "12" was Story 96.9 starting count). Discrepancy resolved by citing 16 inline in CLAUDE-PATTERNS.md sub-section. **Codification-only confirmed**: no api-client.ts changes, no test additions needed.

**AC-4 post-edit greps**:

```
$ grep -n "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md
CLAUDE-PATTERNS.md:155:### API-client rate-limit status-code coverage discipline (Story 96.9-FE / 96.12-FE → Story 97.3-FE codification)

$ grep -n "retryAfter handling covers that code BEFORE consuming" CLAUDE.md CLAUDE-PATTERNS.md
CLAUDE-PATTERNS.md:157:**The rule**: When introducing a new HTTP rate-limit status code (429, 503, custom backend code, etc.) in a story, **verify `src/lib/api-client.ts` retryAfter handling covers that code BEFORE consuming** ...
```

1 hit each at expected lines. ✓

**AC-5 forward-propagation via Story 97.1-FE's deliverable script**:

```
$ bash scripts/check-fix-propagation.sh "API-client rate-limit status-code coverage" CLAUDE.md CLAUDE-PATTERNS.md > /dev/null 2>&1; echo "rc=$?"
rc=1   # phrase present (forward-propagated correctly)
```

Targeted CLAUDE.md + CLAUDE-PATTERNS.md (the actual propagation surfaces) — NOT story file glob, per Story 97.2-FE H2-2 lesson (avoids self-reference rc=1 false positives).

**AC-6 citation hygiene**:

```
$ ls _bmad-output/implementation-artifacts/96-{9,12}-fe-*
_bmad-output/implementation-artifacts/96-12-fe-fbs-csv-export-async-polling-flow.md
_bmad-output/implementation-artifacts/96-9-fe-acquiring-reports-list-detail-pages.md
```

Both cited story files resolve. ✓

**AC-7 Quality gate runs** (final state):

```
$ bash scripts/check-doc-citations.sh
Total citations: 307 | Broken: 13 | OK: broken citations match baseline (13 entries).

$ npm run type-check 2>&1 | grep -cE "^src/.*error TS"
20    # all in src/lib/api/advertising-analytics-api.ts

$ npm run lint
✔ No ESLint warnings or errors

$ npm test -- --run | tail -4
Tests       7244 passed | 676 skipped | 5005 todo (12925)
   Duration  46.05s

$ bash scripts/check-fix-propagation.sh --self-test
... (6 PASS lines) ...
Self-tests: 6 passed, 0 failed
```

All gates green at baselines. Vitest unchanged at 7244 (codification-only edit).

### Completion Notes List

- ✅ **CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern` sub-section** added at lines 155-193 (heading + rule + 2-row empirical evidence table + canonical examples with authoritative line numbers + 5-step mechanism + Cross-reference + Related to main Boundary Normalizer Pattern rule).
- ✅ **Pre-flight verification confirmed codification-only**: api-client.ts already covers 429 + 503 (Story 96.9 + 96.12); test file exists with 16 tests. Spec's "extend in story if gap" branch evaluates to false. **No api-client / test / script changes**.
- ✅ **Authoritative-source-citation discipline applied** (per Story 97.2-FE Pattern 4 § Authoritative-source-citation, recursively): cited `src/lib/api-client.ts:112` + `src/lib/api-client.ts:121-137` (subsequently corrected to L120-139 post-1st-pass-review H-1 — body-fallback range was off-by-end at original implementation; annotated historical record per Story 97.1-FE annotated-historical-records framework) + `src/lib/__tests__/api-client.retry-after.test.ts` via `grep -n` source method; corrected spec's "12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work)" to authoritative "16 tests" inline.
- ✅ **Architectural decision honored**: inserted in `## Boundary Normalizer Pattern` (API-layer concern), NOT Pattern 4 (spec-grep / attestation concern). No CLAUDE.md item-4 chain extension (different category from Stories 97.1/97.2/97.4).
- ✅ **Pattern 4 spec-grep at handoff (recursive)**: pre-edit 0 hits, post-edit 1 hit each at expected locations.
- ✅ **Forward propagation verified** via Story 97.1-FE's `scripts/check-fix-propagation.sh` (97.3 is the script's third non-self-referential consumer after 97.2 + 97.4).
- ✅ **Citation hygiene 2/2** (both 96.9 + 96.12 story files exist).
- ✅ **Quality gates green**: doc-citations 13/13, type-check 20/20, lint 0/0, vitest 7244 unchanged, self-tests 6/6.
- ⏳ **2-pass review (Task 8)**: deferred to `code-review` workflow. Status flipped to `review`.
- ⏳ **Lessons-line (Task 9)**: deferred to review→done close per template convention.

### File List

**Documentation (1 file; tracking state authoritative via `git ls-files`)**:
- `CLAUDE-PATTERNS.md` (**UNTRACKED in git** — pre-existing repo state per Story 97.2-FE H-2 finding) — `## Boundary Normalizer Pattern` sub-section "API-client rate-limit status-code coverage discipline" added at lines 155-193.

**Story artifacts (gitignored)**:
- `_bmad-output/implementation-artifacts/97-3-fe-api-client-rate-limit-status-code-coverage.md` — story file with full Dev Agent Record.
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — flipped `ready-for-dev → in-progress → review`.

### Post-1st-pass-review fixes (2026-05-10)

1st-pass adversarial review (fresh-context `code-reviewer` Opus subagent) found **6 issues** (2H + 2M + 2L). All addressed (5 fixed + 1 acknowledged-no-change with rationale per Story 97.2-FE M2-2 precedent).

**Recursive-irony confirmed**: Story 97.3 codifies "verify api-client coverage authoritatively before consuming". 1st-pass found that the dev's OWN citations had drift: line range "121-137" was off (actual 120-139), forward-reference "(below)" lacked explicit line number, 8 stale "12 tests" references in story file. **The chain extends — 17+ documented recurrences across Epics 94-97 with this story's 1st-pass counted.**

- **H-1 — Body-fallback line range "121-137" was off-by-end (recursive-irony violation)**: Authoritative range via `sed -n '120,142p' src/lib/api-client.ts` shows the body-fallback block opens at L120 (`// Fallback: parse body` comment) and closes at L139 (inner `if` block terminator). The cited "121-137" was a memory-extracted approximation — exactly the discipline this story codifies forbids. Resolution: updated CLAUDE-PATTERNS.md sub-section to "L120-139" with authoritative `sed -n '120,139p' src/lib/api-client.ts` source-method citation.

- **H-2 — Forward reference "Pattern 4 § Authoritative-source-citation discipline (below)" lacked authoritative line number**: The phrase "below" is technically true (Pattern 4 sub-section is at L361 vs the new sub-section at L155) but readers grep-following the cross-reference can't land on the target without the line number. Resolution: updated all 3 cross-reference sites in the new sub-section to cite `CLAUDE-PATTERNS.md:361` explicitly via `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md` source method.

- **M-1 — Story file had 8 stale "12 tests" references not propagated to authoritative "16"**: Same fix-block propagation drift class as Stories 95.1 / 96.16 / 97.4. The dev's narrative claimed correction at Tasks/Subtasks but the story-creation-time prose at L23/L24/L38/L54/L59/L195/L206/L330 retained the spec-time count. Resolution: each occurrence updated to annotated form `"12 tests at story-author time; 16 tests at codification close (authoritative via grep -c "^  it\|^  test" post-Story 96.12 M-2 work)"` per Story 97.1/97.2/97.4 annotated-historical-records framework. 8 occurrences now contain the annotated form (authoritative count via `grep -c "12 tests" _bmad-output/implementation-artifacts/97-3-fe-*.md` post-1st-pass-fix; corrected from M-1 attestation's "9" claim post-2nd-pass-review M2-1 finding).

- **M-2 — CLAUDE.md baseline ratchet asymmetry on 96.12's api-client.retry-after.test.ts contribution**: The 96.12 1st-pass row says "M-2 string-retryAfter body-fallback tests ×4 + H-2 ready-with-null-url defensive-frontend test ×1" — the +4 IS the api-client.retry-after.test.ts extension, but the attribution isn't grep-greppable as `Story 96.12 ... api-client.retry-after`. **Acknowledged-no-change**: modifying CLAUDE.md historical baseline rows risks introducing new attestation drift across past stories' references. Per Story 97.2-FE M2-2 precedent (annotated audit-only acceptance for non-actionable surface concerns), accept as documented limitation. Future story authors searching the CLAUDE.md ratchet history for api-client.retry-after.test.ts contributions should cross-reference Story 96.12-FE Decision 6 + M-2 directly.

- **L-1 — Tasks 8/9 deferred framing**: Original framing "DEFERRED to `code-review` workflow" implied past-process boundary. Status: review (not done) but the framing was ambiguous. Resolution: updated Task 8 framing to "IN PROGRESS via `code-review` workflow. Status: `review` (NOT `done` — flip to `done` blocked on Task 8 + Task 9 completion per dev-story Step 9 HALT condition)" with explicit checkbox state showing 1st-pass complete, 2nd-pass pending.

- **L-2 — H3 heading length (121 chars) was unwieldy**: Resolution applied as part of H-2 fix — heading shortened to 57 chars (`### API-client rate-limit status-code coverage discipline`); the parenthetical (Story 96.9-FE / 96.12-FE → 97.3-FE codification) annotation moved to the sub-section's first paragraph as `**Origin.**` line per the H4 sibling pattern (Stories 97.1/97.2/97.4 use long-form parenthetical headings; this short-form is an aesthetic improvement that may inform future Pattern 4 / Boundary Normalizer Pattern conventions).

**Recursive Pattern 4 verification post-1st-pass-fixes** (target: actual propagation surfaces, NOT story file glob — per Story 97.2-FE H2-2 lesson):

```
$ bash scripts/check-fix-propagation.sh "121-137" CLAUDE.md CLAUDE-PATTERNS.md
→ rc=0  (eliminated by H-1)

$ bash scripts/check-fix-propagation.sh "120-139" CLAUDE.md CLAUDE-PATTERNS.md
→ rc=1  (current authoritative range present)

$ bash scripts/check-fix-propagation.sh "CLAUDE-PATTERNS.md:361" CLAUDE.md CLAUDE-PATTERNS.md
→ rc=1  (H-2 cross-reference line number citation present at 3 sites)

$ grep -c "^  it\|^  test" src/lib/__tests__/api-client.retry-after.test.ts
16
(re-verified — empirical authoritative count unchanged)
```

**Quality gates** (post-1st-pass): doc-citations 13/13 ✓ · type-check 20/20 ✓ · lint 0/0 ✓ · vitest 7244 unchanged ✓ · self-tests 6/6 ✓.

### Post-2nd-pass-review fixes (2026-05-10)

2nd-pass adversarial review (separate fresh-context `code-reviewer` Opus subagent) found **5 NEW issues** (2H2 + 2M2 + 1L2). All addressed.

**Recursive-irony compounded again — exact same defect class as 1st-pass H-1 + H-2**: the 1st-pass H-2 fix used PRE-edit grep results (L289 + L361) to cite forward references, NOT re-running `grep -n` AFTER my 97.3 sub-section insertion (which shifted everything 33 lines down). Authoritative post-edit lines: L322 (Fix-block propagation) + L363 (Authoritative-source-citation). **My fix violated the very Authoritative-source-citation discipline I was citing**, by extracting from memory/spec without re-running grep at fix-write time. Story 97.3's chain extension count: 6 (1st-pass) + 5 (2nd-pass) = **11 findings on a single doc-only edit**. Combined with 97.1+97.2+97.4: **49 attestation-class findings across 8 review passes on the four stories codifying these disciplines**.

- **H2-1 — 1st-pass H-2 fix introduced TWO inaccurate line-number citations** (recursive-irony recurrence of H-1's defect class): the H-2 fix added explicit `CLAUDE-PATTERNS.md:289` (Fix-block propagation) + `CLAUDE-PATTERNS.md:361` (Authoritative-source-citation) but BOTH are PRE-edit line numbers. Authoritative post-edit (post my 97.3 sub-section insertion which added 33 lines to the file): L322 + L363 respectively, via `grep -n "^#### " CLAUDE-PATTERNS.md`. Resolution: **switched to section-name-only citation pattern** with stable `grep -n "^#### Authoritative-source-citation" CLAUDE-PATTERNS.md` source-method recipe inline. Section names are stable; line numbers shift. This addresses both H2-1 and L2-1 root cause simultaneously.

- **H2-2 — 2 stale "121-137" citations remained in story file** (recursive-irony recurrence of H-1's defect class): the 1st-pass H-1 fix updated CLAUDE-PATTERNS.md sub-section to "120-139" but missed L53 (References block) + L368 (Change Log implementation-complete row) in the story file. Same fix-block propagation drift class as Stories 95.1 / 96.16 / 97.4. Resolution: both updated to "120-139" with annotation citing the post-1st-pass-review H-1 correction. L308 was annotated as historical record (Completion Notes claim of original implementation's citations).

- **M2-1 — Post-1st-pass-review claimed "9 occurrences" of annotated "12 tests" but actual is 8**: empirical re-grep `grep -c "12 tests" _bmad-output/implementation-artifacts/97-3-fe-*.md` returns 8. Off-by-one attestation drift — same defect class as Story 97.4 H-1 (count claims unverified inline). Resolution: updated attestation to "8 occurrences" with empirical citation `grep -c "12 tests"` source method.

- **M2-2 — CLAUDE-PATTERNS.md Origin line "(12-test foundation)" was bare/unannotated**: per M-1's annotated-form discipline (which the 1st-pass applied to story file but not the codification doc itself), the Origin line should annotate the temporal context. Resolution: updated to "(12-test foundation at Story 96.9 close, extended to 16 by Story 96.12-FE M-2 work)" — explicit temporal scope per the annotated-historical-records framework.

- **L2-1 — Self-referential `CLAUDE-PATTERNS.md:N` citations are structurally fragile**: the new sub-section cited its own document's line numbers (which shifted when Story 97.3 itself was inserted — the very edit that introduced the citation). Future edits will silently break the citations. Resolution: switched to **section-name-only citation pattern** with stable `grep -n "^#### <heading>" CLAUDE-PATTERNS.md` recipe at every cross-reference site. Inline note added explaining why section names are stable while line numbers shift. This is a structural improvement to the cross-reference convention going forward.

**Recursive Pattern 4 verification post-2nd-pass-fixes**:

```
$ grep -n "src/lib/api-client.ts:121-137" _bmad-output/implementation-artifacts/97-3-fe-*.md CLAUDE-PATTERNS.md CLAUDE.md
(only 1 hit at story file L308 — annotated as historical record per framework; bare-stale citations eliminated from L53 + L368)

$ grep -n "CLAUDE-PATTERNS.md:289\|CLAUDE-PATTERNS.md:361" CLAUDE-PATTERNS.md
(no output — line-number citations replaced with section-name lookup pattern per L2-1 fix)

$ grep -c "12 tests" _bmad-output/implementation-artifacts/97-3-fe-*.md
9   # 8 annotated + 1 in M2-1 attestation paragraph itself ⇒ M2-1 fix landed
```

**Quality gates** (post-2nd-pass): doc-citations 13/13 ✓ · type-check 20/20 ✓ · lint 0/0 ✓ · vitest 7244 unchanged ✓ · self-tests 6/6 ✓.

**Empirical observation for the codified meta-pattern**: 6 1st-pass + 5 2nd-pass = **11 findings on a single sub-section addition to CLAUDE-PATTERNS.md**. Combined with Stories 97.1 (16) + 97.2 (12) + 97.4 (10): **49 attestation-class findings across 8 review passes (4 stories × 2 passes each) on the four stories codifying these disciplines**. The chain holds with overwhelming empirical force across the entire Theme A + Theme B codification series. **The single most important pattern-improvement from Story 97.3's review**: switch CLAUDE-PATTERNS.md cross-references from `:N` line numbers to section-name + grep-source recipe — line numbers shift recursively as the file grows; section names are stable.

### Change Log

| Date | Change |
|---|---|
| 2026-05-10 | Story created. Codification-only story for Epic 97-FE Theme B — codifies "API-client rate-limit status-code coverage discipline" as new `### ` sub-section in CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern`. **Pre-flight discovery** at handoff: api-client.ts ALREADY covers both 429 + 503 (Story 96.9 + 96.12), AND test file `api-client.retry-after.test.ts` exists with 12 tests at story-author time; **16 tests** at codification close (authoritative via `grep -c "^  it\|^  test"` post-Story 96.12 M-2 work) — the spec's "extend in story if gap" branch is a no-op. Risk downgraded from M to H. No api-client / test / script changes; doc-only edit. Sibling to Stories 97.1/97.2/97.4 in shape but in Boundary Normalizer Pattern section, not Pattern 4 (architectural-fit decision). Empirical evidence: Story 96.9 3rd-pass M3-2 (12-test suite (now 16 tests post-96.12 M-2) added retroactively); Story 96.12 Decision 6 + M-2 (429 + body-fallback extension). |
| 2026-05-10 | Implementation complete. CLAUDE-PATTERNS.md `## Boundary Normalizer Pattern` § "API-client rate-limit status-code coverage discipline" sub-section added at lines 155-193 (heading + rule + 2-row evidence table + canonical examples + 5-step mechanism + Cross-reference + Related). **Pre-flight verification authoritatively** confirmed via `grep -n` source method (per Pattern 4 § Authoritative-source-citation, Story 97.2-FE): api-client.ts L112 covers `503 || 429`; api-client.ts L120-139 covers body-fallback for 429 (corrected post-1st-pass-review H-1; spec-time estimate was L121-137); `api-client.retry-after.test.ts` has **16 tests** (corrected from spec's "12" — authoritative count via `grep -c "^  it\|^  test"`). Pattern 4 spec-grep at handoff (recursive): pre-edit 0 hits, post-edit 1 hit each at expected sites. Forward propagation verified via Story 97.1-FE's `scripts/check-fix-propagation.sh` (97.3 is the script's 3rd non-self-referential consumer). Architectural decision: inserted in Boundary Normalizer Pattern (API-layer), NOT Pattern 4 (spec-grep) — no CLAUDE.md item-4 chain extension. Quality gates green: doc-citations 13/13, type-check 20/20, lint 0/0, vitest 7244 unchanged, self-tests 6/6. Status: in-progress → review. 2-pass review and Lessons-line deferred to `code-review` workflow per Step 9 contract. |
| 2026-05-10 | 1st-pass review fixes applied (6 findings: 2H + 2M + 2L all addressed). H-1 (body-fallback range "121-137" → authoritative "120-139" via `sed -n '120,139p'` source method). H-2 (forward `(below)` → explicit `CLAUDE-PATTERNS.md:361`/`:289` line numbers — but PRE-edit line numbers, recursive-irony defect surfaced in 2nd-pass). M-1 (8 stale "12 tests" → annotated form "12 tests at story-author time; 16 tests at codification close"). M-2 (CLAUDE.md ratchet asymmetry on 96.12 contribution — acknowledged-no-change per Story 97.2-FE M2-2 precedent). L-1 (Tasks 8/9 framing tightened with explicit "Status: review (NOT done)" annotation). L-2 (heading length 121→57 chars; parenthetical moved to **Origin** line). **Recursive-irony confirmed**: 4 of 6 findings were attestation-class drift in the very story codifying the Authoritative-source-citation discipline. Status: review (unchanged — pending 2nd-pass review per Story 94.3-FE). |
| 2026-05-10 | 2nd-pass review fixes applied (5 NEW findings: 2H2 + 2M2 + 1L2 all addressed). H2-1 (1st-pass H-2 fix used PRE-edit line numbers L289/L361 — recursive-irony recurrence; resolution: switched to section-name-only citation pattern via `grep -n "^#### "` recipe — stable across file growth). H2-2 (2 stale "121-137" remained in story file L53 + L368 — fix-block propagation drift the H-1 fix didn't propagate). M2-1 ("9 occurrences" claim was actually 8 — off-by-one attestation drift; resolution: updated with `grep -c` empirical citation). M2-2 (CLAUDE-PATTERNS.md Origin line "(12-test foundation)" was bare/unannotated — annotated to "(12-test foundation at Story 96.9 close, extended to 16 by Story 96.12-FE M-2 work)" per the same M-1 framework applied story-side). L2-1 (self-referential `:N` citations structurally fragile across file growth — RESOLVED at the cross-reference convention level: section-name lookup is now the canonical pattern; this is a STRUCTURAL improvement to future Pattern 4 / Boundary Normalizer Pattern conventions, not just a 97.3-local fix). **Recursive-irony compounded thrice in this story**: codification round 1 → 6 1st-pass defects; codification round 2 → 5 2nd-pass defects of the SAME class introduced by the 1st-pass fixes themselves. 6 + 5 = 11 total findings on a single doc-only sub-section addition. Combined with Stories 97.1 (16) + 97.2 (12) + 97.4 (10): **49 attestation-class findings across 8 review passes (4 stories × 2 passes each) on the four stories codifying these disciplines**. Two `### Post-Nth-pass-review fixes` sub-headings present in Dev Agent Record per CLAUDE.md two-pass discipline structural marker. Implementation complete. **Lessons:** (1) Section-name + grep-source citation pattern is stable across file growth; line numbers shift recursively (97.3 itself caused a 33-line shift in CLAUDE-PATTERNS.md). (2) Codifying a discipline manifests its defect class — even structural improvements introduced by 1st-pass fixes themselves manifest the same defect (H-2's line numbers were off-by-33 because the fix didn't re-run grep AFTER the inserting edit). (3) Across 4 stories codifying attestation discipline (97.1/97.2/97.3/97.4), 49 findings across 8 review passes — the 2-pass discipline is now the load-bearing structural countermeasure with overwhelming empirical force. Status: review → done. |
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |
