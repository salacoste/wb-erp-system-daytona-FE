# Request #101: Epic 52 - Tariff Settings Admin API

**Date**: 2026-01-22
**Status**: ✅ COMPLETE
**Epic**: Epic 52 - Tariff Settings Admin API
**Backend**: All 8 stories delivered (25 SP)

---

## Обзор (Overview)

Полная интеграция административного API для управления глобальными тарифами Wildberries. Реализованы 7 новых endpoints для управления тарифными настройками, аудит-трек и версионирование с эффективными датами.

**Key Features**:
- ✅ 7 новых admin endpoints
- ✅ PUT/PATCH endpoints для управления тарифами
- ✅ Per-field audit trail (21 поле)
- ✅ Versioning with effective dates
- ✅ Rate limiting (10 req/min для mutations)
- ✅ Admin-only доступ

---

## Problem Statement

### Проблема

До этого момента глобальные тарифные настройки (`WbTariffSettings`) могли быть изменены только через прямой доступ к базе данных:
- Нет API для управления тарифами
- Нет audit trail для отслеживания изменений
- Нет возможности запланировать будущие изменения тарифов
- Нет истории версий для troubleshooting

### Business Need

1. **API-based management**: Управление тарифами без прямого доступа к БД
2. **Validation**: Бизнес-правила на уровне API
3. **Audit trail**: Кто, что и когда изменил
4. **Versioning**: Планирование будущих изменений тарифов

---

## Solution

### Реализованные Endpoints

| Endpoint | Method | Auth | Rate Limit | Описание |
|----------|--------|------|------------|----------|
| `/v1/tariffs/settings` | PUT | Admin only | 10 req/min | Полная замена настроек |
| `/v1/tariffs/settings` | PATCH | Admin only | 10 req/min | Частичное обновление |
| `/v1/tariffs/settings/audit` | GET | Admin only | None | Audit trail изменений |
| `/v1/tariffs/settings/schedule` | POST | Admin only | 10 req/min | Создание будущей версии |
| `/v1/tariffs/settings/history` | GET | Admin only | None | История версий |
| `/v1/tariffs/settings/:id` | DELETE | Admin only | None | Удаление запланированной версии |

**Примечание**: Существующий `GET /v1/tariffs/settings` endpoint **не изменился** - используется query-based version resolution.

---

## Implementation Details

### Phase 1: Core Endpoints (Stories 52.1-52.3, 52.6-52.8)

#### 1. PUT /v1/tariffs/settings - Полная замена

```http
PUT /v1/tariffs/settings
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "acceptanceBoxRatePerLiter": 1.80,
  "acceptancePalletRate": 520.00,
  "logisticsLargeFirstLiterRate": 48.00,
  "logisticsLargeAdditionalLiterRate": 15.00,
  "returnLogisticsFboRate": 55.00,
  "returnLogisticsFbsRate": 55.00,
  "defaultCommissionFboPct": 25.00,
  "defaultCommissionFbsPct": 28.00,
  "storageFreeDays": 60,
  "fixationClothingDays": 90,
  "fixationOtherDays": 60,
  "logisticsVolumeTiers": [
    {"fromLiters": 0.001, "toLiters": 0.200, "rateRub": 24.0},
    {"fromLiters": 0.201, "toLiters": 0.400, "rateRub": 27.0},
    {"fromLiters": 0.401, "toLiters": 0.600, "rateRub": 30.0},
    {"fromLiters": 0.601, "toLiters": 0.800, "rateRub": 31.0},
    {"fromLiters": 0.801, "toLiters": 1.000, "rateRub": 33.0}
  ],
  "source": "manual",
  "notes": "Q1 2026 tariff update"
}

Response (200 OK):
{
  "data": {
    "default_commission_fbo_pct": 25.00,
    "default_commission_fbs_pct": 28.00,
    "acceptance_box_rate_per_liter": 1.80,
    // ... все поля настроек
    "effective_from": "2026-01-01T00:00:00.000Z"
  },
  "meta": {
    "updated_at": "2026-01-22T10:00:00.000Z",
    "updated_by": "admin@example.com"
  }
}
```

**Валидация**:
- Числовые поля: > 0 (acceptanceBoxRatePerLiter, logisticsLargeFirstLiterRate, etc.)
- Проценты: 0-100 (defaultCommissionFboPct, defaultCommissionFbsPct)
- Целые числа: >= 0 (storageFreeDays, fixationClothingDays, fixationOtherDays)
- Volume tiers: отсортированы, non-overlapping, полное покрытие 0.001L-1.000L

#### 2. PATCH /v1/tariffs/settings - Частичное обновление

