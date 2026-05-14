# 149: Epic 67 - Pipeline Health Dashboard API

**Дата создания:** 2026-02-17
**Статус:** COMPLETE - Backend Ready for Frontend Integration
**Epic:** Epic 67 - Pipeline Health Dashboard API
**Stories:** 67.1 (Grid), 67.2 (Dashboard), 67.3 (Telegram), 67.4 (Caching)
**Тесты:** 154 unit tests, QA validated
**Test API:** `test-api/17-monitoring.http` (34 теста)

---

## Quick Start для Frontend

### 1. Загрузка дашборда (первый рендер)

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// Lightweight summary — загружается первым
const { data: dashboard } = useQuery({
  queryKey: ['monitoring', 'dashboard', cabinetId],
  queryFn: () => apiClient.get(`/v1/monitoring/dashboard?cabinetId=${cabinetId}&locale=ru`),
  refetchInterval: 60_000, // совпадает с cache TTL
  staleTime: 50_000,
});
```

### 2. Загрузка heatmap (по навигации)

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-02-17
**Summary**: Epic 67 complete with 154 unit tests. 3 endpoints implemented: `/v1/monitoring/dashboard` (lightweight summary), `/v1/monitoring/pipeline-health-grid` (heatmap with 14 pipelines), `/v1/monitoring/telegram-health` (bot status). Caching, gap detection, and health scoring included.
**Remaining frontend action**: Integrate monitoring dashboard page using provided React Query patterns.
```typescript
// Тяжёлый запрос — грузить только при переходе на вкладку heatmap
const { data: grid } = useQuery({
  queryKey: ['monitoring', 'grid', cabinetId, from, to, resolution],
  queryFn: () => apiClient.get(
    `/v1/monitoring/pipeline-health-grid?cabinetId=${cabinetId}&from=${from}&to=${to}`
  ),
  enabled: isHeatmapTabActive, // lazy load
  refetchInterval: isCurrentPeriod ? 30_000 : 120_000,
});
```

### 3. Загрузка Telegram health

```typescript
const { data: telegram } = useQuery({
  queryKey: ['monitoring', 'telegram', cabinetId],
  queryFn: () => apiClient.get(`/v1/monitoring/telegram-health?cabinetId=${cabinetId}`),
  refetchInterval: 120_000,
});
```

---

## Все API Эндпоинты (3 эндпоинта)

| Метод | Эндпоинт | Описание | Cache TTL | Target p95 |
|-------|----------|----------|-----------|------------|
| GET | `/v1/monitoring/dashboard` | Сводка для начального рендера | 60s | < 200ms |
| GET | `/v1/monitoring/pipeline-health-grid` | Heatmap с ячейками по часам/дням | 30-120s | < 500ms |
| GET | `/v1/monitoring/telegram-health` | Здоровье Telegram-интеграции | 120s | < 300ms |

### Авторизация (все эндпоинты)

```http
Authorization: Bearer {{token}}
```

**Важно:** Эти эндпоинты НЕ используют заголовок `X-Cabinet-Id`. Вместо этого `cabinetId` передаётся как query parameter.

**Ошибки доступа:**
- `401 Unauthorized` — отсутствует или невалидный JWT
- `403 Forbidden` — пользователь не имеет доступа к указанному cabinet

---

## Эндпоинт 1: Dashboard Summary

### GET /v1/monitoring/dashboard

**Назначение:** Главный эндпоинт для начального рендера дашборда мониторинга. Возвращает лёгкую сводку по всем 11 пайплайнам.

### Запрос

```http
GET /v1/monitoring/dashboard?cabinetId={{cabinetId}}&locale=ru
Authorization: Bearer {{token}}
```

**Query Parameters:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|-------------|--------------|----------|
| `cabinetId` | UUID | Да | — | ID кабинета |
| `locale` | string | Нет | `ru` | Язык: `ru` или `en` (влияет на displayName) |

### Ответ (200 OK)

```typescript
interface DashboardResponse {
  success: true;
  data: {
    cabinetId: string;
    generatedAt: string; // ISO8601

    // Блок 1: Общее здоровье системы
    system: {
      overallStatus: 'healthy' | 'degraded' | 'critical';
      healthScore: number;       // 0-100
      lastReportDate: string | null; // ISO8601
      activeAlerts: number;      // кол-во незакрытых алертов
    };

    // Блок 2: Статусы всех 11 пайплайнов
    pipelines: Array<{
      pipelineId: string;        // e.g. "fbo_orders_sync"
      displayName: string;       // "FBO Заказы" (ru) / "FBO Orders" (en)
      category: 'high_frequency' | 'daily' | 'weekly';
      status: 'healthy' | 'warning' | 'critical' | 'stale' | 'no_data';
      lastSuccessAt: string | null;  // ISO8601, когда последний раз успешно
      dataLagMinutes: number | null; // задержка данных в минутах
      successRate24h: number;    // 0-1 (процент успеха за 24ч)
    }>;

    // Блок 3: Быстрый статус Telegram
    telegram: {
      status: 'active' | 'degraded' | 'offline' | 'not_configured';
      deliveryRate7d: number;    // 0-1 (доставляемость за 7 дней)
      recentFailures: number;    // ошибки за 24ч
    };

    // Блок 4: Полнота данных
    dataCompleteness: {
      overallHealth: 'healthy' | 'degraded' | 'critical';
      tables: Array<{
        table: string;           // e.g. "daily_sales_raw"
        displayName: string;     // "Ежедневные продажи" (ru)
        completenessRatio: number; // 0-1
        status: 'complete' | 'incomplete' | 'critical';
      }>;
    };
  };
}
```

### Health Score — формула расчёта

```
healthScore = (pipelineAvg * 0.5 + completenessAvg * 0.3 + telegramRate * 0.1 + noAlerts * 0.1) * 100
```

| Компонент | Вес | Описание |
|-----------|-----|----------|
| `pipelineAvg` | 50% | Среднее по статусам: healthy=1.0, warning=0.7, critical=0.3, stale=0.1, no_data=0.0 |
| `completenessAvg` | 30% | Средний completenessRatio по таблицам |
| `telegramRate` | 10% | deliveryRate7d (1.0 если telegram не настроен) |
| `noAlerts` | 10% | 1.0 если activeAlerts === 0, иначе 0.0 |

**Пороги overallStatus:**
- `healthy` — healthScore >= 80
- `degraded` — healthScore 50-79
- `critical` — healthScore < 50

**Особый случай:** Новый кабинет без данных → healthScore = 0, все пайплайны `no_data`

### Pipeline Status — логика определения

| Статус | Условие | Цвет |
|--------|---------|------|
| `healthy` | dataLag <= 2x ожидаемый интервал | `green-500` |
| `warning` | dataLag <= 4x интервал | `yellow-500` |
| `critical` | dataLag > 8x интервал | `red-500` |
| `stale` | dataLag <= 8x интервал | `gray-500` |
| `no_data` | никогда не синхронизировался | `gray-300` |

---

## Эндпоинт 2: Pipeline Health Grid (Heatmap)

### GET /v1/monitoring/pipeline-health-grid

**Назначение:** Данные для визуализации heatmap (как GitHub contributions). Детальная разбивка по часам/дням для каждого пайплайна.

### Запрос

```http
GET /v1/monitoring/pipeline-health-grid
  ?cabinetId={{cabinetId}}
  &from=2026-02-10T00:00:00Z
  &to=2026-02-17T00:00:00Z
  &resolution=hour
  &pipelines=fbo_orders_sync,adv_sync
  &locale=ru
