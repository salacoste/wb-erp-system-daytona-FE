# Epic 48: Orders FBS Integrity Dashboard

**Дата**: 2026-01-18
**Статус**: Backend Ready
**Приоритет**: P2 - Medium
**Backend Epic**: [epic-48-orders-fbs-deduplication-validation.md](../../../docs/epics/epic-48-orders-fbs-deduplication-validation.md)

---

## Назначение

Дашборд для мониторинга целостности данных заказов FBS и сверки с WB Dashboard. Позволяет:

1. **Контролировать здоровье данных** - 6 автоматических проверок целостности
2. **Сравнивать с WB Dashboard** - сверка количества заказов за период
3. **Выявлять проблемы** - дубликаты, orphan записи, невалидные переходы статусов

---

## UI Components

### 1. Health Status Card

Главный индикатор состояния системы.

| Статус | Цвет | Описание |
|--------|------|----------|
| `healthy` | Зеленый (`#22C55E`) | Все проверки пройдены |
| `warning` | Желтый (`#F59E0B`) | Есть minor issues |
| `unhealthy` | Красный (`#EF4444`) | Критические проблемы |

**Endpoint**: `GET /health/orders-integrity?cabinet_id={cabinetId}`
**Polling interval**: 5 минут (300000ms)
**Cache**: Нет (real-time данные)

### 2. Integrity Checks Table

Таблица с результатами 6 проверок целостности.

| Check Name | Описание | Healthy Count |
|------------|----------|---------------|
| `duplicates` | Дубликаты order_id в orders_fbs | 0 |
| `orphans` | Записи без связанного cabinet | 0 |
| `missing_history` | Заказы без истории статусов | 0 |
| `duplicate_status_history` | Дубликаты в истории статусов | 0 |
| `invalid_transitions` | Невалидные переходы (cancel → new) | 0 |
| `sync_overlaps` | Перекрывающиеся sync операции | 0 |

### 3. Reconciliation Panel

Сравнение локальных данных с WB Dashboard.

**Компоненты**:
- Date range picker (from/to)
- Expected count input (опционально)
- Variance indicator (< 1% = OK)
- Breakdown по статусам
- Breakdown по датам

---

## API Reference

### GET /health/orders-integrity

Полная проверка целостности данных заказов FBS.

**Request**:
```http
GET /health/orders-integrity?cabinet_id=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
```

**Response (200 OK - Healthy)**:
```json
{
  "status": "healthy",
  "checks": {
    "duplicates": {
      "status": "pass",
      "count": 0
    },
    "orphans": {
      "status": "pass",
      "count": 0
    },
    "missing_history": {
      "status": "pass",
      "count": 0
    },
    "duplicate_status_history": {
      "status": "pass",
      "count": 0
    },
    "invalid_transitions": {
      "status": "pass",
      "count": 0
    },
    "sync_overlaps": {
      "status": "pass",
      "count": 0
    }
  },
  "last_check": "2026-01-18T12:00:00.000Z",
  "duration_ms": 150
}
```

**Response (200 OK - Warning)**:
```json
{
  "status": "warning",
  "checks": {
    "duplicates": { "status": "pass", "count": 0 },
    "orphans": { "status": "fail", "count": 5 },
    "missing_history": { "status": "pass", "count": 0 },
    "duplicate_status_history": { "status": "pass", "count": 0 },
    "invalid_transitions": { "status": "pass", "count": 0 },
    "sync_overlaps": { "status": "pass", "count": 0 }
  },
  "last_check": "2026-01-18T12:00:00.000Z",
  "duration_ms": 180
}
```

**Response (200 OK - Unhealthy)**:
```json
{
  "status": "unhealthy",
  "checks": {
    "duplicates": { "status": "fail", "count": 15 },
    "orphans": { "status": "fail", "count": 8 },
    "missing_history": { "status": "fail", "count": 3 },
    "duplicate_status_history": { "status": "pass", "count": 0 },
    "invalid_transitions": { "status": "fail", "count": 2 },
    "sync_overlaps": { "status": "pass", "count": 0 }
  },
  "last_check": "2026-01-18T12:00:00.000Z",
  "duration_ms": 250
}
```

**Error Responses**:

```json
// 400 Bad Request - Missing cabinet_id
{
  "code": "CABINET_ID_REQUIRED",
  "message": "Cabinet ID is required via cabinet_id query parameter or X-Cabinet-Id header"
}

// 403 Forbidden - No access
{
  "code": "CABINET_ACCESS_DENIED",
  "message": "User does not have access to cabinet: 550e8400-..."
}
```

