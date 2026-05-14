# Epic 17: Навигация по документации и источникам

**Тип запроса:** Documentation Guide
**Дата создания:** 2025-01-23
**Эпик:** Epic 17 - COGS & Margin Feature Integration
**Статус:** ✅ Complete (все 4 истории реализованы)

---

## 📚 Цель документа

Этот документ предоставляет **единую точку входа** для frontend команды для доступа ко всей документации, спецификациям и примерам по Epic 17 (COGS & Margin Analytics Feature).

---

## 🎯 Краткое описание Epic 17

**Epic 17** добавляет в систему функциональность расчёта **себестоимости (COGS)**, **валовой прибыли (Profit)** и **маржинальности (Margin %)** для товаров продавца.

**Ключевые возможности:**
- ✅ Автоматический расчёт маржи при импорте финансовых данных (Story 17.1)
- ✅ Параметр `includeCogs=true` в API аналитики (Story 17.2)
- ✅ Фоновая перерасчёт маржи для исторических данных (Story 17.3)
- ✅ Полная документация кода и исправление комментариев (Story 17.4)

**Метрики:**
- ⚡ **Производительность:** +50-100ms при `includeCogs=true`
- 🔄 **Обратная совместимость:** 100% (параметр опциональный)
- 📊 **Prometheus метрики:** 3 новые метрики для мониторинга

---

## 📂 Структура документации

### **1. Swagger / OpenAPI Documentation** 🔵

**Где смотреть:**
```
src/analytics/weekly-analytics.controller.ts
```

**Что найдёте:**
- **@ApiOperation** декораторы с полным описанием эндпоинтов
- **@ApiQuery** декораторы для параметра `include_cogs` с формулами и примерами
- **@ApiResponse** схемы с новыми полями Epic 17

**Основные эндпоинты с поддержкой Epic 17:**

#### **GET /v1/analytics/weekly/by-sku**
**Файл:** `src/analytics/weekly-analytics.controller.ts:259-443`

**Параметры:**
- `week` (required) - ISO week format (YYYY-Www)
- `include_cogs` (optional, default: false) - включить COGS аналитику
- `report_type`, `is_b2b`, `paid_delivery_flag` - фильтры
- `cursor`, `limit` - пагинация

**Новые поля в ответе (когда `include_cogs=true`):**
```typescript
{
  cogs: number;              // Себестоимость = unit_cost × qty
  profit: number;            // Прибыль = revenue_net - cogs
  margin_pct: number;        // Маржа % = (profit / |revenue_net|) × 100
  markup_percent: number;    // Наценка % = (profit / |cogs|) × 100
  missing_cogs_flag: boolean; // true если COGS не назначен
}
```

**Swagger декоратор:** Строки 317-330 (параметр `include_cogs`)
**Response Schema:** Строки 331-420 (схема ответа с Epic 17 полями)

---

#### **GET /v1/analytics/weekly/by-brand**
**Файл:** `src/analytics/weekly-analytics.controller.ts:465-658`

**Параметры:**
- `week` (required) - ISO week format
- `include_cogs` (optional, default: false) - включить COGS аналитику
- `report_type` - фильтр по типу отчёта
- `cursor`, `limit` - пагинация

**Новые поля в ответе (когда `include_cogs=true`):**
```typescript
{
  cogs: number;              // SUM(unit_cost × qty) для всех SKU в бренде
  profit: number;            // SUM(revenue_net - cogs)
  margin_pct: number;        // (total_profit / |total_revenue_net|) × 100
  markup_percent: number;    // (total_profit / |total_cogs|) × 100
  missing_cogs_count: number; // Количество SKU без COGS
}
```

**Swagger декоратор:** Строки 510-523 (параметр `include_cogs`)
**Response Schema:** Строки 524-605 (схема ответа с Epic 17 полями)

---

#### **GET /v1/analytics/weekly/by-category**
**Файл:** `src/analytics/weekly-analytics.controller.ts:660-829`