Authorization: Bearer {{token}}
```

**Query Parameters:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|-------------|--------------|----------|
| `cabinetId` | UUID | Да | — | ID кабинета |
| `from` | ISO8601 | Нет | now - 7d | Начало периода |
| `to` | ISO8601 | Нет | now | Конец периода |
| `resolution` | string | Нет | auto | `hour` или `day` (авто-определяется по категории) |
| `pipelines` | string | Нет | все 11 | Запятая-разделённые pipelineId |
| `locale` | string | Нет | `ru` | Язык: `ru` или `en` |

**Ограничения:**
- Макс. период: **30 дней** (иначе 400 Bad Request)
- `from` должен быть < `to` (иначе 400)
- Hourly resolution авто-переключается на daily при периоде > 7 дней
- Daily/weekly пайплайны всегда используют daily resolution

### Ответ (200 OK)

```typescript
interface PipelineHealthGridResponse {
  success: true;
  data: {
    cabinetId: string;
    period: { from: string; to: string };
    resolution: 'hour' | 'day'; // фактическое (может отличаться от запроса!)
    generatedAt: string;

    // Общая сводка
    summary: {
      overallStatus: 'healthy' | 'degraded' | 'critical';
      healthScore: number;        // 0-100
      totalPipelines: number;     // обычно 11
      healthyPipelines: number;
      degradedPipelines: number;
      criticalPipelines: number;
      totalExecutions: number;
      totalFailures: number;
      successRate: number;        // 0-1
    };

    // Данные по каждому пайплайну
    pipelines: Array<{
      pipelineId: string;
      displayName: string;
      category: 'high_frequency' | 'daily' | 'weekly';
      expectedFrequency: string;  // "every 15 min", "daily at 06:00 MSK"
      cronExpression: string;     // "0,15,30,45 * * * *"
      dataTable: string | null;   // "reports_orders", null если нет таблицы

      // Сводка по пайплайну
      status: 'healthy' | 'warning' | 'critical' | 'stale' | 'no_data';
      healthScore: number;
      lastSuccessAt: string | null;
      lastFailureAt: string | null;
      nextExpectedAt: string | null;
      dataLagMinutes: number | null;
      successRate: number;
      totalExecutions: number;
      totalFailures: number;
      avgDurationMs: number | null;
      totalRowsProcessed: number | null; // null в v1

      // Ячейки heatmap (отсортированы по времени ASC)
      cells: Array<{
        periodStart: string;      // ISO8601
        periodEnd: string;        // ISO8601
        status: CellStatus;       // см. ниже
        executionsExpected: number;
        executionsActual: number;  // = successCount + failureCount + cancelledCount
        successCount: number;
        failureCount: number;
        cancelledCount: number;
        avgDurationMs: number | null;
        maxDurationMs: number | null;
        totalRowsProcessed: number | null; // null в v1

        // Ошибки для tooltip (макс. 5 последних)
        errors: Array<{
          timestamp: string;
          taskUuid: string;
          errorMessage: string;   // обрезан до 200 символов
          retryAttempt: number;
          wasRecovered: boolean;
        }>;
      }>;
    }>;
  };
}

