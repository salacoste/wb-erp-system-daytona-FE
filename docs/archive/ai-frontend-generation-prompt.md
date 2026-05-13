# AI Frontend Generation Prompt for WB Repricer System

**Use this prompt with:** Vercel v0, Lovable.ai, or similar AI frontend generation tools

---

## Master Prompt

```
# WB Repricer System - Financial Dashboard Frontend

## Project Overview

Build a modern financial dashboard web application for Wildberries marketplace sellers. This application enables entrepreneurs and financial directors to visualize financial data, manage product costs (COGS), and analyze profitability margins in real-time.

**Tech Stack:**
- Next.js 14+ (App Router)
- TypeScript (ES+ syntax)
- Tailwind CSS
- shadcn/ui component library (customized)
- React Hook Form (for form management)
- React Query or SWR (for data fetching)

**Critical Constraints:**
- All source code files MUST be under 200 lines
- Use ESLint with max-lines-per-file rule set to 200
- All code comments, logs, and API response handling in English
- Mobile-first responsive design
- WCAG AA accessibility compliance

## Visual Design System

**Color Palette:**
- Primary Red: #E53935 (main brand color, buttons, active states)
- Primary Dark: #D32F2F (hover states, pressed buttons)
- Primary Light: #FFCDD2 (hover backgrounds, disabled states)
- White: #FFFFFF (backgrounds, cards)
- Gray Scale: #F5F5F5 (light), #EEEEEE (borders), #BDBDBD (disabled text), #757575 (body text)
- Semantic: Green #4CAF50 (positive margins), Red #E53935 (negative margins/errors), Blue #2196F3 (primary metrics)

**Typography:**
- Font: System font stack (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
- H1: 32-36px, bold (page titles)
- H2: 24-28px, semi-bold (section headers)
- Body: 14-16px, regular
- Metric Values: 32-48px, bold (large cards)

**Component Library:**
- Base: shadcn/ui components (Button, Input, Card, Table, Dialog, etc.)
- Customize all components to use red primary color (#E53935) instead of default
- Custom components needed: Sidebar Navigation, Top Navbar, MetricCard

**Layout Pattern:**
- Sidebar navigation (left, 240-280px width) - persistent on desktop
- Top navbar (64-72px height) - persistent across all screens
- Main content area (responsive, max-width 1280px)
- Mobile: Sidebar collapses to hamburger menu

## High-Level Goal

Create the main Dashboard page with key financial metrics, expense breakdown visualization, and trend graphs. This is the primary interface users see after login, providing immediate financial insights.

## Detailed Step-by-Step Instructions

### Step 1: Setup Project Foundation

1. Initialize Next.js 14+ project with TypeScript and App Router
2. Install and configure Tailwind CSS with custom color palette
3. Install shadcn/ui: `npx shadcn-ui@latest init`
4. Install required shadcn/ui components:
   - `npx shadcn-ui@latest add button`
   - `npx shadcn-ui@latest add card`
   - `npx shadcn-ui@latest add input`
   - `npx shadcn-ui@latest add table`
   - `npx shadcn-ui@latest add skeleton`
   - `npx shadcn-ui@latest add progress`
5. Configure `tailwind.config.ts` with custom primary colors:
   ```typescript
   colors: {
     primary: {
       DEFAULT: '#E53935',
       dark: '#D32F2F',
       light: '#FFCDD2',
     }
   }
   ```
6. Customize shadcn/ui Button component to add red primary variant
7. Create project structure:
   ```
   src/
   ├── app/
   ├── components/
   │   ├── ui/          # shadcn/ui components
   │   ├── custom/      # Custom components
   │   └── layout/     # Layout components
   ├── lib/
   │   ├── utils.ts     # cn() utility and formatters
   │   └── api.ts       # API client
   └── types/           # TypeScript types
   ```

### Step 2: Create Custom Sidebar Navigation Component

1. Create `src/components/custom/Sidebar.tsx` (keep under 200 lines)
2. Build sidebar with:
   - White background (#FFFFFF)
   - Navigation items: Dashboard, COGS Management, Analytics, Settings
   - Active state: Red background (#E53935) with white text
   - Hover state: Light pink background (#FFCDD2)
   - Icons from Lucide React (Home, Package, BarChart3, Settings, LogOut)
   - Logout item at bottom with red text
3. Make it responsive: Collapse to hamburger menu on mobile (< 768px)
4. Use shadcn/ui patterns but customize styling

### Step 3: Create Top Navbar Component

1. Create `src/components/custom/Navbar.tsx` (keep under 200 lines)
2. Build navbar with:
   - White background, 64-72px height
   - Left: "WB Repricer" title/logo
   - Right: Search bar (placeholder for MVP), Notification icon, Messages icon, User profile icon
   - Icons use red outline color (#E53935)
   - Border bottom: 1px solid #EEEEEE
3. Make responsive: Compact on mobile, hide non-essential icons

### Step 4: Create MetricCard Component

1. Create `src/components/custom/MetricCard.tsx` (keep under 200 lines)
2. Base on shadcn/ui Card component
3. Props: `title: string`, `value: number | string`, `isLoading?: boolean`, `variant?: 'large' | 'standard'`
4. Large variant: Min-height 160px, padding 24px, value font 32-48px bold
5. Standard variant: Min-height 100px, padding 20px, value font 24-32px bold
6. Use Skeleton component for loading state
7. Format currency values using Intl.NumberFormat with locale 'ru-RU' and currency 'RUB'

### Step 5: Create Dashboard Layout

1. Create `src/app/dashboard/page.tsx` (keep under 200 lines)
2. Use Sidebar and Navbar components
3. Main content area with:
   - Two large MetricCard components side-by-side (responsive: stack on mobile)
   - First card: "Total Payable" with blue accent
   - Second card: "Revenue" with blue accent
   - Cards use formatCurrency utility for RUB formatting
4. Add loading states using Skeleton components
5. Add error handling with user-friendly messages

### Step 6: Create API Client Utility

1. Create `src/lib/api.ts` (keep under 200 lines)
2. Implement API client with:
   - Base URL from environment variable
   - Automatic JWT token inclusion in Authorization header
   - Automatic X-Cabinet-Id header when available
   - Error handling with proper TypeScript types
   - Request/response transformation
3. Create functions for:
   - `getDashboardMetrics()` - Fetch Total Payable and Revenue
   - Handle loading states and errors

### Step 7: Integrate Dashboard with API

1. Use React Query or SWR in dashboard page
2. Fetch dashboard metrics on page load
3. Display data in MetricCard components
4. Handle loading, error, and success states
5. Format currency values correctly (RUB, Russian locale)

### Step 8: Add Expense Breakdown Section (Future Enhancement)

1. Create placeholder for expense breakdown chart
2. Use shadcn/ui Card to contain chart area
3. Add "Coming Soon" or skeleton loader for now
4. Prepare structure for future chart library integration

### Step 9: Add Trend Graphs Section (Future Enhancement)

1. Create placeholder for trend graphs
2. Use shadcn/ui Card to contain graph area
3. Add "Coming Soon" or skeleton loader for now
4. Prepare structure for future chart library integration

## Code Examples & Data Structures

### API Response Structure

```typescript
// Dashboard Metrics API Response
interface DashboardMetrics {
  totalPayable: number;  // In RUB
  revenue: number;       // In RUB
  // Additional metrics may be added
}

