# Dashboard Week 2026-W05 Validation - Bug Report

**Дата**: 2026-02-01
**Неделя**: 2026-W05 (26 янв. — 1 фев.) - **Незавершённая неделя**
**Статус**: ✅ FIXED (2026-02-01)

---

## Резюме

При валидации данных дашборда для незавершённой недели W05 обнаружен баг в отображении теоретической прибыли.

---

## Обнаруженный баг

### BUG-001: Некорректное отображение теоретической прибыли при неполных данных

**Severity**: HIGH
**Component**: `TheoreticalProfitCard.tsx`
**Location**: `frontend/src/components/custom/dashboard/TheoreticalProfitCard.tsx:100-102`

#### Описание

Когда финансовые данные отсутствуют (week summary = null), компонент показывает **-2,102.66 ₽** вместо "—" или "Нет данных".

#### Скриншот

```
Теор. прибыль     [Неполные данные]
-2 102,66 ₽       ← НЕКОРРЕКТНО!
-108,3% vs 25 239,99 ₽
Не хватает: salesAmount, COGS, Логистика, Хранение
```

#### Причина

Формула: `Теор. прибыль = Выкупы - COGS - Реклама - Логистика - Хранение`

При null данных:
```
теор_прибыль = 0 - 0 - 2102.66 - 0 - 0 = -2102.66 ₽
```

Единственное значение - рекламные затраты (2,102.66 ₽), которые были загружены из отдельного API.

#### Проблемный код

```tsx
// TheoreticalProfitCard.tsx:100-102
<span className={cn('text-5xl font-bold', valueColor)}>
  {value != null ? formatCurrency(value) : '—'}  // ❌ BUG
</span>
```

`value` = -2102.66 (не null), поэтому показывается значение.

#### Рекомендуемое исправление

```tsx
// ВАРИАНТ 1: Не показывать value если данные неполные
<span className={cn('text-5xl font-bold', valueColor)}>
  {value != null && isComplete ? formatCurrency(value) : '—'}
</span>

// ВАРИАНТ 2: Не показывать если отсутствует > 50% полей
const shouldShowValue = value != null && (profit?.missingFields?.length ?? 0) <= 2
<span className={cn('text-5xl font-bold', valueColor)}>
  {shouldShowValue ? formatCurrency(value) : '—'}
</span>
```

#### ✅ Применённое исправление (2026-02-01)

Реализован ВАРИАНТ 1 с дополнительными улучшениями:

```tsx
// TheoreticalProfitCard.tsx - Lines 100-106
<span className={cn('text-5xl font-bold', isComplete ? valueColor : 'text-muted-foreground')}>
  {value != null && isComplete ? formatCurrency(value) : '—'}
</span>
// Также скрыт ComparisonBadge когда isComplete=false
{comparison && isComplete && (
  <div className="mt-2 flex items-center gap-2">...
```

**Изменения**:
1. Добавлен `&& isComplete` к условию отображения value
2. При `isComplete=false` используется `text-muted-foreground` вместо зелёного/красного
3. Скрыт ComparisonBadge при неполных данных (сравнение вводит в заблуждение)
4. Обновлён aria-label для accessibility

**Тесты**: Добавлен файл `TheoreticalProfitCard.test.tsx` с 13 тестами, включая BUG FIX coverage.

#### Влияние

- Пользователи видят "убыток" -2,102.66 ₽ когда реальная прибыль **неизвестна**
- Может привести к неверным бизнес-решениям
- Сравнение с предыдущим периодом (-108.3%) также вводит в заблуждение

---

## Валидация данных W05

### Корректные данные

| Метрика | Frontend | Backend | Статус |
|---------|----------|---------|--------|
| Заказы Total | 118 | 118 | ✅ |
| Заказы FBO | 109 | 109 | ✅ |
| Заказы FBS | 9 | 9 | ✅ |
| Сумма заказов | 1,265,467 ₽ | 1,265,467 ₽ | ✅ |
| Рекламные затраты | 2,102.66 ₽ | 2,102.66 ₽ | ✅ |

### Ожидаемо пустые (неделя не завершена)

| Метрика | Frontend | Backend | Статус |
|---------|----------|---------|--------|
| Выкупы | — | null | ✅ Корректно пусто |
| COGS выкупов | — | null | ✅ Корректно пусто |
| Логистика | — | null | ✅ Корректно пусто |
| Хранение | — | null | ✅ Корректно пусто |

### Баг

| Метрика | Frontend | Ожидаемо | Статус |
|---------|----------|----------|--------|
| **Теор. прибыль** | **-2,102.66 ₽** | **—** или **Нет данных** | ❌ BUG |

---

## Backend API ответы

### Finance Summary
```bash
GET /v1/analytics/weekly/finance-summary?week=2026-W05
Response: { summary_total: null }  # Недоступно для незавершённой недели
```

### Advertising
```bash
GET /v1/analytics/advertising?from=2026-01-26&to=2026-02-01
Response: { summary: { totalSpend: 2102.66 } }  # Доступно в реальном времени
```

### Fulfillment (Epic 60)
```bash
GET /v1/analytics/fulfillment/summary?from=2026-01-26&to=2026-02-01
Response:
{
  "summary": {
    "fbo": { "ordersCount": 109, "ordersRevenue": 301067 },
    "fbs": { "ordersCount": 9, "ordersRevenue": 964400 },
    "total": { "ordersCount": 118, "ordersRevenue": 1265467 }
  }
}
```

---

## Рекомендации

### Краткосрочное исправление

1. В `TheoreticalProfitCard.tsx` изменить условие отображения value:
   - Показывать "—" если `isComplete === false`
   - Или показывать "—" если отсутствуют критические поля (sales, cogs)

### Долгосрочное улучшение

1. В `theoretical-profit.ts` возвращать `value: null` когда `isComplete === false`
2. Или добавить поле `isMeaningful: boolean` для индикации достоверности расчёта

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `frontend/src/components/custom/dashboard/TheoreticalProfitCard.tsx` | Условие отображения value |
| `frontend/src/lib/theoretical-profit.ts` | (опционально) Логика расчёта |

---

## Контакты

**Приоритет**: HIGH - влияет на UX и бизнес-решения

---

**Подготовлено**: Claude Code (Backend Validation)
**Дата**: 2026-02-01
