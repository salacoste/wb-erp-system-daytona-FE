# Epic 42-FE: UI Wireframes & Mockups

**Epic:** 42-FE Task Handlers Adaptation
**Date:** 2026-01-17
**Designer:** UX Agent (Sally)
**Status:** Draft

---

## Overview

Epic 42-FE is primarily a **technical adaptation** epic with minimal UI changes. Only the optional Stories 42.2-FE and 42.3-FE require UI components.

**Required UI Components:**
1. `MissingCogsAlert` — Alert banner for products without COGS
2. Sanity Check results display (optional, can be inline with existing alerts)

**No new pages required** — components integrate into existing pages.

---

## Design System Reference

### Colors
| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Red | `#E53935` | Main brand color | CTAs, important actions |
| Amber/Warning | `#F59E0B` | `border-amber-500` | Warning alerts (non-critical) |
| Amber Background | `#FEF3C7` | `bg-amber-50` | Alert background |
| Amber Text | `#92400E` | `text-amber-900` | Alert text |

### Icons (Lucide React)
- `AlertTriangle` — Warning icon
- `X` — Close/dismiss
- `ArrowRight` — Action link indicator

### Components Base
- shadcn/ui `Alert` component
- shadcn/ui `Badge` component
- shadcn/ui `Button` component
- shadcn/ui `Tooltip` component

---

## Wireframe 1: MissingCogsAlert Component

### Purpose
Alert banner displayed when products are missing COGS assignment. Shows count, preview, and actionable link.

### Placement Options

**Option A: Dashboard Page (Main Dashboard)**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] WB Repricer          [User Avatar]                       │
├─────────────────────────────────────────────────────────────────┤
│  Sidebar                                                     Main│
│  ├ Dashboard    ┌─────────────────────────────────────────────┐ │
│  ├ Analytics   │ │ ⚠️  Товары без себестоимости                 │ │
│  ├ COGS        │ │                                             │ │
│  ├ Settings    │ │ [45 товаров] без назначенной себестоимости.  │ │
│  │             │ │ Маржа не рассчитывается.                    │ │
│  │             │ │                                             │ │
│  │             │ │ [Назначить COGS →]                          │ │
│  │             │ │ [×]                                         │ │
│  │             ├─────────────────────────────────────────────┤ │
│  │             │ │                                             │ │
│  │             │ │  [KPI Cards...]                            │ │
│  │             │ │                                             │ │
│  └─────────────┴─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Option B: COGS Management Page**
```
┌─────────────────────────────────────────────────────────────────┐
│  COGS Management                                 [Cabinet Select]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️  Товары без себестоимости                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ [45 товаров] без назначенной себестоимости.               │  │
│  │ Маржа не рассчитывается.                                  │  │
│  │                                                          │  │
│  │ [Назначить COGS →]                          [×]          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  [+ Single]  [Bulk Assign]  [Import]   [Filter ▼]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Product List Table...                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Detail Specification

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚠️  Товары без себестоимости                              [Close ×] │
│                                                                     │
│  [45] товаров без назначенной себестоимости.                       │
│  Маржа не рассчитывается.                                          │
│                                                                     │
│  Info: First 100 nm_ids shown in tooltip                            │
│                                                                     │
│  [Назначить COGS →]                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

**Desktop (≥768px):** Single row, button on right
```
[Badge] Description text (flex-grow) [Action Button] [×]
```

**Mobile (<768px):** Stacked vertically
```
[Badge] [×]
Description text
[Action Button] (full width)
```

### States

| State | Display | Notes |
|-------|---------|-------|
| **Visible** | Full alert shown | `missingCount > 0` |
| **Dismissed** | Hidden for session | Click ×, session-only |
| **Hidden** | No alert rendered | `missingCount = 0` |
| **Loading** | Alert with spinner | Sanity check in progress |

---

## Wireframe 2: Tooltip Product Preview

### Purpose
Shows first 5 products without COGS when hovering over the badge.

### Layout

```
┌─────────────────────────────────────────┐
│  Артикулы без COGS:                     │
│  • 12345678                              │
│  • 23456789                              │
│  • 34567890                              │
│  • 45678901                              │
│  • 56789012                              │
│  ... и ещё 95                            │
│  Всего: 100 (показаны первые 100)       │
└─────────────────────────────────────────┘
```

### Behavior
- Trigger: Hover/click on badge
- Position: Below badge, left-aligned
- Max width: 200px
- Z-index: 50 (above other content)

---

## Wireframe 3: Dashboard Integration (Full Flow)

### Sanity Check Trigger Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Main Dashboard                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User navigates to dashboard → useSanityCheck() auto-runs →    │
│  Result cached for 5 minutes                                    │
│                                                                 │
│  IF missing_cogs_total > 0:                                      │
│    ┌─────────────────────────────────────────────────────────┐   │
│    │  ⚠️  [45 товаров] без себестоимости.                  │   │
│    │  Маржа не рассчитывается.                              │   │
│    │  [Назначить COGS →]                           [×]       │   │
│    └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ELSE:                                                           │
│    (No alert shown)                                              │
│                                                                 │
│  [KPI Cards: Revenue, Margin, Payout...]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Manual Check Trigger (Settings Page - Optional Future)

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings > Data Quality                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Data Quality Validation                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Last check: 2 minutes ago                                 │  │
│  │  Status: 142 checks passed, 3 warnings                    │  │
│  │                                                          │  │
│  │  [Run Check Again]                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Warnings:                                                       │
│  • 45 products missing COGS                                     │
│  • 2 products have negative margin                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
MissingCogsAlert (new component)
├── shadcn/ui Alert
│   ├── AlertTriangle (Lucide icon)
│   ├── AlertTitle
│   │   ├── Text
│   │   └── Button (dismiss)
│   └── AlertDescription
│       ├── Badge (count display)
│       ├── Tooltip (product preview)
│       │   └── TooltipContent
│       │       └── Product list (ul > li)
│       ├── Text (description)
│       └── Button (action)
│           └── Link (Next.js)
```

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | Amber text on amber background meets WCAG AA |
| Keyboard navigation | Tab through alert, Enter on action button |
| Screen reader | ARIA labels on icon buttons |
| Touch targets | Min 44×44px for buttons |
| Focus visible | Amber border on focus |