---

### GET /v1/orders/reconciliation

Отчет для сверки с WB Seller Dashboard.

**Request**:
```http
GET /v1/orders/reconciliation?cabinet_id={cabinetId}&from=2026-01-01&to=2026-01-07&expected_count=150
Authorization: Bearer {token}
```

**Query Parameters**:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `cabinet_id` | UUID | Да | ID кабинета |
| `from` | ISO date | Да | Начало периода (YYYY-MM-DD) |
| `to` | ISO date | Да | Конец периода (YYYY-MM-DD) |
| `expected_count` | number | Нет | Ожидаемое количество из WB Dashboard |

**Response (200 OK - Without expected_count)**:
```json
{
  "data": {
    "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": {
      "from": "2026-01-01",
      "to": "2026-01-07"
    },
    "local_count": 148,
    "expected_count": null,
    "variance": null,
    "variance_percent": null,
    "by_status": [
      { "status": "complete", "count": 120, "total_revenue": 180000.00 },
      { "status": "cancel", "count": 8, "total_revenue": 0.00 },
      { "status": "new", "count": 15, "total_revenue": 22500.00 },
      { "status": "confirm", "count": 5, "total_revenue": 7500.00 }
    ],
    "by_date": [
      { "date": "2026-01-01", "count": 18, "revenue": 27000.00 },
      { "date": "2026-01-02", "count": 22, "revenue": 33000.00 },
      { "date": "2026-01-03", "count": 20, "revenue": 30000.00 },
      { "date": "2026-01-04", "count": 25, "revenue": 37500.00 },
      { "date": "2026-01-05", "count": 28, "revenue": 42000.00 },
      { "date": "2026-01-06", "count": 18, "revenue": 27000.00 },
      { "date": "2026-01-07", "count": 17, "revenue": 13500.00 }
    ]
  },
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "variance_threshold": "< 1%",
    "variance_status": null
  }
}
```

**Response (200 OK - Within threshold)**:
```json
{
  "data": {
    "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": { "from": "2026-01-01", "to": "2026-01-07" },
    "local_count": 149,
    "expected_count": 150,
    "variance": -1,
    "variance_percent": 0.67,
    "by_status": [...],
    "by_date": [...]
  },
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "variance_threshold": "< 1%",
    "variance_status": "within_threshold"
  }
}
```

**Response (200 OK - Exceeds threshold)**:
```json
{
  "data": {
    "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": { "from": "2026-01-08", "to": "2026-01-14" },
    "local_count": 185,
    "expected_count": 200,
    "variance": -15,
    "variance_percent": 7.5,
    "by_status": [...],
    "by_date": [...]
  },
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "variance_threshold": "< 1%",
    "variance_status": "exceeds_threshold"
  }
}
```

**Error Responses**:

```json
// 400 Bad Request - Missing parameters
{
  "code": "MISSING_PARAMETERS",
  "message": "Required parameters: cabinet_id, from, to"
}

// 400 Bad Request - Invalid date
{
  "code": "INVALID_DATE_FORMAT",
  "message": "Dates must be in ISO 8601 format (YYYY-MM-DD)"
}
```

---

## TypeScript Interfaces

