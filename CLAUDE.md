# CLAUDE.md

Guidance for Claude Code when working with this repository.

## Project Overview

**WB Repricer System - Frontend** - Financial analytics dashboard for Wildberries marketplace sellers.

| Aspect | Details |
|--------|---------|
| Stack | Next.js 15 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui |
| State | TanStack Query v5 (server) + Zustand (client) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Backend | REST API on `localhost:3000` (configurable via `NEXT_PUBLIC_API_URL`) |

**Core Features**: Weekly financial analytics, COGS management with versioning, margin analysis, storage/advertising metrics, price calculator, Telegram notifications.

---

## Quick Reference

| Resource | Location | Contains |
|----------|----------|----------|
| **Epics & Stories** | [`docs/EPICS-AND-STORIES-TRACKER.md`](docs/EPICS-AND-STORIES-TRACKER.md) | **Single source of truth** - all statuses, sprints, routes |
| **API Reference** | [`docs/api-integration-guide.md`](docs/api-integration-guide.md) | **Full endpoint catalog**, HTTP files, integration patterns |
| **UI/UX Spec** | [`docs/front-end-spec.md`](docs/front-end-spec.md) | **Design System**, User Personas, WCAG, Accessibility |
| **Architecture** | `docs/front-end-architecture.md` | Technical architecture |
| **Routes Code** | `src/lib/routes.ts` | Centralized route constants |
| **Backend Swagger** | `http://localhost:3000/api` | Live API documentation |
| **Test API Examples** | `test-api.http` | HTTP request examples |

---

## Development Commands

```bash
# Development
npm run dev              # Port 3000

# Production (PM2)
npm run build && pm2 start ecosystem.config.js --only wb-repricer-frontend  # Port 3100

# Quality
npm run lint && npm run type-check && npm run format:check

# Testing
npm test                 # Unit (Vitest)
npm run test:e2e         # E2E (Playwright)
```

