# Финальная проверка получения данных от backend

**Дата:** 2025-11-21  
**Story 2.7:** ✅ **ЗАДЕПЛОЕНО** - Endpoint `available-weeks` теперь использует `weekly_payout_total`

---

## ✅ Проверка логики обработки данных

### 1. Формат ответа от backend

**Backend возвращает:**

```json
{
  "data": [
    { "week": "2025-W46", "start_date": "2025-11-09" },
    { "week": "2025-W45", "start_date": "2025-11-02" }
  ]
}
```

### 2. Обработка в `api-client.ts`

**Строка 105:**

```typescript
return (data.data ?? data) as T
```

**Логика:**

- Backend вернул: `{ data: [...] }`
- `data.data` = массив `[...]`
- `apiClient.get()` вернет массив напрямую: `[{ week: "...", start_date: "..." }]`

### 3. Обработка в hooks (`useDashboard.ts`, `useExpenses.ts`)

**Текущая реализация:**

```typescript
// Получаем ответ от apiClient (массив или объект)
const weeksResponse = await apiClient.get<Array<{ week: string; start_date: string }> | { data: Array<{ week: string; start_date: string }> }>('/v1/analytics/weekly/available-weeks')

// Обрабатываем оба формата
const weeksArray = Array.isArray(weeksResponse)
  ? weeksResponse                    // Если массив (обычный случай после Story 2.7)
  : weeksResponse?.data || []        // Если объект (fallback)

// Извлекаем только week строки
const weeks = weeksArray.map((w) => w.week)
```

**Проверка логики:**

1. ✅ Backend возвращает `{ data: [...] }`
2. ✅ `apiClient` извлекает `data.data` → возвращает массив `[...]`
3. ✅ `Array.isArray(weeksResponse)` = `true`
4. ✅ `weeksArray = weeksResponse` = массив объектов
5. ✅ `weeks = weeksArray.map((w) => w.week)` = массив строк `["2025-W46", ...]`

**✅ Логика корректна!**

---

## ✅ Проверка получения `finance-summary`

### Формат ответа от backend

**Backend возвращает:**

```json
{
  "summary_total": {
    "week": "2025-W46",
    "to_pay_goods_total": 1000000,
    "sale_gross_total": 1200000,
    "logistics_cost_total": 50000,
    "storage_cost_total": 30000,
    "penalties_total": 20000,
    "loyalty_fee_total": 10000
  },
  "summary_rus": { ... },
  "summary_eaeu": { ... },
  "meta": { ... }
}
```

### Обработка в hooks

**Текущая реализация:**

```typescript
const summaryResponse = await apiClient.get<{
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
}>(`/v1/analytics/weekly/finance-summary?week=${latestWeek}`)

// Используем summary_total или fallback на summary_rus
const summary = summaryResponse.summary_total || summaryResponse.summary_rus

// Поддержка полей с _total и без (legacy)
const totalPayable = summary.to_pay_goods_total ?? summary.to_pay_goods
const revenue = summary.sale_gross_total ?? summary.sale_gross
```

**Проверка логики:**

1. ✅ `apiClient` возвращает объект напрямую (не извлекает `data.data`, т.к. нет вложенного `data`)
2. ✅ Используем `summary_total` (консолидированный) или fallback на `summary_rus`
3. ✅ Поддержка полей с `_total` и без (legacy формат)

**✅ Логика корректна!**

---

## 🧪 Как проверить в браузере

### 1. Откройте DevTools (F12)

### 2. Перейдите на вкладку Console

### 3. Проверьте логи

После загрузки dashboard вы должны увидеть логи:

```
[Dashboard Metrics] Fetching finance summary for week: 2025-W46
[Dashboard Metrics] Finance summary received: { to_pay_goods: 1000000, sale_gross: 1200000 }
```

Или, если данных нет:

```
[Dashboard Metrics] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.
```

### 4. Проверьте Network tab

1. Откройте вкладку **Network**
2. Найдите запрос `available-weeks`
3. Проверьте Response:
   ```json
   {
     "data": [
       { "week": "2025-W46", "start_date": "2025-11-09" }
     ]
   }
   ```
4. Найдите запрос `finance-summary?week=2025-W46`
5. Проверьте Response:
   ```json
   {
     "summary_total": { ... },
     "summary_rus": { ... },
     "summary_eaeu": { ... },
     "meta": { ... }
   }
   ```

---

## ✅ Итоговая проверка

### Код готов к работе с backend после Story 2.7:

1. ✅ **Обработка `available-weeks`:**
   - Корректно обрабатывает формат `{ data: [...] }`
   - `apiClient` извлекает массив напрямую
   - Hooks обрабатывают массив корректно
   - Пустой массив обрабатывается как нормальное состояние

2. ✅ **Обработка `finance-summary`:**
   - Корректно обрабатывает формат с `summary_total`, `summary_rus`, `summary_eaeu`
   - Использует `summary_total` по умолчанию
   - Поддерживает поля с `_total` и без (legacy)

3. ✅ **Обработка ошибок:**
   - 404 для недели из `available-weeks` логируется как критическая ошибка
   - Пустой массив недель не считается ошибкой
   - Graceful fallback на пустые данные

4. ✅ **Логирование:**
   - Информационные логи для нормальных состояний
   - Критические логи для неожиданных ошибок
   - Детальная информация для отладки

---

## 🎯 Рекомендации

1. **После деплоя Story 2.7:**
   - Проверить, что endpoint `available-weeks` возвращает недели из `weekly_payout_total`
   - Убедиться, что данные отображаются на dashboard
   - Проверить логи в консоли браузера

2. **Мониторинг:**
   - Следить за критическими логами (404 для недели из списка)
   - Отслеживать случаи, когда `summary_total` отсутствует для недели из списка

3. **Тестирование:**
   - Использовать `test-api/02-health.http` для тестирования endpoint (available-weeks)
   - Проверить с реальными данными после деплоя

---

**Статус:** ✅ **ГОТОВО К ПРОВЕРКЕ** - Код корректно обрабатывает формат ответов от backend после Story 2.7
