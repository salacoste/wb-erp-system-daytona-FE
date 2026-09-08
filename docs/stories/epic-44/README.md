# Epic 44: Price Calculator UI (Frontend)

**Status**: ✅ **COMPLETE** (All 32 Stories Done)
**Backend Dependency**: Epic 43 ✅ Complete
**Total Stories**: 32
**Total Estimate**: 81 Story Points
**Phase 1 Completed**: 2026-01-17 (Core Calculator)
**Phase 2 Completed**: 2026-01-22 (Enhanced Logistics)
**Phase 3 Completed**: 2026-01-23 (Warehouse & Tariffs)
**Phase 4 Completed**: 2026-01-23 (V2 Enhancements)
**Phase 5 Completed**: 2026-01-23 (Bug Fixes & Improvements)
**Phase 6 Completed**: 2026-01-27 (Two Tariff Systems & Enhancements)

---

## Overview

Frontend UI for the Price Calculator API (Epic 43). Enables sellers to calculate optimal selling prices based on target margin with full cost breakdown visualization.

### Requirements Reference

**NEW**: See [`PRICE-CALCULATOR-REQUIREMENTS.md`](./PRICE-CALCULATOR-REQUIREMENTS.md) for complete V2 requirements including:

- FBO/FBS fulfillment type selection
- Category-based commission lookup (7346 categories)
- Tax configuration (income vs profit tax)
- DRR (advertising percentage) input
- SPP (customer discount) display
- Two-level pricing (minimum + recommended)

---

## Backend Requirements (2026-01-24)

Updated backend business rules from the tariff calculation API. Critical for price calculator accuracy.

### Storage Cost Rules

**60 Days Free Storage**

- WB offers 60 days of free storage before charging
- Formula: `storage_rub = daily_cost × max(0, turnover_days - 60)`
- Only charges if product sits longer than 60 days

**Daily Storage Cost Calculation**

```
daily_cost = (base + (vol - 1) × liter_price) × coefficient
```

Where:

- `base` = base storage rate (₽)
- `vol` = volume in liters
- `liter_price` = additional rate per liter
- `coefficient` = regional/seasonal adjustment factor

**Storage Billing Example**

- Turnover days = 30 → No charge (30 < 60)
- Turnover days = 90 → Charged for 30 days (90 - 60 = 30)
- Turnover days = 180 → Charged for 120 days (180 - 60 = 120)

### Logistics Cost Rules

**Forward Logistics (Доставка до склада)**

- **Auto-fill allowed** ✅ when:
  - Warehouse selected
  - Product volume/dimensions provided
  - Cargo type determined
- Uses tariff coefficients from selected warehouse
- Formula: `forward_cost = base_rate × coefficient`

**Reverse Logistics (Обратная логистика)**

- **MANUAL ONLY** ❌ Never auto-fill
- User must manually input reverse logistics cost
- Affected by buyback percentage
- Formula: `reverse_cost = reverse_rate × (1 - buyback_pct/100)`
- **Example**: 50 ₽ reverse with 10% buyback = 50 × (1 - 10/100) = 45 ₽

**Buyback Percentage Adjustment**

- Applied only to reverse logistics costs
- Reduces the reverse cost proportionally
- Input range: 0-100%
- If buyback = 0%, reverse cost = 100%
- If buyback = 50%, reverse cost = 50%

### Cargo Type Classification

**MGT (Мелкогабаритный товар)** - Small items

- Max dimension: ≤60 cm
- Auto-filled from dimension inputs
- Standard warehouse rates apply

**SGT (Среднегабаритный товар)** - Medium items

- Max dimension: ≤120 cm (but >60 cm)
- Auto-filled from dimension inputs
- Standard warehouse rates apply

**KGT (Крупногабаритный товар)** - Large items

- Max dimension: >120 cm
- **ERROR**: Should not proceed to calculation
- **UI Behavior**: Show error message, block form submission
- **Note**: KGT requires special handling (pallet tariffs) - out of scope for Phase 5

**Auto-fill Indicators**