---

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (dashboard)/     # Protected routes (sidebar layout)
│   ├── (auth)/          # Public auth routes
│   └── (onboarding)/    # Onboarding flow
├── components/
│   ├── ui/              # shadcn/ui (DO NOT EDIT - use npx shadcn@latest add)
│   └── custom/          # Feature components (70+)
├── lib/
│   ├── api/             # API modules by domain
│   ├── api-client.ts    # HTTP client with auth injection
│   └── *-utils.ts       # Business logic helpers
├── hooks/               # TanStack Query hooks (45+)
├── stores/              # Zustand stores (auth, margin-polling)
├── types/               # TypeScript definitions (13 files)
└── config/              # Features, routes configuration
```

---

## Critical Development Rules

### Mandatory
- **File size limit**: All source files MUST be under 200 lines (ESLint enforced)
- **TypeScript strict**: No `any` types (use `unknown`)
- **Path aliases**: Use `@/components` not `../../components`
- **Server Components**: Default (no `'use client'` unless needed)
- **shadcn/ui**: Never edit manually - use CLI to add components

### MCP-Assisted Development
**Context7 MCP** for design patterns and examples:
- `/creativetimofficial/ui` - Design patterns (DO NOT INSTALL, use for inspiration)
- `/llmstxt/ui_shadcn_llms_txt` - shadcn/ui implementation examples

**Workflow**: Query Context7 → Extract design ideas → Apply to shadcn/ui components → Follow project conventions (Russian locale, red primary #E53935, WCAG 2.1 AA)

---

## Key Architecture Patterns

### API Client (`src/lib/api-client.ts`)
Auto-injects `Authorization: Bearer {token}` and `X-Cabinet-Id: {cabinetId}`. Auto-unwraps `{ data: ... }` responses.

### TanStack Query (`src/hooks/`)
```typescript
// Standard hook pattern
export function useFeature(params) {
  return useQuery({
    queryKey: featureQueryKeys.byId(params),
    queryFn: () => getFeature(params),
    enabled: !!params,
  })
}
```
Config: staleTime=60s, gcTime=5min, retry=1

### Zustand (`src/stores/`)
- `authStore.ts` - Authentication with localStorage persistence
- `marginPollingStore.ts` - COGS→Margin calculation tracking

### Polling Pattern (COGS → Margin)
After COGS assignment, poll for margin calculation:
```typescript
getPollingStrategy(validFrom, isBulk) -> { interval: 3000-5000ms, maxAttempts: 10-20 }
```
Files: `src/lib/margin-helpers.ts`, `src/hooks/*-polling.ts`

---

## Critical Business Rules

### Week Definition
- **Format**: ISO week `YYYY-Www` (e.g., "2025-W49")
- **Timezone**: `Europe/Moscow`
- **Week starts**: Monday
- **Last completed week**: Mon/Tue before 12:00 → W-2, Tue after 12:00 → W-1

### Key Formulas
```
margin_pct = ((revenue - cogs) / revenue) * 100
roas = revenue / spend (where spend > 0)
```

### COGS Temporal Logic
- **Midpoint rule**: Thursday determines which COGS version applies
- `valid_from` after last completed week → Warning + manual recalc button

---

## Business Logic Locations

| Domain | File | Key Functions |
|--------|------|---------------|
| Week/COGS | `src/lib/margin-helpers.ts` | `getLastCompletedWeek()`, `calculateAffectedWeeks()` |
| Unit Economics | `src/lib/unit-economics-utils.ts` | Profitability status, health score |
| Liquidity | `src/lib/liquidity-utils.ts` | Turnover categories, liquidation scenarios |
| Supply Planning | `src/lib/supply-planning-utils.ts` | Stockout risk, reorder values |
| Advertising | `src/lib/campaign-utils.ts`, `efficiency-utils.ts` | Campaign status, ROAS categorization |

### Formatters (Russian Locale)
```typescript
formatCurrency(1234567.89)  // "1 234 567,89 ₽"
formatPercentage(15.5)      // "15,5 %"
formatDate(date)            // "20.01.2025"
formatIsoWeek(date)         // "2025-W03"
```

---

## API Integration

> **Full Reference**: [`docs/api-integration-guide.md`](docs/api-integration-guide.md) - Complete endpoint catalog, HTTP files, integration patterns

### Authentication Headers (Auto-Added)
```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

### Key Endpoints Summary
| Domain | Endpoints | Notes |
|--------|-----------|-------|
| Auth | `/v1/auth/login`, `register`, `logout` | JWT tokens |
| Cabinets | `/v1/cabinets/*` | CRUD + WB token |
| Products | `/v1/products` | `include_cogs=true` for margin data |
| Analytics | `/v1/analytics/weekly/*` | Finance summary, by-sku/brand/category |
| Tasks | `/v1/tasks/enqueue` | Manager+ role required |

### Role-Based Access
| Role | Task Enqueue | Analytics |
|------|--------------|-----------|
| Owner/Manager/Service | ✅ | ✅ |
| Analyst | ❌ (403) | ✅ |

---

## Component Patterns

### Organization
1. **Page → Container → Presenters**: Page orchestrates, containers manage state, presenters render
2. **Hook-Driven**: Components consume hooks for all data/mutations
3. **Compound Components**: Parent with sub-components (e.g., Form with Field)

### Key Custom Components
| Category | Location | Examples |
|----------|----------|----------|
| Auth/Onboarding | `custom/auth/`, `custom/onboarding/` | LoginForm, WbTokenForm |
| Products/COGS | `custom/products/`, `custom/cogs/` | ProductList, SingleCogsForm |
| Analytics | `custom/analytics/` | FinancialSummaryTable, ExpenseChart |
| Date Selection | `custom/date/` | WeekSelector, DateRangePicker |

---

## Design System

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Complete design system, typography, spacing, components

### Color Palette
| Element | Color | Usage |
|---------|-------|-------|
| Primary Red | `#E53935` | Main brand, buttons, links |
| Primary Dark | `#D32F2F` | Hover states |
| Primary Light | `#FFCDD2` | Hover backgrounds |
| White | `#FFFFFF` | Backgrounds |
| Gray Scale | `#F5F5F5` (light), `#EEEEEE` (borders), `#757575` (text) | UI elements |

### Semantic Colors
| Color | Hex | Usage |
|-------|-----|-------|
| Green | `#22C55E` | Positive values, profitable margins |
| Red | `#EF4444` | Negative values, losses, high expenses |
| Blue | `#3B82F6` | Primary metrics, information |
| Purple | `#7C4DFF` | Storage analytics (Epic 24) |
| Yellow | `#F59E0B` | Warnings, medium severity |

### Typography
| Element | Size/Weight | Usage |
|---------|------------|-------|
| H1 | 32px, bold | Page titles |
| H2 | 24px, semi-bold | Section headers |
| Body | 14-16px, regular | Content |
| Metric Values | 32-48px, bold | Dashboard metrics |

---

## User Personas

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Detailed personas, goals, pain points

### Primary: Business Owner / Entrepreneur
- 50-5000 SKUs, 500K-50M RUB/month revenue
- **Goals**: Quick profit insight, reduce manual work by 75%, optimize pricing
- **Pain points**: Manual spreadsheets, no real-time visibility, COGS tracking difficulty

### Secondary: Financial Director / CFO
- 1000+ SKUs, financial professional
- **Goals**: Accurate reporting, strategic decisions, trend analysis
- **Pain points**: Need comprehensive overviews, multi-dimensional analysis

---

## WCAG 2.1 AA Accessibility (Mandatory)

> **Full Reference**: [`docs/front-end-spec.md`](docs/front-end-spec.md) - Complete accessibility guidelines, testing checklist

### Key Requirements
- **Color contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard navigation**: All interactive elements must be keyboard-navigable
- **Images**: All images must have alt text
- **Forms**: All form inputs must have associated labels
- **ARIA**: Use ARIA labels where semantic HTML is insufficient
- **Focus indicators**: Visible focus states for all interactive elements

### Testing Tools
- `@axe-core/playwright` - Automated accessibility testing in E2E
- Lighthouse accessibility audit
- Manual keyboard navigation testing

---

## Testing Strategy

> **Playwright Config**: `_bmad/bmm/testarch/knowledge/playwright-config.md`

### Structure
| Type | Location | Coverage Goal |
|------|----------|---------------|
| Unit | `src/**/*.test.tsx` | 60%+ |
| Integration | `src/lib/api/__tests__/` | 30%+ |
| E2E | `e2e/**/*.spec.ts` | 10%+ |

### Test Utilities
- **Location**: `src/test/utils/test-utils.tsx`
- `renderWithProviders()` - Custom render with providers
- `createTestQueryClient()` - Fresh TanStack Query client
- **Fixtures**: `src/test/fixtures/` - Mock data for each domain

---

## Environment Variables

### Development
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000  # Default
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
```

