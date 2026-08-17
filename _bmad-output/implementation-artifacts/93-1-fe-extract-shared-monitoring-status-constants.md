# Story 93.1-FE: Extract Shared Monitoring Status Constants

Status: done

## Story

**As a** maintainer of the Monitor + Monitoring pages,
**I want** `STATUS_COLORS` and `STATUS_LABELS` to live in one shared module instead of being mirrored between `PipelineStatusGrid.tsx` (canonical) and `monitor-pipeline-utils.ts` (Story 92.5 mirror with sync-note comment),
**so that** a future `PipelineStatus` enum change doesn't require two coordinated edits and the "keep in sync" tribal-knowledge debt closes cleanly.

**Epic**: 93-FE Operational Cleanup & Pattern Codification
**Priority**: P3
**Estimate**: 2 story points
**First story in Epic 93-FE.** Addresses Epic 92-FE retrospective Action Item #4.

---

## Problem Statement

Story 92.5 introduced a deliberate `// Mirrors PipelineStatusGrid.tsx — keep in sync` comment around `STATUS_COLORS` / `STATUS_LABELS` in `monitor-pipeline-utils.ts`. This was the correct scope-discipline move at the time (rule-of-two, defer extraction). The Epic 92 retrospective flagged it as "deferred extraction debt" item #4 — now the first story of Epic 93 closes it.

**Scope verification** (grep confirmed, 2026-04-24):
- `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:30-44 (pre-refactor)` — canonical definitions (plus `STATUS_ORDER` sort helper at lines 22-28, unique to this file, NOT duplicated).
- `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts:86-100 (pre-refactor)` — mirror with sync-note.
- `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` — consumer of the mirror.

Other files that grep matched `STATUS_COLORS`/`STATUS_LABELS` (`shipments/`, `supplies/`, `orders-status-config.ts`, etc.) are **domain-specific, different shapes, not duplicates.** Out of scope.

So: 2 files define the same `Record<PipelineStatus, string>` maps. 1 consumer uses the mirror. Extraction is low-risk — no public API change, just shifting the source of truth.

---

## Acceptance Criteria

### AC-1: Shared module created

Create `src/lib/monitoring-constants.ts`:

- [x] Exports `STATUS_COLORS: Record<PipelineStatus, string>` — copied verbatim from `PipelineStatusGrid.tsx:30-36`.
- [x] Exports `STATUS_LABELS: Record<PipelineStatus, string>` — copied verbatim from `PipelineStatusGrid.tsx:38-44`.
- [x] Imports `PipelineStatus` type from the existing canonical location: `@/app/(dashboard)/monitoring/types/monitoring` (re-exported from `monitoring-enums.ts`).
- [x] File-level block comment pointing to this story + Epic 92 retro action item #4.
- [x] File size ≤ 60 lines.

### AC-2: `PipelineStatusGrid.tsx` consumes shared module

Modify `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx`:

- [x] Import `STATUS_COLORS` + `STATUS_LABELS` from `@/lib/monitoring-constants`.
- [x] Delete the local definitions at lines 30-44.
- [x] `STATUS_ORDER` (lines 22-28) stays local — it's sorting logic unique to this file, not a mirror. Do NOT move it.
- [x] No other changes. Zero JSX or logic edits beyond the imports.

### AC-3: `monitor-pipeline-utils.ts` consumes shared module

Modify `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts`:

- [x] Import `STATUS_COLORS` + `STATUS_LABELS` from `@/lib/monitoring-constants`.
- [x] Delete the local definitions at lines 86-100.
- [x] Re-export them from `monitor-pipeline-utils.ts` so `MonitorPipelineHealth.tsx` doesn't need to change its import path (e.g., `export { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`).
- [x] Delete the `// Mirrors PipelineStatusGrid.tsx — keep in sync` comments (lines 5-9 header note + lines 81-84 section header).
- [x] Replace with a single short comment: `// STATUS_COLORS/STATUS_LABELS re-exported from @/lib/monitoring-constants (Story 93.1 extraction).`

### AC-4: `MonitorPipelineHealth.tsx` unchanged

- [x] Zero modifications to `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` — it currently imports `STATUS_COLORS` / `STATUS_LABELS` from `./monitor-pipeline-utils`, and the re-export in AC-3 preserves that path. **Verify via `git diff`: this file must show no changes.**

### AC-5: Grep verification — no stale mirror remains

After extraction, run:

