# Epic 44-48: Data Validation & Integrity API

## Обзор

API для валидации и проверки целостности данных. Включает:
- **Story 4.1**: Финансовая санитарная валидация (4 проверки)
- **Epic 48**: Проверка целостности заказов FBS и сверка с WB Dashboard

**Статус**: ✅ Production Ready (221 тест, 100% passed)

---

## Endpoints

### 1. POST /v1/validation/:cabinetId/validate/:week

Запуск всех проверок валидации для недели.

**URL**: `POST /v1/validation/{cabinetId}/validate/{week}`

**Headers**:
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters**:
| Параметр | Тип | Описание | Пример |
|----------|-----|----------|--------|
| cabinetId | UUID | ID кабинета | `550e8400-e29b-41d4-a716-446655440000` |
| week | string | ISO неделя | `2025-W05` |

**Response (200 OK)**:
```json
{
  "data": {
    "week": "2025-W05",
    "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
    "all_passed": true,
    "checks_run": 4,
    "checks_passed": 4,
    "checks_failed": 0,
    "results": {
      "row_balance": {
        "passed": true,
        "total_rows": 15000,
        "violating_rows": 0,
        "violation_rate": 0.0,
        "violations": []
      },
      "alternative_reconstruction": {
        "passed": true,
        "total_rows": 15000,
        "violating_rows": 0,
        "avg_error_pct": 0.0,
        "max_error_pct": 0.0
      },
      "storno_control": {
        "passed": true,
        "original_sales_sum": 100000.0,
        "storno_sales_sum": 5000.0,
        "ratio_pct": 5.0
      },
      "transport_exclusion": {
        "passed": true,
        "transport_reimbursement_sum": 12000.0,
        "excluded_from_payout": true
      }
    },
    "created_at": "2026-01-18T10:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z"
  }
}
```

---

### 2. GET /v1/validation/:cabinetId/results/:week

Получение результатов валидации для недели.

**URL**: `GET /v1/validation/{cabinetId}/results/{week}`

**Headers**:
```
Authorization: Bearer {token}
```

**Response (200 OK)**: Аналогично POST validate

**Response (200 OK - нет данных)**:
```json
{
  "data": null,
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "message": "No validation results found for this week"
  }
}
```

---

### 3. GET /v1/validation/:cabinetId/summary

Сводка валидации по нескольким неделям.

**URL**: `GET /v1/validation/{cabinetId}/summary`

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| weeks | string | Нет | Список недель через запятую: `2025-W01,2025-W02` |

**Response (200 OK)**:
```json
{
  "data": [
    {
      "week": "2025-W05",
      "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
      "all_passed": true,
      "checks_run": 4,
      "checks_passed": 4,
      "checks_failed": 0,
      "checks": {
        "row_balance": { "passed": true, "violation_rate": 0.0 },
        "alternative_reconstruction": { "passed": true, "violation_rate": 0.0 },
        "storno_control": { "passed": true, "violation_rate": 0.0 },
        "transport_exclusion": { "passed": true, "violation_rate": 0.0 }
      }
    }
  ],
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "total": 1
  }
}
```

---

### 4. GET /health/orders-integrity (Epic 48)

Проверка целостности данных заказов FBS.

**URL**: `GET /health/orders-integrity`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| cabinet_id | UUID | Да | ID кабинета |

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "checks": {
    "duplicates": { "status": "pass", "count": 0 },
    "orphans": { "status": "pass", "count": 0 },
    "missing_history": { "status": "pass", "count": 0 },
    "duplicate_status_history": { "status": "pass", "count": 0 },
    "invalid_transitions": { "status": "pass", "count": 0 },
    "sync_overlaps": { "status": "pass", "count": 0 }
  },
  "last_check": "2026-01-18T12:00:00.000Z",
  "duration_ms": 150
}
```

**Статусы**:
| status | Описание | Цвет |
|--------|----------|------|
| `healthy` | Все проверки пройдены | Зеленый |
| `warning` | Есть незначительные проблемы | Желтый |
| `unhealthy` | Критические проблемы | Красный |

---

### 5. GET /v1/orders/reconciliation (Epic 48)

Сверка заказов с WB Dashboard.

**URL**: `GET /v1/orders/reconciliation`

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| cabinet_id | UUID | Да | ID кабинета |
| from | string | Да | Дата начала (YYYY-MM-DD) |
| to | string | Да | Дата окончания (YYYY-MM-DD) |
| expected_count | number | Нет | Ожидаемое кол-во из WB Dashboard |

**Response (200 OK)**:
```json
{
  "data": {
    "cabinet_id": "550e8400-e29b-41d4-a716-446655440000",
    "period": {
      "from": "2026-01-01",
      "to": "2026-01-07"
    },
    "local_count": 148,
    "expected_count": 150,
    "variance": -2,
    "variance_percent": 1.33,
    "by_status": [
      { "status": "complete", "count": 120, "total_revenue": 180000.0 },
      { "status": "cancel", "count": 28, "total_revenue": 42000.0 }
    ],
    "by_date": [
      { "date": "2026-01-07", "count": 25, "revenue": 37500.0 },
      { "date": "2026-01-06", "count": 22, "revenue": 33000.0 }
    ]
  },
  "meta": {
    "timestamp": "2026-01-18T10:00:00.000Z",
    "variance_threshold": "< 1%",
    "variance_status": "exceeds_threshold"
  }
}
```

**variance_status**:
| Значение | Описание |
|----------|----------|
| `within_threshold` | Расхождение < 1% (норма) |
| `exceeds_threshold` | Расхождение >= 1% (требует внимания) |

---

## TypeScript Interfaces

```typescript
// Общие типы
interface ValidationMeta {
  timestamp: string;
  message?: string;
  total?: number;
}

