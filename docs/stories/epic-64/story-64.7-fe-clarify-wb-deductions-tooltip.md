# Story 64.7-FE: Clarify Удержания WB Tooltip

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P2 (Low)
**Points**: 1

---

## User Story

**As a** seller viewing the Dashboard
**I want** to understand what "Удержания WB" includes and excludes
**So that** I know this is not the total of all WB deductions

---

## Background

"Удержания WB" showed 34,868₽ but actual total deductions were 101,881₽. The difference (logistics, storage) is shown in separate cards, but the tooltip didn't clarify this. Updated tooltip to explicitly state what's excluded.

---

## Technical Implementation

### File: `src/components/custom/dashboard/WbCommissionsCard.tsx`

**Before**: "Все удержания WB: комиссия, эквайринг, лояльность, штрафы, корректировки, сервисы."

**After**: "Комиссия, эквайринг, лояльность, штрафы, корректировки и сервисы WB. Не включает логистику и хранение (показаны отдельно)."

---

## Definition of Done
- [x] Tooltip clarifies excluded items
- [x] No code changes beyond tooltip text

*Created: 2026-02-21*