```typescript
// src/types/orders-integrity.ts

/** Статус отдельной проверки */
export type CheckStatus = 'pass' | 'fail';

/** Общий статус здоровья системы */
export type HealthStatus = 'healthy' | 'warning' | 'unhealthy';

/** Статус сверки с WB Dashboard */
export type VarianceStatus = 'within_threshold' | 'exceeds_threshold';

/** Результат одной проверки */
export interface CheckResult {
  status: CheckStatus;
  count: number;
}

/** Все проверки целостности */
export interface IntegrityChecks {
  duplicates: CheckResult;
  orphans: CheckResult;
  missing_history: CheckResult;
  duplicate_status_history: CheckResult;
  invalid_transitions: CheckResult;
  sync_overlaps: CheckResult;
}

/** Ответ GET /health/orders-integrity */
export interface IntegrityCheckResponse {
  status: HealthStatus;
  checks: IntegrityChecks;
  last_check: string; // ISO 8601
  duration_ms: number;
}

/** Breakdown по статусу заказа */
export interface StatusBreakdown {
  status: 'new' | 'confirm' | 'complete' | 'cancel';
  count: number;
  total_revenue: number;
}

/** Breakdown по дате */
export interface DateBreakdown {
  date: string; // YYYY-MM-DD
  count: number;
  revenue: number;
}

/** Данные отчета reconciliation */
export interface ReconciliationData {
  cabinet_id: string;
  period: {
    from: string; // YYYY-MM-DD
    to: string;   // YYYY-MM-DD
  };
  local_count: number;
  expected_count: number | null;
  variance: number | null;
  variance_percent: number | null;
  by_status: StatusBreakdown[];
  by_date: DateBreakdown[];
}

/** Meta информация reconciliation */
export interface ReconciliationMeta {
  timestamp: string; // ISO 8601
  variance_threshold: string; // "< 1%"
  variance_status: VarianceStatus | null;
}

/** Ответ GET /v1/orders/reconciliation */
export interface ReconciliationResponse {
  data: ReconciliationData;
  meta: ReconciliationMeta;
}

/** Параметры запроса reconciliation */
export interface ReconciliationParams {
  cabinet_id: string;
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  expected_count?: number;
}

/** Конфигурация проверки для UI */
export interface CheckConfig {
  key: keyof IntegrityChecks;
  label: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
}

/** Конфигурация статуса здоровья для UI */
export interface HealthStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}
```

---

## UI Configuration

```typescript
// src/lib/orders-integrity-utils.ts

import type {
  CheckConfig,
  HealthStatus,
  HealthStatusConfig,
  IntegrityChecks
} from '@/types/orders-integrity';

/** Конфигурация всех проверок */
export const CHECKS_CONFIG: CheckConfig[] = [
  {
    key: 'duplicates',
    label: 'Дубликаты заказов',
    description: 'Повторяющиеся order_id в таблице orders_fbs',
    severity: 'critical',
  },
  {
    key: 'orphans',
    label: 'Orphan записи',
    description: 'Записи без связанного кабинета',
    severity: 'critical',
  },
  {
    key: 'missing_history',
    label: 'Отсутствует история',
    description: 'Заказы без записей в order_status_history',
    severity: 'warning',
  },
  {
    key: 'duplicate_status_history',
    label: 'Дубликаты в истории',
    description: 'Повторяющиеся записи статусов',
    severity: 'warning',
  },
  {
    key: 'invalid_transitions',
    label: 'Невалидные переходы',
    description: 'Запрещенные переходы статусов (cancel → new)',
    severity: 'warning',
  },
  {
    key: 'sync_overlaps',
    label: 'Перекрытие синхронизаций',
    description: 'Конфликты параллельных sync операций',
    severity: 'info',
  },
];

/** Конфигурация статусов здоровья */
export const HEALTH_STATUS_CONFIG: Record<HealthStatus, HealthStatusConfig> = {
  healthy: {
    label: 'Здоров',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    icon: 'CheckCircle',
  },
  warning: {
    label: 'Предупреждение',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: 'AlertTriangle',
  },
  unhealthy: {
    label: 'Критично',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    icon: 'XCircle',
  },
};

/** Получить конфигурацию статуса */
export function getHealthStatusConfig(status: HealthStatus): HealthStatusConfig {
  return HEALTH_STATUS_CONFIG[status];
}

/** Подсчитать количество failed проверок */
export function countFailedChecks(checks: IntegrityChecks): number {
  return Object.values(checks).filter(check => check.status === 'fail').length;
}

/** Подсчитать общее количество проблем */
export function countTotalIssues(checks: IntegrityChecks): number {
  return Object.values(checks).reduce((sum, check) => sum + check.count, 0);
}

/** Определить, превышает ли variance порог */
export function isVarianceExceeded(variancePercent: number | null): boolean {
  if (variancePercent === null) return false;
  return Math.abs(variancePercent) > 1;
}

/** Форматировать variance для отображения */
export function formatVariance(variance: number | null): string {
  if (variance === null) return '—';
  const sign = variance > 0 ? '+' : '';
  return `${sign}${variance}`;
}

/** Форматировать variance percent */
export function formatVariancePercent(percent: number | null): string {
  if (percent === null) return '—';
  return `${percent.toFixed(2)}%`;
}
```

---

