# Epic 36 UI Mockup - Product Card Linking

**Date**: 2025-12-27
**Epic**: 36 - Product Card Linking (склейки)
**Page**: Advertising Analytics

---

## 📐 UI Layout Overview

This document provides visual mockups for Epic 36 UI changes to the advertising analytics page.

---

## 🎨 Main Page - Before & After

### BEFORE (Epic 33 - Current State)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Рекламная аналитика                                                      │
│                                                                          │
│ Период: 2025-12-01 — 2025-12-21         [Обновить] [Экспорт]           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Summary Cards:                                                           │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│ │ Расходы  │ Продажи  │   ROAS   │   ROI    │ Кампаний │               │
│ │ 16,337₽  │ 41,558₽  │   2.54   │   1.54   │    5     │               │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│                                                                          │
│ Фильтры: [Все кампании ▼] [Все статусы ▼] [Поиск...]                  │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Артикул         Расходы  Продажи   ROAS    ROI    Статус         │  │
│ ├────────────────────────────────────────────────────────────────────┤  │
│ │ ter-13-1       11,337₽   31,464₽   2.78    1.78   ✅ Рентабельно │  │
│ │ izo30white      5,000₽    7,500₽   1.50    0.50   ✅ Рентабельно │  │
│ │ ter-09              0₽    1,105₽    —       —     🔵 Нет данных   │  │ ← PROBLEM!
│ │ ter-10              0₽    1,489₽    —       —     🔵 Нет данных   │  │ ← PROBLEM!
│ │ ter-20              0₽    5,433₽    —       —     🔵 Нет данных   │  │ ← PROBLEM!
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ Showing 5 of 5 items                                    [1] 2 3 > Last  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Problem**: Products with `spend=0` but `revenue>0` show "Нет данных" because ROAS/ROI cannot be calculated.

---

### AFTER (Epic 36 - With Card Linking)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Рекламная аналитика                                     [Обновить] [Экспорт]│
│                                                                          │
│ Период: 2025-12-01 — 2025-12-21                                         │
│                                                                          │
│ ┌───────────────────────────┐  ← NEW!                                   │
│ │ [По артикулам] [По склейкам] │  Toggle for grouping mode             │
│ └───────────────────────────┘                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Summary Cards:                                                           │
│ ┌──────────┬──────────┬──────────┬──────────┬──────────┐               │
│ │ Расходы  │ Продажи  │   ROAS   │   ROI    │ Кампаний │               │
│ │ 16,337₽  │ 41,558₽  │   2.54   │   1.54   │    5     │               │
│ └──────────┴──────────┴──────────┴──────────┴──────────┘               │
│                                                                          │
│ Фильтры: [Все кампании ▼] [Все статусы ▼] [Поиск...]                  │
│                                                                          │
│ Mode: По склейкам (2 группы, 1 индивидуальный)                         │
│                                                                          │
│ ┌────────────────────────────────────────────────────────────────────┐  │
│ │ Артикул         Расходы  Продажи   ROAS    ROI    Статус         │  │
│ ├────────────────────────────────────────────────────────────────────┤  │
│ │ Группа #328632  11,337₽   34,058₽   3.00    2.00   ✅ Рентабельно │  │ ← SOLVED!
│ │ 🔗 Склейка (3) ⓘ                                                   │  │
│ │                                                                     │  │
│ │ izo30white       5,000₽    7,500₽   1.50    0.50   ✅ Рентабельно │  │
│ └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ Showing 2 of 2 items                                    [1] Last         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Solution**: Products are grouped by `imtId`, showing aggregated metrics with correct ROAS/ROI.

---

## 🔍 Component Details

### 1. Group By Toggle (NEW)

**Location**: Top of page, next to date range picker

```
┌─────────────────────────────────────────────┐
│ Группировка:                                │
│ ┌──────────────┐  ┌──────────────┐        │
│ │ По артикулам │  │ По склейкам  │        │  ← Active state
│ └──────────────┘  └──────────────┘        │
│                   (highlighted)             │
│                                             │
│ 💡 Склейки объединяют метрики для          │
│    объединённых карточек товаров           │
└─────────────────────────────────────────────┘
```

**States**:

- **По артикулам** (default): `group_by=sku` - Shows each nmId separately
- **По склейкам**: `group_by=imtId` - Groups products with same imtId

**Implementation**:

