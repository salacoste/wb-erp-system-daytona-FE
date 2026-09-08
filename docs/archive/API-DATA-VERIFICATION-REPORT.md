# API Data Verification Report

## ✅ Проверка корректности получения данных от backend

**Дата проверки:** 2025-11-21  
**Story 2.7:** Endpoint `available-weeks` использует `weekly_payout_total` вместо `imports`  
**Статус:** ✅ **ЗАДЕПЛОЕНО** - Story 2.7 задеплоена на backend (2025-11-21)

---

## 🔍 Выявленные проблемы и исправления

### Проблема 1: Обработка формата ответа `available-weeks`

**Проблема:**

- `api-client.ts` извлекает `data.data` из ответа (строка 105: `return (data.data ?? data) as T`)
- Если backend возвращает `{ data: [...] }`, то `apiClient` вернет массив напрямую
- В hooks мы ожидали объект `{ data: [...] }`, но получали массив

**Исправление:**

- Добавлена поддержка обоих форматов (массив и объект)
- Код теперь корректно обрабатывает оба случая

**Файлы изменены:**

- ✅ `src/hooks/useDashboard.ts` - исправлена обработка `available-weeks`
- ✅ `src/hooks/useExpenses.ts` - исправлена обработка `available-weeks`

---

## ✅ Проверка корректности кода

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

**Обработка в hooks (ИСПРАВЛЕНО):**

```typescript
// Поддержка обоих форматов: массив или объект { data: [...] }
const weeksResponse = await apiClient.get<Array<{ week: string; start_date: string }> | { data: Array<{ week: string; start_date: string }> }>('/v1/analytics/weekly/available-weeks')

// Извлекаем массив недель (обрабатываем оба формата)
const weeksArray = Array.isArray(weeksResponse)
  ? weeksResponse
  : weeksResponse?.data || []
const weeks = weeksArray.map((w) => w.week)
```

**✅ Статус:** Исправлено - код поддерживает оба формата

---

### 2. Обработка пустого массива

**Ожидаемое поведение:**

- Пустой массив = нет агрегированных данных (нормальное состояние)
- Не должно показываться как ошибка

**Проверка в коде:**

```typescript
// Story 2.7: Empty array = no aggregated data yet (normal state, not an error)
if (!weeks || weeks.length === 0) {
  console.info('[Dashboard Metrics] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.')
  return {}
}
```

**✅ Статус:** Корректно обрабатывается

---

### 3. Формат ответа `finance-summary`

**Backend возвращает:**

```json
{
  "summary_total": { ... },
  "summary_rus": { ... },
  "summary_eaeu": { ... },
  "meta": { ... }
}
```

**Обработка в hooks:**

```typescript
const summaryResponse = await apiClient.get<{
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
}>(`/v1/analytics/weekly/finance-summary?week=${latestWeek}`)

// Используем summary_total или fallback на summary_rus
const summary = summaryResponse.summary_total || summaryResponse.summary_rus
```

**✅ Статус:** Корректно обрабатывается

---

### 4. Поддержка полей с `_total` и без

**Ожидаемое поведение:**

- Поддержка полей с суффиксом `_total` (из `summary_total`)
- Поддержка полей без суффикса (из `summary_rus`/`summary_eaeu` - legacy)

**Проверка в коде:**

```typescript
return {
  totalPayable: summary.to_pay_goods_total ?? summary.to_pay_goods,
  revenue: summary.sale_gross_total ?? summary.sale_gross,
}
```

**✅ Статус:** Корректно поддерживается

---

### 5. Автоматическое добавление заголовков

**Ожидаемое поведение:**

- `apiClient` автоматически добавляет `Authorization: Bearer {token}`
- `apiClient` автоматически добавляет `X-Cabinet-Id: {cabinetId}`

**Проверка в коде:**

```typescript
// src/lib/api-client.ts:39-52
const { token, cabinetId } = useAuthStore.getState()

if (!options.skipAuth && token) {
  headers['Authorization'] = `Bearer ${token}`
}

if (!options.skipCabinetId && cabinetId) {
  headers['X-Cabinet-Id'] = cabinetId
}
```

