# Story 37.4: Visual Styling & Hierarchy

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 Draft - Awaiting PO Validation
**Effort**: 2-3 hours
**Priority**: Medium (Requires Stories 37.2-37.3 completion)
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 User Story

**As a** user viewing склейка analytics
**I want** clear visual distinction between aggregate and detail rows
**So that** I can quickly identify group-level metrics vs individual product metrics without confusion

---

## 📋 Acceptance Criteria

### Rowspan Cell Styling
- [ ] Background color: #FAFAFA (subtle gray)
- [ ] Right border: 2px solid #E5E7EB (medium gray)
- [ ] Text alignment: Center horizontally, middle vertically
- [ ] Font size: 0.875rem (14px)
- [ ] Font color: #6B7280 (gray-600)
- [ ] Font weight: 500 (medium)
- [ ] Padding: 16px vertical, 16px horizontal

### Aggregate Row Styling (Header)
- [ ] Background color: #F3F4F6 (gray-100)
- [ ] Font weight: 600 (semibold)
- [ ] Font size: 0.95rem (15.2px)
- [ ] Font color: #111827 (gray-900)
- [ ] Padding: 12px vertical, 16px horizontal
- [ ] Border bottom: 1px solid #E5E7EB

### Detail Row Styling (Products)
- [ ] Background color: #FFFFFF (white)
- [ ] Font weight: 400 (normal)
- [ ] Font size: 0.875rem (14px)
- [ ] Font color: #374151 (gray-700)
- [ ] Padding: 10px vertical, 16px horizontal
- [ ] Hover state: Background #F9FAFB (gray-50)

### Crown Icon (Main Product)
- [ ] Icon: Lucide `Crown` component
- [ ] Size: 16px × 16px
- [ ] Color: #CA8A04 (yellow-600)
- [ ] Position: Inline before nmId text
- [ ] Margin right: 4px
- [ ] Vertical alignment: Middle

### [PO TO FILL] Additional Styling
- [ ] [PO TO SPECIFY] Hover effect on aggregate row (clickable for collapse/expand)?
- [ ] [PO TO SPECIFY] Active/selected state for clicked products?
- [ ] [PO TO SPECIFY] Color-coding for ROAS tiers (green >2.0, yellow 1.0-2.0, red <1.0)?
- [ ] [PO TO SPECIFY] Zebra striping within detail rows?

---

## 🎨 Design Tokens (Tailwind CSS)

### Color Palette
```typescript
const designTokens = {
  rowspan: {
    background: 'bg-gray-50',      // #FAFAFA
    border: 'border-gray-200',     // #E5E7EB
    text: 'text-gray-600',         // #6B7280
  },
  aggregate: {
    background: 'bg-gray-100',     // #F3F4F6
    text: 'text-gray-900',         // #111827
    border: 'border-gray-200',     // #E5E7EB
  },
  detail: {
    background: 'bg-white',        // #FFFFFF
    text: 'text-gray-700',         // #374151
    hoverBg: 'bg-gray-50',         // #F9FAFB
  },
  crown: {
    color: 'text-yellow-600',      // #CA8A04
  },
};
```

### Typography Scale
```typescript
const typography = {
  rowspan: {
    size: 'text-sm',               // 0.875rem / 14px
    weight: 'font-medium',         // 500
  },
  aggregate: {
    size: 'text-[0.95rem]',        // 15.2px (custom)
    weight: 'font-semibold',       // 600
  },
  detail: {
    size: 'text-sm',               // 0.875rem / 14px
    weight: 'font-normal',         // 400
  },
};
```

### Spacing
```typescript
const spacing = {
  rowspan: {
    padding: 'px-4 py-4',          // 16px horizontal, 16px vertical
  },
  aggregate: {
    padding: 'px-4 py-3',          // 16px horizontal, 12px vertical
  },
  detail: {
    padding: 'px-4 py-2.5',        // 16px horizontal, 10px vertical
  },
  crown: {
    margin: 'mr-1',                // 4px right margin
    size: 'h-4 w-4',               // 16px × 16px
  },
};
```

---

## 🖥️ CSS Implementation