```typescript
<div className="flex gap-2">
  <Button
    variant={groupBy === 'sku' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setGroupBy('sku')}
  >
    По артикулам
  </Button>
  <Button
    variant={groupBy === 'imtId' ? 'default' : 'outline'}
    size="sm"
    onClick={() => setGroupBy('imtId')}
  >
    По склейкам
  </Button>
</div>
```

---

### 2. Merged Product Badge (NEW)

**Appearance**: Secondary badge with link icon

```
┌───────────────────────────────────────┐
│ Группа #328632  🔗 Склейка (3) ⓘ     │  ← Hoverable badge
└───────────────────────────────────────┘
```

**Tooltip (on hover)**:

```
┌──────────────────────────────────────────────┐
│ Объединённая карточка #328632                │
│                                              │
│ Товары в группе:                             │
│  • ter-09 (#173588306)                       │
│  • ter-10 (#173589306)                       │
│  • ter-13-1 (#270937054)                     │
│                                              │
│ ──────────────────────────────────────       │
│ 💡 Рекламные затраты основной карточки       │
│    распределены между всеми товарами группы  │
└──────────────────────────────────────────────┘
```

**Component Props**:

```typescript
<MergedProductBadge
  imtId={328632}
  mergedProducts={[
    { nmId: 173588306, vendorCode: 'ter-09' },
    { nmId: 173589306, vendorCode: 'ter-10' },
    { nmId: 270937054, vendorCode: 'ter-13-1' },
  ]}
/>
```

---

### 3. Table Row - Merged Group

**Layout**:

```
┌──────────────────────────────────────────────────────────────────────┐
│ Группа #328632  🔗 Склейка (3) ⓘ                                    │
│ 11,337₽         34,058₽         3.00         2.00    ✅ Рентабельно │
│                                                                      │
│ Metrics:                                                             │
│  • Показы: 6,200                                                     │
│  • Клики: 310                                                        │
│  • Заказы: 13                                                        │
│  • CTR: 5.0%                                                         │
│  • CPC: 36.57₽                                                       │
│  • Конверсия: 4.19%                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Expandable Row (Future Enhancement - Optional)**:

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▼ Группа #328632  🔗 Склейка (3) ⓘ                                  │
│ 11,337₽         34,058₽         3.00         2.00    ✅ Рентабельно │
│                                                                      │
│   ├─ ter-09        0₽           1,105₽       —         —             │
│   ├─ ter-10        0₽           1,489₽       —         —             │
│   └─ ter-13-1    11,337₽       31,464₽      2.78       1.78         │
└──────────────────────────────────────────────────────────────────────┘
```

**Note**: Expandable rows are **optional** for MVP. Focus on merged group summary first.

---

### 4. Table Row - Individual Product

**Layout** (unchanged from Epic 33):

```
┌──────────────────────────────────────────────────────────────────────┐
│ izo30white                                                           │
│ 5,000₽          7,500₽          1.50         0.50    ✅ Рентабельно │
└──────────────────────────────────────────────────────────────────────┘
```

**Key Point**: Individual products (with `imtId=null`) display **exactly the same** as before Epic 36.

---

## 📱 Responsive Behavior

### Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [По артикулам] [По склейкам]                     [Обновить] [Экспорт]│
│                                                                      │
│ Table: Full width with all columns visible                          │
└──────────────────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)

```
┌────────────────────────────────────────────┐
│ [По артикулам] [По склейкам]               │
│                                            │
│ Table: Horizontal scroll                   │
│ Badge: Abbreviated "🔗 (3)"                │
└────────────────────────────────────────────┘
```

### Mobile (≤767px)

```
┌─────────────────────────────┐
│ [Артик.] [Склейки]          │
│                             │
│ Card view instead of table: │
│ ┌───────────────────────┐   │
│ │ Группа #328632        │   │
│ │ 🔗 (3)                │   │
│ │ Расходы: 11,337₽      │   │
│ │ ROAS: 3.00            │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

---

## 🎭 State Transitions

### Toggle Animation

```
User clicks "По склейкам"
        ↓
1. Button state changes (visual feedback)
        ↓
2. Loading spinner appears
        ↓
3. API request sent with group_by=imtId
        ↓
4. Table data updates (smooth fade transition)
        ↓
