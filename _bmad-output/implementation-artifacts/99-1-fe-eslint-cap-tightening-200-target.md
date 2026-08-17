# Story 99.1: ESLint Cap Tightening — 400→200 Phase

Status: done

## Story

As a developer,
I want the ESLint `max-lines` cap tightened from 400 to 200 for non-test source files,
so that the 150-line proactive extraction target has a meaningful enforcement ceiling, and file-size bloat is caught early rather than accumulating to the 400-line threshold.

## Background & Context

**Source**: Epic 98-FE retrospective action item A-1 (ESLint cap tightening 400→200). Story 98.1-FE successfully tightened 800→400 with 0 violators. This story completes the tightening roadmap.

**Enforcement path verified**: Story 98.1-FE confirmed that ESLint enforcement works exclusively through monorepo root `eslint.config.js` (flat config). `next lint` is deprecated and ignores `frontend/.eslintrc.json`. The `--rule` CLI override also works for ad-hoc checks.

**Effective line counting**: ESLint's `skipBlankLines: true` + `skipComments: true` counts are significantly lower than `wc -l`. Always verify with actual ESLint before planning extractions (Story 98.1-FE lesson).

**Epic 98 retro A-1 success criteria**: "Cap at 200 with ≤30 violators, or documented deferral rationale." Current analysis shows 6 violators — well within the ≤30 threshold.

## Acceptance Criteria

1. **ESLint base `max-lines` cap changed from 400 → 200** in root `eslint.config.js` (frontend source section), with `skipBlankLines: true` + `skipComments: true` preserved.
2. **Test files, test fixtures, and mock handlers retain 800-line cap** via existing override patterns (`frontend/**/__tests__/**`, `frontend/**/*.test.*`, `frontend/src/test/**`).
3. **All non-test source files are under 200 effective lines** — the 6 files currently between 200–400 lines (see File Extraction Targets) are extracted/split following project patterns.
4. **All quality gates green**: ESLint 0 errors / 114 warnings (pre-existing `no-explicit-any`), type-check 20 errors (advertising-analytics-api.ts only), tests ≥7244 passing.
5. **CLAUDE.md Accepted Baselines** updated: ESLint row annotated with cap value 200.
6. **Sprint-status.yaml** updated with Epic 99-FE section + story entry.

## Tasks / Subtasks

