# Epic 44: Price Calculator UI (Frontend)

**Created:** 2026-01-16
**Status:** ✅ COMPLETE
**Priority:** P1 - HIGH
**Business Owner:** Product Manager
**Backend Dependency:** Epic 43 ✅ Complete

---

## Executive Summary

**Frontend UI для Price Calculator** — пользовательский интерфейс для расчёта рекомендуемой цены продажи на основе целевой маржи с учётом всех затрат Wildberries.

### Бизнес-проблема

Селлеры создают новые карточки товаров и не знают, какую цену установить:
- *"Сколько поставить цену, чтобы получить маржу 20%?"*
- *"Учту ли я все затраты WB?"*
- *"Будет ли цена конкурентоспособной?"*

Текущий процесс:
1. Продавец вводит цену "на глаз" в карточке товара
2. Постфактум видит фактическую маржу в отчетах WB
3. Корректирует цену итеративно, теряя время и продажи

### Решение

UI страница в фронтенде, которая:
- Принимает параметры затрат и целевую маржу
- Отправляет запрос на backend API
- Отображает рассчитанную цену и breakdown затрат
- Позволяет сохранить расчёт или скорректировать параметры

---

## User Story

> **Как** селлер,
> **Я хочу** интерактивный калькулятор цены с визуальным breakdown затрат,
> **Чтобы** быстро определить оптимальную цену для нового товара и понять, как каждая затрата влияет на маржу.

---

## Backend API Reference

**Endpoint:** `POST /v1/products/price-calculator`

**Authentication:**
- `Authorization: Bearer <JWT_TOKEN>`
- `X-Cabinet-Id: <CABINET_UUID>`

**Request Body (Required):**
```json
{
  "target_margin_pct": 20.0,
  "cogs_rub": 1500.0,
  "logistics_forward_rub": 200.0,
  "logistics_reverse_rub": 150.0,
  "buyback_pct": 98.0,
  "advertising_pct": 5.0,
  "storage_rub": 50.0
}
```

**Request Body (Optional):**
```json
{
  "vat_pct": 20.0,
  "acquiring_pct": 1.8,
  "commission_pct": 10.0,
  "overrides": {
    "commission_pct": 15.0,
    "nm_id": 123456
  }
}
```

**Response:**
```json
{
  "meta": { "cabinet_id": "uuid", "calculated_at": "2026-01-16T12:00:00Z" },
  "result": {
    "recommended_price": 4057.87,
    "target_margin_pct": 20.0,
    "actual_margin_rub": 811.57,
    "actual_margin_pct": 20.0
  },
  "cost_breakdown": {
    "fixed_costs": { "cogs": 1500.00, "logistics_total": 203.00, "storage": 50.00, "fixed_total": 1753.00 },
    "percentage_costs": { "commission_wb": 405.79, "acquiring": 73.04, "advertising": 202.89, "vat": 811.57, "margin": 811.57 }
  },
  "intermediate_values": {
    "buyback_rate_pct": 98.0,
    "return_rate_pct": 2.0,
    "logistics_effective": 203.00,
    "total_percentage_rate": 56.8
  },
  "warnings": []
}
```

---

## UI Requirements

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar                                                          │
├─────────────────────────────────────────────────────────────────┤
│  Tools > Price Calculator                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐  │
│  │   Input Form        │  │   Results Card                  │  │
│  │                     │  │                                 │  │
│  │  [Target Margin %]  │  │   Recommended Price: 4,057.87 ₽ │  │
│  │  [COGS ₽]           │  │                                 │  │
│  │  [Logistics Fwd ₽]  │  │   Margin: 811.57 ₽ (20.0%)      │  │
│  │  [Logistics Rev ₽]  │  │                                 │  │
│  │  [Buyback %]        │  │   [Calculate] [Reset] [Save]    │  │
│  │  [Advertising %]    │  │                                 │  │
│  │  [Storage ₽]        │  └─────────────────────────────────┘  │
│  │                     │                                        │
│  │  [Advanced ▼]       │  ┌─────────────────────────────────┐  │
│  │                     │  │   Cost Breakdown                 │  │
│  │  [VAT %]            │  │                                 │  │
│  │  [Acquiring %]      │  │   Fixed Costs: 1,753.00 ₽       │  │
│  │  [Commission %]     │  │   • COGS: 1,500.00 ₽            │  │
│  │                     │  │   • Logistics: 203.00 ₽         │  │
│  │  [Override ▼]       │  │   • Storage: 50.00 ₽            │  │
│  │  • Commission %     │  │                                 │  │
│  │  • Product ID (nm)  │  │   Percentage Costs: 2,304.86 ₽  │  │
│  │                     │  │   • WB Commission: 405.79 ₽     │  │
│  └─────────────────────┘  │   • Acquiring: 73.04 ₽         │  │
│                           │   • Advertising: 202.89 ₽       │  │
│                           │   • VAT: 811.57 ₽               │  │
│                           │   • Margin: 811.57 ₽            │  │
│                           └─────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │   Visual Breakdown (Stacked Bar Chart)                    │  │
│  │   [COGS][Logistics][Storage][Comm][Acq][Adv][VAT][Margin] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Input Fields

