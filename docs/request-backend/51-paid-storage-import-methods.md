# Request #51: Paid Storage Import Methods Documentation

**Date**: 2025-12-07
**Updated**: 2025-12-14 (Rate limit protection added)
**Status**: ✅ Implemented
**Epic**: Epic 24 - Paid Storage Analytics

---

## Overview

Система предоставляет два метода импорта данных платного хранения из WB API:

| Метод | Endpoint | Назначение |
|-------|----------|------------|
| **Manual Import** | `POST /v1/imports/paid-storage` | Импорт за указанный период (явные даты) |
| **Smart Import** | `POST /v1/imports/paid-storage/smart` | Автоматический выбор периода на основе данных в БД |

Дополнительно доступен endpoint для проверки статуса данных:
- `GET /v1/imports/paid-storage/status` — Статистика данных в БД

---

## Важное ограничение WB API

> ⚠️ **WB Paid Storage API возвращает полные данные только за последние 2-3 недели.**
>
> Для более старых периодов (>2 месяцев) API возвращает только корректировки и скидки,
> но НЕ базовые начисления за хранение ("короба").

**Пример различия данных:**

| Период | Данные из API | calcType | Сумма |
|--------|---------------|----------|-------|
| Октябрь 2025 | Только корректировки | NULL, "скидка..." | -1,063₽ |
| Ноябрь 2025 | Полные данные | "короба: товары...", "скидка..." | +2,500₽ |

**Вывод**: Для получения точных данных необходимо импортировать данные **ежедневно**, пока они свежие.

---

## SDK Workflow (КРИТИЧНО - обновлено 2025-12-15)

> ⚠️ **ВАЖНО**: Paid Storage API работает **асинхронно** через task-based workflow!

### 3-Step Task-Based Workflow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│ 1. paidStorage()    │────▶│ 2. getTasksStatu3() │────▶│ 3. getTasksDownload3│
│    создание задачи  │     │    поллинг статуса  │     │    скачивание данных│
│    → возвращает     │     │    каждые 5 сек     │     │    → JSON массив    │
│      taskId         │     │    до status='done' │     │                     │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

### Реализация в коде

**Файл**: `src/imports/services/paid-storage-import.service.ts`, метод `fetchPaidStorageData()`

```typescript
// Step 1: Создать задание
const taskResponse = await sdk.reports.paidStorage({ dateFrom, dateTo });
const taskId = taskResponse.data?.taskId;

// Step 2: Поллинг статуса (макс 2 мин, каждые 5 сек)
while (status !== 'done' && !timeout) {
  await wait(5000);
  const statusResponse = await sdk.reports.getTasksStatu3(taskId);
  status = statusResponse.data?.status;
}

// Step 3: Скачать данные
const data = await sdk.reports.getTasksDownload3(taskId);
```

### Возможные статусы задачи

| Статус | Описание | Действие |
|--------|----------|----------|
| `done` | Задача выполнена | Скачать данные |
| `canceled` | Задача отменена | Ошибка |
| `purged` | Данные удалены | Ошибка |
| (другие) | В обработке | Продолжить поллинг |

---

## Rate Limiting (обновлено 2025-12-15)

WB SDK имеет ограничения на частоту запросов. Наша реализация учитывает эти лимиты:

| Метод SDK | Лимит | Наша реализация |
|-----------|-------|-----------------|
| `paidStorage()` (создание задачи) | 1 req/min | 65s задержка между chunks |
| `getTasksStatu3()` (polling) | ~1 req/5sec | 5s интервал |
| `getTasksDownload3()` (скачивание) | 1 req/min | Один вызов на chunk |

### Время импорта в зависимости от периода

| Период | Chunks | Задержка между chunks | ~Общее время |
|--------|--------|----------------------|--------------|
| ≤8 дней | 1 | Нет | 5-30 сек |
| 9-16 дней | 2 | 65с × 1 | ~1.5 мин |
| 17-24 дней | 3 | 65с × 2 | ~2.5 мин |
| 25-32 дней | 4 | 65с × 3 | ~3.5 мин |
| 30 дней (месяц) | 4 | 65с × 3 | ~3.5 мин |

> 💡 **Рекомендация**: Smart Import (`initial_7_days` или `daily_incremental`) не имеет задержек, так как всегда укладывается в один chunk (≤7 дней).

---

## Method 1: Manual Import

### Описание
Импорт данных за **явно указанный период**. Используется когда нужен контроль над датами.

