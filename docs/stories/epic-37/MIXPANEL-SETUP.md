# Mixpanel Analytics Setup - Epic 37

**Date**: 2026-01-02
**Story**: 37.5 - Testing & Documentation (AC 11)
**Status**: ✅ IMPLEMENTED

---

## Overview

Mixpanel analytics integration for tracking user interactions in the Advertising Analytics feature (Epic 37: Merged Groups Table).

---

## Configuration

### Environment Variable

Add to `.env.local`:

```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_project_token
```

**To get token**:
1. Log in to [Mixpanel](https://mixpanel.com)
2. Go to Settings → Project Settings
3. Copy the "Token" value

**If token is not set**: Events are logged to browser console in development mode (no data sent to Mixpanel).

---

## Tracked Events

### 1. Page View - Advertising Analytics

**Event Name**: `Page View - Advertising Analytics`

**Triggered**: When user navigates to advertising page or changes view mode

**Properties**:
| Property | Type | Description |
|----------|------|-------------|
| `view_mode` | `'sku' \| 'imtId'` | Current grouping mode |
| `timestamp` | `string` | ISO 8601 timestamp |

---

### 2. Toggle Mode Switch

**Event Name**: `Advertising Analytics - Toggle Mode`

**Triggered**: When user switches between SKU and Merged Groups view

**Properties**:
| Property | Type | Description |
|----------|------|-------------|
| `mode` | `'sku' \| 'imtId'` | New mode |
| `previous_mode` | `'sku' \| 'imtId'` | Previous mode |
| `timestamp` | `string` | ISO 8601 timestamp |

---

### 3. Table Sort

**Event Name**: `Advertising Analytics - Sort Table`

**Triggered**: When user clicks column header to sort

**Properties**:
| Property | Type | Description |
|----------|------|-------------|
| `column` | `string` | Column being sorted (e.g., 'spend', 'roas') |
| `direction` | `'asc' \| 'desc'` | Sort direction |
| `view_mode` | `'sku' \| 'imtId'` | Current view mode |
| `timestamp` | `string` | ISO 8601 timestamp |

---

### 4. Row Click

**Event Name**: `Advertising Analytics - Row Click`

**Triggered**: When user clicks on a product row

**Properties**:
| Property | Type | Description |
|----------|------|-------------|
| `nmId` | `number` | Product article number |
| `groupId` | `number \| null` | IMT ID if in merged view |
| `is_main_product` | `boolean` | Whether clicked row is main product |
| `view_mode` | `'sku' \| 'imtId'` | Current view mode |
| `timestamp` | `string` | ISO 8601 timestamp |

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/mixpanel.ts` | Mixpanel initialization and safe wrapper |
| `src/lib/analytics-events.ts` | Type-safe event tracking functions |
| `src/app/(dashboard)/analytics/advertising/page.tsx` | Event tracking integration |

---

## Privacy Considerations

- **No PII tracked**: Events do not contain personal information
- **Respects DNT**: `ignore_dnt: false` in config (respects browser Do Not Track)
- **User consent**: Analytics disabled by default (requires token to activate)
- **Data residency**: Mixpanel EU data residency available if needed

---

## Validation

### Development Mode

1. Open browser DevTools → Console
2. Navigate to Advertising Analytics page
3. Perform actions (toggle, sort, click)
4. See `[Analytics]` log messages with event data

### Production Validation

1. Log in to [Mixpanel Dashboard](https://mixpanel.com)
2. Navigate to project
3. Go to **Events** → **Live View**
4. Perform actions in app
5. Verify events appear within 10 seconds

---

## Mixpanel Queries

### Feature Adoption Rate

```
Event: "Advertising Analytics - Toggle Mode"
Filter: mode = "imtId"
Group by: week
Metric: Unique users
```

### Most Used Sort Columns

```
Event: "Advertising Analytics - Sort Table"
Group by: column
Metric: Total count
```

### User Funnel

```
Steps:
1. "Page View - Advertising Analytics" (view_mode = "sku")
2. "Advertising Analytics - Toggle Mode" (mode = "imtId")
3. "Advertising Analytics - Row Click"
```

---

## Report Version

- **Implementation Date**: 2026-01-02
- **Status**: ✅ Infrastructure complete, awaiting token configuration
- **Events Implemented**: 4 of 4