| Field | Type | Required | Default | Validation |
|-------|------|----------|---------|------------|
| Target Margin % | number + slider | ✅ | 20 | 0-100 |
| COGS (₽) | number | ✅ | - | ≥0 |
| Logistics Forward (₽) | number | ✅ | - | ≥0 |
| Logistics Reverse (₽) | number | ✅ | - | ≥0 |
| Buyback (%) | number + slider | ✅ | 98 | 0-100 |
| Advertising (%) | number + slider | ✅ | 5 | 0-100 |
| Storage (₽) | number | ✅ | 0 | ≥0 |
| VAT (%) | select | ❌ | 20 | 0, 10, 20 |
| Acquiring (%) | number | ❌ | 1.8 | 0-100 |
| Commission (%) | number | ❌ | 10 | 0-100 |

### Real-time Calculation

- Calculate on input change with debouncing (500ms)
- Show loading state during API call
- Display error if validation fails
- Show warning if backend returns warnings

### Visual Breakdown

- Stacked bar chart showing cost composition
- Color-coded sections (COGS, Logistics, WB Commission, VAT, Margin, etc.)
- Hover tooltips with exact amounts
- Responsive for mobile/tablet

---

## Stories Breakdown

### Story 44.1: TypeScript Types & API Client
**Priority:** P0 | **Points:** 2
- Create TypeScript types for request/response DTOs
- Create API client hook `usePriceCalculator()`
- Error handling integration

### Story 44.2: Input Form Component
**Priority:** P0 | **Points:** 3
- Create `PriceCalculatorForm` component
- All input fields with validation
- Advanced options collapsible section
- Commission override options

### Story 44.3: Results Display Component
**Priority:** P0 | **Points:** 3
- Create `PriceCalculatorResults` component
- Recommended price display (large, prominent)
- Margin display with color coding
- Cost breakdown table/list
- Visual breakdown chart

### Story 44.4: Page Layout & Integration
**Priority:** P0 | **Points:** 2
- Create `/tools/price-calculator` page
- Integrate form and results components
- Navbar navigation
- Responsive layout

### Story 44.5: Real-time Calculation & UX
**Priority:** P1 | **Points:** 2
- Implement debounced calculation
- Loading states
- Error handling with user-friendly messages
- Warning display from backend
- Reset button functionality

### Story 44.6: Testing & Documentation
**Priority:** P1 | **Points:** 2
- Unit tests for components
- Integration test for API client
- E2E test for full flow
- Update documentation

**Phase 1 Estimate:** 14 Story Points

---

## Phase 2: Visual Enhancement Stories

После завершения базовой функциональности (Stories 44.1-44.6), проводится визуальный polish для улучшения UX.

**Depends On:** Story 44.20 (Two-Level Pricing Display - Complete)

### Visual Enhancement Stories Table

| Story ID | Title | Status | SP | Priority | Depends On |
|----------|-------|--------|----|:--------:|------------|
| 44.21-FE | Card Elevation System & Shadow Hierarchy | 📋 Ready for Dev | 2 | P0 | 44.20 |
| 44.22-FE | Hero Price Display Enhancement | 📋 Ready for Dev | 2 | P0 | 44.20 |
| 44.23-FE | Form Card Visual Upgrade | 📋 Ready for Dev | 3 | P0 | 44.20 |
| 44.24-FE | Enhanced Slider with Visual Zones | 📋 Ready for Dev | 2 | P1 | 44.20 |
| 44.25-FE | Loading States & Micro-interactions | 📋 Ready for Dev | 3 | P1 | 44.20 |

**Phase 2 Estimate:** 12 Story Points

### Story 44.21-FE: Card Elevation System & Shadow Hierarchy
**Priority:** P0 | **Points:** 2
- Define elevation levels (0-3) with shadow hierarchy
- Apply shadows to form, results, and breakdown cards
- Add hover transitions and mobile responsiveness
- Ensure WCAG 2.1 AA compliance

### Story 44.22-FE: Hero Price Display Enhancement
**Priority:** P0 | **Points:** 2
- Enhanced gradient background and shadow for recommended price
- Larger font size with drop-shadow
- Price gap indicator with colored backgrounds and icons
- Visual hierarchy reinforcement (min/recommended/customer)

### Story 44.23-FE: Form Card Visual Upgrade
**Priority:** P0 | **Points:** 3
- Enhanced card header with icon and primary border
- Section grouping with colored backgrounds (target, fixed, percentage, tax)
- Input field focus enhancements
- Action buttons with gradient and icons