// API Client Example
const apiClient = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const response = await fetch('/api/dashboard/metrics', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'X-Cabinet-Id': getCabinetId(),
      },
    });
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }
};
```

### Currency Formatting Utility

```typescript
// src/lib/utils.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Example: formatCurrency(1234567.89) => "1 234 567,89 ₽"
```

### MetricCard Component Structure

```typescript
// src/components/custom/MetricCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: number | string;
  isLoading?: boolean;
  variant?: 'large' | 'standard';
}

export function MetricCard({ title, value, isLoading, variant = 'standard' }: MetricCardProps) {
  // Implementation with shadcn/ui Card
  // Use formatCurrency for numeric values
  // Show Skeleton when isLoading is true
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E53935',
          dark: '#D32F2F',
          light: '#FFCDD2',
        },
      },
    },
  },
}
```

## Constraints & What NOT to Do

**DO NOT:**
- Create files over 200 lines - split into smaller modules
- Use default shadcn/ui colors - always customize to red primary
- Skip accessibility features - all components must be keyboard navigable
- Hardcode API endpoints - use environment variables
- Create components without TypeScript types
- Use inline styles - use Tailwind CSS classes only
- Skip loading states - always show Skeleton or loading indicators
- Skip error handling - all API calls must handle errors gracefully
- Use non-English comments - all code comments in English
- Create components without proper ARIA labels for accessibility

**MUST:**
- Keep all files under 200 lines
- Use shadcn/ui as base, customize to red/white design
- Implement mobile-first responsive design
- Format currency as RUB using Intl.NumberFormat
- Include proper TypeScript types for all props and API responses
- Use semantic HTML elements
- Implement proper focus management for accessibility
- Handle all edge cases (empty states, errors, loading)

## Strict Scope Definition

**Files to Create/Modify:**
1. `src/app/dashboard/page.tsx` - Main dashboard page
2. `src/components/custom/Sidebar.tsx` - Sidebar navigation
3. `src/components/custom/Navbar.tsx` - Top navbar
4. `src/components/custom/MetricCard.tsx` - Metric card component
5. `src/lib/api.ts` - API client utility
6. `src/lib/utils.ts` - Utility functions (formatCurrency, cn)
7. `tailwind.config.ts` - Tailwind configuration with custom colors
8. `src/components/ui/button.tsx` - Customized shadcn/ui Button (add red primary variant)

**Files to Leave Untouched:**
- Any existing authentication code (if present)
- Any existing routing structure (if present)
- Other pages or components not related to dashboard
- Package.json dependencies (unless explicitly needed)

**Scope Boundaries:**
- Focus ONLY on dashboard page and its required components
- Do NOT implement authentication flow (assume user is already logged in)
- Do NOT implement full API integration (use mock data or placeholder API calls)
- Do NOT implement expense breakdown charts or trend graphs (placeholders only)
- Do NOT implement navigation to other pages (sidebar structure only)

## Mobile-First Responsive Design

**Mobile (< 640px):**
- Sidebar: Hidden by default, hamburger menu toggles overlay
- Navbar: Compact, essential icons only
- Metric Cards: Stack vertically, full width
- Padding: Reduced (16px instead of 24px)

**Tablet (640px - 768px):**
- Sidebar: Can be persistent or collapsible
- Metric Cards: 2-column grid
- Standard spacing

**Desktop (≥ 768px):**
- Sidebar: Persistent, 240-280px width
- Metric Cards: 2-column grid, large spacing
- Full layout with all elements visible

## Next Steps After Generation

1. Review generated code for file length (must be < 200 lines per file)
2. Test responsive behavior on mobile, tablet, desktop
3. Verify accessibility (keyboard navigation, screen reader)
4. Test currency formatting (RUB, Russian locale)
5. Integrate with actual API endpoints
6. Add error handling and edge cases
7. Implement loading states properly
8. Test with real data

## Important Notes

⚠️ **All AI-generated code requires careful human review, testing, and refinement to be considered production-ready.**

- Verify TypeScript types are correct
- Test all responsive breakpoints
- Validate accessibility with screen readers
- Test API integration with real backend
- Ensure all files are under 200 lines
- Verify currency formatting matches requirements
- Test error handling scenarios
- Validate color contrast for WCAG AA compliance
```

