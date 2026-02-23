# Story 66.7-FE: Tax Warning & Empty States

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 4 SP
**Priority**: P1
**Status**: ✅ Complete
**Dependencies**: Stories 66.3-FE (settings page), 66.5-FE (tax card)

---

## Description

Create dismissible warning banner when tax is not configured. Add "(до налога)" annotations to profit cards when tax not configured. Add visual indicators when tax IS configured. Session-based dismissal via sessionStorage.

---

## Acceptance Criteria

### AC1: TaxWarningBanner Component
- [x] Shown on dashboard when `tax === null`
- [x] Message: "Налоговая система не настроена. Прибыль отображается до вычета налогов."
- [x] CTA button: "Настроить" → navigates to `/settings/tax`
- [x] Dismissible with ✕ button
- [x] Dismissal persisted in sessionStorage (reappears on new session)

### AC2: Pre-Tax Annotations
- [x] Profit cards show "(до налога)" suffix when tax not configured
- [x] Applies to: PayoutCard, GrossProfitCard, OperatingProfitCard, MarginCard
- [x] Annotation hidden when tax IS configured
- [x] Subtle styling (muted text, smaller font)

### AC3: Configured Indicator
- [x] Tax settings page shows green checkmark when tax configured
- [x] Dashboard shows configured tax system in TaxCard header

### AC4: Accessibility
- [x] Warning banner uses `role="alert"`
- [x] Dismiss button has `aria-label="Скрыть предупреждение"`
- [x] CTA link is keyboard-focusable

---

## Technical Implementation

### Files to Create
- `src/components/custom/dashboard/TaxWarningBanner.tsx`

### Files to Modify
- Dashboard page — Add TaxWarningBanner
- Profit-related cards — Add "(до налога)" annotation prop

### SessionStorage Key
```typescript
const DISMISSED_KEY = 'tax-warning-dismissed'
```

---

## Testing

- [x] Banner shows when tax === null
- [x] Banner hidden when tax is configured
- [x] Dismiss persists in session (not across sessions)
- [x] CTA navigates to /settings/tax
- [x] Annotations appear/disappear based on tax config

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation |
| 2026-02-23 | Claude | No scope changes — warning logic works at tax === null level, НДС doesn't affect this |
| 2026-02-23 | Claude | Implemented: TaxWarningBanner + showPreTaxLabel on 4 profit cards + DashboardContent integration. 8 TDD tests pass. |