| Field        | Forward | Reverse   | Condition                       |
| ------------ | ------- | --------- | ------------------------------- |
| Cargo Type   | ✅ Auto | ❌ Manual | Determined from dimensions      |
| Forward Cost | ✅ Auto | N/A       | Warehouse + volume + cargo type |
| Reverse Cost | N/A     | ❌ Manual | User input only                 |
| Buyback %    | N/A     | ✅ Auto   | From warehouse or tariff config |

---

## Stories

| Story                                          | Title                                                                                                  | Priority | Points | Status          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------- | ------ | --------------- |
| **Phase 1: Core Calculator**                   |                                                                                                        |          |        |                 |
| 44.1                                           | [TypeScript Types & API Client](./story-44.1-fe-types-api-client.md)                                   | P0       | 2      | ✅ Complete     |
| 44.2                                           | [Input Form Component](./story-44.2-fe-input-form-component.md)                                        | P0       | 3      | ✅ Complete     |
| 44.3                                           | [Results Display Component](./story-44.3-fe-results-display-component.md)                              | P0       | 3      | ✅ Complete     |
| 44.4                                           | [Page Layout & Integration](./story-44.4-fe-page-layout-integration.md)                                | P0       | 2      | ✅ Complete     |
| 44.5                                           | [Real-time Calculation & UX](./story-44.5-fe-realtime-calculation-ux.md)                               | P1       | 2      | ✅ Complete     |
| 44.6                                           | [Testing & Documentation](./story-44.6-fe-testing-documentation.md)                                    | P1       | 2      | ✅ Complete     |
| **Phase 2: Enhanced Logistics**                |                                                                                                        |          |        |                 |
| 44.7                                           | [Dimension-Based Volume Calculation](./story-44.7-fe-dimension-volume-calculation.md)                  | P1       | 2      | ✅ Complete     |
| 44.8                                           | [Logistics Tariff Calculation](./story-44.8-fe-logistics-tariff-calculation.md)                        | P1       | 2      | ✅ Complete     |
| 44.9                                           | [Logistics Coefficients UI](./story-44.9-fe-logistics-coefficients-ui.md)                              | P1       | 2      | ✅ Complete     |
| 44.10                                          | [Return Logistics Calculation](./story-44.10-fe-return-logistics-calculation.md)                       | P1       | 2      | ✅ Complete     |
| **Phase 3: Warehouse & Tariffs**               |                                                                                                        |          |        |                 |
| 44.12                                          | [Warehouse Selection Dropdown](./story-44.12-fe-warehouse-selection.md)                                | P0       | 3      | ✅ Complete     |
| 44.13                                          | [Auto-fill Coefficients from Warehouse](./story-44.13-fe-auto-fill-coefficients.md)                    | P1       | 3      | ✅ Complete     |
| 44.9                                           | [Logistics Coefficients UI](./story-44.9-fe-logistics-coefficients-ui.md)                              | P1       | 2      | ✅ Complete     |
| 44.14                                          | [Storage Cost Calculation](./story-44.14-fe-storage-cost-calculation.md)                               | P1       | 2      | ✅ Complete     |
| **44.27**                                      | **[Warehouse & Coefficients Integration](./story-44.27-fe-warehouse-integration.md)**                  | **P0**   | **2**  | **✅ Complete** |
| **Phase 4: V2 Enhancements**                   |                                                                                                        |          |        |                 |
| 44.15                                          | [FBO/FBS Fulfillment Type Selection](./story-44.15-fe-fulfillment-type-selection.md)                   | P0       | 2      | ✅ Complete     |
| 44.16                                          | [Category Selection with Search](./story-44.16-fe-category-selection.md)                               | P0       | 3      | ✅ Complete     |
| 44.17                                          | [Tax Configuration (Rate + Type)](./story-44.17-fe-tax-configuration.md)                               | P1       | 2      | ✅ Complete     |
| 44.18                                          | [DRR Input (Advertising %)](./story-44.18-fe-drr-input.md)                                             | P1       | 1      | ✅ Complete     |
| 44.19                                          | [SPP Display (Customer Price)](./story-44.19-fe-spp-display.md)                                        | P2       | 1      | ✅ Complete     |
| 44.20                                          | [Two-Level Pricing Display](./story-44.20-fe-two-level-pricing-display.md)                             | P0       | 3      | ✅ Complete     |
| **Phase 5: Bug Fixes & Improvements**          |                                                                                                        |          |        |                 |
| 44.32                                          | [Missing Price Calculator Fields - Phase 1 HIGH](./story-44.32-fe-missing-price-calc-fields.md)        | P0       | 5      | ✅ Complete     |
| 44.33                                          | [Frontend Type Mismatch & Field Name Fixes](./story-44.33-fe-type-mismatch-field-names.md)             | P1       | 2      | ✅ Complete     |
| 44.34                                          | [Debounce Warehouse Selection & Rate Limit Handling](./story-44.34-fe-debounce-warehouse-selection.md) | P1       | 2      | ✅ Complete     |
| 44.35                                          | [FBO/FBS Toggle Crashes Application](./story-44.35-fe-fbo-fbs-toggle-crash.md)                         | **P0**   | **3**  | **✅ Complete** |
| 44.36                                          | [API Field Mismatch - box_type, turnover_days](./story-44.36-fe-api-field-mismatch.md)                 | **P0**   | **2**  | **✅ Complete** |
| 44.37                                          | [API Field Mismatch - Warehouse & Additional Fields](./story-44.37-fe-api-field-mismatch-warehouse.md) | **P0**   | **2**  | **✅ Complete** |
| 44.38                                          | [Units Per Package - Acceptance Cost Division](./story-44.38-fe-units-per-package.md)                  | **P1**   | **3**  | **✅ Complete** |
| **Phase 6: Two Tariff Systems & Enhancements** |                                                                                                        |          |        |                 |
| **44.40**                                      | **[Two Tariff Systems Integration](./story-44.40-fe-two-tariff-systems-integration.md)**               | **P0**   | **5**  | **✅ Complete** |
| **44.41**                                      | **[Storage Tariff Zero Bug Fix](./story-44.41-fe-storage-tariff-fix.md)**                              | **P0**   | **3**  | **✅ Complete** |
| **44.42**                                      | **[Box Type Selection Support](./story-44.42-fe-box-type-support.md)**                                 | **P1**   | **5**  | **✅ Complete** |
| **44.43**                                      | **[Acceptance Coefficient Status Badge](./story-44.43-fe-acceptance-coefficient-badge.md)**            | **P2**   | **2**  | **✅ Complete** |
| **44.44**                                      | **[Preset Save/Load](./story-44.44-fe-preset-save-load.md)**                                           | **P2**   | **3**  | **✅ Complete** |

