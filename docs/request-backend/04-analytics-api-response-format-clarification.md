# 04. Уточнение формата ответов Analytics API

## 📋 Обзор

При интеграции с Analytics API endpoints обнаружено несоответствие между форматом ответов, который возвращает backend, и форматом, который ожидает frontend. Frontend был адаптирован для работы с текущим форматом, но требуется уточнение и согласование формата для будущей разработки.

**⚠️ КРИТИЧЕСКАЯ ПРОБЛЕМА:** Endpoint `/v1/analytics/weekly/available-weeks` возвращает пустой массив, хотя данные присутствуют в БД. Проблема в том, что endpoint использует таблицу `imports` для получения недель, но поля `week` и `weeks_included` не заполняются при импорте.

**Статус:** 
- ✅ Frontend исправлен для работы с текущим форматом backend
- ❌ **БЛОКЕР:** Endpoint `available-weeks` не возвращает данные из-за пустых полей в таблице `imports`

**Приоритет:** 🔴 **HIGH** (блокирует отображение финансовых данных на dashboard)

---

## 🚨 КРИТИЧЕСКАЯ ПРОБЛЕМА: Endpoint `/v1/analytics/weekly/available-weeks` возвращает пустой массив

### Описание проблемы

Endpoint `/v1/analytics/weekly/available-weeks` возвращает пустой массив `{ data: [] }`, хотя в БД есть данные в таблице `weekly_payout_total`.

**Диагностика:**
```sql
-- В таблице weekly_payout_total есть данные:
SELECT week FROM weekly_payout_total 
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e' 
ORDER BY week DESC;
-- Результат: 2025-W46, 2025-W45, 2025-W44, 2025-W43, 2025-W42, ...

-- НО в таблице imports поля week и weeks_included пустые:
SELECT status, COUNT(*) as total, 
       COUNT(CASE WHEN week IS NOT NULL THEN 1 END) as with_week,
       COUNT(CASE WHEN weeks_included IS NOT NULL AND array_length(weeks_included, 1) > 0 THEN 1 END) as with_weeks_included
FROM imports 
WHERE cabinet_id = 'f75836f7-c0bc-4b2c-823c-a1f3508cce8e'
GROUP BY status;
-- Результат: 
-- completed: 17 записей, но with_week = 0, with_weeks_included = 0
```

**Причина:**
Endpoint использует таблицу `imports` для получения доступных недель:
```typescript
// src/analytics/weekly-analytics.service.ts:105-114
const imports = await this.prisma.import.findMany({
  where: {
    cabinetId,
    status: 'completed',
  },
  select: {
    weeksIncluded: true, // Пусто!
    week: true,          // Пусто!
  },
});
```

Но поля `week` и `weeks_included` не заполняются при импорте финансовых отчетов.

### Решение

**Вариант 1 (Рекомендуемый):** Изменить endpoint, чтобы он использовал `weekly_payout_total` для получения доступных недель:
```typescript
// Вместо imports использовать weekly_payout_total
const weeks = await this.prisma.weeklyPayoutTotal.findMany({
  where: { cabinetId },
  select: { week: true },
  distinct: ['week'],
  orderBy: { week: 'desc' },
});
```

**Вариант 2:** Заполнять поля `week` и `weeks_included` в таблице `imports` при импорте финансовых отчетов.

**Вариант 3:** Комбинированный подход - использовать `weekly_payout_total` как основной источник, а `imports` как fallback.

### Временное решение Frontend

Frontend обрабатывает пустой массив gracefully:
```typescript
if (!weeks || weeks.length === 0) {
  console.info('[Dashboard Metrics] No available weeks found. Financial data may not be processed yet.')
  return {}
}
```

Но это приводит к тому, что финансовые метрики не отображаются, хотя данные есть в БД.

---

## 🔍 Проблема 1: Формат ответа `/v1/analytics/weekly/available-weeks`

### Текущий формат Backend

