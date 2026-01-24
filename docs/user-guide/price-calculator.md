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
| **Logistics Forward** | Delivery to warehouse (auto-filled) | 200 ₽ |
| **Logistics Reverse** | Return delivery cost (enter manually) | 150 ₽ |
| **Buyback %** | Percent of sales that aren't returned | 98% |
| **Advertising %** | Ad spend as % of price | 5% |
| **Storage** | Storage cost (free first 60 days) | 50 ₽ |

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

### Understanding Buyback %

The **Buyback %** (also called "retention rate") is the percentage of units sold that customers keep (not returned):

- **Example 1**: Buyback = 95%
  - Out of 100 units sold, 95 customers keep the product
  - 5 units are returned and you pay reverse logistics on those 5
  - Return logistics cost scales with your return rate

- **Example 2**: Buyback = 98%
  - Only 2% of sales are returned
  - Lower overall return logistics costs per unit
  - Higher buyback % = lower return costs

- **How it affects pricing**:
  - If you set buyback = 95%, the calculator assumes 5% of your reverse logistics cost applies on average
  - Higher buyback % → Lower return costs → Can set lower price with same margin
  - Lower buyback % → Higher return costs → Need higher price to maintain margin

- **How to estimate**: Check your historical return rate in WB analytics

### Logistics Costs

#### Forward Logistics (Auto-Calculated)
- **Logistics Forward** is automatically calculated based on:
  - Your warehouse location
  - Product dimensions (length, width, height)
  - Cargo type classification (MGT/SGT/KGT)
- You don't need to enter this manually—it's filled automatically

#### Reverse Logistics (Manual Entry Required)
- **Logistics Reverse** is the cost of return shipping to your warehouse
- This MUST be entered manually because it depends on:
  - Your actual return rate (varies by product category)
  - Your preferred logistics partner
  - Regional delivery costs
- **Tip**: Use historical data from your WB analytics
- **Typical range**: 100-300 ₽ depending on product weight and region

#### Cargo Type Warnings
If you see a **"Large cargo (KGT) detected"** warning:
- Your product exceeds 120cm in one dimension
- Reverse logistics for KGT cargo is MORE expensive
- You may need to enter a higher reverse logistics cost manually
- Consider this when setting your target margin

### Storage Costs (60-Day Free Policy)

- **First 60 days**: Storage at WB is FREE
- **After 60 days**: You pay storage based on turnover days (how long inventory sits)
- **In the calculator**:
  - If your product sells within 60 days → Enter 0 ₽ for storage
  - If it's slow-moving (>60 days) → Enter the calculated storage cost based on WB tariff

- **How to calculate storage cost**:
  1. Check how many days your inventory typically sits in warehouse
  2. If >60 days, look up WB storage tariff for your category
  3. Formula: `storage_cost = (daily_rate) × (days - 60)`
  4. Enter this value in the Storage field

### Understanding Warnings

If you see yellow warning banners:
- **Target margin may not be achievable** - Costs exceed what the market will bear
- **Consider adjusting**: Lower your target margin or reduce costs
- **Large cargo (KGT) detected** - Your product requires special handling and may have higher reverse logistics costs

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

**Q: Why is Logistics Forward auto-filled but Reverse isn't?**
A: Forward logistics is predictable—it's based on warehouse + dimensions. Reverse logistics varies by your business model (return rate, partner, region), so you must enter it manually based on your actual costs.

**Q: What does Buyback % mean exactly?**
A: Buyback % is the percentage of customers who keep the product (don't return it). If Buyback = 95%, then 5% return the product. The calculator uses this to estimate your average return logistics cost per unit sold.

**Q: Storage is free for 60 days—what do I enter in the calculator?**
A: For fast-moving products (sell within 60 days), enter 0 ₽ for storage. For slower products, calculate storage cost as: (WB daily rate) × (days inventory sits - 60). Only pay after day 60.

**Q: I see "Large cargo (KGT) detected" warning. What should I do?**
A: This means your product exceeds 120cm. Large cargo has higher reverse logistics costs. Manually enter a higher reverse logistics cost to account for this. You may need to increase your target margin to stay profitable.

---

## Related Features

- **COGS Management** - Assign costs to your products
- **Margin Analytics** - See actual margins for your products
- **Financial Summary** - View overall financial performance

---

**Need Help?**
Contact support or check the documentation for more details.
