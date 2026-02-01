# Issue #3: Несоответствие базы расчёта процентов

**Дата**: 2026-02-01
**Автор**: Financial Analytics Documentation Specialist
**Статус**: ✅ ИСПРАВЛЕНО (2026-02-01)
**Критичность**: Medium (UX/Business Logic)

---

## 1. Описание проблемы

### Текущее поведение на дашборде

На главном дашборде отображаются карточки расходов с процентами:

| Карточка | Значение | Отображаемый % |
|----------|----------|----------------|
| Рекламные затраты | 3 776,65 ₽ | **2,94% от выручки** |
| Логистика | 17 787,58 ₽ | **13,84% от выручки** |
| Хранение | 2 056,28 ₽ | **1,6% от выручки** |

При этом основная метрика **"Выкупы"** показывает **84 377,52 ₽** (`wb_sales_gross_total`).

### Несоответствие

**Проблема**: Проценты рассчитываются от `sales_gross_total` (128 487,45 ₽), а не от `wb_sales_gross_total` (84 377,52 ₽).

**Математическая проверка**:

```
# Если база = sales_gross_total (128 487,45 ₽):
Логистика: 17 787,58 / 128 487,45 = 13,84% ✅ Совпадает с UI

# Если база = wb_sales_gross_total (84 377,52 ₽):
Логистика: 17 787,58 / 84 377,52 = 21,08% ❌ Не совпадает с UI
```

### UX-проблема

Пользователь видит карточку **"Выкупы: 84 377,52 ₽"** и рядом **"Логистика: 13,84% от выручки"**.

**Ожидание пользователя**: 13,84% × 84 377,52 ₽ = 11 677,85 ₽
**Фактическое значение**: 17 787,58 ₽

Это создаёт когнитивный диссонанс и подрывает доверие к аналитике.

---

## 2. Анализ текущей реализации

### Исходный код

**Файл**: `frontend/src/app/(dashboard)/dashboard/components/DashboardContent.tsx`

```typescript
// Строка 76: revenueTotal берётся из sale_gross (НЕ из wb_sales_gross)
const revenueTotal = summaryRus?.sale_gross ?? summaryTotal?.sale_gross_total
```

**Файл**: `frontend/src/components/custom/dashboard/ExpenseMetricCard.tsx`

```typescript
// Строка 45-51: Расчёт процента от выручки
function calculateRevenuePercentage(
  expense: number | null | undefined,
  revenue: number | null | undefined
): string | null {
  if (expense == null || revenue == null || revenue === 0) return null
  return formatPercentage((expense / revenue) * 100)
}
```

### Поля API `/v1/analytics/weekly/finance-summary`

| Поле | Значение | Описание |
|------|----------|----------|
| `sales_gross` / `sales_gross_total` | 128 487,45 ₽ | **Валовая выручка** = `retail_price_with_discount` (цена для покупателя) |
| `wb_sales_gross` / `wb_sales_gross_total` | 84 377,52 ₽ | **Выкупы** = выручка продавца после комиссии WB |
| `sale_gross` / `sale_gross_total` | 128 487,45 ₽ | **NET** = sales_gross - returns_gross |
| `to_pay_goods` | — | К перечислению за товар |
| `payout_total` | — | Итого к перечислению |

### Связь между полями

```
sales_gross (Валовая выручка)     = 128 487,45 ₽ (цена для покупателя)
    │
    ├── total_commission_rub     = 44 109,93 ₽ (комиссия WB ~34%)
    │
    └── wb_sales_gross (Выкупы)  = 84 377,52 ₽ (выручка продавца)
```

---

## 3. Бизнес-логика: Какую базу использовать?

### Определения из BUSINESS-LOGIC-REFERENCE.md

| Термин | Поле | Формула | Описание |
|--------|------|---------|----------|
| **Валовая выручка** | `sales_gross` | `SUM(retail_price_with_discount)` | То, что заплатил покупатель |
| **Выкупы (Продажи WB)** | `wb_sales_gross` | `SUM(gross) WHERE doc_type='sale'` | То, что получил продавец до вычетов |
| **К перечислению** | `payout_total` | Формула ниже | Финальная сумма от WB |