---

## Phase 6: Two Tariff Systems (NEW - 2026-01-26)

**CRITICAL DISCOVERY**: WB has TWO different tariff systems that serve different purposes:

| System        | Purpose              | API Endpoint                              | Use Case                              |
| ------------- | -------------------- | ----------------------------------------- | ------------------------------------- |
| **INVENTORY** | Current actual costs | `/v1/tariffs/warehouses-with-tariffs`     | Financial reports, TODAY calculations |
| **SUPPLY**    | 14-day planning      | `/v1/tariffs/acceptance/coefficients/all` | Future delivery planning, TOMORROW+   |

### Why This Matters

- When user selects a **FUTURE delivery date**, ALL tariffs (baseLiterRub, additionalLiterRub, coefficients) must come from **SUPPLY system**
- Supply tariffs are typically HIGHER than Inventory tariffs (conservative estimates)
- Without this fix, cost estimates for future deliveries are INACCURATE

### Stories Affected

- **Story 44.40-FE**: New integration story for two tariff systems
- **Story 44.26a-FE**: Updated with SUPPLY system requirements
- **Story 44.27-FE**: Updated with SUPPLY system requirements (AC8 pending)

### Reference

- `docs/request-backend/108-two-tariff-systems-guide.md`

---

## Phase 4: V2 Enhancements

New features based on `PRICE-CALCULATOR-REQUIREMENTS.md`:

