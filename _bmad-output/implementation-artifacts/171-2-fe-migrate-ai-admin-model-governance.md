# Story 171.2-FE: Migrate AI Admin Model Governance

Status: review — implementation + r1/r2 fixes on branch; PR/merge/cleanup pending

## Story

As an authorized AI administrator, I want `/analytics/ai-admin/models` to list governed model versions and expose rollback status safely, so that I can inspect model lifecycle and perform an authorized rollback with exact scope.

Plan: `.omx/plans/171.2-migrate-ai-admin-model-governance.md` (authoritative — branch `cdx/epic-171-story-2-model-governance-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-2-models-shadcn`). **MINOR-GAP story** (compliance verdict): palette clean from birth (`#185` = ticket-ref prose); 7 minor contract gaps.

## Acceptance Criteria

1. **Given** authorized model-version data, **when** migrated, **then** version/model identity, status, dates/metrics, sort/page, rollback eligibility/confirmation, request, invalidation, and final outcome preserve current behavior.
2. **Given** empty list, stale/partial metadata, unknown status, restricted access, rollback unavailable, pending, success, failure, or conflict, **when** rendered, **then** destructive scope, server truth, and bounded recovery are explicit without offering duplicate rollback.
3. **Given** keyboard/touch or narrow width, **when** a row or rollback dialog is operated, **then** model/version identity, status, action, focus, confirmation consequence, and return context remain usable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — born token-clean; `#185` = ticket-ref (BD-33 MAPE sentinel doc); no boundary lies (STATUS_LABELS/VARIANTS Record-lookup with ?? fallback = VALID-set semantics already).
- [x] Task 1: Behavior lock — baseline **50 tests / 4 files**. LOCK: identity cols (String(model.id) + v{version}); interactive client sort (SortableHead aria-sort ×3 + toggle + default desc — PRESERVE, tested); status Badge text+variant (STATUS_LABELS ?? raw — known-set fallback); two distinct empties (global «Модели не найдены.» vs filtered-empty + reset btn F-8); rollback eligibility 5-status block (F-10 disabled + named aria); AlertDialog primitives (F-7 description purity); 403 dialog branch + non-Owner gate + hydration skeleton (F-11); null mape/trainedAt → «—»; #185 MAPE-0 sentinel → «—» not 0; invalidation documented prefix-over; consequence wording existing.
- [ ] Task 2 (the 7 gaps — compliance-enumerated):
  1. `<TableCaption>` naming governed versions («Версии моделей под управлением» — match page h1 noun; static)
  2. tabular-nums on mape/date columns (version/id cols stay as-is — mono if id is opaque)
  3. **DISPOSITION-NOT-FIX**: URL-pagination = feature add (current = useState in-session, satisfies epic RTC "preserves state" within session; adding URL sync = behavior change like severity-render 171.1) — document
  4. Scroll-region semantics (tabIndex=0 + aria-label on the overflow wrapper)
  5. **Focus return to invoking row** (epic AX literal «focus returns to the invoking row»): capture trigger row (data-attribute or ref) on dialog open → on close return focus to that row's rollback button — Radix AlertDialog default returns to trigger BUT conditional unmount (`rollbackTarget` state) breaks it; fix = keep the trigger mounted (hide dialog not unmount) OR explicit focus management on openChange(false)
  6. Missing states: **409 conflict branch** in RollbackDialog onError («Модель уже откатана. Обновите список.» — 171.1 pattern, input/reason retained? read the form — reason gate exists; retain) + 3 tests (unknown-status render fallback, pending disabled+spinner, 409 message)
  7. AC-2 «server truth» phrasing: append to confirm description («Актуальный статус определяется на сервере после отката.» — honest non-promise)
