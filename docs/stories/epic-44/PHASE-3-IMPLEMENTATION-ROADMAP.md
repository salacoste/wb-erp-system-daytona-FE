# Phase 3 Implementation Roadmap: Warehouse, Storage & Tariffs

**Epic**: 44-FE (Price Calculator UI)
**Phase**: 3 - Warehouse, Storage & Tariffs Integration
**Stories**: 44.12, 44.13, 44.14
**Created**: 2026-01-19
**Status**: 🔒 Blocked (Pending Backend API)

---

## Executive Summary

Phase 3 расширяет Price Calculator интеграцией с реальными данными складов и тарифов WB. Это позволит селлерам автоматически рассчитывать логистику и хранение на основе выбранного склада.

**Blocker**: Backend API endpoint `GET /v1/tariffs/warehouses-with-tariffs` не реализован (Request #98).

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PHASE 3 TIMELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BACKEND                                                                    │
│  ├── [1] Review Request #98 & Response Draft ............ ⏳ Pending       │
│  ├── [2] Implement WarehousesTariffsService ............. ⏳ ~4h           │
│  ├── [3] Implement TariffsController .................... ⏳ ~2h           │
│  ├── [4] Add Redis Caching .............................. ⏳ ~2h           │
│  ├── [5] Write E2E Tests ................................ ⏳ ~3h           │
│  └── [6] Documentation .................................. ⏳ ~1h           │
│                                                                             │
│  FRONTEND (After Backend)                                                   │
│  ├── [7] Story 44.12: Warehouse Selector ................ 📋 ~2h          │
│  ├── [8] Story 44.13: Auto-fill Coefficients ............ 📋 ~3h          │
│  └── [9] Story 44.14: Storage Calculation ............... 📋 ~2h          │
│                                                                             │
│  QA & POLISH                                                                │
│  ├── [10] Integration Testing ........................... 📋 ~2h          │
│  └── [11] Documentation Update .......................... 📋 ~1h          │
│                                                                             │
│  TOTAL ESTIMATE: ~22h (Backend: 12h, Frontend: 7h, QA: 3h)                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3.1: Backend Implementation

### Task 1: Review & Approve API Contract

**Owner**: Backend Team
**Status**: ⏳ Pending
**Documents**:

- Request: `docs/request-backend/98-warehouses-tariffs-coefficients-api.md`
- Response Draft: `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md`

**Action Items**:

- [ ] Review proposed API contract
- [ ] Answer open questions (see Section 8 in Response Draft)
- [ ] Confirm endpoint structure: `GET /v1/tariffs/warehouses-with-tariffs`

### Task 2: Implement WarehousesTariffsService

**Owner**: Backend Team
**Estimate**: 4h
**File**: `src/tariffs/warehouses-tariffs.service.ts`

**Responsibilities**:

```typescript
@Injectable()
export class WarehousesTariffsService {
  // 1. Fetch offices from WB SDK
  async getOffices(): Promise<Office[]>;

  // 2. Fetch box tariffs from WB SDK
  async getBoxTariffs(date: string): Promise<ModelsWarehouseBoxRates[]>;

  // 3. Match offices to tariffs
  matchWarehouseToTariff(office: Office, tariffs: ModelsWarehouseBoxRates[]): ModelsWarehouseBoxRates | null;

  // 4. Transform SDK types to API response
  transformToResponse(office: Office, tariff: ModelsWarehouseBoxRates | null): WarehouseWithTariffs;

  // 5. Aggregate all data
  async getWarehousesWithTariffs(date?: string): Promise<WarehousesResponse>;
}
```

**Critical Transformations**:

| From SDK       | To API  | Transform      |
| -------------- | ------- | -------------- |
| `"46"`         | `46.0`  | `parseFloat()` |
| `"125"` (coef) | `1.25`  | `÷ 100`        |
| `cargoType: 1` | `"MGT"` | mapping        |

### Task 3: Implement TariffsController

**Owner**: Backend Team
**Estimate**: 2h
**File**: `src/tariffs/tariffs.controller.ts`

**Endpoint**:

```typescript
@Controller('v1/tariffs')
export class TariffsController {
  @Get('warehouses-with-tariffs')
  @UseGuards(JwtAuthGuard, CabinetGuard)
  async getWarehousesWithTariffs(
    @Query('date') date?: string,
    @Query('cargo_type') cargoType?: 'MGT' | 'SGT' | 'KGT',
    @Query('refresh') refresh?: boolean,
  ): Promise<WarehousesResponse>;
}
```

### Task 4: Add Redis Caching

**Owner**: Backend Team
**Estimate**: 2h

**Strategy**:

| Data       | TTL | Key Pattern                             |
| ---------- | --- | --------------------------------------- |
| Offices    | 24h | `tariffs:offices:{cabinetId}`           |
| BoxTariffs | 1h  | `tariffs:box:{date}:{cabinetId}`        |
| Aggregated | 1h  | `tariffs:warehouses:{date}:{cabinetId}` |

**Force Refresh**:

- Query param `?refresh=true` bypasses cache
- Used for manual refresh in UI

### Task 5: Write E2E Tests

**Owner**: Backend Team
**Estimate**: 3h
**File**: `test/tariffs/warehouses-tariffs.e2e-spec.ts`

**Test Scenarios**:

- [ ] Returns all warehouses with tariffs
- [ ] Handles missing tariffs gracefully
- [ ] Respects date parameter
- [ ] Caching works correctly
- [ ] Rate limiting applied
- [ ] Auth/Cabinet guards work

### Task 6: Documentation

**Owner**: Backend Team
**Estimate**: 1h

**Deliverables**:

- [ ] Update Swagger/OpenAPI
- [ ] Update `API-PATHS-REFERENCE.md`
- [ ] Create example requests in `test-api/*.http`

---

## Phase 3.2: Frontend Types & API Client

### Task 7: Add TypeScript Types

**Owner**: Frontend Team
**Estimate**: 1h (part of Story 44.12)
**File**: `src/types/warehouses-tariffs.ts`

```typescript
// Types from SDK-WAREHOUSES-TARIFFS-REFERENCE.md
export interface Warehouse { ... }
export interface WarehouseTariffs { ... }
export interface LogisticsTariff { ... }
export interface StorageTariff { ... }
export interface WarehousesResponse { ... }
```

### Task 8: Add API Client

**Owner**: Frontend Team
**Estimate**: 30min (part of Story 44.12)
**File**: `src/lib/api/warehouses-tariffs.ts`

```typescript
export async function getWarehousesWithTariffs(date?: string): Promise<WarehousesResponse>;
```

### Task 9: Add React Query Hook

**Owner**: Frontend Team
**Estimate**: 30min (part of Story 44.12)
**File**: `src/hooks/useWarehousesTariffs.ts`

```typescript
export function useWarehousesWithTariffs(date?: string);
```

---

## Phase 3.3: UI Components

### Story 44.12: Warehouse Selection Dropdown

**Estimate**: 2 Story Points (~2h)
**File**: `src/components/custom/price-calculator/WarehouseSelector.tsx`

**Requirements**:

- [ ] Fetch warehouses on mount
- [ ] Show loading state
- [ ] Display warehouse name + federal district
- [ ] Group by federal district (optional)
- [ ] Handle empty/error states
- [ ] Keyboard accessible (WCAG 2.1 AA)

**UI Mock**:

```
┌─────────────────────────────────────────┐
│ Склад отгрузки                      ▼   │
├─────────────────────────────────────────┤
│ ○ Коледино (Центральный ФО)            │
│ ○ Казань (Приволжский ФО)              │
│ ○ Хабаровск (Дальневосточный ФО)       │
│ ○ ...                                   │
└─────────────────────────────────────────┘
```

### Story 44.13: Auto-fill Coefficients

**Estimate**: 3 Story Points (~3h)
**Files**:

- `src/components/custom/price-calculator/PriceCalculatorForm.tsx` (update)
- `src/hooks/useWarehouseAutoFill.ts` (new)

**Requirements**:

- [ ] On warehouse selection, auto-fill:
  - `logistics_coefficient`
  - `storage_coefficient`
  - `logistics_forward_rub` (calculated from volume)
- [ ] Show source indicator ("Тариф склада Коледино")
- [ ] Allow manual override with warning
- [ ] Handle FBO/FBS toggle

**UI Mock**:

```
┌─────────────────────────────────────────┐
│ Коэффициент логистики                   │
│ ┌───────────────────────────────────┐   │
│ │ 1.0                           🔒  │   │
│ └───────────────────────────────────┘   │
│ ℹ️ Автозаполнено из тарифов Коледино   │
└─────────────────────────────────────────┘
```

### Story 44.14: Storage Cost Calculation

**Estimate**: 2 Story Points (~2h)
**Files**:

- `src/components/custom/price-calculator/StorageCostSection.tsx` (new)
- `src/lib/calculations/storage.ts` (new)

**Requirements**:

- [ ] Input: days in storage
- [ ] Calculate daily storage cost from tariffs
- [ ] Show breakdown (base + per-liter + coefficient)
- [ ] Total storage cost in results

**Formulas**:

```typescript
const dailyStorage = (basePerDay + (volume - 1) * literPerDay) * coefficient;
const totalStorage = dailyStorage * days;
```

**UI Mock**:

```
┌─────────────────────────────────────────┐
│ Хранение                                │
│                                         │
│ Дней хранения: [30        ]             │
│                                         │
│ Стоимость хранения:                     │
│ ├── База (1 литр/день): 0.07 ₽         │
│ ├── Доп. литры (1.5 × 0.05): 0.075 ₽   │
│ ├── Коэффициент: ×1.0                  │
│ └── Итого/день: 0.145 ₽                │
│                                         │
│ За 30 дней: 4.35 ₽                      │
└─────────────────────────────────────────┘
```

---

## Phase 3.4: QA & Polish

### Task 10: Integration Testing

**Estimate**: 2h

**Test Scenarios**:

- [ ] E2E: Select warehouse → coefficients auto-fill
- [ ] E2E: Calculate with real tariffs
- [ ] E2E: Handle warehouse without tariffs
- [ ] Unit: Storage calculation accuracy
- [ ] Unit: Logistics calculation accuracy

### Task 11: Documentation Update

**Estimate**: 1h

**Deliverables**:

- [ ] Update user guide (`docs/user-guide/price-calculator.md`)
- [ ] Update story files with completion notes
- [ ] Update Epic 44 README progress

---

## Dependencies Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY GRAPH                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Request #98 ─────────────────────────────────────────────────┐    │
│       │                                                        │    │
│       ▼                                                        │    │
│  ┌─────────────────────┐                                      │    │
│  │ Backend API         │                                      │    │
│  │ warehouses-with-    │                                      │    │
│  │ tariffs endpoint    │                                      │    │
│  └──────────┬──────────┘                                      │    │
│             │                                                  │    │
│             ▼                                                  │    │
│  ┌─────────────────────┐     ┌─────────────────────┐         │    │
│  │ Story 44.12         │     │ Story 44.7          │         │    │
│  │ Warehouse Selector  │     │ Volume Calculation  │         │    │
│  └──────────┬──────────┘     └──────────┬──────────┘         │    │
│             │                           │                     │    │
│             ▼                           │                     │    │
│  ┌─────────────────────┐                │                     │    │
│  │ Story 44.13         │◄───────────────┘                     │    │
│  │ Auto-fill Coeff.    │                                      │    │
│  └──────────┬──────────┘                                      │    │
│             │                                                  │    │
│             ▼                                                  │    │
│  ┌─────────────────────┐                                      │    │
│  │ Story 44.14         │◄─────────────────────────────────────┘    │
│  │ Storage Calculation │                                           │
│  └─────────────────────┘                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Risk Assessment

| Risk                       | Probability | Impact | Mitigation                            |
| -------------------------- | ----------- | ------ | ------------------------------------- |
| Backend delay              | Medium      | High   | Frontend can mock API for development |
| SDK type changes           | Low         | Medium | Types documented in reference doc     |
| Matching failures          | Medium      | Low    | Fallback to manual input              |
| WB API rate limits         | Low         | Medium | Caching + conservative limits         |
| Coefficient interpretation | Medium      | High   | Clarify with Backend before impl      |

---

## Definition of Done

Phase 3 is complete when:

- [ ] Backend endpoint implemented and tested
- [ ] All 3 frontend stories completed
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] QA sign-off received

---

## Open Questions (For Backend)

1. **Коэффициенты "уже учтены"?** — Базовые ставки чистые или умноженные?
2. **Return logistics endpoint** — Нужен ли в Phase 3?
3. **Pallet tariffs** — Включать в Phase 3 или отложить?
4. **Price-calculator integration** — Автозаполнение в едином запросе?

See `docs/request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md` Section 8.

---

## References

- [SDK Reference](./SDK-WAREHOUSES-TARIFFS-REFERENCE.md)
- [Backend Request #98](../../../request-backend/98-warehouses-tariffs-coefficients-api.md)
- [Backend Response Draft](../../../request-backend/98-warehouses-tariffs-BACKEND-RESPONSE-DRAFT.md)
- [Epic 44 README](./README.md)

---

**Last Updated**: 2026-01-19