### Key Features

1. **FBO/FBS Selection** (Story 44.15)
   - Toggle between fulfillment modes
   - Conditional fields (storage, acceptance for FBO only)
   - Commission rate changes by mode

2. **Category Selection** (Story 44.16)
   - Searchable combobox with 7346 categories
   - Auto-fill commission from selected category
   - Commission preview per fulfillment type

3. **Tax Configuration** (Story 44.17)
   - Tax rate + type (income vs profit)
   - Preset buttons for common regimes
   - Impact preview

4. **DRR Input** (Story 44.18)
   - Advertising percentage slider
   - Level indicators (low/moderate/high)
   - Advertising cost preview

5. **SPP Display** (Story 44.19)
   - Customer-facing price calculation
   - WB discount visualization

6. **Two-Level Pricing** (Story 44.20)
   - Minimum price (floor)
   - Recommended price (with margin + DRR)
   - Complete cost breakdown

### Phase 5: Bug Fixes & Improvements (NEW)

Critical fixes based on frontend integration guide and competitor analysis:

1. **Missing Price Calculator Fields** (Story 44.32) - P0 HIGH
   - Box type selection (Короб/Монопаллета)
   - Weight threshold >25kg checkbox
   - Localization index (КТР) input
   - Turnover days calculation
   - **Impact**: 5-15% calculation accuracy improvement

2. **Type Mismatch & Field Name Fixes** (Story 44.33) - P1 MEDIUM
   - Fix `nm_id` type: string (not number)
   - Fix product name: `sa_name` (not `title`)
   - Fix category: `category_hierarchy` (not `category`)
   - **Impact**: Eliminates runtime errors and undefined values

3. **Debounce Warehouse Selection** (Story 44.34) - P1 MEDIUM
   - 500ms debounce on warehouse changes
   - Rate limit error handling (6/min limit)
   - Cooldown UI with countdown timer
   - **Impact**: Prevents API rate limit errors

4. **FBO/FBS Toggle Crashes Application** (Story 44.35) - **P0 CRITICAL**
   - Application crashes when toggling between FBO/FBS fulfillment types
   - State management issue in form component
   - UI unresponsive after first toggle
   - **Impact**: Blocks all user interactions with fulfillment selection

5. **API Field Mismatch - box_type, turnover_days** (Story 44.36) - **P0 CRITICAL**
   - Form field `box_type` not properly mapped to API schema
   - Backend field mismatch for `turnover_days` calculation
   - Calculation returns incorrect cost breakdown
   - **Impact**: Inaccurate price calculations, failed form submissions

6. **API Field Mismatch - Warehouse & Additional Fields** (Story 44.37) - **P0 CRITICAL**
   - 6 unsupported fields sent in API request causing validation errors
   - Fields: `warehouse_id`, `logistics_coefficient`, `storage_coefficient`, `delivery_date`, `weight_exceeds_25kg`, `localization_index`
   - Removes redundant/unsupported fields, companion fix to Story 44.36
   - **Impact**: Form submission validation errors, API rejection

7. **Units Per Package - Acceptance Cost Division** (Story 44.38) - P1 HIGH
   - Box/pallet acceptance cost not divided by units per package
   - Shows cost per package instead of per product unit
   - Add input field for units count (1-1000)
   - **Impact**: 5-50% overstated acceptance costs, wrong pricing decisions

### Phase 5 Dependencies

```
Story 44.32 (Missing Fields) ← Story 44.2 (Form) + Story 44.15 (FBO/FBS) + Story 44.27 (Warehouse)
Story 44.33 (Type Fixes) ← Story 44.1 (Types) + Story 44.2 (Form)
Story 44.34 (Debounce) ← Story 44.12 (Warehouse) + Story 44.27 (Integration)
Story 44.35 (FBO/FBS Toggle Crash) ← Story 44.15 (FBO/FBS Selection) - BLOCKER for Phase 4
Story 44.36 (API Field Mismatch - box_type/turnover_days) ← Story 44.2 (Form) + Story 44.20 (Results) - BLOCKER for calculations
Story 44.37 (API Field Mismatch - warehouse/additional) ← Story 44.36 (companion fix) - BLOCKER for calculations
Story 44.38 (Units Per Package) ← Story 44.32 (BoxTypeSelector) - Enhancement for acceptance cost accuracy
```

