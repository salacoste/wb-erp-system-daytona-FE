# Epic 51: Cross-API FBS Historical Analytics

**Дата:** 2026-01-29
**Статус:** Реализовано
**Story Points:** 25 SP (5 историй)

## Обзор

Расширение аналитики FBS заказов с 30 до 365 дней через агрегацию данных из 3 источников:

| Период | Источник | Обновление |
|--------|----------|------------|
| 0-30 дней | OrdersFBS API | Реалтайм |
| 31-90 дней | Reports API | Ежедневно 04:00 MSK |
| 91-365 дней | Analytics API | Еженедельно |

---

## API Эндпоинты

### Аналитика (Historical Analytics Controller)

#### 1. GET /v1/analytics/orders/trends

**Описание:** Исторические тренды заказов (до 365 дней)

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` |
| `X-Cabinet-Id` | UUID | Да | ID кабинета |

**Query Parameters:**
| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `from` | string | Да | - | Начало периода (YYYY-MM-DD) |
| `to` | string | Да | - | Конец периода (YYYY-MM-DD) |
| `aggregation` | enum | Нет | `day` | Уровень агрегации: `day`, `week`, `month` |
| `metrics` | string | Нет | все | Метрики через запятую: `orders,revenue,cancellations` |

**Response 200:**
```json
{
  "trends": [
    {
      "date": "2025-12-01",
      "ordersCount": 150,
      "revenue": 225000,
      "cancellations": 8,
      "cancellationRate": 5.33,
      "returns": 5,
      "returnRate": 3.33,
      "avgOrderValue": 1500
    }
  ],
  "summary": {
    "totalOrders": 3300,
    "totalRevenue": 4950000,
    "avgDailyOrders": 110,
    "cancellationRate": 5.5,
    "returnRate": 2.8
  },
  "dataSource": {
    "primary": "orders_fbs",
    "extended": "reports",
    "aggregated": "analytics"
  },
  "period": {
    "from": "2025-12-01",
    "to": "2026-01-28",
    "aggregation": "day",
    "daysIncluded": 59
  }
}
```

**Ошибки:**
| Код | Описание |
|-----|----------|
| 400 `INVALID_DATE_FORMAT` | Неверный формат даты. Используйте YYYY-MM-DD |
| 400 `INVALID_DATE_RANGE` | Дата начала должна быть раньше даты окончания |
| 400 `DATE_RANGE_EXCEEDED` | Диапазон дат не может превышать 365 дней |
| 401 | Unauthorized |
| 403 | Cabinet ID required |

---

#### 2. GET /v1/analytics/orders/seasonal

**Описание:** Сезонные паттерны заказов

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` |
| `X-Cabinet-Id` | UUID | Да | ID кабинета |

**Query Parameters:**
| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|--------------|--------------|----------|
| `months` | number | Нет | `12` | Период анализа (1-12 месяцев) |
| `view` | enum | Нет | все | Тип паттерна: `weekly`, `monthly`, `quarterly` |

**Response 200 (view=monthly):**
```json
{
  "patterns": {
    "monthly": [
      { "month": "January", "avgOrders": 3200, "avgRevenue": 4800000 },
      { "month": "February", "avgOrders": 2900, "avgRevenue": 4350000 },
      { "month": "December", "avgOrders": 4500, "avgRevenue": 6750000 }
    ]
  },
  "insights": {
    "peakMonth": "December",
    "lowMonth": "August",
    "peakDayOfWeek": "Saturday",
    "seasonalityIndex": 0.35
  }
}
```

**Response 200 (view=weekly):**
```json
{
  "patterns": {
    "weekday": [
      { "dayOfWeek": "Sunday", "avgOrders": 120 },
      { "dayOfWeek": "Monday", "avgOrders": 145 },
      { "dayOfWeek": "Tuesday", "avgOrders": 140 },
      { "dayOfWeek": "Wednesday", "avgOrders": 138 },
      { "dayOfWeek": "Thursday", "avgOrders": 142 },
      { "dayOfWeek": "Friday", "avgOrders": 155 },
      { "dayOfWeek": "Saturday", "avgOrders": 160 }
    ]
  },
  "insights": {
    "peakMonth": "December",
    "lowMonth": "August",
    "peakDayOfWeek": "Saturday",
    "seasonalityIndex": 0.35
  }
}
```

**Response 200 (view=quarterly):**
```json
{
  "patterns": {
    "quarterly": [
      { "quarter": "Q1", "avgOrders": 9500, "avgRevenue": 14250000 },
      { "quarter": "Q2", "avgOrders": 8800, "avgRevenue": 13200000 },
      { "quarter": "Q3", "avgOrders": 8200, "avgRevenue": 12300000 },
      { "quarter": "Q4", "avgOrders": 11500, "avgRevenue": 17250000 }
    ]
  },
  "insights": { ... }
}
```