### Story 44.24-FE: Enhanced Slider with Visual Zones
**Priority:** P1 | **Points:** 2
- Visual zone overlay (low/medium/high margin zones)
- Dynamic track color based on value
- Zone labels and colored value badge
- Keyboard accessible with zone announcements

### Story 44.25-FE: Loading States & Micro-interactions
**Priority:** P1 | **Points:** 3
- Skeleton loader with progress indicator
- Value transition animations (count up/down)
- Copy button success animation
- Hover and focus micro-interactions
- `prefers-reduced-motion` support

---

## Phase 3: Warehouse & Coefficients Integration

**Status:** 🚧 IN PROGRESS
**Критичность:** P0 - Без этого расчёт цены неточный

Интеграция выбора склада и коэффициентов для логистики/хранения.

### Бизнес-логика коэффициентов

1. **Базовая ставка** - единая для всех складов (backend знает)
2. **Коэффициент склада** - повышающий/понижающий множитель (100 = 1.0, 125 = 1.25)
3. **Итоговая ставка** = Базовая × Коэффициент
4. **Применяется к**:
   - Хранение (только ФБО)
   - Логистика доставки (ФБО и ФБС)
   - Логистика возврата (ФБО и ФБС)

### Phase 3 Stories

| Story ID | Title | Status | SP | Priority | Depends On |
|----------|-------|--------|----|:--------:|------------|
| 44.12-FE | Warehouse Selection Dropdown | ✅ Complete | 3 | P0 | Backend #98 |
| 44.13-FE | Auto-fill Coefficients | ✅ Complete | 3 | P1 | 44.12 |
| 44.9-FE | Logistics Coefficients UI | ✅ Complete | 2 | P1 | 44.12 |
| 44.14-FE | Storage Cost Calculation | ✅ Complete | 2 | P1 | 44.12, 44.7 |
| **44.27-FE** | **Warehouse & Coefficients Integration** | **📋 Ready for Dev** | **2** | **P0** | **44.12, 44.13** |

**Phase 3 Total:** 12 Story Points

### Story 44.27-FE: Warehouse & Coefficients Integration (NEW - CRITICAL)
**Priority:** P0 | **Points:** 2

**Проблема:** Компоненты `WarehouseSection`, `WarehouseSelect`, `CoefficientField` созданы, но **НЕ ИНТЕГРИРОВАНЫ** в `PriceCalculatorForm.tsx`.

**Задачи:**
- Добавить `WarehouseSection` в форму калькулятора
- Связать выбор склада с получением коэффициентов
- Передать коэффициенты в API запрос
- Показать хранение только для FBO

**Детальная спецификация:** `docs/stories/epic-44/story-44.27-fe-warehouse-integration.md`

---

## Phase 4: Bug Fixes & User Feedback

| Story ID | Title | Status | SP | Priority | Depends On |
|----------|-------|--------|----|:--------:|------------|
| 44.28-FE | Logistics Field Naming Fix | 📋 Ready for Dev | 1 | P1 | None |

### Story 44.28-FE: Logistics Field Naming Fix
**Priority:** P1 | **Points:** 1
- Fix incorrect "Логистика до склада" label → "Логистика к клиенту"
- Update tooltips to clarify WB → customer delivery direction
- User feedback: labels should match WB terminology
- No API changes required (cosmetic fix only)

---

**Total Estimate (Phase 1 + Phase 2 + Phase 3 + Phase 4):** 39 Story Points

---

## Dependencies

- **Epic 43** ✅ Complete - Backend Price Calculator API
- **Epic 1** ✅ Complete - Authentication
- **Epic 12** ✅ Complete - Products API

---

## Non-Goals (MVP)

- ❌ Batch calculation for multiple products (Phase 2)
- ❌ Save/load calculation presets (Phase 2)
- ❌ History of calculations (Phase 2)
- ❌ Integration with product card creation flow (Phase 2)
- ❌ "Apply to product" button (Phase 2)

---

## Success Criteria

1. User can input all required parameters
2. API call returns recommended price within 2 seconds
3. User sees complete breakdown of costs
4. Visual chart shows cost composition clearly
5. Errors are handled with clear messages
6. WCAG 2.1 AA accessibility compliance

---

## Open Questions

| Question | Status |
|----------|--------|
| Page location in navigation | TODO: Confirm with UX |
| Integration with existing COGS data | TODO: Phase 2 consideration |
| Save calculation functionality | TODO: Confirm requirements |

---

**Next Steps:**
1. ✅ Backend API complete (Epic 43)
2. ⏳ Create detailed Story files
3. ⏳ UX Design review (if needed)
4. ⏳ Begin implementation