Backend возвращает:
```typescript
{
  data: [
    { week: "2025-W46", start_date: "2025-11-10" },
    { week: "2025-W45", start_date: "2025-11-03" },
    // ...
  ]
}
```

**Backend Reference:**
- Controller: `src/analytics/weekly-analytics.controller.ts:199-251`
- Service: `src/analytics/weekly-analytics.service.ts:100-141`
- DTO: `src/analytics/dto/available-weeks-response.dto.ts`

### Ожидаемый формат Frontend (изначально)

Frontend изначально ожидал:
```typescript
{
  data: ["2025-W46", "2025-W45", "2025-W43", ...] // Просто массив строк
}
```

### Решение

Frontend был обновлен для работы с текущим форматом backend:
```typescript
// src/hooks/useDashboard.ts, src/hooks/useExpenses.ts
const weeksResponse = await apiClient.get<{ 
  data: Array<{ week: string; start_date: string }> 
}>('/v1/analytics/weekly/available-weeks')

// Извлекаем только week из объектов
const weeks = weeksResponse?.data?.map((w) => w.week) || []
```

---

## 🔍 Проблема 2: Формат ответа `/v1/analytics/weekly/finance-summary`

### Текущий формат Backend

Backend возвращает структуру с тремя summary объектами:
```typescript
{
  summary_total: {
    week: "2025-W46",
    sale_gross_total: 0.00,
    to_pay_goods_total: 195470.62,
    logistics_cost_total: 0.00,
    storage_cost_total: 0.00,
    penalties_total: 0.00,
    loyalty_fee_total: 0.00,
    // ... другие поля с суффиксом _total
    payout_total: 195470.62,
    // ...
  } | null,
  summary_rus: {
    week: "2025-W46",
    sale_gross: 0.00,
    to_pay_goods: 195470.62,
    logistics_cost: 0.00,
    storage_cost: 0.00,
    // ... поля БЕЗ суффикса _total
    payout_total: 195470.62,
    // ...
  } | null,
  summary_eaeu: {
    // Аналогично summary_rus
  } | null,
  meta: {
    week: "2025-W46",
    cabinet_id: "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    generated_at: "2025-11-21T19:30:00.000Z",
    timezone: "Europe/Moscow"
  }
}
```

**Backend Reference:**
- Controller: `src/analytics/weekly-analytics.controller.ts:42-197`
- Service: `src/analytics/weekly-analytics.service.ts:30-93`
- DTO: `src/analytics/dto/finance-summary-response.dto.ts`
- WeeklyPayoutTotalDto: `src/analytics/dto/weekly-payout-total.dto.ts` (поля с `_total`)
- WeeklyPayoutSummaryDto: `src/analytics/dto/weekly-payout-summary.dto.ts` (поля без суффикса)

### Ожидаемый формат Frontend (изначально)

Frontend изначально ожидал прямой объект:
```typescript
{
  week: "2025-W46",
  sale_gross: 0.00,
  to_pay_goods: 195470.62,
  logistics_cost: 0.00,
  storage_cost: 0.00,
  penalties_total: 0.00,
  loyalty_fee: 0.00,
  // ...
}
```

### Решение

Frontend был обновлен для работы с текущим форматом backend:
```typescript
// src/hooks/useDashboard.ts, src/hooks/useExpenses.ts
const summaryResponse = await apiClient.get<{
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
}>(`/v1/analytics/weekly/finance-summary?week=${latestWeek}&report_type=total`)

// Используем summary_total (консолидированный) или fallback на summary_rus
const summary = summaryResponse.summary_total || summaryResponse.summary_rus

// Поддержка обоих форматов полей (с _total и без)
const totalPayable = summary.to_pay_goods_total ?? summary.to_pay_goods
const revenue = summary.sale_gross_total ?? summary.sale_gross
```

---

## ❓ Вопросы для Backend Team

### 0. 🚨 КРИТИЧНО: Пустые недели в endpoint `available-weeks`

**Вопрос:** Почему endpoint `/v1/analytics/weekly/available-weeks` возвращает пустой массив, хотя данные есть в `weekly_payout_total`?

