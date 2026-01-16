# Story 44.3: Results Display Component for Price Calculator

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority:** P0 - CRITICAL
**Effort**: 3 SP
**Depends On**: Story 44.1 ✅

---

## User Story

**As a** Seller,
**I want** to clearly see the recommended price and cost breakdown,
**So that** I understand exactly where the money goes and can make informed pricing decisions.

**Non-goals**:
- Input form (separate story)
- Page layout (separate story)

---

## Acceptance Criteria

### AC1: Recommended Price Display
- [ ] Large, prominent display of recommended price (≥48px font)
- [ ] Currency formatting with ₽ symbol (e.g., "4 057,87 ₽")
- [ ] Green color for positive margin cases
- [ ] Red color if margin is 0 or negative

### AC2: Margin Display
- [ ] Show target margin % vs actual margin %
- [ ] Show margin amount in ₽
- [ ] Visual progress bar or gauge for margin percentage
- [ ] Color coding: green (>20%), yellow (10-20%), orange (5-10%), red (<5%)

### AC3: Cost Breakdown Table
- [ ] Fixed costs section with: COGS, Logistics Total, Storage
- [ ] Percentage costs section with: WB Commission, Acquiring, Advertising, VAT, Margin
- [ ] Each row shows both % and ₽ amount
- [ ] Expandable/collapsible details
- [ ] Visual hierarchy (group headers)

### AC4: Visual Breakdown Chart
- [ ] Stacked horizontal bar chart showing cost composition
- [ ] Color-coded segments matching table
- [ ] Hover tooltips with exact amounts
- [ ] Percentage labels on each segment
- [ ] Legend below chart

### AC5: Additional Information
- [ ] Display intermediate values: return rate %, effective logistics
- [ ] Display warnings from backend (if any)
- [ ] Display calculation timestamp
- [ ] "Copy to clipboard" button for price

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Backend API**: `docs/request-backend/95-epic-43-price-calculator-api.md`
- **Story 44.1**: `docs/stories/epic-44/story-44.1-fe-types-api-client.md`

---

## Implementation Notes

### File Structure

```
src/
└── components/
    └── custom/
        └── price-calculator/
            ├── PriceCalculatorResults.tsx     # Main results container
            ├── RecommendedPriceCard.tsx       # Large price display
            ├── MarginDisplay.tsx              # Use existing or extend
            ├── CostBreakdownTable.tsx         # Breakdown table
            ├── CostBreakdownChart.tsx         # Stacked bar chart
            └── WarningsDisplay.tsx            # Backend warnings
```

### Component Structure

```typescript
// src/components/custom/price-calculator/PriceCalculatorResults.tsx
interface PriceCalculatorResultsProps {
  data: PriceCalculatorResponse;
  loading?: boolean;
}

// Color scheme for cost segments
const COST_COLORS = {
  cogs: '#3B82F6',      // Blue
  logistics: '#F59E0B', // Orange
  storage: '#8B5CF6',   // Purple
  commission: '#EF4444', // Red
  acquiring: '#EC4899',  // Pink
  advertising: '#14B8A6', // Teal
  vat: '#6366F1',       // Indigo
  margin: '#10B981',    // Green
};
```

### Layout Structure

```
┌─────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────┐  │
│  │   Recommended Price                       │  │
│  │                                           │  │
│  │       4 057,87 ₽                          │  │
│  │                                           │  │
│  │   Margin: 811,57 ₽ (20.0%)               │  │
│  │   ████████████████████░░░░░░░░           │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │   Cost Breakdown                          │  │
│  │   ─────────────────────────────────────   │  │
│  │   Fixed Costs: 1 753,00 ₽                │  │
│  │     • COGS: 1 500,00 ₽                   │  │
│  │     • Logistics: 203,00 ₽                │  │
│  │     • Storage: 50,00 ₽                   │  │
│  │   ─────────────────────────────────────   │  │
│  │   Percentage Costs: 2 304,86 ₽           │  │
│  │     • WB Commission: 405,79 ₽ (10.0%)    │  │
│  │     • Acquiring: 73,04 ₽ (1.8%)          │  │
│  │     • Advertising: 202,89 ₽ (5.0%)       │  │
│  │     • VAT: 811,57 ₽ (20.0%)              │  │
│  │     • Margin: 811,57 ₽ (20.0%)           │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │   Visual Breakdown                        │  │
│  │   [COGS][Log][Stor][Comm][Acq][Adv][VAT][Margin] │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Chart Implementation

Use existing chart library (Recharts or similar) with stacked bar:

```typescript
// Example data structure for chart
const chartData = [{
  name: 'Price',
  cogs: 1500,
  logistics: 203,
  storage: 50,
  commission: 405.79,
  acquiring: 73.04,
  advertising: 202.89,
  vat: 811.57,
  margin: 811.57,
}];
```

### Loading State
- Show skeleton or spinner when `loading=true`
- Preserve previous results during loading

### Empty State
- Show placeholder message before first calculation
- Example: "Enter your costs and target margin to calculate recommended price"

---

## Observability

- **Analytics**: Track "Copy Price" button clicks

---

## Accessibility (WCAG 2.1 AA)

- [ ] Chart has accessible text description
- [ ] Table has proper headers
- [ ] Color coding has text labels (not color alone)
- [ ] Keyboard can copy price

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/custom/price-calculator/PriceCalculatorResults.tsx` | CREATE | Results container |
| `src/components/custom/price-calculator/RecommendedPriceCard.tsx` | CREATE | Large price display |
| `src/components/custom/price-calculator/CostBreakdownTable.tsx` | CREATE | Breakdown table |
| `src/components/custom/price-calculator/CostBreakdownChart.tsx` | CREATE | Stacked bar chart |
| `src/components/custom/price-calculator/WarningsDisplay.tsx` | CREATE | Backend warnings |

### Change Log
1. Created results display components for Price Calculator

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Recommended price display | ⏳ |  |
| AC2 | Margin display | ⏳ |  |
| AC3 | Cost breakdown table | ⏳ |  |
| AC4 | Visual breakdown chart | ⏳ |  |
| AC5 | Additional information | ⏳ |  |

### Accessibility Check
| Check | Status |
|-------|--------|
| Chart accessible text | ⏳ |
| Table headers | ⏳ |
| Color blind friendly | ⏳ |