**Параметры:**
- `week` (required) - ISO week format
- `include_cogs` (optional, default: false) - включить COGS аналитику
- `report_type` - фильтр по типу отчёта
- `cursor`, `limit` - пагинация

**Новые поля в ответе (когда `include_cogs=true`):**
```typescript
{
  cogs_rub: string;          // SUM(unit_cost × qty) для всех SKU в категории (string для точности)
  profit_rub: string;        // SUM(revenue_net - cogs) (string для точности)
  margin_pct: number;        // (total_profit / |total_revenue_net|) × 100
  markup_pct: number;        // (total_profit / |total_cogs|) × 100
  missing_cogs_count: number; // Количество SKU без COGS
}
```

**Swagger декоратор:** Строки 706-719 (параметр `include_cogs`)
**Response Schema:** Строки 720-807 (схема ответа с Epic 17 полями)

---

**Как использовать Swagger UI:**
1. Запустите backend: `npm run start:dev`
2. Откройте в браузере: `http://localhost:3000/api`
3. Найдите секцию **Analytics**
4. Раскройте эндпоинты `GET /v1/analytics/weekly/by-sku|by-brand|by-category`
5. В параметрах увидите `include_cogs` с полным описанием

**Интерактивное тестирование:**
- Swagger UI позволяет выполнить запросы с `include_cogs=true` напрямую из браузера
- Вы увидите реальные response schemas с Epic 17 полями

---

### **2. test-api/ - HTTP Examples** 🔵

**Директория:** `test-api/`
**Расположение:** Корневая директория проекта

> **⚠️ ОБНОВЛЕНО (2025-12-06):** Файл `test-api.http` был разделён на несколько файлов в директории `test-api/`.
> См. `test-api/SECTION-MAPPING.md` для маппинга старых секций на новые файлы.

**Структура:**
```
test-api/
├── 00-variables.http          # Переменные и Login (НАЧНИТЕ ЗДЕСЬ)
├── 05-analytics-basic.http    # By SKU/Brand/Category с includeCogs
├── 06-analytics-advanced.http # Margin Trends
├── 09-tasks.http              # Background jobs для перерасчёта маржи
└── SECTION-MAPPING.md         # Маппинг старых секций
```

**Что найдёте:**
- Готовые HTTP запросы для тестирования всех Epic 17 эндпоинтов
- Примеры с `includeCogs=true` параметром
- Комментарии с описанием новых полей
- Примеры фоновых задач для перерасчёта маржи

**Основные файлы:**

#### **Файл `05-analytics-basic.http`: Analytics с Margin Data**

> **Новое расположение:** `test-api/05-analytics-basic.http`

```http
### By SKU with COGS Data (Epic 17 + Story 6.3)
# includeCogs=true adds profitability fields:
# - cogs, profit, margin_pct, markup_percent, missing_cogs_flag
# - Story 6.3: roi, profit_per_unit
GET {{baseUrl}}/v1/analytics/weekly/by-sku?week=2025-W47&includeCogs=true&limit=20
```

**Примеры в файле:**
- **By SKU with COGS** - аналитика по артикулам с маржой
- **By Brand with COGS** - аналитика по брендам с маржой
- **By Category with COGS** - аналитика по категориям с маржой
- **Date Range** - агрегация за несколько недель

#### **Файл `09-tasks.http`: Background Job для перерасчёта маржи**

> **Новое расположение:** `test-api/09-tasks.http`

```http
### Enqueue Weekly Margin Recalculation (Epic 17)
# Manual recalculation mainly for:
# - Historical data (weeks imported before Epic 20)
# - Fixing margin calculations after COGS corrections
POST {{baseUrl}}/v1/tasks/enqueue
Content-Type: application/json

{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "weeks": ["2025-W45", "2025-W44", "2025-W43"]
  }
}
```

