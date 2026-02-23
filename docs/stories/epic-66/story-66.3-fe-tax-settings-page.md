# Story 66.3-FE: Tax & VAT Settings Page

**Epic**: 66-FE Tax & VAT Accounting Integration
**Points**: 7 SP
**Priority**: P0
**Status**: ✅ Complete
**Dependencies**: Story 66.2-FE (hooks)

---

## Description

Create new `/settings/tax` page with form for configuring income tax system and НДС (VAT) settings. Two sections: income tax (radio group) and VAT (checkbox + rate selector). Add sidebar navigation link under Settings.

---

## Acceptance Criteria

### AC1: Route & Page
- [ ] `/settings/tax` page accessible from sidebar
- [ ] Route added to `src/lib/routes.ts` as `SETTINGS.TAX`
- [ ] Page title: "Налоговые настройки"
- [ ] Sidebar navigation link added under Settings section

### AC2: Income Tax Section
- [ ] Section header: "Система налогообложения"
- [ ] RadioGroup with options:
  - ○ Не настроена (value: null)
  - ○ УСН 6% — по доходам (value: "usn6")
  - ○ УСН 15% — по прибыли (value: "usn15")
  - ○ Пользовательская ставка (value: "manual")
- [ ] When "manual" selected → show tax rate input (0-100%)
- [ ] Tax rate input hidden for other options

### AC3: VAT Section
- [ ] Section header: "НДС (Налог на добавленную стоимость)"
- [ ] Checkbox: "Мой кабинет является плательщиком НДС"
- [ ] When checked → show VAT rate radio group:
  - ○ 0% — экспорт
  - ○ 5% — УСН при превышении порога
  - ○ 20% — стандартная ставка
  - ○ 22% — отдельные категории (с 2025)
- [ ] VAT rate radio hidden when checkbox unchecked

### AC4: Form Submission
- [ ] "Сохранить" button sends PUT request with all fields
- [ ] Success toast: "Налоговые настройки сохранены"
- [ ] Error toast with server error message
- [ ] Button disabled during submission (loading state)
- [ ] Form resets to server state on cancel or re-fetch

### AC5: Validation
- [ ] `taxSystem: 'manual'` → taxRate required, range 0-100
- [ ] `vatPayer: true` → vatRate required
- [ ] Client-side validation before submission
- [ ] Server-side 400 errors displayed inline

### AC6: Accessibility (WCAG 2.1 AA)
- [ ] All form inputs have associated labels
- [ ] Keyboard navigation works (Tab, Space, Enter)
- [ ] Focus management on section expand/collapse
- [ ] Error messages linked with `aria-describedby`

---

## UI Mockup

```
┌─────────────────────────────────────────────────┐
│ Налоговые настройки                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Система налогообложения                         │
│ ─────────────────────                           │
│ ○ Не настроена                                  │
│ ○ УСН 6% — по доходам                          │
│ ○ УСН 15% — по прибыли                         │
│ ● Пользовательская ставка                       │
│   └── Ставка: [  7.5  ] %                      │
│                                                 │
│ НДС (Налог на добавленную стоимость)            │
│ ─────────────────────────────────────           │
│ ☑ Мой кабинет является плательщиком НДС         │
│                                                 │
│ Ставка НДС                                      │
│ ○ 0% — экспорт                                  │
│ ○ 5% — УСН при превышении порога                │
│ ● 20% — стандартная ставка                      │
│ ○ 22% — отдельные категории (с 2025)            │
│                                                 │
│              [Отменить]  [Сохранить]            │
└─────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Files to Create
- `src/app/(dashboard)/settings/tax/page.tsx` — Page component
- `src/components/custom/settings/TaxSettingsForm.tsx` — Form component

### Files to Modify
- `src/lib/routes.ts` — Add `SETTINGS.TAX`
- Sidebar component — Add navigation link

### Component Breakdown
- `TaxSettingsForm` — Main form (RadioGroup + Checkbox + conditional inputs)
- Uses `useCabinetTaxSettings()` for initial values
- Uses `useUpdateTaxSettings()` for mutation
- shadcn/ui components: RadioGroup, Checkbox, Input, Button, Label, Card

---

## Testing

- [ ] Form renders all options correctly
- [ ] Conditional fields show/hide on selection
- [ ] Validation prevents invalid submissions
- [ ] Success/error toasts appear
- [ ] Keyboard navigation works end-to-end

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-22 | BMad Master | Initial story creation (income tax only) |
| 2026-02-23 | Claude | Added full НДС section (checkbox + rate selector), +2 SP (5→7) |