**Контекст:**
- В таблице `weekly_payout_total` есть данные для недель: 2025-W46, W45, W44, и т.д.
- В таблице `imports` есть записи со статусом `completed`, но поля `week` и `weeks_included` пустые
- Endpoint использует таблицу `imports` для получения недель, поэтому возвращает пустой массив

**Рекомендация Frontend:**
- Изменить endpoint, чтобы он использовал `weekly_payout_total` для получения доступных недель
- Или заполнять поля `week`/`weeks_included` в таблице `imports` при импорте

**Приоритет:** 🔴 **HIGH** - блокирует отображение финансовых данных на dashboard

---

### 1. Формат `available-weeks`

**Вопрос:** Является ли текущий формат `{ data: [{ week, start_date }] }` финальным и стабильным?

**Контекст:**
- Frontend использует только поле `week`, поле `start_date` не используется
- Если `start_date` нужен для будущего функционала (например, WeekSelector компонент), то формат корректен
- Если `start_date` не планируется использовать, можно упростить до массива строк

**Рекомендация Frontend:**
- Если `start_date` будет использоваться в будущем (например, для WeekSelector) → оставить текущий формат ✅
- Если `start_date` не нужен → упростить до `{ data: string[] }` для меньшего payload

---

### 2. Формат `finance-summary`

**Вопрос 1:** Почему `summary_total` использует поля с суффиксом `_total`, а `summary_rus`/`summary_eaeu` без суффикса?

**Контекст:**
- Это создает необходимость поддерживать два формата полей в frontend
- Усложняет типизацию TypeScript

**Вопрос 2:** Какой summary должен использоваться по умолчанию для dashboard метрик?

**Текущее решение Frontend:**
```typescript
// Используем summary_total (консолидированный) или fallback на summary_rus
const summary = summaryResponse.summary_total || summaryResponse.summary_rus
```

**Вопрос 3:** Параметр `report_type=total` в query string влияет на формат ответа или только на логику backend?

**Контекст:**
- Frontend всегда передает `report_type=total`
- Неясно, влияет ли это на структуру ответа или только на выбор данных

---

### 3. Документация API

**Вопрос:** Где находится актуальная документация форматов ответов?

**Текущие источники:**
- Swagger/OpenAPI документация (если доступна)
- DTO файлы в backend (`src/analytics/dto/`)
- Frontend API Integration Guide (`frontend/docs/api-integration-guide.md`)

**Рекомендация:**
- Обновить `frontend/docs/api-integration-guide.md` с актуальными форматами ответов
- Или предоставить ссылку на Swagger документацию

---

## ✅ Текущее состояние Frontend

### Исправленные файлы

1. **`src/hooks/useDashboard.ts`**
   - Обновлена обработка `available-weeks` для извлечения `week` из объектов
   - Обновлена обработка `finance-summary` для работы с `summary_total`/`summary_rus`
   - Добавлена поддержка полей с `_total` и без (обратная совместимость)
   - Добавлено логирование для диагностики

2. **`src/hooks/useExpenses.ts`**
   - Обновлена обработка `available-weeks` для извлечения `week` из объектов
   - Обновлена обработка `finance-summary` для работы с `summary_total`/`summary_rus`
   - Добавлена поддержка полей с `_total` и без (обратная совместимость)
   - Добавлено логирование для диагностики

3. **`src/app/(dashboard)/dashboard/page.tsx`**
   - Добавлена проверка статуса обработки финансовых данных
   - Добавлены информативные сообщения для пользователя

4. **`src/hooks/useProcessingStatus.ts`**
   - Обновлен polling для мониторинга статуса финансовой обработки на dashboard

### Типы TypeScript

