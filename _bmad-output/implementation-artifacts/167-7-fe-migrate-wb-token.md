# Story 167.7 — Migrate WB Token `/wb-token`

- **Status:** review (awaiting orchestrator commit/PR)
- **Branch / worktree:** `cdx/epic-167-story-7-wb-token` @ `/private/tmp/wb-fe-167-7-migrate-wb-token`
- **Base SHA:** `63ebddb7` (FE main with 167.5 + 167.6 + 167.9 merged)
- **Acceptance criterion:** Given valid, malformed, rejected, permission, network, or expired-session cases when migrated then validation/storage/transition semantics remain unchanged, input is handled safely, duplicates are prevented, no token leaks AND the shared guard is consumed without modification.

## Behavior-Lock Inventory (pre-flight)

Read-only sources: `src/lib/api.ts` (`updateWbToken`), `src/lib/api-wb-token-errors.ts`, `src/stores/authStore`, `src/hooks/useOnboardingGuard.ts`, `src/app/providers.tsx` (all untouched).

1. **Guard:** page calls `useOnboardingGuard()` — redirects already-onboarded users (cabinet_ids ≥ 1) to dashboard. Consumed as-is, zero modification.
2. **Validation (zod, onBlur):** empty → «WB API токен обязателен»; <50 chars → «слишком коротким»; non-3-part → «Формат токена кажется неверным…».
3. **Storage:** `updateWbToken(cabinetId, 'wb_api_token', token)` → `PUT /v1/cabinets/{id}/keys/wb_api_token` with `{ token }` body; requires store token + cabinetId.
4. **Duplicate lock:** `mutation.isPending` disables CTA («Проверка токена...», aria-busy) and the input; role gate (`canManageOperationalData`) disables for non-Owner/Manager. NOTE (pre-existing, observed): app-wide `mutations: { retry: 1 }` (providers.tsx) re-issues a FAILED PUT exactly once — framework-level retry, not a user-triggered duplicate; the submit lock still prevents concurrent user duplicates (pinned in unit test).
5. **Transition:** success → toast «WB API токен успешно сохранен!» + `form.reset()` (masked input cleared) + `router.push(ROUTES.ONBOARDING.PROCESSING)`.
6. **Error mapping (`getErrorMessage`):** invalid/expired/validation → «Токен недействителен» + «Получить новый токен» link; rate → «Превышен лимит запросов»; network → «Ошибка сети»; permission/403 → «Нет доступа»; cabinet/not-found → «Кабинет не найден»; fallback echoes raw `error.message` (see gap below). Editing the input clears the server error.
7. **No-cabinet render gate:** `!cabinetId` → destructive panel «Кабинет не найден…», no form.
8. **Input safety:** `type="password"` masked input, `aria-required`, `aria-invalid` on validation or server error; no autocomplete token semantics; safe paste (plain onChange).
9. **Expired session:** no store token → mutation throws «User not authenticated» → fallback copy (English echo — pre-existing); 401 mid-submit → handleWbTokenUpdateError → «Unauthorized. Please log in again.» → fallback «Ошибка сохранения токена»; stays on route.

## Changes

| File | Change |
|---|---|
| `src/app/(onboarding)/wb-token/page.tsx` | `<main>` landmark + shared `PageHeader` composition + shadcn `Card`/`CardContent` replaces hand-rolled card div; Russian copy byte-identical; guard consumption unchanged. |
| `src/components/custom/WbTokenForm.tsx` | Presentation-only: `min-h-11` CTA touch target; visible `focus-visible` rings on both external WB links. Validation/storage/transition/copy untouched. |
| `src/components/custom/wb-token-form-helpers.test.ts` | NEW — schema semantics (4 cases) + full `getErrorMessage` branch mapping (7 cases). |
| `src/components/custom/WbTokenForm.test.tsx` | +6 behavior-lock tests (no-leak error, no-leak success+reset, duplicate-submit lock, 4-state error copy `.each`, edit-clears-error retry loop). |
| `src/app/(onboarding)/wb-token/__tests__/page.test.tsx` | +1 main-landmark / single-h1 test. |
| `e2e/onboarding.spec.ts` | + Story 167.7 browser-owned evidence block (3 tests, fail-closed `**/v1/cabinets/*/keys/*` interceptors, synthetic `.invalid` identity, no request-body inspection). |

