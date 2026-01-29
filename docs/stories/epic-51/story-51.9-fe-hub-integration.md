# Story 51.9-FE: Analytics Hub Integration

## Story Info

- **Epic**: 51-FE - FBS Historical Analytics UI (365 Days)
- **Sprint**: 6
- **Priority**: P1 (Core Feature)
- **Points**: 1 SP
- **Status**: Ready for Dev
- **Dependencies**: Story 51.8 (FBS Analytics Page)

---

## User Story

**As a** WB seller navigating the analytics dashboard,
**I want** to see FBS Orders analytics in the Analytics Hub,
**So that** I can easily discover and access the new FBS analytics feature.

---

## Background

The Analytics Hub (`/analytics`) serves as the central navigation point for all analytics features. This story adds a new card for "FBS Orders Analytics" (Заказы FBS) that links to the analytics page built in Story 51.8.

**Route**: `/analytics` (existing hub page)
**Target Route**: `/analytics/orders` (from Story 51.8)

---

## Acceptance Criteria

### AC1: Hub Card Addition

- [ ] Add new card to Analytics Hub grid
- [ ] Card title: "Заказы FBS"
- [ ] Card description: "Анализ заказов FBS за 365 дней: тренды, сезонность, сравнение периодов"
- [ ] Card icon: ShoppingCart or Package icon
- [ ] Card links to `/analytics/orders`

### AC2: Card Styling

- [ ] Card uses consistent styling with other hub cards
- [ ] Purple accent color (consistent with FBS theme)
- [ ] Hover state with subtle elevation
- [ ] Responsive grid layout maintained

### AC3: Card Position

- [ ] Card positioned logically in the hub grid
- [ ] Consider placing near other order/sales related cards
- [ ] Mobile responsive - card spans full width on small screens

### AC4: Navigation

- [ ] Click on card navigates to `/analytics/orders`
- [ ] Keyboard accessible (Enter/Space to activate)
- [ ] Link includes proper ARIA label

### AC5: Feature Flag (Optional)

- [ ] Consider feature flag for gradual rollout
- [ ] If disabled, card is hidden from hub
- [ ] Feature flag: `features.fbsAnalytics.enabled`

---

## Technical Details

### Files to Modify

```
src/app/(dashboard)/analytics/page.tsx  # Add FBS card
src/config/features.ts                  # Add feature flag (optional)
src/lib/routes.ts                       # Ensure ANALYTICS.ORDERS route exists
```

### Card Data Structure

```typescript
const analyticsCards = [
  // ... existing cards
  {
    id: 'fbs-orders',
    title: 'Заказы FBS',
    description: 'Анализ заказов FBS за 365 дней: тренды, сезонность, сравнение периодов',
    href: ROUTES.ANALYTICS.ORDERS,
    icon: ShoppingCart,
    color: 'purple',
    badge: 'Новое', // Optional "New" badge
  },
]
```

### Route Addition

```typescript
// src/lib/routes.ts
export const ROUTES = {
  ANALYTICS: {
    // ... existing routes
    ORDERS: '/analytics/orders',
  },
}
```

---

## UI/UX Specifications

### Card Layout

```
+------------------------------------------+
|  [ShoppingCart Icon]                     |
|                                          |
|  Заказы FBS                    [Новое]   |
|                                          |
|  Анализ заказов FBS за 365 дней:         |
|  тренды, сезонность, сравнение периодов  |
|                                          |
+------------------------------------------+
```

### Colors

- Icon background: `bg-purple-100`
- Icon color: `text-purple-600`
- Border hover: `hover:border-purple-300`
- Badge (if used): `bg-purple-100 text-purple-800`

---

## Testing Requirements

### Unit Tests

- [ ] Card renders with correct content
- [ ] Card links to correct route
- [ ] Feature flag hides card when disabled

### Manual Testing

- [ ] Navigate to Analytics Hub
- [ ] Verify FBS Orders card is visible
- [ ] Click card navigates to `/analytics/orders`
- [ ] Keyboard navigation works
- [ ] Responsive layout on mobile

---

## Definition of Done

- [ ] Code complete and committed
- [ ] Card visible in Analytics Hub
- [ ] Navigation to FBS Analytics works
- [ ] Code reviewed and approved
- [ ] No TypeScript errors
- [ ] Responsive design verified

---

## Related Stories

- Story 51.8: FBS Analytics Page (dependency)
- Epic 51-FE: FBS Historical Analytics UI

---

## Notes

- Simple integration story - primarily adding a card to existing hub
- Consider "New" badge to highlight the feature initially
- Badge can be removed in future iteration
