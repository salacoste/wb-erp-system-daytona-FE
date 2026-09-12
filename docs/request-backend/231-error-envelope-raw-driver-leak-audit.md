# #231 — BE: аудит error-envelope на предмет сырых driver/infra ошибок (pg / redis / internal)

**Дата**: 2026-09-12 (сессия-14, FE) · **Тип**: вопрос/аудит (не подтверждённый баг) · **Приоритет**: низкий
**Инициатор**: FE-D3-residual, реестр shadcn-migration §13 residual (3); связан с owner-ledger «apiClient-санитизация» (закрыт волной C, PR #451).

## Problem

FE больше не полагается на форму error-сообщений: волна C (PR #451) санитизирует `ApiError.message` на границе apiClient (канонный FE-D3 sanitizer: стеки, креденциал-URL, пути, SQL/DDL-проза, JWT, hex/base64-блобы; truncate ≤200), а волна D (PR #452) редактирует `logger.warn/error`. Однако защита на FE — это второй рубеж: если BE-фильтры исключений пропускают сырые driver-ошибки в HTTP-ответ, сырые фрагменты всё ещё (a) попадают в `ApiError.data` (поле не санитизируется намеренно — контракты данных), (b) уходят в BE-логи/мониторинг в ещё большем объёме.

Вопрос: **могут ли ответы NestJS-фильтров содержать сырые сообщения `pg`, `redis`, `prisma` или внутренние стеки** (например, `connect ECONNREFUSED 127.0.0.1:5432`, `relation "xxx" does not exist`, Redis `WRONGTYPE...`)?

## Root Cause (гипотеза)

Типовой NestJS-паттерн: глобальный `HttpExceptionFilter` обрабатывает `HttpException`, а catch-all ветка для не-HttpException иногда отдаёт `err.message`/stack наружу (особенно в dev-режиме или при `detail`-поле pg-ошибок, прокинутом в `response.message`).

## Impact

- Низкий для UI: FE санитизирует message-канал (волна C) и `errorData`-канал в логах (волна D); UI-рендер `error.data` ограничен type-guard'ами (числовые поля).
- Остаточный риск: (1) `data.details[].recommendation`/`message` — серверно-derived строки, которые FE скрабит, но пользователь теряет полезную guidance, если BE кладёт её рядом с секретоподобным шумом; (2) info-утечка в логах BE/мониторинга; (3) фикс на BE (генерик-ошибки + внутренние детали только в логи) устранил бы класс целиком на первом рубеже.

## Fix Scope (BE)

1. Аудит глобального exception-фильтра: не-HttpException ветка должна возвращать generic-сообщение (например, `Internal server error` + trace-id), детали — только в лог.
2. Убедиться, что `pg`-ошибки маппятся (не пробрасывается `detail`/`routine`), redis-сбои очереди не попадают в HTTP-ответы синхронных ручек.
3. Опционально: интеграционный тест «непроглоченное исключение → envelope без driver-маркеров».

## Reproduction (как FE обнаружил класс)

Юнит-пин волны C: mock 500 с телом, содержащим `postgresql://admin:s3cret@host/db` + JWT → FE-санитайзер скрабит (`src/lib/api-client.test.ts`, «sanitizes credentialed URLs and JWTs in HTTP error messages»). FE-сторона закрыта; вопрос — воспроизводит ли BE такой envelope в реальности.

## Resolution

FE-side: **CLOSED** (волны C/D, реестр §38/§39) — защита не зависит от ответа на этот запрос.
BE-side: ⏳ ожидает аудита; результат (даже «чисто») просьба отметить в этой ветке/ответном коммите.