```typescript
// src/hooks/useDashboard.ts
export interface FinanceSummary {
  week: string
  // Поддержка обоих форматов (с _total и без)
  sale_gross_total?: number
  sale_gross?: number
  to_pay_goods_total?: number
  to_pay_goods?: number
  logistics_cost_total?: number
  logistics_cost?: number
  storage_cost_total?: number
  storage_cost?: number
  penalties_total: number
  loyalty_fee_total?: number
  loyalty_fee?: number
  seller_delivery_revenue_total?: number
  seller_delivery_revenue?: number
  payout_total: number
  // ...
}
```

---

## 🧪 Тестирование

### Проверка работы с текущим форматом

1. **Проверка `available-weeks`:**
   ```typescript
   // Должен корректно извлекать week из объектов
   const weeks = weeksResponse?.data?.map((w) => w.week) || []
   expect(weeks).toEqual(["2025-W46", "2025-W45", ...])
   ```

2. **Проверка `finance-summary`:**
   ```typescript
   // Должен использовать summary_total или fallback на summary_rus
   const summary = summaryResponse.summary_total || summaryResponse.summary_rus
   expect(summary).toBeDefined()
   expect(summary.to_pay_goods_total ?? summary.to_pay_goods).toBeDefined()
   ```

### Логирование для диагностики

Добавлено логирование в консоль браузера:
- `[Dashboard Metrics] Fetching finance summary for week: ...`
- `[Dashboard Metrics] Finance summary received: ...`
- `[Expenses] Fetching finance summary for week: ...`
- `[Expenses] Found X expense categories with total: ...`

---

## 📚 Дополнительные ресурсы

- **Backend Controller:** `src/analytics/weekly-analytics.controller.ts`
- **Backend Service:** `src/analytics/weekly-analytics.service.ts`
- **DTO Files:**
  - `src/analytics/dto/available-weeks-response.dto.ts`
  - `src/analytics/dto/finance-summary-response.dto.ts`
  - `src/analytics/dto/weekly-payout-total.dto.ts`
  - `src/analytics/dto/weekly-payout-summary.dto.ts`
- **Frontend Implementation:**
  - `frontend/src/hooks/useDashboard.ts`
  - `frontend/src/hooks/useExpenses.ts`
- **Frontend API Guide:** `frontend/docs/api-integration-guide.md`

---

## ✅ Checklist

- [x] Frontend адаптирован для работы с текущим форматом backend
- [x] Добавлена поддержка обоих форматов полей (с `_total` и без)
- [x] Добавлено логирование для диагностики
- [x] Обновлена обработка ошибок
- [x] **Ответ от Backend Team получен** - все вопросы закрыты (см. раздел "Ответ от Backend Team" ниже)
- [x] **Убран параметр `report_type=total`** из запросов к `/v1/analytics/weekly/finance-summary` (Backend Team подтвердил, что параметр не используется)
- [x] **Обновлены тесты** для соответствия новому формату запросов
- [ ] Обновить документацию после получения ответов (рекомендуется обновить `frontend/docs/api-integration-guide.md`)
- [x] Типы TypeScript соответствуют текущему формату API (изменения не требуются)

---

## 📝 Запрос к Backend Team

**Просьба предоставить уточнения по следующим вопросам:**

0. **🚨 КРИТИЧНО - Пустые недели:**
   - Почему endpoint `available-weeks` возвращает пустой массив?
   - Можно ли изменить endpoint, чтобы он использовал `weekly_payout_total` вместо `imports`?
   - Или нужно заполнять поля `week`/`weeks_included` в таблице `imports` при импорте?

1. **Формат `available-weeks`:**
   - Является ли формат `{ data: [{ week, start_date }] }` финальным?
   - Планируется ли использование `start_date` в будущем?

2. **Формат `finance-summary`:**
   - Почему `summary_total` использует поля с `_total`, а `summary_rus`/`summary_eaeu` без?
   - Какой summary должен использоваться по умолчанию для dashboard?
   - Влияет ли параметр `report_type=total` на формат ответа?

3. **Документация:**
   - Где находится актуальная документация форматов ответов?
   - Можно ли обновить `frontend/docs/api-integration-guide.md`?

---