---

## How to Use This Prompt

### For Vercel v0:
1. Copy the entire prompt above
2. Paste into v0 chat interface
3. v0 will generate the dashboard with components
4. Iterate by asking for specific components or refinements

### For Lovable.ai:
1. Copy the prompt
2. Paste into Lovable's prompt interface
3. Lovable will scaffold the application
4. Use follow-up prompts for specific features

### Iterative Approach:
**Don't try to generate everything at once.** Instead:

1. **First Prompt:** Generate project setup and Sidebar component
2. **Second Prompt:** Generate Navbar and basic layout
3. **Third Prompt:** Generate MetricCard component
4. **Fourth Prompt:** Generate Dashboard page with API integration
5. **Fifth Prompt:** Refine styling and responsive behavior

### Example Follow-up Prompts:

**After initial generation:**
```
"Now customize the Button component to add a red primary variant (#E53935 background, white text). Update the Sidebar to use this red primary button for active navigation items."
```

**For specific components:**
```
"Create a MetricCard component based on shadcn/ui Card. It should display a title and a large formatted currency value. Use the formatCurrency utility to format RUB values. Include a loading state using Skeleton component."
```

**For API integration:**
```
"Integrate the dashboard page with the API client. Fetch dashboard metrics on page load using React Query. Display the data in MetricCard components. Handle loading, error, and success states properly."
```

---

## Prompt Structure Explanation

This prompt follows the **Structured Prompting Framework**:

1. **High-Level Goal:** Clear objective (Dashboard page with metrics)
2. **Detailed Instructions:** 9 sequential steps breaking down the work
3. **Code Examples:** TypeScript interfaces, utility functions, component structures
4. **Strict Scope:** Exactly which files to create, which to leave alone

**Why This Works:**
- **Explicit Context:** Full tech stack, design system, and constraints provided upfront
- **Step-by-Step:** Breaks complex task into manageable pieces
- **Concrete Examples:** Shows exact code patterns and data structures
- **Clear Boundaries:** Prevents scope creep and unintended changes

**Key Principles Applied:**
- ✅ Mobile-first approach mentioned in responsive design section
- ✅ Explicit detail about colors, typography, spacing
- ✅ Iterative approach recommended (don't generate everything at once)
- ✅ Constraints clearly stated (200-line files, accessibility, etc.)

---

**Generated:** 2025-01-20  
**Author:** Sally (UX Expert)  
**Based on:** Front-end Specification v1.0 and PRD v1.0

