# D-1 (PB-1) — Silent cabinet-create: initiation nonce-mint + indeterminate recovery alert

**Status**: done (2026-09-02, сессия-2 оркестратора V15; PR — см. Change Log)
**Branch**: `debt/d1-pb1-silent-cabinet-create` (worktree `/private/tmp/d1-pb1-silent-cabinet-create`, base main `ecbf3cc9`)
**Owner-track**: P1 product defect; behavior-changing → полный конвейер A–J + e2e + 3 ревью-прохода (Trigger 3: плотность >5 в проходах 1 и 2).

## Дефект (verified live, pre-flight 105.2)

Nonce-less аутентифицированная сессия → `handleCreateCabinet` захватывает `initiating.sessionNonce = null` → BE создаёт кабинет (idempotency-key scoped) → `evaluateCabinetSettlement` = `indeterminate` → `useCabinetCreateMutation.onSuccess` тихо делает reconcile и `return`: ни toast, ни навигации, ни recovery-алерта. Действие юзера потеряно без диагностики при существующем сервер-сайд кабинете. Pre-flight: НЕ no-op (тихая ветка жива в `useCabinetCreateMutation.ts:78-81`); nonce-mint при rehydrate уже был на main (167.9 HIGH-2), но **mint в момент инициации отсутствовал**.

## BE-координация (план §3.1 п.3 — исполнена read-only)

Nonce — чисто FE-концепт; BE-контракт: `POST /v1/cabinets` + `Idempotency-Key` (replay-семантика), `GET /v1/cabinets/creation-operations/{id}` (succeeded → полный ответ с newToken). **BE-фикс не нужен.**

## Tasks

- [x] Pre-flight 105.2: grep AC-существительных, drift-сверка file:line (все сошлись)
- [x] BE-контракт верифицирован (read-only, `../test-api/02-cabinets.http`)
- [x] Tests-first: RED 4 (пины mint/alert) → реализация → GREEN (executor opus)
- [x] Реализация: `ensureSessionNonce` в authStore; mint-before-capture в `handleCreateCabinet`; indeterminate-ветка алерта в `useCabinetCreateMutation`
- [x] Story 174.3 manifest регенерирован официальным раннером `--owner-units` (×2 — после fix-волн; мета-урок 174.4 соблюдён: реген на ФИНАЛЬНОМ состоянии)
- [x] e2e-спек: [P0] true defect pin (двухтабный storage-sync nonce-nulling; **двусторонне верифицирован** — падает на main, проходит на ветке), [P1] composite regression
- [x] Валидация: lint 0/0 · tsc 0 · vitest **19421/0** (флор 19415→19421, +6) · build --webpack 0 · boundary 459/3 · docs 95 · locale 4 · lessons 0 · privacy diff-empty (3 pre-existing) · prettier · diff --check
- [x] Официальный e2e-прогон через wrapper (`npm run test:e2e`): EXIT=0, 7 passed / 1 skipped (manager-creds optional) — [P0] 3.9s, [P1] 3.2s, authenticate setup 5.0s (после троттл-паузы 60+ мин)
- [x] 3 ревью-прохода свежим code-reviewer (opus); все findings APPLIED/DISPOSITIONED
- [x] Registry flips + CLAUDE.md флор тем же PR

## Dev Agent Record

### Post-1st-pass-review fixes (2026-09-02)

Findings (6: 2 HIGH / 1 MEDIUM / 1 LOW / 2 NOTE; VERDICT REJECT-as-is):
- **F1 [HIGH] recovery-deadlock**: non-applied ветка не освобождала `finishRecoveryOperation(marker)` → same-tab logout+login не реконсиляциирует CREATE_PENDING (`reconciledCreate` гейтится `!activeOperation`) → юзер висит в recovery-blocked до hard reload. **APPLIED**: release первым statement'ом обеих под-веток + компонентный тест (logout+login → remount → idle).
- **F2 [HIGH] e2e не пинил D-1-дельту**: сид без nonce монтируется rehydrate-mint'ом main'а → спек зелёный и на main; нарратив «Before D-1 silently swallowed» ложен для этого сида. **APPLIED**: [P0] перестроен как true pin — сид с нормальным nonce → live-store nonce зануляется ПОСЛЕ rehydrate двухтабным storage-событием (same-tab setItem не файрит storage; sync-хендлер setState-мержит явный null) → submit → D-1 mint → applied → /wb-token; на main — indeterminate, спек падает. [P1] переименован в composite regression, нарратив исправлен (rehydrate-mint = основной юзер-видимый фикс 167.9; D-1 закрывает residual-щели).
- **F3 [MEDIUM] hermeticity**: `CabinetCreationForm.test.tsx` не мокал `@/lib/api` barrel → indeterminate/stale тесты звали реальный `getCabinetCreationOperation` (MSW onUnhandled error + реальный fetch). **APPLIED**: partial-barrel mock как в sibling-файле.
- **F4 [LOW] flush в stale-quiet тесте**: негативные ассерты до flushed эффектов. **APPLIED**: 300ms flush (sibling-канон).
- **F5 [NOTE] failure-indeterminate без operationId не реконсилябелен серверно**. **APPLIED** (документирующий комментарий).
- **F6 [NOTE] post-D-1 indeterminate ≈ unreachable = defense-in-depth**. **APPLIED** (комментарий + нарратив артефакта).