**Ошибки:**
| Код | Описание |
|-----|----------|
| 400 | months must be between 1 and 12 |
| 401 | Unauthorized |
| 403 | Cabinet ID required |

---

#### 3. GET /v1/analytics/orders/compare

**Описание:** Сравнение двух периодов (MoM, QoQ, YoY)

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` |
| `X-Cabinet-Id` | UUID | Да | ID кабинета |

**Query Parameters:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `period1_from` | string | Да | Период 1: начало (YYYY-MM-DD) |
| `period1_to` | string | Да | Период 1: конец (YYYY-MM-DD) |
| `period2_from` | string | Да | Период 2: начало (YYYY-MM-DD) |
| `period2_to` | string | Да | Период 2: конец (YYYY-MM-DD) |

**Response 200:**
```json
{
  "period1": {
    "from": "2025-12-01",
    "to": "2025-12-31",
    "ordersCount": 3000,
    "revenue": 4500000,
    "cancellationRate": 5.2,
    "avgOrderValue": 1500
  },
  "period2": {
    "from": "2026-01-01",
    "to": "2026-01-28",
    "ordersCount": 3300,
    "revenue": 4950000,
    "cancellationRate": 4.9,
    "avgOrderValue": 1500
  },
  "comparison": {
    "ordersChange": 300,
    "ordersChangePercent": 10.0,
    "revenueChange": 450000,
    "revenueChangePercent": 10.0,
    "cancellationRateChange": -0.3,
    "avgOrderValueChange": 0,
    "avgOrderValueChangePercent": 0
  }
}
```

---

### Администрирование (Backfill Admin Controller)

> **Важно:** Все эндпоинты требуют роль `Owner`

#### 4. POST /v1/admin/backfill/start

**Описание:** Запуск импорта исторических данных

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` (Owner) |
| `Content-Type` | string | Да | `application/json` |

**Request Body:**
```json
{
  "cabinetId": "550e8400-e29b-41d4-a716-446655440000",
  "dataSource": "both",
  "dateFrom": "2025-10-01",
  "dateTo": "2026-01-28",
  "priority": 10
}
```

| Поле | Тип | Обязательный | По умолчанию | Описание |
|------|-----|--------------|--------------|----------|
| `cabinetId` | UUID | Нет | все кабинеты | ID кабинета |
| `dataSource` | enum | Нет | `both` | `reports` (90 дней), `analytics` (365 дней), `both` |
| `dateFrom` | string | Нет | авто | Начало диапазона (YYYY-MM-DD) |
| `dateTo` | string | Нет | авто | Конец диапазона (YYYY-MM-DD) |
| `priority` | number | Нет | `10` | Приоритет задач (1-20, меньше = выше) |

**Response 201:**
```json
{
  "success": true,
  "message": "Backfill started with 26 jobs",
  "jobCount": 26,
  "jobIds": [
    "backfill-reports:cabinet-id:2025-10-01",
    "backfill-reports:cabinet-id:2025-10-08"
  ]
}
```

**Ошибки:**
| Код | Описание |
|-----|----------|
| 401 | Unauthorized |
| 403 | Insufficient permissions (Owner role required) |

---

#### 5. GET /v1/admin/backfill/status

**Описание:** Статус импорта исторических данных

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` (Owner) |

**Query Parameters:**
| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `cabinetId` | UUID | Нет | Фильтр по кабинету |

**Response 200:**
```json
[
  {
    "cabinetId": "550e8400-e29b-41d4-a716-446655440000",
    "cabinetName": "Main Cabinet",
    "reportsStatus": "in_progress",
    "analyticsStatus": "pending",
    "overallProgress": 35,
    "estimatedEta": "2026-01-28T14:30:00.000Z",
    "errors": []
  },
  {
    "cabinetId": "660e8400-e29b-41d4-a716-446655440001",
    "cabinetName": "Secondary Cabinet",
    "reportsStatus": "completed",
    "analyticsStatus": "completed",
    "overallProgress": 100,
    "estimatedEta": null,
    "errors": []
  }
]
```

**Статусы:**
| Статус | Описание |
|--------|----------|
| `not_started` | Не запускался |
| `pending` | Ожидает выполнения |
| `in_progress` | Выполняется |
| `completed` | Завершен |
| `failed` | Ошибка |
| `paused` | Приостановлен |

---

#### 6. POST /v1/admin/backfill/pause

**Описание:** Приостановка импорта

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` (Owner) |
| `Content-Type` | string | Да | `application/json` |

