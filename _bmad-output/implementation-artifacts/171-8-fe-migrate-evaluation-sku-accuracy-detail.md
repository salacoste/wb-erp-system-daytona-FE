# Story 171.8-FE: Migrate Evaluation SKU Accuracy Detail

Status: done — PR #268 merged (`4970c17a`); proportionate 1-pass fresh review APPROVE-WITH-NOTES (0 real defects); e2e on branch 13/1↓/0 via npm wrapper; light+dark visual both views (overview + drill-down); cleanup 0/0/0

## Story

As a model analyst, I want `/analytics/models/[id]/evaluations/sku-accuracy` to show SKU accuracy overview and row-level evidence for the selected evaluation, so that I can identify the SKUs driving model error and return without losing evaluation context.

Plan: `.omx/plans/171.8-migrate-evaluation-sku-accuracy-detail.md` (authoritative — branch `cdx/epic-171-story-8-model-sku-accuracy-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-8-model-sku-accuracy-shadcn`). **MINOR-GAP story** (owned surface born clean: 0 palette / 0 hex / 0 light-only; compliance sites — route paddings ×8, missing captions ×2 tables, missing tabular-nums ×9, provenance).

## Acceptance Criteria

Per plan (product AC 1-3 + plan/delivery AC 4-9). Route self-identifies as Story 110.3/163.5 — provenance comments updated on migration.

## Tasks / Subtasks

