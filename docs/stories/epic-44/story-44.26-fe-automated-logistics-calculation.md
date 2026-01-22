# Story 44.26-FE: Automated Logistics Calculation with Product & Warehouse Integration

> **⚠️ STORY SPLIT NOTICE**
>
> This story has been split into two sub-stories for independent delivery:
>
> | Sub-Story | Title | Effort | Status | Dependency |
> |-----------|-------|--------|--------|------------|
> | **[44.26a-FE](./story-44.26a-fe-product-search-date-picker.md)** | Product Search & Delivery Date Selection | 5 SP | 📋 Ready for Dev | None (can start) |
> | **[44.26b-FE](./story-44.26b-fe-auto-fill-dimensions-category.md)** | Auto-fill Dimensions & Category | 5 SP | 📋 Ready for Dev | 44.26a (Backend #99 ✅ DONE) |
>
> **Reason for split**: PM Validation identified that:
> 1. Original story was 10-13 SP (not 8 SP as estimated)
> 2. Backend dependency (Request #99) blocks auto-fill functionality
> 3. Product search and date picker can be delivered independently
>
> **Development approach**: Complete 44.26a first, then 44.26b when backend API ready.
>
> **This document is preserved for reference.** For implementation, use sub-story documents.

---

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: 🔀 Split into Sub-Stories
**Priority**: P0 - CRITICAL (Next Major Feature)
**Effort**: 10 SP (5 SP + 5 SP)
**Depends On**:
- Story 44.7 ✅ (Dimension Volume Calculation)
- Story 44.8 ✅ (Logistics Tariff Calculation)
- Story 44.12 ✅ (Warehouse Selection)
- Story 44.13 ✅ (Auto-fill Coefficients)

---

## User Story

**As a** Seller,
**I want** to either select a product from my catalog OR manually enter dimensions, choose a warehouse, and have logistics costs calculated automatically,
**So that** I can quickly estimate logistics costs for both existing products and new products I'm planning to add.

---

## Два режима работы

### Режим A: Выбор товара из каталога
```
1. Выбираю товар (nmId) из каталога магазина
   → Система автоматически подтягивает:
     • Габариты (длина, ширина, высота)
     • Категорию товара (комиссия WB)
2. Выбираю склад → система подтягивает коэффициенты
3. Выбираю дату сдачи → применяется коэффициент для этой даты
4. Результат: полностью автоматический расчёт логистики
```

### Режим B: Ручной ввод (для новых товаров)
```
1. НЕ выбираю товар (поле пустое)
2. Вручную выбираю категорию товара (для комиссии WB)
3. Вручную ввожу габариты в сантиметрах
   → Система сама считает литраж
4. Выбираю склад → система подтягивает коэффициенты
5. Выбираю дату сдачи → применяется коэффициент
6. Результат: расчёт логистики на основе ручных данных
```

### Логика коэффициентов по типу фулфилмента

| Тип | Логистика | Хранение |
|-----|-----------|----------|
| **FBO** | ✅ Коэффициент склада | ✅ Коэффициент хранения |
| **FBS** | ✅ Коэффициент склада | ❌ Не применяется |

---

## Business Context

### Текущее состояние (AS-IS)

Price Calculator уже имеет:
- ✅ Ручной ввод габаритов товара (Story 44.7)
- ✅ Расчёт объёма из габаритов
- ✅ Выбор склада с тарифами (Story 44.12)
- ✅ Коэффициенты логистики/хранения (Story 44.13)
- ✅ Расчёт логистики по формуле WB (Story 44.8)
- ✅ Выбор категории с комиссией (CategorySelector)

**Проблема**:
- Пользователь должен вручную вводить габариты даже для существующих товаров
- Категорию нужно выбирать вручную, хотя она уже есть в карточке товара WB
- Нет связи между товаром в каталоге и его параметрами в калькуляторе

### Целевое состояние (TO-BE)

**Режим A: Товар из каталога (автоматизация)**
| Параметр | Источник |
|----------|----------|
| Габариты | Автоматически из карточки WB |
| Категория + комиссия | Автоматически из карточки WB |
| Склад | Выбор пользователя |
| Дата сдачи | Выбор пользователя |
| Коэффициенты | Автоматически по складу + дате |

**Режим B: Новый товар (ручной ввод)**
| Параметр | Источник |
|----------|----------|
| Габариты | Ручной ввод в см |
| Категория + комиссия | Ручной выбор из списка |
| Склад | Выбор пользователя |
| Дата сдачи | Выбор пользователя |
| Коэффициенты | Автоматически по складу + дате |

**Различие FBO vs FBS:**
- **FBO**: Коэффициент логистики + коэффициент хранения
- **FBS**: Только коэффициент логистики (хранение = 0)

---

## Acceptance Criteria

### AC1: Product Selection with Auto-fill (Режим A)
- [ ] Добавить поле выбора товара (nmId) в форму Price Calculator (опционально)
- [ ] Реализовать searchable dropdown с поиском по SKU, артикулу и названию
- [ ] При выборе товара автоматически заполнять:
  - **Габариты** из `product.dimensions`:
    - `length_cm` ← `product.length / 10` (WB хранит в мм)
    - `width_cm` ← `product.width / 10`
    - `height_cm` ← `product.height / 10`
  - **Категорию** из `product.subject_id` + `product.parent_id`:
    - Автоматически выбрать в CategorySelector
    - Заблокировать CategorySelector для редактирования (или показать "Автозаполнено")
- [ ] Показывать badge "Автозаполнено" для габаритов И категории
- [ ] Позволять ручное редактирование автозаполненных габаритов
- [ ] При ручном редактировании показывать badge "Изменено" и кнопку "Восстановить"
- [ ] Кнопка "Очистить товар" → переход в Режим B (ручной ввод)

### AC1.1: Manual Entry Mode (Режим B)
- [ ] Если товар НЕ выбран → CategorySelector доступен для выбора
- [ ] Если товар НЕ выбран → габариты вводятся вручную в см
- [ ] Система сама считает литраж из габаритов (уже реализовано Story 44.7)

### AC2: Delivery Date Selection for Coefficient Lookup
- [ ] Добавить поле выбора даты сдачи товара (DatePicker)
- [ ] Показывать только доступные даты (из API acceptance coefficients)
- [ ] По умолчанию выбирать завтрашнюю дату (или первую доступную)
- [ ] При изменении даты автоматически применять соответствующий коэффициент
- [ ] Показывать текущий коэффициент рядом с датой: "Коэффициент: ×1.25"
- [ ] Недоступные даты отмечать серым цветом (coefficient = -1)

### AC3: Coefficient Calendar Visualization
- [ ] Отображать календарь на 14 дней с коэффициентами
- [ ] Цветовая индикация:
  - Зелёный: coefficient ≤ 100 (×1.0) - базовый
  - Жёлтый: 100 < coefficient ≤ 150 (×1.0-1.5) - повышенный
  - Оранжевый: 150 < coefficient ≤ 200 (×1.5-2.0) - высокий
  - Красный: coefficient > 200 (×2.0+) - пиковый
  - Серый: coefficient = -1 - недоступно
- [ ] При наведении показывать tooltip с точным коэффициентом и датой
- [ ] При клике на дату - выбирать эту дату для расчёта

### AC4: Automated Logistics Calculation Flow
- [ ] Автоматический пересчёт логистики при изменении:
  - Выбранного товара (изменяются габариты)
  - Выбранного склада (изменяются тарифы)
  - Выбранной даты (изменяется коэффициент)
  - Ручных габаритов (изменяется объём)
- [ ] Формула расчёта (Story 44.8):
  ```
  logistics_forward = (baseLiterRub + (volume - 1) × additionalLiterRub) × coefficient

  Где:
  - volume = (length × width × height) / 1000 (литры)
  - baseLiterRub = тариф склада для первого литра (из warehouse.boxDeliveryBase)
  - additionalLiterRub = тариф за доп. литр (из warehouse.boxDeliveryLiter)
  - coefficient = коэффициент для выбранной даты (из acceptance coefficients)
  ```
- [ ] Показывать breakdown расчёта: объём, базовый тариф, доп. литры, коэффициент, итого

### AC5: Integration with Existing Form
- [ ] Интегрировать ProductSelect в секцию "Товар" формы (перед габаритами)
- [ ] Интегрировать DeliveryDatePicker в секцию "Склад и хранение"
- [ ] Сохранить возможность работы без выбора товара (ручной ввод габаритов)
- [ ] При сбросе формы очищать выбранный товар и дату
- [ ] Обеспечить совместимость с FBO/FBS режимами (коэффициенты могут отличаться)

### AC6: Error Handling & Loading States
- [ ] Показывать skeleton при загрузке списка товаров
- [ ] Показывать spinner при загрузке габаритов товара
- [ ] Показывать ошибку если товар не имеет габаритов: "Габариты не указаны в карточке WB"
- [ ] Показывать ошибку если нет доступных дат: "Нет доступных дат для выбранного склада"
- [ ] Retry механизм для API ошибок
- [ ] Graceful degradation: если автозаполнение не работает, форма остаётся функциональной

---

## API Dependencies (Backend Request)

### Существующие API (уже реализованы):

#### 1. Product List with Dimensions
```http
GET /v1/products?include_dimensions=true&limit=100
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Требуется добавить в response:**
```json
{
  "products": [
    {
      "nm_id": 147205694,
      "vendor_code": "DRESS-001",
      "title": "Платье летнее",
      "brand": "Artisan",
      "dimensions": {
        "length_mm": 400,
        "width_mm": 300,
        "height_mm": 50
      },
      "category": {
        "subject_id": 105,
        "subject_name": "Платья",
        "parent_id": 8,
        "parent_name": "Женская одежда"
      }
    }
  ]
}
```

**Backend Request Priority**: P1 - Необходимо добавить `dimensions` и `category` в DTO продукта.

**Примечание**: Данные категории нужны для автоматического выбора в CategorySelector, который определяет комиссию WB (kgvpMarketplace для FBS, paidStorageKgvp для FBO).

#### 2. Acceptance Coefficients (Story 44.13 - готов)
```http
GET /v1/tariffs/acceptance/coefficients?warehouseId=507
Authorization: Bearer {token}
X-Cabinet-Id: {cabinet_id}
```

**Response (уже есть):**
```json
{
  "coefficients": [
    {
      "date": "2026-01-20",
      "coefficient": 100,
      "isAvailable": true,
      "delivery": {
        "coefficient": 100,
        "baseLiterRub": 48,
        "additionalLiterRub": 5
      }
    }
  ]
}
```

#### 3. Warehouses (Story 44.12 - готов)
```http
GET /v1/tariffs/warehouses
```

---

## Technical Requirements

### New Types

```typescript
// src/types/product.ts - Extend existing types

/** Product dimensions from WB catalog (in mm) */
export interface ProductDimensions {
  length_mm: number
  width_mm: number
  height_mm: number
}

/** Product category from WB catalog */
export interface ProductCategory {
  subject_id: number
  subject_name: string
  parent_id: number
  parent_name: string
}

/** Product with dimensions and category for Price Calculator */
export interface ProductWithDimensions {
  nm_id: number
  vendor_code: string
  title: string
  brand?: string
  dimensions?: ProductDimensions
  category?: ProductCategory
  photo_url?: string
}

// src/types/price-calculator.ts - Add delivery date types

/** Delivery date selection */
export interface DeliveryDateOption {
  date: string // ISO date
  coefficient: number
  isAvailable: boolean
  status: 'base' | 'elevated' | 'high' | 'peak' | 'unavailable'
}
```

### New Components

```
src/components/custom/price-calculator/
├── ProductSearchSelect.tsx      # CREATE - Searchable product dropdown
├── DeliveryDatePicker.tsx       # CREATE - Date picker with coefficients
├── CoefficientCalendar.tsx      # UPDATE - Already exists, enhance
├── AutoFillDimensionsBadge.tsx  # CREATE - Badge for auto-filled values
└── LogisticsBreakdownCard.tsx   # UPDATE - Enhanced breakdown display
```

### New Hooks

```typescript
// src/hooks/useProductsWithDimensions.ts
export function useProductsWithDimensions(search: string) {
  return useQuery({
    queryKey: ['products', 'dimensions', search],
    queryFn: () => getProductsWithDimensions({ search, include_dimensions: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// src/hooks/useProductDimensions.ts
export function useProductDimensions(nmId: number | null) {
  return useQuery({
    queryKey: ['products', nmId, 'dimensions'],
    queryFn: () => getProductDimensions(nmId!),
    enabled: !!nmId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
```

### Form State Extension

```typescript
// Update FormData in usePriceCalculatorForm.ts
interface FormData {
  // ... existing fields ...

  // Product selection (NEW)
  selected_product_nm_id: number | null
  selected_product_name: string
  dimensions_source: 'auto' | 'manual'

  // Delivery date (NEW)
  delivery_date: string | null
  delivery_coefficient: number
}
```

---

## UI/UX Requirements

### Product Selection Section

**Режим B: Ручной ввод (товар не выбран)**
```
┌─────────────────────────────────────────────────────────────┐
│ Товар (опционально)                                      [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔍 Поиск по SKU, артикулу или названию...               │ │
│ └─────────────────────────────────────────────────────────┘ │
│ 💡 Или введите данные вручную ниже                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Категория товара                                         [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Выберите категорию...                              [▼]  │ │  ← Активен
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Габариты товара                                          [?] │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│ │ Длина, см │ │ Ширина, см│ │ Высота, см│                   │
│ │   [    ]  │ │   [    ]  │ │   [    ]  │  ← Ручной ввод   │
│ └───────────┘ └───────────┘ └───────────┘                   │
│ Объём: — л                                                  │
└─────────────────────────────────────────────────────────────┘
```

**Dropdown при поиске товара:**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 плат                                                     │
├─────────────────────────────────────────────────────────────┤
│ [IMG] 147205694 • DRESS-001                                 │
│       Платье летнее - Artisan                               │
│       📐 40×30×5 см • Женская одежда → Платья               │
├─────────────────────────────────────────────────────────────┤
│ [IMG] 147205695 • DRESS-002                                 │
│       Платье вечернее - Artisan                             │
│       📐 45×35×8 см • Женская одежда → Платья               │
└─────────────────────────────────────────────────────────────┘
```

**Режим A: Товар выбран (автозаполнение)**
```
┌─────────────────────────────────────────────────────────────┐
│ Товар                                              [× Очистить] │
├─────────────────────────────────────────────────────────────┤
│ [IMG] Платье летнее (DRESS-001)           [Автозаполнено]   │
│       Artisan • nmId: 147205694                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Категория товара                           [Автозаполнено]  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Женская одежда → Платья                    [15%] 🔒     │ │  ← Заблокирован
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Габариты товара                            [Автозаполнено]  │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐                   │
│ │ Длина, см │ │ Ширина, см│ │ Высота, см│                   │
│ │   [40.0]  │ │   [30.0]  │ │   [5.0]   │ [🔁 Восстановить]│
│ └───────────┘ └───────────┘ └───────────┘                   │
│ [МГТ] Объём: 6,000 л                                        │
└─────────────────────────────────────────────────────────────┘
```

### Delivery Date Section (inside Warehouse Section)
```
┌─────────────────────────────────────────────────────────────┐
│ 🏪 Склад и хранение                                         │
├─────────────────────────────────────────────────────────────┤
│ Склад WB: [Коледино ▼]                                      │
│                                                             │
│ Дата сдачи товара:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📅 21 января 2026                    Коэффициент: ×1.25 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▸ Календарь коэффициентов (14 дней)                         │
│   ┌────┬────┬────┬────┬────┬────┬────┐                      │
│   │ Пн │ Вт │ Ср │ Чт │ Пт │ Сб │ Вс │                      │
│   ├────┼────┼────┼────┼────┼────┼────┤                      │
│   │🟢  │🟡  │🟡  │🟢  │🟠  │🔴  │⬜  │                      │
│   │1.0 │1.25│1.25│1.0 │1.5 │2.0 │ -- │                      │
│   ├────┼────┼────┼────┼────┼────┼────┤                      │
│   │🟢  │🟢  │🟡  │🟠  │🔴  │🔴  │⬜  │                      │
│   │1.0 │1.0 │1.25│1.5 │2.0 │2.5 │ -- │                      │
│   └────┴────┴────┴────┴────┴────┴────┘                      │
│                                                             │
│ Легенда: 🟢 базовый 🟡 повышенный 🟠 высокий 🔴 пиковый     │
└─────────────────────────────────────────────────────────────┘
```

### Logistics Breakdown (Enhanced)
```
┌─────────────────────────────────────────────────────────────┐
│ 🚚 Логистика прямая                           [Рассчитано]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Логистика прямая, ₽                                     │ │
│ │ [    78.75    ]                                    [🔁] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ▾ Показать расчёт                                           │
│   ├─ Товар:                Платье летнее (DRESS-001)        │
│   ├─ Габариты:             40×30×5 см                       │
│   ├─ Объём:                6,00 л                           │
│   ├─ Склад:                Коледино                         │
│   ├─ Дата сдачи:           21.01.2026                       │
│   ├─ Базовый тариф:        48 ₽ (первый литр)               │
│   ├─ Доп. литры:           5 л × 5 ₽ = 25 ₽                 │
│   ├─ Коэффициент:          ×1.25                            │
│   ├──────────────────────────────────────────               │
│   └─ Итого логистика:      78,75 ₽                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Notes

### File Structure

```
src/
├── components/
│   └── custom/
│       └── price-calculator/
│           ├── ProductSearchSelect.tsx          # CREATE
│           ├── DeliveryDatePicker.tsx           # CREATE
│           ├── CoefficientCalendar.tsx          # UPDATE (enhance)
│           ├── AutoFillBadge.tsx                # UPDATE (add "Восстановить")
│           ├── LogisticsSection.tsx             # UPDATE (integrate date)
│           ├── WarehouseSection.tsx             # UPDATE (add date picker)
│           └── PriceCalculatorForm.tsx          # UPDATE (add product select)
├── hooks/
│   ├── useProductsWithDimensions.ts             # CREATE
│   └── useProductDimensions.ts                  # CREATE
├── lib/
│   └── api/
│       └── products.ts                          # UPDATE (add dimensions param)
└── types/
    ├── product.ts                               # UPDATE (add dimensions)
    └── price-calculator.ts                      # UPDATE (add delivery date)
```

### Data Flow

```
                              ┌─────────────────┐
                        ┌────▶│  Category       │────▶ WB Commission %
                        │     │  (auto-fill)    │
┌─────────────────┐     │     └─────────────────┘
│  ProductSelect  │─────┤
│  (nmId)         │     │     ┌─────────────────┐     ┌─────────────────┐
└─────────────────┘     └────▶│  Dimensions     │────▶│  Volume Calc    │
        │                     │  (auto-fill)    │     │  (Story 44.7)   │
        │                     └─────────────────┘     └────────┬────────┘
        │                                                      │
        ▼ (если товар не выбран)                               │
┌─────────────────┐                                            │
│ CategorySelector│────▶ WB Commission % (ручной выбор)        │
│ (manual)        │                                            │
└─────────────────┘                                            │
                                                               │
┌─────────────────┐     ┌─────────────────┐                    │
│ WarehouseSelect │────▶│  Base Tariffs   │                    │
│ (warehouseId)   │     │  (Story 44.12)  │                    │
└─────────────────┘     └────────┬────────┘                    │
        │                        │                             │
        ▼ (FBO/FBS)              │                             │
┌─────────────────┐              │                             │
│ FBO: logistics  │              │                             │
│   + storage     │              │                             │
│ FBS: logistics  │              │                             │
│   only          │              │                             │
└─────────────────┘              │                             │
                                 │                             │
┌─────────────────┐     ┌────────▼────────┐     ┌──────────────▼──┐
│ DatePicker      │────▶│  Coefficient    │────▶│  Logistics Calc  │
│ (delivery_date) │     │  (Story 44.13)  │     │  (Story 44.8)    │
└─────────────────┘     └─────────────────┘     └──────────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │ logistics_fwd   │
                                                │ (auto-filled)   │
                                                └─────────────────┘
```

### State Management

```typescript
// PriceCalculatorForm state additions
const [selectedProduct, setSelectedProduct] = useState<ProductWithDimensions | null>(null)
const [deliveryDate, setDeliveryDate] = useState<string | null>(null)
const [dimensionsSource, setDimensionsSource] = useState<'auto' | 'manual'>('manual')
const [categorySource, setCategorySource] = useState<'auto' | 'manual'>('manual')

// Режим A: When product selected - auto-fill dimensions AND category
const handleProductSelect = useCallback((product: ProductWithDimensions | null) => {
  setSelectedProduct(product)

  if (product) {
    // Auto-fill dimensions (convert mm to cm)
    if (product.dimensions) {
      setValue('length_cm', product.dimensions.length_mm / 10)
      setValue('width_cm', product.dimensions.width_mm / 10)
      setValue('height_cm', product.dimensions.height_mm / 10)
      setDimensionsSource('auto')
    }

    // Auto-fill category
    if (product.category) {
      setSelectedCategory({
        parentID: product.category.parent_id,
        parentName: product.category.parent_name,
        subjectID: product.category.subject_id,
        subjectName: product.category.subject_name,
        // Commission will be looked up from commissions data
        kgvpMarketplace: 0, // Will be filled from useCommissions
        paidStorageKgvp: 0,
      })
      setCategorySource('auto')
    }
  } else {
    // Режим B: Clear auto-filled values
    setDimensionsSource('manual')
    setCategorySource('manual')
    setSelectedCategory(null)
  }
}, [setValue, setSelectedCategory])

// When date selected
const handleDateSelect = useCallback((date: string, coefficient: number) => {
  setDeliveryDate(date)
  // Coefficient will be used in logistics calculation
  // via useAcceptanceCoefficients hook
}, [])

// Check if CategorySelector should be disabled
const isCategoryLocked = categorySource === 'auto' && selectedProduct !== null
```

---

## Invariants & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **Режим A: Товар выбран** | |
| Product without dimensions | Show warning, switch to manual dimensions input |
| Product without category | Show warning, enable CategorySelector for manual selection |
| Product changed | Reset dimensions AND category to new product values |
| "Очистить товар" clicked | Switch to Режим B, enable CategorySelector, clear dimensions |
| Manual dimension edit | Change source to 'manual', show restore button |
| **Режим B: Ручной ввод** | |
| No product selected | CategorySelector active, dimensions manual |
| **Общие сценарии** | |
| All dates unavailable | Show error, allow warehouse change |
| Warehouse changed | Reset date to first available, reload coefficients |
| FBO selected | Show logistics + storage coefficients |
| FBS selected | Show only logistics coefficient (storage = 0) |
| Form reset | Clear product, date, reset dimensions, reset category |
| API error loading products | Show error, allow retry, form remains usable |
| API error loading coefficients | Use coefficient = 1.0, show warning |
| Coefficient = -1 (unavailable) | Disable date selection, show as unavailable |
| Very large product (KGT) | Show KGT warning from Story 44.7 |

---

## Out of Scope

- ❌ Создание товара в Price Calculator
- ❌ Редактирование габаритов товара в каталоге WB
- ❌ Мультивыбор товаров для batch расчёта
- ❌ История выбранных товаров
- ❌ Сравнение логистики по разным складам одновременно
- ❌ Рекомендация оптимального склада на основе коэффициентов
- ❌ Интеграция с Orders FBS (только FBO логистика в этой истории)
- ❌ Автоматический выбор даты с минимальным коэффициентом

---

## Definition of Done

- [ ] All Acceptance Criteria verified (AC1-AC6)
- [ ] ProductSearchSelect component implemented
- [ ] DeliveryDatePicker component implemented
- [ ] CoefficientCalendar enhanced with click-to-select
- [ ] Auto-fill dimensions from product catalog
- [ ] Date-based coefficient lookup working
- [ ] Logistics auto-calculation updated with all inputs
- [ ] Form integration complete
- [ ] Loading and error states implemented
- [ ] Unit tests for new hooks and utilities
- [ ] Component tests for ProductSearchSelect, DeliveryDatePicker
- [ ] E2E test for full automated flow
- [ ] No ESLint errors
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review completed
- [ ] Documentation updated
- [ ] QA Gate passed

---

## Observability

- **Analytics**: Track product selection frequency
- **Metrics**: Auto-fill success rate (products with dimensions / total selections)
- **Metrics**: Date selection distribution by coefficient level
- **Logs**: Log dimension auto-fill events
- **Alerts**: Alert if > 30% products missing dimensions

---

## Security

- **Input Sanitization**: All numeric inputs validated
- **XSS Prevention**: Product names displayed as text
- **Rate Limiting**: Product search debounced (300ms)
- **Authentication**: All API calls require Bearer token

---

## Accessibility (WCAG 2.1 AA)

- [ ] Product dropdown keyboard navigable
- [ ] Date picker keyboard navigable
- [ ] Calendar cells have aria-label with full date and coefficient
- [ ] Auto-fill notifications announced to screen readers
- [ ] Restore buttons have descriptive aria-label
- [ ] Color is not the only indicator (icons + text for coefficients)
- [ ] Focus management on selection change

---

## Dev Agent Record

### File List
| File | Change Type | Lines (Est.) | Description |
|------|-------------|--------------|-------------|
| `src/components/custom/price-calculator/ProductSearchSelect.tsx` | CREATE | ~180 | Searchable product dropdown |
| `src/components/custom/price-calculator/DeliveryDatePicker.tsx` | CREATE | ~120 | Date picker with coefficient |
| `src/components/custom/price-calculator/CoefficientCalendar.tsx` | UPDATE | +50 | Add click-to-select |
| `src/components/custom/price-calculator/AutoFillBadge.tsx` | UPDATE | +30 | Add restore functionality |
| `src/components/custom/price-calculator/WarehouseSection.tsx` | UPDATE | +40 | Add date picker integration |
| `src/components/custom/price-calculator/LogisticsSection.tsx` | UPDATE | +30 | Add product info to breakdown |
| `src/components/custom/price-calculator/PriceCalculatorForm.tsx` | UPDATE | +60 | Add product select |
| `src/hooks/useProductsWithDimensions.ts` | CREATE | ~40 | Products with dimensions hook |
| `src/lib/api/products.ts` | UPDATE | +20 | Add include_dimensions param |
| `src/types/product.ts` | UPDATE | +20 | Add dimensions type |
| `src/types/price-calculator.ts` | UPDATE | +15 | Add delivery date types |

### Change Log
_(To be filled during implementation)_

### Review Follow-ups
_(To be filled after code review)_

---

## QA Checklist

### Functional Verification
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Search product by SKU | Shows matching products | [ ] |
| Select product | Auto-fills dimensions | [ ] |
| Edit auto-filled dimension | Shows "Изменено" badge | [ ] |
| Click "Восстановить" | Restores original values | [ ] |
| Select delivery date | Updates coefficient | [ ] |
| Click calendar date | Selects that date | [ ] |
| Unavailable date | Cannot be selected | [ ] |
| Change warehouse | Reloads coefficients, resets date | [ ] |
| Calculate logistics | Uses all auto-filled values | [ ] |
| Product without dimensions | Shows warning | [ ] |
| Reset form | Clears product and date | [ ] |

### Accessibility Verification
| Check | Status |
|-------|--------|
| Keyboard navigation | [ ] |
| Screen reader announcements | [ ] |
| Focus management | [ ] |
| Color + icon indicators | [ ] |

---

**Created**: 2026-01-20
**Last Updated**: 2026-01-20
**Author**: Claude Opus 4.5 (automated research)
