# Story 64.5-FE: Fix Маржинальность Display — Same Root Cause as 64.4

**Epic**: [64-FE UI Validation & Business Logic Fixes](./README.md)
**Status**: ✅ Complete
**Completed**: 2026-02-21
**Priority**: P0 (Critical)
**Points**: 0 (included in 64.4)

---

## User Story

**As a** seller viewing the Dashboard
**I want** Маржинальность to reflect my actual operating margin
**So that** I don't think my margin is 70% when it's actually 20%

---

## Background

Same root cause as Story 64.4. Dashboard showed 70.1% margin (W07) when SKU analytics correctly showed 20.0%. On W06, dashboard showed 70.9% when reality was -3.7% (loss).

Fixed together with Story 64.4 in `aggregation.ts`.

---

## Technical Implementation

See Story 64.4. Margin tooltip updated from "Валовая маржа" to "Операционная маржа" in `MarginCard.tsx`.

*Created: 2026-02-21*