**Priority**: Stories 44.35, 44.36, and 44.37 are **critical blockers** and must be resolved before full Phase 4 implementation can proceed.

### Phase 5 Context

**Source Documents**:

- `frontend/docs/request-backend/FRONTEND-INTEGRATION-GUIDE.md`
- `frontend/docs/stories/epic-44/PRICE-CALCULATOR-REQUIREMENTS.md` Section 14
- `frontend/docs/request-backend/99-products-dimensions-category-api.md`

**Gap Analysis**:

- 9 missing fields identified in competitor analysis
- 4 HIGH priority fields (Story 44.32)
- 3 type/field mismatches (Story 44.33)
- 1 rate limit confusion issue (Story 44.34)

---

## Phase 4 Dependencies

```
Story 44.15 (FBO/FBS) ← Story 44.2 (Form)
    ↓
Story 44.16 (Category) ← Story 44.15 + Backend API
    ↓
Story 44.17 (Tax) ← Story 44.2 (Form)
Story 44.18 (DRR) ← Story 44.2 (Form)
Story 44.19 (SPP) ← Story 44.3 (Results)
    ↓
Story 44.20 (Two-Level Pricing) ← All Phase 4 stories
```

---

## Definition of Ready (DoR)

All stories must meet these criteria before implementation:

- [x] User Story format (As a/I want/So that)
- [x] Numbered Acceptance Criteria (AC1-ACn)
- [x] Related documents linked (Epic, Backend API)
- [x] Implementation notes with file structure
- [x] Invariants & Edge Cases documented
- [x] Observability planned
- [x] Accessibility considered (WCAG 2.1 AA)
- [x] Non-goals specified

---

## Definition of Done (DoD)

Story is complete when:

- [ ] All Acceptance Criteria verified (100%)
- [ ] Components created/updated
- [ ] Tests written and passing (coverage ≥ 80%)
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] QA Gate passed (no blockers)
- [ ] Dev Agent Record filled

---

## Quick Links

- **Epic PRD**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend API Guide**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **Backend Epic**: `docs/epics/epic-43-price-calculator.md`
- **V2 Requirements**: [`PRICE-CALCULATOR-REQUIREMENTS.md`](./PRICE-CALCULATOR-REQUIREMENTS.md)

### Phase 3 Documentation

