# Request #72: Advertising Sync Status Endpoint Returns 404

**Date**: 2025-12-22
**Status**: ✅ RESOLVED
**Priority**: High
**Related**: Request #71 (Advertising Analytics API - Epic 33)

## Resolution Summary

**Root Cause**: Backend server not restarted after implementing advertising analytics controller.

**Backend Fix**:
1. Added AuthModule import to NotificationsModule
2. Rebuilt TypeScript, restarted server

**Frontend Adaptation**:
1. Updated `SyncStatusResponse` type to match actual backend response (camelCase fields)
2. Added `deriveHealthStatus()` function to calculate health from response
3. Updated `SyncStatusIndicator` component for new format
4. Updated mock handlers and tests

**Files Modified**:
- `src/types/advertising-analytics.ts` - New response type with camelCase fields
- `src/app/(dashboard)/analytics/advertising/components/SyncStatusIndicator.tsx` - Adapted for new format
- `src/mocks/handlers/advertising.ts` - Updated mock data
- `src/hooks/__tests__/useAdvertisingAnalytics.test.ts` - Updated tests
- `src/lib/api/advertising-analytics.ts` - Fixed logging

---

---

## Проблема

Frontend получает **404 NOT_FOUND** при вызове эндпоинта `/v1/analytics/advertising/sync-status`.

### Скриншот ошибки

```
GET http://localhost:3000/v1/analytics/advertising/sync-status 404 (Not Found)

Response: {"message":"Cannot GET /v1/analytics/advertising/sync-status","error":"Not Found","statusCode":404}
```

---

## Ожидание (из Request #71)

Согласно документации Request #71, эндпоинт должен существовать и возвращать:

### Endpoint

```http
GET /v1/analytics/advertising/sync-status
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Expected Response (SyncStatusResponse)

```typescript
interface SyncStatusResponse {
  cabinet_id: string;
  last_sync_at: string | null;
  last_sync_status: 'success' | 'error' | 'partial';
  next_scheduled_sync: string;
  campaigns_synced: number;
  stats_records_synced: number;
  cost_records_synced: number;
  sync_duration_seconds: number;
  error_count_last_24h: number;
  health_status: 'healthy' | 'degraded' | 'unhealthy' | 'stale';
}
```

---

## Frontend использование

### API Client (src/lib/api/advertising-analytics.ts)

```typescript
export async function getAdvertisingSyncStatus(): Promise<SyncStatusResponse> {
  const response = await apiClient.get<SyncStatusResponse>(
    '/v1/analytics/advertising/sync-status',
    { skipDataUnwrap: true },
  )
  return response
}
```

### React Hook (src/hooks/useAdvertisingAnalytics.ts)

```typescript
export function useAdvertisingSyncStatus(options?: {
  refetchInterval?: number
  refetchIntervalInBackground?: boolean
}) {
  return useQuery({
    queryKey: ['advertising-sync-status', cabinetId],
    queryFn: () => getAdvertisingSyncStatus(),
    refetchInterval: options?.refetchInterval ?? 60000, // 60s polling
    refetchIntervalInBackground: options?.refetchIntervalInBackground ?? false,
  })
}
```

### UI Component (SyncStatusIndicator.tsx)

Компонент отображает:
- Цветной индикатор health_status (green/yellow/orange/red)
- Относительное время последней синхронизации
- Tooltip с детальной статистикой (campaigns_synced, stats_records_synced, etc.)

---

## Влияние на UI

При получении 404:
- Отображается "Статус недоступен" вместо индикатора синхронизации
- Пользователь не видит актуальность рекламных данных
- Dashboard widget для рекламы работает, но без статуса синхронизации

---

## Проверка на стороне Backend

Просьба проверить:

1. **Контроллер зарегистрирован?**
   ```typescript
   // Ожидается в advertising-analytics.controller.ts
   @Get('sync-status')
   @UseGuards(JwtAuthGuard, CabinetGuard)
   async getSyncStatus(@CurrentCabinet() cabinetId: string): Promise<SyncStatusResponse> {
     return this.advertisingService.getSyncStatus(cabinetId);
   }
   ```

2. **Модуль импортирован в AppModule?**
   - AdvertisingAnalyticsModule должен быть в imports

3. **Роутинг правильный?**
   - Контроллер: `@Controller('v1/analytics/advertising')`
   - Метод: `@Get('sync-status')`
   - Итоговый путь: `/v1/analytics/advertising/sync-status`

4. **Нет конфликта с другими роутами?**
   - Возможно другой контроллер перехватывает `/v1/analytics/*`

---

## Дополнительные endpoint'ы (для проверки)

Также используются (возможно с теми же проблемами):

| Endpoint | Статус |
|----------|--------|
| `GET /v1/analytics/advertising` | ❓ Не проверено |
| `GET /v1/analytics/advertising/campaigns` | ❓ Не проверено |
| `GET /v1/analytics/advertising/sync-status` | 🔴 404 |

---

## Ожидаемое решение

1. Развернуть/активировать AdvertisingAnalyticsController
2. Убедиться что все 3 endpoint'а доступны
3. Вернуть корректный SyncStatusResponse для каждого кабинета

---

## Тестовые запросы

```bash
# Sync Status (возвращает 404)
curl -X GET "http://localhost:3000/v1/analytics/advertising/sync-status" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"

# Analytics (проверить)
curl -X GET "http://localhost:3000/v1/analytics/advertising?from=2025-12-01&to=2025-12-21" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"

# Campaigns (проверить)
curl -X GET "http://localhost:3000/v1/analytics/advertising/campaigns" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"
```

---

## Связанные файлы

### Frontend
- `src/lib/api/advertising-analytics.ts` - API client
- `src/hooks/useAdvertisingAnalytics.ts` - React Query hooks
- `src/app/(dashboard)/analytics/advertising/components/SyncStatusIndicator.tsx` - UI component

### Backend (ожидаемые)
- `src/analytics/controllers/advertising-analytics.controller.ts`
- `src/analytics/services/advertising-analytics.service.ts`
- `src/analytics/dto/response/advertising-response.dto.ts`

---

*Создано: 2025-12-22*
*Frontend Epic: 33-FE (Advertising Analytics)*
*Backend Epic: 33 (Advertising Analytics)*
