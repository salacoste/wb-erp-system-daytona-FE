# User Guide: Merged Product Groups (Склейки)

**Epic 37: Merged Group Table Display**
**Last Updated**: 2025-12-29
**For Users**: Wildberries sellers using advertising analytics

---

## Table of Contents

1. [What are Склейки (Merged Product Groups)?](#what-are-склейки)
2. [How to View Merged Groups](#how-to-view-merged-groups)
3. [Understanding the Table Structure](#understanding-the-table-structure)
4. [Reading the Metrics](#reading-the-metrics)
5. [Main vs Child Products](#main-vs-child-products)
6. [Sorting and Filtering](#sorting-and-filtering)
7. [Mobile Usage](#mobile-usage)
8. [Troubleshooting](#troubleshooting)

---

## What are Склейки (Merged Product Groups)?

**Склейка** (merged product group) is Wildberries' term for **merged product cards** — a single product listing that combines multiple SKUs (article numbers) into one unified card.

### Why do merged groups exist?

- **Single Product Visibility**: Show one product card instead of multiple variants (sizes, colors, packs)
- **Shared Advertising Budget**: All variants share the same advertising campaign and spend
- **Unified Customer Experience**: Buyers see one card with all variants available

### Example

```
🔗 Склейка (Group #12345) - "Organic Mango Tea Blend"
   ├─ 👑 ter-09 (Main product, 500g pack)    ← Advertising spend assigned here
   ├─ ter-10 (Child variant, 250g pack)      ← No direct ad spend
   ├─ ter-11 (Child variant, 1kg pack)       ← No direct ad spend
   └─ ter-12 (Child variant, 3-pack bundle)  ← No direct ad spend
```

**Key Point**: Only the **main product** (👑) has direct advertising spend. Child products benefit from the group's advertising without individual budgets.

---

## How to View Merged Groups

### Step 1: Navigate to Advertising Analytics

1. Log in to your WB Repricer dashboard
2. Click **Analytics** → **Advertising** in the main navigation

### Step 2: Switch to Merged Groups View

Look for the toggle buttons at the top of the page:

```
[ По артикулам ]  [ По склейкам ]
   (By SKU)         (By Merged Groups)
```

- **По артикулам** (default): Shows individual SKUs separately
- **По склейкам**: Shows merged product groups with aggregate metrics

**Click "По склейкам"** to view merged groups.

### Step 3: URL Update

After clicking, the URL will change to include `group_by=imtId`:

```
https://your-domain.com/analytics/advertising?group_by=imtId
```

This allows you to **bookmark** the merged groups view for quick access.

---

## Understanding the Table Structure

The merged groups table has **3 tiers** (levels) of information:

### Tier 1: Group Identifier (Gray Column, Left Side)

```
┌─────────────┐
│ ГРУППА #123 │  ← Rowspan cell: Group ID
│             │     (spans all rows in group)
└─────────────┘
```

- **Color**: Light gray background
- **Position**: Far left, vertically centered
- **Content**: `ГРУППА #[imtId]` for merged groups, or `ter-XX` for standalone products

### Tier 2: Aggregate Row (Light Gray Background)

```
┌───────────┬──────────┬──────────┬──────────┬──────┬──────┐
│ ГРУППА #1 │ 35 570 ₽ │ 10 234 ₽ │ 25 336 ₽ │ 71.2%│ 0.90 │ ← Aggregate totals
└───────────┴──────────┴──────────┴──────────┴──────┴──────┘
```

- **Purpose**: Shows **group-level totals** (sum of all products in group)
- **Font**: Semibold, slightly larger (15.2px)
- **Background**: Light gray (#F3F4F6)

**Metrics Shown**:

- Total Sales (all products combined)
- Revenue (advertising attribution)
- Organic Sales (sales without ads)
- Organic Contribution % (organic as % of total)
- Total Spend (sum of all ad spend)
- ROAS (Return on Ad Spend)

### Tier 3: Detail Rows (White Background)

```
┌───────────┬─────────────┬──────────┬──────────┬──────────┬──────┬──────┐
│           │ 👑 ter-09   │ 15 000 ₽ │  4 000 ₽ │ 11 000 ₽ │ 73.3%│ 0.67 │ ← Main product
│ ГРУППА #1 ├─────────────┼──────────┼──────────┼──────────┼──────┼──────┤
│           │    ter-10   │  8 500 ₽ │  2 300 ₽ │  6 200 ₽ │ 72.9%│  —   │ ← Child product
│           ├─────────────┼──────────┼──────────┼──────────┼──────┼──────┤
│           │    ter-11   │  4 670 ₽ │  1 234 ₽ │  3 436 ₽ │ 73.6%│  —   │ ← Child product
└───────────┴─────────────┴──────────┴──────────┴──────────┴──────┴──────┘
```

- **Purpose**: Shows **individual product metrics** within each group
- **Font**: Regular weight, standard size (14px)
- **Background**: White
- **Hover Effect**: Smooth transition to light gray on mouse hover

---

## Reading the Metrics

### Aggregate Row Metrics (Group-Level)

| Column            | Meaning                               | Formula                           | Example  |
| ----------------- | ------------------------------------- | --------------------------------- | -------- |
| **Total Sales**   | Gross sales for all products in group | SUM(each product's totalSales)    | 35 570 ₽ |
| **Revenue**       | Sales attributed to advertising       | SUM(each product's revenue)       | 10 234 ₽ |
| **Organic Sales** | Sales without advertising             | totalSales - revenue              | 25 336 ₽ |
| **Organic %**     | Percent of sales that are organic     | (organicSales / totalSales) × 100 | 71.2%    |
| **Spend**         | Total advertising spend for group     | SUM(main product spend only)      | 11 337 ₽ |
| **ROAS**          | Return on ad spend                    | revenue / spend                   | 0.90     |

### Detail Row Metrics (Individual Products)

- **Same columns** as aggregate row, but for individual product
- **Main product** (👑): Has advertising spend > 0
- **Child products**: Have spend = 0, ROAS shows "—" (dash)

### Interpreting ROAS

- **ROAS > 1.0**: Profitable (earning more than spending)
  - Example: ROAS = 1.5 means 1.50₽ revenue per 1₽ spent
- **ROAS = 0.5-1.0**: Break-even or slight loss
  - Example: ROAS = 0.9 means 0.90₽ revenue per 1₽ spent (10% loss)
- **ROAS = —** (dash): No advertising spend (child product)

### Color-Coded ROAS (Visual Indicator)

```
🟢 Green: ROAS ≥ 1.5   (Excellent profitability)
🟡 Yellow: ROAS 1.0-1.5 (Profitable)
🟠 Orange: ROAS 0.5-1.0 (Break-even/slight loss)
🔴 Red: ROAS < 0.5     (Significant loss)
```

---

## Main vs Child Products

### How to Identify the Main Product

1. **Crown Icon**: 👑 appears before the nmId (article number)
2. **Advertising Spend**: Main product has `Spend > 0`
3. **ROAS Value**: Main product shows numeric ROAS

### Why Does This Matter?

**Main Product**:

- Receives **direct advertising budget**
- WB attributes **all group revenue** to this product's ads
- Appears first in Wildberries search results

**Child Products**:

- **No direct advertising spend**
- Benefit from **main product's visibility**
- Sales counted as **organic** (even if driven by group ads)

### Strategic Implications

1. **Budget Allocation**: Only assign advertising budget to main product
2. **Product Selection**: Choose best-seller or highest-margin product as main
3. **Performance Analysis**: Monitor child products' organic contribution
4. **ROAS Interpretation**: Group-level ROAS is more meaningful than main product ROAS

---

## Sorting and Filtering

### Sorting

Click any **column header** to sort by that metric:

- **1st click**: Sort descending (highest to lowest)
- **2nd click**: Sort ascending (lowest to highest)
- **3rd click**: Return to original order

**Common Sorting Use Cases**:

- **By ROAS**: Find most/least profitable groups
- **By Spend**: Identify highest/lowest budget groups
- **By Organic %**: Find groups with strong organic performance

### Filtering (Story 37.6 - Future Feature)

**Not yet available** in current version. Planned filters:

- Date range selection
- ROAS threshold (e.g., show only ROAS < 1.0)
- Minimum spend (e.g., show only groups with spend > 5000₽)

---

## Mobile Usage

### Responsive Design

The merged groups table is **fully responsive** on mobile devices:

- **Toggle buttons**: Stack vertically on small screens
- **Table scrolling**: Horizontal scroll enabled for all columns
- **Sticky columns**: Group ID and nmId stay visible while scrolling

### Mobile Tips

1. **Landscape mode**: Recommended for easier viewing
2. **Pinch to zoom**: Supported for detailed inspection
3. **Touch targets**: All buttons are ≥44×44 pixels for easy tapping

---

## Troubleshooting

### Issue: "No merged groups showing"

**Cause**: Your products may not have merged cards set up in Wildberries Content API.

**Solution**:

1. Check Wildberries Seller Portal → Content → Merged Cards
2. Verify you've created merged groups (склейки)
3. Wait 24 hours for daily sync to complete
4. Contact support if issue persists after 48 hours

### Issue: "ROAS shows —" for all products

**Cause**: Child products always show "—" because they have no direct ad spend.

**Solution**: This is **expected behavior**. Look at:

- **Main product** (👑) for individual ROAS
- **Aggregate row** for group-level ROAS

### Issue: "Table is too wide on mobile"

**Cause**: Table has 6+ columns and doesn't fit on small screens.

**Solution**:

1. Use **horizontal scrolling** (swipe left/right)
2. Group ID column stays **sticky** (visible while scrolling)
3. Rotate to **landscape mode** for better visibility

### Issue: "Aggregate row totals don't match individual products"

**Cause**: You may be viewing filtered data or sorting has changed visible products.

**Solution**:

1. Clear all filters (if any)
2. Verify you're viewing the **complete group** (all child products visible)
3. Check console for calculation errors (should be none)

### Issue: "URL doesn't save merged groups view"

**Cause**: Browser may not support URL state persistence.

**Solution**:

1. **Bookmark the URL** after switching to "По склейкам"
2. URL should contain `?group_by=imtId`
3. Use modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

---

## Keyboard Shortcuts (Accessibility)

| Key               | Action                           |
| ----------------- | -------------------------------- |
| `Tab`             | Navigate between toggle buttons  |
| `Enter` / `Space` | Activate focused button          |
| `↑` `↓`           | Navigate table rows (if enabled) |
| `Ctrl` + Click    | Sort column (some browsers)      |

---

## Support and Feedback

### Need Help?

- **Documentation**: See `/docs/stories/epic-37/` for technical details
- **Bug Reports**: Create issue in GitHub repository
- **Feature Requests**: Contact Product Owner

### Changelog

- **v1.0 (2025-12-29)**: Initial release - Epic 37 completion
  - ✅ 3-tier rowspan table structure
  - ✅ Aggregate metrics (Epic 35 formulas)
  - ✅ Visual hierarchy and responsive design
  - ✅ Keyboard navigation and accessibility (WCAG 2.1 AA)

---

**🎯 Quick Start Summary**:

1. Go to **Analytics → Advertising**
2. Click **"По склейкам"** toggle
3. Look for 👑 crown icon to identify main products
4. Read **aggregate row** (gray) for group-level totals
5. Hover over **detail rows** (white) for individual products
6. Sort by **ROAS** to find profitable/unprofitable groups

**Happy analyzing! 📊**