type CellStatus = 'success' | 'partial' | 'failed' | 'missed' | 'no_data' | 'pending' | 'recovered';
```

### Cell Status — 7 статусов (цвета для heatmap)

| Статус | Описание | Рекомендуемый цвет | Приоритет |
|--------|----------|-------------------|-----------|
| `pending` | Период ещё не завершён | `blue-500` (#3b82f6) | 1 (высший) |
| `no_data` | Нет данных, период завершён | `gray-100` (#f3f4f6) | 2 |
| `missed` | Ожидались выполнения, но 0 фактических | `gray-500` (#6b7280) | 3 |
| `recovered` | Были ошибки, но автовосстановление | `emerald-500` (#10b981) | 4 |
| `success` | Все выполнения успешны | `green-500` (#22c55e) | 5 |
| `partial` | Частичный успех (rate >= 50%) | `amber-500` (#f59e0b) | 6 |
| `failed` | Все выполнения провалились (rate < 50%) | `red-500` (#ef4444) | 7 (низший) |

### 11 Пайплайнов (Pipeline Registry)

| pipelineId | displayName (ru) | Категория | Частота | dataTable |
|------------|-----------------|-----------|---------|-----------|
| `fbo_orders_sync` | FBO Заказы | high_frequency | каждые 15 мин | reports_orders |
| `fbo_sales_sync` | FBO Продажи | high_frequency | каждые 15 мин | reports_sales |
| `orders_fbs_sync` | FBS Заказы | high_frequency | каждые 5 мин | orders_fbs |
| `supply_sync` | Поставки | high_frequency | каждые 15 мин | supplies |
| `adv_sync` | Реклама | daily | ежедневно 07:00 MSK | adv_daily_stats |
| `daily_sales_sync` | Ежедневные продажи | daily | ежедневно 06:00 MSK | daily_sales_raw |
| `stocks_sync` | Остатки на складах | daily | ежедневно 06:00 MSK | inventory_snapshots |
| `paid_storage_import` | Платное хранение | daily | ежедневно 06:00 MSK | paid_storage_daily |
| `product_imt_sync` | Товары (IMT) | daily | ежедневно 06:00 MSK | — |
| `finances_weekly_ingest` | Финансовый отчёт | weekly | понедельник | wb_finance_raw |
| `daily_stocks_sync` | Покрытие остатков | daily | ежедневно 03:00 MSK | inventory_snapshots |

### Размер ответа (оценка)

| Сценарий | Период | Примерный размер |
|----------|--------|-----------------|
| 7 дней, hourly, 4 HF пайплайна | 4 × 168 cells + 7 daily × 7 cells | ~25 KB |
| 7 дней, daily only, все 11 | 11 × 7 cells | ~5 KB |
| 30 дней, daily, все 11 | 11 × 30 cells | ~18 KB |

---

## Эндпоинт 3: Telegram Health

### GET /v1/monitoring/telegram-health

**Назначение:** Детальный мониторинг Telegram-интеграции: статус бота, привязка, статистика доставки, настройки.

### Запрос

```http
GET /v1/monitoring/telegram-health?cabinetId={{cabinetId}}&days=7
Authorization: Bearer {{token}}
```

**Query Parameters:**

| Параметр | Тип | Обязательный | По умолчанию | Описание |
|----------|-----|-------------|--------------|----------|
| `cabinetId` | UUID | Да | — | ID кабинета |
| `days` | number | Нет | `7` | Период статистики (макс. 30) |

**Важно:** Этот эндпоинт также использует `userId` из JWT токена для поиска привязки Telegram. Поэтому данные binding-блока привязаны к конкретному пользователю.

### Ответ (200 OK)

```typescript
interface TelegramHealthResponse {
  success: true;
  data: {
    cabinetId: string;
    generatedAt: string;
    period: { from: string; to: string };

    // Статус бота
    bot: {
      status: 'active' | 'degraded' | 'offline' | 'not_configured';
      lastActivityAt: string | null; // последнее уведомление
    };

    // Привязка Telegram для текущего пользователя
    binding: {
      isBound: boolean;
      boundAt: string | null;        // когда привязан
      telegramUsername: string | null; // "@username"
      isVerified: boolean;            // подтверждена ли привязка
    };

    // Статистика доставки за период
    delivery: {
      totalSent: number;
      totalFailed: number;
      totalRateLimited: number;
      totalSkippedQuietHours: number;
      deliveryRate: number;          // 0-1 (sent / (sent + failed))
      avgDeliveryMs: number | null;  // средняя задержка доставки
    };

    // Разбивка по типам событий
    eventBreakdown: Array<{
      eventType: string;             // "task_completed", "task_failed", etc.
      enabled: boolean;              // включен ли этот тип
      sentCount: number;
      failedCount: number;
    }>;

    // Последние ошибки (макс. 10)
    recentFailures: Array<{
      timestamp: string;
      eventType: string;
      errorMessage: string;
    }>;

    // Настройки уведомлений пользователя
    preferences: {
      telegramEnabled: boolean;
      quietHoursEnabled: boolean;
      quietHoursFrom: string | null; // "22:00"
      quietHoursTo: string | null;   // "08:00"
      language: string;              // "ru", "en"
      enabledEvents: string[];       // типы вкл. событий
      disabledEvents: string[];      // типы выкл. событий
    };
  };
}
```

### Bot Status — 4 состояния

| Статус | Условие | UI |
|--------|---------|-----|
| `active` | Бот работает, привязка подтверждена, доставка ОК | Зелёный индикатор |
| `degraded` | >50% ошибок доставки за последний час | Жёлтый индикатор |
| `offline` | Telegram бот отключён в конфигурации | Красный индикатор |
| `not_configured` | Бот включён, но нет подтверждённой привязки | Серый индикатор + CTA "Настроить" |

---

## Стратегия кэширования и polling

### Рекомендуемые интервалы

```typescript
const MONITORING_QUERY_CONFIG = {
  dashboard: {
    refetchInterval: 60_000,   // 60s = cache TTL
    staleTime: 50_000,         // чуть меньше TTL
  },
  gridCurrent: {
    refetchInterval: 30_000,   // 30s для текущего периода
    staleTime: 25_000,
  },
  gridPast: {
    refetchInterval: 120_000,  // 120s для исторических данных
    staleTime: 110_000,
  },
  telegram: {
    refetchInterval: 120_000,  // 120s = cache TTL
    staleTime: 110_000,
  },
};
```

### Smart Polling — текущий vs исторический период

```typescript
function useGridData(cabinetId: string, from: string, to: string) {
  const isCurrentPeriod = new Date(to).getTime() >= Date.now() - 3600_000;

  return useQuery({
    queryKey: ['monitoring', 'grid', cabinetId, from, to],
    queryFn: () => apiClient.get(
      `/v1/monitoring/pipeline-health-grid?cabinetId=${cabinetId}&from=${from}&to=${to}`
    ),
    ...isCurrentPeriod
      ? MONITORING_QUERY_CONFIG.gridCurrent
      : MONITORING_QUERY_CONFIG.gridPast,
  });
}
```

---

## Обработка ошибок

### Коды ошибок

| HTTP Code | Причина | Действие на Frontend |
|-----------|---------|---------------------|
| 400 | Невалидные параметры (период > 30 дней, from > to) | Показать validation error |
| 401 | Невалидный/отсутствующий JWT | Redirect на login |
| 403 | Нет доступа к кабинету | Показать "Доступ запрещён" |

### Формат ошибок

```json
{
  "statusCode": 400,
  "message": "Maximum period is 30 days",
  "error": "Bad Request"
}