- [x] Task 0: hooks read-only (`useAiSkuAccuracy` ×2 call sites — untouched; page.tsx F-4 no-double-fetch contract preserved).
- [x] Task 1: Behavior lock — baseline **63 tests / 4 files**. LOCK: ?nmId= routing + Number.isSafeInteger NaN guards; F-2 loading/error gating before empty-state; F-5 undefined-vs-[] data-arrived semantics; F-6 focus-visible back-link; dual-view dispatch; sort state/aria-sort; row click/Enter/Space → `?nmId=`; AP#8 null→'—' on all ratio fields; naiveBaseline 0→"0" (163.5-FE AC2).
- [x] Task 2 (gaps):
  1. `TableCaption` ×2 — overview names the model («Точность по SKU — модель {String(modelId)}» — modelId is the only identity available without a new query, AP#10 opaque-ID form; reviewer verified the response type carries no model metadata); history names the SKU («История оценок — артикул {nmId}»). Spec-order above header (169.7 canon), visually bottom via ui caption-bottom.
  2. `tabular-nums` ×9 (overview: AI/Naive MAPE, AI accuracy %, Кол-во оценок; history: Прогноз/Базовый прогноз/Факт ед., AI/Naive MAPE); nmId exempt (opaque ID, 171.5 lesson).
  3. Route-level paddings removed ×8 (page breadcrumb `px-6 pt-6` + h1 `px-6`; Detail skeleton/error/empty/main `p-6` ×4; Overview skeleton/error/empty `p-6` ×3); stat-card `p-4` KEPT (component-internal, 171.7 idiom).
  4. Provenance «Migrated Story 171.8-FE» ×5 files.
- [x] Task 3: micro-guard `__tests__/sku-accuracy-presentation-source-contracts.test.ts` — catalog pinned 5 files, no-palette/no-hex (171.6 canon regexes, self-tested), caption pins (both tables), tabular pins, padding pins (page: p-6/px-6/pt-6; components: same axis + py-6 per review r-LOW).
- [x] Task 4: Validation + 1 fresh review + fixes + PR #268 + cleanup 0/0/0.
- [x] Task 5 (cross-surface exception, orchestrator-approved): anchor-safe fix to the **171.7 guard** — see Dev Agent Record.

## Dev Notes

- Owned: `sku-accuracy/**` only (page.tsx + 4 components/helpers + 4 test files + 1 new guard). Parent evaluations tree forbidden — touched ONLY at the documented exception below.
- Baselines: targeted 63/4; full floor **19 263/0** → **19 271/0** (+8 exact = 6 guard + 2 caption tests).

### References

- [Source: plan `.omx/plans/171.8-migrate-evaluation-sku-accuracy-detail.md`]
- Compliance verdict MINOR-GAP (8 padding sites + 2 captions + 9 tabular + provenance; 0 palette/hex/light-only pre-change)

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct micro cycle (`148108b4`, single commit). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES (0 real defects; reviewer independently ran models tree 235/235 + reproduced the guard-collision root cause by simulation).

### Post-1st-pass-review fixes (2026-08-26)

- r-LOW APPLIED: component padding-pin widened to the same axis variants as the page pin (py-6/px-6/pt-6 added to the ban).
- r-NIT ×3 DISPOSITION keep: (a) 171.7 leak-check still inspects absolute paths (theoretical deeper anchor class — noted for a future canon pass); (b) `String(modelId)` no-op coercion retained as explicit AP#10 marker; (c) 171.7 relative name-substring semantics preserved as-is (original semantics, not introduced here).

### In-cycle incident — guard × worktree-name collision (root-caused, not review-pass)

- First full-suite run failed 1 test: the **171.7 guard catalog came back empty** in this worktree. Root cause: its enumeration filtered JOINED ABSOLUTE paths with a sku-accuracy substring — and the plan-pinned 171.8 worktree path itself contains `sku-accuracy`, so every file matched the exclusion. The same guard passed in the 171.7 worktree (different name) — a repo test whose result depends on the checkout path is a latent defect.
- **Cross-surface exception (orchestrator-approved)**: fixed the 171.7 guard in this PR — filters now run on RELATIVE readdir entries before join (`f as string` cast first for the readdir overload union), and the leak-check matches the joined path segment `evaluations/sku-accuracy` instead of a bare substring. Predicates otherwise unchanged; catalog self-checks untouched; reviewer proved by simulation: old logic → 0 files (fail), new logic → exact 5 files; no regression for checkouts without the substring. Precedent: 171.5 guard-fix `18ca6873`. Disclosure row appended APPEND-ONLY to the 171.7 artifact Change Log.
- My own 171.8 guard was written anchor-safe from the start after the incident (same relative-first shape).
- Guard self-match trap fired live again (§8.7): provenance comments carrying the literal padding pair were caught by the new guard's own regex — reworded to prose (171.6 lesson confirmed reproducible).
- Concurrent-session race (§8.1): one tsc run caught a phantom `_tmp_` file created/deleted by a parallel session mid-scan (TS6053) — resolved by rerun, not a source issue.

### Debug Log References

### Completion Notes List

- /tmp logs: 171-8-baseline/targeted*/full*/models*/lint*/tsc*/build*/e2e/locale.
- E2E attestation precision: exact command `npm run test:e2e -- e2e/analytics/ai-models.spec.ts --reporter=line` in the worktree; wrapper's preflight expanded to 14 = 13 passed / 1 skipped / 0 failed.
- Visual on branch (playwright-cli, live login): overview a11y — h1 «Точность по SKU» + `table "Точность по SKU — модель c57da26b-…"` with caption node; drill-down a11y — `table "История оценок — артикул 147205694"` with caption; back-context `?nmId=` preserved on row click. Light full-page: stat cards intact, em-dash nulls, comfortable outer margins (padding removal verified non-destructive). Dark full-page: all text + breadcrumb readable, no light-only defects. (Vision pass misses the small muted caption line on full-page screenshots — a11y tree + role-pinned unit tests are the reliable probes; same as 171.7.)

### Gaps

- Between-breakpoint / 200%-zoom / reduced-motion manual passes not captured as screenshots (unit + e2e + light/dark full-page cover the presentation delta; micro-cycle proportionality per §6.2) — optional follow-up.
- 171.6 guard (models root) shares the same joined-path substring class (its `[id]` exclusion) — latent, non-firing for any known worktree name; carry-out noted for the guard canon owner (174.2 or next models-tree story).

### File List

Diff 16b609bb..148108b4 = **9 files** (8 M + 1 A guard test); +164/−25. Eight in `sku-accuracy/**`; one = documented cross-surface exception (`evaluations/components/__tests__/evaluations-list-presentation-source-contracts.test.ts`). Exact: `git diff --name-status 16b609bb..148108b4`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story planned (MINOR-GAP recon; owned surface born clean). Plan referenced as authoritative. |
| 2026-08-26 | Micro cycle: single commit 148108b4; in-cycle root-cause of the 171.7 guard × worktree-name collision (cross-surface exception, orchestrator-approved); guard self-match reworded; 1×opus APPROVE-WITH-NOTES (0 defects; r-LOW applied, 3 r-NIT dispositioned). Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #268 (`148108b4`, merge `4970c17a`); targeted 71/5 (+8 exact), full 19 271/0 (floor 19 263), models tree 235/13, evaluations tree 136, lint 0/0, tsc 0, max-lines OK, build (webpack) OK, e2e-on-branch 13/1↓/0, locale 4==base, docs 97==base; light+dark visual both views; cleanup 0/0/0. Epic 171: 8/9. Status: review → done. **Lessons:** (1) Гард substring-фильтр на абсолютном пути матчит имя worktree — фильтруй относительные сегменты до join. (2) Имя план-пинового worktree может нести подстроку роута сиблина — repo-тесты обязаны быть anchor-safe к пути checkout. (3) tsc-фантом от concurrent-сессии (_tmp_-файл удалён mid-scan) — это гонка, лечится перепрогоном. |
