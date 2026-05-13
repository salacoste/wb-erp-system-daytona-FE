# API Data Verification Guide

## 📋 Цель

Проверка корректности получения данных от backend после реализации Story 2.7.

**Story 2.7:** Endpoint `/v1/analytics/weekly/available-weeks` теперь использует таблицу `weekly_payout_total` вместо `imports`.

---

## ✅ Проверка корректности получения данных

### 1. Проверка формата ответа `available-weeks`

**Ожидаемый формат:**
```json
{
  "data": [
    { "week": "2025-W46", "start_date": "2025-11-09" },
    { "week": "2025-W45", "start_date": "2025-11-02" },
    { "week": "2025-W44", "start_date": "2025-10-26" }
  ]
}
```

**Проверка в коде:**
```typescript
// src/hooks/useDashboard.ts:48
const weeksResponse = await apiClient.get<{ 
  data: Array<{ week: string; start_date: string }> 
}>('/v1/analytics/weekly/available-weeks')

// Извлекаем week из объектов
const weeks = weeksResponse?.data?.map((w) => w.week) || []
```

**✅ Статус:** Код корректно обрабатывает формат ответа

---

### 2. Проверка обработки пустого массива

**Ожидаемое поведение:**
- Пустой массив `{ data: [] }` = нет агрегированных данных (нормальное состояние)
- Не должно показываться как ошибка

**Проверка в коде:**
```typescript
// src/hooks/useDashboard.ts:54-56
if (!weeks || weeks.length === 0) {
  console.info('[Dashboard Metrics] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.')
  return {}
}
```

**✅ Статус:** Пустой массив обрабатывается корректно как нормальное состояние

---

### 3. Проверка формата ответа `finance-summary`

**Ожидаемый формат:**
```json
{
  "summary_total": {
    "week": "2025-W46",
    "sale_gross_total": 0.00,
    "to_pay_goods_total": 195470.62,
    "logistics_cost_total": 0.00,
    "storage_cost_total": 0.00,
    "penalties_total": 0.00,
    "loyalty_fee_total": 0.00,
    "payout_total": 195470.62
  },
  "summary_rus": { ... },
  "summary_eaeu": { ... },
  "meta": {
    "week": "2025-W46",
    "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    "generated_at": "2025-11-21T19:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

**Проверка в коде:**
```typescript
// src/hooks/useDashboard.ts:65-70
const summaryResponse = await apiClient.get<{
  summary_total: FinanceSummary | null
  summary_rus: FinanceSummary | null
  summary_eaeu: FinanceSummary | null
  meta: { week: string; cabinet_id: string; generated_at: string; timezone: string }
}>(`/v1/analytics/weekly/finance-summary?week=${latestWeek}`)