### Endpoint
```http
POST /v1/imports/paid-storage
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
Content-Type: application/json
```

### Request Body
```json
{
  "dateFrom": "2025-12-01",
  "dateTo": "2025-12-07"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|--------------|----------|
| `dateFrom` | string (YYYY-MM-DD) | ✅ Да | Начало периода |
| `dateTo` | string (YYYY-MM-DD) | ✅ Да | Конец периода (включительно) |

### Response (202 Accepted)
```json
{
  "import_id": "job-123",
  "status": "queued",
  "date_range": {
    "from": "2025-12-01",
    "to": "2025-12-07"
  },
  "rows_imported": 0,
  "message": "Import queued for processing."
}
```

### Ограничения
- **Max 8 дней** за один запрос (ограничение WB API)
- Для больших периодов система автоматически разбивает на несколько запросов
- **Rate limit**: 65 секунд задержка между chunk-запросами (SDK compliance, 2025-12-14)

### Когда использовать
- Первоначальная загрузка за конкретный период
- Ручная перезагрузка данных за определённые даты
- Тестирование и отладка
- Загрузка данных за период с известными проблемами

---

## Method 2: Smart Import

### Описание
**Автоматический выбор периода** на основе анализа существующих данных в БД:

| Условие | Стратегия | Период |
|---------|-----------|--------|
| Нет данных в БД | `initial_7_days` | Последние 7 дней |
| Данные есть | `daily_incremental` | Только вчера |

### Endpoint
```http
POST /v1/imports/paid-storage/smart
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Request Body
Не требуется (тело запроса пустое или отсутствует).

### Response (202 Accepted)
```json
{
  "import_id": "job-456",
  "status": "queued",
  "import_strategy": "daily_incremental",
  "message": "Existing data found - will import yesterday only"
}
```

| Поле | Описание |
|------|----------|
| `import_id` | ID задачи в BullMQ для отслеживания |
| `status` | Статус: `queued` |
| `import_strategy` | Выбранная стратегия: `initial_7_days` или `daily_incremental` |
| `message` | Человекочитаемое описание действия |

### Логика выбора стратегии

```
┌─────────────────────────────────────┐
│  POST /v1/imports/paid-storage/smart │
└─────────────────┬───────────────────┘
                  ▼
         ┌───────────────┐
         │ Проверка БД:  │
         │ есть ли данные│
         │ для кабинета? │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
   Нет данных        Данные есть
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│ initial_7_days│  │daily_increment│
│               │  │               │
│ Импорт за     │  │ Импорт только │
│ последние     │  │ за вчера      │
│ 7 дней        │  │               │
└───────────────┘  └───────────────┘
```

### Когда использовать
- **Автоматический ежедневный импорт** (cron 06:00 MSK)
- Ручной запуск без необходимости указывать даты
- Первый импорт для нового кабинета
- Когда не уверены в текущем состоянии данных

---

## Data Status Endpoint

### Описание
Возвращает статистику о данных платного хранения в БД для кабинета.

### Endpoint
```http
GET /v1/imports/paid-storage/status
Authorization: Bearer <token>
X-Cabinet-Id: <cabinet-uuid>
```

### Response (200 OK)
```json
{
  "hasData": true,
  "recordCount": 1934,
  "oldestDate": "2025-10-13",
  "newestDate": "2025-12-05",
  "lastImportDate": "2025-12-07T04:33:52Z"
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `hasData` | boolean | Есть ли данные в таблице `paid_storage_daily` |
| `recordCount` | number | Количество записей |
| `oldestDate` | string \| null | Самая ранняя дата данных |
| `newestDate` | string \| null | Самая поздняя дата данных |
| `lastImportDate` | string \| null | Дата последнего успешного импорта |

### Когда использовать
- Проверка актуальности данных перед аналитикой
- Диагностика проблем с импортом
- UI: показать пользователю статус данных

---

## Сравнение методов

| Характеристика | Manual Import | Smart Import |
|----------------|---------------|--------------|
| **Требует даты** | ✅ Да | ❌ Нет |
| **Автовыбор периода** | ❌ Нет | ✅ Да |
| **Используется в cron** | ❌ Нет | ✅ Да (06:00 MSK) |
| **Первый импорт** | Указать явно | Автоматически 7 дней |
| **Инкрементальный** | Указать явно | Автоматически вчера |
| **Контроль над датами** | ✅ Полный | ❌ Нет |
| **Для отладки** | ✅ Подходит | ⚠️ Ограниченно |

---

## Автоматизация

### Daily Cron Job (06:00 MSK)

Система автоматически запускает smart import для всех кабинетов:

```
Daily at 06:00 MSK (03:00 UTC):
├── Для каждого кабинета с WB API ключом:
│   ├── Вызов smartImport(cabinetId)
│   │   ├── Проверка: есть ли данные?
│   │   │   ├── Нет → import(7 дней назад ... вчера)
│   │   │   └── Да → import(только вчера)
│   │   └── Результат записывается в лог
│   └── Ошибки логируются, не прерывают обработку других кабинетов
└── Итоговый отчёт: X успешно, Y ошибок, Z строк импортировано
```

**Почему 06:00 MSK?**
- WB финализирует данные за предыдущий день ночью
- К 06:00 данные за вчера полностью доступны
- Запуск до начала рабочего дня в России

### Auto-Import при создании WB ключа

При добавлении нового `wb_api_token`:
1. Немедленный импорт за последние 7 дней
2. Создание расписания ежедневного импорта (06:00 MSK)

---

## Примеры использования

### Пример 1: Первый импорт для нового кабинета
```bash
# Smart import автоматически определит, что данных нет
curl -X POST "https://api.example.com/v1/imports/paid-storage/smart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"

