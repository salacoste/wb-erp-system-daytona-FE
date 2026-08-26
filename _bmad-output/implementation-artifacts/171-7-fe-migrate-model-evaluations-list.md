# Story 171.7-FE: Migrate Model Evaluations List

Status: done — PR #266 merged (`37ae5b4c`); proportionate 1-pass fresh review APPROVE-WITH-NOTES (0 real defects); e2e on branch 13/1↓/0 via npm wrapper; light+dark visual verified; cleanup 0/0/0

## Story

As a model analyst, I want `/analytics/models/[id]/evaluations` to identify the model and list evaluation runs with comparable metrics and destinations, so that I can select the correct evaluation evidence.

Plan: `.omx/plans/171.7-migrate-model-evaluations-list.md` (authoritative — branch `cdx/epic-171-story-7-model-evaluations-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-7-model-evaluations-shadcn`). **MINOR-GAP story** (owned surface born clean: 0 palette / 0 hex / 0 light-only; 4 compliance sites — cross-story className-dependency, missing caption, missing tabular-nums, route-level padding).

## Acceptance Criteria

Per plan (product AC 1-3 + plan/delivery AC 4-9). Route self-identifies as Story 110.2/112.4 — provenance comments updated on migration.

## Tasks / Subtasks

- [x] Task 0: hooks read-only (`useAiModels`, `useAiEvaluations` — untouched); shared registry `STATUS_BADGE_CONFIG` read-only consumed (label only).
- [x] Task 1: Behavior lock — baseline **55 tests / 3 files**. LOCK: state-precedence chain (loading → list-error → model-not-found → evaluations-error → happy); 11 columns incl. forecast columns; MAPE sort nulls-last both directions; row click/Enter/Space → `{id}/evaluations/sku-accuracy?nmId=`; formatMapeDisplay null→'—'; cabinetMape/evaluatedAt null→'—'; CSV export disabled-on-empty; labels «Активна» etc. from STATUS_BADGE_CONFIG.
- [x] Task 2 (gaps):
  1. **className-detach** (§3.2 handoff frozen contract): EvaluationsHeaderCard no longer reads `STATUS_BADGE_CONFIG[model.status].className` — overlay via route-local `EVALUATION_STATUS_BADGE_CLASS: Record<ModelStatus, string>` (hue-preserving byte-identical to 171.6 tokens, all 7 statuses; reviewer verified 1:1). Label stays sourced from the registry (single label source). Field removal remains owned by 171.9 (ModelPerformanceDetail.tsx:143 still reads it).
  2. `TableCaption` naming the model — optional `captionText` prop, spec-order above header (169.7 canon), passed by EvaluationsList as «Оценки точности модели — {type} v{version}» (RTC: caption names the model; visually bottom via ui caption-bottom).
  3. `tabular-nums` ×7 numeric cells (Горизонт/Прогноз ед./Факт ед./Прогноз ₽/Факт ₽/MAPE ед./MAPE ₽); nmId cell exempt (opaque ID, 171.5 lesson).
  4. `EvaluationsPageShell` `p-6` dropped — (dashboard) layout provides `p-4 lg:p-6` (double-padding fix, 171.6 canon).
  5. Provenance «Migrated Story 171.7-FE» ×5 files.
