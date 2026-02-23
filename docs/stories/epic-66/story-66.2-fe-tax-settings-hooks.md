# Story 66.2-FE: Tax Settings Hooks

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 3 SP
**Priority**: P0
**Status**: ✅ Complete
**Dependencies**: Story 66.1-FE (types & API)

---

## Description

Create TanStack Query hooks for reading and mutating cabinet tax + VAT settings. Query key factory for cache management. Mutation hook invalidates both cabinet and finance-summary caches on success.

---

## Acceptance Criteria

### AC1: Query Key Factory
- [ ] `cabinetTaxKeys` with `all`, `byId(cabinetId)` factories
- [ ] Follows existing project pattern (see `src/hooks/` examples)

### AC2: Query Hook
- [ ] `useCabinetTaxSettings(cabinetId: string)` hook
- [ ] Returns `{ taxSystem, taxRate, vatPayer, vatRate }` from cabinet data
- [ ] `enabled: !!cabinetId`
- [ ] `staleTime: 60_000` (1 min)
- [ ] Loading and error states handled

### AC3: Mutation Hook
- [ ] `useUpdateTaxSettings(cabinetId: string)` mutation hook
- [ ] Accepts `UpdateCabinetTaxRequest` as input
- [ ] On success: invalidates `cabinetTaxKeys.byId(cabinetId)` AND finance-summary queries
- [ ] On 400 error: returns validation error message

### AC4: Cache Invalidation
- [ ] Finance-summary queries invalidated on tax settings change (backend recalculates)
- [ ] Cabinet queries invalidated to reflect new settings

---

## Technical Implementation

### Files to Create
- `src/hooks/useCabinetTaxSettings.ts`

### Integration Points
- Uses `getCabinetTaxSettings()` and `updateCabinetTaxSettings()` from `lib/api/cabinet.ts`
- Invalidates finance-summary query keys from `hooks-v1/financial/hooks.ts`

---

## Testing

- [ ] Query hook returns correct data shape
- [ ] Mutation triggers cache invalidation
- [ ] Error states handled (400 validation, network errors)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation |
| 2026-02-23 | Claude | No scope changes — mutation already handles full body including VAT fields |