#### **NOTES секция - Epic 17**
```
### Epic 17: COGS & Margin Feature Integration
- Story 17.1: Import pipeline integration (automatic margin calculation)
- Story 17.2: includeCogs parameter in analytics API
- Story 17.3: Background job for weekly margin recalculation
- Story 17.4: Documentation and code comments cleanup
```

**Строки в файле:** ~строки 25-28 (NOTES)

**Как использовать:**
1. Установите VS Code расширение **REST Client**
2. Откройте директорию `test-api/` и нужный файл:
   - `05-analytics-basic.http` - Analytics By SKU/Brand/Category с includeCogs
   - `06-analytics-advanced.http` - Margin Trends
   - `09-tasks.http` - Background Jobs
3. Сначала выполните Login в `00-variables.http`
4. Нажмите "Send Request" над нужным запросом
5. Увидите реальный ответ с Epic 17 полями

> **⚠️ См.** `test-api/SECTION-MAPPING.md` для полного маппинга старых секций на новые файлы

---

### **3. Response DTOs - TypeScript Interfaces** 🔵

**Где смотреть:**

#### **SKU Analytics DTO**
**Файл:** `src/analytics/dto/response/sku-analytics.dto.ts`

**Новые поля Epic 17:**
```typescript
/**
 * Cost of goods sold (optional, requires COGS data and include_cogs=true)
 * Calculated as: unit_cost_rub * total_units from cogs table
 * Temporal versioning: Uses valid_from <= sale_dt
 * @example 40000.00
 */
cogs?: number;

/**
 * Gross profit (optional, requires COGS data and include_cogs=true)
 * Formula: profit = revenue_net - cogs
 * See: docs/backend-po/03-financial-formulas.md (Story 10.4)
 * @example 37000.00
 */
profit?: number;

/**
 * Profit margin percentage (optional, requires COGS data and include_cogs=true)
 * Formula: margin% = (gross_profit / |revenue_net|) × 100%
 * See: docs/backend-po/09-cogs-and-margin-calculation.md (Story 10.4)
 * @example 38.95
 */
margin_pct?: number;

/**
 * Markup percentage (optional, requires COGS data and include_cogs=true)
 * Formula: markup% = (gross_profit / |cogs|) × 100%
 * Represents seller's markup over cost
 * @example 92.50
 */
markup_percent?: number;

/**
 * Flag indicating if COGS data is missing for this SKU
 * true = COGS not assigned, profit/margin will be null
 * false = COGS available, profit/margin calculated
 * @example false
 */
missing_cogs_flag: boolean;
```

**Строки:** ~55-95

---

#### **Brand Analytics DTO**
**Файл:** `src/analytics/dto/response/brand-analytics.dto.ts`

**Новые поля Epic 17:**
```typescript
/**
 * Aggregated Cost of Goods Sold (optional, requires COGS data and include_cogs=true)
 * SUM of unit_cost_rub from cogs table across all SKUs within brand
 * Returned as number (aggregated value)
 * @example 1650000.00
 */
cogs?: number;

/**
 * Aggregated gross profit (optional, requires COGS data and include_cogs=true)
 * Formula: SUM(revenue_net - cogs) across all SKUs in brand
 * See: docs/backend-po/03-financial-formulas.md (Story 10.4)
 * @example 1200000.00
 */
profit?: number;

/**
 * Profit margin percentage (optional, requires COGS data and include_cogs=true)
 * Formula: margin% = (total_gross_profit / |total_revenue_net|) × 100%
 * @example 42.11
 */
margin_pct?: number;

/**
 * Markup percentage (optional, requires COGS data and include_cogs=true)
 * Formula: markup% = (total_gross_profit / |total_cogs|) × 100%
 * @example 72.73
 */
markup_percent?: number;

/**
 * Number of SKUs within brand missing COGS data
 * Present when include_cogs=true
 * @example 0
 */
missing_cogs_count?: number;
```

**Строки:** ~55-105

---