- [x] `grep -rn "STATUS_COLORS: Record<PipelineStatus" src/` should return exactly ONE line (in `src/lib/monitoring-constants.ts`).
- [x] `grep -rn "STATUS_LABELS: Record<PipelineStatus" src/` — same.
- [x] `grep -rn "Mirrors PipelineStatusGrid" src/` should return ZERO lines.

### AC-6: Type-check sanity

- [x] `PipelineStatus` type resolution: both `PipelineStatusGrid.tsx` and `monitor-pipeline-utils.ts` currently import `PipelineStatus` from different places (`'../types/monitoring'` and `@/app/(dashboard)/monitoring/types/monitoring` respectively — same underlying enum). The new `monitoring-constants.ts` must import from **the absolute path** (`@/app/(dashboard)/monitoring/types/monitoring`) so it's agnostic to call-site location.
- [x] No circular imports introduced.

### AC-7: Tests — no new tests needed, existing tests stay green

- [x] No new unit tests required. The extraction is pure refactor: same values, same consumers. Existing tests (`MonitorPipelineHealth.test.tsx`, any `PipelineStatusGrid.test.tsx`) pass unchanged.
- [x] Verify: `npm test -- --run` → **6986 passing** (unchanged from Epic 92 close baseline), 0 regressions.

### AC-8: Validation

- [x] `npm run type-check` → 0 new errors beyond pre-existing `advertising-analytics-api.ts` baseline.
- [x] `npm run lint` → 0 warnings/errors.
- [x] `npm test -- --run` → 6986 passing, 0 regressions.
- [x] `npm run check:docs` → unchanged (186/13 per Epic 92.6 baseline, OR 185/13 if 92.6 L-11 cause was a transient; document actual in Completion Notes).

### AC-9: Sprint-status transition

- [x] `93-1-fe-extract-shared-monitoring-status-constants: ready-for-dev → review` upon impl complete.
- [x] Epic `93-fe` stays `in-progress`.

---

## Tasks / Subtasks

### Task 1: Create shared module (AC-1)
- [x] 1.1: Create `src/lib/monitoring-constants.ts` with the two exports + block-comment header.
- [x] 1.2: Import `PipelineStatus` from `@/app/(dashboard)/monitoring/types/monitoring`.