**Request Body:**
```json
{
  "cabinetId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Backfill paused successfully"
}
```

---

#### 7. POST /v1/admin/backfill/resume

**Описание:** Возобновление приостановленного импорта

**Headers:**
| Header | Тип | Обязательный | Описание |
|--------|-----|--------------|----------|
| `Authorization` | string | Да | `Bearer {{token}}` (Owner) |
| `Content-Type` | string | Да | `application/json` |

**Request Body:**
```json
{
  "cabinetId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Backfill resumed successfully"
}
```

---

## TypeScript интерфейсы

```typescript
// ============================================================
// Trends API
// ============================================================

type TrendsAggregation = 'day' | 'week' | 'month';

interface TrendsQueryParams {
  from: string;              // YYYY-MM-DD
  to: string;                // YYYY-MM-DD
  aggregation?: TrendsAggregation;
  metrics?: string;          // comma-separated
}

interface TrendDataPoint {
  date: string;
  ordersCount: number;
  revenue: number;
  cancellations: number;
  cancellationRate: number;
  returns: number;
  returnRate: number;
  avgOrderValue: number;
}

interface TrendsSummary {
  totalOrders: number;
  totalRevenue: number;
  avgDailyOrders: number;
  cancellationRate: number;
  returnRate: number;
}

interface DataSourceInfo {
  primary: string;
  extended?: string;
  aggregated?: string;
}

interface TrendsPeriodInfo {
  from: string;
  to: string;
  aggregation: string;
  daysIncluded: number;
}

interface TrendsResponse {
  trends: TrendDataPoint[];
  summary: TrendsSummary;
  dataSource: DataSourceInfo;
  period: TrendsPeriodInfo;
}

// ============================================================
// Seasonal API
// ============================================================

type SeasonalView = 'weekly' | 'monthly' | 'quarterly';

interface SeasonalQueryParams {
  months?: number;           // 1-12
  view?: SeasonalView;
}

interface MonthlyPattern {
  month: string;
  avgOrders: number;
  avgRevenue: number;
}

interface WeekdayPattern {
  dayOfWeek: string;
  avgOrders: number;
  peakHour?: number;
}

interface QuarterlyPattern {
  quarter: string;           // Q1, Q2, Q3, Q4
  avgOrders: number;
  avgRevenue: number;
}

interface SeasonalPatterns {
  monthly?: MonthlyPattern[];
  weekday?: WeekdayPattern[];
  quarterly?: QuarterlyPattern[];
}

interface SeasonalInsights {
  peakMonth: string;
  lowMonth: string;
  peakDayOfWeek: string;
  seasonalityIndex: number;  // 0-1
}

interface SeasonalResponse {
  patterns: SeasonalPatterns;
  insights: SeasonalInsights;
}

// ============================================================
// Compare API
// ============================================================

interface CompareQueryParams {
  period1_from: string;
  period1_to: string;
  period2_from: string;
  period2_to: string;
}

interface PeriodMetrics {
  from: string;
  to: string;
  ordersCount: number;
  revenue: number;
  cancellationRate: number;
  avgOrderValue: number;
}

interface ComparisonMetrics {
  ordersChange: number;
  ordersChangePercent: number;
  revenueChange: number;
  revenueChangePercent: number;
  cancellationRateChange: number;
  avgOrderValueChange: number;
  avgOrderValueChangePercent: number;
}

interface CompareResponse {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  comparison: ComparisonMetrics;
}

// ============================================================
// Backfill Admin API
// ============================================================

type BackfillDataSource = 'reports' | 'analytics' | 'both';
type BackfillStatus = 'not_started' | 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';

interface StartBackfillRequest {
  cabinetId?: string;
  dataSource?: BackfillDataSource;
  dateFrom?: string;
  dateTo?: string;
  priority?: number;         // 1-20
}

interface StartBackfillResponse {
  success: boolean;
  message: string;
  jobCount: number;
  jobIds: string[];
}

interface BackfillStatusResponse {
  cabinetId: string;
  cabinetName?: string;
  reportsStatus: BackfillStatus;
  analyticsStatus: BackfillStatus;
  overallProgress: number;   // 0-100
  estimatedEta: string | null;
  errors: string[];
}

interface BackfillActionRequest {
  cabinetId: string;
}

interface BackfillActionResponse {
  success: boolean;
  message: string;
}
```

---

## Примеры использования

### React Query хуки

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Trends
export function useTrends(params: TrendsQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'trends', params],
    queryFn: () => api.get<TrendsResponse>('/v1/analytics/orders/trends', { params }),
    staleTime: 5 * 60 * 1000, // 5 минут (совпадает с кэшем бэкенда)
  });
}

