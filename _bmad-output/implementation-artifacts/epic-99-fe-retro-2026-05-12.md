# Epic 99-FE Retrospective: ESLint Cap Tightening Phase 2 & HALT Scripts

**Date**: 2026-05-12
**Epic**: 99-FE (from Epic 98-FE retro AIs A-1 + A-2)
**Priority**: P3 (process/tooling, zero user-facing features)
**Stories**: 2/2 done
**Source**: Epic 98-FE retro action items A-1 (cap tightening 400→200) and A-2 (HALT scripts from Story 97.7 investigation)

---

## Epic Summary

**Objective**: Complete the ESLint `max-lines` cap tightening roadmap (400→200) and implement the 2 HALT-based enforcement scripts recommended by Story 97.7's investigation.

**Story 99.1-FE** (cap tightening 400→200):
- Tightened ESLint `max-lines` from 400 to 200 for non-test source files
- Extracted 6 files over 200 effective lines: 3 type files split into subdirectories with barrel re-exports, 3 component files split into sibling modules
- All non-test source files now under 200-line cap (test files remain at 800)

**Story 99.2-FE** (HALT scripts):
- Created `scripts/check-eslint-rules.sh` — validates rule names in both `.eslintrc.json` and `eslint.config.js` against ESLint's known registry. 6 self-tests. Catches silent disablement from typos (the Class 5 defect from Story 97.7).
- Integrated fix-propagation structural prompt into dev-story workflow Step 8
- Added `check:eslint-rules` npm script alongside existing `check:docs`

**Critical finding during review**: Story 99.2's flat-config extraction regex initially used `[a-z]` which couldn't capture `@typescript-eslint/` prefixed rules. Both 1st and 2nd review passes independently flagged this as H-1. Fixed to `[@a-z]` with exclusion-based filtering.

**Carry-forward resolution**: A-2 from Epic 97 (HALT scripts) was carried through Epic 98 unaddressed. This 2-epic carry-forward violated the A-4 rule from Epic 97 retro. Epic 99 finally resolved it — the carry-forward chain itself validated Story 97.7's core thesis: prose-only guidance for "implement scripting" has a 100% skip rate.

**Delivery**: 2/2 stories closed. 0 regressions. 34+ consecutive stories with 2-pass review discipline intact.

---

## Metrics

| Metric | Value |
|---|---|
| Stories completed | 2/2 (100%) |
| Production regressions | 0 |
| Review findings 99.1 (3 passes) | Pass 1: 1H+2M+1L, Pass 2: 0H+2M+2L, Pass 3: 2M |
| Review findings 99.2 (2 passes) | Pass 1: 2H+3M, Pass 2: 1H(confirmed)+2M+1L |
| Total review findings | 16 across both stories |
| Epic 98 AIs closed | 3/3 (A-1 + A-2 + A-3) |
| Quality gates | All green: ESLint 0e/114w, TS 20, tests 7244, citations 13 |
| 2-pass review streak | 34+ consecutive stories |

---

## What Went Well

### S-1: Epic 98 follow-through — 100% for the first time
All 3 action items from Epic 98 retro closed: A-1 (cap 400→200 via Story 99.1), A-2 (HALT scripts via Story 99.2), A-3 (commit changes, done this session). Previous follow-through rates: Epic 97→98: 75% (3/4). Epic 99→closure: 100% (3/3).

### S-2: 2-pass review independently caught critical regex bug
Story 99.2's `extract_flat_config_rules()` regex `[a-z]` couldn't capture `@typescript-eslint/` prefixed rules. Both 1st pass AND 2nd pass independently flagged this as H-1, from different analytical angles. The 2-pass discipline is the only reason this shipped correctly.

### S-3: File extraction clean — zero downstream breakage
6 files extracted across Story 99.1 using barrel re-export pattern from Epic 74. All import paths preserved. Type-check green after every extraction. The subdirectory + index.ts pattern continues to be reliable.

### S-4: Investigation-to-implementation pipeline validated
Story 97.7 (investigation) → identified 7 defect classes → recommended 2 Tier A scripts → 2 epics later (Story 99.2) those exact scripts shipped. The investigation was actionable, not shelfware.

### S-5: 34+ consecutive story 2-pass review streak
From Epic 94 through Epic 99, the 2-pass discipline has held without a single breakdown. Story 99.1 even went through 3 passes (2 agent + BMad workflow).

---

## What Didn't Go Well

### C-1: CLAUDE.md Accepted Baselines table corrupted during edit
Story 99.2's 1st-pass review fix attempted to add an ESLint rules row to the Accepted Baselines table. The Edit tool's `old_string` matched and replaced TWO rows (Doc citations + TypeScript) with a partial string. Both rows deleted entirely. Caught and fixed in 2nd-pass review (M-1). This is the third CLAUDE.md table edit incident across Epics 97-99.

### C-2: Story 99.2 Lesson exceeded 120-char limit
Lesson (2) in Story 99.2's Change Log was 130+ characters — violating the very rule established in Story 94.4. Truncated in 2nd-pass review, but the irony of breaking the lesson-formatting rule in a story about enforcement tooling is notable.

### C-3: Uncommitted changes at story close (systemic pattern)
Both Stories 99.1 and 99.2 were marked `done` before committing. Same pattern as Epic 98 C-4. The workflow's close condition requires committed changes, but the commit step keeps getting deferred. This is now a 2-epic recurrence.