{
  "statusCode": 403,
  "message": "Access denied: No access to this cabinet",
  "error": "Forbidden"
}
```

### Особый случай: новый кабинет

При healthScore === 0 и все пайплайны в статусе `no_data`:

```typescript
function isNewCabinet(dashboard: DashboardSummary): boolean {
  return dashboard.system.healthScore === 0
    && dashboard.pipelines.every(p => p.status === 'no_data');
}

// Показать empty state:
// "Данные ещё не загружены. Синхронизация начнётся автоматически."
```

---

## Рекомендации по архитектуре страницы

### Порядок загрузки данных

```
1. GET /v1/monitoring/dashboard         ← первый запрос (лёгкий, ~2KB)
   ├── Рендерим healthScore виджет
   ├── Рендерим pipeline status cards
   ├── Рендерим telegram quick status
   └── Рендерим data completeness

2. GET /v1/monitoring/pipeline-health-grid  ← по навигации на вкладку heatmap
   └── Рендерим heatmap сетку

3. GET /v1/monitoring/telegram-health      ← по навигации на вкладку telegram
   └── Рендерим детальный Telegram-панель
```

### Предлагаемая структура компонентов

```
monitoring/
├── page.tsx                          # Страница мониторинга
├── components/
│   ├── health-score-widget.tsx       # Круговой индикатор 0-100
│   ├── pipeline-status-grid.tsx      # 11 карточек пайплайнов
│   ├── pipeline-heatmap.tsx          # GitHub-style heatmap
│   ├── heatmap-cell.tsx              # Одна ячейка с tooltip
│   ├── heatmap-tooltip.tsx           # Popup с деталями ячейки
│   ├── telegram-status-card.tsx      # Quick status из dashboard
│   ├── telegram-detail-panel.tsx     # Полная панель из telegram-health
│   ├── data-completeness-table.tsx   # Таблица полноты данных
│   └── monitoring-empty-state.tsx    # Empty state для нового кабинета
├── hooks/
│   ├── use-dashboard.ts              # useQuery для dashboard
│   ├── use-pipeline-grid.ts          # useQuery для grid
│   └── use-telegram-health.ts        # useQuery для telegram
└── types/
    └── monitoring.ts                 # TypeScript интерфейсы