// Seasonal
export function useSeasonal(params?: SeasonalQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'seasonal', params],
    queryFn: () => api.get<SeasonalResponse>('/v1/analytics/orders/seasonal', { params }),
    staleTime: 5 * 60 * 1000,
  });
}

// Compare
export function useCompare(params: CompareQueryParams) {
  return useQuery({
    queryKey: ['analytics', 'compare', params],
    queryFn: () => api.get<CompareResponse>('/v1/analytics/orders/compare', { params }),
    staleTime: 5 * 60 * 1000,
  });
}

// Backfill Status (admin)
export function useBackfillStatus(cabinetId?: string) {
  return useQuery({
    queryKey: ['admin', 'backfill', 'status', cabinetId],
    queryFn: () => api.get<BackfillStatusResponse[]>('/v1/admin/backfill/status', {
      params: cabinetId ? { cabinetId } : undefined,
    }),
    refetchInterval: 10000, // Обновлять каждые 10 сек
  });
}

// Start Backfill (admin)
export function useStartBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartBackfillRequest) =>
      api.post<StartBackfillResponse>('/v1/admin/backfill/start', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backfill'] });
    },
  });
}

// Pause Backfill (admin)
export function usePauseBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cabinetId: string) =>
      api.post<BackfillActionResponse>('/v1/admin/backfill/pause', { cabinetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backfill'] });
    },
  });
}

// Resume Backfill (admin)
export function useResumeBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cabinetId: string) =>
      api.post<BackfillActionResponse>('/v1/admin/backfill/resume', { cabinetId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'backfill'] });
    },
  });
}
```

### Пример компонента графика трендов

```typescript
import { useTrends } from '@/hooks/useAnalytics';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function TrendsChart({ dateRange }: { dateRange: { from: string; to: string } }) {
  const { data, isLoading, error } = useTrends({
    from: dateRange.from,
    to: dateRange.to,
    aggregation: 'day',
  });

  if (isLoading) return <Skeleton className="h-[400px]" />;
  if (error) return <ErrorAlert error={error} />;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Всего заказов"
          value={data.summary.totalOrders.toLocaleString()}
        />
        <StatCard
          title="Выручка"
          value={`${(data.summary.totalRevenue / 1000000).toFixed(2)}M`}
        />
        <StatCard
          title="Средний чек"
          value={`${Math.round(data.summary.totalRevenue / data.summary.totalOrders)}`}
        />
        <StatCard
          title="Отмены"
          value={`${data.summary.cancellationRate.toFixed(1)}%`}
          trend="negative"
        />
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data.trends}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="ordersCount" stroke="#8884d8" name="Заказы" />
          <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Выручка" />
        </LineChart>
      </ResponsiveContainer>

      {/* Data Source */}
      <div className="text-sm text-muted-foreground">
        Источник: {data.dataSource.primary}
        {data.dataSource.extended && ` + ${data.dataSource.extended}`}
        {data.dataSource.aggregated && ` + ${data.dataSource.aggregated}`}
      </div>
    </div>
  );
}
```

---

## Изменения для фронтенда

### Дашборд аналитики

- [ ] Расширить выбор периода до 365 дней
- [ ] Добавить переключатель агрегации (день/неделя/месяц)
- [ ] Добавить график трендов заказов
- [ ] Добавить график выручки
- [ ] Показывать источник данных

### Сезонный анализ

- [ ] Новая вкладка "Сезонность"
- [ ] График по месяцам года
- [ ] График по дням недели
- [ ] Карточки insights (пиковые периоды)

### Сравнение периодов

- [ ] Новая вкладка "Сравнение"
- [ ] Выбор двух периодов для сравнения
- [ ] Таблица с изменениями
- [ ] Визуализация процентных изменений

### Админ-панель (Owner only)

- [ ] Раздел "Backfill" в админке
- [ ] Кнопка запуска импорта
- [ ] Прогресс-бар по кабинетам
- [ ] Кнопки pause/resume
- [ ] Лог ошибок

---

## Rate Limits и Кэширование

| Эндпоинт | Rate Limit | Cache TTL |
|----------|------------|-----------|
| `/v1/analytics/orders/trends` | 60 req/min | 5 минут |
| `/v1/analytics/orders/seasonal` | 60 req/min | 5 минут |
| `/v1/analytics/orders/compare` | 60 req/min | 5 минут |
| `/v1/admin/backfill/*` | 10 req/min | - |

---

## Связанные документы

- Story 51.1: Data Source Integration
- Story 51.2: Data Merge Strategy
- Story 51.3: Aggregation Tables
- Story 51.4: Historical Trends API
- Story 51.5: Backfill Strategy