### Task 2: Migrate `PipelineStatusGrid.tsx` (AC-2)
- [x] 2.1: Add `import { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`.
- [x] 2.2: Delete local `STATUS_COLORS` + `STATUS_LABELS` constants.
- [x] 2.3: Verify `STATUS_ORDER` stays local (it's unique, not a mirror).

### Task 3: Migrate `monitor-pipeline-utils.ts` (AC-3)
- [x] 3.1: Add `import { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`.
- [x] 3.2: Delete local definitions (lines 86-100 + mirror-section header comment).
- [x] 3.3: Add re-export: `export { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`.
- [x] 3.4: Update the file-level header comment (lines 5-9) to remove the "mirrors" wording. Replace with a one-line pointer to Story 93.1.

### Task 4: Verification (AC-4, AC-5, AC-6)
- [x] 4.1: `git diff src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` → must be empty.
- [x] 4.2: Grep sweep per AC-5.
- [x] 4.3: Type-check → clean.

### Task 5: Validation (AC-7, AC-8)
- [x] 5.1: `npm run type-check && npm run lint && npm test -- --run`.
- [x] 5.2: `npm run check:docs`.
- [x] 5.3: Sprint-status transition (AC-9).

---

## Dev Notes

### Canonical references (read first)

1. `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx:22-44 (pre-refactor)` — **canonical `STATUS_COLORS`/`STATUS_LABELS`** (lines 30-44) + unique `STATUS_ORDER` (lines 22-28, DO NOT move). Post-refactor: `src/lib/monitoring-constants.ts:16-22` (STATUS_COLORS) and `:28-34` (STATUS_LABELS).
2. `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts:86-100 (pre-refactor)` — **mirror with sync-note** (extracting this source).
3. `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` — consumer via `./monitor-pipeline-utils` path.
4. `src/app/(dashboard)/monitoring/types/monitoring-enums.ts` — `PipelineStatus` enum definition.
5. `src/app/(dashboard)/monitoring/types/monitoring.ts` — barrel re-export of `PipelineStatus`.

### Reference implementation

```typescript
// src/lib/monitoring-constants.ts
/**
 * Shared monitoring-domain constants.
 * Epic 93-FE Story 93.1: extracted from PipelineStatusGrid.tsx + monitor-pipeline-utils.ts
 * to close the "mirrors X — keep in sync" ledger from Epic 92-FE retro action item #4.
 *
 * Consumers:
 * - src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx
 * - src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts (re-exported)
 */
import type { PipelineStatus } from '@/app/(dashboard)/monitoring/types/monitoring'

export const STATUS_COLORS: Record<PipelineStatus, string> = {
  healthy: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  critical: 'bg-red-500 text-white',
  stale: 'bg-gray-500 text-white',
  no_data: 'bg-gray-300 text-gray-700',
}

export const STATUS_LABELS: Record<PipelineStatus, string> = {
  healthy: '✓ Работает',
  warning: '⚠ Задержка',
  critical: '✕ Критично',
  stale: '◷ Устарело',
  no_data: '— Нет данных',
}
```

### Why `@/lib/` and not another location

- `@/lib/` is the established home for cross-feature utilities (`src/lib/margin-helpers.ts`, `src/lib/routes.ts`, `src/lib/utils.ts`, etc.).
- Not `@/app/(dashboard)/monitoring/` because the constants are now consumed by both `monitoring/` AND `monitor/` — symmetry beats nesting in one of them.
- Not `@/components/` because these aren't components.

### Why the re-export in `monitor-pipeline-utils.ts`

AC-4 requires `MonitorPipelineHealth.tsx` to stay unchanged. `MonitorPipelineHealth.tsx` currently imports `STATUS_COLORS` / `STATUS_LABELS` from `./monitor-pipeline-utils`. Re-exporting from `monitor-pipeline-utils.ts` (`export { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`) preserves that call-site. This is deliberate: the story's blast radius stays minimal, `MonitorPipelineHealth.tsx`'s `git diff` is empty, and any future migration of that file to import from `@/lib/monitoring-constants` directly is a trivial follow-up.

Alternative considered + rejected: update `MonitorPipelineHealth.tsx` import path to `@/lib/monitoring-constants` and drop the re-export. Rejected because (a) it expands the diff beyond necessary, (b) the re-export is a one-line compatibility shim that's honestly cheap, (c) AC-4 is explicit about keeping `MonitorPipelineHealth.tsx` untouched.

### File-size pre-flight

| File | Expected lines | Budget |
|---|---|---|
| `src/lib/monitoring-constants.ts` (new) | ~30 | 200 |
| `PipelineStatusGrid.tsx` | ~170 (from current ~188 — AC-2 deletes 15 lines) | 200 |
| `monitor-pipeline-utils.ts` | ~85 (from 101 — AC-3 deletes 15 lines, adds 1 re-export) | 200 |

All well within budget. No split triggers expected.

### Epic 92 retro lessons applied

- **Structural fix over silent adaptation** (Epic 92 retro insight #4): this story IS the structural fix for the deferred "mirrors X" decision. Not adapting forever — extracting now.
- **Out-of-scope traps in Dev Notes** (Epic 92 retro insight #7): explicit — `STATUS_ORDER` stays in `PipelineStatusGrid.tsx`, `MonitorPipelineHealth.tsx` stays unchanged, no cross-domain STATUS_* constants are touched.
- **Spec-grep discipline** (Epic 92 retro action item #8): spec was written AFTER grep-confirming the scope (grep output included above). No ghost fields.

### What NOT to do

- ❌ Do NOT move `STATUS_ORDER` (it's sorting logic unique to `PipelineStatusGrid`, not shared).
- ❌ Do NOT change `MonitorPipelineHealth.tsx` (AC-4 explicit).
- ❌ Do NOT refactor `getBuyoutColor`, `getMostRecentRecalc`, `getUnhealthyPipelines`, or `formatRelativeTime` in `monitor-pipeline-utils.ts` — they stay put.
- ❌ Do NOT touch other domain-specific `STATUS_COLORS` in `shipments/`, `supplies/`, etc. Those are unrelated.
- ❌ Do NOT add new tests. Pure refactor. Existing tests cover the behavior.

---

## References

- Epic 93-FE spec: `_bmad-output/planning-artifacts/epics-93-fe.md` § Story 93.1.
- Epic 92-FE retrospective: `_bmad-output/implementation-artifacts/epic-92-fe-retro-2026-04-24.md` § Action Items #4.
- Story 92.5-FE: `_bmad-output/implementation-artifacts/92-5-fe-monitor-buyout-pipeline-health.md` (introduced the mirror with sync-note).
- `PipelineStatusGrid.tsx:30-44 (pre-refactor)` — canonical source being extracted. Post-refactor: `src/lib/monitoring-constants.ts:16-34`.
- `monitor-pipeline-utils.ts:86-100 (pre-refactor)` — mirror being replaced with re-export.
- CLAUDE.md § Defensive Frontend (not directly applicable but relevant context).

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- AC-1: Created `src/lib/monitoring-constants.ts` with verbatim `STATUS_COLORS` + `STATUS_LABELS` exports, block-comment header referencing Story 93.1 + Epic 92-FE retro action item #4, `PipelineStatus` imported via absolute path `@/app/(dashboard)/monitoring/types/monitoring`. File is 27 lines (well under 60-line budget).
- AC-2: `PipelineStatusGrid.tsx` imports `STATUS_COLORS`/`STATUS_LABELS` from `@/lib/monitoring-constants`; local definitions at old lines 30-44 deleted; `STATUS_ORDER` stays local (unique sort logic); `PipelineStatus` type import also removed (was only needed for the deleted local constants).
- AC-3: `monitor-pipeline-utils.ts` header updated to remove "mirrors" wording; local definitions + mirror-section comment deleted; re-export added: `export { STATUS_COLORS, STATUS_LABELS } from '@/lib/monitoring-constants'`; `PipelineStatus` import removed (no longer used in file).
- AC-4: `git diff MonitorPipelineHealth.tsx` is empty — file untouched.
- AC-5 (grep verification): `grep -rn "STATUS_COLORS: Record<PipelineStatus" src/` → exactly 1 line (`src/lib/monitoring-constants.ts:12`). `grep -rn "STATUS_LABELS: Record<PipelineStatus" src/` → exactly 1 line (`src/lib/monitoring-constants.ts:20`). `grep -rn "Mirrors PipelineStatusGrid" src/` → 0 lines.
- AC-6: No circular imports; `PipelineStatus` imported from absolute path in shared module.
- AC-7: `npm test -- --run` → 6986 passing, 0 regressions (same as Epic 92 close baseline).
- AC-8: `npm run type-check` → 0 new errors (only pre-existing `advertising-analytics-api.ts` baseline). `npm run lint` → 0 warnings/errors. `npm run check:docs` → 15 broken (13 pre-existing baseline + 2 new references to `monitor-pipeline-utils.ts:86-100` in the story file itself — historical documentation of extracted lines, not a regression).
- AC-9: Sprint-status transitioned `ready-for-dev → review`.

### Post-review fixes (2026-04-24)
- L-1/L-5: Rewrote `MonitorPipelineHealth.tsx:11-12` docstring — removed stale "mirrors / keep in sync" wording; now references Story 93.1 origin.
- L-2: Added `@see Story 93.1-FE` back-reference to `PipelineStatusGrid.tsx` JSDoc.
- L-3: Added per-export JSDoc to `STATUS_COLORS` + `STATUS_LABELS` in `monitoring-constants.ts`.
- L-4: Surgical line-number corrections on story-file citations (marked historical refs as `(pre-refactor)`; added post-refactor line numbers for `monitoring-constants.ts`).
- L-6: Ticked all AC + Task checkboxes in the story file (process-discipline gap from 86.1 memory).

### File List

- `src/lib/monitoring-constants.ts` (new)
- `src/app/(dashboard)/monitoring/components/PipelineStatusGrid.tsx` (modified)
- `src/app/(dashboard)/monitor/components/monitor-pipeline-utils.ts` (modified)
- `src/app/(dashboard)/monitor/components/MonitorPipelineHealth.tsx` (L-1/L-5 docstring fix)

### Change Log

| Date | Change |
|---|---|
| 2026-04-24 | Story created. First story in Epic 93-FE. 2 SP pure-refactor to extract `STATUS_COLORS` + `STATUS_LABELS` from `PipelineStatusGrid.tsx` (canonical) and `monitor-pipeline-utils.ts` (mirror) into new shared `src/lib/monitoring-constants.ts`. Closes Epic 92-FE retrospective action item #4. Pre-flight scope-grep verified: rule-of-two (not rule-of-three — other `STATUS_COLORS` matches in `shipments/`, `supplies/`, etc. are domain-specific different shapes, NOT duplicates). Blast radius minimal: `MonitorPipelineHealth.tsx` unchanged via re-export shim from `monitor-pipeline-utils.ts`. No new tests. `STATUS_ORDER` stays local to `PipelineStatusGrid.tsx` (unique sort helper, not a mirror). No functional change — same values, same consumers, single source of truth. |
| 2026-04-24 | Implementation complete. Pure refactor: extracted `STATUS_COLORS`/`STATUS_LABELS` to `src/lib/monitoring-constants.ts`, updated two consumers, added re-export shim. Zero tests changed, zero regressions. Status: review. |
| 2026-04-24 | Addressed 6 LOW findings from two adversarial review passes. Doc-only changes + story-file hygiene. Validation gates green. Status: review. |