- [x] Task 3: micro-guard `__tests__/evaluations-list-presentation-source-contracts.test.ts` — catalog pinned **5 files** (sku-accuracy/** + __tests__ excluded, load-bearing: the sibling dir nests under evaluations/), no-palette/no-hex (171.6 canon regexes, self-tested), status-token pin, **detach pin** (positive: local-map lookup + label-only registry read; negative: any `STATUS_BADGE_CONFIG[...].className` re-coupling), caption pin (both producer+consumer), tabular pin, padding pin.
- [x] Task 4: Validation + 1 fresh review (proportionate: ~70-line production diff) + review fixes + PR #266 + cleanup 0/0/0.

## Dev Notes

- Owned: `[id]/evaluations/**` EXCLUDING `sku-accuracy/**` (page.tsx + 4 components/helpers + 3 test files incl. new guard). Forbidden-verified: no shared file touched; `model-list-helpers.ts` untouched (registry shape unchanged → 171.6 guard unaffected, reviewer re-ran whole models tree 227/12 green).
- Baselines: targeted 55/3; full floor **19 253/0** → **19 263/0** (+10 exact = 8 guard + 2 caption tests).

### References

- [Source: plan `.omx/plans/171.7-migrate-model-evaluations-list.md`]
- Compliance verdict MINOR-GAP (4 sites + caption/tabular/provenance; 0 palette/hex/light-only pre-change)
- Cross-story contract: handoff §3.2 (className field ownership chain 171.6→171.7/171.9)

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct micro cycle (`9666893c`, single commit — no in-flight fixups). Review: 1× code-reviewer (opus fresh) — APPROVE-WITH-NOTES (0 real defects; reviewer independently ran the whole models tree 227/12 + mutation-checked pins).

### Post-1st-pass-review fixes (2026-08-26)

- r-LOW-1 APPLIED: detach negative pin hardened — bans ANY `STATUS_BADGE_CONFIG[...].className` re-coupling, not just the old local-variable spelling.
- r-NIT-1 APPLIED: empty-string `captionText` renders nothing (truthy guard instead of undefined-check).
- r-NIT-2 APPLIED: caption test pins the semantic (`getByRole('caption')`), not just text.
- r-LOW-2 DISPOSITION keep: positive source-text pins are comment-satisfiable — inherent to the 171.6 guard canon; changing it here would fork the canon (catalog pin + component tests mitigate).

### Debug Log References

### Completion Notes List

- Detach has zero visual delta by construction (byte-identical token strings; Record<ModelStatus,string> = compile-time exhaustiveness over all 7 statuses).
- Visual on branch (playwright-cli, live login): light — badge «Активна» green/readable, layout intact, columns aligned; dark — badge readable on dark, no light-only defects; a11y tree: `table "Оценки точности модели — Прогноз выручки (день) v3"` + caption node; element-screenshot confirms caption visual render (full-page vision pass missed the small muted line — element-level check is the reliable probe).
- E2E attestation precision: exact command `npm run test:e2e -- e2e/analytics/ai-models.spec.ts --reporter=line` in the worktree; wrapper's preflight expanded to 14 tests = 13 passed / 1 skipped / 0 failed (incl. both evaluations-page tests).
- Process note: killing the worktree dev server left truncated `.next/dev/types/*` → `tsc` TS1128/TS1109 on generated files; `rm -rf .next/dev` restores (artifact issue, not source regression; BUILD and targeted tests were green throughout).
- Login-creds drift (P2/P8 known): live BE + `.env.e2e` = `Russia23!`; fresh-profile first-login redirect pattern did not recur this session (second-login already persisted).

### Gaps

- Between-breakpoint / 200%-zoom / reduced-motion manual passes not captured as screenshots (unit + e2e + light/dark full-page cover the presentation delta; micro-cycle proportionality per §6.2) — optional follow-up.
- Registry ownership comment at `model-list-helpers.ts` still names EvaluationsHeaderCard as a `.className` consumer — file is out of 171.7's allowed surface; 171.9 removes the field + comment + guard pin together.

### File List

Diff bc7c8484..9666893c = **7 files** (6 M + 1 A guard test); +172/−11. Exact: `git diff --name-status bc7c8484..9666893c`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story planned (MINOR-GAP recon; owned surface born clean, 4 sites). Plan referenced as authoritative. |
| 2026-08-26 | Micro cycle: single commit 9666893c; 1×opus APPROVE-WITH-NOTES (0 defects, 3 findings applied, 1 dispositioned). Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #266 (`9666893c`, merge `37ae5b4c`); targeted 65/4 (+10 exact), full 19 263/0 (floor 19 253), models tree 227/12, lint 0/0, tsc 0, max-lines OK, build (webpack) OK, e2e-on-branch 13/1↓/0, locale 4==base, docs 97==base; light+dark visual; cleanup 0/0/0. Epic 171: 7/9. Status: review → done. **Lessons:** (1) Убитый pkill'ом dev оставляет битые .next/dev/types → tsc TS1128; rm -rf .next/dev лечит. (2) playwright-cli open сбрасывает логин; навигация после логина — evaluate location.href. (3) Detach = label из shared-конфига + локальная Record<ModelStatus,string>: exhaustiveness на компиляции. |
| 2026-08-26 | APPEND-ONLY disclosure (Story 171.8, PR #268): this story's guard carried a latent anchor-safety defect — its catalog enumeration filtered joined ABSOLUTE paths with a sku-accuracy substring, which matched the plan-pinned 171.8 worktree name and emptied the catalog (full-suite failure there; passed in this story's own worktree by name luck). Fixed anchor-safe (relative-first filters) inside PR #268 as an orchestrator-approved cross-surface exception; necessity proven by reviewer simulation. Status stays done. |