# Response:
# {
#   "import_strategy": "initial_7_days",
#   "message": "No existing data - will import last 7 days"
# }
```

### Пример 2: Ежедневное обновление
```bash
# Smart import определит, что данные есть
curl -X POST "https://api.example.com/v1/imports/paid-storage/smart" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"

# Response:
# {
#   "import_strategy": "daily_incremental",
#   "message": "Existing data found - will import yesterday only"
# }
```

### Пример 3: Ручной импорт за конкретный период
```bash
curl -X POST "https://api.example.com/v1/imports/paid-storage" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID" \
  -H "Content-Type: application/json" \
  -d '{"dateFrom": "2025-12-01", "dateTo": "2025-12-07"}'

# Response:
# {
#   "date_range": {"from": "2025-12-01", "to": "2025-12-07"},
#   "message": "Import queued for processing."
# }
```

### Пример 4: Проверка статуса данных
```bash
curl -X GET "https://api.example.com/v1/imports/paid-storage/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"

# Response:
# {
#   "hasData": true,
#   "recordCount": 1934,
#   "oldestDate": "2025-10-13",
#   "newestDate": "2025-12-06"
# }
```

---

## Обработка ошибок

| HTTP Code | Ситуация | Действие |
|-----------|----------|----------|
| 400 | Неверный формат даты | Проверить формат YYYY-MM-DD |
| 401 | Невалидный токен | Обновить JWT |
| 403 | Нет доступа к кабинету | Проверить X-Cabinet-Id |
| 404 | Кабинет не найден | Проверить существование кабинета |
| 429 | Rate limit | Повторить через Retry-After секунд |
| 500 | Ошибка WB API | Проверить логи, повторить позже |

---

## Связанные файлы

| Файл | Описание |
|------|----------|
| `src/imports/imports.controller.ts` | Контроллер с endpoints |
| `src/imports/services/paid-storage-import.service.ts` | Сервис с логикой `smartImport()` |
| `src/imports/processors/paid-storage-import.processor.ts` | BullMQ processor |
| `src/tasks/services/task-scheduler.service.ts` | Daily cron job |

---

## См. также

- [Epic 24: Paid Storage by Article](../../../docs/epics/epic-24-paid-storage-by-article.md)
- [Story 24.4: Auto Scheduler](../../../docs/stories/epic-24/story-24.4-auto-scheduler.md)
- [API Reference: Paid Storage Import](../../../docs/API-PATHS-REFERENCE.md#paid-storage-import-epic-24)
- [Storage API Guide](../../../docs/STORAGE-API-GUIDE.md) — SDK workflow, сравнение данных, troubleshooting
- [Request #39: Storage Data Sources Discrepancy](./135-storage-data-sources-discrepancy.md) -- анализ расхождений между источниками

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-12-07
- **Summary**: Paid storage import methods fully documented and implemented. Includes manual import (`POST /v1/imports/paid-storage`), smart import (`POST /v1/imports/paid-storage/smart`), and data status endpoint (`GET /v1/imports/paid-storage/status`). Daily cron job runs at 06:00 MSK. Smart import automatically selects initial 7-day or incremental strategy.
- **Remaining frontend action**: Integrate storage import UI with manual date selection and smart import button.