**Дата создания:** 2025-11-21  
**Последнее обновление:** 2025-11-21  
**Автор:** Frontend Team (Auto - Dev Agent)  
**Статус:** ✅ Frontend исправлен, ✅ Ответ от Backend Team получен (см. раздел "Ответ от Backend Team")

---

## 📝 Ответ от Backend Team

**Дата ответа:** 2025-11-21  
**Автор:** Backend Team (Auto - Dev Agent)

### ✅ Ответ 0: 🚨 КРИТИЧНО - Пустые недели в `available-weeks`

**Проблема:** Endpoint `available-weeks` возвращает пустой массив, если:
- Нет завершенных импортов (`status = 'completed'`)
- Импорты не имеют заполненных полей `weeksIncluded[]` или `week` (legacy)

**Текущая реализация:**
- Endpoint использует таблицу `imports` для получения списка недель
- Запрос: `SELECT weeksIncluded, week FROM imports WHERE cabinetId = ? AND status = 'completed'`
- Агрегирует уникальные недели из массива `weeksIncluded[]` или поля `week`

**Почему это может быть проблемой:**
1. Если импорт еще не завершен → неделя не появится в списке
2. Если поля `weeksIncluded`/`week` не заполнены при импорте → неделя не появится
3. Если импорт завершен, но агрегация еще не выполнена → неделя есть в `imports`, но данных в `weekly_payout_total` еще нет

**Рекомендация Backend:**

✅ **Использовать `weekly_payout_total` как источник данных** (более надежный подход):

**Преимущества:**
- `weekly_payout_total` содержит только те недели, для которых есть **готовые агрегированные данные**
- Это означает, что данные уже обработаны и готовы к отображению в UI
- Не зависит от статуса импорта или заполнения полей в `imports`

**Предлагаемое изменение:**
```typescript
// Вместо запроса к imports, использовать weekly_payout_total:
const weeks = await this.prisma.weeklyPayoutTotal.findMany({
  where: { cabinetId },
  select: { week: true },
  distinct: ['week'],
  orderBy: { week: 'desc' },
});

// Или использовать weekly_payout_summary для более полного списка:
const weeks = await this.prisma.weeklyPayoutSummary.findMany({
  where: { cabinetId },
  select: { week: true },
  distinct: ['week'],
  orderBy: { week: 'desc' },
});
```

**Альтернативный подход (гибридный):**
- Использовать `weekly_payout_total` как основной источник
- Добавить fallback на `imports` для недель, которые импортированы, но еще не агрегированы
- Это покажет пользователю, что данные есть, но еще обрабатываются

**Статус:** 
- ⚠️ **Требуется изменение backend** для использования `weekly_payout_total` вместо `imports`
- 📝 **Создать задачу** для рефакторинга endpoint `available-weeks`

**Backend Reference:**
- Текущая реализация: `src/analytics/weekly-analytics.service.ts:100-141`
- Таблица `weekly_payout_total`: `prisma/schema.prisma:337-366`
- Таблица `imports`: `prisma/schema.prisma:106-156`

---

### ✅ Ответ 1: Формат `available-weeks`

**Статус:** Формат `{ data: [{ week, start_date }] }` является **финальным и стабильным**.

