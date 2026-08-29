# Story 173.4-FE: Migrate Expense Settings

Status: done — feature PR #338 merged (`505af85e`, merge `6a6e1bf8`); separate documentation closeout and exact feature/docs cleanup gate Story 173.5; Story-owned nine-file feature manifest; full floor **19,615/0/1,235**; focused Story **4 files / 98 tests**; Playwright **37 passed / 1 optional Manager setup skip**; two independent exact-head product reviews approved with zero findings; route-ledger rows intentionally remain `planned` until Story 174.5.

## Story

As an Owner, I want `/settings/expenses` to expose expense totals and CRUD state truthfully and accessibly so that I can understand the selected period and create, edit, or delete expenses without ambiguous zeroes, silent validation, duplicate mutations, or unstable focus.

Authoritative plan: `.omx/plans/173.4-migrate-expense-settings.md`.

## Prerequisites and Base

- Story base: `369853011a7309decfc0642f11a3ca84b3ccef80`.
- Story 173.1 settings-shell prerequisite and the separate ContextBar accessibility hotfix PR #331 are reachable from the base.
- Branch: `cdx/epic-173-story-4-settings-expenses`.
- Worktree: `/private/tmp/wb-repricer-fe-173-4-settings-expenses`.
- Shared settings shell, PageHeader, ContextBar, PageState, expense APIs, query hooks, types, routes, generic UI primitives, authentication, and authorization were reused without modification.

## Delivered Behavior

- The route composes PageHeader, ContextBar, and PageState while preserving the selected-month contract and one stable product hierarchy.
- Invalid or empty `YYYY-MM` values disable expense requests and render an explicit unavailable state. They never expose saved-count, successful empty-list, zero-summary, or `fresh` ContextBar semantics.
- Loading, error, empty, populated, and missing/unconfirmed summary or list data remain distinct; unknown data is not fabricated as a successful zero or empty result.
- Amount validation delegates to native input validity. Native-valid `.5` and `1e3` are accepted, while zero, negative, over-precision `0.001`, invalid months, and empty months are rejected before mutation with visible associated errors and focus.
- Create and update dialogs block duplicate submission and every controlled close path while pending. Success closes; failure retains the entered values and exposes inline recovery.
- Form cancel, Escape, create success, and edit success restore focus deterministically.
- The route-local responsive expense table gives the narrow scroll surface an accessible name and keyboard focus, exposes entity-specific edit/delete names, and preserves reading order.
- Invalid record months render `Период недоступен`. Non-finite amounts render `Сумма недоступна` in the cell, accessible action names, and destructive confirmation without leaking `NaN`, localized `не число`, or a fake zero.
- Delete uses a destructive AlertDialog. No request occurs before explicit confirmation; pending deletion cannot be dismissed; cancel and Escape return focus to the invoking action; success returns focus to the stable header add action.
- Reduced-motion, responsive/theme, reflow, focus, keyboard-scroll, and scoped axe evidence is deterministic and privacy-safe.

## Exact Feature Manifest

Feature commit `505af85ecb623d657996d40fc3d3727825a86aad` contains exactly:

- `e2e/expenses-page.spec.ts`
- `src/app/(dashboard)/settings/expenses/__tests__/page.test.tsx`
- `src/app/(dashboard)/settings/expenses/components/ExpenseFormDialog.tsx`
- `src/app/(dashboard)/settings/expenses/components/ExpenseSummaryCards.tsx`
- `src/app/(dashboard)/settings/expenses/components/ExpenseTable.tsx`
- `src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseFormDialog.test.tsx`
- `src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseSummaryCards.test.tsx`
- `src/app/(dashboard)/settings/expenses/components/__tests__/ExpenseTable.test.tsx`
- `src/app/(dashboard)/settings/expenses/page.tsx`

Diff: 9 files, +1,433/−326. No expense hook/API/type/route contract, settings shell/navigation/layout, shared product composition, generic UI primitive, dependency, lockfile, or backend file was included.

## Behavior Lock and Validation

Pinned runtime: Node `24.18.0`, npm `11.11.0`.