## Wireframe / Mockup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Orders FBS Integrity Dashboard                     [Refresh] [Auto: 5min]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  HEALTH STATUS                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  ✓ ЗДОРОВ                                    150ms            │   │   │
│  │  │  Последняя проверка: 18.01.2026, 12:00:00                    │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  INTEGRITY CHECKS                                                    │   │
│  │  ┌────────────────────────┬────────┬───────┬─────────────────────┐  │   │
│  │  │ Проверка               │ Статус │ Count │ Описание            │  │   │
│  │  ├────────────────────────┼────────┼───────┼─────────────────────┤  │   │
│  │  │ Дубликаты заказов      │ ✓ pass │   0   │ order_id duplicates │  │   │
│  │  │ Orphan записи          │ ✓ pass │   0   │ No cabinet link     │  │   │
│  │  │ Отсутствует история    │ ✓ pass │   0   │ No status history   │  │   │
│  │  │ Дубликаты в истории    │ ✓ pass │   0   │ Duplicate statuses  │  │   │
│  │  │ Невалидные переходы    │ ✓ pass │   0   │ Invalid transitions │  │   │
│  │  │ Перекрытие sync        │ ✓ pass │   0   │ Sync overlaps       │  │   │
│  │  └────────────────────────┴────────┴───────┴─────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RECONCILIATION WITH WB DASHBOARD                                    │   │
│  │                                                                       │   │
│  │  Period: [01.01.2026] - [07.01.2026]   Expected: [150    ] [Compare] │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Local: 148        Expected: 150        Variance: -2 (1.33%) │    │   │
│  │  │                                                              │    │   │
│  │  │  ⚠ EXCEEDS THRESHOLD (> 1%)                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  │  By Status:                          By Date:                        │   │
│  │  ┌─────────────────────────┐        ┌─────────────────────────┐     │   │
│  │  │ complete  120  180,000₽ │        │ 01.01  18   27,000₽     │     │   │
│  │  │ new        15   22,500₽ │        │ 02.01  22   33,000₽     │     │   │
│  │  │ cancel      8        0₽ │        │ 03.01  20   30,000₽     │     │   │
│  │  │ confirm     5    7,500₽ │        │ 04.01  25   37,500₽     │     │   │
│  │  └─────────────────────────┘        │ 05.01  28   42,000₽     │     │   │
│  │                                      │ 06.01  18   27,000₽     │     │   │
│  │                                      │ 07.01  17   13,500₽     │     │   │
│  │                                      └─────────────────────────┘     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Types & API Layer

- [ ] Создать `src/types/orders-integrity.ts` с интерфейсами
- [ ] Создать `src/lib/api/orders-integrity.ts` с API функциями
- [ ] Создать `src/lib/orders-integrity-utils.ts` с утилитами

### Phase 2: Hooks

- [ ] Создать `src/hooks/useOrdersIntegrity.ts` (GET /health/orders-integrity)
- [ ] Создать `src/hooks/useOrdersReconciliation.ts` (GET /v1/orders/reconciliation)
- [ ] Добавить polling (5 минут) для integrity check

### Phase 3: Components

- [ ] Создать `src/components/custom/orders/HealthStatusCard.tsx`
- [ ] Создать `src/components/custom/orders/IntegrityChecksTable.tsx`
- [ ] Создать `src/components/custom/orders/ReconciliationPanel.tsx`
- [ ] Создать `src/components/custom/orders/VarianceIndicator.tsx`
- [ ] Создать `src/components/custom/orders/StatusBreakdownTable.tsx`
- [ ] Создать `src/components/custom/orders/DateBreakdownTable.tsx`

### Phase 4: Page

- [ ] Создать страницу `/orders/integrity` или добавить в существующую Orders страницу
- [ ] Интегрировать все компоненты
- [ ] Добавить auto-refresh toggle

### Phase 5: Testing

- [ ] Unit тесты для утилит
- [ ] Unit тесты для хуков (mock API)
- [ ] E2E тест для страницы

---

## Related Documentation

| Документ | Описание |
|----------|----------|
| [Epic 48 Backend](../../../docs/epics/epic-48-orders-fbs-deduplication-validation.md) | Полное описание Epic |
| [16-validation.http](../../../test-api/16-validation.http) | HTTP примеры запросов |
| [93-epic-40-orders-fbs-frontend-guide.md](./93-epic-40-orders-fbs-frontend-guide.md) | Orders FBS основной UI |
| [API-PATHS-REFERENCE.md](../../../docs/API-PATHS-REFERENCE.md) | Справочник API |

---

## Contact

При вопросах по API:
- Swagger UI: `http://localhost:3000/api`
- Test API: `test-api/16-validation.http`
