# D-2 (PB-3) — Реактивный 401-refresh: interceptor (single-flight, replay-once) + nonce-safe пративная ветка

**Status**: done (2026-09-03, хвост сессии-2; PR #403, merged)
**Branch**: `debt/d2-pb3-reactive-refresh` (worktree `/private/tmp/d2-pb3-reactive-refresh`, base main `70fa2e56`)
**Owner-track**: P1 product defect; owner-«ок» на re-scope 2026-09-03; контракт [`docs/request-backend/230-...md`](../../docs/request-backend/230-auth-refresh-endpoint-missing.md) (ANEX + ФИНАЛЬНАЯ live-верификация).

## Дефект

Нет реактивного 401-refresh: протухший/отозванный токен → ошибка пользователю вместо тихого refresh+replay; пративная ветка `useAuth` вызывала store-`login()` (минт новой sessionNonce → ломала D-1 settlement in-flight creates).

## Реализация (executor opus, tests-first RED 7 → GREEN)

- **`src/lib/api-client-refresh.ts`** (NEW): `getFreshToken(failedAuthHeader?)` — single-flight; **каскад-гейт** (wire-токен ≠ store → `inflightRefresh ?? resolve(true)` — страгглер join'ит pending-ротацию, zero refresh); refresh токеном ИЗ СТОРА; **10s AbortSignal-дедлайн** (test-seam); store-update через nonce-preserving action; lazy `./api` import (no cycle); no-store-token/skipAuth terminal.
- **`src/lib/api-client.ts`**: гейт `401 && private-allow && options.allowReactiveRefresh !== false && !skipAuth && !isRefreshEndpoint` → replay×1 с `{...options, authToken: undefined}` (re-reads store); фейл → исходный ApiError.
- **`src/hooks/useAuth.ts`**: пративная ветка unified на `getFreshToken()` (один класс ротации; logout on false); `isTokenExpired`-гейт сохранён.
- **Opt-outs** (`allowReactiveRefresh: false`): `createCabinet` + `getCabinetCreationOperation` + 167.9 `marginContext` — все explicit-authToken-пины (полный sweep: ровно 3 сайта, все закрыты).
- **G4-пин flip**: 12 тестов (replay, single-flight, replay-once, no-recursion, cascade-gate, JOIN-case, deadline, opt-out, wire-POST-pin: method/body/Idempotency-Key/X-Cabinet-Id parity, guard'ы).

## Dev Agent Record (4 ревью-прохода + дельта-диспозиция)

### Post-1st-pass-review fixes (2026-09-03)
Findings (2M+2OQ+4L, APPROVE с riders): **M1** каскад-ротаций (гейт wire≠store) · **M2** зависший refresh (10s дедлайн) · **OQ1** двойная ротация proactive/reactive (унификация на getFreshToken) · **OQ2** durable-pinned ops (opt-out + `allowReactiveRefresh` в ApiRequestOptions) · L1-L4 тест-гигиена. Все APPLIED. **Lens D verdict: margin-PUT регрессии НЕТ** (путём кода доказано).
### Post-2nd-pass-review fixes (2026-09-03)
Findings (5L, APPROVE): gate-join pending-ротации · opt-out симметрия (2 сайта) · attestation-счёт · stale tsbuildinfo (debris соседа). Все APPLIED (+JOIN-тест).
### Post-3rd-pass-review fixes (2026-09-03)
Findings (2M+5L, REJECT на doc/live-мета): **BE пересобран между пробами** (00:20Z 404 → 01:52Z 401-route-live → 02:02Z полная цепочка: refresh 200 + jti + 401 TOKEN_REVOKED + health healthy) → 230-doc Resolution закрыт + ФИНАЛЬНАЯ секция; handoff §3.1 противоречие; e2e-хедер; `suppressNetworkErrorLog`. Все APPLIED.
### Post-4th-pass-review fixes (2026-09-03)
Findings (3M+3L, REJECT на propagation-остатках): 5 stale-строк handoff'а (env-bullet, §3.1 item4, ledger 86/92/93) — классический 97.1 fix-block propagation. APPLIED + **pass-5 верификация = propagation-grep (stale-фраз = 0)** — doc-only механическая диспозиция Epic 107-FE A-2.

**Trigger-учёт**: проход-1 = 8 (>5 → Trigger 3 armed), проход-2 = 5, проход-3 = 7 (>5 → pass-4), проход-4 = 6 (док-мета; закрыто механическим grep-свипом с раскрытой дисpozицией). Кумулятив 26.

## Evidence

vitest полный **19436/0** (1275 файлов; флор 19424→19436, +12) · lint 0/0 · tsc 0 · build --webpack 0 · boundary 372 · docs 95 · locale 4 · privacy 3 pre-existing · **e2e официальный wrapper EXIT=0** ([P0] 2.8s + [P1] 5.0s + setup/orders) · **live-цепочка 02:02Z**: health healthy/queue-up, refresh 200/ревокация 401 (см. #230 ФИНАЛЬНАЯ).

## File List

Modified (10): api-client.ts, api.ts (opt-outs), cabinets.service.ts (marginContext), useAuth.ts, types/api.ts, + 5 тест-файлов. Added (2): api-client-refresh.ts, e2e/auth-reactive-refresh.spec.ts. Docs: 230-doc, SESSION2-handoff.

## Follow-ups

1. **Post-expiration recovery** — след. BE-этап (dedicated refresh-token/grace); FE-расширение тривиально поверх interceptor.
2. Multi-tab proactive race → logout (pre-existing; on-false re-read store before logout) — `FUTURE:`.
3. Session-level cooldown после failed refresh (throttle-noise) — `FUTURE:`.
4. Remote-publish BE-ветки → remote re-check.

## Change Log

- 2026-09-03: Item исполнен полным конвейером; PR #403. (executor opus + 4 fix-волны; 4 ревью-прохода opus свежим контекстом; live-гейт SATISFIED в процессе — BE пересобран между пробами, поймано adversarial-ревью).
  **Lessons:** (1) Live-статус меняется под ногами — каждая аттестация с таймстампом и re-probe на close. (2) Fix-block propagation: чиня заголовок, grep-ни параллельные локации той же фразы (поймал pass-4, не pass-3). (3) Хазарды контракта (single-use, nonce) обязаны становиться тестами до реализации — RED-пины ловят механику, а не только намерение.
