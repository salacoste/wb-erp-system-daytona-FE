# Story 44.1: TypeScript Types & API Client for Price Calculator

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority**: P0 - CRITICAL
**Effort**: 2 SP
**Backend Dependency**: Epic 43 ✅ Complete

---

## User Story

**As a** Frontend Developer,
**I want** TypeScript types and API client hook for the Price Calculator endpoint,
**So that** I can integrate with the backend API in a type-safe manner.

**Non-goals**:
- UI components (separate story)
- Error UI handling (separate story)

---

## Acceptance Criteria

### AC1: TypeScript Types for Request/Response
- [ ] Create `PriceCalculatorRequest` interface matching backend DTO
- [ ] Create `PriceCalculatorResponse` interface matching backend DTO
- [ ] Create `CostBreakdown`, `FixedCosts`, `PercentageBreakdown`, `IntermediateValues` interfaces
- [ ] Export types from `src/types/price-calculator.ts`

### AC2: API Client Function
- [ ] Create `calculatePrice()` function in `src/api/price-calculator.ts`
- [ ] Function accepts `PriceCalculatorRequest` and returns Promise<`PriceCalculatorResponse`>
- [ ] Function adds required headers (Authorization, X-Cabinet-Id)
- [ ] Function handles 400, 401, 403 errors with proper error types

### AC3: React Hook for Price Calculation
- [ ] Create `usePriceCalculator()` hook in `src/hooks/usePriceCalculator.ts`
- [ ] Hook returns `{ data, loading, error, calculate }` object
- [ ] Hook caches cabinet ID from auth context
- [ ] Hook handles rate limiting (429) with retry

### AC4: Error Types
- [ ] Create `PriceCalculatorError` union type
- [ ] Create `ValidationError`, `UnauthorizedError`, `ForbiddenError` interfaces
- [ ] Export from `src/types/price-calculator.ts`

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend API Guide**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **Backend PRD**: `docs/epics/epic-43-price-calculator.md`

---

## Implementation Notes

### File Structure

```
src/
├── types/
│   └── price-calculator.ts          # Request/Response types
├── api/
│   └── price-calculator.ts          # API client function
└── hooks/
    └── usePriceCalculator.ts        # React hook
```

### Type Definitions (Reference)

```typescript
// src/types/price-calculator.ts
export interface PriceCalculatorRequest {
  target_margin_pct: number;
  cogs_rub: number;
  logistics_forward_rub: number;
  logistics_reverse_rub: number;
  buyback_pct: number;
  advertising_pct: number;
  storage_rub: number;
  vat_pct?: number;
  acquiring_pct?: number;
  commission_pct?: number;
  overrides?: {
    commission_pct?: number;
    nm_id?: number;
  };
}

export interface PriceCalculatorResponse {
  meta: {
    cabinet_id: string;
    calculated_at: string;
  };
  result: {
    recommended_price: number;
    target_margin_pct: number;
    actual_margin_rub: number;
    actual_margin_pct: number;
  };
  cost_breakdown: {
    fixed_costs: FixedCosts;
    percentage_costs: PercentageBreakdown;
    total_costs: {
      rub: number;
      pct_of_price: number;
    };
  };
  intermediate_values: {
    buyback_rate_pct: number;
    return_rate_pct: number;
    logistics_effective: number;
    total_percentage_rate: number;
  };
  warnings: string[];
}

export interface FixedCosts {
  cogs: number;
  logistics_forward: number;
  logistics_reverse_effective: number;
  logistics_total: number;
  storage: number;
  fixed_total: number;
}

export interface PercentageBreakdown {
  commission_wb: { pct: number; rub: number };
  acquiring: { pct: number; rub: number };
  advertising: { pct: number; rub: number };
  vat: { pct: number; rub: number };
  margin: { pct: number; rub: number };
  percentage_total: { pct: number; rub: number };
}

export interface PriceCalculatorError {
  code: 'VALIDATION_ERROR' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  message: string;
  details?: Array<{ field: string; issue: string }>;
  trace_id?: string;
}
```

### API Client Implementation

```typescript
// src/api/price-calculator.ts
import { PriceCalculatorRequest, PriceCalculatorResponse, PriceCalculatorError } from '@/types/price-calculator';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export async function calculatePrice(
  request: PriceCalculatorRequest,
  cabinetId: string,
  token: string
): Promise<PriceCalculatorResponse> {
  const response = await fetch(`${API_BASE}/v1/products/price-calculator`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Cabinet-Id': cabinetId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error: PriceCalculatorError = await response.json();
    throw error;
  }

  return response.json();
}
```

### React Hook Implementation

```typescript
// src/hooks/usePriceCalculator.ts
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { calculatePrice } from '@/api/price-calculator';
import { PriceCalculatorRequest, PriceCalculatorResponse, PriceCalculatorError } from '@/types/price-calculator';

export function usePriceCalculator() {
  const { token, cabinetId } = useAuth();
  const [data, setData] = useState<PriceCalculatorResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PriceCalculatorError | null>(null);

  const calculate = useCallback(async (request: PriceCalculatorRequest) => {
    if (!token || !cabinetId) {
      setError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await calculatePrice(request, cabinetId, token);
      setData(result);
    } catch (e) {
      setError(e as PriceCalculatorError);
    } finally {
      setLoading(false);
    }
  }, [token, cabinetId]);

  return { data, loading, error, calculate };
}
```

### Invariants & Edge Cases
- **Invariant**: Token and cabinetId must be present before calling API
- **Edge case**: Rate limit 429 - implement retry after delay
- **Edge case**: Network timeout - implement timeout with 30s limit

---

## Observability

- **Logs**: Console error with trace_id on API failure
- **Metrics**: Track calculation success/failure rate (via Mixpanel if enabled)

---

## Security

- **Validation**: Request types ensure no negative values for costs
- **Auth**: Token and cabinetId from auth context only

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/price-calculator.ts` | CREATE | TypeScript types |
| `src/api/price-calculator.ts` | CREATE | API client function |
| `src/hooks/usePriceCalculator.ts` | CREATE | React hook |

### Change Log
1. Created type definitions for Price Calculator API

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | TypeScript types | ⏳ |  |
| AC2 | API client function | ⏳ |  |
| AC3 | React hook | ⏳ |  |
| AC4 | Error types | ⏳ |  |