### E2E Testing (Playwright)
```bash
# .env.e2e (for Playwright end-to-end tests)
E2E_BASE_URL=http://localhost:3100        # Frontend dev server
E2E_API_URL=http://localhost:3000         # Backend API URL
E2E_TEST_EMAIL=test@test.com              # Test user credentials
E2E_TEST_PASSWORD=Russia23!               # Test user password
E2E_REQUEST_TIMEOUT=30000                 # Request timeout (ms)
E2E_SCREENSHOT_DIR=test-results/screenshots  # Screenshot directory
E2E_DEBUG=false                           # Debug mode
```

**Note**: `.env.e2e` is excluded from version control. Test credentials match the seeded database user.

---

## Performance Requirements

| Metric | Target |
|--------|--------|
| Initial page load | < 3s |
| Time to interactive | < 5s |
| Dashboard data load | < 2s |
| API response (p95) | < 500ms |
| Error rate | < 1% |

---

## Documentation Index

### Core Documentation
| Document | Purpose |
|----------|---------|
| [`docs/EPICS-AND-STORIES-TRACKER.md`](docs/EPICS-AND-STORIES-TRACKER.md) | **Epic/story tracking, routes, sprint planning** |
| [`docs/api-integration-guide.md`](docs/api-integration-guide.md) | **Full API reference** (40+ endpoints, HTTP files) |
| [`docs/front-end-spec.md`](docs/front-end-spec.md) | **UI/UX specification** (design system, personas, WCAG) |
| `docs/front-end-architecture.md` | Technical architecture |
| `docs/MARGIN-COGS-BACKEND-INTEGRATION.md` | COGS temporal logic |

### Epic & Story Documentation
| Resource | Location |
|----------|----------|
| Epic specs | `docs/epics/epic-{N}-*.md` |
| Story files | `docs/stories/epic-{N}/story-*.md` |
| Sprint planning | `docs/sprint-planning/` |
| Backend requests | `docs/request-backend/` |

### UI/UX & Testing References
| Resource | Location |
|----------|----------|
| Wireframes | `docs/wireframes/` |
| User guides | `docs/user-guide/` |
| Playwright config | `_bmad/bmm/testarch/knowledge/playwright-config.md` |

---

## Git Workflow

```bash
git checkout -b feature/story-{ID}.{NUM}
npm run lint && npm run type-check
git commit -m "feat: implement story X.Y"
```

---

## Test Credentials

```
Email: test@test.com
Password: Russia23!
```

---

**Last Updated**: 2026-01-29