// Story 4.1 - Financial Validation
interface RowBalanceResult {
  passed: boolean;
  total_rows: number;
  violating_rows: number;
  violation_rate: number;
  violations: object[];
}

interface AlternativeReconstructionResult {
  passed: boolean;
  total_rows: number;
  violating_rows: number;
  avg_error_pct: number;
  max_error_pct: number;
}

interface StornoControlResult {
  passed: boolean;
  original_sales_sum: number;
  storno_sales_sum: number;
  ratio_pct: number;
}

interface TransportExclusionResult {
  passed: boolean;
  transport_reimbursement_sum: number;
  excluded_from_payout: boolean;
}

interface ValidationResults {
  row_balance: RowBalanceResult | null;
  alternative_reconstruction: AlternativeReconstructionResult | null;
  storno_control: StornoControlResult | null;
  transport_exclusion: TransportExclusionResult | null;
}

interface ValidationSummary {
  week: string;
  cabinet_id: string;
  all_passed: boolean;
  checks_run: number;
  checks_passed: number;
  checks_failed: number;
  results: ValidationResults;
  created_at: string;
}

interface ValidationSummaryResponse {
  data: ValidationSummary;
  meta: ValidationMeta;
}

// Epic 48 - Orders Integrity
type HealthStatus = 'healthy' | 'warning' | 'unhealthy';
type CheckStatus = 'pass' | 'fail';

interface CheckResult {
  status: CheckStatus;
  count: number;
}

interface IntegrityChecks {
  duplicates: CheckResult;
  orphans: CheckResult;
  missing_history: CheckResult;
  duplicate_status_history: CheckResult;
  invalid_transitions: CheckResult;
  sync_overlaps: CheckResult;
}

interface IntegrityCheckResponse {
  status: HealthStatus;
  checks: IntegrityChecks;
  last_check: string;
  duration_ms: number;
}

// Reconciliation
type VarianceStatus = 'within_threshold' | 'exceeds_threshold' | null;
type OrderStatus = 'new' | 'confirm' | 'complete' | 'cancel';

interface StatusBreakdown {
  status: OrderStatus;
  count: number;
  total_revenue: number;
}

interface DateBreakdown {
  date: string;
  count: number;
  revenue: number;
}

interface ReconciliationData {
  cabinet_id: string;
  period: {
    from: string;
    to: string;
  };
  local_count: number;
  expected_count: number | null;
  variance: number | null;
  variance_percent: number | null;
  by_status: StatusBreakdown[];
  by_date: DateBreakdown[];
}

interface ReconciliationResponse {
  data: ReconciliationData;
  meta: {
    timestamp: string;
    variance_threshold: string;
    variance_status: VarianceStatus;
  };
}
```

---

## Коды ошибок

| HTTP | Code | Описание |
|------|------|----------|
| 400 | `MISSING_PARAMETERS` | Не указаны обязательные параметры |
| 400 | `INVALID_DATE_FORMAT` | Неверный формат даты (нужен YYYY-MM-DD) |
| 400 | `CABINET_ID_REQUIRED` | Не указан cabinet_id |
| 401 | - | Unauthorized - невалидный токен |
| 403 | `CABINET_ACCESS_DENIED` | Нет доступа к кабинету |

**Пример ошибки 403**:
```json
{
  "code": "CABINET_ACCESS_DENIED",
  "message": "User does not have access to cabinet: 550e8400-...",
  "details": [
    {
      "field": "cabinetId",
      "issue": "cabinet_not_in_user_cabinets",
      "value": "550e8400-e29b-41d4-a716-446655440000",
      "allowed_cabinets": ["other-cabinet-uuid"]
    }
  ]
}
```

---

## Frontend Integration Guide

### Когда вызывать эндпоинты

| Эндпоинт | Когда вызывать |
|----------|----------------|
| `POST validate/:week` | При ручном запуске валидации |
| `GET results/:week` | При загрузке страницы недели |
| `GET summary` | Для дашборда/списка недель |
| `GET orders-integrity` | Polling каждые 5 минут на странице заказов |
| `GET reconciliation` | При сверке с WB Dashboard |

### Рекомендации по polling

```typescript
// Orders integrity - polling каждые 5 минут
const INTEGRITY_POLL_INTERVAL = 5 * 60 * 1000;

useEffect(() => {
  const fetchIntegrity = async () => {
    const response = await api.get('/health/orders-integrity', {
      params: { cabinet_id: cabinetId }
    });
    setIntegrityStatus(response.data);
  };

  fetchIntegrity();
  const interval = setInterval(fetchIntegrity, INTEGRITY_POLL_INTERVAL);
  return () => clearInterval(interval);
}, [cabinetId]);
```

### Отображение статусов

```typescript
const STATUS_COLORS = {
  healthy: '#22c55e',  // green-500
  warning: '#eab308',  // yellow-500
  unhealthy: '#ef4444' // red-500
};

const STATUS_LABELS = {
  healthy: 'Все в порядке',
  warning: 'Есть предупреждения',
  unhealthy: 'Требует внимания'
};
```

### Variance indicator

```typescript
const isVarianceOk = (variancePercent: number | null) => {
  if (variancePercent === null) return true;
  return Math.abs(variancePercent) < 1;
};

const formatVariance = (variance: number | null) => {
  if (variance === null) return '-';
  return variance > 0 ? `+${variance}` : `${variance}`;
};
```

---

## Связанные документы

- `97-epic-48-orders-integrity-dashboard.md` - UI гайд для дашборда целостности
- `test-api/16-validation.http` - HTTP примеры для тестирования
