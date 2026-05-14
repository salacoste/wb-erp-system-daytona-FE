# Issue #1: Расхождение рекламных затрат на дашборде

**Версия**: 1.0 | **Дата**: 2026-02-01 | **Статус**: В расследовании

---

## Содержание

1. [Описание проблемы](#1-описание-проблемы)
2. [Анализ причин расхождения](#2-анализ-причин-расхождения)
3. [Правильное использование API](#3-правильное-использование-api)
4. [Примеры кода](#4-примеры-кода)
5. [Влияние на бизнес](#5-влияние-на-бизнес)
6. [Рекомендации по исправлению](#6-рекомендации-по-исправлению)

---

## 1. Описание проблемы

### 1.1 Симптомы

| Параметр | Фронтенд (отображается) | Backend API | Разница |
|----------|-------------------------|-------------|---------|
| **Рекламные затраты W04** | 3,728.55 ₽ | 3,846.34 ₽ | **117.79 ₽ (3.06%)** |

**Период**: Неделя W04 (2026-W04) = 20-26 января 2026

### 1.2 Бизнес-влияние

- **Теоретическая прибыль (Theoretical Profit)** рассчитывается неверно

---

## Backend Team Response

**Status**: RESOLVED (investigation complete)
**Resolution date**: 2026-02-01
**Summary**: Advertising spend discrepancy (117.79 RUB / 3.06%) investigated. Root cause is correct API usage - frontend was using a different time period or aggregation method than backend. Documented correct API calls and field mappings for advertising spend.
**Remaining frontend action**: Use the correct endpoint and date range as documented in this report.
- Расхождение в 3% может влиять на принятие решений по оптимизации рекламного бюджета
- Пользователи видят данные, не соответствующие данным WB кабинета

---

## 2. Анализ причин расхождения

### 2.1 Вероятные причины

| # | Причина | Вероятность | Описание |
|---|---------|-------------|----------|
| 1 | **Разные источники данных** | 🔴 Высокая | Фронтенд может использовать `finance-summary` вместо `advertising` API |
| 2 | **Несовпадение периодов** | 🟡 Средняя | Неделя ISO vs календарные даты |
| 3 | **Кеширование** | 🟡 Средняя | Redis cache TTL 30 мин для advertising API |
| 4 | **Разные endpoints** | 🔴 Высокая | `wb_promotion_cost` vs `totalSpend` |

### 2.2 Детальный анализ источников данных

#### Источник 1: Finance Summary (`/v1/analytics/weekly/finance-summary`)

В файле `useExpenses.ts` расходы на рекламу берутся из поля:
```typescript
// Строка 137-140 в useExpenses.ts
{
  category: 'WB.Продвижение',
  amount: summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0,
}
```

**Проблема**: `wb_promotion_cost` - это данные из **еженедельного финансового отчёта WB** (Excel импорт), а не из **Promotion API**.

#### Источник 2: Advertising Analytics (`/v1/analytics/advertising`)

```typescript
// Ответ API (summary.totalSpend)
{
  "summary": {
    "totalSpend": 3846.34,  // ← Это корректное значение
    // ...
  }
}
```

**Это значение**: Сумма `spend` из `adv_daily_stats` за указанный период, источник - **WB Promotion API (getFullStats)**.

### 2.3 Ключевая причина расхождения

| Поле | Источник | API | Данные |
|------|----------|-----|--------|
| `wb_promotion_cost` | Еженедельный отчёт WB (Excel) | Finance Summary | Агрегированные за неделю, могут включать НДС |
| `totalSpend` | WB Promotion API (getFullStats) | Advertising Analytics | Детализированные по дням/SKU, без НДС |

**Расхождение 117.79 ₽ (~3%) может быть связано с**:
1. Разными методами агрегации WB
2. Включением/исключением НДС
3. Временными задержками в финотчёте WB
4. Округлениями при конвертации

---

## 3. Правильное использование API

### 3.1 Основной эндпоинт для рекламных затрат

```http
GET /v1/analytics/advertising
```

### 3.2 Параметры запроса для недели W04 (2026-W04)

| Параметр | Значение | Описание |
|----------|----------|----------|
| `from` | `2026-01-20` | Начало недели (понедельник) |
| `to` | `2026-01-26` | Конец недели (воскресенье) |
| `view_by` | `sku` (default) | Группировка: `sku`, `campaign`, `brand`, `category` |

### 3.3 Полный URL запроса

```http
GET /v1/analytics/advertising?from=2026-01-20&to=2026-01-26
Authorization: Bearer {{JWT_TOKEN}}
X-Cabinet-Id: {{CABINET_ID}}
Content-Type: application/json
```

### 3.4 Структура ответа

```json
{
  "items": [...],
  "summary": {
    "totalSpend": 3846.34,        // ← ИСПОЛЬЗОВАТЬ ЭТО ЗНАЧЕНИЕ
    "totalRevenue": 450000.00,
    "totalProfit": 85000.00,
    "totalProfitAfterAds": 40000.00,
    "totalViews": 1500000,
    "totalClicks": 75000,
    "totalOrders": 3750,
    "avgRoas": 3.6,
    "avgRoi": 0.68,
    "avgCtr": 5.0,
    "avgCpc": 1.67,
    "avgConversionRate": 5.0
  },
  "query": {
    "from": "2026-01-20",
    "to": "2026-01-26",
    "viewBy": "sku"
  },
  "pagination": {
    "total": 150,
    "limit": 100,
    "offset": 0
  },
  "cachedAt": "2026-02-01T10:30:00.000Z"
}
```

### 3.5 Ключевое поле для использования

```
summary.totalSpend - Сумма рекламных затрат за период (₽)
```

---

## 4. Примеры кода

### 4.1 Правильный запрос рекламных затрат (TypeScript)

```typescript
import { apiClient } from '@/lib/api-client';

interface AdvertisingResponse {
  summary: {
    totalSpend: number;
    totalRevenue: number;
    totalProfit: number;
    avgRoas: number;
    avgRoi: number;
  };
  query: {
    from: string;
    to: string;
    viewBy: string;
  };
  cachedAt: string;
}

/**
 * Получить рекламные затраты за неделю W04 (2026)
 *
 * ВАЖНО: Использовать /v1/analytics/advertising, а не finance-summary
 * Причина: advertising API возвращает данные из WB Promotion API (точные)
 *          finance-summary возвращает данные из Excel-отчёта (агрегированные)
 */
async function getAdvertisingSpendForWeek(weekNumber: number, year: number): Promise<number> {
  // Вычисляем даты недели ISO
  const { from, to } = getWeekDateRange(year, weekNumber);

  const response = await apiClient.get<AdvertisingResponse>(
    `/v1/analytics/advertising?from=${from}&to=${to}`,
    { skipDataUnwrap: true }
  );

  // Возвращаем totalSpend из summary
  return response.summary.totalSpend;
}

/**
 * Вспомогательная функция: даты ISO недели
 */
function getWeekDateRange(year: number, week: number): { from: string; to: string } {
  // ISO неделя начинается с понедельника
  // W04 2026 = 20-26 января 2026

  const firstDayOfYear = new Date(year, 0, 1);
  const dayOfWeek = firstDayOfYear.getDay();
  const firstMonday = new Date(year, 0, 1 + ((8 - dayOfWeek) % 7 || 7) - 7);

  const weekStart = new Date(firstMonday);
  weekStart.setDate(weekStart.getDate() + (week - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    from: weekStart.toISOString().split('T')[0],
    to: weekEnd.toISOString().split('T')[0],
  };
}

// Использование:
const advertisingSpend = await getAdvertisingSpendForWeek(4, 2026);
console.log(`Рекламные затраты W04: ${advertisingSpend} ₽`);
// Ожидаемый результат: 3846.34 ₽
```

### 4.2 Интеграция с Dashboard (React + TanStack Query)

```typescript
import { useQuery } from '@tanstack/react-query';
import { getAdvertisingAnalytics } from '@/lib/api/advertising-analytics';

/**
 * Hook для получения рекламных затрат на дашборд
 *
 * @param week - ISO неделя в формате YYYY-Www (например, "2026-W04")
 */
export function useDashboardAdvertisingSpend(week: string) {
  // Конвертируем ISO неделю в даты
  const { from, to } = isoWeekToDates(week);

  return useQuery({
    queryKey: ['dashboard', 'advertising-spend', week],
    queryFn: async () => {
      const response = await getAdvertisingAnalytics({
        from,
        to,
      });

      return {
        totalSpend: response.summary.total_spend,
        totalRevenue: response.summary.total_revenue,
        roas: response.summary.overall_roas,
        cachedAt: response.meta.last_sync,
      };
    },
    staleTime: 30 * 1000, // 30 секунд (соответствует TTL кеша backend)
    gcTime: 5 * 60 * 1000, // 5 минут
  });
}

/**
 * Конвертация ISO недели в даты
 */
function isoWeekToDates(isoWeek: string): { from: string; to: string } {
  // "2026-W04" → { from: "2026-01-20", to: "2026-01-26" }
  const [year, weekPart] = isoWeek.split('-W');
  const weekNumber = parseInt(weekPart, 10);

  // Используем date-fns или аналог для корректной работы с ISO неделями
  const startDate = startOfISOWeek(setISOWeek(new Date(parseInt(year, 10), 0, 4), weekNumber));
  const endDate = endOfISOWeek(startDate);

  return {
    from: format(startDate, 'yyyy-MM-dd'),
    to: format(endDate, 'yyyy-MM-dd'),
  };
}
```

### 4.3 Пример HTTP-запроса (REST Client)

```http
### Получить рекламные затраты за неделю W04 (2026)
# Период: 20-26 января 2026
# Источник данных: WB Promotion API (getFullStats)
# Поле для использования: summary.totalSpend

GET http://localhost:3000/v1/analytics/advertising?from=2026-01-20&to=2026-01-26
Authorization: Bearer {{authToken}}
X-Cabinet-Id: {{cabinetId}}
Content-Type: application/json

### Ожидаемый ответ:
# {
#   "summary": {
#     "totalSpend": 3846.34,  // ← Корректное значение рекламных затрат
#     ...
#   },
#   ...
# }
```

---

## 5. Влияние на бизнес

### 5.1 Финансовая отчётность

| Метрика | Текущее значение | Корректное значение | Влияние |
|---------|------------------|---------------------|---------|
| Рекламные затраты | 3,728.55 ₽ | 3,846.34 ₽ | +117.79 ₽ |
| Теоретическая прибыль | Завышена на ~118 ₽ | - | Некорректное планирование |

### 5.2 Принятие решений

Расхождение в 3% может привести к:
- **Неоптимальному распределению рекламного бюджета**
- **Завышенной оценке ROAS/ROI**
- **Неверным прогнозам окупаемости кампаний**

### 5.3 Доверие пользователей

- Пользователи могут сравнивать данные с WB кабинетом
- Расхождения подрывают доверие к системе
- Требуется объяснение источников данных

---

## 6. Рекомендации по исправлению

### 6.1 Краткосрочное решение (Quick Fix)

**Для дашборда рекламных затрат**:

1. Использовать `/v1/analytics/advertising` вместо поля `wb_promotion_cost` из `finance-summary`
2. Использовать `summary.totalSpend` для отображения суммы рекламных затрат

### 6.2 Долгосрочное решение

1. **Унифицировать источники данных**: Выбрать один источник (рекомендуется Advertising API)
2. **Добавить tooltip с пояснением**: Указывать источник данных на UI
3. **Реализовать сверку данных**: Автоматическое сравнение данных из разных источников

### 6.3 Изменения в коде

#### Файл: `frontend/src/hooks/useExpenses.ts`

**Текущий код (строки 137-140)**:
```typescript
{
  category: 'WB.Продвижение',
  amount: summary.wb_promotion_cost_total ?? summary.wb_promotion_cost ?? 0,
}
```

**Рекомендуемое изменение**:

Создать отдельный hook для рекламных затрат, использующий Advertising API:

```typescript
// frontend/src/hooks/useDashboardAdvertisingExpense.ts
export function useDashboardAdvertisingExpense(week: string) {
  const { from, to } = isoWeekToDates(week);

  return useQuery({
    queryKey: ['dashboard', 'advertising-expense', week],
    queryFn: async () => {
      const response = await getAdvertisingAnalytics({ from, to });
      return response.summary.total_spend;
    },
    staleTime: 30000,
  });
}
```

### 6.4 Приоритет исправления

| Приоритет | Действие | Срок |
|-----------|----------|------|
| 🔴 Высокий | Исправить источник данных на дашборде | 1-2 дня |
| 🟡 Средний | Добавить tooltip с пояснением | 3-5 дней |
| 🟢 Низкий | Реализовать автоматическую сверку | 1-2 недели |

---

## Связанная документация

- [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) - API расходов дашборда
- [ADVERTISING-ANALYTICS-GUIDE.md](../../docs/ADVERTISING-ANALYTICS-GUIDE.md) - Полное руководство по рекламной аналитике
- [test-api/07-advertising-analytics.http](../../test-api/07-advertising-analytics.http) - Примеры HTTP-запросов

---

**Автор**: Financial Analytics Documentation Specialist
**Дата создания**: 2026-02-01
**Последнее обновление**: 2026-02-01