```

---

## Ссылки и связанная документация

### Backend References

| Ресурс | Расположение | Описание |
|--------|-------------|----------|
| **Frontend Guide (полный)** | [`docs/PIPELINE-HEALTH-DASHBOARD-FRONTEND-GUIDE.md`](../../../docs/PIPELINE-HEALTH-DASHBOARD-FRONTEND-GUIDE.md) | UI rendering code, React компоненты, цвета, tooltip |
| **API Paths Reference** | [`docs/API-PATHS-REFERENCE.md`](../../../docs/API-PATHS-REFERENCE.md) | Все эндпоинты backend |
| **Test API** | [`test-api/17-monitoring.http`](../../../test-api/17-monitoring.http) | 34 HTTP теста для проверки |
| **Swagger UI** | `http://localhost:3000/api` | Live API документация |
| **DTO файлы** | `src/monitoring/dto/` | TypeScript интерфейсы backend |
| **Pipeline Registry** | `src/monitoring/pipeline-registry.ts` | 11 пайплайнов: ID, cron, таблицы |
| **Controller** | `src/monitoring/monitoring.controller.ts` | Все 3 эндпоинта |

### Frontend References

| Ресурс | Расположение |
|--------|-------------|
| API Client | `src/lib/api-client.ts` |
| Routes | `src/lib/routes.ts` |
| Query Hooks Pattern | `src/hooks/` (пример: `use-inventory-summary.ts`) |

