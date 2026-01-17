# Creative Tim UI → Our Project: Adaptation Example

**This file demonstrates how to adapt Creative Tim UI design patterns to our project.**

---

## Example: Pricing Card for Price Calculator

### Step 1: Get Design Pattern from Creative Tim UI (via Context7 MCP)

```bash
mcp-cli call context7/query-docs '{
  "libraryId": "/creativetimofficial/ui",
  "query": "pricing card layout design examples",
  "maxResults": 2
}'
```

**Result (Creative Tim UI Pattern):**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Premium Wireless Headphones</CardTitle>
    <CardDescription>High-quality audio with active noise cancellation</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$299</div>
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>
```

**Design Ideas to Extract:**
- ✅ Card layout: Header → Content → Footer structure
- ✅ Price display: Large bold font (`text-2xl font-bold`)
- ✅ Action button: Full width in footer
- ❌ DO NOT COPY: Component names, exact styling, USD currency

---

### Step 2: Adapt to Our Project (RU locale, Red Primary, shadcn/ui)

**Our Adapted Version (`src/components/custom/price-calculator/RecommendedPriceCard.tsx`):**

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface RecommendedPriceCardProps {
  recommendedPrice: number
  targetMargin: number
  onApply: () => void
}

export function RecommendedPriceCard({
  recommendedPrice,
  targetMargin,
  onApply,
}: RecommendedPriceCardProps) {
  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Рекомендуемая цена продажи</CardTitle>
        <CardDescription>
          На основе целевой маржи {targetMargin}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-red-600">
            {formatCurrency(recommendedPrice)}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onApply}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          Применить цену
        </Button>
      </CardFooter>
    </Card>
  )
}
```

**Key Adaptations:**
| Creative Tim Pattern | Our Adaptation | Why |
|---------------------|----------------|-----|
| `$299` (USD) | `formatCurrency(recommendedPrice)` | RU locale: "2 500,00 ₽" |
| Green/blue colors | `text-red-600`, `bg-red-600` | Project primary: #E53935 |
| "Premium..." title | "Рекомендуемая цена продажи" | Russian language |
| `text-2xl` | `text-4xl` | Larger price for visibility |
| "Add to Cart" | "Применить цену" | Action context |

---

### Step 3: What We Learned vs. What We Copied

**✅ Learned from Creative Tim UI (Design Patterns):**
- Card structure: Header → Content → Footer
- Visual hierarchy: Large price, secondary description
- Spacing: `gap-2` for price alignment
- Layout: Full-width action button

**❌ NOT Copied (Implemented Our Way):**
- Component imports: Use `@/components/ui/card` (our shadcn/ui)
- Colors: Red #E53935 instead of Creative Tim colors
- Language: Russian instead of English
- Currency: `formatCurrency()` helper instead of hardcoded `$`
- Icons: Not shown in example, but would use lucide-react

---

## Checklist for Agents

When using Creative Tim UI via Context7 MCP:

- [ ] **Step 1**: Query Context7 for design patterns
- [ ] **Step 2**: Extract layout/spacing/styling ideas (NOT code)
- [ ] **Step 3**: Use OUR shadcn/ui components from `src/components/ui/`
- [ ] **Step 4**: Apply project conventions:
  - [ ] Russian language (all text)
  - [ ] Red primary color (#E53935)
  - [ ] `formatCurrency()` for prices
  - [ ] `formatPercentage()` for margins
  - [ ] WCAG 2.1 AA accessibility
- [ ] **Step 5**: Write clean TypeScript with proper types

---

## Common Mistakes to Avoid

❌ **WRONG**: Copy Creative Tim code directly
```tsx
// DON'T DO THIS - Uses Creative Tim components directly
import { SoftwarePurchaseCard } from '@creative-tim/ui/software-purchase-card'
```

✅ **CORRECT**: Adapt the pattern to our components
```tsx
// DO THIS - Use our shadcn/ui + apply learned patterns
import { Card } from '@/components/ui/card'
// Adapt layout/spacing from Creative Tim, implement with our components
```

---

## More Examples

### Query: "card padding margin spacing examples"
**Extract**: `className="p-6"` or `className="space-y-4"`
**Adapt**: Apply to our Card with red accents

### Query: "section grid flex layout patterns"
**Extract**: Grid layouts for pricing tiers
**Adapt**: Use for price calculator results grid

### Query: "testimonial section design"
**Extract**: Three-column layout with cards
**Adapt**: Use for analytics KPI display

---

**Remember**: Creative Tim UI = Design Pattern Inspiration, NOT Component Library!
