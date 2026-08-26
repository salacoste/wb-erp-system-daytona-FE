# Story 171.3-FE: Migrate AI Preferences

Status: done — PR #256 merged (`116263fc`); proportionate 1-pass fresh review APPROVE; e2e on branch 10/1↓/0; cleanup 0/0/0

## Story

As an authorized user, I want `/analytics/ai-admin/preferences` to explain and save AI preferences accessibly, so that I can configure allowed AI behavior and understand whether my changes were saved.

Plan: `.omx/plans/171.3-migrate-ai-preferences.md` (authoritative — branch `cdx/epic-171-story-3-ai-preferences-shadcn`, worktree `/private/tmp/wb-repricer-fe-171-3-prefs-shadcn`). **NO-OP verdict with 2 micro-fixes** (compliance check): all applicable form-ACs satisfied natively (Story 112.2 built); only error-association (AC-3 literal) + readable-width cosmetic remain.

## Acceptance Criteria

1. **Given** loaded preferences, **when** fields are changed and saved, **then** visible labels/help, values, validation, payload, duplicate-submit prevention, invalidation, dirty/reset behavior, and save confirmation preserve current semantics.
2. **Given** initial load, restricted access, invalid values, stale server values, recoverable save failure, conflict, success, or unsaved navigation, **when** handled, **then** safe input is retained and saved/current/pending state is unambiguous.
3. **Given** keyboard/touch, 200% zoom, or narrow width, **when** the form is completed or errors occur, **then** labels, descriptions, groups, error summary, focus destination, action order, and 44×44 primary controls remain usable.
4. Plan/delivery ACs: see plan.

## Tasks / Subtasks

- [x] Task 0: NONE — born token-clean (Story 112.2 native build); no boundary files.
- [x] Task 1: Behavior lock — baseline **26 tests / 2 files**. LOCK: state-precedence chain (hydration skeleton → role-denied → loading → error → happy); Switch label htmlFor + describedby-desc; immediate-mutation (no dirty/reset — N-A by design); duplicate-submit via isPending-disabled; pre-check errors silent (hydration race); 403 distinct vs generic; inline mutation Alert role=status polite (F-12) + toast; payload {aiEnabled}; narrow invalidation; e2e pins (h1 ×1 «Настройки AI»).
- [x] Task 2 (the 2 micro-fixes — compliance-enumerated):
  1. **Error ASSOCIATION (AC-3 literal «errors are associated»)**: mutation-error Alert gets `id={MUTATION_ERROR_ID}` and the Switch `aria-describedby` chains desc + error id when error present (build the id list conditionally: `${SWITCH_DESC_ID}${mutationErrorMessage ? ' ' + MUTATION_ERROR_ID : ''}`) — screen readers link the control to its error. + test (on error, switch describedby includes error id).
  2. **Readable width (RTC-form «constrained readable width»)**: `max-w-2xl` on the outer wrapper (matches form-card house widths; single-toggle page, low impact but literal AC).
  - DISPOSITION-NOT-FIX (documented): 409/conflict — immediate PATCH toggle, no optimistic-locking contract; error summary region — single-control form N/A (inline Alert IS the summary); unsaved-navigation guard — no unsaved state by design; Switch 44px — shadcn default hit-area + focus-visible ring (cosmetic).
- [x] Task 3: Micro-guards — born-clean pin (no-palette/no-hex 2 production files) + describedby-conditional test + max-w source pin.
- [x] Task 4: Validation + 1 fresh-context review (proportionate: 2-line production diff) + PR + cleanup — e2e ai-admin-preferences.spec.ts run on branch (weak-or disjunction noted, not fixed — run-only).

## Dev Notes

- Owned: preferences/** (4 files, 622 lines). READ-ONLY: siblings (anomalies, models), hooks, ui primitives.
- Baselines: 26/2 owned; full floor **19 226/0**. Canon: error-association = epic literal; max-w-2xl form width house pattern; 171.1/171.2 no-op/micro-gap discipline.

### References

- [Source: epics-166-174 §Story 171.3 + §C1-C11]
- [Source: `.omx/plans/171.3-migrate-ai-preferences.md`]
- Compliance verdict NO-OP + 2 micro-fixes

## Dev Agent Record

### Agent Model Used

- Implementation: orchestrator-direct (micro-fix cycle, ~8-line production diff — proportionate inline) (`a377ba35`) + review fixes (`1e1eaf22`). Review: 1× code-reviewer (opus fresh) — APPROVE.

### Post-1st-pass-review fixes (2026-08-26)

MEDIUM error-clear revert assertion added (chain un-forms when error clears — happy→error→happy round-trip now pinned); trailing newline.

### Debug Log References

### Completion Notes List

- NO-OP verdict + 2 micro-fixes: mutation-error Alert id joins Switch aria-describedby chain when present (AC-3 «errors are associated» literal; reverts to desc-only on clear — round-trip pinned); max-w-2xl form wrapper (RTC-form).
- Dispositions: 409 (no optimistic-lock contract); error-summary region (single-control N/A); unsaved-guard (no unsaved state by design); Switch 44px (shadcn default + focus-visible).
- Test-infra lessons en route: mocked-hook onError-injection does NOT update mock state (use mockReturnValue state pattern); act import needed for direct callback invocation (avoided by state pattern).

### Gaps

- e2e weak-or disjunction (toggle-label || denied || skeleton) — run-only, noted for 174.4.

### File List

Diff 08c2307f..HEAD = **2 files** (M AiPreferencesForm.tsx +8, M test +40). Exact: `git diff --name-status 08c2307f..HEAD`.

### Change Log

| Date | Change |
|---|---|
| 2026-08-26 | Story created from compliance-check recon (NO-OP verdict — native 112.2 build satisfies ACs; 2 micro-fixes: error-association AC-3 literal + max-w width). Plan referenced as authoritative. |
| 2026-08-26 | Micro-fix cycle + review fixes (revert-assert). Status: ready-for-dev → review. |
| 2026-08-26 | Implemented + merged: PR #256 (micro `a377ba35` + review `1e1eaf22` + story `7fe53f37`, merge `116263fc`); route 28/2, full 19 228/0 (+2 exact), e2e-on-branch 10/1↓/0; 1×opus APPROVE. Epic 171: 3/9. Status: review → done. **Lessons:** (1) Мокнутый хук: onError-инъекция НЕ обновляет мок-состояние — используй mockReturnValue state-паттерн. (2) NO-OP вердикт ≠ нулевой PR: буквальные AC-слова («errors are associated») — гэпы, даже когда всё остальное нативно. |
