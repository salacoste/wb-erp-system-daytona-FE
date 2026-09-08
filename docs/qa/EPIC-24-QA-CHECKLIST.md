# Epic 24: Paid Storage Analytics - QA Validation Checklist

**Дата создания:** 2025-12-04
**Epic:** Paid Storage Analytics (Frontend)
**Stories:** 8 (24.1-fe - 24.8-fe)
**Маршрут:** `/analytics/storage`
**Предварительный статус Dev:** PASS (bugfixes applied 2025-12-04)

---

## 📋 Pre-QA Checklist

- [ ] Backend запущен и доступен
- [ ] Frontend запущен (`pm2 start ecosystem.config.js`)
- [ ] Авторизация работает (JWT token получен)
- [ ] Cabinet ID установлен в headers
- [ ] В базе есть данные paid_storage_daily (или импортированы через API)

---

## 🧪 Story 24.1-fe: TypeScript Types & API Client

**Quality Score:** 85/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                                | Как проверить                                                                                               | Status |
| --- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| AC1 | Types соответствуют backend API         | Сравнить `src/types/storage-analytics.ts` с `docs/request-backend/36-epic-24-paid-storage-analytics-api.md` | ☐      |
| AC2 | API функции корректно формируют запросы | Открыть DevTools > Network, проверить запросы к `/v1/analytics/storage/*`                                   | ☐      |
| AC3 | React Query hooks работают              | Проверить кэширование, staleTime, gcTime в DevTools                                                         | ☐      |

### Тестовые сценарии

```bash
# Проверка API endpoints (backend должен быть запущен)
curl -X GET "http://localhost:3000/v1/analytics/storage/by-sku?weekStart=2025-W44&weekEnd=2025-W47" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"
```

### Известные issues

- ⚠️ **TEST-001** (medium): Нет unit тестов для hooks

---

## 🧪 Story 24.2-fe: Storage Analytics Page Layout

**Quality Score:** 80/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                                      | Как проверить                                  | Status |
| --- | --------------------------------------------- | ---------------------------------------------- | ------ |
| AC1 | Route `/analytics/storage` доступен           | Перейти по URL, страница загружается           | ☐      |
| AC2 | Sidebar содержит ссылку "Storage"             | Проверить sidebar, иконка Warehouse            | ☐      |
| AC3 | Breadcrumbs: "Главная / Аналитика / Хранение" | Проверить header страницы                      | ☐      |
| AC4 | Week picker работает (weekStart/weekEnd)      | Изменить период, данные обновляются            | ☐      |
| AC5 | 4 Summary cards отображаются                  | Проверить: Всего ₽, Товаров, Среднее, Период   | ☐      |
| AC6 | Loading skeleton при загрузке                 | Обновить страницу, увидеть skeleton            | ☐      |
| AC7 | Error state при ошибке API                    | Отключить backend, увидеть сообщение об ошибке | ☐      |