// Используем summary_total или fallback на summary_rus
const summary = summaryResponse.summary_total || summaryResponse.summary_rus
```

**✅ Статус:** Код корректно обрабатывает формат ответа с поддержкой обоих форматов полей

---

### 4. Проверка поддержки полей с `_total` и без

**Ожидаемое поведение:**
- Поддержка полей с суффиксом `_total` (из `summary_total`)
- Поддержка полей без суффикса (из `summary_rus`/`summary_eaeu` - legacy)

**Проверка в коде:**
```typescript
// src/hooks/useDashboard.ts:92-93
return {
  totalPayable: summary.to_pay_goods_total ?? summary.to_pay_goods,
  revenue: summary.sale_gross_total ?? summary.sale_gross,
}
```

**✅ Статус:** Код поддерживает оба формата полей

---

### 5. Проверка гарантии доступности данных (Story 2.7)

**Ожидаемое поведение:**
- Если неделя в списке `available-weeks` → данные гарантированно доступны
- Ошибка 404 для недели из списка не должна происходить

**Проверка в коде:**
```typescript
// src/hooks/useDashboard.ts:75-83
if (!summary) {
  // Story 2.7: This should NOT happen if week is in available-weeks list
  // If it does, it's a bug - log it for monitoring
  console.error('[Dashboard Metrics] CRITICAL: No summary data for week from available-weeks list', {
    week: latestWeek,
    availableWeeks: weeks,
    summaryResponse,
  })
  return {}
}
```

**✅ Статус:** Добавлено логирование для мониторинга критических ошибок

---

### 6. Проверка автоматического добавления заголовков

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

**✅ Статус:** Заголовки добавляются автоматически из authStore

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
[Expenses] No available weeks found. Financial data may not be processed yet. This is normal - data will appear after aggregation completes.
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

**Пример успешного ответа `available-weeks`:**
```json
{
  "data": [
    { "week": "2025-W46", "start_date": "2025-11-09" },
    { "week": "2025-W45", "start_date": "2025-11-02" }
  ]
}
```

**Пример успешного ответа `finance-summary`:**
```json
{
  "summary_total": {
    "week": "2025-W46",
    "sale_gross_total": 0.00,
    "to_pay_goods_total": 195470.62,
    "logistics_cost_total": 0.00,
    "storage_cost_total": 0.00,
    "penalties_total": 0.00,
    "loyalty_fee_total": 0.00,
    "payout_total": 195470.62
  },
  "summary_rus": null,
  "summary_eaeu": null,
  "meta": {
    "week": "2025-W46",
    "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    "generated_at": "2025-11-21T19:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

---

## 🔍 Проверка через test-api/

> **⚠️ ОБНОВЛЕНО (2025-12-06):** Файл `test-api.http` был разделён на несколько файлов в директории `test-api/`.
> См. `test-api/SECTION-MAPPING.md` для полного маппинга.

### Использование REST Client в VS Code

1. Откройте директорию `test-api/` и файл `00-variables.http`
2. Убедитесь, что переменные настроены:
   ```http
   @baseUrl = http://localhost:3000
   @cabinetId = f75836f7-c0bc-4b2c-823c-a1f3508cce8e
   @email = test@test.com
   @password = Russia23!
   ```

3. Выполните запросы в порядке:
   - **Сначала:** `### 1. Login` - получить JWT token
   - **Затем:** `### 5. Get Available Weeks` - проверить список недель
   - **Затем:** `### 16. Get Finance Summary` - проверить данные за неделю

### Ожидаемые результаты

**После Story 2.7:**
- ✅ `available-weeks` возвращает недели из `weekly_payout_total`
- ✅ Если неделя в списке → `finance-summary` гарантированно возвращает данные
- ✅ Нет race condition между импортом и агрегацией

---

## ✅ Чеклист проверки

### Frontend код

- [x] Формат ответа `available-weeks` обрабатывается корректно
- [x] Пустой массив обрабатывается как нормальное состояние
- [x] Формат ответа `finance-summary` обрабатывается корректно
- [x] Поддержка полей с `_total` и без (обратная совместимость)
- [x] Логирование критических ошибок добавлено
- [x] Заголовки добавляются автоматически из authStore

### Backend (после Story 2.7)

- [ ] Endpoint `available-weeks` использует `weekly_payout_total`
- [ ] Endpoint возвращает недели с готовыми агрегированными данными
- [ ] Формат ответа соответствует документации
- [ ] Нет race condition между импортом и агрегацией

### Интеграция

- [ ] Frontend получает данные корректно
- [ ] Метрики отображаются на dashboard
- [ ] График расходов отображается корректно
- [ ] Нет ошибок в консоли браузера
- [ ] Нет ошибок 404 для недель из списка

---

## 🐛 Отладка проблем

### Проблема: Пустой массив `available-weeks`

**Возможные причины:**
1. Нет агрегированных данных в `weekly_payout_total`
2. Backend еще не обновлен (Story 2.7 не реализована)
3. Неправильный `cabinetId` в заголовке

**Решение:**
1. Проверить данные в БД: `SELECT week FROM weekly_payout_total WHERE cabinet_id = ?`
2. Проверить, что backend обновлен
3. Проверить заголовок `X-Cabinet-Id` в Network tab

### Проблема: 404 для недели из списка

**Возможные причины:**
1. Баг в backend (не должно происходить после Story 2.7)
2. Несоответствие данных между `weekly_payout_total` и `weekly_payout_summary`

**Решение:**
1. Проверить логи в консоли (должно быть `CRITICAL` сообщение)
2. Отправить в систему мониторинга ошибок
3. Сообщить Backend Team

### Проблема: Данные не отображаются

**Возможные причины:**
1. Пустой массив `available-weeks`
2. Ошибка при запросе `finance-summary`
3. Неправильная обработка формата ответа

**Решение:**
1. Проверить логи в консоли браузера
2. Проверить Network tab для ошибок
3. Проверить, что `summary_total` или `summary_rus` не null

---

## 📊 Примеры успешных ответов

### Успешный ответ `available-weeks`:
```json
{
  "data": [
    { "week": "2025-W46", "start_date": "2025-11-09" },
    { "week": "2025-W45", "start_date": "2025-11-02" },
    { "week": "2025-W44", "start_date": "2025-10-26" }
  ]
}
```

### Успешный ответ `finance-summary`:
```json
{
  "summary_total": {
    "week": "2025-W46",
    "sale_gross_total": 0.00,
    "to_pay_goods_total": 195470.62,
    "logistics_cost_total": 0.00,
    "storage_cost_total": 0.00,
    "penalties_total": 0.00,
    "loyalty_fee_total": 0.00,
    "payout_total": 195470.62
  },
  "summary_rus": null,
  "summary_eaeu": null,
  "meta": {
    "week": "2025-W46",
    "cabinet_id": "f75836f7-c0bc-4b2c-823c-a1f3508cce8e",
    "generated_at": "2025-11-21T19:30:00.000Z",
    "timezone": "Europe/Moscow"
  }
}
```

---

**Дата создания:** 2025-11-21  
**Последнее обновление:** 2025-11-21  
**Автор:** Frontend Team (Auto - Dev Agent)

