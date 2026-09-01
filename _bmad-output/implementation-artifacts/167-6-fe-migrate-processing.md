# Story 167.6 — Migrate Processing `/processing`

- **Status:** done — (was: "review (awaiting orchestrator commit/PR)"; synced by Story 174.5 on 2026-09-02; authoritative delivery/gate evidence: sprint-status.yaml row with PR/merge/review/vitest)
- **Branch / worktree:** `cdx/epic-167-story-6-processing` @ `/private/tmp/wb-fe-167-6-migrate-processing`
- **Base SHA:** `e33d2bea` (FE main with 167.5 + 167.9 merged)
- **Acceptance criterion:** Given running, failed, uncertain, or complete processing when the route is migrated then polling cadence, stage/progress, safe-leave, recovery, and next navigation remain correct without misleading zeros or duplicate requests AND completed onboarding state is retained.

## Behavior-Lock Inventory (pre-flight)

Read-only sources: `src/hooks/useProcessingStatus.ts`, `src/lib/processing-polling-strategy.ts` (both untouched).

1. Loading: skeleton + «Проверка статуса обработки...» — no fabricated percentages (no misleading zeros).
2. API error → destructive alert «Ошибка загрузки статуса» + full-page-reload CTA.
3. `!status` → «Статус не найден» alert.
4. `no_data` (MAX_EMPTY_POLLS terminal) → ProcessingNoData neutral copy («возможно, данные уже актуальны»), manual CTA to dashboard only, NO auto-redirect.
5. `completed` → success alert «Обработка завершена!» + `router.push(ROUTES.DASHBOARD)` after 2s; timer cleared on unmount/status change.
6. `failed` → destructive alert with `status.error` fallback copy + «Повторить попытку» (reload) + «Перейти на главную» (push).
7. Two progress tracks (productParsing/reportLoading) render only server-provided progress via `formatPercentageInt` + `getStatusText` per task status.
8. Polling cadence/query keys/reconcile exactly-once semantics owned by the read-only hook; presentation adds no requests.
9. Completed onboarding retention: route mutates no auth/onboarding state.

## Changes

| File | Change |
|---|---|
| `src/app/(onboarding)/processing/page.tsx` | `<main>` landmark + shared `PageHeader` composition (mirrors 167.5 /cabinet); Russian copy identical. |
| `src/components/custom/ProcessingStatus.tsx` | Semantic `status-success` tokens replace hardcoded green (`text-green-600`/`bg-green-50`); shared `Skeleton` primitive with `motion-reduce:animate-none`; `role="status"`/`aria-busy` on loading; `aria-label` on both `Progress` bars; `min-h-11` touch targets; failed-CTA row `flex-wrap`. Data flow identical (same hook, props, copy, timings). |
| `src/components/custom/processing-status/StatusHelpers.tsx` | `text-green-600` → `text-status-success`. |
| `src/components/custom/ProcessingNoData.tsx` | `min-h-11` CTA touch target; copy untouched. |
| `src/components/custom/ProcessingStatus.test.tsx` | +4 behavior-lock tests (see below). |
| `src/app/(onboarding)/processing/__tests__/page.test.tsx` | +1 landmark/single-h1 test. |
| `e2e/onboarding.spec.ts` | + Story 167.6 browser-owned evidence block (2 tests, fail-closed `**/v1/imports/historical**` interceptors, synthetic `.invalid` identity). |

**Forbidden files untouched:** `useProcessingStatus.ts`, `processing-polling-strategy.ts`, primitives, other routes, backend.

## Test additions (component)

1. `progressbar` semantics: 2 bars, `aria-valuenow` 45/30 from server, accessible names.
2. Loading state shows NO percentage and NO progressbar (no misleading zeros).
3. Failed state: fallback copy + retry button + «Перейти на главную» pushes `/dashboard`.
4. Completed state redirects exactly once across re-renders (`mockPush` called 1×).

## E2E evidence (Chromium, `npm run test:e2e -- e2e/onboarding.spec.ts --grep "PROCESSING-BROWSER"` → 2 passed)

- `[PROCESSING-BROWSER-01]` running(40 %, `aria-valuenow=40`) → completed alert → exactly one `/dashboard` navigation; `maxConcurrentRequests ≤ 1` and `listAttempts ≥ 3` prove serial polling with no duplicate/overlapping requests. Reduced-motion emulated.
- `[PROCESSING-BROWSER-02]` failed batch: honest 25 % (not zeroed), «Ошибка обработки», both recovery CTAs, reconcile POST exactly once, polling stops after terminal status (list attempts settle over 7s).

## Dev Agent Record

- Tokens/primitives used: `text-status-success`, `border-status-success/50`, `bg-status-success/10` (Tailwind v4 `@theme` `--color-status-success`); shared `Skeleton`, `Progress`, `Card`, `Alert`, `Button`; `PageHeader` composition.
- E2e ran against a worktree dev server temporarily occupying :3100 (preflight pins port 3100); the main-tree dev server was restored immediately after (200 verified). No real API surface touched by story tests (all `/v1/imports/historical**` fail-closed/synthetic).
- Full gate output recorded below by orchestrator run.

## Lessons

_(placeholder — filled at review)_

## Gaps

- Screen-reader live-region behavior beyond `role="status"`/progressbar labels not audited with a real SR (consistent with 167.4 gap).
- no_data empty-poll terminal state covered at component level; not duplicated in browser evidence (bounded scope).
