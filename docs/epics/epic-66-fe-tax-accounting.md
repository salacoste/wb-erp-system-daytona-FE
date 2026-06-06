# Epic 66-FE: Tax & VAT Accounting Integration (Налоговый учёт + НДС)

**Status**: ✅ Done (pre-flight verified 2026-06-06 — all 7 stories already implemented)
**Priority**: P0
**Sprint**: TBD
**Total Points**: 35 SP
**Stories**: 7 (0 complete, 7 ready)
**Backend Dependency**: Epic 72 + Task-50 (НДС) — ✅ Complete (2026-02-23)

---

## Overview

Integrates frontend with the backend tax & VAT accounting system (Epic 72 + Task-50) to provide sellers with accurate after-tax profitability metrics. The backend calculates both income taxes and НДС during weekly financial aggregation and returns all metrics via the existing finance-summary API. The frontend needs to:

1. Allow users to configure their tax system per cabinet (USN 6%, USN 15%, or custom rate)
2. Allow users to enable НДС (VAT) with rate selection (0%, 5%, 20%, 22%)
3. Display backend-calculated tax + VAT metrics on the dashboard
4. Show net profit after ALL taxes as the final profitability metric
5. Handle edge cases: tax not configured, minimum tax rule (USN 15%), VAT without income tax, validation errors

**Key Architectural Decision**: The existing `TaxCard` (Epic 65, Story 65.11) performs LOCAL tax calculations. This epic replaces local calculations with **backend-calculated** tax data from `summary_total.tax` in finance-summary API. The local `tax-calculations.ts` remains as a reference but the primary source of truth becomes the backend.

**НДС (VAT) Support**: Backend Task-50 implemented full НДС support. Cabinet stores `vatPayer` + `vatRate`, finance-summary returns `vat_output`, `vat_payable`, `revenue_excl_vat`, and `net_profit_after_all_tax`. НДС is calculated BEFORE income tax — it reduces effective revenue.

---

## Out of Scope (Per Backend Team)

- **Per-SKU tax metrics** — calculated on backend but not exposed in API v1
- **Tax audit trail history UI** — backend logs changes, but no frontend endpoint yet
- **Manual backfill trigger** — admin-only via `POST /v1/tasks/enqueue` with `task_type: "tax_backfill"`
- **Quarterly НДС reporting** — future enhancement

---

## Backend API Contract (Epic 72 + Task-50)

### 1. Cabinet Tax & VAT Settings

**Read**: `GET /v1/cabinets/:id` → returns `taxSystem`, `taxRate`, `vatPayer`, `vatRate`

**Update**: `PUT /v1/cabinets/:id`
```json
{
  "taxSystem": "usn6" | "usn15" | "manual" | null,
  "taxRate": number | null,
  "vatPayer": true | false,
  "vatRate": number | null
}
```

| Field | Values | Rules |
|-------|--------|-------|
| `taxSystem` | `null`, `"usn6"`, `"usn15"`, `"manual"` | null = not configured |
| `taxRate` | `number \| null` | Required when manual, auto-cleared otherwise |
| `vatPayer` | `boolean` | Default false |
| `vatRate` | `0 \| 5 \| 20 \| 22 \| null` | Required when vatPayer=true, auto-cleared otherwise |

### 2. Finance Summary Tax Metrics

**Endpoint**: `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

Tax data location: `response.summary_total.tax` (ONLY — `summary_rus.tax` and `summary_eaeu.tax` are always null)

```typescript
interface TaxMetrics {
  // Income tax fields
  tax_amount: number | null
  tax_base: number | null
  effective_tax_rate: number | null
  tax_system: string | null       // "usn6" | "usn15" | "manual"
  is_minimum_rule: boolean
  net_profit_after_tax: number | null