### C-4: ESLint `Linter.getRules()` vs `--print-config` confusion
The initial implementation used `eslint.Linter.getRules()` which returns only 291 core ESLint rules — zero plugin rules. All `@typescript-eslint/*` rules were invisible. Switched to `eslint --print-config` which includes all loaded plugins. The self-tests initially passed because they only tested against core rules.

### C-5: A-2 carry-forward stretched to 2 epics before resolution
Epic 97 A-2 → Epic 98 C-3 (skipped) → Epic 99 A-2 (finally addressed). While resolved, the 2-epic delay means the project operated without ESLint rule-name safety net for that period. The delay itself validated Story 97.7's finding about prose-only enforcement.

---

## Lessons Learned

1. **`eslint --print-config` includes plugin rules; `Linter.getRules()` does not** — any tooling that validates ESLint rules must use `--print-config` as the ground truth, not the Linter API. Core-only validation gives false confidence. (Story 99.2-FE)
2. **Prose-only guidance for scripting tasks has empirically 100% skip rate** — the A-2 carry-forward chain (Epic 97→98→99) is the third data point. Structural prompts and scripted enforcement are the proven countermeasure. (Story 97.7-FE investigation, validated by carry-forward)
3. **Markdown table edits are fragile in the Edit tool** — 3 incidents across Epics 97-99. Pipe-delimited table rows with long content are hard to match uniquely. Use full-row replacement or a post-edit validation step. (Story 99.2-FE 2nd-pass M-1)
4. **Self-tests that re-invoke `bash $0` with env overrides are fragile** — test the logic directly instead. Environment variable overrides for file paths in self-tests create brittle coupling. (Story 99.2-FE)
5. **Dead files become confusing debt when their replacements ship** — delete immediately, not "later." TopConsumersWidgetParts.tsx lingered as a confusing duplicate. (Story 99.1-FE 1st-pass M finding)

---

## Epic 98 Retro Follow-Through

| AI | Description | Status | Evidence |
|---|---|---|---|
| A-1 | ESLint cap tightening 400→200 | ✅ **Closed** | Story 99.1 — cap tightened, 6 files extracted |
| A-2 | 2 HALT scripts from Story 97.7 | ✅ **Closed** | Story 99.2 — ESLint rule validator + workflow integration |
| A-3 | Commit Story 98.1 changes | ✅ **Closed** | Both 99.1 and 99.2 committed (`80bfe46`, `d0a3ee6`) |

**Follow-through rate**: 3/3 closed (100%). First perfect follow-through in recent project history.

---

## Action Items for Future Epics

| # | Action Item | Source | Owner | Success Criteria |
|---|---|---|---|---|
| A-1 | Integrate `check-eslint-rules` into CI pipeline alongside `check:docs` | Story 99.2 | Dev | Script runs in CI, blocks on unknown rules |
| A-2 | Monitor fix-propagation workflow prompt effectiveness — track invocation rate over next 3 stories | Story 99.2 | Dev | Invocation rate >0% (structural prompt not yet tested in practice) |
| A-3 | Resolve 114 `no-explicit-any` ESLint warnings — long-term debt paydown | Story 98.1 baseline | Dev | Warning count reduced by ≥50% |
| A-4 | Fix the 20 TypeScript errors in `advertising-analytics-api.ts` — SDK type drift | Pre-existing | Dev | TS errors reduced to 0 or documented deferral |

---

## Technical Debt

| Item | Severity | Source | Notes |
|---|---|---|---|
| 114 `no-explicit-any` warnings | Info | Story 98.1 | Pre-existing; surfaced by working enforcement. Not blocking. |
| 20 TS errors in `advertising-analytics-api.ts` | Low | Pre-existing | SDK type-drift workaround; unchanged since Epic 91 |
| `.eslintrc.json` documentation-only | Info | Story 98.1 | Retained for IDE integration; not enforcement path |
| Fix-propagation prompt untested in practice | Low | Story 99.2 | Structural prompt added but no stories have exercised it yet |

---

## Team Agreements

- **Commit before flipping `done`** — uncommitted changes at story close has recurred 2 epics running. Commit first, then update status.
- **Full-row replacement for CLAUDE.md table edits** — avoid substring matching in pipe-delimited tables; use enough context to uniquely identify the target row.
- **Test tooling against the actual enforcement mechanism** — when building validators, always test against the real enforcement path (e.g., `--print-config` not `getRules()`).

---

## Epic 99-FE Readiness Assessment

| Dimension | Status |
|---|---|
| Testing & Quality | ✅ All gates green at baselines |
| Deployment | ✅ Both stories committed |
| Stakeholder Acceptance | ✅ Process/tooling epic; no external stakeholders |
| Technical Health | ✅ No regressions; ESLint enforcement working; HALT scripts operational |
| Unresolved Blockers | None |

---

## Next Steps

1. **Determine next phase** — 29 consecutive epics shipped (71-99). Natural stopping point or transition to maintenance mode.
2. **Integrate `check-eslint-rules` into CI** (A-1) — script is ready, needs CI wiring
3. **Monitor fix-propagation prompt** (A-2) — structural prompt needs real-world testing
4. **Continue 2-pass review discipline** — 34+ streak intact

---

**Retrospective closed**: 2026-05-12
**Participants**: R2d2 (Project Lead), claude-opus-4-7 (Dev/Reviewer)