#### **Category Analytics DTO**
**Файл:** `src/analytics/dto/response/category-analytics.dto.ts`

**Новые поля Epic 17:**
```typescript
/**
 * Aggregated gross profit (optional, requires COGS data and include_cogs=true)
 * Formula: SUM(revenue_net - cogs) across all SKUs in category
 * See: docs/backend-po/03-financial-formulas.md (Story 10.4)
 * Returned as string to prevent floating-point precision loss
 * @example "45000.20"
 */
profit_rub?: string;

/**
 * Profit margin percentage (optional, requires COGS data and include_cogs=true)
 * Formula: margin% = (total_gross_profit / |total_revenue_net|) × 100%
 * See: docs/backend-po/09-cogs-and-margin-calculation.md (Story 10.4)
 * @example 36.0
 */
margin_pct?: number;

/**
 * Markup percentage (optional, requires COGS data and include_cogs=true)
 * Formula: markup% = (total_gross_profit / |total_cogs|) × 100%
 * @example 56.25
 */
markup_pct?: number;

/**
 * Total Cost of Goods Sold (optional, requires COGS data and include_cogs=true)
 * Sum of unit_cost_rub from cogs table across all SKUs
 * Returned as string to prevent floating-point precision loss
 * @example "80000.30"
 */
cogs_rub?: string;

/**
 * Number of SKUs within category missing COGS data
 * Present when include_cogs=true
 * @example 0
 */
missing_cogs_count?: number;
```

**Строки:** ~59-105

---

### **4. Backend Stories & Specs** 🔵

**Где смотреть:** `docs/stories/epic-17/`

#### **Story 17.1: Import Pipeline Integration**
**Файл:** `docs/stories/epic-17/story-17.1-import-pipeline-integration.md`

**Что найдёте:**
- Интеграция автоматического расчёта маржи в pipeline импорта
- Prometheus метрики для мониторинга (3 новые метрики)
- AC (Acceptance Criteria) с проверками
- QA Fixes секция с исправлениями

**Ключевые моменты:**
- Автоматический запуск `MarginCalculationService` после импорта
- Метрики: `margin_calculation_success_total`, `margin_calculation_failure_total`, `margin_calculation_duration_ms`
- Поддержка test mode и production mode

---

#### **Story 17.2: API includeCogs Flag**
**Файл:** `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`

**Что найдёте:**
- Детальная спецификация параметра `include_cogs`
- Все формулы расчёта (profit, margin_pct, markup_percent)
- Temporal COGS versioning логика
- Graceful degradation поведение
- Performance targets и backward compatibility

**Ключевые моменты:**
- Параметр опциональный (default: false)
- Temporal versioning: `valid_from <= sale_dt`
- Performance target: ≤10% overhead (≤+300ms для 100k rows)
- 100% backward compatible

---

#### **Story 17.3: Background Job Recalculation**
**Файл:** `docs/stories/epic-17/story-17.3-background-job-recalculation.md`

**Что найдёте:**
- Спецификация фоновой задачи `recalculate_weekly_margin`
- Task processor implementation
- Use cases для перерасчёта (массовое обновление COGS, исправление ошибок)
- Performance targets

**Ключевые моменты:**
- Task type: `recalculate_weekly_margin`
- Payload: `{ weeks: string[] }` - массив ISO weeks
- Performance: ≤60s для 100k rows на неделю
- Idempotent by design

---

#### **Story 17.4: Documentation & Code Comments**
**Файл:** `docs/stories/epic-17/story-17.4-fix-dto-comments.md`

**Что найдёте:**
- Полный список обновлённых DTO файлов
- Чеклист всех исправленных комментариев
- Ссылки на формулы и документацию

**Ключевые моменты:**
- 100% покрытие DTOs комментариями
- Все формулы документированы
- Ссылки на backend-po документы

---

#### **Epic 17 Overview**
**Файл:** `docs/stories/epic-17/EPIC-17-OVERVIEW.md`

