# Epic 70-FE: Validation Fixes (Исправления по результатам валидации)

| Field | Value |
|-------|-------|
| Status | 📋 Ready for Dev |
| Priority | P1 |
| Story Points | 13 |
| Sprint | Sprint 12 (2026-02-27) |
| Source | `docs/FRONTEND-VALIDATION-REPORT.md` |
| Validation Date | 2026-02-27 |

## Overview

Системное исправление расхождений, обнаруженных при полной валидации 23 страниц фронтенда
против данных Backend API. Из 16 найденных расхождений (D-1 — D-16) **10 требуют исправлений**,
сгруппированных в 4 категории (A–D). Остальные 6 (D-3, D-6, D-8, D-10, D-11, D-15) —
by design или minor, не требуют code changes.

## Discrepancy Summary

| Group | Discrepancies | Root Cause | Side |
|-------|---------------|------------|------|
| **A** | D-1, D-2, D-4 | summary_total vs summary_rus fallback | Frontend |
| **B** | D-5, D-16 | Inconsistent profit definitions / tooltips | Frontend |
| **C** | D-12, D-14 | Backend API issues | Backend |
| **D** | D-7, D-9, D-13 | Frontend UX/calculation bugs | Frontend |

### Not in scope (by design / minor)

| ID | Description | Resolution |
|----|-------------|------------|
| D-3 | COGS coverage 77% vs 100% | Different base: catalog vs active SKUs — add tooltip |
| D-6 | 27 vs 23 products on SKU page | Includes expense-only SKUs — correct behavior |
| D-8 | Operating profit SKU sum +958₽ | Includes zero-revenue SKUs in sum — minor |
| D-10 | Returns 9 vs 16 | FBS-only vs FBS+FBO — add UX note |
| D-11 | Estimated FBO shows "—" not "~" | Code correct, dev server stale — restart |
| D-15 | 3 routes → 404 | Placeholder routes for future features |

## Stories

| Story | Title | SP | Status | Group |
|-------|-------|----|--------|-------|
| 70.1-FE | Fix summary_total vs summary_rus fallback | 3 | 📋 Ready | A |
| 70.2-FE | Clarify profit definitions and tooltips | 3 | 📋 Ready | B |
| 70.3-FE | Fix margin calculations (weighted avg, denominators) | 2 | 📋 Ready | D |
| 70.4-FE | Fix NaN guard in supply planning formatter | 1 | 📋 Ready | D |
| 70.5-FE | [Backend Request] Funnel buyout data JOIN | 2 | 📋 Blocked | C |
| 70.6-FE | [Backend Request] Liquidity API param alignment | 2 | 📋 Blocked | C |

## Dependencies

- 70.5-FE → Backend: funnel service needs to JOIN orders/finance data
- 70.6-FE → Backend: liquidity DTO param rename (`category_filter` → `liquidity_filter`)
- 70.1-FE through 70.4-FE have no backend dependencies

## Acceptance Criteria (Epic-level)

- AC1: Dashboard/Analytics показывают consistent данные из одного summary source
- AC2: Все tooltip'ы ROI/PPU/маржи корректно описывают используемую формулу
- AC3: Ни одна страница не показывает NaN/Infinity пользователю
- AC4: Brand footer "Ср. маржа" использует weighted average
- AC5: Все unit тесты проходят после изменений
- AC6: Validation report D-1..D-16 пересмотрен и обновлён

## Links

- Validation Report: `docs/FRONTEND-VALIDATION-REPORT.md`
- Backend Requests: `docs/request-backend/`