### Rowspan Cell
```tsx
<td
  rowSpan={totalRows}
  className={cn(
    // Layout
    'px-4 py-4',
    'text-center align-middle',

    // Visual
    'bg-gray-50',
    'border-r-2 border-gray-200',

    // Typography
    'text-sm font-medium text-gray-600',

    // Interaction (if clickable per PO decision)
    // 'cursor-pointer hover:bg-gray-100 transition-colors'
  )}
>
  <div className="space-y-1">
    <div className="font-medium">{group.mainProduct.nmId}</div>
    <div className="text-xs text-gray-500">
      + {group.productCount - 1} товаров
    </div>
  </div>
</td>
```

### Aggregate Row
```tsx
<tr className={cn(
  // Visual
  'bg-gray-100',
  'border-b border-gray-200',

  // Typography
  'text-[0.95rem] font-semibold text-gray-900',

  // Interaction (if clickable per PO decision)
  // 'cursor-pointer hover:bg-gray-200 transition-colors'
)}>
  <td className="px-4 py-3">ГРУППА #{group.imtId}</td>
  <td className="px-4 py-3 text-right">
    {formatCurrency(group.aggregateMetrics.totalSales)}
  </td>
  {/* ... more cells */}
</tr>
```

### Detail Row
```tsx
<tr className={cn(
  // Visual
  'bg-white',

  // Typography
  'text-sm font-normal text-gray-700',

  // Interaction
  'cursor-pointer hover:bg-gray-50 transition-colors',

  // [PO TO FILL] Active state
  // isSelected && 'bg-blue-50 border-l-4 border-blue-500'
)}>
  <td className="px-4 py-2.5">
    {product.isMainProduct && (
      <Crown className="inline h-4 w-4 text-yellow-600 mr-1" />
    )}
    {product.nmId}
  </td>
  {/* ... more cells */}
</tr>
```

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
- [ ] Full table width, all columns visible
- [ ] Rowspan cell width: 150px fixed
- [ ] Артикул column: 200px fixed
- [ ] Metric columns: Flexible, evenly distributed

### Tablet (768px - 1023px)
- [ ] Horizontal scroll enabled for table
- [ ] Rowspan cell and Артикул sticky on left
- [ ] Font size reduced to 0.8rem for compact view
- [ ] [PO TO FILL] Hide less critical columns (e.g., Органика)?

### Mobile (<768px)
- [ ] [PO TO FILL] Card layout instead of table?
- [ ] [PO TO FILL] Or horizontal scroll with minimum column widths?
- [ ] [PO TO FILL] Collapse aggregate row into expandable accordion?

### Implementation
```tsx
<div className={cn(
  // Responsive wrapper
  'overflow-x-auto',
  'md:overflow-x-visible',

  // Scrollbar styling
  'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'
)}>
  <table className={cn(
    'min-w-full',
    'border-collapse',

    // Responsive text sizing
    'text-sm md:text-base'
  )}>
    {/* ... table content */}
  </table>
</div>
```

---

## 🧪 Visual QA Checklist

### Layout
- [ ] Rowspan cell vertically centered across all spanned rows
- [ ] Aggregate row has full-width background color (no gaps)
- [ ] Detail rows align properly under aggregate row
- [ ] No horizontal scroll on desktop (≥1024px)
- [ ] Table columns evenly distributed

### Typography Hierarchy
- [ ] Aggregate row text noticeably bolder than detail rows
- [ ] Font size difference visible (0.95rem vs 0.875rem)
- [ ] Crown icon aligned with text baseline
- [ ] Percentage text color lighter than main value