- [x] Task 1: Update ESLint config for 200-line cap (AC: #1, #2)
  - [x] 1a. Change `max-lines.max` from 400 → 200 in root `eslint.config.js` (frontend source section)
  - [x] 1b. Verify test/fixture override still retains 800-line cap
  - [x] 1c. Sync frontend `.eslintrc.json` to 200 for documentation consistency
  - [x] 1d. Run ESLint from root to confirm only the 6 expected source files violate
- [x] Task 2: Extract files over 200 effective lines (AC: #3)
  - [x] 2a. Extract `StorageBySkuTable.tsx` (315 lines) — split table columns into separate component file
  - [x] 2b. Extract `price-calculator.ts` (289 lines) — split by concern: core types, enums, interfaces into subdirectory
  - [x] 2c. Extract `cogs.ts` (263 lines) — split by concern: core types, API response types
  - [x] 2d. Extract `advertising-analytics.ts` (227 lines) — split by concern: API response types, enums
  - [x] 2e. Extract `TopConsumersWidget.tsx` (225 lines) — split widget sub-components
  - [x] 2f. Extract `TrendGraph.tsx` (216 lines) — split chart configuration from rendering logic
  - [x] 2g. Run ESLint to verify 0 source file violations at cap 200
- [x] Task 3: Update CLAUDE.md baselines (AC: #4, #5)
  - [x] 3a. Update Accepted Baselines ESLint row with cap value 200
  - [x] 3b. Update "File size limit" prose from 400 to 200
  - [x] 3c. Run `bash scripts/check-doc-citations.sh` to verify no broken citations
- [x] Task 4: Update sprint-status.yaml (AC: #6)
  - [x] 4a. Add Epic 99-FE section with `in-progress` status
  - [x] 4b. Add `99-1-fe-eslint-cap-tightening-200-target: ready-for-dev` entry
- [x] Task 5: Final quality gates (AC: #4)
  - [x] 5a. `npx eslint 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx'` — 0 errors, 114 warnings
  - [x] 5b. `npm run type-check` — 20 errors in advertising-analytics-api.ts only
  - [x] 5c. `npm test -- --run` — ≥7244 passing, 0 failed
  - [x] 5d. `bash scripts/check-doc-citations.sh` — baseline match
  - [x] 5e. No temporary files remaining

## File Extraction Targets

Non-test source files between 200–400 effective lines (6 files):

| File | Effective Lines | Category | Extraction Strategy |
|------|----------------|----------|-------------------|
| `src/app/(dashboard)/analytics/storage/components/StorageBySkuTable.tsx` | 315 | Component | Split table columns + formatting helpers into separate files |
| `src/types/price-calculator.ts` | 289 | Types | Split by concern: core types, enums, interfaces into `src/types/price-calculator/` subdirectory |
| `src/types/cogs.ts` | 263 | Types | Split by concern: core types, API response types |
| `src/types/advertising-analytics.ts` | 227 | Types | Split by concern: API response types, enums |
| `src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx` | 225 | Component | Split widget sub-components into separate files |
| `src/components/custom/TrendGraph.tsx` | 216 | Component | Split chart configuration from rendering logic |

**Types extraction pattern**: Create subdirectory `src/types/<domain>/` with `index.ts` barrel re-export + per-concern files (e.g., `types.ts`, `enums.ts`, `api-response.ts`). Update all imports to use barrel path.

**Component extraction pattern**: Extract sub-components or helper functions into sibling files. Use barrel re-exports where needed.

## Dev Notes

### Extraction Best Practices (from Epic 74-FE)

Epic 74-FE (File Size Compliance & Code Splitting) established the project's extraction patterns:
- Barrel re-exports from `index.ts` to preserve existing import paths
- Split by concern, not by arbitrary line count
- Update all imports in dependent files
- Run type-check after every extraction to catch broken imports
- Each extraction should be a separate logical commit if feasible

### Key Learnings from Story 98.1-FE

1. **`next lint` is dead** — ESLint flat config at monorepo root is the only enforcement path
2. **`wc -l` overcounts** — always verify with ESLint's `skipBlankLines+skipComments` before planning extractions
3. **Fixing a quality gate surfaces pre-existing violations** — treat them as debt-paydown, not regressions
4. **ESLint `--rule` override** works for ad-hoc checks: `npx eslint --rule 'max-lines: ["error", {"max": 200, ...}]' 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx'`

### File Distribution Context

| Category | Over 200 effective lines | Notes |
|----------|------------------------|-------|
| Non-test source files | 6 | **This story's extraction targets** |
| Test files (`__tests__/**`, `*.test.*`) | 160 | Under 800-line test cap — not in scope |
| Test fixtures (`src/test/**`) | 13 | Under 800-line test/fixture cap — not in scope |
| Mock handlers (`src/mocks/**`) | 5 | Under 800-line test cap — not in scope |

### ESLint Config Final State (Target)

Enforcement via root `eslint.config.js` (flat config):
- Frontend source section: `max-lines: 200`
- Frontend test/fixture override: `max-lines: 800`
- Frontend `.eslintrc.json` synced to 200 for documentation/IDE integration only

### Project Structure Notes

- Types files live in `src/types/` — extraction creates subdirectories under this path
- Components live in `src/components/` or `src/app/` — extraction creates sibling files
- All imports use `@/` path aliases — barrel re-exports preserve existing import paths

### References

- [Source: `_bmad-output/implementation-artifacts/98-1-fe-eslint-cap-tightening-400-target.md`] — Story 98.1 context, 800→400 tightening
- [Source: `_bmad-output/implementation-artifacts/epic-98-fe-retro-2026-05-12.md`] — Epic 98 retro, A-1 action item
- [Source: `eslint.config.js` (monorepo root)] — Actual enforcement path
- [Source: `CLAUDE.md` § Accepted Baselines] — Quality gate baselines to update
- [Source: `CLAUDE.md` § Critical Development Rules] — "File size limit" prose

## Dev Agent Record

### Agent Model Used
Claude Opus 4 (glm-5.1)

### Debug Log References
N/A

### Completion Notes List
- ESLint cap changed from 400→200 in root `eslint.config.js`, synced in `.eslintrc.json`
- Added `frontend/src/mocks/**` to test override pattern (5 mock handlers caught at cap 200)
- 6 files extracted: 3 type files split into subdirectories with barrel re-exports, 3 component files split into sibling modules
- StorageBySkuTable: reused already-extracted sibling modules instead of creating new files
- 7 backtick-wrapped doc citations updated in `_bmad-output/` story files 88-1 and 88-2 (advertising-analytics.ts → subdirectory path); prose references to old path left as historical context
- All quality gates match baselines: ESLint 0e/114w, TS 20 errors (same file), tests 7244, citations 13

### Post-1st-pass-review fixes (2026-05-12)
- [M] Deleted dead duplicate `TopConsumersWidgetParts.tsx` — zero importers, same symbols as new `TopConsumersHelpers.tsx`
- [L] Near-cap warning: `price-calculator/calculator.ts` at 172 effective lines — flagged for awareness

### Post-2nd-pass-review fixes (2026-05-12)
- [H] Qualified story narrative: "7 doc citations updated" → "7 backtick-wrapped doc citations" to accurately reflect partial update
- [M] Consolidated inline `import('./cogs')` in `products.ts` to top-level `import type`

### Post-3rd-pass-review fixes (2026-05-12) — BMad code-review workflow
- [M] Synced sprint-status `99-1-fe-eslint-cap-tightening-200-target: in-progress → review → done`
- [M] Added `### Post-Nth-pass-review fixes` sub-headings (convention from CLAUDE.md § Two-pass review discipline)

### File List
- MODIFIED: `eslint.config.js` (monorepo root) — cap 400→200, added mocks override
- MODIFIED: `frontend/.eslintrc.json` — synced to 200
- MODIFIED: `frontend/CLAUDE.md` — Accepted Baselines ESLint row, file size limit prose
- DELETED: `frontend/src/types/price-calculator.ts` → split into subdirectory
- CREATED: `frontend/src/types/price-calculator/calculator.ts`
- CREATED: `frontend/src/types/price-calculator/shared.ts`
- CREATED: `frontend/src/types/price-calculator/index.ts`
- DELETED: `frontend/src/types/cogs.ts` → split into subdirectory
- CREATED: `frontend/src/types/cogs/cogs.ts`
- CREATED: `frontend/src/types/cogs/products.ts`
- CREATED: `frontend/src/types/cogs/index.ts`
- DELETED: `frontend/src/types/advertising-analytics.ts` → split into subdirectory
- CREATED: `frontend/src/types/advertising-analytics/analytics.ts`
- CREATED: `frontend/src/types/advertising-analytics/sync-groups.ts`
- CREATED: `frontend/src/types/advertising-analytics/index.ts`
- MODIFIED: `frontend/src/app/(dashboard)/analytics/storage/components/StorageBySkuTable.tsx`
- CREATED: `frontend/src/app/(dashboard)/analytics/storage/components/TopConsumersHelpers.tsx`
- MODIFIED: `frontend/src/app/(dashboard)/analytics/storage/components/TopConsumersWidget.tsx`
- MODIFIED: `frontend/src/components/custom/TrendGraph.tsx`
- CREATED: `frontend/src/components/custom/TrendGraphStates.tsx`
- UPDATED: `frontend/_bmad-output/implementation-artifacts/88-1-fe-clean-source-todos.md` — backtick citation fix (prose refs left as historical)
- UPDATED: `frontend/_bmad-output/implementation-artifacts/88-2-fe-null-type-audit-propagation.md` — backtick citation fix (prose refs left as historical)
- DELETED: `frontend/src/app/(dashboard)/analytics/storage/components/TopConsumersWidgetParts.tsx` — dead duplicate of new TopConsumersHelpers.tsx (1st-pass M finding)
- MODIFIED: `frontend/src/types/cogs/products.ts` — consolidated inline import() to top-level import type (2nd-pass M finding)

### Change Log

| Date | Change |
|---|---|
| 2026-05-12 | Story created. ESLint cap tightening from 400→200 for non-test source files. Origin: Epic 98-FE retro A-1. 6 files targeted for extraction. Enforcement path verified in Story 98.1-FE. |
| 2026-05-12 | Implementation complete. All 6 files extracted, all quality gates green. Status: review → awaiting 2-pass code review. **Lessons:** (1) Mock handlers in src/mocks/ need explicit test-override coverage (5 caught). (2) Barrel re-exports preserve all import paths — zero downstream breakage. (3) Citations to deleted files surface as NEW broken in check-doc-citations — fix inline, don't baseline-skip. |
| 2026-05-12 | Post-1st-pass-review fixes (2026-05-12). Deleted dead duplicate TopConsumersWidgetParts.tsx (M finding, zero importers). |
| 2026-05-12 | Post-2nd-pass-review fixes (2026-05-12). Consolidated inline import() in products.ts to top-level import type (M finding). Qualified story narrative: "7 doc citations" → "7 backtick-wrapped doc citations" (H finding). |
| 2026-05-12 | Status: review → done. 3-pass code review complete (2 agent passes + BMad workflow pass). All findings fixed. **Lessons:** (1) `### Post-Nth-pass-review fixes` sub-headings are the structural marker, not Change Log rows alone. (2) Sprint-status must track story status at every flip. (3) Dead files become confusing debt when their replacements ship — delete immediately. |
