# Dashboard Main Page - Сводное руководство для Frontend

**Версия:** 1.0
**Дата:** 2026-01-31
**Статус:** Ready for Implementation

---

## Оглавление

1. [Обзор бизнес-задачи](#1-обзор-бизнес-задачи)
2. [Карта сущностей и API](#2-карта-сущностей-и-api)
3. [Формула теоретической прибыли](#3-формула-теоретической-прибыли)
4. [Временные разрезы](#4-временные-разрезы)
5. [Quick Start: Минимальный набор запросов](#5-quick-start-минимальный-набор-запросов)
6. [Детальная документация](#6-детальная-документация)
7. [Рекомендации по реализации UI](#7-рекомендации-по-реализации-ui)

---

## 1. Обзор бизнес-задачи

### Требования к главной странице

Дашборд должен отображать следующие бизнес-сущности в двух временных разрезах:

| # | Сущность | Описание | Тип |
|---|----------|----------|-----|
| 1 | **Заказы** | Заказы FBS с разбивкой по дням | Revenue potential |
| 2 | **COGS по заказам** | Себестоимость товаров в заказах | Cost |
| 3 | **Выкупы** | Фактические продажи (реализованный товар) | Revenue |
| 4 | **COGS по выкупам** | Себестоимость проданных товаров | Cost |
| 5 | **Рекламные затраты** | Расходы на рекламу, ROAS, органика | Expense |
| 6 | **Логистика** | Стоимость доставки и возвратов | Expense |
| 7 | **Хранение** | Затраты на хранение на складах | Expense |

### Временные разрезы

| Режим | Описание | Переключение |
|-------|----------|--------------|
| **Неделя** | По дням за последнюю (актуальную) неделю | Dropdown с выбором предыдущих недель |
| **Месяц** | По дням за последний (завершенный) месяц | Dropdown с выбором предыдущих месяцев |

---

## 2. Карта сущностей и API

### Сводная таблица эндпоинтов

| Сущность | Основной эндпоинт | Документация |
|----------|-------------------|--------------|
| **Заказы** | `GET /v1/orders`, `GET /v1/analytics/orders/volume` | [121-DASHBOARD-MAIN-PAGE-ORDERS-API.md](./121-DASHBOARD-MAIN-PAGE-ORDERS-API.md) |
| **COGS** | `GET /v1/cogs`, `GET /v1/analytics/weekly/by-sku?includeCogs=true` | [121-DASHBOARD-MAIN-PAGE-ORDERS-API.md](./121-DASHBOARD-MAIN-PAGE-ORDERS-API.md) |
| **Выкупы/Продажи** | `GET /v1/analytics/weekly/finance-summary`, `GET /v1/analytics/weekly/trends` | [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) |
| **Рекламные затраты** | `GET /v1/analytics/advertising` | [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) |
| **Логистика** | `GET /v1/analytics/weekly/finance-summary` (поле `logistics_cost`) | [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) |
| **Хранение** | `GET /v1/analytics/storage/by-sku`, `GET /v1/analytics/weekly/finance-summary` | [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) |
| **Периоды** | `GET /v1/analytics/weekly/available-weeks` | [124-DASHBOARD-MAIN-PAGE-PERIODS-API.md](./124-DASHBOARD-MAIN-PAGE-PERIODS-API.md) |

### Обязательные заголовки

```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
Content-Type: application/json
```

---

## 3. Формула теоретической прибыли

### Бизнес-формула

```
Теоретическая прибыль = Выкупы - COGS - Рекламные затраты - Логистика - Хранение
```

> ⚠️ **ВАЖНО:** Рекомендуется использовать **Выкупы (Sales)** вместо Заказов в формуле.
> FBS-заказы могут отсутствовать за периоды до активации синхронизации.
> См. [129-FBS-DATA-ANALYSIS-REPORT.md](./129-FBS-DATA-ANALYSIS-REPORT.md) для деталей.

### Реализация через API (РЕКОМЕНДУЕМАЯ)

```typescript
interface TheoreticalProfit {
  sales: number;           // /v1/analytics/weekly/finance-summary → summary_total.wb_sales_gross_total
  cogs: number;            // /v1/analytics/weekly/finance-summary → summary_total.cogs_total
  advertisingCost: number; // /v1/analytics/advertising → summary.totalSpend
  logisticsCost: number;   // /v1/analytics/weekly/finance-summary → summary_total.logistics_cost_total
  storageCost: number;     // /v1/analytics/weekly/finance-summary → summary_total.storage_cost_total
  theoreticalProfit: number;
}

function calculateTheoreticalProfit(data: TheoreticalProfit): number {
  return data.sales - data.cogs - data.advertisingCost - data.logisticsCost - data.storageCost;
}

// Пример W04: 84377.52 - 35818 - 3728.55 - 17566.04 - 2024.94 = 25239.99 ₽
```

### Альтернатива: Использовать Operating Profit

Если формула "Теор. прибыль" соответствует Operating Profit, можно использовать готовое поле:

```http
GET /v1/analytics/cabinet-summary?weeks=1
```

**Ответ содержит:**
```json
{
  "summary": {
    "totals": {
      "operating_profit": 809800.00,
      "operating_margin_pct": 53.99
    }
  }
}
```

---

## 4. Временные разрезы

### 4.1 Недельный вид

**Архитектурная особенность:** Система работает с **ISO-неделями** (Пн-Вс), а не с календарными датами.

```http
# 1. Получить список доступных недель
GET /v1/analytics/weekly/available-weeks

# 2. Получить данные за выбранную неделю
GET /v1/analytics/weekly/finance-summary?week=2026-W04
```

### 4.2 Месячный вид

**ВАЖНО:** Эндпоинта для месяцев НЕТ! Месячный вид реализуется через диапазон ISO-недель.

```typescript
// Конвертация месяца в диапазон недель
function monthToWeekRange(year: number, month: number) {
  // Январь 2026 → недели W01-W05
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  return {
    weekStart: getISOWeek(firstDay), // "2026-W01"
    weekEnd: getISOWeek(lastDay)     // "2026-W05"
  };
}

// Запрос данных за месяц
const { weekStart, weekEnd } = monthToWeekRange(2026, 1);
GET /v1/analytics/weekly/by-sku?weekStart=${weekStart}&weekEnd=${weekEnd}&includeCogs=true
```

### 4.3 Формат дат

| Контекст | Формат | Пример |
|----------|--------|--------|
| Недельная аналитика | `YYYY-Www` | `2026-W04` |
| Рекламная аналитика | `YYYY-MM-DD` | `2026-01-31` |
| Диапазон недель | `YYYY-Www:Www` | `2026-W01:W05` |

---

## 5. Quick Start: Минимальный набор запросов

### Сценарий: Дашборд за последнюю неделю

```javascript
const cabinetId = 'your-cabinet-id';
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-Cabinet-Id': cabinetId
};

// 1. Получить список доступных недель
const weeks = await fetch('/v1/analytics/weekly/available-weeks', { headers });
const currentWeek = weeks.data[0].week; // "2026-W04"
const previousWeek = weeks.data[1].week; // "2026-W03"

// 2. Заказы (объём и тренды)
const orders = await fetch(`/v1/analytics/orders/volume?from=2026-01-24&to=2026-01-31`, { headers });

// 3. Выкупы и финансовая сводка
const financeSummary = await fetch(`/v1/analytics/weekly/finance-summary?week=${currentWeek}`, { headers });

// 4. SKU с COGS
const skuWithCogs = await fetch(`/v1/analytics/weekly/by-sku?week=${currentWeek}&includeCogs=true`, { headers });

// 5. Рекламные затраты
const advertising = await fetch(`/v1/analytics/advertising?from=2026-01-24&to=2026-01-31`, { headers });

// 6. Сравнение с предыдущим периодом
const comparison = await fetch(`/v1/analytics/weekly/comparison?period1=${currentWeek}&period2=${previousWeek}`, { headers });
```

### Сценарий: Дашборд за последний месяц

```javascript
// Январь 2026 = недели W01-W05
const weekStart = '2026-W01';
const weekEnd = '2026-W05';

// 1. Cabinet Summary (агрегированные данные)
const summary = await fetch(`/v1/analytics/cabinet-summary?weekStart=${weekStart}&weekEnd=${weekEnd}`, { headers });

// 2. Тренды по неделям
const trends = await fetch(`/v1/analytics/weekly/trends?from=${weekStart}&to=${weekEnd}`, { headers });

// 3. Рекламные затраты за месяц
const advertising = await fetch(`/v1/analytics/advertising?from=2026-01-01&to=2026-01-31`, { headers });

// 4. Хранение за месяц
const storage = await fetch(`/v1/analytics/storage/trends?weekStart=${weekStart}&weekEnd=${weekEnd}`, { headers });
```

---

## 6. Детальная документация

### Связанные документы

| Документ | Содержание |
|----------|------------|
| [121-DASHBOARD-MAIN-PAGE-ORDERS-API.md](./121-DASHBOARD-MAIN-PAGE-ORDERS-API.md) | Заказы FBS, COGS, аналитика заказов, примеры |
| [122-DASHBOARD-MAIN-PAGE-SALES-API.md](./122-DASHBOARD-MAIN-PAGE-SALES-API.md) | Выкупы, продажи, finance-summary, формулы прибыли |
| [123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md](./123-DASHBOARD-MAIN-PAGE-EXPENSES-API.md) | Реклама, логистика, хранение, unit-economics |
| [124-DASHBOARD-MAIN-PAGE-PERIODS-API.md](./124-DASHBOARD-MAIN-PAGE-PERIODS-API.md) | Периоды, ISO-недели, сравнение, тренды |
| [126-DASHBOARD-API-STATUS-REPORT.md](./126-DASHBOARD-API-STATUS-REPORT.md) | Статус-отчёт: все API реализованы |
| [127-DASHBOARD-DEBUG-REPORT.md](./127-DASHBOARD-DEBUG-REPORT.md) | Отладка: данные в `summary_rus`, не в корне |
| [128-DASHBOARD-QA-VERIFICATION-REPORT.md](./128-DASHBOARD-QA-VERIFICATION-REPORT.md) | QA верификация W04: backend корректен |
| [129-FBS-DATA-ANALYSIS-REPORT.md](./129-FBS-DATA-ANALYSIS-REPORT.md) | **Анализ FBS данных: синхронизация и рекомендации** |

### Backend Reference

| Ресурс | Путь |
|--------|------|
| API Paths Reference | `../docs/API-PATHS-REFERENCE.md` |
| Business Logic | `../docs/BUSINESS-LOGIC-REFERENCE.md` |
| Test API Files | `../test-api/*.http` |
| Swagger UI | `http://localhost:3000/api` |

---

## 7. Рекомендации по реализации UI

### 7.1 Структура компонентов

```
DashboardMainPage/
├── PeriodSelector/           # Переключатель Неделя/Месяц + dropdown
│   ├── WeekDropdown.tsx
│   └── MonthDropdown.tsx
├── KPICards/                 # Карточки основных метрик
│   ├── OrdersCard.tsx
│   ├── SalesCard.tsx
│   ├── ProfitCard.tsx
│   └── COGSCoverageCard.tsx
├── ExpensesSection/          # Блок расходов
│   ├── AdvertisingCard.tsx
│   ├── ExpenseChart.tsx      # Bar chart разбивки расходов
│   └── ExpenseBreakdown.tsx
├── TrendsSection/            # Тренды
│   └── TrendsChart.tsx
└── TheoreticalProfitCard.tsx # Расчёт по формуле
```

### 7.2 Hooks для данных

```typescript
// hooks/useDashboardData.ts
export function useDashboardData(period: 'week' | 'month', selectedWeek: string) {
  const { data: availableWeeks } = useAvailableWeeks();
  const { data: financeSummary } = useFinanceSummary(selectedWeek);
  const { data: orders } = useOrdersVolume(dateRange);
  const { data: advertising } = useAdvertising(dateRange);
  const { data: comparison } = useComparison(selectedWeek, previousWeek);

  return {
    availableWeeks,
    financeSummary,
    orders,
    advertising,
    comparison,
    theoreticalProfit: calculateTheoreticalProfit(...)
  };
}
```

### 7.3 Кэширование

| Эндпоинт | TTL Frontend | TTL Backend |
|----------|--------------|-------------|
| `available-weeks` | 5 min | 5 min |
| `finance-summary` | 5 min | 30 min |
| `advertising` | 5 min | 30 min |
| `orders/volume` | 2 min | 5 min |
| `cabinet-summary` | 5 min | 30 min |

### 7.4 Обработка ошибок

| HTTP Code | Действие |
|-----------|----------|
| 400 | Показать сообщение об ошибке параметров |
| 401 | Redirect на login |
| 403 | Показать "Нет доступа к кабинету" |
| 404 | Показать "Нет данных за период" |
| 500 | Retry + показать техническую ошибку |

### 7.5 Цветовая схема для метрик

| Метрика | Положительное | Отрицательное |
|---------|---------------|---------------|
| Прибыль | `#22C55E` (green) | `#EF4444` (red) |
| Маржа % | `#22C55E` (green) | `#EF4444` (red) |
| ROAS | `#22C55E` (>3x) | `#EF4444` (<1x) |
| Delta % | `#22C55E` (+) | `#EF4444` (-) |

---

## Changelog

| Дата | Версия | Изменения |
|------|--------|-----------|
| 2026-01-31 | 1.1 | Добавлены ссылки на QA/Debug/FBS отчёты; обновлена формула прибыли (Sales вместо Orders) |
| 2026-01-31 | 1.0 | Первоначальная версия документации |

---

**Контакты:** При вопросах обращайтесь к backend-команде.
