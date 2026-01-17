# Price Calculator User Guide

## Overview

The Price Calculator is a tool that helps Wildberries sellers determine the optimal selling price for their products based on costs and target profit margin.

**Location**: COGS Management → Price Calculator

---

## How to Use

### 1. Navigate to the Calculator

1. Go to **COGS Management** in the sidebar
2. Click **Price Calculator**

### 2. Enter Your Cost Parameters

#### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Target Margin %** | Desired profit margin (0-50%) | 20% |
| **COGS** | Cost of goods sold (what you paid) | 1500 ₽ |
| **Logistics Forward** | Delivery to warehouse | 200 ₽ |
| **Logistics Reverse** | Return delivery cost | 150 ₽ |
| **Buyback %** | Products sold (not returned) | 98% |
| **Advertising %** | Ad spend as % of price | 5% |
| **Storage** | Warehousing cost | 50 ₽ |

#### Optional Fields (Advanced)

Click **Advanced Options** to reveal:

| Field | Description | Default |
|-------|-------------|---------|
| **VAT %** | Tax rate | 20% |
| **Acquiring %** | Payment processing fee | 1.8% |
| **Commission %** | Override WB commission | Use default |
| **Product ID** | Filter for specific product | Any product |

### 3. Automatic Calculation

The calculator automatically computes your recommended price **500ms** after you change any value.

- **"Calculating..."** indicator appears during API call
- Results display automatically when ready

### 4. Manual Calculation

You can also click **Calculate Price** to calculate immediately.

---

## Understanding the Results

### Recommended Price Card

Shows the optimal price based on your target margin:

| Metric | Description |
|--------|-------------|
| **Recommended Price** | Price to set for your product |
| **Target Margin** | Your desired margin (from input) |
| **Actual Margin** | The margin achieved at this price |
| **Margin in ₽** | Your profit per unit in rubles |

### Cost Breakdown Table

Detailed view of all costs:

| Category | Amount | Description |
|----------|--------|-------------|
| **COGS** | 1500 ₽ | Cost of goods |
| **Logistics** | 350 ₽ | Forward + reverse delivery |
| **Storage** | 50 ₽ | Warehousing |
| **Commission** | 250 ₽ | Wildberries fee |
| **Acquiring** | 45 ₽ | Payment processing |
| **Advertising** | 125 ₽ | Ad spend |
| **VAT** | 500 ₽ | Tax |
| **Margin** | 812 ₽ | Your profit |

### Visual Chart

The **Cost Distribution** chart shows:
- Color-coded segments for each cost category
- Relative size of each cost
- Quick visual breakdown

---

## Tips & Best Practices

### Setting Your Target Margin

- **Start with 20%** - A common target for many sellers
- **Adjust based on category**: Some categories support higher margins
- **Consider competition**: Lower prices may increase sales volume
- **Account for returns**: Set buyback % to match your actual return rate

### Logistics Costs

- **Logistics Forward**: What you pay to ship to WB warehouse
- **Logistics Reverse**: Average cost per return (usually 2% of sales)
- **Tip**: Use historical data from your analytics

### Understanding Warnings

If you see yellow warning banners:
- **Target margin may not be achievable** - Costs exceed what the market will bear
- **Consider adjusting**: Lower your target margin or reduce costs

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Esc** | Reset form (with confirmation if results exist) |
| **Enter** | Calculate immediately |

---

## Troubleshooting

### "Calculation Failed" Error

1. **Check your internet connection**
2. **Verify all values are positive numbers**
3. **Try clicking Calculate again**
4. **Contact support** if the issue persists

### "Not Authenticated" Error

- Your session may have expired
- Click **Go to Login** to sign in again

### "Cabinet Access Denied" Error

- No cabinet selected
- Click **Select Cabinet** to choose one

### Reset Form Not Working

- If results exist, a confirmation dialog will appear
- Confirm the reset to clear all values

---

## FAQ

**Q: Can I save my calculations?**
A: Currently, calculations are not saved. Use the results immediately or note them down.

**Q: Why does the recommended price differ from my calculation?**
A: The calculator includes all WB fees (commission, logistics, storage, acquiring, VAT) which may not be in your manual calculation.

**Q: What if I don't know my exact costs?**
A: Use estimates from historical data. You can adjust values as you get more accurate information.

**Q: Does this work for all product categories?**
A: Yes, but optimal margins vary by category. Start with 20% and adjust based on your category's competition.

**Q: Can I use this for bulk pricing?**
A: This calculator is for single-unit pricing. For bulk orders, consider your volume discounts when setting the COGS.

---

## Related Features

- **COGS Management** - Assign costs to your products
- **Margin Analytics** - See actual margins for your products
- **Financial Summary** - View overall financial performance

---

**Need Help?**
Contact support or check the documentation for more details.