- **SDK Reference**: [`SDK-WAREHOUSES-TARIFFS-REFERENCE.md`](./SDK-WAREHOUSES-TARIFFS-REFERENCE.md)
- **Backend Request**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- **Backend Response Draft**: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`
- **Implementation Roadmap**: [`PHASE-3-IMPLEMENTATION-ROADMAP.md`](./PHASE-3-IMPLEMENTATION-ROADMAP.md)

---

## Progress Tracking

| Phase                                          | Stories    | Status |
| ---------------------------------------------- | ---------- | ------ |
| **Phase 1: Core Calculator**                   |            |
| Foundation                                     | 44.1       | ✅     |
| Components                                     | 44.2, 44.3 | ✅     |
| Integration                                    | 44.4       | ✅     |
| Polish                                         | 44.5       | ✅     |
| Quality                                        | 44.6       | ✅     |
| **Phase 2: Enhanced Logistics**                |            |
| Dimensions                                     | 44.7       | ✅     |
| Tariffs                                        | 44.8       | ✅     |
| Coefficients                                   | 44.9       | ✅     |
| Returns                                        | 44.10      | ✅     |
| **Phase 3: Warehouse & Tariffs**               |            |
| Warehouse Selection                            | 44.12      | ✅     |
| Auto-fill Coefficients                         | 44.13      | ✅     |
| Logistics Coefficients UI                      | 44.9       | ✅     |
| Storage Calculation                            | 44.14      | ✅     |
| Integration into Form                          | 44.27      | ✅     |
| **Phase 4: V2 Enhancements**                   |            |
| FBO/FBS Selection                              | 44.15      | ✅     |
| Category Selection                             | 44.16      | ✅     |
| Tax Configuration                              | 44.17      | ✅     |
| DRR Input                                      | 44.18      | ✅     |
| SPP Display                                    | 44.19      | ✅     |
| Two-Level Pricing                              | 44.20      | ✅     |
| **Phase 5: Bug Fixes & Improvements**          |            |
| Missing Price Calculator Fields                | 44.32      | ✅     |
| Type Mismatch & Field Name Fixes               | 44.33      | ✅     |
| Debounce Warehouse Selection                   | 44.34      | ✅     |
| FBO/FBS Toggle Crash Fix                       | 44.35      | ✅     |
| API Field Mismatch                             | 44.36      | ✅     |
| API Field Mismatch Warehouse                   | 44.37      | ✅     |
| Units Per Package                              | 44.38      | ✅     |
| **Phase 6: Two Tariff Systems & Enhancements** |            |
| Two Tariff Systems Integration                 | 44.40      | ✅     |
| Storage Tariff Zero Bug Fix                    | 44.41      | ✅     |
| Box Type Selection Support                     | 44.42      | ✅     |
| Acceptance Coefficient Badge                   | 44.43      | ✅     |
| Preset Save/Load                               | 44.44      | ✅     |

**Phase 1 Progress**: 6/6 stories (100%) ✅
**Phase 2 Progress**: 4/4 stories (100%) ✅
**Phase 3 Progress**: 5/5 stories (100%) ✅
**Phase 4 Progress**: 6/6 stories (100%) ✅
**Phase 5 Progress**: 7/7 stories (100%) ✅
**Phase 6 Progress**: 5/5 stories (100%) ✅
**Overall Progress**: 32/32 stories (100%) ✅

---

## Implementation Summary

**Completed**: 2026-01-17
**Test Coverage**: 15+ test files created
**Components Created**: 10 components in `/src/components/custom/price-calculator/`

**Files Created:**

- `/src/app/(dashboard)/cogs/price-calculator/page.tsx` - Main page
- `/src/components/custom/price-calculator/` - 10 components
- `/src/hooks/usePriceCalculator.ts` - API hook
- `/src/types/price-calculator.ts` - TypeScript types

**QA Verification:**

- All 6 stories QA reviewed 2026-01-17
- Accessibility (WCAG 2.1 AA) verified
- Responsive layout tested (mobile, tablet, desktop)

---

## Story Point Summary

| Phase     | Stories | Total SP  |
| --------- | ------- | --------- |
| Phase 1   | 6       | 14 SP     |
| Phase 2   | 4       | 8 SP      |
| Phase 3   | 5       | 9 SP      |
| Phase 4   | 6       | 12 SP     |
| Phase 5   | 7       | 19 SP     |
| Phase 6   | 5       | 18 SP     |
| **Total** | **32**  | **81 SP** |

**Phase 5 Breakdown**:

- Story 44.32 (Missing Fields): 5 SP
- Story 44.33 (Type Fixes): 2 SP
- Story 44.34 (Debounce): 2 SP
- Story 44.35 (FBO/FBS Toggle Crash): 3 SP ⚠️ **CRITICAL**
- Story 44.36 (API Field Mismatch - box_type/turnover_days): 2 SP ⚠️ **CRITICAL**
- Story 44.37 (API Field Mismatch - warehouse/additional): 2 SP ⚠️ **CRITICAL**
- Story 44.38 (Units Per Package): 3 SP

**Phase 6 Breakdown**:

- Story 44.40 (Two Tariff Systems Integration): 5 SP ⚠️ **CRITICAL**
- Story 44.41 (Storage Tariff Zero Bug Fix): 3 SP ⚠️ **CRITICAL**
- Story 44.42 (Box Type Selection Support): 5 SP
- Story 44.43 (Acceptance Coefficient Badge): 2 SP
- Story 44.44 (Preset Save/Load): 3 SP

---

## Notes

- This Epic is **frontend-only** — backend API is complete (Epic 43)
- ✅ Phase 1 complete: Core calculator (6 stories)
- 📋 Phase 2 ready: Enhanced logistics (4 stories)
- 🔒 Phase 3 blocked: Warehouse, Storage & Tariffs (Request #98)
- 📋 Phase 4 ready: V2 Enhancements (6 stories) - NEW
- Note: Story 44.11 skipped (renumbering from backend stories)
- ✅ UX Design reviewed and validated

---

## Phase 2 Dependencies

```
Story 44.7 (Dimensions) ← Story 44.2 (Form)
    ↓