### OpenMemory

Все данные Epic 67 загружены в OpenMemory. Для поиска:
```bash
# Через MCP tools
search_memory("[API] Epic-67")         # 3 API эндпоинта
search_memory("[IMPL] Epic-67")        # 4 паттерна реализации
search_memory("[LOGIC] Epic-67")       # 3 формулы
search_memory("PIPELINE_REGISTRY")     # Реестр 11 пайплайнов
```

---

## Checklist для Frontend-команды

- [ ] Создать страницу `/monitoring` (или добавить tab в существующий дашборд)
- [ ] Реализовать `use-dashboard.ts` hook с polling 60s
- [ ] Реализовать Health Score виджет (круговой/полукруговой индикатор)
- [ ] Реализовать Pipeline Status Grid (11 карточек со статусами)
- [ ] Реализовать Heatmap компонент (GitHub-style grid)
- [ ] Реализовать Heatmap Cell Tooltip (hover → детали + ошибки)
- [ ] Реализовать Telegram Quick Status (из dashboard endpoint)
- [ ] Реализовать Telegram Detail Panel (из telegram-health endpoint)
- [ ] Реализовать Data Completeness Table (6 таблиц)
- [ ] Обработать empty state для нового кабинета (healthScore = 0)
- [ ] Обработать 403 Forbidden (нет доступа к кабинету)
- [ ] Добавить locale переключение (ru/en) для displayName
- [ ] Добавить фильтр по пайплайнам для heatmap
- [ ] Добавить date range picker (от/до, макс. 30 дней)
- [ ] Добавить переключение resolution (hour/day) для heatmap
- [ ] Тестирование с `test-api/17-monitoring.http`

---

**Last Updated:** 2026-02-17
**Epic:** 67 - Pipeline Health Dashboard API