**Что найдёте:**
- Общий обзор всех 4 историй
- Архитектура решения
- Completion summary

---

### **5. QA Gates (Quality Assurance)** 🔵

**Где смотреть:** `docs/qa/gates/`

#### **Story 17.1 QA Gate**
**Файл:** `docs/qa/gates/17.1-import-pipeline-integration.yml`

**Статус:** ✅ PASSED (with fixes applied)

**Ключевые проверки:**
- ✅ Prometheus metrics implemented
- ✅ Both production and test mode instrumented
- ⚠️ Documentation inaccuracy fixed
- ℹ️ Integration unit tests (follow-up task)

---

#### **Story 17.2 QA Gate**
**Файл:** `docs/qa/gates/17.2-api-includecogs-flag.yml`

**Статус:** ✅ PASSED (no blocking issues)

**Ключевые проверки:**
- ✅ All 3 endpoints support include_cogs
- ✅ All DTOs have Epic 17 fields
- ✅ Backward compatibility 100%
- ℹ️ E2E test enhancement (follow-up task)
- ℹ️ Performance validation (follow-up task)

---

#### **Story 17.3 QA Gate**
**Файл:** `docs/qa/gates/17.3-background-job-recalculation.yml`

**Статус:** ✅ PASSED (zero concerns)

**Ключевые проверки:**
- ✅ Task processor implemented
- ✅ Idempotency verified
- ✅ Error handling correct
- ✅ Test coverage adequate

---

#### **Story 17.4 QA Gate**
**Файл:** `docs/qa/gates/17.4-fix-dto-comments.yml`

**Статус:** ✅ PASSED (zero concerns)

**Ключевые проверки:**
- ✅ All DTOs updated
- ✅ All formulas documented
- ✅ References to documentation present

---

### **6. User-Facing Documentation** 🔵

#### **README.md**
**Файл:** `README.md`

**Секция:** Technology Stack → Features → COGS & Margin Analytics

**Что найдёте:**
- Краткое описание Epic 17 фичи
- Список ключевых возможностей

---

#### **CAPABILITIES.md**
**Файл:** `docs/CAPABILITIES.md`

**Секция:** 10. 💰 COGS и Маржинальная Аналитика (Epic 17)

**Что найдёте:**
- Детальное описание возможностей
- Формулы расчёта
- Prometheus метрики
- Примеры использования

**Строки:** ~387-450

---

#### **USER-GUIDE.md**
**Файл:** `docs/USER-GUIDE.md`

**Секция:** Workflow 5.5: Маржинальная аналитика (Epic 17 - NEW)

**Что найдёте:**
- Пошаговый workflow использования
- Примеры запросов
- Описание новых полей
- Use cases

**Строки:** ~325-380

---

### **7. Frontend Integration Guide** 🔵

**Файл:** `frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`

**Что найдёте:**
- Полное руководство по интеграции для frontend
- TypeScript интерфейсы для ответов API
- React hooks примеры
- Error handling стратегии
- FAQ

**Основные секции:**
1. **API Changes Summary** - Обзор изменений
2. **Response Schema** - Структуры ответов с новыми полями
3. **TypeScript Integration** - Интерфейсы и примеры кода
4. **React Hooks Example** - Готовый хук `useCOGSAnalytics()`
5. **Error Handling** - Обработка ошибок
6. **FAQ** - Часто задаваемые вопросы

---

## 🔗 Быстрые ссылки

### **API Endpoints (Swagger)**
| Endpoint | Controller File | Lines |
|----------|----------------|-------|
| GET /v1/analytics/weekly/by-sku | `src/analytics/weekly-analytics.controller.ts` | 259-443 |
| GET /v1/analytics/weekly/by-brand | `src/analytics/weekly-analytics.controller.ts` | 465-658 |
| GET /v1/analytics/weekly/by-category | `src/analytics/weekly-analytics.controller.ts` | 660-829 |

