# Story 44.4: Page Layout & Navigation Integration

**Epic**: 44 - Price Calculator UI (Frontend)
**Status**: Draft
**Priority**: P0 - CRITICAL
**Effort**: 2 SP
**Depends On**: Stories 44.1, 44.2, 44.3 ✅

---

## User Story

**As a** Seller,
**I want** to access the Price Calculator from the main app,
**So that** I can easily calculate prices without leaving the application.

**Non-goals**:
- Form component (separate story)
- Results component (separate story)
- Real-time calculation (separate story)

---

## Acceptance Criteria

### AC1: Page Route
- [ ] Create `/tools/price-calculator` route
- [ ] Page accessible from authenticated routes only
- [ ] Redirect to login if not authenticated

### AC2: Page Layout
- [ ] Use existing dashboard layout with Navbar
- [ ] Page title: "Price Calculator"
- [ ] Breadcrumb navigation: Tools > Price Calculator
- [ ] Responsive two-column layout (form left, results right on desktop)

### AC3: Navigation Integration
- [ ] Add "Tools" dropdown to Navbar (if not exists)
- [ ] Add "Price Calculator" link to Tools dropdown
- [ ] Icon for Tools section (wrench or calculator icon)

### AC4: Responsive Layout
- [ ] Desktop (≥1024px): Two columns (form | results)
- [ ] Tablet (768-1023px): Stacked with form above results
- [ ] Mobile (<768px): Single column, full-width inputs

### AC5: SEO & Metadata
- [ ] Page title: "Price Calculator - WB Repricer"
- [ ] Meta description: "Calculate optimal selling price for Wildberries products"
- [ ] Open Graph tags (if shareable)

---

## Context & References

- **Parent Epic**: `docs/epics/epic-44-price-calculator-ui.md`
- **Story 44.2**: `docs/stories/epic-44/story-44.2-fe-input-form-component.md`
- **Story 44.3**: `docs/stories/epic-44/story-44.3-fe-results-display-component.md`
- **Existing Layout**: `src/app/(dashboard)/layout.tsx`

---

## Implementation Notes

### File Structure

```
src/
└── app/
    └── (dashboard)/
        └── tools/
            └── price-calculator/
                └── page.tsx                    # Main calculator page
```

### Page Component Structure

```typescript
// src/app/(dashboard)/tools/price-calculator/page.tsx
import { PriceCalculatorForm } from '@/components/custom/price-calculator/PriceCalculatorForm';
import { PriceCalculatorResults } from '@/components/custom/price-calculator/PriceCalculatorResults';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';

export default function PriceCalculatorPage() {
  const { data, loading, error, calculate } = usePriceCalculator();

  const handleCalculate = (requestData: PriceCalculatorRequest) => {
    calculate(requestData);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4">Tools / Price Calculator</nav>

      {/* Page Header */}
      <h1 className="text-2xl font-bold mb-6">Price Calculator</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div>
          <PriceCalculatorForm
            onSubmit={handleCalculate}
            loading={loading}
          />
        </div>

        {/* Right: Results */}
        <div>
          <PriceCalculatorResults
            data={data}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
```

### Navbar Integration

Update existing Navbar component to add Tools dropdown:

```typescript
// src/components/custom/Navbar.tsx (partial update)
const navItems = [
  // ... existing items
  {
    label: 'Tools',
    children: [
      { label: 'Price Calculator', href: '/tools/price-calculator', icon: Calculator },
      // Future tools can be added here
    ],
  },
];
```

### Layout Variants

**Desktop (≥1024px):**
```
┌─────────────────────────────────────────────────────────────┐
│  [Form Column 45%] │ [Results Column 55%]                   │
│                     │                                        │
│  Input fields      │  Recommended Price                     │
│  Advanced options  │  Cost Breakdown                         │
│  Calculate button  │  Visual Chart                           │
│                     │                                        │
└─────────────────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌─────────────────────────────┐
│  Form Section               │
│  • Input fields             │
│  • Advanced options         │
│  • Calculate button         │
├─────────────────────────────┤
│  Results Section            │
│  • Recommended price        │
│  • Cost breakdown           │
│  • Visual chart             │
└─────────────────────────────┘
```

### Invariants & Edge Cases
- **Invariant**: Page only accessible when authenticated
- **Edge case**: Small mobile screens (<375px) - ensure horizontal scroll not needed
- **Edge case**: Very large screens (>1920px) - max-width container

---

## Observability

- **Analytics**: Page view tracking
- **Metrics**: Time to first calculation

---

## Security

- **Auth**: Middleware redirect if not authenticated
- **Cabinet**: Verify user has active cabinet selected

---

## Accessibility (WCAG 2.1 AA)

- [ ] Skip navigation link
- [ ] Proper heading hierarchy (h1 > h2)
- [ ] Focus visible on interactive elements
- [ ] Touch targets ≥ 44×44px

---

## Dev Agent Record

### File List
| File | Change Type | Description |
|------|-------------|-------------|
| `src/app/(dashboard)/tools/price-calculator/page.tsx` | CREATE | Calculator page |
| `src/components/custom/Navbar.tsx` | UPDATE | Add Tools dropdown |

### Change Log
1. Created Price Calculator page with layout
2. Updated Navbar with Tools navigation

---

## QA Results

**Reviewer**: TBD
**Date**: TBD
**Gate Decision**: ⏳ PENDING

### AC Verification
| AC | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Page route | ⏳ |  |
| AC2 | Page layout | ⏳ |  |
| AC3 | Navigation integration | ⏳ |  |
| AC4 | Responsive layout | ⏳ |  |
| AC5 | SEO & metadata | ⏳ |  |

### Responsive Testing
| Viewport | Expected Layout | Status |
|----------|----------------|--------|
| 1920×1080 | Two columns | ⏳ |
| 1024×768 | Two columns | ⏳ |
| 768×1024 | Stacked | ⏳ |
| 375×667 | Single column | ⏳ |