- Focused Story Vitest: 4 files, 98 passed.
- Full Vitest: 1,235 files, 19,615 passed, 0 failed, 0 skipped. The first sandboxed run failed only because `historical-spp-server-lifecycle.test.ts` could not bind `0.0.0.0`; the required unrestricted full rerun passed completely.
- Expense Playwright block: 37 passed and 1 optional Manager authentication-setup skip, 0 failed.
- Browser coverage includes light and dark themes at 320, 390, 768, 1024, 1280, and 1440 CSS pixels; deterministic CRUD success/failure/pending state; invalid route and record data; keyboard scrolling; focus containment/return; reduced motion; 200% reflow equivalent at 320×450; and WCAG A/AA/2.2 AA axe scans for the route, form Dialog, and AlertDialog.
- All `/v1/expenses**` requests were intercepted by the deterministic fixture; no expense mutation reached the real backend.
- Source and focused E2E ESLint, TypeScript, exact-manifest Prettier, `check:max-lines`, `check:next-params`, all three E2E static guards, `check:locale-percent`, production build, and `git diff --check` passed.
- The production build compiled successfully, passed TypeScript, generated 70/70 static pages, and included `/settings/expenses`.
- The known jsdom `Not implemented: navigation (except hash changes)` diagnostic from `ProcessingStatus.tsx` remained non-failing and outside Story scope.
- After E2E, `.env.e2e`, `.env.local`, `e2e/.auth/user.json`, `e2e/.auth/manager.json`, `test-results`, and `playwright-report` were absent. Credential or auth-state contents were never read or printed.

## Visual and Accessibility Evidence

- Repository security intentionally denies Playwright attachments, `page.screenshot(...)`, and retained raw trace/video/screenshot artifacts because authenticated browser data may be captured.
- The repository-approved equivalent uses exact named responsive tests, geometry and containment assertions, visible-focus/computed-focus-style checks, DOM reading-order assertions, keyboard-scroll proof, light/dark theme proof, and scoped axe proof.
- No retained screenshot, trace, video, or authenticated browser artifact is claimed.
- Real browser-UI zoom and real VoiceOver, NVDA, JAWS, and TalkBack evidence remain explicit Story 174.3 carry-outs.

## Independent Review Disposition

- Independent code/spec/security exact-head review: `APPROVE`, zero findings.
- Independent accessibility/focus/responsive exact-head review: `APPROVE`, zero unresolved issues.
- Both reviewers inspected the exact nine-file manifest at base `369853011a7309decfc0642f11a3ca84b3ccef80` and tracked-diff SHA-256 `89a5121fde62896a8d2c2c108126e808c8194af74fe0f72a3515f7c26c58de79`.
- The accessibility reviewer explicitly accepted the no-screenshot privacy disposition after verifying responsive, reflow, focus, theme, keyboard-scroll, and axe coverage.
- The code-review lane lacked temporary E2E secrets, but the leader independently completed the full focused Playwright run: 37 passed, 1 optional Manager setup skip.
- No unresolved product, accessibility, security, scope, privacy, or test blocker remains.

## Lifecycle

- Feature PR: #338, `https://github.com/salacoste/wb-erp-system-daytona-FE/pull/338`.
- Feature head: `505af85ecb623d657996d40fc3d3727825a86aad`.
- Feature merge: `6a6e1bf83da4b044f4fb38a70a16be26a907c353`.
- PR base/head, one-commit history, mergeability, exact head OID, and exact nine-file manifest were verified before normal merge.
- The product head and merge are ancestors of refreshed `main`; primary `main` equals `origin/main` at the product merge.
- The documentation closeout and exact product/docs branch and worktree cleanup will be completed through separate reviewed PR lifecycle steps; no self-merge or future cleanup claim is made here.
- No deploy, production operation, direct push to `main`, force-push, dependency change, credential output, route-ledger transition, ContextBar implementation change, or unrelated debt fix occurred.

## Lessons and Carry-Outs

- Invalid selector state must disable dependent queries and suppress every success-shaped count, zero, empty, and freshness signal.
- Financial unknowns require explicit unavailable semantics at visible, action-name, and confirmation surfaces; formatting must never normalize non-finite data to a plausible zero.
- Controlled overlays need a complete pending-dismissal and focus-ownership contract, including Escape, close controls, success, failure, cancel, and destructive completion.
- Privacy-safe browser evidence can remain strong when named geometry, focus, reading-order, keyboard, theme, reflow, and axe assertions replace prohibited retained captures.
- Real screen-reader and real browser-UI zoom evidence remain Story 174.3 carry-outs. SEC-DOC-1, route-ledger transitions, and unknown backfill-status coercion remain unchanged and outside this Story's scope.

## Change Log

| Date       | Change                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-29 | Story 173.4 implemented, validated, independently reviewed, and merged through feature PR #338; separate documentation closeout and exact cleanup gate Story 173.5. **Lessons:** (1) Fail closed on invalid financial scope. (2) Keep unavailable values explicit across every semantic surface. (3) Treat overlay dismissal and focus as one lifecycle contract. |