### Визуальная проверка

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏭 Главная / Аналитика / Хранение           [Импорт данных]    │
├─────────────────────────────────────────────────────────────────┤
│ Период: [W44 ▼] - [W47 ▼]   Бренды: [Все]   Склады: [Все]      │
├─────────────────────────────────────────────────────────────────┤
│ [Всего ₽] [Товаров] [Среднее] [Период]  ← 4 карточки           │
├─────────────────────────────────────────────────────────────────┤
│ [Trends Chart] ← График динамики                               │
├─────────────────────────────────────────────────────────────────┤
│ [Top 5 Consumers] ← Топ-5 товаров                              │
├─────────────────────────────────────────────────────────────────┤
│ [All Products Table] ← Таблица всех товаров                    │
└─────────────────────────────────────────────────────────────────┘
```

### Известные issues

- ⚠️ **UI-001** (medium): Brand/Warehouse фильтры - placeholder кнопки (функционал отложен)
- ℹ️ **UI-002** (low): Sidebar label "Storage" вместо "Хранение"

---

## 🧪 Story 24.3-fe: Storage by SKU Table

**Quality Score:** 85/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                                | Как проверить                                                 | Status |
| --- | --------------------------------------- | ------------------------------------------------------------- | ------ |
| AC1 | Таблица отображает данные по SKU        | Проверить колонки: Артикул, Название, Хранение, ₽/день, Объём | ☐      |
| AC2 | Сортировка работает (клик по заголовку) | Кликнуть на "Хранение", данные пересортируются                | ☐      |
| AC3 | Поиск по артикулу/названию              | Ввести nm_id или часть названия, таблица фильтруется          | ☐      |
| AC4 | Warehouse badges с overflow             | Проверить товары с >3 складами, увидеть "+N" badge            | ☐      |
| AC5 | Truncation длинных названий             | Навести на обрезанное название, увидеть tooltip               | ☐      |
| AC6 | Mobile: горизонтальный scroll           | Уменьшить окно до 375px, таблица скроллится                   | ☐      |

### Тестовые данные

| Сценарий                     | Ожидаемый результат                       |
| ---------------------------- | ----------------------------------------- |
| Нет данных за период         | Показать "Нет данных за выбранный период" |
| 1 товар                      | Таблица с 1 строкой                       |
| 100+ товаров                 | Pagination или "Load more" работает       |
| Длинное название (>50 chars) | Truncation + tooltip                      |
| 5+ складов                   | Показать первые 3 + "+2" badge            |

---

## 🧪 Story 24.4-fe: Top Consumers Widget

**Quality Score:** 90/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                         | Как проверить                             | Status |
| --- | -------------------------------- | ----------------------------------------- | ------ |
| AC1 | Топ-5 товаров по storage_cost    | Данные отсортированы по убыванию          | ☐      |
| AC2 | Medals (🥇🥈🥉) или Lucide icons | Первые 3 позиции с визуальным индикатором | ☐      |
| AC3 | % от общих расходов              | Колонка показывает процент                | ☐      |
| AC4 | Storage/Revenue ratio с цветом   | <10% зелёный, 10-20% жёлтый, >20% красный | ☐      |
| AC5 | Tooltip с рекомендациями         | Навести на ratio, увидеть подсказку       | ☐      |

### Цветовая схема ratio

| Ratio  | Цвет       | Статус   |
| ------ | ---------- | -------- |
| <10%   | 🟢 Зелёный | Хорошо   |
| 10-20% | 🟡 Жёлтый  | Внимание |
| >20%   | 🔴 Красный | Критично |

---

## 🧪 Story 24.5-fe: Storage Trends Chart

**Quality Score:** 92/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                        | Как проверить                                | Status |
| --- | ------------------------------- | -------------------------------------------- | ------ |
| AC1 | Area chart с данными по неделям | График показывает storage_cost за период     | ☐      |
| AC2 | Summary stats над графиком      | Среднее, Min, Max, Тренд %                   | ☐      |
| AC3 | Trend badge с цветом            | Рост = красный (↑), Снижение = зелёный (↓)   | ☐      |
| AC4 | Tooltip при hover               | Неделя + значение в рублях                   | ☐      |
| AC5 | Null data = gaps в графике      | Если нет данных за неделю, линия разрывается | ☐      |
| AC6 | Loading skeleton                | При загрузке показать placeholder            | ☐      |

### UX Decisions (подтвердить)

- ✅ Q11: Клик на неделю → фильтр: **ОТЛОЖЕНО**
- ✅ Q12: Null data показывать как gaps: **ДА**

---

## 🧪 Story 24.6-fe: Manual Import UI

**Quality Score:** 88/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                              | Как проверить                                          | Status |
| --- | ------------------------------------- | ------------------------------------------------------ | ------ |
| AC1 | Кнопка "Импорт данных" в header       | Видна только Manager/Owner                             | ☐      |
| AC2 | Dialog с выбором периода              | Открыть диалог, выбрать dateFrom/dateTo                | ☐      |
| AC3 | Валидация: max 8 дней                 | Выбрать >8 дней, увидеть ошибку                        | ☐      |
| AC4 | Progress bar (indeterminate)          | Запустить импорт, увидеть progress                     | ☐      |
| AC5 | Polling статуса (2s interval)         | Статус обновляется автоматически                       | ☐      |
| AC6 | Success/Error message                 | После завершения показать результат                    | ☐      |
| AC7 | Confirm при закрытии во время импорта | Закрыть диалог во время импорта, увидеть подтверждение | ☐      |

### Тестовые сценарии

| Сценарий                 | Действие                  | Ожидаемый результат        |
| ------------------------ | ------------------------- | -------------------------- |
| Happy path               | Выбрать 7 дней, запустить | Импорт завершается успешно |
| >8 дней                  | Выбрать 10 дней           | Ошибка валидации           |
| Закрыть во время импорта | Нажать X                  | Диалог подтверждения       |
| Backend error            | Симулировать ошибку       | Error message              |

### Известные issues

- ℹ️ **SIZE-001** (low): Файл 305 строк (>200 рекомендация)
- ℹ️ **ROLE-001** (low): Проверить role check для кнопки

---

## 🧪 Story 24.7-fe: Product Card Storage Info

**Quality Score:** 92/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                               | Как проверить                                                             | Status |
| --- | -------------------------------------- | ------------------------------------------------------------------------- | ------ |
| AC1 | Компонент ProductStorageInfo создан    | Файл существует в `src/components/custom/`                                | ☐      |
| AC2 | Показывает daily avg и weekly cost     | Компонент рендерит оба значения                                           | ☐      |
| AC3 | Monthly estimate (×30)                 | Показывает расчёт за месяц                                                | ☐      |
| AC4 | Tooltip с пояснением                   | Навести, увидеть "Среднее за период X"                                    | ☐      |
| AC5 | Backend: include_storage=true работает | `GET /v1/products?include_storage=true` возвращает storage_cost_daily_avg | ☐      |

### Backend Integration

```bash
# Проверить что backend возвращает storage данные
curl "http://localhost:3000/v1/products?include_storage=true&limit=5" \
  -H "Authorization: Bearer <token>" \
  -H "X-Cabinet-Id: <cabinet-id>"
