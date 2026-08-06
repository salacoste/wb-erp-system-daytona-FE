# Keyboard A11y: Sortable Table Headers (Polish Ticket)

**Filed**: 2026-05-17 (Story 110.1-FE 2nd-pass review F-2)
**Severity**: WCAG 2.1.1 (Level A) — keyboard accessibility
**Status**: Resolved — Story 163.1-FE (2026-08-06). See "Resolution" below.

## Issue

Several sortable table headers in the analytics dashboard implement sort via `<th onClick={...}>` without keyboard affordance (`tabIndex={0}`, `onKeyDown` handler, `role="button"`). Keyboard-only users cannot trigger sort on these columns.

## Affected files

- `src/app/(dashboard)/analytics/advertising/components/MergedGroupTableHeader.tsx` — ROAS column + likely peers (`Из рекламы`, `Расход`, `Органика`) all use the same pattern
- Audit other `<th onClick>` patterns across `src/app/(dashboard)/analytics/**/components/*Header*.tsx` for the same defect class

## Recommended fix

Wrap sortable header content in a proper `<button onClick={handleSort} aria-label={`Сортировать по ${columnName}`}>` element. This:
- Provides keyboard activation (Enter/Space) automatically
- Provides accessible name for screen readers
- Satisfies `jsx-a11y/control-has-associated-label` natively (no eslint-disable needed)

## Provenance

Filed during Story 110.1-FE 2nd-pass review when an `eslint-disable-next-line` with rationale "Sort is mouse-only; keyboard upgrade tracked separately" was found WITHOUT an actual tracking artifact. This file IS the tracking artifact the disable comment references.

## Estimated effort

~0.5 SP — survey all sortable headers in `analytics/**` (likely 5-15 sites), refactor each to use `<button>` wrapper, remove the `eslint-disable-next-line` from MergedGroupTableHeader.tsx + any others using the same pattern.

## Resolution (Story 163.1-FE, 2026-08-06)

Fixed by Story 163.1-FE "Make Advertising Sort Headers Keyboard Accessible":

- `MergedGroupTableHeader.tsx` — all 5 sortable columns (Всего продаж, Из рекламы, Органика, Расход, ROAS) now render a semantic `<button>` inside the `<th>` with a Russian accessible name carrying the current order, a visible focus ring, and `aria-sort` on the owning `<th>`. The `eslint-disable-next-line jsx-a11y/control-has-associated-label` suppression is removed (the button satisfies the rule natively via its `aria-label`).
- `performance-table/SortableHeader.tsx` + `PerformanceTableHeader.tsx` — `aria-sort` moved off the button and onto the owning `<th>` (correct WAI-ARIA placement: only the active column reports ascending/descending, other sortable columns report "none"); visible focus ring and a state-aware accessible name added.

Enter/Space activation is native to the `<button>` element; sort state is conveyed by `aria-sort` plus the button's accessible name, so it does not depend on a pointer or on color alone. This artifact is retained for provenance; the defect is closed.