```http
PATCH /v1/tariffs/settings
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "storageFreeDays": 45,
  "notes": "Holiday promotion"
}

Response (200 OK):
{
  "data": {
    // ... все поля настроек
    "storage_free_days": 45
  },
  "meta": {
    "updated_at": "2026-01-22T10:00:00.000Z",
    "updated_by": "admin@example.com",
    "fields_updated": ["storage_free_days", "notes"]
  }
}
```

### Phase 2: Enhanced Features (Stories 52.4, 52.5)

#### 3. GET /v1/tariffs/settings/audit - Audit Trail

```http
GET /v1/tariffs/settings/audit?page=1&limit=50&field_name=storageFreeDays
Authorization: Bearer <admin-jwt>

Response (200 OK):
{
  "data": [
    {
      "id": 123,
      "action": "UPDATE",
      "field_name": "storageFreeDays",
      "old_value": "60",
      "new_value": "45",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_email": "admin@example.com",
      "ip_address": "192.168.1.1",
      "created_at": "2026-01-22T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 234,
    "total_pages": 5
  }
}
```

**Tracked Fields (21 total)**:
- `acceptanceBoxRatePerLiter`, `acceptancePalletRate`
- `logisticsVolumeTiers`, `logisticsLargeFirstLiterRate`, `logisticsLargeAdditionalLiterRate`
- `returnLogisticsFboRate`, `returnLogisticsFbsRate`
- `defaultCommissionFboPct`, `defaultCommissionFbsPct`
- `storageFreeDays`, `fixationClothingDays`, `fixationOtherDays`
- `clothingCategories`, `fbsUsesFboLogisticsRates`
- `logisticsFbsVolumeTiers`, `logisticsFbsLargeFirstLiterRate`, `logisticsFbsLargeAdditionalLiterRate`
- `effectiveFrom`, `source`, `notes`

#### 4. POST /v1/tariffs/settings/schedule - Планирование будущей версии

```http
POST /v1/tariffs/settings/schedule
Authorization: Bearer <admin-jwt>
Content-Type: application/json

{
  "effective_from": "2026-02-01",
  "storageFreeDays": 45,
  "acceptanceBoxRatePerLiter": 2.00,
  "notes": "February promotion"
}

Response (201 Created):
{
  "data": {
    // ... все поля настроек
    "storage_free_days": 45,
    "effective_from": "2026-02-01T00:00:00.000Z"
  },
  "meta": {
    "version_id": 3,
    "effective_from": "2026-02-01",
    "status": "scheduled"
  }
}
```

**Validation Rules**:
- `effective_from` должна быть future date (не сегодня или в прошлом)
- Уникальная `effective_from` date (не может конфликтовать с существующей версией)
- Максимум 10 scheduled versions

#### 5. GET /v1/tariffs/settings/history - История версий

```http
GET /v1/tariffs/settings/history
Authorization: Bearer <admin-jwt>

Response (200 OK):
{
  "data": [
    {
      "id": 3,
      "effective_from": "2026-02-01",
      "effective_until": null,
      "status": "scheduled",
      "source": "manual",
      "notes": "February promotion",
      "created_at": "2026-01-22T10:00:00.000Z",
      "updated_by": "admin@example.com"
    },
    {
      "id": 2,
      "effective_from": "2026-01-15",
      "effective_until": "2026-01-31",
      "status": "active",
      "source": "manual",
      "notes": "January 2026 update",
      "created_at": "2026-01-10T09:00:00.000Z",
      "updated_by": "admin@example.com"
    },
    {
      "id": 1,
      "effective_from": "2025-09-15",
      "effective_until": "2026-01-14",
      "status": "expired",
      "source": "manual",
      "notes": "Initial WB tariff change",
      "created_at": "2025-09-01T08:00:00.000Z",
      "updated_by": "system@wb-repricer.com"
    }
  ]
}
```

**Status Calculation**:
- `scheduled`: `effective_from` > today
- `active`: `effective_from` <= today <= `effective_until` (или `effective_until` = null)
- `expired`: `effective_until` < today

#### 6. DELETE /v1/tariffs/settings/:id - Удаление запланированной версии

```http
DELETE /v1/tariffs/settings/3
Authorization: Bearer <admin-jwt>

Response (204 No Content)
```

**Validation**:
- Можно удалить только версии со `status = "scheduled"`
- Нельзя удалить active или expired версии
- Soft delete: устанавливает `isActive = false`

---

## API Response Examples

### Существующий Endpoint (Без изменений)

#### GET /v1/tariffs/settings - Получить текущие тарифы

