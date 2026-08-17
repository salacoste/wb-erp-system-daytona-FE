# Story 98.1: ESLint Cap Tightening — 800→400 Phase

Status: done

## Story

As a developer,
I want the ESLint `max-lines` cap tightened from 800 to 400 for non-test source files,
so that file-size bloat is caught at CI time rather than accumulating silently, and the 150-line proactive extraction target has meaningful enforcement backing it.

## Background & Context

**Source**: Epic 97-FE retrospective action item A-1. Story 97.6-FE fixed the `max-lines-per-file` → `max-lines` typo and raised the cap from 200 to 800 as a compromise. The 800-line cap catches only 4 test files above it; 31 non-test source files between 200–800 lines are invisible to the gate.

**C-4 dependency (Story 97.6)**: During 97.6 implementation, diagnostic testing showed that `next lint` under Next.js 15 may not actually load `.eslintrc.json`. Injecting `eqeqeq: "error"` + `max-lines: 50` into `.eslintrc.json` produced 0/0 lint output — config was completely ignored. **This story MUST verify ESLint enforcement before depending on it.** If enforcement is broken, the cap change is cosmetic and the story should escalate (not silently close).

**Epic 97 retro success criteria for A-1**: "Cap at 400 with ≤50 violators, or documented deferral rationale."

## Acceptance Criteria

1. **ESLint base `max-lines` cap changed from 800 → 400** in root `eslint.config.js` (the actual enforcement path) AND synced in `frontend/.eslintrc.json` (documentation only), with `skipBlankLines: true` + `skipComments: true` preserved.
2. **Test files and test fixtures retain 800-line cap** via a dedicated ESLint config block in `eslint.config.js` for `frontend/**/__tests__/**`, `frontend/**/*.test.*`, and `frontend/src/test/**` patterns.
3. **All non-test source files are under 400 lines** — the 7 files currently between 400–800 lines (see File Extraction Targets below) are extracted/split following project patterns.
4. **ESLint enforcement verified** — `next lint` (or equivalent) produces errors when a deliberate 401-line violation is introduced. If enforcement is broken, the story adds a `HALT:` finding and does NOT close until either (a) enforcement is fixed, or (b) the finding is documented as a known gap with a dedicated follow-up story.
5. **All quality gates green**: ESLint 0 errors / 114 warnings (pre-existing `no-explicit-any`), type-check 20 errors (advertising-analytics-api.ts only), tests ≥7244 passing.
6. **CLAUDE.md Accepted Baselines** updated: ESLint row annotated with "Story 98.1-FE" + cap value 400.
7. **Sprint-status.yaml** updated with Epic 98 section + story entry.

## Tasks / Subtasks