**Forbidden files untouched:** `useOnboardingGuard.ts`, `lib/api*`, `authStore`, `role-permissions`, ui primitives, `providers.tsx`, other routes, backend. `UpdateWbTokenForm`/`WbTokenBanner`/`RequireWbToken` are dashboard-family consumers (used by `/dashboard`, `/analytics*`), NOT route-form-owned → out of scope, untouched.

## No-leak evidence

- Input is `type="password"` (pre-existing + pinned test).
- Unit: `document.body.textContent` must not contain the token after error AND after success (success also asserts `form.reset()` cleared the input); all `toast.error` payloads scanned.
- E2E: `page.textContent('body')` privacy scan in all 3 tests; NO request-body assertions anywhere in the block.
- Synthetic tokens only: JWT-shaped `.invalid` markers, synthetic cabinet `story-167-7-cabinet.invalid`, all `/v1/cabinets/*/keys/*` requests intercepted and fulfilled synthetically (non-PUT → 405 fail-closed).

## Test / E2E additions

Unit (36 passed across 3 files, incl. 11 pre-existing form + 4 pre-existing page):
1. no-leak on error (alert copy asserted; body + toast scanned).
2. no-leak on success + input reset before `/processing` push.
3. duplicate-submit lock: pending disables CTA+input; click + Enter during pending → exactly 1 `updateWbToken` call.
4. `.each` error copy: permission / network / cabinet-missing / expired-session titles; no navigation on error.
5. edit clears server error; retry succeeds and navigates.
6. helper schema: valid/empty/short/format messages byte-pinned; all 6 `getErrorMessage` branches + fallback echo.

E2E (Chromium, `npm run test:e2e -- e2e/onboarding.spec.ts --project=chromium --grep "WB-TOKEN-BROWSER"` → 3 passed):
- `[WB-TOKEN-BROWSER-01]` happy path: exactly ONE PUT, transition to `/processing`, reduced-motion emulated, privacy scan.
- `[WB-TOKEN-BROWSER-02]` WB-rejected 400: «Токен недействителен» + recovery link, stays on route, edit clears error, retry issues the retry-enabled request set; privacy scan.
- `[WB-TOKEN-BROWSER-03]` 403 permission («Нет доступа», no link, no navigation) then 401 expired-session («Ошибка сохранения токена» fallback, no navigation); privacy scan.

## Dev Agent Record

- Tokens/primitives: shared `PageHeader` + `Card`/`CardContent`, `min-h-11` CTA, `focus-visible` rings on external links; semantic muted/foreground classes already in use elsewhere in the tree.
- E2e ran against a worktree dev server temporarily occupying :3100 (preflight pins port 3100; `wb-repricer-frontend` pm2 app was stopped for the duration and restarted after — 200 verified on /login; backend pm2 apps untouched).
- Discovered pre-existing semantics (documented, NOT changed): app-wide `mutations.retry: 1` re-fires failed token PUTs once; `getErrorMessage` fallback echoes raw server `error.message` verbatim.

## Gaps

- `getErrorMessage` fallback can echo a server-provided string verbatim — if the backend ever embedded the token in an error message it would render. Pre-existing behavior; flagged for a future hardening story (owner: helpers/`lib/api` family).
- Real screen-reader audit beyond roles/labels not performed (consistent with 167.4/167.6 gap).
- Sonner toast duplicates the alert title (strict-mode locators scoped to `main` to disambiguate) — pre-existing.