**Обоснование:**
- Поле `start_date` было добавлено по запросу Frontend Team (Request #012) для компонента WeekSelector
- Формат позволяет frontend отображать как ISO week (`2025-W45`), так и читаемую дату начала недели (`2025-11-03`)
- Расчет `start_date` выполняется автоматически на backend через метод `calculateWeekStartDate()` (понедельник недели в формате YYYY-MM-DD, timezone Europe/Moscow)
- Формат соответствует бизнес-логике: неделя определяется как ISO week (Пн-Вс), а `start_date` - это понедельник этой недели

**Рекомендация Backend:**
- ✅ Оставить текущий формат - он оптимален для UI компонентов
- ✅ Использовать `start_date` для отображения в WeekSelector и других date pickers
- ✅ Поле `week` остается основным идентификатором для API запросов

**Backend Reference:**
- Service: `src/analytics/weekly-analytics.service.ts:100-141`
- DTO: `src/analytics/dto/available-weeks-response.dto.ts:7-19`
- Комментарий в коде: `// Request #012: Calculate start_date for each week (Monday in YYYY-MM-DD format)`

---

### ✅ Ответ 2: Формат `finance-summary`

#### 2.1. Почему `summary_total` использует поля с `_total`, а `summary_rus`/`summary_eaeu` без?

**Обоснование архитектурного решения:**

1. **Разные таблицы в БД:**
   - `summary_rus` и `summary_eaeu` → таблица `weekly_payout_summary` (поля без `_total`)
   - `summary_total` → таблица `weekly_payout_total` (поля с `_total`)

2. **Семантическое различие:**
   - Поля **без `_total`** = данные по одному типу отчета (RUS или EAEU)
   - Поля **с `_total`** = консолидированные данные (RUS + EAEU), явно показывают агрегацию

3. **Историческая причина:**
   - Таблица `weekly_payout_total` была создана позже (Story 2.4) для оптимизации запросов
   - Суффикс `_total` был добавлен для явного указания, что это сумма двух отчетов
   - Это предотвращает путаницу: `sale_gross` (RUS) vs `sale_gross_total` (RUS + EAEU)

**Backend Reference:**
- Schema: `prisma/schema.prisma:282-334` (WeeklyPayoutSummary), `337-366` (WeeklyPayoutTotal)
- Service mapping: `src/analytics/weekly-analytics.service.ts:143-237`
- DTOs:
  - `src/analytics/dto/weekly-payout-summary.dto.ts` (поля без `_total`)
  - `src/analytics/dto/weekly-payout-total.dto.ts` (поля с `_total`)

**Рекомендация Backend:**
- ✅ Текущий формат является **финальным и стабильным**
- ✅ Frontend должен поддерживать оба формата (как сейчас реализовано)
- ⚠️ **Не рекомендуется** унифицировать формат, так как это потребует миграции БД и изменения бизнес-логики

#### 2.2. Какой summary должен использоваться по умолчанию для dashboard метрик?

**Рекомендация Backend:**

1. **Для dashboard метрик (общая аналитика):**
   - ✅ Использовать `summary_total` (консолидированный RUS + EAEU)
   - ✅ Это дает полную картину финансов за неделю

2. **Для детализации по типам отчетов:**
   - Использовать `summary_rus` для РФ и вне ЕАЭС
   - Использовать `summary_eaeu` для ЕАЭС
   - Использовать `summary_total` для итогового агрегата

3. **Fallback логика (текущая реализация Frontend корректна):**
   ```typescript
   const summary = summaryResponse.summary_total || summaryResponse.summary_rus
   ```
   - ✅ Если `summary_total` существует → использовать его (предпочтительно)
   - ✅ Если `summary_total` отсутствует → fallback на `summary_rus` (для обратной совместимости)

**Backend Reference:**
- Controller: `src/analytics/weekly-analytics.controller.ts:42-197`
- Service: `src/analytics/weekly-analytics.service.ts:30-93`
- Логика: `summary_total = summary_rus + summary_eaeu` для всех полей

#### 2.3. Влияет ли параметр `report_type=total` на формат ответа?

**Ответ:** ❌ **НЕТ**, параметр `report_type` **НЕ используется** в endpoint `/v1/analytics/weekly/finance-summary`.

**Обоснование:**
1. **Query DTO не содержит `report_type`:**
   - `FinanceSummaryQueryDto` содержит только `week` (см. `src/analytics/dto/finance-summary-query.dto.ts`)
   - Endpoint всегда возвращает все три summary: `summary_rus`, `summary_eaeu`, `summary_total`

2. **`report_type` используется в других endpoints:**
   - `/v1/analytics/weekly/by-sku?report_type=основной`
   - `/v1/analytics/weekly/by-brand?report_type=основной`
   - `/v1/analytics/weekly/by-category?report_type=основной`
   - `/v1/analytics/weekly/raw-transactions?report_type=основной`
   - В этих endpoints `report_type` фильтрует данные по типу отчета

3. **Почему Frontend передает `report_type=total`:**
   - Вероятно, это legacy параметр или копипаста из других endpoints
   - Backend игнорирует этот параметр (не валидирует и не использует)

**Рекомендация Backend:**
- ✅ Frontend может **убрать** параметр `report_type=total` из запросов к `/v1/analytics/weekly/finance-summary`
- ✅ Это не повлияет на работу API (параметр игнорируется)
- ✅ Упростит код frontend и уменьшит путаницу

**Backend Reference:**
- Controller: `src/analytics/weekly-analytics.controller.ts:149-197`
- Query DTO: `src/analytics/dto/finance-summary-query.dto.ts:4-15`
- Service: `src/analytics/weekly-analytics.service.ts:30-93` (не использует `report_type`)

---

### ✅ Ответ 3: Документация API

**Актуальная документация форматов ответов:**

1. **Swagger/OpenAPI документация:**
   - Доступна через Swagger UI (если настроен): `/api/docs` или `/swagger`
   - DTO классы с декораторами `@ApiProperty` автоматически генерируют документацию

2. **DTO файлы (основной источник):**
   - `src/analytics/dto/available-weeks-response.dto.ts` - формат `available-weeks`
   - `src/analytics/dto/finance-summary-response.dto.ts` - формат `finance-summary`
   - `src/analytics/dto/weekly-payout-summary.dto.ts` - поля `summary_rus`/`summary_eaeu`
   - `src/analytics/dto/weekly-payout-total.dto.ts` - поля `summary_total`

3. **Архитектурная документация:**
   - `docs/architecture/08-rest-api-spec.md:658-689` - спецификация Analytics API
   - `docs/USER-GUIDE.md:400-450` - примеры использования API

4. **Story документация:**
   - `docs/stories/epic-2/story-2.4-weekly-aggregation.md` - описание формата агрегации
   - `docs/stories/epic-2/story-2.5-analytics-api.md` - описание Analytics API endpoints

**Рекомендация Backend:**
- ✅ Обновить `frontend/docs/api-integration-guide.md` с актуальными форматами ответов
- ✅ Добавить примеры использования для обоих форматов полей (с `_total` и без)
- ✅ Указать, что `report_type` не используется в `finance-summary` endpoint

**План обновления документации:**
1. Добавить раздел "Analytics API Response Formats" в `frontend/docs/api-integration-guide.md`
2. Описать формат `available-weeks` с примером использования `start_date`
3. Описать формат `finance-summary` с объяснением различий между `summary_total` и `summary_rus`/`summary_eaeu`
4. Добавить рекомендации по выбору summary для разных use cases

---

## 📋 Итоговые рекомендации Backend Team

### Для Frontend Team:

1. **Формат `available-weeks`:**
   - ✅ Использовать текущий формат `{ data: [{ week, start_date }] }`
   - ✅ Использовать `start_date` для отображения в WeekSelector
   - ✅ Поле `week` использовать как идентификатор для API запросов

2. **Формат `finance-summary`:**
   - ✅ Использовать `summary_total` по умолчанию для dashboard метрик
   - ✅ Поддерживать оба формата полей (с `_total` и без) для обратной совместимости
   - ✅ Убрать параметр `report_type=total` из запросов (не используется backend)

3. **Документация:**
   - ✅ Обновить `frontend/docs/api-integration-guide.md` с актуальными форматами
   - ✅ Добавить примеры использования обоих форматов полей

### Стабильность API:

- ✅ Формат `available-weeks` - **стабильный**, изменения не планируются
- ✅ Формат `finance-summary` - **стабильный**, изменения не планируются
- ✅ Различия в именах полей (`_total` vs без) - **намеренное архитектурное решение**, изменения не планируются

---

**Статус:** ✅ Все вопросы Backend Team закрыты, рекомендации предоставлены

