# Story 171.6-FE: Migrate Model Registry and Training Entry

Status: done — PR #262 merged (`b867551f`); proportionate 1-pass fresh review APPROVE-WITH-NOTES; e2e on branch 13/1↓/0 via npm wrapper; cleanup 0/0/0

## Story

As an authorized model user, I want `/analytics/models` to list model identity/status and expose training entry safely, so that I can find a model, inspect its lifecycle, and start only a valid training operation.

Plan: `.omx/plans/171.6-migrate-model-registry-and-training-entry.md` (authoritative — branch `cdx/epic-171-story-6-model-registry-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-6-model-registry-shadcn`). **MINOR-GAP-plus story** (recon verdict — prev-session "full-cycle" classification counted the whole models tree incl. `[id]/**`; the 171.6 owned surface is root-only, ~9 palette sites).

## Acceptance Criteria

Per plan (C1-C11 apply; route self-identifies as Story 109.3/109.4 — provenance comments updated on migration).

## Tasks / Subtasks

- [x] Task 0: hooks read-only (`useAiModels` polling, `useTrainAiModel` mutation — untouched).
- [x] Task 1: Behavior lock — baseline **51 tests / 2 files**. LOCK: STATUS_BADGE_CONFIG labels+pulse (7 statuses incl. F-39 deprecated); formatMape null/0→'—' + 12,4 %; formatTrainedAt; 3 UI states (skeleton+h1 / destructive alert / empty+forecast link); 7 columns; row click/Enter/Space → `{id}/performance`; polling on/off derivation; TrainModelButton 8 states + stopPropagation + auto-clear 5s/8s.
- [x] Task 2 (gaps):
  1. `STATUS_BADGE_CONFIG` 7 raw palette classNames → semantic status tokens, hue-preserving (green→success, blue→information, amber→warning, red→error, gray→muted). **Field shape kept `{className,label,pulse}`** — `[id]/evaluations` + `[id]/performance` subroutes (Stories 171.7/171.9) read `.className`/`.label`; their visual upgrades for free, their cleanup owned by them.
  2. Pulse dot `bg-blue-500` → `bg-status-information` (171.4 StatusDot canon).
  3. `ModelsPageShell` `p-6` dropped — (dashboard) layout already provides `p-4 lg:p-6` (double-padding fix).
  4. `TableCaption` «Список ML-моделей вашего кабинета» spec-order above header (169.7/171.2 r2 canon; visually bottom via ui caption-bottom).
  5. `tabular-nums` ×3 (Версия/MAPE/Обучен).
  6. Provenance: 109.3/109.4 → + «Migrated Story 171.6-FE» ×4 files.
- [x] Task 3: micro-guards — catalog pinned 4 files (**`[id]` excluded** — first guard in epic whose route tree has unmigrated subroutes), no-palette/no-hex (171.5 canon regexes), status-token/pulse/caption/tabular/padding pins.
- [x] Task 4: Validation + 1 fresh review (proportionate: ~30-line production diff) + PR #262 + cleanup.

## Dev Notes

- Owned: models root only (page.tsx + 3 components + 2 test files + 1 guard; ~700 lines). READ-ONLY: useAiModels, useTrainAiModel, ui kit, formatters, `[id]/**` (forbidden surface).
- Baselines: 51/2; full floor **19 246/0** → **19 253/0** (+7 exact = guard). Canon: 171.2 STATUS_VARIANTS (admin sibling), 171.4 StatusDot tokens, 171.5 guard template + regexes.

### References

- [Source: plan `.omx/plans/171.6-migrate-model-registry-and-training-entry.md`]
- Compliance verdict MINOR-GAP-plus (9 sites: 7 palette + pulse dot + p-6; + caption/tabular/provenance)

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct micro cycle (`ce331c1b`, single commit — no in-flight fixups). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES.

### Post-1st-pass-review fixes (2026-08-26)

- Guard self-match: own doc-comments contained guarded literals (`bg-green-100 etc.`, `p-4 lg:p-6`) → reworded to prose before commit; guard verified firing on all regression classes by reviewer (mutation-tested).
- r-MINOR (attestation precision): e2e run cited per-command — `npm run test:e2e -- e2e/analytics/ai-models.spec.ts --reporter=line` in the worktree; the wrapper's preflight expanded it to 14 tests (8 ai-models + network-test smoke fixtures + orders smoke) = 13 passed/1 skipped/0 failed.
- r-NIT disposition: caption text duplicates subtitle+CardDescription verbatim — KEPT (169.7 static-caption canon satisfied; screen-reader double-read acceptable; differentiation is optional follow-up).

### Debug Log References

### Completion Notes List

- Palette→tokens hue-preserving; dark-mode now correct for all 7 statuses (old palette was light-only — same fix class as 171.4 cutout dark-FIX).
- Cross-surface discipline: STATUS_BADGE_CONFIG shape frozen for `[id]` consumers; ownership comment at model-list-helpers.ts (171.7/171.9 own the field's removal).
- E2E-visual on branch: 13/1↓/0; light-theme screenshot (playwright-cli, live login) — badge «Активна» green/readable, caption present in a11y tree (`table "Список ML-моделей вашего кабинета"` + caption node), layout intact.
- Turbopack panics on symlinked node_modules in /tmp worktree — `next build --webpack` is the canonical worktree build path (known limitation, not a regression).

### Gaps

- Manual dark-theme screenshot not captured (tokens theme-aware per globals.css dark block; unit+e2e cover rendering) — optional follow-up.
- Login-creds drift: frontend/CLAUDE.md says `<E2E_TEST_PASSWORD>`, live BE + `.env.e2e` use `<E2E_TEST_PASSWORD>` — docs-side fix out of scope.

### File List

Diff main..ce331c1b = **5 files** (4 M + 1 A guard test); +118/−16. Exact: `git diff --name-status 7e1ca7c0..ce331c1b`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from compliance-check recon (MINOR-GAP-plus; prev-session full-cycle miscount corrected — tree vs root surface). Plan referenced as authoritative. |
| 2026-08-26 | Micro cycle: single commit ce331c1b; guard self-match fix in-cycle; 1×opus APPROVE-WITH-NOTES. Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #262 (`ce331c1b`, merge `b867551f`); targeted 58/3, full 19 253/0 (+7 exact), lint 0/0, tsc 0, max-lines OK, build (webpack) OK, e2e-on-branch 13/1↓/0; cleanup 0/0/0. Epic 171: 6/9. Status: review → done. **Lessons:** (1) Литералы guarded-классов в собственных комментариях матчатся регексом гарда — пиши прозой, не литералом. (2) Turbopack падает на symlink node_modules в /tmp-worktree — build только `next build --webpack`. (3) Док-креды (<E2E_TEST_PASSWORD>) расходятся с живыми (<E2E_TEST_PASSWORD>) — source of truth `.env.e2e`. |
| 2026-09-02 | SEC-DOC-1 security lane (disclosure): парольные литералы в этом артефакте изъяты (заменены на <E2E_TEST_PASSWORD>); исторический нарратив не изменён |
