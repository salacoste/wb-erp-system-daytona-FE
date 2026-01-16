# Story 36.3-FE: MergedProductBadge Component

## Story Info

- **Epic**: 36-FE - Product Card Linking (Frontend)
- **Priority**: High
- **Points**: 3
- **Status**: ✅ APPROVED (Ready for Development)

## User Story

**As a** seller,
**I want** to see a visual indicator when products are merged into a group (склейка),
**So that** I understand which products share advertising budget.

## Background

When viewing advertising analytics with `group_by=imtId`, some items represent merged groups of products. We need a clear visual indicator:
- **Badge**: Shows group size (e.g., "🔗 Склейка (3)")
- **Tooltip**: Lists all products in the group with nmId and vendorCode

**User Scenario**:
1. User toggles to "По склейкам" view
2. Table shows merged groups with badge
3. User hovers over badge
4. Tooltip displays all products in group with explanation

**Dependencies**: Stories 36.1 (Types) and 36.2 (API/Hooks) complete.

## Acceptance Criteria

### AC1: Badge Display
- [ ] Badge shows for `type='merged_group'` items only
- [ ] Badge text: "🔗 Склейка (N)" where N = product count
- [ ] Badge uses `variant="secondary"` (gray background)
- [ ] Badge has `cursor-help` CSS class

### AC2: Tooltip Content
- [ ] Tooltip header shows imtId: "Объединённая карточка #328632"
- [ ] Tooltip lists all products: "ter-09 (#173588306)"
- [ ] Tooltip includes explanation (💡 icon with text)
- [ ] Tooltip has max-width constraint (max-w-xs)

### AC3: Edge Case Handling
- [ ] Single product with imtId returns `null` (no badge)
- [ ] Empty `mergedProducts` array handled gracefully
- [ ] Component doesn't crash if `imtId` is null

### AC4: Accessibility
- [ ] Tooltip has proper ARIA labels
- [ ] Keyboard navigation supported (focus + Enter)
- [ ] Screen reader announces group size

## Tasks / Subtasks

### Phase 1: Create Component File (40 min)
- [ ] Create `src/components/analytics/MergedProductBadge.tsx`
- [ ] Import Badge, Tooltip from shadcn/ui
- [ ] Define props interface
- [ ] Implement component logic
- [ ] Add JSDoc comments

### Phase 2: Implement Badge Logic (20 min)
- [ ] Check product count (return null if === 1)
- [ ] Render Badge with link emoji and count
- [ ] Apply cursor-help class
- [ ] Handle undefined mergedProducts

### Phase 3: Implement Tooltip (30 min)
- [ ] Wrap Badge in TooltipProvider
- [ ] Create TooltipContent with header
- [ ] Map mergedProducts to list items
- [ ] Add explanation text with icon
- [ ] Style with max-width and spacing

### Phase 4: Unit Tests (40 min)
- [ ] Create `src/components/analytics/MergedProductBadge.test.tsx`
- [ ] Test: renders badge with correct count
- [ ] Test: returns null for single product
- [ ] Test: tooltip shows all products
- [ ] Test: handles edge cases

### Phase 5: Storybook (Optional, 20 min)
- [ ] Create Storybook story for component
- [ ] Add examples: 2 products, 3 products, 5 products
- [ ] Add edge case examples

## Technical Details

### Component File Structure

**File**: `src/components/analytics/MergedProductBadge.tsx`

```typescript
/**
 * MergedProductBadge Component (Epic 36)
 *
 * Displays a badge indicating a merged product group (склейка) with a tooltip
 * showing all products in the group.
 *
 * Returns null for single products with imtId (edge case handling).
 *
 * @see frontend/docs/request-backend/83-epic-36-api-contract.md
 * @see frontend/docs/stories/epic-36/story-36.3-fe-merged-badge-component.md
 */

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MergedProduct } from '@/types/advertising-analytics'

interface MergedProductBadgeProps {
  /** WB merged card identifier */
  imtId: number
  /** Products within the merged group */
  mergedProducts: MergedProduct[]
  /** Optional custom badge text (default: "Склейка (N)") */
  label?: string
  /** Optional className for styling */
  className?: string
}

export function MergedProductBadge({
  imtId,
  mergedProducts,
  label,
  className,
}: MergedProductBadgeProps) {
  const productCount = mergedProducts.length

  // Edge case: Single product with imtId (display as individual)
  if (productCount === 1) {
    return null
  }

  const defaultLabel = `Склейка (${productCount})`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={`ml-2 cursor-help ${className || ''}`}
          >
            🔗 {label ?? defaultLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">
              Объединённая карточка #{imtId}
            </p>
            <p className="text-xs text-muted-foreground">
              Товары в группе:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              {mergedProducts.map((product) => (
                <li key={product.nmId}>
                  <span className="font-mono">{product.vendorCode}</span>
                  <span className="text-muted-foreground ml-1">
                    (#{product.nmId})
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              💡 Рекламные затраты основной карточки распределены между всеми
              товарами группы
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Unit Tests

**File**: `src/components/analytics/MergedProductBadge.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MergedProductBadge } from './MergedProductBadge'