### **DTOs (Response Schemas)**
| DTO | File | Lines |
|-----|------|-------|
| SkuAnalyticsDto | `src/analytics/dto/response/sku-analytics.dto.ts` | 1-100 |
| BrandAnalyticsDto | `src/analytics/dto/response/brand-analytics.dto.ts` | 1-110 |
| CategoryAnalyticsDto | `src/analytics/dto/response/category-analytics.dto.ts` | 1-105 |

### **HTTP Examples**
| Section | File | Description |
|---------|------|-------------|
| Analytics | `test-api/05-analytics-basic.http` | Analytics with includeCogs examples |
| Margin | `test-api/06-analytics-advanced.http` | Margin Trends |
| Tasks | `test-api/09-tasks.http` | Background job for margin recalculation |

> См. `test-api/SECTION-MAPPING.md` для полного маппинга старых секций → новые файлы

### **Backend Stories**
| Story | File |
|-------|------|
| Story 17.1 | `docs/stories/epic-17/story-17.1-import-pipeline-integration.md` |
| Story 17.2 | `docs/stories/epic-17/story-17.2-api-includecogs-flag.md` |
| Story 17.3 | `docs/stories/epic-17/story-17.3-background-job-recalculation.md` |
| Story 17.4 | `docs/stories/epic-17/story-17.4-fix-dto-comments.md` |
| Epic Overview | `docs/stories/epic-17/EPIC-17-OVERVIEW.md` |

### **QA Gates**
| Story | File | Status |
|-------|------|--------|
| Story 17.1 | `docs/qa/gates/17.1-import-pipeline-integration.yml` | ✅ PASSED |
| Story 17.2 | `docs/qa/gates/17.2-api-includecogs-flag.yml` | ✅ PASSED |
| Story 17.3 | `docs/qa/gates/17.3-background-job-recalculation.yml` | ✅ PASSED |
| Story 17.4 | `docs/qa/gates/17.4-fix-dto-comments.yml` | ✅ PASSED |

### **User Documentation**
| Document | Section |
|----------|---------|
| README.md | Technology Stack → COGS & Margin Analytics |
| CAPABILITIES.md | Section 10: 💰 COGS и Маржинальная Аналитика |
| USER-GUIDE.md | Workflow 5.5: Маржинальная аналитика |

---

## 📋 Чек-лист для Frontend интеграции

### **Фаза 1: Изучение документации**
- [ ] Прочитать `frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`
- [ ] Изучить Swagger UI по адресу `http://localhost:3000/api` (секция Analytics)
- [ ] Просмотреть примеры в `test-api/05-analytics-basic.http` (Analytics с includeCogs)

### **Фаза 2: TypeScript интеграция**
- [ ] Скопировать TypeScript интерфейсы из `07-cogs-margin-analytics-includecogs-parameter.md`
- [ ] Добавить новые поля в существующие типы (cogs, profit, margin_pct, markup_percent, missing_cogs_flag/count)
- [ ] Обновить API клиент для поддержки параметра `includeCogs`

### **Фаза 3: UI компоненты**
- [ ] Добавить чекбокс/toggle для включения COGS аналитики
- [ ] Создать колонки для новых полей в таблицах
- [ ] Добавить форматирование для процентных значений (margin_pct, markup_percent)
- [ ] Реализовать индикатор `missing_cogs_flag` (например, warning icon)

### **Фаза 4: Тестирование**
- [ ] Протестировать с `includeCogs=false` (backward compatibility)
- [ ] Протестировать с `includeCogs=true` (новые поля присутствуют)
- [ ] Протестировать graceful degradation (SKU без COGS)
- [ ] Измерить производительность (+50-100ms приемлемо)

### **Фаза 5: Error handling**
- [ ] Обработать случай когда backend не вернул COGS поля
- [ ] Добавить fallback UI для `missing_cogs_flag=true`
- [ ] Реализовать retry логику для 500 ошибок

