# Story 61.11-FE: Fix Zero Margin Displaying as Dash Instead of 0%

**Epic**: 61-FE Dashboard Data Integration
**Status**: 📋 Ready for Dev
**Priority**: P1 (High)
**Estimate**: 2 SP

---

## Title

Исправить отображение нулевой маржи (0% отображается как "—" вместо "0%")

---

## Problem Statement

When margin equals exactly 0%, the UI displays "—" (no data) instead of "0%".

**User Impact**:
- User sees "—" when margin is actually 0%
- This is misleading - user thinks there is no data available
- Zero margin is valid business data that should be clearly displayed

**Root Cause**: JavaScript treats `0` as falsy in boolean context:

```javascript
// WRONG (current anti-pattern):
if (!grossProfit) return null  // 0 is falsy, so this returns null!
if (!revenue) return null      // Same problem

// CORRECT (should be):
if (grossProfit == null) return null  // 0 passes through
if (revenue === 0) return null        // Explicit check for division by zero
```

---

## Technical Analysis

### JavaScript Falsy Values Problem

```javascript
// These are all falsy in JavaScript:
!0         // true  ← PROBLEM: 0 is valid data
!null      // true  ← correct: null means no data
!undefined // true  ← correct: undefined means no data
!''        // true  ← string context
!NaN       // true  ← invalid number

// Proper null checking:
0 == null         // false ← 0 is NOT null
0 === null        // false
null == null      // true
undefined == null // true (loose equality)
```

### Affected Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `!value` | `!0` returns `true` | `value == null` |
| `value && format(value)` | `0 && format(0)` returns `0` | `value != null && format(value)` |
| `value ? format(value) : '—'` | `0 ? x : y` returns `y` | `value != null ? format(value) : '—'` |
| `value || '—'` | `0 || '—'` returns `'—'` | `value ?? '—'` (nullish coalescing) |

---

## Scope of Work

### Files to Audit

Based on codebase analysis, these files need review:

| File | Pattern Found | Risk |
|------|---------------|------|
| `src/components/custom/PnLWaterfall.tsx` | `grossProfit && grossProfit > 0` (line 668, 680) | Medium - affects profit indicator |
| `src/components/custom/FinancialSummaryTable.tsx` | `grossProfit !== null` | OK - correct pattern |
| `src/components/custom/MarginDisplay.tsx` | `marginPct !== null && marginPct !== undefined` | OK - correct pattern |
| `src/components/custom/ProductMarginCell.tsx` | `typeof product.current_margin_pct === 'number'` | OK - correct pattern |
| `src/components/custom/MarginTrendChart.tsx` | `margin_pct !== null && margin_pct !== undefined` | OK - correct pattern |
| `src/components/custom/MarginBySkuTable.tsx` | `profit !== null` | OK - correct pattern |
| `src/lib/analytics-utils.ts` | `value === null || value === undefined` | OK - correct pattern |

### Known Issues in PnLWaterfall.tsx

Lines 668 and 680:
```typescript
// CURRENT (needs review):
highlight={grossProfit && grossProfit > 0 ? 'positive' : 'negative'}
{grossProfit && grossProfit > 0 ? (

// CORRECT behavior for this case:
// When grossProfit = 0, it should show 'neutral' or specific zero state
// When grossProfit = null, it should not render
```

**Note**: The current logic in PnLWaterfall.tsx is **intentional** for profit categorization:
- Positive profit → green
- Zero profit → shows as negative (which might be acceptable for profit)
- Null profit → hidden

This may be **by design** since zero profit is arguably not "positive". Document decision.

---

## Acceptance Criteria

### AC1: Zero Margin Displays as "0%"
- [ ] When `margin_pct = 0`, display "0,00%" (Russian locale)
- [ ] When `margin_pct = 0`, use neutral color (gray) not positive/negative

### AC2: Null/Undefined Shows Dash
- [ ] When `margin_pct = null`, display "—"
- [ ] When `margin_pct = undefined`, display "—"

### AC3: Negative Zero Edge Case
- [ ] When `margin_pct = -0`, treat as `0` and display "0,00%"
- [ ] `Object.is(-0, 0)` returns `false`, but should display same

### AC4: Color Coding for Zero
- [ ] Zero margin uses neutral color (gray-500 or similar)
- [ ] Not green (positive) or red (negative)
- [ ] Consistent across all components

### AC5: Type Safety
- [ ] All margin/profit checks use `!= null` pattern
- [ ] No `!value` pattern for numeric values
- [ ] ESLint rule consideration: `@typescript-eslint/strict-boolean-expressions`

---

## Technical Implementation

### Pattern 1: Simple Null Check

```typescript
// BEFORE:
if (!margin) return '—'

// AFTER:
if (margin == null) return '—'
```

### Pattern 2: Conditional Rendering

```typescript
// BEFORE:
{margin && <MarginDisplay value={margin} />}

// AFTER:
{margin != null && <MarginDisplay value={margin} />}
```

### Pattern 3: Ternary with Default

```typescript
// BEFORE:
const display = margin ? formatPercent(margin) : '—'

// AFTER:
const display = margin != null ? formatPercent(margin) : '—'
```

### Pattern 4: Nullish Coalescing (for defaults)

