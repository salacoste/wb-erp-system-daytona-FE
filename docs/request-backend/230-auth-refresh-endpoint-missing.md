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