**Отклонение fix-волны (evidence-backed)**: тихий guard `useCabinetCreationRecovery.ts` потерял conjunct `activeOperation` — без этого освобождение флага ломало stale-quiet канон (still-mounted форма получает алерт на settle; доказано инструментированием: effect run 2 видел released flag + local op → маркер-ветка → алерт → stale-тест RED). Guard: `marker && localOperationIds.has(opId)` — форма, сама отправившая операцию, молчит о её settle; remount (свежий localOperationIds) — алерт; `reconciledCreate` по-прежнему гейтится `!activeOperation` (рекавери F1 работает).

### Post-2nd-pass-review fixes (2026-09-02)

Findings (6: 3 LOW / 3 NOTE; VERDICT APPROVE при фиксах 1–3). Ревьюер эмпирически прогнал e2e В ОБЕ СТОРОНЫ (main: [P0] FAILS на line 224 waitForURL — true-pin доказан; ветка: оба проходят, 2.8s):
- **F1 [LOW] phase-strand 'restoring'** в contrived-пути (same-form stale settle → logout → login без cabinetId → guard return до нормализации). **APPLIED**: `setPhase(c => c === 'restoring' ? 'idle' : c)` в guard-ветке.
- **F2 [LOW] отклонение не запинено тестом**. **APPLIED**: тест 'stale settle keeps the same form quiet and usable after a same-tab logout+login without a cabinet' — red/green верифицирован дважды (conjunct-restore → RED на первом alert-ассерте; phase-normalize-remove → RED на toBeEnabled). Обоснованное отклонение от спеки: ДВА раздельных `act()` (batched act коалесцит store-записи → effect не перезапускается → vacuous pass; red-check это доказал).
- **F3 [LOW] prose 'fresh tab' ложен** (marker в sessionStorage — per-tab). **APPLIED**: 'same-tab reload'.
- **F4 [NOTE] слабый settle-сентинел в e2e** (`readyState==='complete'` мгновенен; race слил бы пин в vacuous-green). **DISPOSITIONED → закрыт проходом 3** (детерминированный precondition-ассерт).
- **F5 [NOTE] имя [P1] обещает mint-покрытие, не ассертя его**. **APPLIED** (переименован).
- **F6 [NOTE] pre-existing: stale settle не сбрасывает phase 'creating'** — кнопка активна, но resubmission тихо no-op. **DISPOSITIONED**: не этот PR (идентично main); кандидат в P2-каталог (см. Follow-ups).

### Post-3rd-pass-review fixes (2026-09-02, convergence)

Findings (5: 1 MEDIUM / 1 LOW / 3 NOTE; VERDICT APPROVE — сходимость):
- **F1 [MEDIUM] e2e precondition не ассертится**: если storage-событие потеряно, nonce выживает → create applied и на main → пин vacuous-green. **APPLIED**: `waitForFunction` на storage-side `state.sessionNonce === null` (заменил слабый readyState-сентинел).
- **F2 [LOW] reconcile status-mislabel**: resolved-undefined (`mockReset` дефолт) кидал `'status' in undefined` → catch мислейблил `'network'`. **APPLIED**: total guard `operation && 'status' in operation ? ... : 'succeeded'`.
- **F3 [NOTE] mixed state: indeterminate + logout/login без cabinetId — алерт персистит при активной кнопке** (production re-login возвращает cabinet_ids → reconciledCreate чистит). **APPLIED** (disclosure-комментарий).
- **F4 [NOTE] инпут-ошибка ревьюера]** (`useAuth.test.tsx` не существует; фактически `.ts`) — прогнан отдельно, 7/7. Закрыт.
- **F5 [NOTE] pre-existing phase 'creating' strand** — дубль прохода-2 F6. DISPOSITIONED (follow-up).