```typescript
// BEFORE:
const value = margin || 0  // 0 || 0 = 0, but NaN || 0 = 0 too

// AFTER:
const value = margin ?? 0  // null/undefined → 0, 0 → 0
```

### Pattern 5: Type Guard Function

```typescript
// Reusable type guard
function hasValue(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && Number.isFinite(value)
}

// Usage:
if (hasValue(margin)) {
  return formatPercent(margin)
}
return '—'
```

### Reference Implementation (MarginDisplay.tsx)

This file already has correct pattern:
```typescript
// src/components/custom/MarginDisplay.tsx:65-68
if (marginPct !== null && marginPct !== undefined) {
  const isPositive = marginPct > 0
  const isZero = marginPct === 0
  const colorClass = isZero ? 'text-gray-600' : isPositive ? 'text-green-600' : 'text-red-600'
```

---

## Test Cases

### Unit Tests

```typescript
describe('Zero margin display', () => {
  // AC1: Zero displays as percentage
  it('displays 0% when margin is exactly 0', () => {
    render(<MarginDisplay marginPct={0} />)
    expect(screen.getByText('0,00%')).toBeInTheDocument()
  })

  // AC2: Null displays as dash
  it('displays dash when margin is null', () => {
    render(<MarginDisplay marginPct={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('displays dash when margin is undefined', () => {
    render(<MarginDisplay marginPct={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  // AC3: Negative zero edge case
  it('displays 0% when margin is negative zero', () => {
    render(<MarginDisplay marginPct={-0} />)
    expect(screen.getByText('0,00%')).toBeInTheDocument()
  })

  // AC4: Color coding
  it('uses neutral color for zero margin', () => {
    render(<MarginDisplay marginPct={0} />)
    const element = screen.getByText('0,00%')
    expect(element).toHaveClass('text-gray-600')
  })

  it('uses green color for positive margin', () => {
    render(<MarginDisplay marginPct={25.5} />)
    const element = screen.getByText('25,50%')
    expect(element).toHaveClass('text-green-600')
  })

  it('uses red color for negative margin', () => {
    render(<MarginDisplay marginPct={-10} />)
    const element = screen.getByText('-10,00%')
    expect(element).toHaveClass('text-red-600')
  })

  // Edge cases
  it('handles very small positive margin', () => {
    render(<MarginDisplay marginPct={0.001} />)
    expect(screen.getByText('0,00%')).toBeInTheDocument()
    expect(screen.getByText('0,00%')).toHaveClass('text-green-600')
  })

  it('handles NaN gracefully', () => {
    render(<MarginDisplay marginPct={NaN} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('handles Infinity gracefully', () => {
    render(<MarginDisplay marginPct={Infinity} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
```

### Integration Tests

```typescript
describe('Dashboard zero margin integration', () => {
  it('shows 0% in SKU analytics when margin is zero', async () => {
    const mockData = { margin_pct: 0, revenue: 1000, cogs: 1000 }
    server.use(rest.get('/v1/analytics/*', (req, res, ctx) => res(ctx.json(mockData))))

    render(<SkuAnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('0,00%')).toBeInTheDocument()
    })
  })

  it('shows dash when margin data is missing', async () => {
    const mockData = { margin_pct: null, revenue: 1000, cogs: null }
    server.use(rest.get('/v1/analytics/*', (req, res, ctx) => res(ctx.json(mockData))))

    render(<SkuAnalyticsPage />)
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })
})
```

---

## Verification Checklist

1. [ ] Search codebase for `!margin`, `!profit`, `!grossProfit` patterns
2. [ ] Search for `value && format` patterns with numeric values
3. [ ] Search for `value ? x : '—'` patterns with numeric values
4. [ ] Verify MarginDisplay component handles 0 correctly
5. [ ] Verify ProductMarginCell handles 0 correctly
6. [ ] Verify FinancialSummaryTable handles 0 correctly
7. [ ] Verify MarginTrendChart tooltip handles 0 correctly
8. [ ] Verify MarginBySkuTable handles 0 correctly
9. [ ] Run full test suite
10. [ ] Manual verification with mock data

---

## Search Commands for Audit

Run these commands to find potential issues:

```bash
# Find !value patterns for numeric variables
grep -rn '\!margin\|!profit\|!revenue\|!grossProfit' src/

# Find value && patterns that might fail on 0
grep -rn 'margin &&\|profit &&\|revenue &&' src/

# Find ternary patterns with dash fallback
grep -rn "margin.*\? .*: '—'\|profit.*\? .*: '—'" src/

# Find || patterns that might fail on 0
grep -rn "margin ||\|profit ||" src/
```

---

## Definition of Done

- [ ] All identified problematic patterns fixed
- [ ] Unit tests for zero margin display added
- [ ] Integration tests verify end-to-end behavior
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] Manual verification with margin = 0 data
- [ ] Code review approved
- [ ] Documentation updated if needed

---

## Related Stories

- Story 61.1-FE: Fix Revenue Field Mapping (same epic)
- Story 61.2-FE: Fix Gross Profit Formula (related margin calculations)

---

## References

- JavaScript Equality: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
- Nullish Coalescing: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
- TypeScript strict-boolean-expressions: https://typescript-eslint.io/rules/strict-boolean-expressions/
