# Epic 44: Price Calculator UI (Frontend)

**Status**: 🚧 **IN PROGRESS**
**Backend Dependency**: Epic 43 ✅ Complete
**Total Stories**: 20
**Total Estimate**: 44 Story Points
**Completed (Phase 1)**: 2026-01-17
**Phase 2**: Enhanced Logistics Calculation (4 stories)
**Phase 3**: Warehouse, Storage & Tariffs Integration (3 stories, blocked)
**Phase 4**: V2 Enhancements (6 stories - NEW)

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

## Stories

| Story | Title | Priority | Points | Status |
|-------|-------|----------|--------|--------|
| **Phase 1: Core Calculator** |||||
| 44.1 | [TypeScript Types & API Client](./story-44.1-fe-types-api-client.md) | P0 | 2 | ✅ Complete |
| 44.2 | [Input Form Component](./story-44.2-fe-input-form-component.md) | P0 | 3 | ✅ Complete |
| 44.3 | [Results Display Component](./story-44.3-fe-results-display-component.md) | P0 | 3 | ✅ Complete |
| 44.4 | [Page Layout & Integration](./story-44.4-fe-page-layout-integration.md) | P0 | 2 | ✅ Complete |
| 44.5 | [Real-time Calculation & UX](./story-44.5-fe-realtime-calculation-ux.md) | P1 | 2 | ✅ Complete |
| 44.6 | [Testing & Documentation](./story-44.6-fe-testing-documentation.md) | P1 | 2 | ✅ Complete |
| **Phase 2: Enhanced Logistics** |||||
| 44.7 | [Dimension-Based Volume Calculation](./story-44.7-fe-dimension-volume-calculation.md) | P1 | 2 | 📋 Ready for Dev |
| 44.8 | [Logistics Tariff Calculation](./story-44.8-fe-logistics-tariff-calculation.md) | P1 | 2 | 📋 Ready for Dev |
| 44.9 | [Logistics Coefficients UI](./story-44.9-fe-logistics-coefficients-ui.md) | P1 | 2 | 📋 Ready for Dev |
| 44.10 | [Return Logistics Calculation](./story-44.10-fe-return-logistics-calculation.md) | P1 | 2 | 📋 Ready for Dev |
| **Phase 3: Warehouse & Tariffs** |||||
| 44.12 | [Warehouse Selection Dropdown](./story-44.12-fe-warehouse-selection.md) | P1 | 2 | 🔒 Blocked |
| 44.13 | [Auto-fill Coefficients from Warehouse](./story-44.13-fe-auto-fill-coefficients.md) | P1 | 3 | 🔒 Blocked |
| 44.14 | [Storage Cost Calculation](./story-44.14-fe-storage-cost-calculation.md) | P1 | 2 | 🔒 Blocked |
| **Phase 4: V2 Enhancements (NEW)** |||||
| 44.15 | [FBO/FBS Fulfillment Type Selection](./story-44.15-fe-fulfillment-type-selection.md) | P0 | 2 | 📋 Ready for Dev |
| 44.16 | [Category Selection with Search](./story-44.16-fe-category-selection.md) | P0 | 3 | 📋 Ready for Dev |
| 44.17 | [Tax Configuration (Rate + Type)](./story-44.17-fe-tax-configuration.md) | P1 | 2 | 📋 Ready for Dev |
| 44.18 | [DRR Input (Advertising %)](./story-44.18-fe-drr-input.md) | P1 | 1 | 📋 Ready for Dev |
| 44.19 | [SPP Display (Customer Price)](./story-44.19-fe-spp-display.md) | P2 | 1 | 📋 Ready for Dev |
| 44.20 | [Two-Level Pricing Display](./story-44.20-fe-two-level-pricing-display.md) | P0 | 3 | 📋 Ready for Dev |

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

### Phase 4 Dependencies

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

| Phase | Stories | Status |
|-------|---------|--------|
| **Phase 1: Core Calculator** ||
| Foundation | 44.1 | ✅ |
| Components | 44.2, 44.3 | ✅ |
| Integration | 44.4 | ✅ |
| Polish | 44.5 | ✅ |
| Quality | 44.6 | ✅ |
| **Phase 2: Enhanced Logistics** ||
| Dimensions | 44.7 | 📋 |
| Tariffs | 44.8 | 📋 |
| Coefficients | 44.9 | 📋 |
| Returns | 44.10 | 📋 |
| **Phase 3: Warehouse & Tariffs** ||
| Warehouse Selection | 44.12 | 🔒 |
| Auto-fill Coefficients | 44.13 | 🔒 |
| Storage Calculation | 44.14 | 🔒 |
| **Phase 4: V2 Enhancements** ||
| FBO/FBS Selection | 44.15 | 📋 |
| Category Selection | 44.16 | 📋 |
| Tax Configuration | 44.17 | 📋 |
| DRR Input | 44.18 | 📋 |
| SPP Display | 44.19 | 📋 |
| Two-Level Pricing | 44.20 | 📋 |

**Phase 1 Progress**: 6/6 stories (100%) ✅
**Phase 2 Progress**: 0/4 stories (0%) 📋
**Phase 3 Progress**: 0/3 stories (0%) 🔒 (Blocked by Request #98)
**Phase 4 Progress**: 0/6 stories (0%) 📋
**Overall Progress**: 6/20 stories (30%)

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

| Phase | Stories | Total SP |
|-------|---------|----------|
| Phase 1 | 6 | 14 SP |
| Phase 2 | 4 | 8 SP |
| Phase 3 | 3 | 7 SP |
| Phase 4 | 6 | 12 SP |
| **Total** | **20** | **41 SP** |

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
Request #98 (Backend API) ← Blocked (Pending Backend Response)
    ↓
Story 44.12 (Warehouse Selection) ← Request #98
    ↓
Story 44.13 (Auto-fill Coefficients) ← Story 44.12
    ↓
Story 44.14 (Storage Cost Calculation) ← Story 44.13 + Story 44.7 (Volume)
```

**Backend Request**: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`

---

## API Endpoints Required (Phase 4)

| Endpoint | Purpose | Rate Limit | Cache |
|----------|---------|------------|-------|
| `GET /v1/tariffs/commissions` | Category commissions (7346) | 10/min | 24h |
| `GET /v1/tariffs/warehouses` | Warehouse list (~50) | 10/min | 24h |
| `GET /v1/tariffs/acceptance/coefficients` | Coefficients (14 days) | **6/min** | 1h |
| `POST /v1/products/price-calculator` | Price calculation | 600/min | None |

See `PRICE-CALCULATOR-REQUIREMENTS.md` Section 4 for complete API reference.

---

## Future Enhancements (Out of Scope)

| Feature | Description | Priority |
|---------|-------------|----------|
| Pallet tariffs (КГТ) | Support for large items | Phase 5 |
| DBS/EDBS fulfillment | Delivery by seller modes | Phase 5 |
| Batch calculation | Multiple products at once | Phase 5 |
| Presets | Save common configurations | Phase 5 |
| Calculation history | Track past calculations | Phase 5 |
| Auto-detect category | From existing products | Phase 5 |

---

**Last Updated**: 2026-01-20