### Формула payout_total (WB Dashboard)

```
payout_total = to_pay_goods
             - logistics_cost
             - storage_cost
             - paid_acceptance_cost
             - penalties_total
             - other_adjustments_net
             - wb_commission_adj
```

### Анализ для CFO

**Вопрос**: Какая метрика релевантна для финансовой отчётности?

| Метрика | Когда использовать | Для кого |
|---------|-------------------|----------|
| `sales_gross` | Анализ ценообразования, сравнение с конкурентами | Маркетинг |
| `wb_sales_gross` | **Основная выручка продавца**, база для расчёта расходов | **CFO, финдиректор** |
| `payout_total` | Итоговый результат, что реально получит продавец | Бухгалтерия |

**Вывод**: Для CFO-дашборда релевантнее использовать `wb_sales_gross` как базу, так как:
1. Это "честная" выручка продавца после комиссии WB
2. Расходы (логистика, хранение) вычитаются именно из неё
3. Карточка "Выкупы" показывает именно это значение

---

## 4. Рекомендации

### Вариант A: Использовать `wb_sales_gross` как базу (РЕКОМЕНДУЕТСЯ)

**Изменение в коде**:

```typescript
// DashboardContent.tsx, строка 76
// БЫЛО:
const revenueTotal = summaryRus?.sale_gross ?? summaryTotal?.sale_gross_total

// ДОЛЖНО БЫТЬ:
const revenueTotal = summaryRus?.wb_sales_gross ?? summaryTotal?.wb_sales_gross_total
```

**Результат для пользователя**:

| Карточка | Значение | Новый % | Формула |
|----------|----------|---------|---------|
| Логистика | 17 787,58 ₽ | **21,08% от выкупов** | 17 787,58 / 84 377,52 |
| Хранение | 2 056,28 ₽ | **2,44% от выкупов** | 2 056,28 / 84 377,52 |
| Реклама | 3 776,65 ₽ | **4,48% от выкупов** | 3 776,65 / 84 377,52 |

**Плюсы**:
- Консистентность с карточкой "Выкупы"
- Соответствует финансовой логике (расходы % от реальной выручки)
- Более информативно для CFO

**Минусы**:
- Проценты будут выше (может показаться "хуже")
- Требует обновления документации

### Вариант B: Показать "% от валовой выручки" явно

**Изменение в коде**:

```typescript
// ExpenseMetricCard.tsx, строка 179
// БЫЛО:
<span className="text-xs text-gray-400">{revenuePercentage} от выручки</span>

// ДОЛЖНО БЫТЬ:
<span className="text-xs text-gray-400">{revenuePercentage} от валовой выручки</span>
```

**Дополнительно**: Добавить тултип с пояснением:

```
"Валовая выручка (128 487,45 ₽) — цена для покупателя до вычета комиссии WB.
Выкупы (84 377,52 ₽) — выручка продавца после комиссии WB."
```

**Плюсы**:
- Минимальные изменения в коде
- Явно указывает базу расчёта

**Минусы**:
- Не решает проблему когнитивного диссонанса
- CFO всё равно будет путаться

### Вариант C: Гибридное решение (ОПТИМАЛЬНО)

1. **Изменить базу** на `wb_sales_gross` (Вариант A)
2. **Добавить тултип** с пояснением к каждой карточке
3. **Добавить переключатель** "% от выкупов" / "% от валовой выручки"

**Пример UI**:

```
┌─────────────────────────────────────┐
│ Логистика                      [i] │
│ 17 787,58 ₽                        │
│ ↑ +5,2% vs прошлая неделя          │
│ 21,08% от выкупов [▼]              │
│        └── % от валовой: 13,84%    │
└─────────────────────────────────────┘
```

---