Story 44.8 (Tariffs) ← Story 44.7 (Volume)
    ↓
Story 44.9 (Coefficients) ← Story 44.8 (Base Cost)
    ↓
Story 44.10 (Returns) ← Story 44.9 (КТР)
```

---

## Phase 3 Dependencies

```
Request #98 (Backend API) ← ✅ COMPLETE
    ↓
Story 44.12 (Warehouse Selection) ← ✅ COMPLETE
    ↓
Story 44.13 (Auto-fill Coefficients) ← ✅ COMPLETE
    ↓
Story 44.14 (Storage Cost Calculation) ← ✅ COMPLETE
    ↓
Story 44.27 (Integration into Form) ← 📋 READY FOR DEV
```

**Backend Request**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`

### Story 44.27: Critical Integration Task

**Проблема:** Компоненты созданы, но не интегрированы в форму калькулятора!

**Компоненты готовы:**

- `WarehouseSelect.tsx` - выбор склада
- `WarehouseSection.tsx` - секция с коэффициентами и хранением
- `CoefficientField.tsx` - поля коэффициентов
- `TurnoverDaysInput.tsx` - ввод оборачиваемости с расчётом хранения (Story 44.32)
- `useWarehouseCoefficients.ts` - hook для коэффициентов

> **Note (2026-01-24)**: `StorageCostCalculator.tsx`, `StorageDaysInput.tsx`, and `StorageCostBreakdown.tsx`
> were NOT created. Storage calculation is handled by `TurnoverDaysInput.tsx` using the formula:
> `storage_rub = dailyStorageCost × turnover_days`

**Интеграция выполнена (Story 44.27):**

- ✅ `WarehouseSection` добавлен в `PriceCalculatorForm.tsx`
- ✅ Выбор склада связан с API запросом
- ✅ Коэффициенты передаются в расчёт цены

---

## API Endpoints Required (Phase 4)

| Endpoint                                  | Purpose                     | Rate Limit | Cache |
| ----------------------------------------- | --------------------------- | ---------- | ----- |
| `GET /v1/tariffs/commissions`             | Category commissions (7346) | 10/min     | 24h   |
| `GET /v1/tariffs/warehouses`              | Warehouse list (~50)        | 10/min     | 24h   |
| `GET /v1/tariffs/acceptance/coefficients` | Coefficients (14 days)      | **6/min**  | 1h    |
| `POST /v1/products/price-calculator`      | Price calculation           | 600/min    | None  |

See `PRICE-CALCULATOR-REQUIREMENTS.md` Section 4 for complete API reference.

---

## Future Enhancements (Out of Scope)

| Feature              | Description                  | Priority |
| -------------------- | ---------------------------- | -------- |
| Pallet tariffs (КГТ) | Support for large items      | Phase 7  |
| DBS/EDBS fulfillment | Delivery by seller modes     | Phase 7  |
| Batch calculation    | Multiple products at once    | Phase 7  |
| Calculation history  | Track past calculations      | Phase 7  |
| Auto-detect category | From existing products       | Phase 7  |
| Multiple presets     | Save multiple configurations | Phase 7  |

---

**Last Updated**: 2026-01-27
**Epic Status**: ✅ **COMPLETE** (32/32 stories, 100%)
**Phase 2-5 Completed**: 2026-01-23 (All stories complete)
**Phase 6 Completed**: 2026-01-27 (Two Tariff Systems & Enhancements)