  // VAT/НДС fields (Task-50)
  vat_payer: boolean
  vat_rate: number | null         // 0, 5, 20, 22
  vat_output: number | null       // НДС от продаж
  vat_payable: number | null      // НДС к уплате (output - input)
  revenue_excl_vat: number | null // Выручка без НДС
  net_profit_after_all_tax: number | null // Чистая прибыль после ВСЕХ налогов
}
```

When `tax === null` → tax system not configured for cabinet.

### 3. Tax Formulas (Backend-Calculated)

**Income Tax**:
- **USN 6%**: `tax = revenue_excl_vat × 6%` (or sales_gross_total if no VAT)
- **USN 15%**: `tax = MAX((revenue − expenses) × 15%, revenue × 1%)` (minimum rule)
- **Manual**: `tax = tax_base × (taxRate / 100)`

**НДС (VAT)**:
- `vat_output = sales_gross_total × vatRate / (100 + vatRate)`
- `revenue_excl_vat = sales_gross_total − vat_output`
- `vat_payable = vat_output − vat_input` (input from COGS)

**Order of calculation**: НДС first → income tax on revenue_excl_vat → net profit

---

## Stories Summary

| Story | Title | Points | Priority | Status | Key Files |
|-------|-------|--------|----------|--------|-----------|
| 66.1-FE | Types & API Layer | 4 | P0 | 📋 Ready | `types/cabinet.ts`, `types/finance-summary.ts`, `lib/api/cabinet.ts` |
| 66.2-FE | Tax Settings Hooks | 3 | P0 | 📋 Ready | `hooks/useCabinetTaxSettings.ts` |
| 66.3-FE | Tax & VAT Settings Page | 7 | P0 | 📋 Ready | `app/(dashboard)/settings/tax/page.tsx`, `components/custom/settings/TaxSettingsForm.tsx` |
| 66.4-FE | Finance Summary Tax Integration | 4 | P0 | 📋 Ready | `types/finance-summary.ts`, `hooks-v1/financial/aggregation.ts` |
| 66.5-FE | Dashboard Tax Card (Backend Data) | 6 | P0 | 📋 Ready | `components/custom/dashboard/TaxCard.tsx` |
| 66.6-FE | Net Profit After Tax Display | 7 | P1 | 📋 Ready | `components/custom/dashboard/NetProfitCard.tsx` |
| 66.7-FE | Tax Warning & Empty States | 4 | P1 | 📋 Ready | `components/custom/dashboard/TaxWarningBanner.tsx` |

---

## Implementation Order

### Phase 1: Foundation (P0) — Stories 66.1, 66.2
1. 66.1-FE: Types & API Layer (foundation for all other stories)
2. 66.2-FE: Tax Settings Hooks (depends on 66.1)

### Phase 2: Settings UI (P0) — Story 66.3
3. 66.3-FE: Tax & VAT Settings Page (depends on 66.2)

### Phase 3: Dashboard Integration (P0) — Stories 66.4, 66.5
4. 66.4-FE: Finance Summary Tax Integration (depends on 66.1)
5. 66.5-FE: Dashboard Tax Card refactor (depends on 66.4)

### Phase 4: Polish (P1) — Stories 66.6, 66.7
6. 66.6-FE: Net Profit After Tax (depends on 66.4)
7. 66.7-FE: Tax Warning States (depends on 66.3, 66.5)

---

## Dependencies

### Backend APIs Required (All ✅ Complete)
- `GET /v1/cabinets/:id` — read taxSystem, taxRate, vatPayer, vatRate
- `PUT /v1/cabinets/:id` — update tax + VAT settings
- `GET /v1/analytics/weekly/finance-summary` — tax metrics in summary_total.tax

### From Existing Frontend Epics
- Epic 61-FE: `useFinancialSummary` hook, aggregation pipeline
- Epic 62-FE: Dashboard grid layout, MetricCardStates
- Epic 63-FE: DashboardMetricsGrid, ProfitBreakdownPopover
- Epic 65: TaxCard (to be refactored), tax-calculations.ts

---

## Success Metrics

| Metric | Target |
|--------|--------|
| TypeScript strict mode | 0 errors |
| Unit test coverage | >80% per story |
| File size limit | <200 lines each |
| API response handling | All error states covered |
| Accessibility | WCAG 2.1 AA (form labels, keyboard nav) |

---

## Related Documentation

- Backend Epic 72: Tax Accounting (complete)
- Backend Task-50: НДС/VAT Integration (complete)
- `docs/request-backend/155-VAT-NDS-INTEGRATION.md` — НДС request (resolved)
- `docs/request-backend/156-EPIC-72-TAX-ACCOUNTING-FRONTEND-INTEGRATION.md` — Integration guide
- `src/lib/tax-calculations.ts` — Local tax calculation reference (deprecated)
- `src/components/custom/dashboard/TaxCard.tsx` — Existing card (Epic 65)
- `docs/api-integration-guide.md` — API integration patterns

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial epic creation based on Backend Epic 72 summary |
| 2026-02-23 | Claude | Full rescope: added НДС/VAT support (Task-50), updated all stories, 28→35 SP |