```http
GET /v1/tariffs/settings
Authorization: Bearer <jwt-token>

Response (200 OK):
{
  "data": {
    "default_commission_fbo_pct": 25.00,
    "default_commission_fbs_pct": 28.00,
    "acceptance_box_rate_per_liter": 1.80,
    "acceptance_pallet_rate": 520.00,
    "logistics_volume_tiers": [
      {"min": 0.001, "max": 0.200, "rate": 24.0},
      {"min": 0.201, "max": 0.400, "rate": 27.0},
      {"min": 0.401, "max": 0.600, "rate": 30.0},
      {"min": 0.601, "max": 0.800, "rate": 31.0},
      {"min": 0.801, "max": 1.000, "rate": 33.0}
    ],
    "logistics_large_first_liter_rate": 48.00,
    "logistics_large_additional_liter_rate": 15.00,
    "return_logistics_fbo_rate": 55.00,
    "return_logistics_fbs_rate": 55.00,
    "storage_free_days": 60,
    "fbs_uses_fbo_logistics_rates": true,
    "effective_from": "2026-01-01T00:00:00.000Z"
  }
}
```

**Version Resolution** (query-based, no cron needed):
- Находит версию с `effective_from <= current_date`
- Учитывает `effective_until` если задана
- Кэширует на 1 час (сокращено с 24h для version switching)

---

## Frontend Impact

### MINIMAL - Backend-Only Admin Feature

**✅ No Breaking Changes**:
- Существующий `GET /v1/tariffs/settings` endpoint **не изменился**
- Все frontend функции работают как раньше
- Query-based version resolution прозрачен для frontend

**⚠️ Изменения в Cache TTL**:
- Было: 24 часа
- Стало: 1 час
- Причина: Поддержка переключения между версиями тарифов

**🔮 Future Considerations** (не в scope текущего epic):
- Возможность построить Admin UI для управления тарифами
- Audit trail viewer для compliance
- Version comparison UI

### Что Frontend должен знать

1. **Rate Limiting для Admin Mutations**:
   - PUT/PATCH/POST schedule: 10 req/min
   - Если frontend будет строить admin UI - учитывать rate limits

2. **Admin Role Required**:
   - Все новые endpoints требуют `role: admin`
   - Manager/Owner/Analyst получат 403 Forbidden

3. **Error Responses**:
   ```typescript
   // 403 Forbidden - Non-admin user
   {
     "message": "Required roles: admin. User role: manager",
     "error": "Forbidden"
   }

   // 400 Validation Error
   {
     "message": ["storageFreeDays must be at least 0"],
     "error": "Bad Request"
   }

   // 409 Conflict - Version already exists
   {
     "message": "A version already exists for 2026-02-01",
     "error": "Conflict"
   }

   // 429 Rate Limit Exceeded
   {
     "message": "Rate limit exceeded: 10 requests per minute",
     "error": "Too Many Requests"
   }
   ```

---

## Документация

### Backend

- **API Reference**: [`docs/API-PATHS-REFERENCE.md`](../../docs/API-PATHS-REFERENCE.md#tariff-settings-admin-api-epic-52)
- **Epic README**: [`docs/stories/epic-52/README.md`](../../docs/stories/epic-52/README.md)
- **Story Files**:
  - [Story 52.1 - UpdateTariffSettingsDto](../../docs/stories/epic-52/story-52.1-update-tariff-dto.md)
  - [Story 52.2 - PUT Endpoint](../../docs/stories/epic-52/story-52.2-put-settings-endpoint.md)
  - [Story 52.3 - PATCH Endpoint](../../docs/stories/epic-52/story-52.3-patch-settings-endpoint.md)
  - [Story 52.4 - Audit Trail](../../docs/stories/epic-52/story-52.4-audit-trail.md)
  - [Story 52.5 - Versioning](../../docs/stories/epic-52/story-52.5-versioning.md)
  - [Story 52.6 - Documentation](../../docs/stories/epic-52/story-52.6-api-documentation.md)
  - [Story 52.7 - Tests](../../docs/stories/epic-52/story-52.7-tests.md)
  - [Story 52.8 - Security](../../docs/stories/epic-52/story-52.8-security.md)

### HTTP Tests

- **Test API**: `test-api/52-tariffs-admin.http` (или `test-api/18-tariffs.http`)

---

## Related Backend Epics

- **Epic 43**: Price Calculator Backend - использует `WbTariffSettings`
- **Epic 44**: Price Calculator Frontend - отображает тарифы в UI

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 8 |
| **Story Points** | 25 |
| **New Endpoints** | 7 |
| **Audit Fields** | 21 |
| **Rate Limit** | 10 req/min (mutations) |
| **Cache TTL** | 1 hour (reduced from 24h) |
| **Frontend Impact** | Minimal (no breaking changes) |

---

**Дата создания**: 2026-01-22
**Backend Team**: Complete ✅
**Frontend Team**: For information only - no action required

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-01-22
**Summary**: Epic 52 fully implemented with 7 new admin endpoints for tariff settings management (PUT, PATCH, audit, schedule, history, delete). Per-field audit trail (21 fields) and versioning with effective dates included. No breaking changes to existing GET endpoint.
**Remaining frontend action**: None required - backend-only admin feature. Future admin UI optional.