**Trigger-учёт**: проход 1 = 6 findings (>5 → Trigger 3 armed), проход 2 = 6 (>5 → подтверждён), проход 3 = 5 (≤5 — сходимость). Кумулятив 17. 3-й проход исполнен как MANDATORY.

## File List

Modified (8):
- `src/stores/authStore.ts` — `ensureSessionNonce()` действие (mint iff null ∧ token ∧ user; персист через partialize)
- `src/services/cabinets.service.ts` — mint-before-capture в `handleCreateCabinet`; комментарии (failure-indeterminate limitation; same-tab reload)
- `src/components/custom/useCabinetCreateMutation.ts` — non-applied ветка: `finishRecoveryOperation` release + indeterminate alert (`isLiveOwner` guard) + total status guard в reconcile
- `src/components/custom/useCabinetCreationRecovery.ts` — тихий guard без `activeOperation` conjunct + phase-нормализация + disclosure
- `src/services/cabinets.service.settlement.test.ts` — re-pin (mint→applied) + idempotency + unauthenticated-no-mint
- `src/services/cabinets.service.test.ts` — mock-shape (`ensureSessionNonce`)
- `src/components/custom/CabinetCreationForm.test.tsx` — split it.each (stale verbatim / indeterminate alert) + barrel-mock + reset
- `src/components/custom/CabinetCreationForm.accountRecovery.test.tsx` — indeterminate alert+resubmit-block; stale-quiet+flush; logout+login→remount→idle; same-form quiet+usable pin
- `e2e/fixtures/story-174-3/execution-manifest.json` — MACHINE-GENERATED (раннер `--owner-units`, fail-closed; 6 SHA-обновлений + метаданные)

Added (1):
- `e2e/onboarding-cabinet-create-nonce-mint.spec.ts` — [P0] true defect pin (двухтабный nonce-nulling, precondition-ассерт), [P1] composite regression

## Гейты (финальное состояние, живые прогоны)

vitest **19421/0** (1275 файлов) · lint 0/0 · tsc 0 · build --webpack 0 · boundary 459 = baseline, exceptions 3/3 · docs exit 0 (95) · locale 4 · lessons 0 · privacy = 3 pre-existing, diff-empty · prettier clean · `git diff --check` clean · e2e wrapper EXIT=0 (7/1/0).

## Follow-ups (новые долговые кандидаты, зарегистрированы сессией-2)

1. **BE не имеет `/v1/auth/refresh`** (404 NOT_FOUND; в `../test-api/01-auth*.http` refresh отсутствует вовсе) → proactive `useAuth.refreshTokenIfNeeded` на ЛЮБОМ непарсящемся/просроченном токене = мгновенный logout. **Критично как вход для D-2/PB-3**: реактивный interceptor обязан целиться в реальный refresh-маршрут — до правок D-2 сверить BE-контроллеры; при отсутствии маршрута → `PENDING BACKEND:` + `docs/request-backend/`.
2. **`decodeJWT` латентно-хрупкий** (`src/lib/auth.ts`): битый/битый-паддинг base64 молча → null → `isTokenExpired` fail-safe true → refresh-logout. Кандидат на мягкую нормализацию паддинга + лог. (Обнаружен при сборке e2e-токена; байт-уровневое доказательство в сессии-2 логах.)
3. **Pre-existing stale-resubmit no-op** (ревью-2 F6 = ревью-3 F5): после stale settle phase='creating', кнопка активна, resubmission тихо блокирована marker'ом. P2-каталог.

## Change Log

- 2026-09-02: Item исполнен полным конвейером A–J (executor opus impl + 3 fix-волны; 3 ревью-прохода code-reviewer opus, свежий контекст каждый); e2e true-pin двусторонне верифицирован; флор vitest 19415→19421 тем же PR; манифест 174.3 регенерирован официально ×2 (последний — на финальном состоянии).
  **Lessons:** (1) Сид-токен e2e обязан быть настоящим base64url JSON — битый payload молча логинит-аут через fail-safe isTokenExpired. (2) «Спек зелёный» ≠ «спек пинит дельту»: проверяй падение на main до аттестации defect-pin. (3) Освождение in-memory флага меняет достижимость эффектов — ревью каждое удаление conjunct'а в guard'ах.