---

## ❓ FAQ для Frontend команды

### **Q1: Где найти актуальную спецификацию API?**
**A:** Swagger UI на `http://localhost:3000/api` → секция **Analytics** → эндпоинты `by-sku`, `by-brand`, `by-category`

### **Q2: Где посмотреть примеры реальных запросов?**
**A:** Директория `test-api/` в корне проекта:
- `05-analytics-basic.http` - Analytics с includeCogs
- `06-analytics-advanced.http` - Margin Trends
- `09-tasks.http` - Background jobs

### **Q3: Где TypeScript типы для новых полей?**
**A:**
- DTOs в backend: `src/analytics/dto/response/sku-analytics.dto.ts` и аналогичные
- Frontend guide: `frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md` (секция TypeScript Integration)

### **Q4: Какая производительность ожидается при includeCogs=true?**
**A:** +50-100ms overhead, что приемлемо для аналитических запросов

### **Q5: Что если для SKU нет COGS?**
**A:** Backend вернёт `missing_cogs_flag=true` и `profit=null`, `margin_pct=null`. Frontend должен показать индикатор (например, "COGS not assigned")

### **Q6: Обязательно ли использовать includeCogs?**
**A:** Нет, параметр опциональный (default: false). 100% backward compatible.

### **Q7: Где найти формулы расчёта?**
**A:**
- Swagger комментарии в `src/analytics/weekly-analytics.controller.ts`
- `frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md` (секция Formulas)
- `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`

### **Q8: Есть ли Prometheus метрики?**
**A:** Да, 3 метрики:
- `margin_calculation_success_total{cabinet_id}`
- `margin_calculation_failure_total{cabinet_id}`
- `margin_calculation_duration_ms{cabinet_id}`

Смотрите `docs/CAPABILITIES.md` секцию 10 или Story 17.1.

---

## 📞 Контакты и поддержка

**Backend Team:**
- QA документация: `docs/qa/gates/17.1-17.4-*.yml`
- Story спецификации: `docs/stories/epic-17/`

**Первоисточники:**
- Swagger UI: `http://localhost:3000/api`
- Code: `src/analytics/` (controller, DTOs, services)
- Tests: `test-api/` (см. SECTION-MAPPING.md)

**Обновления:**
- Все изменения документированы в git commits
- История Epic 17: `git log --grep="epic-17" --oneline`

---

## ✅ Заключение

Этот документ предоставляет **все ссылки и навигацию** для успешной интеграции Epic 17 на frontend.

**Основные источники информации (в порядке приоритета):**
1. **Swagger UI** (`http://localhost:3000/api`) - самая актуальная спецификация API
2. **test-api/** - рабочие примеры запросов (см. `SECTION-MAPPING.md` для навигации)
3. **frontend/docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md** - полное руководство по интеграции
4. **Backend DTOs** (`src/analytics/dto/response/*.dto.ts`) - TypeScript типы из первоисточника
5. **Backend Stories** (`docs/stories/epic-17/`) - детальные спецификации и AC

**При возникновении вопросов:**
1. Проверьте FAQ в этом документе
2. Изучите Swagger UI (интерактивная документация)
3. Посмотрите примеры в `test-api/` (начните с `00-variables.http`)
4. Обратитесь к backend team с конкретным файлом/строкой из этого документа

**Статус Epic 17:** ✅ **COMPLETE** (все 4 истории реализованы и протестированы)

## Backend Team Response

- **Status**: RESOLVED
- **Resolution date**: 2025-01-22
- **Summary**: Epic 17 is complete with all 4 stories (17.1-17.4) implemented, QA-approved, and deployed. This document serves as a navigation hub linking to all integration resources including Swagger, test-api examples, and story specifications.
- **Remaining frontend action**: Use this document as a reference guide for Epic 17 integration. Start with Swagger UI and test-api examples for the most current API specs.
