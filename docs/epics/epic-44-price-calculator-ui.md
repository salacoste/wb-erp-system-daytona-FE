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

**Total Estimate:** 14 Story Points

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