---

## Interaction Specifications

### Dismiss Behavior
- Click × → alert hides for current session
- Session storage key: `missing-cogs-alert-dismissed`
- Re-show on: Page refresh (if not in session), manual check

### Action Link Behavior
- Click "Назначить COGS" → Navigate to `/cogs?has_cogs=false`
- Filter applied automatically on target page

### Auto-check Behavior
- Dashboard: Trigger on mount, cache 5 min
- COGS page: Trigger on mount, cache 5 min
- Manual: Trigger on button click

---

## Design Tokens

```css
--alert-missing-cogs-bg: theme(colors.amber.50);
--alert-missing-cogs-border: theme(colors.amber.500);
--alert-missing-cogs-text: theme(colors.amber.900);
--alert-missing-cogs-text-muted: theme(colors.amber.700);
--alert-missing-cogs-hover: theme(colors.amber.100);
```

---

## Integration Points

### Existing Files to Update

| File | Change | Type |
|------|--------|------|
| `src/app/(dashboard)/page.tsx` | Add `MissingCogsAlert` | Update |
| `src/app/(dashboard)/cogs/page.tsx` | Add `MissingCogsAlert` | Update |
| `src/components/custom/Sidebar.tsx` | No change needed | — |

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/custom/MissingCogsAlert.tsx` | Alert component |
| `src/hooks/useSanityCheck.ts` | Sanity check hook (42.2-FE) |
| `src/types/tasks.ts` | Task-related types (42.1-FE) |

---

## Excalidraw-ready Descriptions

### Shape 1: Alert Banner (Desktop)
- Rectangle: 100% width, ~80px height
- Background: Amber-50 (#FEF3C7)
- Border: 2px solid Amber-500 (#F59E0B)
- Border-radius: 6px (md)
- Padding: 16px

### Shape 2: Badge
- Pill shape: ~80px × 24px
- Background: Transparent
- Border: 1px solid Amber-600 (#D97706)
- Text: "{count} товаров"

### Shape 3: Action Button
- Rectangle: ~140px × 36px
- Border: 1px solid Amber-600
- Text: "Назначить COGS →"

---

## Notes for Developer

1. **Pluralization**: Use Russian rules (товар/товара/товаров)
2. **Preview limit**: Show first 5 in tooltip, "и ещё N" for remaining
3. **Cache sanity check**: 5 minutes to avoid excessive API calls
4. **Session-only dismiss**: Don't persist to localStorage (data may change)
5. **Z-index**: 50 to stay above other dashboard elements

---

## Related Documents

- Story 42.2-FE: `docs/stories/epic-42/story-42.2-fe-sanity-check-hook.md`
- Story 42.3-FE: `docs/stories/epic-42/story-42.3-fe-missing-cogs-alert.md`
- Epic 42: `docs/epics/epic-42-fe-task-handlers-adaptation.md`
- Frontend Spec: `docs/front-end-spec.md`
- Similar Pattern: Epic 24 Story 24.8 (High Ratio Alert)

---

*Wireframes created for Epic 42-FE implementation*
*Last Updated: 2026-01-17*