5. Badge components appear for merged groups
```

**Duration**: ~300-500ms (standard React Query refetch)

**Animation**:

- Button: Instant highlight (no delay)
- Table: 200ms fade-out → data update → 200ms fade-in
- Badge: Appears with parent row (no separate animation)

---

## 🔔 User Notifications

### Empty State (No Merged Groups)

**Scenario**: User selects "По склейкам" but no products have `imtId` assigned.

```
┌──────────────────────────────────────────────┐
│ Режим: По склейкам                           │
│                                              │
│ ℹ️ Нет объединённых карточек                 │
│                                              │
│ В текущем кабинете нет товаров со склейками. │
│ Все товары отображаются индивидуально.       │
│                                              │
│ Вернуться к [По артикулам]                   │
└──────────────────────────────────────────────┘
```

### First-Time User Hint

**Scenario**: User's first visit to advertising analytics page after Epic 36 deployment.

```
┌──────────────────────────────────────────────┐
│ 🆕 Новая функция: Склейки                    │
│                                              │
│ Теперь вы можете группировать метрики для    │
│ объединённых карточек товаров на WB.         │
│                                              │
│ [Попробовать] [Не показывать снова]          │
└──────────────────────────────────────────────┘
```

**Implementation**: Use `localStorage` to track if user has seen the hint.

---

## 📊 Data Flow Diagram

```
User Action: Click "По склейкам"
        ↓
State Update: setGroupBy('imtId')
        ↓
React Query: useAdvertisingAnalytics({ group_by: 'imtId' })
        ↓
API Client: GET /v1/analytics/advertising?group_by=imtId
        ↓
Backend: Returns merged groups + individuals
        ↓
Response Adapter: Maps backend camelCase to frontend snake_case
        ↓
Component Re-render:
  ├─ MergedProductBadge (for type='merged_group')
  ├─ Regular ProductRow (for type='individual')
  └─ EfficiencyBadge (updated status)
```

---

## 🎨 Color Scheme & Visual Design

### Badge Colors

**Merged Product Badge**:

- Background: `secondary` variant (gray-100 in light mode)
- Text: `secondary-foreground` (gray-700)
- Icon: 🔗 (Unicode link symbol)
- Hover: `secondary-hover` (gray-200)

**Efficiency Badge** (unchanged):

- Excellent: Green (`green-500`)
- Good: Blue (`blue-500`)
- Moderate: Yellow (`yellow-500`)
- Poor: Orange (`orange-500`)
- Loss: Red (`red-500`)
- Unknown: Gray (`gray-400`)

### Toggle Button States

**Active** (`variant="default"`):

- Background: `primary` (blue-600)
- Text: White
- Border: None

**Inactive** (`variant="outline"`):

- Background: Transparent
- Text: `foreground` (gray-700)
- Border: 1px solid `border` (gray-200)

---

## ♿ Accessibility

### ARIA Labels

**Toggle Buttons**:

```html
<button
  aria-label="Группировать по артикулам"
  aria-pressed={groupBy === 'sku'}
>
  По артикулам
</button>

<button
  aria-label="Группировать по склейкам"
  aria-pressed={groupBy === 'imtId'}
>
  По склейкам
</button>
```

**Merged Badge**:

```html
<div
  role="button"
  aria-label="Объединённая карточка с 3 товарами. Нажмите для подробностей."
  tabindex="0"
>
  🔗 Склейка (3)
</div>
```

### Keyboard Navigation

- **Tab**: Navigate to toggle buttons
- **Space/Enter**: Activate toggle
- **Tab**: Navigate to badge
- **Space/Enter**: Open tooltip (or focus on first product link)
- **Esc**: Close tooltip

---

## 📝 Copywriting (Russian)

### UI Labels

| English           | Russian                   |
| ----------------- | ------------------------- |
| Group By          | Группировка               |
| By SKU            | По артикулам              |
| By Merged Cards   | По склейкам               |
| Merged Card       | Объединённая карточка     |
| Group             | Группа                    |
| Products in group | Товары в группе           |
| No merged cards   | Нет объединённых карточек |

### Tooltips

**Merged Badge**:

> Объединённая карточка #{imtId}
>
> Товары в группе:
> • {vendorCode} (#{nmId})
> • ...
>
> 💡 Рекламные затраты основной карточки распределены между всеми товарами группы

**Group By Info**:

> Склейки объединяют метрики для объединённых карточек товаров на Wildberries

**Empty State**:

> В текущем кабинете нет товаров со склейками. Все товары отображаются индивидуально.

---

## 🔗 Related Mockups

- **Epic 33 UI**: `frontend/docs/wireframes/epic-33-advertising-analytics.md`
- **Epic 35 UI**: `frontend/docs/wireframes/epic-35-organic-split.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-12-27
**Designer**: Auto-generated based on Epic 36 backend contract
