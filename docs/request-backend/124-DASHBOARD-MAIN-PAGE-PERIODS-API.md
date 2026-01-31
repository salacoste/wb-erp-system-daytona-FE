# API периодов для дашборда — Документация для Frontend

**Версия:** 1.0
**Дата:** 2026-01-31
**Целевая аудитория:** Frontend-разработчики
**Статус:** Production Ready

---

## Оглавление

1. [Обзор бизнес-требований](#1-обзор-бизнес-требований)
2. [Ключевые API-эндпоинты](#2-ключевые-api-эндпоинты)
3. [Получение списка доступных недель](#3-получение-списка-доступных-недель)
4. [Получение данных за конкретную неделю](#4-получение-данных-за-конкретную-неделю)
5. [Получение данных за диапазон дат](#5-получение-данных-за-диапазон-дат)
6. [Сравнение периодов](#6-сравнение-периодов-story-62)
7. [Тренды и временные ряды](#7-тренды-и-временные-ряды)
8. [Формат дат и недель](#8-формат-дат-и-недель)
9. [Обработка ошибок](#9-обработка-ошибок)
10. [Примеры HTTP-запросов](#10-примеры-http-запросов)
11. [Рекомендации по реализации UI](#11-рекомендации-по-реализации-ui)

---

## 1. Обзор бизнес-требований

### Потребности фронтенда

| Функция | Описание | API-решение |
|---------|----------|-------------|
| **Недельный вид** | Отображение данных по дням за выбранную неделю | `finance-summary?week=YYYY-Www` |
| **Месячный вид** | Отображение данных по дням за выбранный месяц | `by-sku?weekStart=...&weekEnd=...` |
| **Переключатель недель** | Список доступных недель для dropdown | `available-weeks` |
| **Сравнение периодов** | % изменения текущий vs предыдущий период | `comparison?period1=...&period2=...` |

### Архитектурная особенность

**ВАЖНО:** Система оперирует **ISO-неделями** (Пн-Вс), а не месяцами. Месячный вид реализуется через диапазон недель.

---

## 2. Ключевые API-эндпоинты

### Сводная таблица эндпоинтов

| Эндпоинт | Назначение | Параметры периода |
|----------|------------|-------------------|
| `GET /v1/analytics/weekly/available-weeks` | Список доступных недель | — |
| `GET /v1/analytics/weekly/finance-summary` | Сводка за неделю | `week=YYYY-Www` |
| `GET /v1/analytics/weekly/by-sku` | Аналитика по SKU | `week` или `weekStart`+`weekEnd` |
| `GET /v1/analytics/weekly/by-brand` | Аналитика по брендам | `week` или `weekStart`+`weekEnd` |
| `GET /v1/analytics/weekly/by-category` | Аналитика по категориям | `week` или `weekStart`+`weekEnd` |
| `GET /v1/analytics/weekly/comparison` | Сравнение двух периодов | `period1`, `period2` |
| `GET /v1/analytics/weekly/trends` | Тренды (временные ряды) | `from`, `to` |
| `GET /v1/analytics/weekly/margin-trends` | Тренды маржинальности | `weekStart`+`weekEnd` или `weeks` |
| `GET /v1/analytics/cabinet-summary` | Сводка по кабинету | `weeks` или `weekStart`+`weekEnd` |

### Общие заголовки (обязательные)

```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

---

## 3. Получение списка доступных недель

### Эндпоинт

```http
GET /v1/analytics/weekly/available-weeks
```

### Ответ (200 OK)

```json
{
  "data": [
    { "week": "2026-W04", "start_date": "2026-01-19" },
    { "week": "2026-W03", "start_date": "2026-01-12" },
    { "week": "2026-W02", "start_date": "2026-01-05" },
    { "week": "2025-W52", "start_date": "2025-12-22" },
    { "week": "2025-W51", "start_date": "2025-12-15" }
  ]
}
```

### Поля ответа

| Поле | Тип | Описание |
|------|-----|----------|
| `week` | string | ISO-неделя в формате `YYYY-Www` |
| `start_date` | string | Дата понедельника недели (ISO 8601: `YYYY-MM-DD`) |

### Бизнес-логика (Story 2.7)

- **Источник данных:** таблица `weekly_payout_total` (НЕ `imports`)
- **Гарантия:** если неделя есть в списке → данные точно доступны через `finance-summary`
- **Сортировка:** по убыванию (новейшие недели первыми)
- **Пустой список:** возвращается `{ "data": [] }` если данных нет

### Использование для UI

```typescript
// Пример: получение недель для dropdown
const response = await api.get('/v1/analytics/weekly/available-weeks');
const weeks = response.data.data;

// Первая неделя — последняя доступная (для "текущего периода")
const currentWeek = weeks[0]?.week; // "2026-W04"

// Вторая неделя — предыдущая (для сравнения)
const previousWeek = weeks[1]?.week; // "2026-W03"
```

---

## 4. Получение данных за конкретную неделю

### 4.1 Финансовая сводка (Finance Summary)

```http
GET /v1/analytics/weekly/finance-summary?week=2026-W04
```

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `week` | string | ✅ | ISO-неделя: `YYYY-Www` |

**Ответ (200 OK):**

```json
{
  "summary_rus": {
    "week": "2026-W04",
    "report_type": "основной",
    "sale_gross": 292665.00,
    "sales_gross": 295808.00,
    "returns_gross": 3143.00,
    "total_commission_rub": 91856.34,
    "to_pay_goods": 200752.66,
    "logistics_cost": 34576.48,
    "storage_cost": 1763.35,
    "other_adjustments_net": 32883.00,
    "payout_total": 131673.83,
    "wb_sales_gross": 131134.76,
    "wb_returns_gross": 809.00
  },
  "summary_eaeu": { /* аналогичная структура */ },
  "summary_total": {
    "week": "2026-W04",
    "sale_gross_total": 305778.32,
    "payout_total": 138621.15,
    "wb_sales_gross_total": 135285.09,
    "wb_returns_gross_total": 809.00
  },
  "meta": {
    "week": "2026-W04",
    "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    "generated_at": "2026-01-31T10:00:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

### 4.2 Аналитика по SKU

```http
GET /v1/analytics/weekly/by-sku?week=2026-W04&includeCogs=true&limit=50
```

**Параметры:**

| Параметр | Тип | Обязательный | Default | Описание |
|----------|-----|--------------|---------|----------|
| `week` | string | ✅ (или диапазон) | — | ISO-неделя |
| `includeCogs` | boolean | ❌ | false | Включить COGS и маржу |
| `limit` | number | ❌ | 100 | Максимум записей |
| `report_type` | string | ❌ | all | `основной`, `по выкупам`, `all` |

---

## 5. Получение данных за диапазон дат

### 5.1 Аналитика по SKU (диапазон)

```http
GET /v1/analytics/weekly/by-sku?weekStart=2026-W01&weekEnd=2026-W04&includeCogs=true
```

**Параметры диапазона:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `weekStart` | string | Начальная неделя (включительно): `YYYY-Www` |
| `weekEnd` | string | Конечная неделя (включительно): `YYYY-Www` |

**Важно:**
- При использовании `weekStart`/`weekEnd` параметр `week` игнорируется
- Данные агрегируются за весь диапазон
- Максимальный диапазон: 52 недели

### 5.2 Реализация "месячного вида"

Поскольку система работает с ISO-неделями, месячный вид реализуется через конвертацию:

```typescript
// Пример: получить данные за январь 2026
function getWeeksForMonth(year: number, month: number): { start: string, end: string } {
  // Январь 2026 охватывает недели W01-W05
  // Нужно вычислить ISO-недели для первого и последнего дня месяца

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startWeek = getISOWeek(firstDay); // "2026-W01"
  const endWeek = getISOWeek(lastDay);    // "2026-W05"

  return { start: startWeek, end: endWeek };
}

// Запрос данных за январь
const { start, end } = getWeeksForMonth(2026, 1);
const response = await api.get(`/v1/analytics/weekly/by-sku?weekStart=${start}&weekEnd=${end}&includeCogs=true`);
```

### 5.3 Аналогичные эндпоинты с поддержкой диапазона

```http
# По брендам
GET /v1/analytics/weekly/by-brand?weekStart=2026-W01&weekEnd=2026-W04&includeCogs=true

# По категориям
GET /v1/analytics/weekly/by-category?weekStart=2026-W01&weekEnd=2026-W04&includeCogs=true
```

---

## 6. Сравнение периодов (Story 6.2)

### Эндпоинт

```http
GET /v1/analytics/weekly/comparison
```

### Параметры

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `period1` | string | ✅ | Первый период (текущий) |
| `period2` | string | ✅ | Второй период (для сравнения) |
| `groupBy` | enum | ❌ | `sku`, `brand`, `category`, `cabinet` (default) |
| `includeCogs` | boolean | ❌ | Включить COGS (default: true) |
| `limit` | number | ❌ | Лимит для breakdown (default: 20, max: 100) |

### Форматы периодов

```
# Одна неделя
period1=2026-W04

# Диапазон недель (короткий формат)
period1=2026-W01:W04

# Диапазон недель (полный формат)
period1=2026-W01:2026-W04
```

### Примеры запросов

```http
# Сравнение двух недель (totals только)
GET /v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03

# Сравнение с разбивкой по SKU
GET /v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03&groupBy=sku&limit=10

# Сравнение по категориям
GET /v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03&groupBy=category

# Сравнение диапазонов (8 недель vs 8 недель)
GET /v1/analytics/weekly/comparison?period1=2026-W01:W04&period2=2025-W49:W52&groupBy=brand
```

### Ответ (200 OK)

```json
{
  "comparison": {
    "period1": {
      "label": "2026-W04",
      "data": {
        "revenue_net": 100000.00,
        "cogs_total": 60000.00,
        "profit": 40000.00,
        "margin_pct": 40.0,
        "qty": 80,
        "profit_per_unit": 500.00,
        "roi": 66.67
      }
    },
    "period2": {
      "label": "2026-W03",
      "data": {
        "revenue_net": 85000.00,
        "cogs_total": 55000.00,
        "profit": 30000.00,
        "margin_pct": 35.29,
        "qty": 65,
        "profit_per_unit": 461.54,
        "roi": 54.55
      }
    },
    "delta": {
      "revenue_net": { "absolute": 15000.00, "percent": 17.65 },
      "profit": { "absolute": 10000.00, "percent": 33.33 },
      "margin_pct": { "absolute": 4.71, "percent": 13.35 },
      "qty": { "absolute": 15, "percent": 23.08 },
      "roi": { "absolute": 12.12, "percent": 22.22 }
    }
  },
  "breakdown": [
    {
      "nm_id": "12345678",
      "sa_name": "Товар XYZ",
      "period1": { "revenue_net": 50000, "profit": 20000, "margin_pct": 40.0 },
      "period2": { "revenue_net": 42000, "profit": 15000, "margin_pct": 35.71 },
      "delta": { "revenue_pct": 19.05, "profit_pct": 33.33, "margin_delta": 4.29 }
    }
  ],
  "meta": {
    "period1": "2026-W04",
    "period2": "2026-W03",
    "groupBy": "sku",
    "generated_at": "2026-01-31T12:00:00Z"
  }
}
```

### Логика расчета delta

```
delta.absolute = period1.value - period2.value
delta.percent = ((period1 - period2) / period2) × 100
```

**Важно:**
- Положительный delta означает рост (period1 > period2)
- Если `period2.value = 0`, то `delta.percent = null` (избегаем деления на ноль)

---

## 7. Тренды и временные ряды

### 7.1 Dedicated Trends Endpoint (Story 6.6)

```http
GET /v1/analytics/weekly/trends?from=2026-W01&to=2026-W04
```

**Параметры:**

| Параметр | Тип | Обязательный | Описание |
|----------|-----|--------------|----------|
| `from` | string | ✅ | Начальная неделя: `YYYY-Www` |
| `to` | string | ✅ | Конечная неделя: `YYYY-Www` |
| `metrics` | string | ❌ | Список метрик через запятую |
| `report_type` | enum | ❌ | `rus`, `eaeu`, `total` |
| `include_summary` | boolean | ❌ | Включить summary stats (default: true) |

**Пример с выбором метрик:**

```http
GET /v1/analytics/weekly/trends?from=2026-W01&to=2026-W04&metrics=payout_total,sale_gross,logistics_cost
```

### 7.2 Margin Trends (Story 4.7)

```http
# Явный диапазон
GET /v1/analytics/weekly/margin-trends?weekStart=2026-W01&weekEnd=2026-W04

# Относительный диапазон (последние N недель)
GET /v1/analytics/weekly/margin-trends?weeks=12
```

**Параметры:**

| Параметр | Тип | Описание |
|----------|-----|----------|
| `weekStart` + `weekEnd` | string | Явный диапазон |
| `weeks` | number | Последние N недель (max: 52) |

**Важно:** Нельзя использовать оба метода одновременно — вернется 400.

### 7.3 Cabinet Summary (Story 6.4)

```http
# Последние N недель
GET /v1/analytics/cabinet-summary?weeks=4

# Явный диапазон
GET /v1/analytics/cabinet-summary?weekStart=2026-W01&weekEnd=2026-W04
```

---

## 8. Формат дат и недель

### 8.1 ISO Week Format

| Формат | Пример | Описание |
|--------|--------|----------|
| `YYYY-Www` | `2026-W04` | ISO-неделя (W с заглавной) |
| `YYYY-MM-DD` | `2026-01-19` | Дата в ISO 8601 |
| `YYYY-Www:Www` | `2026-W01:W04` | Диапазон (короткий) |
| `YYYY-Www:YYYY-Www` | `2025-W52:2026-W04` | Диапазон (через год) |

### 8.2 Правила ISO-недель

- **Неделя начинается в понедельник**
- **Первая неделя года** — неделя, содержащая первый четверг года
- **Часовой пояс:** `Europe/Moscow`

### 8.3 Конвертация дат в ISO-недели (JavaScript)

```typescript
import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from 'date-fns';

// Дата → ISO-неделя
function dateToIsoWeek(date: Date): string {
  const year = getISOWeekYear(date);
  const week = getISOWeek(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

// ISO-неделя → дата понедельника
function isoWeekToDate(isoWeek: string): Date {
  const [year, week] = isoWeek.split('-W').map(Number);
  const jan4 = new Date(year, 0, 4);
  const startOfYear = startOfISOWeek(jan4);
  return addDays(startOfYear, (week - 1) * 7);
}

// Примеры
dateToIsoWeek(new Date('2026-01-19')); // "2026-W04"
dateToIsoWeek(new Date('2026-01-31')); // "2026-W05"
```

### 8.4 Особенности границ годов

```
Декабрь 2025 — Январь 2026:
- 2025-12-29 (Пн) → 2026-W01 (первая неделя 2026!)
- 2025-12-28 (Вс) → 2025-W52
- 2026-01-01 (Чт) → 2026-W01
```

---

## 9. Обработка ошибок

### 9.1 Типичные ошибки

| HTTP Code | Код ошибки | Причина |
|-----------|-----------|---------|
| 400 | `INVALID_WEEK_FORMAT` | Неверный формат недели |
| 400 | `RANGE_TOO_LARGE` | Диапазон > 52 недель |
| 400 | `MISSING_REQUIRED_PARAM` | Отсутствует обязательный параметр |
| 404 | `NO_DATA_FOR_WEEK` | Нет данных за указанную неделю |
| 403 | `CABINET_ACCESS_DENIED` | Нет доступа к кабинету |

### 9.2 Пример ошибки 404

```json
{
  "error": {
    "code": "NO_DATA_FOR_WEEK",
    "message": "No financial data found for week 2026-W05"
  }
}
```

### 9.3 Пример ошибки 400

```json
{
  "statusCode": 400,
  "message": "Invalid week format. Expected: YYYY-Www",
  "error": "Bad Request"
}
```

---

## 10. Примеры HTTP-запросов

### 10.1 Полный workflow для переключателя периодов

```http
### 1. Авторизация
# @name login
POST {{baseUrl}}/v1/auth/login
Content-Type: application/json

{
  "email": "test@test.com",
  "password": "Russia23!"
}

@token = {{login.response.body.access_token}}
@cabinetId = f75836f7-c0bc-4b2c-823c-a1f3508cce8e

###

### 2. Получить список доступных недель
# @name availableWeeks
GET {{baseUrl}}/v1/analytics/weekly/available-weeks
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

###

### 3. Получить данные за выбранную неделю
GET {{baseUrl}}/v1/analytics/weekly/finance-summary?week=2026-W04
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

###

### 4. Сравнить с предыдущей неделей
GET {{baseUrl}}/v1/analytics/weekly/comparison?period1=2026-W04&period2=2026-W03
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

###

### 5. Получить тренды за последние 4 недели
GET {{baseUrl}}/v1/analytics/weekly/trends?from=2026-W01&to=2026-W04
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

### 10.2 Примеры для разных view

```http
### Недельный view — данные по SKU
GET {{baseUrl}}/v1/analytics/weekly/by-sku?week=2026-W04&includeCogs=true&limit=50
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

###

### "Месячный" view — данные за январь 2026 (W01-W05)
GET {{baseUrl}}/v1/analytics/weekly/by-sku?weekStart=2026-W01&weekEnd=2026-W05&includeCogs=true
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}

###

### Сравнение январь vs декабрь
GET {{baseUrl}}/v1/analytics/weekly/comparison?period1=2026-W01:W05&period2=2025-W49:W52&groupBy=brand
Authorization: Bearer {{token}}
X-Cabinet-Id: {{cabinetId}}
```

---

## 11. Рекомендации по реализации UI

### 11.1 Переключатель недель (Weekly View)

```typescript
// State
interface PeriodState {
  availableWeeks: Array<{ week: string; start_date: string }>;
  selectedWeek: string | null;
  previousWeek: string | null;
}

// Hook
function usePeriodSelector() {
  const [state, setState] = useState<PeriodState>({
    availableWeeks: [],
    selectedWeek: null,
    previousWeek: null,
  });

  useEffect(() => {
    async function loadWeeks() {
      const response = await api.get('/v1/analytics/weekly/available-weeks');
      const weeks = response.data.data;

      setState({
        availableWeeks: weeks,
        selectedWeek: weeks[0]?.week ?? null,
        previousWeek: weeks[1]?.week ?? null,
      });
    }
    loadWeeks();
  }, []);

  const selectWeek = (week: string) => {
    const index = state.availableWeeks.findIndex(w => w.week === week);
    setState(prev => ({
      ...prev,
      selectedWeek: week,
      previousWeek: state.availableWeeks[index + 1]?.week ?? null,
    }));
  };

  return { ...state, selectWeek };
}
```

### 11.2 Отображение % изменения

```typescript
function DeltaIndicator({ value, percent }: { value: number; percent: number | null }) {
  if (percent === null) return <span>—</span>;

  const isPositive = percent > 0;
  const color = isPositive ? 'text-green-600' : 'text-red-600';
  const arrow = isPositive ? '↑' : '↓';

  return (
    <span className={color}>
      {arrow} {Math.abs(percent).toFixed(1)}%
    </span>
  );
}
```

### 11.3 Генерация списка месяцев из недель

```typescript
function getAvailableMonths(weeks: Array<{ week: string; start_date: string }>): string[] {
  const months = new Set<string>();

  for (const { start_date } of weeks) {
    const date = new Date(start_date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    months.add(monthKey);
  }

  return Array.from(months).sort().reverse();
}

// Использование
const months = getAvailableMonths(availableWeeks);
// ["2026-01", "2025-12", "2025-11", ...]
```

### 11.4 Конвертация месяца в диапазон недель

```typescript
function monthToWeekRange(monthKey: string): { weekStart: string; weekEnd: string } {
  const [year, month] = monthKey.split('-').map(Number);

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const weekStart = dateToIsoWeek(firstDay);
  const weekEnd = dateToIsoWeek(lastDay);

  return { weekStart, weekEnd };
}

// Использование
const { weekStart, weekEnd } = monthToWeekRange("2026-01");
// { weekStart: "2026-W01", weekEnd: "2026-W05" }
```

---

## Дополнительные ресурсы

| Ресурс | Путь |
|--------|------|
| **Test API файлы** | `test-api/05-analytics-basic.http`, `test-api/06-analytics-advanced.http` |
| **API Reference** | `docs/API-PATHS-REFERENCE.md` |
| **Story 2.7 (available-weeks fix)** | `docs/stories/epic-2/story-2.7-fix-available-weeks-data-source.md` |
| **Story 6.2 (comparison)** | `docs/stories/epic-6/story-6.2-period-comparison.md` |
| **Swagger UI** | `http://localhost:3000/api` |
| **Frontend check-available-weeks.http** | `frontend/test-api/check-available-weeks.http` |

---

## Changelog

| Дата | Версия | Изменения |
|------|--------|-----------|
| 2026-01-31 | 1.0 | Первоначальная версия документации |

---

**Автор:** Backend Team
**Reviewed by:** —
**Статус:** Ready for Frontend Integration