- [x] Task 3: Guards — light (born-clean pin): no-palette/no-hex over 6 production files (#185 prose-exempt self-test!); caption/tabular/scroll-region pins; focus-return test (real focus assertion); 409 + unknown-status + pending tests.
- [x] Task 4: Validation + 2-pass fresh review + PR + cleanup — route **58/4** (baseline 50/4; +8 growth); full **19 226/0** (floor 19 217, +8 exact); lint 0/0; tsc 0; max-lines OK; build 0. e2e N/A (no models spec). Reviews: r1 opus APPROVE (1 MEDIUM tautological border-pin + 3 LOW → F1 outline-distinctive + F2 version-tabular + F3 fresh-node-rAF applied `6cb03754`); r2 opus **APPROVE — merge gate passes** (3 LOW: L1 v-split revert + L2 caption spec-order applied `9e2b879d`; L3 focus-no-op-if-row-gone → Gaps acceptable degradation). CE: siblings + /analytics/models/** + hooks zero-diff (r2 exit-1 grep verified).

## Dev Notes

- Owned: models/** (11 files, 1 414 lines). READ-ONLY: siblings (anomalies!, preferences), `/analytics/models/**` (FORBIDDEN — different tree), hooks.
- Baselines: 50/4 owned; full floor **19 217/0**. Canon: 171.1 patterns (409/conflict-distinct, caption, unknown-muted not needed — known-set exists); focus-return = epic literal; scroll-region 170.x.

### References

- [Source: epics-166-174 §Story 171.2 + §C1-C11]
- [Source: `.omx/plans/171.2-migrate-ai-admin-model-governance.md`]
- Compliance verdict MINOR-GAP (7 items)

## Dev Agent Record

### Agent Model Used

- Implementation: executor (sonnet) (`ff3c5e17`) + orchestrator-applied r1/r2 (`6cb03754`, `9e2b879d`). Reviews: 2× code-reviewer (opus fresh) — APPROVE / APPROVE merge-gate.

### Post-1st-pass-review fixes (2026-08-26)

F1 tautological `border` badge-pin → outline-DISTINCTIVE (text-foreground + no-bg-fill — r2-verified substring-immune vs -foreground variants); F2 version-cell tabular-nums; F3 focus re-query INSIDE rAF (stale-node race — background refetch unmount+remount).

### Post-2nd-pass-review fixes (2026-08-26)

L1 revert unnecessary {'v'}-split (kept className); L2 TableCaption moved ABOVE TableHeader (HTML spec first-child; was after TableBody). L3 → Gaps.

### Debug Log References

### Completion Notes List

- MINOR-GAP cycle (born token-clean): TableCaption «Версии моделей под управлением» (spec-order above header per r2); tabular-nums mape/trainedAt/version + id mono; scroll-region via ui Table scrollContainer* props (duplicate overflow-x-auto removed — primitive owns scroll, house precedent); **focus-return-to-row** (epic AX literal): explicit management — no AlertDialogTrigger exists (callback-opened), Radix default broken by conditional unmount → selector re-query inside rAF; 409 «Модель уже откатана» + reason retention (171.1 pattern); unknown-status raw+outline (known-set STATUS_LABELS ?? raw — AP#4 bridge test); pending spinner pin; server-truth line (F-7 static prose preserved).
- DISPOSITION: URL-pagination = feature add (in-session useState satisfies epic RTC within session; comment in List :25-28).
- Focus-return approach disclosure: keep-mounted option rejected — no trigger ref exists regardless; explicit focus = minimal correct.

### Gaps

- Focus no-ops to body if the invoking row is gone (refetch drop between open/close) — acceptable degradation (r2-L3); table-region fallback = house-pattern candidate.
- Wrapper rounded-lg corner cosmetic (r1-F4 — house precedent, non-blocking).
- No models e2e spec (174.4 candidate).

### File List

Diff cd9aa949..HEAD = **6 files** (M Table, M Content, M List, M RollbackDialog, M 2 test files); +~140/−10. Exact: `git diff --name-status cd9aa949..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from compliance-check recon (born token-clean; 7 gaps incl. epic-literal focus-return; URL-pagination dispositioned preserve). Plan referenced as authoritative. |
| 2026-08-26 | r1 fixes (distinctive pin, version tabular, fresh-node focus) + r2 fixes (v-split revert, caption spec-order). Status: ready-for-dev → review. |
