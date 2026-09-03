# Request #230 — BE: refresh-token endpoint отсутствует (блокер D-2/PB-3 + proactive-refresh FE мёртв)

**Дата**: 2026-09-02 (сессия-2, оркестратор V15, в ходе исполнения D-1)
**Приоритет**: HIGH — блокирует долговый item D-2 (PB-3: реактивный 401-refresh) и делает существующий proactive-refresh FE недействительным
**Тип**: contract-gap (отсутствующий маршрут)

## Problem

FE вызывает `POST /v1/auth/refresh` (единственный refresh-путь: `src/lib/api.ts` → `refreshToken()`, используется хуком `src/hooks/useAuth.ts` → `refreshTokenIfNeeded` — монтируется глобально через `AuthProvider` в root layout). **Маршрута на BE не существует.**

## Root Cause

`src/auth/auth.controller.ts` (BE) определяет ровно три маршрута: `register`, `login`, `logout`. Ни одного refresh-эндпоинта нет ни по какому пути; упоминаний «refresh» в auth-модуле BE — 0. Контрактный файл `test-api/01-auth.http` / `01-authentication.http` тоже не содержит refresh-запросов — дрифт существовал с момента появления FE-вызова.

## Impact (evidence, живые прогоны 2026-09-02)

1. **Любой протухший/непарсящийся access-токен = мгновенный logout**: `isTokenExpired(token)===true` → `refreshToken()` → BE 404 `{"error":{"code":"NOT_FOUND","message":"Cannot POST /v1/auth/refresh"}}` → catch → `logout()` + redirect `/login`. Поймано в e2e-сессии D-1 (логи dev-сервера, 5 воспроизведений).
2. **D-2 (PB-3) заблокирован**: план «401 → single-flight refresh → replay×1» не имеет целевого маршрута. Реализация interceptor'а без BE-контракта = стрельба в 404.
3. Session-1 handoff §3.1 (D-2) предписывал «BE-координацию до правок» — исполнено read-only, вердикт: BE-фикс обязателен.

## Fix Scope (BE-side, предложение — финальная семантика за owner/BE-командой)

Добавить refresh-эндпоинт в `AuthController`. Открытые контрактные вопросы для решения:

1. **Механизм**: dedicated refresh-token (выдаётся при login/logout-ротация) ИЛИ продление самого JWT (слайдинг)? Текущий FE-вызов шлёт `Authorization: Bearer <access>` + пустое тело — то есть FE-сторона предполагала «продление по access-токену».
2. **Ответ**: `RefreshTokenResponse` FE ожидает `{ token, user? }` (при `user` FE делает полный `login()` с новой sessionNonce — см. `authStore.login`).
3. **Безопасность**: refresh-ротация/ревокация, TTL пары токенов, троттл.
4. До решения: FE-сторона НЕ имплементирует ничего за BE (V15 §3); `PENDING BACKEND:` маркеры остаются.

## Reproduction

```bash
curl -s -X POST http://localhost:3000/v1/auth/refresh \
  -H "Authorization: Bearer <any-jwt>" -H "Content-Type: application/json" -d '{}'
# → 404 {"error":{"code":"NOT_FOUND","message":"Cannot POST /v1/auth/refresh"}}
```

## Resolution

Ждёт owner-решения: (a) BE реализует refresh-контракт → после мержа D-2 разблокирован (FE interceptor по факту контракта); (b) re-scope D-2 (например, silent re-login UX без refresh — отдельное дизайн-решение); (c) отмена D-2 с регистрацией residual-риска. Связанное: `decodeJWT` padding-хрупкость на FE (битый base64 payload → fail-safe expired → этот же мёртвый путь → logout) — зарегистрировано в артефакте D-1 как FE-side follow-up.

---

## ✅ ANEX: ответ BE (2026-09-03) — контракт согласован, реализован в локальной BE-ветке (НЕ задеплоено)

**Контракт**: `POST /v1/auth/refresh` · `Authorization: Bearer <valid-access-jwt>` · тело `{}` → **200 `{ "token": "<new>" }`** (user опционален и не возвращается). Sliding access-JWT rotation: требуется ещё валидный JWT; юзер перепроверяется в БД; claims из актуального состояния; новый jti; TTL-класс сохраняется (24ч / remember-me 30д); абсолютный кап сессии 30 дней; **исходный JWT атомарно ревокается** (replay → 401 TOKEN_REVOKED); Redis fail-closed; троттл 10/min/IP; inactive → 401 INVALID_SESSION.

**⚠️ Оговорки для D-2**:
1. **Истёкший access-JWT обновить НЕЛЬЗЯ** — reactive-восстановление после реального expiration НЕ разблокировано (нужен dedicated refresh-token или grace — следующий этап BE). Разблокировано: proactive-refresh до истечения.
2. Код не опубликован/не развёрнут: live-endpoint до deploy отдаёт 404, `/v1/health` — старый degraded. Live-верификация FE = post-deploy follow-up.

### FE-side integration notes (оркестратор V15, 2026-09-03)

1. **Хазард single-use токена**: proactive-refresh ревокает исходный JWT → любые in-flight запросы со старым токеном получат 401 TOKEN_REVOKED. D-2 interceptor обязан при refresh читать токен ИЗ СТОРА (уже ротированный), не из упавшего запроса; single-flight + очередь ожидания закрывает гонку.
2. **Хазард sessionNonce**: `useAuth.refreshTokenIfNeeded` сейчас вызывает store-`login()` — а `login()` МИНИТ НОВУЮ sessionNonce → in-flight cabinet-create (D-1 settlement) уйдёт в `stale`. Интеграция обязана использовать store-`refreshToken(token, user)` (не трогает nonce). Это FE-фикс в рамках D-2.
3. BE-проверки: Jest 13 334 (0 failed), lint/prettier/tsc/build/circular/cred-scan PASS (Node 24.18.0).

### Live-верификация (2026-09-03, после owner-сигнала «задеплоено»)

`localhost:3000` (локальный PM2-инстанс `wb-repricer`, uptime с 2026-09-01): `POST /v1/auth/refresh` → **404 NOT_FOUND**; `/v1/health` → старый `queue:down` (фикс семантики не активен). **Локальный рантайм НЕ пересобран** с новой BE-веткой (`npm run rebuild` + `pm2 restart wb-repricer` не выполнялись; ветка BE также не опубликована в remote по последнему отчёту BE-команды). Возможные объяснения: deploy произведён в ДРУГУЮ среду, либо «задеплоено» = «ветка готова». **Для FE**: D-2 исполняется по контракту (синтетика); live-гейт остаётся открытым до пересборки локального BE. Owner-«ок» на D-2 re-scope: ✅ получено 2026-09-03.