**✅ Статус:** Корректно работает

---

### 6. Логирование и мониторинг

**Добавлено:**

- ✅ Логирование пустого массива как нормального состояния
- ✅ Логирование критических ошибок (404 для недели из списка)
- ✅ Логирование отсутствия данных для недели из списка

**✅ Статус:** Логирование добавлено

---

## 🧪 Как проверить в браузере

### Шаг 1: Откройте DevTools

1. Откройте `http://localhost:3100/dashboard`
2. Нажмите `F12` для открытия DevTools
3. Перейдите на вкладку **Console**

### Шаг 2: Проверьте логи

**Ожидаемые логи при успешной загрузке:**

```
[Dashboard Metrics] Fetching finance summary for week: 2025-W46
[Dashboard Metrics] Finance summary received: { to_pay_goods: ..., sale_gross: ... }
[Expenses] Fetching finance summary for week: 2025-W46
[Expenses] Found X expense categories with total: ...
```

**Ожидаемые логи при отсутствии данных:**

```
[Dashboard Metrics] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.
```

### Шаг 3: Проверьте Network Tab

1. Перейдите на вкладку **Network**
2. Найдите запросы:
   - `GET /v1/analytics/weekly/available-weeks`
   - `GET /v1/analytics/weekly/finance-summary?week=...`

**Проверьте:**

- ✅ Status: `200 OK`
- ✅ Request Headers: `Authorization: Bearer ...` и `X-Cabinet-Id: ...`
- ✅ Response: JSON с корректным форматом

---

## ✅ Итоговый статус

### Frontend код

- [x] Формат ответа `available-weeks` обрабатывается корректно (исправлено)
- [x] Поддержка обоих форматов (массив и объект)
- [x] Пустой массив обрабатывается как нормальное состояние
- [x] Формат ответа `finance-summary` обрабатывается корректно
- [x] Поддержка полей с `_total` и без (обратная совместимость)
- [x] Логирование критических ошибок добавлено
- [x] Заголовки добавляются автоматически из authStore

### Рекомендации для проверки

1. **Проверить в браузере:**
   - Открыть `http://localhost:3100/dashboard`
   - Проверить логи в консоли
   - Проверить Network tab для запросов

2. **Проверить данные:**
   - Убедиться, что метрики отображаются
   - Убедиться, что график расходов отображается
   - Проверить, что нет ошибок в консоли

3. **Проверить после Story 2.7:**
   - Endpoint `available-weeks` должен возвращать недели из `weekly_payout_total`
   - Не должно быть race condition
   - Гарантия доступности данных для недель из списка

---

## 📝 Изменения в коде

### Исправления

1. **`src/hooks/useDashboard.ts`:**
   - Добавлена поддержка обоих форматов ответа `available-weeks`
   - Улучшена обработка пустого массива
   - Добавлено логирование критических ошибок

2. **`src/hooks/useExpenses.ts`:**
   - Добавлена поддержка обоих форматов ответа `available-weeks`
   - Улучшена обработка пустого массива
   - Добавлено логирование критических ошибок

---

**Дата создания:** 2025-11-21  
**Последнее обновление:** 2025-11-21  
**Дата деплоя Story 2.7:** 2025-11-21  
**Автор:** Frontend Team (Auto - Dev Agent)  
**Статус:** ✅ Код исправлен, Story 2.7 задеплоена - данные должны получаться корректно

---

## 🎉 Story 2.7 задеплоена

**Дата деплоя:** 2025-11-21

После деплоя Story 2.7 на backend:

- ✅ Endpoint `/v1/analytics/weekly/available-weeks` теперь использует таблицу `weekly_payout_total`
- ✅ Недели возвращаются только после успешной агрегации данных
- ✅ Гарантия: если неделя в списке → данные доступны через `finance-summary`
- ✅ Нет race condition между импортом и агрегацией

**Рекомендации:**

1. Протестировать endpoint с реальными данными после деплоя
2. Проверить, что данные корректно отображаются на dashboard
3. Убедиться, что нет ошибок в консоли браузера