- [x] Task 1: Verify ESLint enforcement (AC: #4)
  - [x] 1a. Create a temporary 401-line test file to verify `npm run lint` catches `max-lines` violations
  - [x] 1b. If lint returns 0/0 despite the violation → enforcement is broken; add HALT finding, document in story, do NOT proceed to Task 2
  - [x] 1c. If enforcement works → delete temp file, proceed to Task 2
- [x] Task 2: Update ESLint config for 400-line cap (AC: #1, #2)
  - [x] 2a. Change `max-lines.max` from 800 → 400 in root `eslint.config.js` (frontend section) — the ACTUAL enforcement path
  - [x] 2b. Add test-file override in root `eslint.config.js` retaining 800-line cap for `frontend/**/__tests__/**` + `frontend/**/*.test.*`
  - [x] 2c. Sync frontend `.eslintrc.json` to 400 for documentation consistency (even though it's not in the enforcement chain)
  - [x] 2d. Run ESLint from root to identify current violators
- [x] Task 3: Extract files over 400 lines (AC: #3)
  - [x] 3a. Verified: original 7 target files all under 400 effective lines (skipBlankLines+skipComments). No extraction needed.
  - [x] 3b. Extracted `ProductList.test.tsx` (819→698 effective lines) → split Selection/Margin/A11y into `ProductList.selection-margin-a11y.test.tsx` (465 lines). Pre-existing 800-line violation resolved.
- [x] Task 4: Update CLAUDE.md baselines (AC: #5, #6)
  - [x] 4a. Update Accepted Baselines ESLint row with Story 98.1-FE annotation
  - [x] 4b. Update "File size limit" mandatory rule prose if cap value is referenced
  - [x] 4c. Run `bash scripts/check-doc-citations.sh` to verify no broken citations
- [x] Task 5: Update sprint-status.yaml (AC: #7)
  - [x] 5a. Add Epic 98-FE section with `backlog` status
  - [x] 5b. Add `98-1-fe-eslint-cap-tightening-400-target: ready-for-dev` entry
  - [x] 5c. Flip `epic-98-fe: backlog → in-progress`
- [x] Task 6: Final quality gates (AC: #5)
  - [x] 6a. `npx eslint 'frontend/src/**/*.ts' 'frontend/src/**/*.tsx'` — 0 errors, 114 warnings (pre-existing `no-explicit-any`)
  - [x] 6b. `npm run type-check` — 20 errors in advertising-analytics-api.ts only
  - [x] 6c. `npm test -- --run` — 7244 passing, 0 failed
  - [x] 6d. `bash scripts/check-doc-citations.sh` — 13 broken (baseline match)
  - [x] 6e. No temporary files remaining

## File Extraction Targets

Current non-test source files between 400–800 lines (7 files):

> **Verification result**: ESLint with `skipBlankLines` + `skipComments` reports 0 violations for all 7 files at cap 400. Raw `wc -l` counts overstate effective line counts. No extraction needed — only `ProductList.test.tsx` (pre-existing 819-line violation) required splitting.

| File | Lines | Category | Extraction Strategy |
|------|-------|----------|-------------------|
| `src/types/price-calculator.ts` | 799 | Types | Split by concern: core types, enums, interfaces |
| `src/mocks/data/archived/epic-37-merged-groups.ARCHIVED.ts` | 637 | Archived | Delete or split — archived data, not production code |
| `src/types/advertising-analytics.ts` | 595 | Types | Split by concern: API response types, enums, normalizer types |
| `src/mocks/handlers/liquidity.ts` | 475 | Mock handlers | Split by endpoint group |
| `src/types/cogs.ts` | 473 | Types | Split by concern: core types, API response types |
| `src/mocks/handlers/advertising.ts` | 463 | Mock handlers | Split by endpoint group |
| `src/types/storage-analytics.ts` | 454 | Types | Split by concern: API response types, enums |

**Types extraction pattern**: Create a subdirectory `src/types/<domain>/` with `index.ts` barrel re-export + per-concern files (e.g., `types.ts`, `enums.ts`, `api-response.ts`). Update all imports to use barrel path. Ensure no circular dependencies.

**Mock handler extraction pattern**: Split large handler files by endpoint group into separate handler files, combine via barrel export.

**Archived file**: `epic-37-merged-groups.ARCHIVED.ts` is dead code. Best option is deletion. If deletion is risky (referenced elsewhere), split into sub-files.

## Dev Notes

### ESLint Enforcement Uncertainty (Critical)

Story 97.6-FE discovered that `next lint` may not load `.eslintrc.json` at all under Next.js 15. This is the single biggest risk for this story. Task 1 MUST verify enforcement before any extraction work. If enforcement is broken, the story scope shifts to "document the gap and create a follow-up story" rather than "extract 7 files."

### Extraction Best Practices (from Epic 74-FE)

Epic 74-FE (File Size Compliance & Code Splitting) established the project's extraction patterns:
- Barrel re-exports from `index.ts` to preserve existing import paths
- Split by concern, not by arbitrary line count
- Update all imports in dependent files
- Run type-check after every extraction to catch broken imports
- Each extraction should be a separate logical commit if feasible

### File Distribution Context

Total source files (non-test): 1330
- Under 200 lines: 1298 (97.6%)
- 200-400: 24 (1.8%) — next tightening phase target (future story)
- 400-800: 7 (0.5%) — **this story's extraction targets**
- Over 800: 0 (verified via ESLint enforcement with skipBlankLines+skipComments)

Total test files: 546
- Over 800: 4 (retaining 800 cap via override)
- 400-800: unknown count (will be handled when tightening to 200)

### ESLint Config Final State

Enforcement is via root `eslint.config.js` (flat config), NOT `frontend/.eslintrc.json` (which `next lint` ignores). The root config has:
- Frontend source section: `max-lines: 400`
- Frontend test/fixture override: `max-lines: 800`
- Frontend `.eslintrc.json` synced to 400 for documentation/IDE integration only

### Project Structure Notes

- Types files live in `src/types/` — extraction creates subdirectories under this path
- Mock handlers live in `src/mocks/handlers/` — extraction creates additional handler files here
- All imports use `@/` path aliases — barrel re-exports preserve existing import paths
- Extraction follows the Boundary Normalizer Pattern: backend shapes stay in API client layer, frontend types in `src/types/`

### References

- [Source: `_bmad-output/implementation-artifacts/97-6-fe-eslint-max-lines-typo-fix-claude-md-reconcile.md`] — Story 97.6 context, ESLint typo fix, C-4 enforcement finding
- [Source: `_bmad-output/implementation-artifacts/epic-97-fe-retro-2026-05-11.md`] — Epic 97 retro, A-1 action item origin
- [Source: `.eslintrc.json`] — Current ESLint config (max-lines at 800)
- [Source: `CLAUDE.md` § Accepted Baselines] — Quality gate baselines to update
- [Source: `CLAUDE.md` § Critical Development Rules] — "File size limit" prose
- [Source: `CLAUDE-PATTERNS.md` § Boundary Normalizer Pattern] — Extraction pattern for API response types

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

### Completion Notes List

- ✅ Task 1: ESLint enforcement verified. CRITICAL FINDING: `next lint` does NOT load `frontend/.eslintrc.json`. ESLint enforcement works exclusively through monorepo root `eslint.config.js` (flat config). The frontend `.eslintrc.json` has been a no-op for its entire existence — `max-lines`, `jsx-a11y`, and other rules defined there were never enforced. Fix: add `max-lines` to root `eslint.config.js` frontend section.
- ✅ Task 2: Updated root `eslint.config.js` — base cap 400 for source, 800 for test/fixtures. Synced frontend `.eslintrc.json` to 400 for documentation.
- ✅ Task 3: Original 7 target files all under 400 effective lines (skipBlankLines+skipComments). Extracted `ProductList.test.tsx` (819→698 lines) → new `ProductList.selection-margin-a11y.test.tsx` (465 lines). Fixed 5 pre-existing unused-variable errors surfaced by working enforcement.
- ✅ Task 4: Updated CLAUDE.md — file size limit prose (400/800), extraction target line, Accepted Baselines ESLint row with enforcement path documentation.
- ✅ Task 5: Sprint-status updated with Epic 98 section.
- ✅ Task 6: All quality gates green. ESLint 0 errors / 114 warnings (pre-existing). Type-check 20 errors (baseline). Tests 7244 passing. Doc-citations 13 broken (baseline).

### File List

- `eslint.config.js` — Modified (monorepo root): added `max-lines` rule to frontend section (cap 400), added test/fixture override (cap 800)
- `.eslintrc.json` — Modified: synced `max-lines.max` from 800 → 400
- `src/components/custom/__tests__/ProductList.test.tsx` — Modified: extracted Selection/Margin/A11y tests to separate file (990→698 lines)
- `src/components/custom/__tests__/ProductList.selection-margin-a11y.test.tsx` — Created: 7 tests extracted from ProductList.test.tsx
- `src/components/auth/AuthProvider.tsx` — Modified: removed unused `useEffect` import
- `src/components/custom/LogoutButton.test.tsx` — Modified: removed unused `useAuthStore` import
- `src/components/custom/supplies/__tests__/OrderPickerSelection.test.tsx` — Modified: removed unused `mockOnSelectionChange` variable
- `src/hooks/__tests__/useGenerateStickers.test.ts` — Modified: removed unused `StickerFormat` import
- `src/services/cabinets.service.ts` — Modified: removed unused `CreateCabinetRequest` import
- `CLAUDE.md` — Modified: file size limit prose, extraction target line, Accepted Baselines ESLint row

### Post-1st-pass-review fixes (2026-05-11)

- **H-1**: Removed commented-out `StickerFormat` import in `useGenerateStickers.test.ts` (dead code)
- **M-1**: Added `_comment` field to `.eslintrc.json` clarifying it's NOT the enforcement path (root `eslint.config.js` is)
- **M-2**: Updated File List to annotate `eslint.config.js` as "(monorepo root)" for path clarity
- **L-2**: Added verification note to File Extraction Targets table explaining why original 7 files needed no extraction

### Post-2nd-pass-review fixes (2026-05-11)

- **M-1**: Updated AC-1 to reference `eslint.config.js` (actual enforcement path) instead of `.eslintrc.json` (documentation only)
- **M-2**: Updated AC-5 ESLint baseline from "lint 0/0" to "0 errors / 114 warnings" (factual correction)
- **M-3**: Replaced stale Dev Notes code blocks (pre/post-implementation) with concise final-state description
- **M-4**: Updated AC-2 to include `frontend/src/test/**` pattern for test fixtures
- **L-1**: Fixed File List entry for `useGenerateStickers.test.ts` from "commented out" to "removed" (1st-pass H-1 applied)
- **L-2**: Resolved "~1 (questionable count)" to "0" based on ESLint enforcement verification
- **L-3**: Removed duplicate empty Dev Agent Record section headings

### Change Log

| Date | Change |
|---|---|
| 2026-05-11 | Story created. ESLint cap tightening from 800→400 for non-test source files. Origin: Epic 97-FE retro A-1. 7 files targeted for extraction. Dependency: ESLint enforcement verification (Story 97.6 C-4 finding). |
| 2026-05-11 | Implementation complete. CRITICAL FINDING: `next lint` never enforced `frontend/.eslintrc.json` — ESLint flat config at monorepo root is the actual enforcement path. Added `max-lines` to root config (400 source / 800 test). Extracted ProductList.test.tsx (819→698). Fixed 5 pre-existing unused-variable errors. **Lessons:** (1) `next lint` is deprecated + config-ignorant; flat config at monorepo root is the real enforcement path (Story 98.1-FE). (2) `wc -l` overcounts vs ESLint's `skipBlankLines+skipComments` — always verify with actual ESLint before planning extractions (Story 98.1-FE). (3) Fixing a quality gate surfaces pre-existing violations — treat them as debt-paydown, not regressions (cf. Story 94.6-FE cleanliness check). Status: review → done. |
| 2026-05-21 | Story 112.5-FE allowlist cleanup: original Lessons line (above) was authored pre-validator deployment (Story 111.1-FE, 2026-05-19) when the ≤120-char Lessons cap (Story 94.4-FE, 2026-04-25) had no automated enforcement. Per APPEND-ONLY closed-story Change Log convention (Story 111.1-FE F-2), the original Lessons text is retained verbatim; this disclosure row supersedes it for validator purposes only. Status: review → done. **Lessons:** (1) Closed before ≤120-char cap validator existed (Story 111.1-FE, 2026-05-19); original Lessons retained above. |