### Color Consistency
- [ ] Rowspan cell background distinct but not jarring (#FAFAFA)
- [ ] Aggregate row background provides clear separation (#F3F4F6)
- [ ] Detail row hover state subtle and smooth (#F9FAFB)
- [ ] Crown icon color stands out (#CA8A04 yellow)

### Accessibility (WCAG 2.1 AA)
- [ ] Text contrast ≥4.5:1 (gray-900 on gray-100: ~10:1 ✓)
- [ ] Detail text contrast ≥4.5:1 (gray-700 on white: ~8:1 ✓)
- [ ] Rowspan text contrast ≥4.5:1 (gray-600 on gray-50: ~5:1 ✓)
- [ ] Focus indicators visible for keyboard navigation
- [ ] Crown icon has text alternative (aria-label="Главный товар")

---

## 🎯 Test Scenarios

### Test 1: Visual Hierarchy Clear
**Given**: Table with 3 groups (6 products, 3 products, 10 products)
**When**: User scrolls through table
**Then**:
- [ ] Aggregate rows immediately recognizable (bold, gray background)
- [ ] Detail rows visually subordinate (normal weight, white background)
- [ ] Rowspan cells create clear group boundaries

### Test 2: Crown Icon Visibility
**Given**: Group with 1 main product and 5 children
**When**: Table renders
**Then**:
- [ ] Crown icon visible next to main product nmId
- [ ] Icon color distinct (yellow-600)
- [ ] Icon size appropriate (not too large or small)
- [ ] Icon aligned with text baseline

### Test 3: Hover States
**Given**: User hovers over detail row
**When**: Mouse enters row
**Then**:
- [ ] Background color changes to gray-50
- [ ] Transition is smooth (transition-colors)
- [ ] Cursor changes to pointer
- [ ] [PO TO FILL] Aggregate row hover state if clickable?

### Test 4: Responsive Adaptation
**Given**: User resizes browser window
**When**: Width changes from 1400px → 800px → 400px
**Then**:
- [ ] Desktop: All columns visible, no scroll
- [ ] Tablet: Horizontal scroll, sticky left columns
- [ ] Mobile: [PO TO SPECIFY] Card layout or scroll?

---

## 📊 Browser Compatibility

### Minimum Requirements
- [ ] Chrome 90+ (rowspan support, Tailwind JIT)
- [ ] Firefox 88+ (same as Chrome)
- [ ] Safari 14+ (macOS/iOS)
- [ ] Edge 90+ (Chromium-based)

### Feature Support Verification
- [ ] `rowspan` attribute rendering correctly
- [ ] Tailwind custom font size (`text-[0.95rem]`) applied
- [ ] Lucide icon (`Crown`) displays properly
- [ ] CSS transitions smooth (hover states)
- [ ] Sticky positioning works on tablet (if implemented)

---

## 🐛 Edge Cases

### Edge Case 1: Very Long Product Names
**Scenario**: nmId = "super-long-product-name-2024-winter-collection-limited-edition"
**Issue**: Text overflow breaks rowspan cell layout
**Solution**: [PO TO FILL]
- Truncate with ellipsis (`text-ellipsis overflow-hidden`)?
- Wrap to multiple lines?
- Tooltip on hover with full name?

### Edge Case 2: Rowspan Cell Height Mismatch
**Scenario**: Aggregate row + 20 detail rows, rowspan cell not perfectly aligned
**Issue**: Browser rendering discrepancy (sub-pixel rounding)
**Solution**:
- Force integer heights with `h-[calc(theme(spacing.10)*20)]`?
- Accept minor visual imperfection (<1px)?

### Edge Case 3: Dark Mode (Future)
**Scenario**: User enables dark mode in browser/OS
**Issue**: Gray-50 background too bright, gray-900 text unreadable
**Solution**: [PO TO FILL]
- Implement dark mode variant classes (`dark:bg-gray-800`)?
- Defer to future story?
- Not supported in MVP?

---

## ✅ Definition of Done

- [ ] All CSS classes applied to rowspan cell, aggregate row, detail row
- [ ] Design tokens documented and implemented
- [ ] Crown icon integrated with correct sizing/color
- [ ] Responsive behavior tested on desktop, tablet, mobile
- [ ] Visual QA checklist completed (all items pass)
- [ ] Browser compatibility verified (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit: WCAG 2.1 AA compliance
- [ ] PO review: Visual design approved
- [ ] Screenshots captured and saved in `docs/stories/epic-37/screenshots/`
- [ ] Ready for Story 37.5 (testing & documentation)

---

## 📎 References

- **Epic 37 Mockup**: `docs/epics/epic-37-merged-group-table-display.md` - Visual mockup
- **Story 37.2**: `docs/stories/epic-37/story-37.2-merged-group-table-component.md` - Component structure
- **Tailwind Docs**: https://tailwindcss.com/docs - Color palette, typography
- **Lucide Icons**: https://lucide.dev/icons/crown - Crown icon reference
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/ - Accessibility standards

---

## 🎯 Next Steps

1. **Frontend dev**: Apply CSS classes to MergedGroupTable component
2. **Visual QA**: Compare rendered table to Epic 37 mockup
3. **Responsive test**: Test on 3 viewports (1400px, 800px, 400px)
4. **Accessibility audit**: Run axe DevTools, fix violations
5. **PO review**: Demo visual design, get approval
6. **Screenshots**: Capture before/after for documentation
7. **Story 37.5**: Continue to testing & documentation

---

**Story Owner**: [TO BE ASSIGNED]
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