```

Ожидаемые поля в ответе:

- `storage_cost_daily_avg: number | null`
- `storage_cost_weekly: number | null`
- `storage_period: string | null` (e.g., "2025-W47")

---

## 🧪 Story 24.8-fe: High Storage Ratio Alert

**Quality Score:** 92/100 | **Gate:** PASS

### Acceptance Criteria

| AC  | Описание                                            | Как проверить                              | Status |
| --- | --------------------------------------------------- | ------------------------------------------ | ------ |
| AC1 | Alert banner появляется при ratio >20%              | Найти товар с высоким ratio, увидеть alert | ☐      |
| AC2 | Русская плюрализация (1 товар, 2 товара, 5 товаров) | Проверить разные количества                | ☐      |
| AC3 | Цветовая индикация severity                         | Warning (жёлтый) или Destructive (красный) | ☐      |
| AC4 | Tooltip с рекомендациями                            | Навести, увидеть советы по оптимизации     | ☐      |
| AC5 | Не показывать если ratio <20%                       | Все товары <20% → alert не отображается    | ☐      |

### Тестовые сценарии

| Сценарий        | Ожидаемый результат          |
| --------------- | ---------------------------- |
| 0 товаров >20%  | Alert не показывается        |
| 1 товар >20%    | "1 товар имеет высокий..."   |
| 2 товара >20%   | "2 товара имеют высокий..."  |
| 5+ товаров >20% | "5 товаров имеют высокий..." |

---

## 🐛 Bugfixes Applied (2025-12-04)

### Fixed Issues

| Issue                    | Описание                                                      | Файл                   | Status   |
| ------------------------ | ------------------------------------------------------------- | ---------------------- | -------- |
| Missing import           | `formatIsoWeek` не был импортирован                           | `page.tsx`             | ✅ Fixed |
| API auto-unwrap bug      | `apiClient.get()` неправильно unwrap responses с `data` array | `storage-analytics.ts` | ✅ Fixed |
| Sidebar double-highlight | Analytics и Storage обе подсвечивались                        | `Sidebar.tsx`          | ✅ Fixed |

### Regression Testing

После исправлений проверить:

- [ ] Страница `/analytics/storage` загружается без ошибок
- [ ] Данные отображаются корректно (не undefined, не пустой массив)
- [ ] Sidebar: только Storage подсвечен на странице storage
- [ ] Sidebar: только Analytics подсвечен на `/analytics`, `/analytics/sku`, `/analytics/brand`, `/analytics/category`

---

## 📊 Summary

| Story       | Quality Score | Gate         | Critical Issues |
| ----------- | ------------- | ------------ | --------------- |
| 24.1-fe     | 85            | PASS         | 0               |
| 24.2-fe     | 80            | PASS         | 0               |
| 24.3-fe     | 85            | PASS         | 0               |
| 24.4-fe     | 90            | PASS         | 0               |
| 24.5-fe     | 92            | PASS         | 0               |
| 24.6-fe     | 88            | PASS         | 0               |
| 24.7-fe     | 92            | PASS         | 0               |
| 24.8-fe     | 92            | PASS         | 0               |
| **Average** | **88**        | **ALL PASS** | **0**           |

---

## ✅ QA Sign-off

| Reviewer | Date | Status          | Notes |
| -------- | ---- | --------------- | ----- |
|          |      | ☐ PASS / ☐ FAIL |       |

---

## 📚 References

- [Epic 24 README](../stories/epic-24/README.md)
- [Backend API Spec](../request-backend/36-epic-24-paid-storage-analytics-api.md)
- [QA Gate Files](./24*.yml)
- [STORIES-STATUS-REPORT.md](../stories/STORIES-STATUS-REPORT.md)
