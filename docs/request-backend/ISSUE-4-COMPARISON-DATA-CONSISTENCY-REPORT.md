# Отчёт: Issue #4 - Консистентность данных сравнения периодов

**Дата:** 2026-02-01
**Версия:** 1.0
**Статус:** Анализ для Frontend-команды

---

## Содержание

1. [Описание проблемы](#1-описание-проблемы)
2. [Корректное использование API](#2-корректное-использование-api)
3. [Маппинг полей ответа](#3-маппинг-полей-ответа)
4. [Формулы расчёта Delta](#4-формулы-расчёта-delta)
5. [Обработка ISO-недель](#5-обработка-iso-недель)
6. [Примеры кода](#6-примеры-кода)
7. [Чеклист для отладки](#7-чеклист-для-отладки)

---

## 1. Описание проблемы

### Симптомы

Frontend показывает для сравнения W04 vs W03:

| Метрика | Текущее значение (W04) | Предыдущее значение (W03) | Изменение |
|---------|------------------------|---------------------------|-----------|
| Выкупы  | 84 377,52 ₽            | 115 545,95 ₽              | -27,0%    |

Однако backend API `/v1/analytics/weekly/comparison` может возвращать **другие значения**.

### Потенциальные причины несоответствия

| # | Причина | Вероятность | Проверка |
|---|---------|-------------|----------|
| 1 | Frontend использует `sales_gross` вместо `wb_sales_gross` | Высокая | См. раздел 3 |
| 2 | Frontend использует `finance-summary` вместо `comparison` API | Средняя | См. раздел 2 |
| 3 | Неверное маппирование полей `revenue` из comparison | Средняя | См. раздел 3 |
| 4 | Расчёт delta производится на клиенте некорректно | Низкая | См. раздел 4 |
| 5 | Кэширование устаревших данных | Низкая | Очистить кэш |

---

## 2. Корректное использование API

### Рекомендуемый эндпоинт: Comparison API

```http
GET /v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Преимущества:**
- Сервер вычисляет `delta.absolute` и `delta.percent`
- Гарантированная консистентность расчётов
- Единый источник правды

### Альтернатива: Два вызова Finance Summary

```http
# Запрос 1: Текущий период
GET /v1/analytics/weekly/finance-summary?week=2026-W04

# Запрос 2: Предыдущий период
GET /v1/analytics/weekly/finance-summary?week=2026-W03
```

**Недостатки:**
- Два сетевых запроса вместо одного
- Delta рассчитывается на клиенте (риск ошибок)
- Возможны race conditions

### Текущая реализация Frontend

Файл: `src/lib/api/analytics-comparison.ts`

```typescript
export async function getAnalyticsComparison(params: ComparisonParams): Promise<ComparisonResponse> {
  const searchParams = new URLSearchParams({
    period1: params.period1,
    period2: params.period2,
  })
  return apiClient.get<ComparisonResponse>(
    `/v1/analytics/weekly/comparison?${searchParams.toString()}`
  )
}
```

**Вывод:** Frontend корректно использует `comparison` API.

---

## 3. Маппинг полей ответа

### КРИТИЧЕСКИ ВАЖНО: Выбор правильного поля для "Выкупы"

| Поле в API | Значение | Что означает | Использовать для "Выкупы"? |
|------------|----------|--------------|---------------------------|
| `sales_gross` | ~197 000 ₽ | Цена для покупателя (retail_price_with_discount) | ❌ НЕТ |
| `wb_sales_gross` | ~131 000 ₽ | Выручка продавца после комиссии WB | ✅ ДА |
| `sale_gross` | ~292 000 ₽ | NET = sales - returns (retail price) | ❌ НЕТ |

### Структура ответа Comparison API

```json
{
  "comparison": {
    "period1": {
      "label": "2026-W04",
      "data": {
        "revenue_net": 100000.00,    // ← Используется для "Выкупы"
        "cogs_total": 60000.00,
        "profit": 40000.00,
        "margin_pct": 40.0,
        "qty": 80,
        "profit_per_unit": 500.00,
        "roi": 66.67
      }
    },
    "period2": { ... },
    "delta": {
      "revenue_net": { "absolute": 15000.00, "percent": 17.65 },
      "profit": { "absolute": 10000.00, "percent": 33.33 },
      ...
    }
  }
}
```

### Маппинг для UI компонентов

| Метрика UI | Поле из API Response | Frontend Type |
|------------|---------------------|---------------|
| Выкупы / Выручка | `period1.data.revenue_net` или `period1.revenue` | `PeriodMetrics.revenue` |
| Прибыль | `period1.data.profit` или `period1.profit` | `PeriodMetrics.profit` |
| Маржа | `period1.data.margin_pct` или `period1.margin_pct` | `PeriodMetrics.margin_pct` |
| Заказы | `period1.data.qty` или `period1.orders` | `PeriodMetrics.orders` |
| Логистика | `period1.logistics` | `PeriodMetrics.logistics` |
| Хранение | `period1.storage` | `PeriodMetrics.storage` |

### Проверка типов Frontend

Файл: `src/types/analytics-comparison.ts`

```typescript
export interface PeriodMetrics {
  week: string
  revenue: number     // ← Должно содержать wb_sales_gross, НЕ sales_gross
  profit: number
  margin_pct: number
  orders: number
  cogs: number
  logistics: number
  storage: number
  advertising: number
}
```

---

## 4. Формулы расчёта Delta

### Формула на сервере (Comparison API)

```
delta.absolute = period1.value - period2.value
delta.percent = ((period1 - period2) / period2) × 100
```

### Пример расчёта

| Метрика | Period1 (W04) | Period2 (W03) | Delta Absolute | Delta Percent |
|---------|---------------|---------------|----------------|---------------|
| Выручка | 100 000 ₽     | 85 000 ₽      | +15 000 ₽      | +17.65%       |
| Прибыль | 40 000 ₽      | 30 000 ₽      | +10 000 ₽      | +33.33%       |

### Обработка деления на ноль

```typescript
// Если period2.value = 0, то delta.percent = null
// Frontend должен отображать "—" вместо процента
if (delta.percent === null) {
  return '—'
}
```

### Client-side расчёт (fallback)

Файл: `src/lib/api/analytics-comparison.ts`

```typescript
export function calculateDelta(current: number, previous: number): DeltaValue {
  const absolute = current - previous
  const percent = previous !== 0
    ? (absolute / Math.abs(previous)) * 100
    : 0

  return { absolute, percent }
}
```

**ВНИМАНИЕ:** Используйте `Math.abs(previous)` для корректного расчёта при отрицательных значениях.

---

## 5. Обработка ISO-недель

### Формат ISO-недели

```
YYYY-Www
```

| Компонент | Описание | Пример |
|-----------|----------|--------|
| `YYYY` | ISO year (может отличаться от календарного) | 2026 |
| `W` | Литерал "W" (заглавная) | W |
| `ww` | Номер недели (01-53) | 04 |

### Правила ISO-недель

1. **Неделя начинается в понедельник**
2. **Первая неделя года** — неделя, содержащая первый четверг года
3. **Часовой пояс:** `Europe/Moscow`

### Границы недели 2026-W04

| День | Дата | Входит в W04? |
|------|------|---------------|
| Понедельник | 2026-01-19 | ✅ Начало |
| Вторник | 2026-01-20 | ✅ |
| Среда | 2026-01-21 | ✅ |
| Четверг | 2026-01-22 | ✅ |
| Пятница | 2026-01-23 | ✅ |
| Суббота | 2026-01-24 | ✅ |
| Воскресенье | 2026-01-25 | ✅ Конец |

### Получение списка доступных недель

```http
GET /v1/analytics/weekly/available-weeks
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Ответ:**

```json
{
  "data": [
    { "week": "2026-W04", "start_date": "2026-01-19" },
    { "week": "2026-W03", "start_date": "2026-01-12" },
    { "week": "2026-W02", "start_date": "2026-01-05" }
  ]
}
```

### Автоматический выбор периодов для сравнения

```typescript
// Текущая неделя — первая в списке
const currentWeek = weeks[0]?.week; // "2026-W04"

// Предыдущая неделя — вторая в списке
const previousWeek = weeks[1]?.week; // "2026-W03"
```

---

## 6. Примеры кода

### 6.1 Корректный запрос сравнения

```typescript
// src/hooks/useWeekComparison.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { ComparisonResponse } from '@/types/analytics-comparison'

interface UseWeekComparisonParams {
  currentWeek: string
  previousWeek: string
  enabled?: boolean
}

export function useWeekComparison({
  currentWeek,
  previousWeek,
  enabled = true
}: UseWeekComparisonParams) {
  return useQuery({
    queryKey: ['analytics-comparison', currentWeek, previousWeek],
    queryFn: async () => {
      const params = new URLSearchParams({
        period1: currentWeek,
        period2: previousWeek,
      })
      return apiClient.get<ComparisonResponse>(
        `/v1/analytics/weekly/comparison?${params}`
      )
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    enabled: enabled && !!currentWeek && !!previousWeek,
  })
}
```

### 6.2 Компонент отображения "Выкупы"

```typescript
// src/components/SalesComparisonCard.tsx
import { useWeekComparison } from '@/hooks/useWeekComparison'
import { formatCurrency } from '@/lib/utils'

interface SalesComparisonCardProps {
  currentWeek: string
  previousWeek: string
}

export function SalesComparisonCard({ currentWeek, previousWeek }: SalesComparisonCardProps) {
  const { data, isLoading, error } = useWeekComparison({ currentWeek, previousWeek })

  if (isLoading) return <Skeleton />
  if (error) return <ErrorState />

  // КРИТИЧЕСКИ ВАЖНО: используем revenue (который должен быть wb_sales_gross)
  const currentValue = data?.period1?.revenue ?? 0
  const previousValue = data?.period2?.revenue ?? 0
  const delta = data?.delta?.revenue

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выкупы</CardTitle>
        <span>{currentWeek}</span>
      </CardHeader>
      <CardContent>
        {/* Текущее значение */}
        <div className="text-2xl font-bold text-green-500">
          {formatCurrency(currentValue)}
        </div>

        {/* Delta индикатор */}
        {delta && (
          <div className="flex items-center gap-2 mt-2">
            <DeltaIndicator percent={delta.percent} />
            <span className="text-sm text-muted-foreground">
              vs {formatCurrency(previousValue)} ({previousWeek})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

### 6.3 Delta индикатор

```typescript
// src/components/DeltaIndicator.tsx
interface DeltaIndicatorProps {
  percent: number | null
  invertDirection?: boolean // true для расходов
}

export function DeltaIndicator({ percent, invertDirection = false }: DeltaIndicatorProps) {
  if (percent === null) return <span>—</span>

  const isPositive = percent > 0
  // Для расходов: снижение = хорошо (зелёный), рост = плохо (красный)
  const isGood = invertDirection ? !isPositive : isPositive
  const color = isGood ? 'text-green-600' : 'text-red-600'
  const arrow = isPositive ? '↑' : '↓'

  return (
    <span className={color}>
      {arrow} {Math.abs(percent).toFixed(1)}%
    </span>
  )
}
```

### 6.4 Полный workflow загрузки дашборда

```typescript
// src/hooks/useDashboardData.ts
import { useQuery, useQueries } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useDashboardData() {
  // 1. Получаем список доступных недель
  const weeksQuery = useQuery({
    queryKey: ['available-weeks'],
    queryFn: () => apiClient.get('/v1/analytics/weekly/available-weeks'),
  })

  const currentWeek = weeksQuery.data?.data?.[0]?.week
  const previousWeek = weeksQuery.data?.data?.[1]?.week

  // 2. Загружаем данные сравнения (единственный запрос!)
  const comparisonQuery = useQuery({
    queryKey: ['comparison', currentWeek, previousWeek],
    queryFn: () => apiClient.get(
      `/v1/analytics/weekly/comparison?period1=${currentWeek}&period2=${previousWeek}`
    ),
    enabled: !!currentWeek && !!previousWeek,
  })

  return {
    // Периоды
    currentWeek,
    previousWeek,
    availableWeeks: weeksQuery.data?.data ?? [],

    // Данные сравнения
    comparison: comparisonQuery.data,

    // Состояние загрузки
    isLoading: weeksQuery.isLoading || comparisonQuery.isLoading,
    error: weeksQuery.error || comparisonQuery.error,
  }
}
```

---

## 7. Чеклист для отладки

### Шаг 1: Проверить API ответ

```bash
# Выполните запрос в терминале или REST Client
curl -X GET "http://localhost:3000/v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Cabinet-Id: YOUR_CABINET_ID"
```

Сравните значение `period1.data.revenue_net` с тем, что показывает UI.

### Шаг 2: Проверить Network tab в браузере

1. Откройте DevTools → Network
2. Найдите запрос к `/v1/analytics/weekly/comparison`
3. Проверьте параметры `period1` и `period2`
4. Сравните `Response` с UI

### Шаг 3: Проверить маппинг в коде

Файл: `src/components/custom/dashboard/PeriodComparisonSection.tsx`

```typescript
// Строка ~44
const TOP_METRICS: MetricConfig[] = [
  { key: 'revenue', title: 'Выручка', ... }, // ← Выкупы используют 'revenue'
```

Файл: `src/types/analytics-comparison.ts`

```typescript
// Убедитесь, что PeriodMetrics.revenue соответствует wb_sales_gross
export interface PeriodMetrics {
  revenue: number     // ← Должно быть wb_sales_gross
}
```

### Шаг 4: Проверить бэкенд маппинг

Если frontend использует правильное поле, но значения всё равно не совпадают — проверьте, что бэкенд возвращает `wb_sales_gross` в поле `revenue_net`.

### Шаг 5: Очистить кэш

```typescript
// В React Query
queryClient.invalidateQueries({ queryKey: ['analytics-comparison'] })

// Или полная очистка
queryClient.clear()
```

---

## Связанные документы

| Документ | Описание |
|----------|----------|
| [143-DASHBOARD-MAIN-PAGE-PERIODS-API.md](./143-DASHBOARD-MAIN-PAGE-PERIODS-API.md) | API периодов, сравнение, тренды |
| [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) | API продаж, finance-summary |
| [125-DASHBOARD-MAIN-PAGE-GUIDE.md](./125-DASHBOARD-MAIN-PAGE-GUIDE.md) | Сводное руководство дашборда |
| `test-api/05-analytics-basic.http` | HTTP примеры запросов |
| `src/types/analytics-comparison.ts` | TypeScript типы comparison |
| `src/lib/api/analytics-comparison.ts` | API клиент comparison |

---

## Выводы и рекомендации

### Наиболее вероятная причина проблемы

**Несоответствие маппинга полей:**
- Backend возвращает `revenue_net` (который может быть `sale_gross` вместо `wb_sales_gross`)
- Или frontend ожидает `revenue` но backend возвращает другое поле

### Рекомендуемые действия

1. **Сравнить API ответ с UI** — выполнить запрос напрямую и сравнить значения
2. **Проверить бэкенд контроллер** — убедиться, что `comparison` endpoint возвращает `wb_sales_gross` в поле `revenue`
3. **Добавить логирование** — временно добавить `console.log` в хук `useAnalyticsComparison` для отладки
4. **Создать unit-тест** — покрыть тестом маппинг данных comparison

---

**Автор:** Financial Analytics Documentation Specialist
**Версия:** 1.0
**Дата:** 2026-02-01
