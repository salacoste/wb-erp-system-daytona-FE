# FE-D1: mutation retry skip-4xx + ApiError-preservation (WB-token PUT больше не дублируется)

**Status**: done (2026-09-06, сессия-7; PR #413, merged)
**Branch**: `fix/fe-d1-mutation-retry-skip-4xx` (worktree `/private/tmp/fe-d1-retry`, base main `a6bf8ae0`)
**Owner-track**: реестр §3.1 FE-D1 (HANDOFF-173/174: «mutation retry:1 ретраит 4xx; WB-token PUT может дважды»)

## Дефект (двухслойный — второй слой вскрыт живым e2e-ревью)

1. **Слой 1 (зарегистрирован)**: глобальный дефолт `mutations: { retry: 1 }` (`providers.tsx`) слепо ретраил ЛЮБЫЕ ошибки, включая 4xx (перманентные): WB-token PUT на 400 уходил дважды (e2e даже документировал это как норму: «The app-wide mutations retry:1 re-issues the failed PUT»).
2. **Слой 2 (пойман проходом-2 с живым прогоном)**: `handleWbTokenUpdateError` (`api-wb-token-errors.ts`) перебрасывал **плоские `new Error`** — уничтожая `ApiError`-класс ДО TanStack → `instanceof`-предикат был **мёртвым кодом** ровно на мотивирующем кейсе. Юниты 17/17 были зелёными (предикат тестировали на настоящих ApiError — форма, которую прод-цепочка не производила). Живой прогон: BROWSER-02 «Expected 1, Received 2».

## Реализация (6 файлов)

- `src/lib/mutation-retry.ts` (новый, 31): `shouldRetryMutation(fc, error)` — fc≥1→false (retry:1-cap); `ApiError` 4xx→false (ВСЕ, вкл. 429 — Retry-After-UX в UI-слое); 5xx/network(ApiError status 0)/unknown→true.
- `src/app/providers.tsx` (63): wiring + экспорт `makeQueryClient` (для identity-пина).
- **`src/lib/api-wb-token-errors.ts` (55→89, корневой фикс)**: все 8 throw-веток (400/403/404/401 + INVALID_TOKEN/RATE_LIMITED/NETWORK_ERROR/TOKEN_VALIDATION_FAILED) — `new ApiErrorClass(msg, status, data)` (алиас-импорт из `@/types/api`; коллизия с interface `ApiError` из cabinet разрешена). Тексты сообщений дословно не тронуты → UI-копии идентичны. 5xx fallthrough = исходный инстанс (`toBe`-пин). Duck-guard входа не сужен.
- `src/lib/api-wb-token-errors.test.ts` (новый, 70): 9 пинов — тип+статус сохранены по веткам, data-проноска, 5xx-тождество, non-Error passthrough.
- `src/lib/mutation-retry.test.ts` (новый, 84): 19 пинов — 6×4xx, 3×5xx, TypeError (defense-in-depth), duck-form без status→true (документирует ПОЧЕМУ фикс обязан жить в throw-сайте), 4×cap, **wiring-пин** `makeQueryClient().getDefaultOptions().mutations?.retry === shouldRetryMutation` (реверт провайдера валит юнит).
- `e2e/onboarding.spec.ts`: BROWSER-02 пины (2,4)→**(1,2)** + комментарий новой семантики; BROWSER-03 queue [403,403,401,401]→**[403,401]** + новые putAttempts-пины (1,2) в обоих сабмитах.

## Dev Agent Record (3 прохода: APPROVE → REJECT → APPROVE)

### Post-1st-pass-review fixes (2026-09-06)
Findings (4L, APPROVE): dead `queryClient.ts` (реестр); BROWSER-03 без PUT-пина; summary-нюанс; 399/NaN теоретичны. **APPLIED**: PUT-пины (1,2) в BROWSER-03; остальное dispositioned.
### Post-2nd-pass-review fixes (2026-09-06 — REJECT, живой e2e на :3101)
Findings (1C+1H+1M+3L): плоский Error в throw-сайте = мёртвый предикат (живой прогон: «Expected 1, Received 2»; BROWSER-03 'Нет доступа' не рендерится — retry съел 401); комментарии ложны; юниты дают ложную уверенность. **APPLIED** (fix-волна executor): Variant A — ApiError preservation во всех ветках (RED 8 failed = юнит-воспроизведение критического → GREEN 28/28); duck-form + wiring пины; JSDoc; scope-check 183 файлов = 0 других catch→rethrow-трансформов.
### Post-3rd-pass-review fixes (2026-09-06, convergence — 4 ≤ 5)
Findings (4L, APPROVE): 3 code-ветки без пинов; мгновенный toBe(1) слаб в изоляции (suite-арифметика держит); 401-пин опирается на отсутствие /v1/auth/refresh (request-230 учтёт); data-проноска расширяет вход getErrorMessage (Defensive Frontend — правильно). **DISPOSITIONED**: hardening-ноуты в артефакт/реестр.

**Trigger-учёт**: P1 4≤5 → P2 REJECT 6>5 (**Trigger 3** → 3-й обязательный; кумулятив 10) → P3 4≤5 сходимость. Novel-pattern (error-transport контракт) — 3 прохода + REJECT→fix-цикл с юнит-воспроизведением и живым негативным контролем.

## Evidence

**Живой e2e (PM2-свап протокол, окно ~2 мин, восстановлен)**: `npm run test:e2e -- onboarding.spec.ts --grep WB-TOKEN-BROWSER --retries=0` на worktree-dev :3100 через npm-обёртку (preflight-handshake соблюдён) → **6 passed (10.8s)**. Негативный контроль: прогон прохода-2 на сломанном промежуточном = red («Expected 1, Received 2»). Прямой запуск playwright вне обёртки заблокирован handshake-гардом (3100-only — не обходить; :3101-скретч ревьюера-2 = нарушение, очищено). vitest полный **19492/0** (флор 19464→19492, +28; CLAUDE.md тем же PR) · lint 0/0 · tsc 0 · build 0 · boundary 118 · docs/locale/lessons 0 · privacy 0 (после зачистки e2e-артефакта: свежий `e2e/.auth/user.json` от прогона триггерит счётчик гейта — удалять после прогонов) · контракты 174.3 зелёные БЕЗ регена (onboarding.spec НЕ SHA-пинится; пров. grep). Логи `/tmp/fe-d1-*.log`.

## Остатки (реестр §11)

1. `src/lib/queryClient.ts` — мёртвый (0 импортёров), несёт старый `mutations: { retry: 1 }` — удалить в следующей debt-волне.
2. Hardening-ноуты прохода-3: 3 code-ветки api-wb-token-errors без прямых пинов; мгновенность toBe(1) в BROWSER-03; 401-PUT-дубль при будущем BE-refresh (request-230); data-proноска как осознанное расширение.
3. ПРЕФЛАЙТ-урок: прогон манифест-контракт-тестов ДО волн (дёшево) — оба FE-D1-слоя были бы видны раньше живым e2e... нет: слой-2 виден ТОЛЬКО живым прогоном — юнит-форма ошибки ≠ прод-форма. Урок: e2e-видимые изменения требуют живого прогона до аттестации пинов.

## Change Log

- 2026-09-06: Item исполнен; PR #413. (executor opus ×2 волны + fix-волна; 3 ревью-прохода opus; живой e2e оркестратора через PM2-свап).
  **Lessons:** (1) Трансформ-сайты ошибок обязаны сохранять класс+статус — плоский re-throw превращает предикат в мёртвый код. (2) Зелёный юнит ≠ работающий фикс: прод-форма ошибки (flat Error) не покрыта юнитами — истина только в живом e2e. (3) e2e-артефакты (storageState) триггерят privacy-счётчик — зачищай после прогона.
