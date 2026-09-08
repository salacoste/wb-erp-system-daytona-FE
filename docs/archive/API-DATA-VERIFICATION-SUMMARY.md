# API Data Verification Summary

## ✅ Проверка корректности получения данных от backend

**Дата проверки:** 2025-11-21  
**Story 2.7:** Endpoint `available-weeks` использует `weekly_payout_total` вместо `imports`

---

## 📊 Анализ обработки данных

### 1. Формат ответа `available-weeks`

**Backend возвращает:**

```json
{
  "data": [
    { "week": "2025-W46", "start_date": "2025-11-09" },
    { "week": "2025-W45", "start_date": "2025-11-02" }
  ]
}
```

**Обработка в `api-client.ts`:**

```typescript
// Строка 105: return (data.data ?? data) as T
// Если ответ { data: [...] }, то:
// - data.data будет массивом [...]
// - Вернется массив напрямую
```

**Обработка в hooks:**

```typescript
// useDashboard.ts:48
const weeksResponse = await apiClient.get<{
  data: Array<{ week: string; start_date: string }>
}>('/v1/analytics/weekly/available-weeks')

// ⚠️ ПРОБЛЕМА: Если apiClient возвращает массив напрямую,
// то weeksResponse будет массивом, а не объектом { data: [...] }
// weeksResponse.data будет undefined!
```

**🔴 ВЫЯВЛЕНА ПРОБЛЕМА:** Несоответствие между обработкой в `api-client.ts` и ожиданиями в hooks.

---

## 🔧 Решение

### Вариант 1: Изменить обработку в hooks (РЕКОМЕНДУЕТСЯ)

Если `apiClient` возвращает массив напрямую, нужно изменить логику в hooks:

```typescript
// Текущий код (НЕПРАВИЛЬНО):
const weeksResponse = await apiClient.get<{
  data: Array<{ week: string; start_date: string }>
}>('/v1/analytics/weekly/available-weeks')
const weeks = weeksResponse?.data?.map((w) => w.week) || []

// Исправленный код:
const weeksResponse = await apiClient.get<Array<{ week: string; start_date: string }>>(
  '/v1/analytics/weekly/available-weeks'
)
// apiClient вернет массив напрямую, если backend возвращает { data: [...] }
const weeks = Array.isArray(weeksResponse)
  ? weeksResponse.map((w) => w.week)
  : weeksResponse?.data?.map((w) => w.week) || []
```

### Вариант 2: Проверить фактический формат ответа

Нужно проверить, что именно возвращает backend:

- Если `{ data: [...] }` → `apiClient` вернет массив `[...]`
- Если просто массив `[...]` → `apiClient` вернет массив `[...]`

---

## 🧪 Как проверить

### Шаг 1: Проверить в браузере (DevTools)

1. Откройте `http://localhost:3100/dashboard`
2. Откройте DevTools → Network
3. Найдите запрос `GET /v1/analytics/weekly/available-weeks`
4. Проверьте Response:
   - Если `{ data: [...] }` → нужно исправить hooks
   - Если `[...]` → hooks работают правильно

### Шаг 2: Проверить логи в консоли

**Ожидаемые логи при правильной работе:**

```
[Dashboard Metrics] Fetching finance summary for week: 2025-W46
[Dashboard Metrics] Finance summary received: { to_pay_goods: ..., sale_gross: ... }
```

**Если видите ошибки:**

```
[Dashboard Metrics] No available weeks found...
```

→ Проверить, что `weeksResponse` не undefined

---

## ✅ Рекомендации

1. **Проверить фактический формат ответа** в Network tab браузера
2. **Исправить hooks**, если формат не соответствует ожиданиям
3. **Добавить защиту** от обоих форматов (массив и объект)

---

**Статус:** ⚠️ Требуется проверка фактического формата ответа