describe('MergedProductBadge', () => {
  const mockMergedProducts = [
    { nmId: 173588306, vendorCode: 'ter-09' },
    { nmId: 173589306, vendorCode: 'ter-10' },
    { nmId: 270937054, vendorCode: 'ter-13-1' },
  ]

  it('renders badge with correct product count', () => {
    render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={mockMergedProducts}
      />
    )

    expect(screen.getByText(/Склейка \(3\)/)).toBeInTheDocument()
    expect(screen.getByText('🔗')).toBeInTheDocument()
  })

  it('returns null for single product with imtId', () => {
    const { container } = render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={[{ nmId: 173588306, vendorCode: 'ter-09' }]}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  it('shows all products in tooltip on hover', async () => {
    const user = userEvent.setup()
    render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={mockMergedProducts}
      />
    )

    const badge = screen.getByText(/Склейка/)
    await user.hover(badge)

    // Wait for tooltip to appear
    expect(await screen.findByText(/Объединённая карточка #328632/)).toBeInTheDocument()
    expect(screen.getByText('ter-09')).toBeInTheDocument()
    expect(screen.getByText('ter-10')).toBeInTheDocument()
    expect(screen.getByText('ter-13-1')).toBeInTheDocument()
    expect(screen.getByText(/#173588306/)).toBeInTheDocument()
  })

  it('accepts custom label', () => {
    render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={mockMergedProducts}
        label="Группа из 3"
      />
    )

    expect(screen.getByText(/Группа из 3/)).toBeInTheDocument()
  })

  it('handles empty mergedProducts array', () => {
    const { container } = render(
      <MergedProductBadge
        imtId={328632}
        mergedProducts={[]}
      />
    )

    // Edge case: should return null for empty array
    expect(container.firstChild).toBeNull()
  })
})
```

### Usage Example (in PerformanceMetricsTable)

```typescript
import { MergedProductBadge } from '@/components/analytics/MergedProductBadge'

// Inside table row rendering:
{item.type === 'merged_group' && item.mergedProducts ? (
  <div className="flex items-center">
    <span className="font-medium">Группа #{item.imtId}</span>
    <MergedProductBadge
      imtId={item.imtId!}
      mergedProducts={item.mergedProducts}
    />
  </div>
) : (
  <span className="font-medium">
    {item.product_name || item.sku_id || 'N/A'}
  </span>
)}
```

## Testing Checklist

### Unit Tests
- [ ] Badge renders with correct count
- [ ] Badge returns null for single product
- [ ] Tooltip shows on hover
- [ ] All products listed in tooltip
- [ ] Custom label works
- [ ] Edge cases handled

### Integration Tests
- [ ] Component works in PerformanceMetricsTable
- [ ] Tooltip doesn't break table layout
- [ ] Badge styles match design system

### Visual Tests
- [ ] Badge color matches secondary variant
- [ ] Link emoji (🔗) visible
- [ ] Tooltip max-width prevents overflow
- [ ] Tooltip positioned correctly (side="right")

### Accessibility Tests
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] Screen reader announces "Склейка (3)"
- [ ] Tooltip has proper ARIA attributes

## Dependencies

- **UI Components**: Badge, Tooltip (shadcn/ui) - already available
- **Types**: Story 36.1 (MergedProduct interface)
- **Testing**: @testing-library/react, @testing-library/user-event

## Definition of Done

- [ ] Component created in `src/components/analytics/MergedProductBadge.tsx`
- [ ] Unit tests created with 100% coverage
- [ ] All acceptance criteria met
- [ ] Component handles all edge cases
- [ ] `npm run test` passes
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] Component documented with JSDoc
- [ ] Code review approved
- [ ] Story marked DONE

## Notes for PO Review

### Questions for PO

**Q1: Badge Icon**
Should we use:
- Option A: 🔗 (link emoji) - current proposal
- Option B: 📦 (package emoji)
- Option C: 🏷️ (label emoji)
- Option D: No emoji, just text

**Recommendation**: Option A (🔗) - visually represents "linking/merging"

**PO DECISION**: ✅ **APPROVED - Option A (🔗)** | Date: 2025-12-28 | PO: Sarah

**Q2: Badge Color**
Should merged group badge be:
- Option A: `variant="secondary"` (gray) - current proposal
- Option B: `variant="default"` (red primary)
- Option C: `variant="outline"` (transparent with border)

**Recommendation**: Option A (secondary) - neutral, doesn't compete with status badges

**PO DECISION**: ✅ **APPROVED - Option A (secondary/gray)** | Date: 2025-12-28 | PO: Sarah

**Q3: Tooltip Explanation Text**
Is this text clear and helpful?
> "💡 Рекламные затраты основной карточки распределены между всеми товарами группы"

Alternative:
> "💡 Все товары в группе используют один рекламный бюджет"

**Recommendation**: Current text - more technically accurate

**PO DECISION**: ✅ **APPROVED - Current text** (more technically accurate) | Date: 2025-12-28 | PO: Sarah

**Q4: Mobile Behavior**
On mobile (small screens), should tooltip:
- Option A: Show on tap (current shadcn/ui behavior)
- Option B: Show inline below badge (no tooltip)
- Option C: Hide badge completely on mobile

**Recommendation**: Option A - tap to show tooltip is mobile-friendly

**PO DECISION**: ✅ **APPROVED - Option A (tap to show)** | Date: 2025-12-28 | PO: Sarah

### Estimated Time

**Total**: 150 minutes (2.5 hours)
- Phase 1: 40 min (component)
- Phase 2: 20 min (badge logic)
- Phase 3: 30 min (tooltip)
- Phase 4: 40 min (tests)
- Phase 5: 20 min (storybook, optional)

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tooltip overflow | Medium | Low | max-w-xs class prevents overflow |
| Long product lists | Medium | Low | Scrollable content if needed |
| Mobile usability | Low | Medium | Tap to show tooltip (native behavior) |

---

**Document Version**: 1.1
**Created**: 2025-12-28
**Status**: ✅ **APPROVED - Ready for Development**
**PO Approval**: Sarah | 2025-12-28 22:45 MSK
**Dependencies**: Stories 36.1, 36.2
**Next Action**: Developer begins implementation after Stories 36.1-36.2 complete