## 5. Справочник полей API

### Endpoint: `GET /v1/analytics/weekly/finance-summary?week=2025-W47`

#### summary_rus / summary_total

| Поле | Описание | Пример |
|------|----------|--------|
| `sales_gross` / `sales_gross_total` | Цена для покупателя | 128 487,45 ₽ |
| `returns_gross` / `returns_gross_total` | Возвраты (gross) | 3 143,00 ₽ |
| `sale_gross` / `sale_gross_total` | NET = sales - returns | 125 344,45 ₽ |
| `wb_sales_gross` / `wb_sales_gross_total` | **Выкупы (выручка продавца)** | 84 377,52 ₽ |
| `wb_returns_gross` / `wb_returns_gross_total` | Возвраты WB | 809,00 ₽ |
| `total_commission_rub` / `total_commission_rub_total` | Комиссия WB | 44 109,93 ₽ |
| `logistics_cost` / `logistics_cost_total` | Логистика | 17 787,58 ₽ |
| `storage_cost` / `storage_cost_total` | Хранение | 2 056,28 ₽ |
| `payout_total` | К перечислению | 53 907,27 ₽ |

#### Связь полей

```
sales_gross (Валовая)         = 128 487,45 ₽
    ├── total_commission_rub  = 44 109,93 ₽ (~34%)
    └── wb_sales_gross        = 84 377,52 ₽ (Выкупы)
            ├── logistics_cost    = 17 787,58 ₽
            ├── storage_cost      = 2 056,28 ₽
            ├── other_adjustments = ...
            └── payout_total      = 53 907,27 ₽ (К перечислению)
```

---

## 6. Связанные документы

- **API Reference**: `docs/API-PATHS-REFERENCE.md`
- **Business Logic**: `docs/BUSINESS-LOGIC-REFERENCE.md`
- **Dashboard Sales API**: `frontend/docs/request-backend/122-DASHBOARD-MAIN-PAGE-SALES-API.md`
- **Expense Cards Story**: `frontend/docs/stories/epic-62/story-62.5-fe-expense-metrics-cards.md`

---

## 7. План действий

| Шаг | Описание | Исполнитель | Приоритет |
|-----|----------|-------------|-----------|
| 1 | Согласовать с Product Owner выбор варианта (A/B/C) | PM | High |
| 2 | Обновить `DashboardContent.tsx` | Frontend | Medium |
| 3 | Добавить тултипы с пояснениями | Frontend | Medium |
| 4 | Обновить тесты | QA | Medium |
| 5 | Обновить документацию | Tech Writer | Low |

---

## 8. Решение (Применено)

**Дата исправления**: 2026-02-01

**Применённое решение**: Вариант A (использование `wb_sales_gross` как базы)

**Изменённый файл**: `frontend/src/app/(dashboard)/dashboard/components/DashboardContent.tsx`

**Изменение**:
```typescript
// БЫЛО (строка 76):
const revenueTotal = summaryRus?.sale_gross ?? summaryTotal?.sale_gross_total

// СТАЛО:
// Issue #3 Fix: Use wb_sales_gross (Выкупы) as base for expense percentages
// This ensures consistency with the "Выкупы" card value (84,377₽ vs sale_gross 128,487₽)
const revenueTotal = summaryRus?.wb_sales_gross ?? summaryTotal?.wb_sales_gross_total
```

**Результат**:
- Проценты расходов теперь рассчитываются от той же базы, что отображается в карточке "Выкупы"
- Логистика: 17 787,58 / 84 377,52 = **21,08%** (ранее показывалось 13,84%)
- Хранение: 2 056,28 / 84 377,52 = **2,44%** (ранее показывалось 1,6%)
- Реклама: 3 776,65 / 84 377,52 = **4,48%** (ранее показывалось 2,94%)

**Верификация**: ✅ TypeScript type-check passed, ✅ ESLint passed

---

**Версия документа**: 1.1
**Последнее обновление**: 2026-02-01
