# WB Repricer System - Frontend

**Version:** 1.0.0  
**Framework:** Next.js 15 (App Router) + TypeScript  
**Component Library:** shadcn/ui + Tailwind CSS
**Default Port:** 3100 (production via PM2)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- npm, yarn, or pnpm
- Git
- PM2 (for production deployment) - `npm install -g pm2`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables (optional - defaults are provided)
cp .env.example .env.local

# Edit .env.local with your API URL (optional)
# NEXT_PUBLIC_API_URL=http://localhost:3000
# Note: URL without /api - endpoints start with /v1/
# Default value: http://localhost:3000 (works for local development)

# Initialize shadcn/ui (if not already done)
npx shadcn@latest init
```

### Development Mode (Recommended for Development)

**Features:**
- ✅ Hot reload (automatic refresh on file changes)
- ✅ No caching (always fresh code)
- ✅ Fast startup (no build required)
- ✅ Debug information

```bash
# Option 1: Direct Next.js dev server (port 3000)
npm run dev
# Application available at: http://localhost:3000

# Option 2: PM2 with development mode (port 3100)
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
# Application available at: http://localhost:3100
```

### Production Mode (For Server Deployment)

**Features:**
- ✅ Optimized code
- ✅ Caching enabled
- ✅ Maximum performance
- ⚠️ Requires build step

```bash
# Step 1: Build the application
npm run build

# Step 2: Start with PM2 in production mode
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# Application available at: http://localhost:3100
```

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages and layouts
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── custom/       # Custom project components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utilities and API client
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores (client state)
│   ├── types/            # TypeScript type definitions
│   └── styles/           # Global CSS
├── docs/                 # Project documentation
│   ├── front-end-architecture.md  # Technical architecture
│   ├── front-end-spec.md           # UI/UX specifications
│   └── prd.md                     # Product requirements
└── e2e/                  # End-to-end tests
```

---

## 🛠️ Development

### Test User Credentials

For development and testing purposes, use the following test account:

```bash
Email: test@test.com
Password: Russia23!
```

**Note:** This test user is available on the backend for development and testing only. Do not use in production.

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000, default Next.js port)
                        # Hot reload enabled, no caching

# Production (PM2)
# Development mode (no build required, hot reload, no caching)
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev
                        # Start on port 3100 in development mode

# Production mode (requires build, optimized, with caching)
npm run build           # Build production bundle first
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production
                        # Start on port 3100 in production mode

# PM2 Management
pm2 status              # Check running processes
pm2 logs wb-repricer-frontend-dev    # View dev logs
pm2 logs wb-repricer-frontend        # View production logs
pm2 restart wb-repricer-frontend-dev # Restart dev process
pm2 stop wb-repricer-frontend-dev    # Stop dev process
pm2 delete wb-repricer-frontend-dev  # Remove dev process

# Build & Start (without PM2)
npm run build           # Production build
npm run start           # Start production server (localhost:3000)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check     # Check formatting

# Testing
npm test                 # Run unit tests (Vitest)
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report
npm run test:e2e         # Run E2E tests (Playwright)
npm run test:e2e:ui      # Run E2E tests with UI
```

### Key Technologies

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **shadcn/ui** - Component library (copy-paste architecture)
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form state management
- **Vitest** - Unit testing
- **Playwright** - E2E testing

---

## 📚 Documentation

### Essential Documents

1. **`docs/front-end-architecture.md`** - Complete technical architecture
   - Tech stack decisions
   - Project structure
   - Component standards
   - State management patterns
   - API integration
   - Testing strategy

2. **`docs/front-end-spec.md`** - UI/UX specifications
   - Design system
   - Component library
   - User flows
   - Visual design guidelines

3. **`docs/prd.md`** - Product requirements
   - Feature specifications
   - User stories
   - Acceptance criteria

4. **`docs/api-integration-guide.md`** - API Integration Guide
   - Complete reference for all 33+ backend endpoints
   - Authentication patterns
   - Error handling
   - TypeScript types
   - Usage examples and best practices

5. **`docs/MARGIN-COGS-BACKEND-INTEGRATION.md`** - Margin & COGS Backend Integration
   - Data architecture (wb_finance_raw → weekly_margin_fact → API)
   - All API endpoints with request/response examples
   - 6 display scenarios with UI recommendations
   - `missing_data_reason` values and handling
   - Week temporal logic (lastCompletedWeek, midpoint strategy)
   - Polling strategy after COGS assignment
   - Checklist for frontend implementation

### Stories & Epics Documentation ⭐ **UPDATED**

**Status Reports:**
- **[STORIES-STATUS-REPORT.md](docs/stories/STORIES-STATUS-REPORT.md)** - All stories status (22 total, 14 Done)
- **[EPIC-4-COMPLETION-SUMMARY.md](docs/stories/EPIC-4-COMPLETION-SUMMARY.md)** - Epic 4 COGS & Margin (8/8 stories, 100%)

**Epic 4: COGS Management & Margin Analysis** (8 stories - 100% complete):
- [4.1 Single Product COGS Assignment](docs/stories/4.1.single-product-cogs-assignment.md)
- [4.2 Bulk COGS Assignment](docs/stories/4.2.bulk-cogs-assignment.md)
- [4.3 COGS Input Validation](docs/stories/4.3.cogs-input-validation-error-handling.md)
- [4.4 Automatic Margin Display](docs/stories/4.4.automatic-margin-calculation-display.md)
- [4.5 Margin Analysis by SKU](docs/stories/4.5.margin-analysis-by-sku.md)
- [4.6 Margin by Brand/Category](docs/stories/4.6.margin-analysis-by-brand-category.md)
- [4.7 Margin Time Period Analysis](docs/stories/4.7.margin-analysis-by-time-period.md)
- [4.8 Margin Recalculation Polling](docs/stories/4.8.margin-recalculation-polling.md)

**Epic 24: Paid Storage Analytics** (8 stories - 100% complete) ⭐ **DONE**:
- [24.1-fe Types & API Client](docs/stories/epic-24/story-24.1-fe-types-api-client.md)
- [24.2-fe Page Layout](docs/stories/epic-24/story-24.2-fe-page-layout.md)
- [24.3-fe Storage by SKU Table](docs/stories/epic-24/story-24.3-fe-storage-by-sku-table.md)
- [24.4-fe Top Consumers Widget](docs/stories/epic-24/story-24.4-fe-top-consumers.md)
- [24.5-fe Trends Chart](docs/stories/epic-24/story-24.5-fe-trends-chart.md)
- [24.6-fe Manual Import UI](docs/stories/epic-24/story-24.6-fe-manual-import.md)
- [24.7-fe Product Card Storage Info](docs/stories/epic-24/story-24.7-fe-product-card-storage.md)
- [24.8-fe High Ratio Alert](docs/stories/epic-24/story-24.8-fe-high-ratio-alert.md)

**Epic 34-FE: Telegram Notifications UI** (6 stories - 100% complete) ✅ **PRODUCTION READY** 🎉:
- 🚀 **[Developer Handoff Guide](docs/DEV-HANDOFF-EPIC-34-FE.md)** - Production deployment guide
  - [Bot Config](docs/DEV-HANDOFF-EPIC-34-FE.md#-telegram-bot-configuration-urgent-action-required) | [Monitoring](docs/DEV-HANDOFF-EPIC-34-FE.md#-monitoring--analytics-implementation-recommended) | [Testing](docs/DEV-HANDOFF-EPIC-34-FE.md#testing-status)
- **[CHANGELOG-EPIC-34-FE.md](docs/CHANGELOG-EPIC-34-FE.md)** - Complete implementation summary
- **[Epic 34-FE Main Doc](docs/epics/epic-34-fe-telegram-notifications-ui.md)** - Architecture & API integration
- [34.1-FE Types & API Client](docs/stories/epic-34/story-34.1-fe-types-api-client.md) - ✅ Done (SSR-safe, React Query v5)
- [34.2-FE Telegram Binding Flow](docs/stories/epic-34/story-34.2-fe-telegram-binding-flow.md) - ✅ Done (Modal, countdown, polling)
- [34.3-FE Notification Preferences](docs/stories/epic-34/story-34.3-fe-notification-preferences-panel.md) - ✅ Done (Manual save, 4 event types)
- [34.4-FE Quiet Hours & Timezone](docs/stories/epic-34/story-34.4-fe-quiet-hours-timezone.md) - ✅ Done (13 timezones, overnight detection)
- [34.5-FE Settings Page Layout](docs/stories/epic-34/story-34.5-fe-settings-page-layout.md) - ✅ Done (Hero banner, responsive)
- [34.6-FE Testing & Documentation](docs/stories/epic-34/story-34.6-fe-testing-documentation.md) - ✅ Done (WCAG 2.1 AA)
- **Key Features**:
  - 📱 Complete Telegram bot integration (@Kernel_crypto_bot)
  - ⚙️ Notification preferences (task events, daily digest, language)
  - 🌙 Quiet hours with timezone support (13 Russian zones)
  - ✅ WCAG 2.1 AA accessibility compliance
  - 📊 Manual QA + 10 E2E tests (Playwright)
  - 🎨 Modal with countdown timer, polling, deep links
- **Dependencies**: Epic 34 (Backend) ✅ COMPLETE
- **Backend Integration**: [Request #73](docs/request-backend/73-telegram-notifications-epic-34.md) - 6 API endpoints

**Epic 6: Advanced Analytics** (5 stories - 100% complete) ✅ **COMPLETE**:
- [6.1-fe Date Range Support](docs/stories/epic-6/story-6.1-fe-date-range-support.md) - ✅ Done
- [6.2-fe Period Comparison](docs/stories/epic-6/story-6.2-fe-period-comparison.md) - ✅ Done
- [6.3-fe ROI & Profit Metrics](docs/stories/epic-6/story-6.3-fe-roi-profit-metrics.md) - ✅ Done
- [6.4-fe Cabinet Summary Dashboard](docs/stories/epic-6/story-6.4-fe-cabinet-summary.md) - ✅ Done
- [6.5-fe Export Analytics UI](docs/stories/epic-6/story-6.5-fe-export-analytics.md) - ✅ Done

**Epic 24: Paid Storage Analytics** (11 stories - 100% Complete) ✅ **PRODUCTION READY** 🎉:
- **[Epic 24 README](docs/stories/epic-24/README.md)** - Complete Epic 24 documentation
- [24.1-fe Types & API Client](docs/stories/epic-24/story-24.1-fe-types-api-client.md) - ✅ Complete (3 SP)
- [24.2-fe Page Layout](docs/stories/epic-24/story-24.2-fe-page-layout.md) - ✅ Complete (5 SP)
- [24.3-fe Storage by SKU Table](docs/stories/epic-24/story-24.3-fe-storage-by-sku-table.md) - ✅ Complete (5 SP)
- [24.4-fe Top Consumers](docs/stories/epic-24/story-24.4-fe-top-consumers.md) - ✅ Complete (3 SP)
- [24.5-fe Trends Chart](docs/stories/epic-24/story-24.5-fe-trends-chart.md) - ✅ Complete (3 SP)
- [24.6-fe Manual Import](docs/stories/epic-24/story-24.6-fe-manual-import.md) - ✅ Complete (3 SP)
- [24.7-fe Product Card Storage](docs/stories/epic-24/story-24.7-fe-product-card-storage.md) - ✅ Complete (2 SP)
- [24.8-fe High Ratio Alert](docs/stories/epic-24/story-24.8-fe-high-ratio-alert.md) - ✅ Complete (2 SP)
- [24.9-fe Multi-select Filters](docs/stories/epic-24/story-24.9-fe-multi-select-filters.md) - ✅ Complete (5 SP)
- [24.10-fe Chart Click Filter](docs/stories/epic-24/story-24.10-fe-chart-click-filter.md) - ✅ Complete (3 SP)
- [24.11-fe Unit Tests](docs/stories/epic-24/story-24.11-fe-unit-tests.md) - ✅ Complete (5 SP)
- **Key Features**:
  - Storage analytics page with filters, summary cards, and visualizations
  - Top consumers widget with rank indicators and cost severity dots
  - Trends chart with gap handling for null data
  - Manual import dialog with date validation and progress polling
  - High ratio alert banner with Russian pluralization
  - Multi-select brand/warehouse filters
  - Chart click-to-filter interaction
  - Comprehensive unit tests (133 tests passing, 8 test files)
  - WCAG 2.1 AA accessibility compliance
  - QA Review: PASS - Ready for production deployment
- **Backend Integration**: Epic 24 ✅ COMPLETE

**Epic 44: Price Calculator UI** (6 stories - 100% Complete) ✅ **PRODUCTION READY** 🎉:
- **[Epic 44 Documentation](docs/epics/epic-44-price-calculator-ui.md)** - Complete Epic 44 documentation
- [44.1-fe Types & API Client](docs/stories/epic-44/story-44.1-fe-types-api-client.md) - ✅ Complete (2 SP)
- [44.2-fe Input Form Component](docs/stories/epic-44/story-44.2-fe-input-form-component.md) - ✅ Complete (3 SP)
- [44.3-fe Results Display Component](docs/stories/epic-44/story-44.3-fe-results-display-component.md) - ✅ Complete (3 SP)
- [44.4-fe Page Layout Integration](docs/stories/epic-44/story-44.4-fe-page-layout-integration.md) - ✅ Complete (2 SP)
- [44.5-fe Real-time Calculation UX](docs/stories/epic-44/story-44.5-fe-realtime-calculation-ux.md) - ✅ Complete (2 SP)
- [44.6-fe Testing & Documentation](docs/stories/epic-44/story-44.6-fe-testing-documentation.md) - ✅ Complete (2 SP)
- **Key Features**:
  - Price Calculator UI for calculating optimal selling price based on target margin
  - Real-time calculation with 500ms debounce
  - Comprehensive error handling (400, 401, 403, 429)
  - Visual cost breakdown with stacked bar chart (Recharts)
  - Copy to clipboard, reset confirmation, Esc keyboard shortcut
  - WCAG 2.1 AA accessibility compliance
  - 208 tests passing, 6 QA gates passed (88-95/100 scores)
  - Backend Integration: Epic 43 ✅ COMPLETE

**Epic 24: Paid Storage Analytics** (11 stories - 100% Complete) ✅ **PRODUCTION READY** 🎉:
- **[Epic 24 README](docs/stories/epic-24/README.md)** - Complete Epic 24 documentation
- [24.1-fe Types & API Client](docs/stories/epic-24/story-24.1-fe-types-api-client.md) - ✅ Complete (3 SP)
- [24.2-fe Page Layout](docs/stories/epic-24/story-24.2-fe-page-layout.md) - ✅ Complete (5 SP)
- [24.3-fe Storage by SKU Table](docs/stories/epic-24/story-24.3-fe-storage-by-sku-table.md) - ✅ Complete (5 SP)
- [24.4-fe Top Consumers](docs/stories/epic-24/story-24.4-fe-top-consumers.md) - ✅ Complete (3 SP)
- [24.5-fe Trends Chart](docs/stories/epic-24/story-24.5-fe-trends-chart.md) - ✅ Complete (3 SP)
- [24.6-fe Manual Import](docs/stories/epic-24/story-24.6-fe-manual-import.md) - ✅ Complete (3 SP)
- [24.7-fe Product Card Storage](docs/stories/epic-24/story-24.7-fe-product-card-storage.md) - ✅ Complete (2 SP)
- [24.8-fe High Ratio Alert](docs/stories/epic-24/story-24.8-fe-high-ratio-alert.md) - ✅ Complete (2 SP)
- [24.9-fe Multi-select Filters](docs/stories/epic-24/story-24.9-fe-multi-select-filters.md) - ✅ Complete (5 SP)
- [24.10-fe Chart Click Filter](docs/stories/epic-24/story-24.10-fe-chart-click-filter.md) - ✅ Complete (3 SP)
- [24.11-fe Unit Tests](docs/stories/epic-24/story-24.11-fe-unit-tests.md) - ✅ Complete (5 SP)
- **Key Features**:
  - Storage analytics page with filters, summary cards, and visualizations
  - Top consumers widget with rank indicators and cost severity dots
  - Trends chart with gap handling for null data
  - Manual import dialog with date validation and progress polling
  - High ratio alert banner with Russian pluralization
  - Multi-select brand/warehouse filters
  - Chart click-to-filter interaction
  - Comprehensive unit tests (133 tests passing, 8 test files)
  - WCAG 2.1 AA accessibility compliance
  - QA Review: PASS - Ready for production deployment
- **Backend Integration**: Epic 24 ✅ COMPLETE

**Epic 37: Merged Group Table Display (Склейки)** (6 stories + Phase 2 QA - 100% Complete) 📋 **READY FOR DEVELOPMENT**:
- **[CHANGELOG-EPIC-37-FE.md](docs/CHANGELOG-EPIC-37-FE.md)** - Complete Epic 37 documentation ✨
- **[PO Validation Report](docs/stories/epic-37/PO-VALIDATION-REPORT-EPIC-37.md)** - Quality 9.2/10 ⭐⭐⭐⭐
- [37.1 Backend API Validation](docs/stories/epic-37/story-37.1-backend-api-validation.BMAD.md) - 1-2h
- [37.2 MergedGroupTable Component](docs/stories/epic-37/story-37.2-merged-group-table-component.BMAD.md) - 3-4h
- [37.3 Aggregate Metrics Display](docs/stories/epic-37/story-37.3-aggregate-metrics-display.BMAD.md) - 2-3h
- [37.4 Visual Styling & Hierarchy](docs/stories/epic-37/story-37.4-visual-styling-hierarchy.BMAD.md) - 2-3h
- [37.5 Testing & Documentation](docs/stories/epic-37/story-37.5-testing-documentation.BMAD.md) - 1-2h
- [37.6 Post-MVP Enhancements](docs/stories/epic-37/story-37.6-post-mvp-enhancements.md) - Backlog (8 features)
- **Key Features**:
  - 3-tier rowspan table architecture (Rowspan cells + Aggregate rows + Detail rows)
  - Crown icon (👑) for main products receiving ad budget
  - Epic 35 aggregate metrics (totalSales, revenue, organicSales, ROAS)
  - Responsive design with sticky columns (mobile/tablet)
  - Accessibility: WCAG 2.1 AA, screen reader support, keyboard navigation
  - Performance: <200ms render for 50 groups (6x CPU throttling)
  - Testing: ≥90% unit coverage, E2E tests, UAT with 3 users
  - Dependencies: Epic 36 (imtId field) ✅ COMPLETE, Epic 35 (metrics) ✅ COMPLETE
- **Backend Integration**: [Request #88](docs/request-backend/88-epic-37-individual-product-metrics.md) - Enhanced API with 16 fields per product

**Backend Requests:**
- **[Request Index](docs/request-backend/README.md)** - All 22+ backend requests
- **[All Completed Summary](docs/request-backend/23-all-requests-completed-summary.md)** - Final status

### Backend API Documentation

- **Backend API Swagger UI:** `http://localhost:3000/api` - Interactive API documentation
- **Backend documentation:** `../docs/frontend-po/` (if available)
- **`test-api.http`** - HTTP request examples for testing backend API endpoints
  - Contains example requests for all API endpoints
  - Can be used with REST Client extensions (VS Code, IntelliJ, etc.)
  - Includes authentication examples and request/response formats
  - Useful for manual API testing and understanding request structures

---

## 🎨 Design System

### Color Palette

- **Primary Red:** `#E53935` (main brand color)
- **Primary Dark:** `#D32F2F` (hover states)
- **Primary Light:** `#FFCDD2` (hover backgrounds)
- **White:** `#FFFFFF` (backgrounds)
- **Gray Scale:** `#F5F5F5` (light), `#EEEEEE` (borders), `#757575` (text)

### Typography

- **H1:** 32px, bold (page titles)
- **H2:** 24px, semi-bold (section headers)
- **Body:** 14-16px, regular
- **Metric Values:** 32-48px, bold

### Component Library

- **Base:** shadcn/ui components
- **Customization:** All components use red primary color (#E53935)
- **Icons:** Lucide React

---

## 🔧 Configuration

### Environment Variables

**Optional** environment variables (defaults are provided for local development):

```bash
# .env.local (optional - defaults work for local dev)

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Application Info
NEXT_PUBLIC_APP_NAME=WB Repricer System
NEXT_PUBLIC_APP_VERSION=1.0.0

# Telegram Bot (Epic 34-FE) - OPTIONAL
# Bot username for deep link: https://t.me/{username}?start={code}
# Default fallback: Kernel_crypto_bot
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=Kernel_crypto_bot
```

**Примечание:**
- API URL без `/api` - endpoints начинаются с `/v1/` (например: `/v1/auth/login`)
- Default value for `NEXT_PUBLIC_API_URL` is `http://localhost:3000` (works for local development)
- In production, set `NEXT_PUBLIC_API_URL` to your production API URL
- All `NEXT_PUBLIC_*` variables are embedded at build time

**Telegram Configuration (Epic 34-FE):**
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - **OPTIONAL** (имеет fallback `Kernel_crypto_bot`)
- Bot token (`TELEGRAM_BOT_TOKEN`) настраивается **на бэкенде** (не на фронтенде!)
- Backend configuration см. в backend `.env.example`

### PM2 Configuration

The project includes `ecosystem.config.js` with two configurations:

1. **`wb-repricer-frontend-dev`** - Development mode
   - Command: `next dev`
   - Port: 3100
   - NODE_ENV: `development`
   - No caching, hot reload enabled

2. **`wb-repricer-frontend`** - Production mode
   - Command: `next start` (requires build)
   - Port: 3100
   - NODE_ENV: `production`
   - Full caching, optimized

**Usage:**
```bash
# Development
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev

# Production (after npm run build)
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production
```

### Key Configuration Files

- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `components.json` - shadcn/ui configuration
- `.eslintrc.json` - ESLint rules (includes 200-line file limit)

---

## 📋 Critical Development Rules

### File Size Limit (CRITICAL)

- **All source files MUST be under 200 lines**
- ESLint rule: `max-lines-per-file: 200`
- Split large files into smaller modules

### TypeScript Requirements

- All code MUST use TypeScript (no `.js` files)
- Strict mode enabled
- No `any` types (use `unknown` or proper types)
- All functions must have explicit return types

### Component Standards

- One component per file
- Server Components by default
- Client Components only when needed (`'use client'`)
- Use functional components only

### Import Organization

- Group imports: external → internal → types
- Use path aliases (`@/components` not `../../components`)
- Absolute imports preferred

### Code Comments

- All comments in English
- JSDoc for exported functions/components
- Explain "why" not "what"

---

## 🔐 Authentication

All API requests require:

```http
Authorization: Bearer {JWT_TOKEN}
X-Cabinet-Id: {cabinet_id}
```

The API client (`src/lib/api.ts`) automatically includes these headers.

### Role-Based API Access (Story 23.10)

Some endpoints require specific roles:

| Endpoint | Manager+ | Analyst |
|----------|----------|---------|
| `POST /v1/tasks/enqueue` | ✅ | ❌ 403 |
| `PUT /v1/schedules/:id` | ✅ | ❌ 403 |
| `POST /v1/schedules/:id/trigger` | ✅ | ❌ 403 |
| `GET /v1/schedules/*` | ✅ | ✅ |
| `GET /v1/tasks/*` | ✅ | ✅ |

**Frontend Action Required:**
- Hide/disable action buttons for Analyst users
- Example: Manual margin recalculation button in `ProductMarginCell.tsx`

---

## 🧪 Testing

### Test Structure

- **Unit Tests:** `src/**/*.test.tsx` (colocated with components)
- **Integration Tests:** `src/**/*.test.tsx` (using MSW for API mocking)
- **E2E Tests:** `e2e/**/*.spec.ts` (Playwright)

### Running Tests

```bash
npm test              # Unit tests
npm run test:coverage # With coverage report
npm run test:e2e      # E2E tests
```

### Test Coverage Goals

- Unit Tests: 60%+
- Integration Tests: 30%+
- E2E Tests: 10%+

---

## 🚢 Deployment

📖 **[Complete Deployment Guide](docs/DEPLOYMENT-GUIDE.md)** - Подробная инструкция по продакшн-деплою

### Quick Start Deployment

#### Option 1: PM2 (Recommended)

**Development Environment:**
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - defaults work for local dev)
# Edit .env.local if needed

# 3. Start in development mode
pm2 start ecosystem.config.js --only wb-repricer-frontend-dev

# 4. Verify it's running
pm2 status
pm2 logs wb-repricer-frontend-dev

# Application will be available at: http://localhost:3100
```

**Production Environment:**
```bash
# 1. Install dependencies
npm install

# 2. Set production environment variables
# Create .env.local or set system environment variables:
# NEXT_PUBLIC_API_URL=https://your-api-domain.com
# NODE_ENV=production

# 3. Build the application
npm run build

# 4. Start in production mode
pm2 start ecosystem.config.js --only wb-repricer-frontend --env production

# 5. Save PM2 configuration for auto-restart on server reboot
pm2 save
pm2 startup  # Follow instructions to enable auto-start

# 6. Verify it's running
pm2 status
pm2 logs wb-repricer-frontend

# Application will be available at: http://localhost:3100
```

**PM2 Process Management:**
```bash
# View all processes
pm2 list

# View logs (real-time)
pm2 logs wb-repricer-frontend-dev
pm2 logs wb-repricer-frontend

# Restart process
pm2 restart wb-repricer-frontend-dev
pm2 restart wb-repricer-frontend

# Stop process
pm2 stop wb-repricer-frontend-dev
pm2 stop wb-repricer-frontend

# Delete process
pm2 delete wb-repricer-frontend-dev
pm2 delete wb-repricer-frontend

# Monitor resources
pm2 monit
```

#### Option 2: Direct Next.js (Development Only)

```bash
# Development mode
npm run dev
# Available at: http://localhost:3000

# Production mode (requires build)
npm run build
npm run start
# Available at: http://localhost:3000
```

#### Option 3: Docker (Optional)

The project includes Docker configuration. See `Dockerfile` for details.

### Environment Configuration

**Development:**
- Uses `next dev` command
- No caching (always fresh code)
- Hot reload enabled
- Debug information available
- Default API URL: `http://localhost:3000`

**Production:**
- Uses `next start` command (requires `npm run build` first)
- Caching enabled for performance
- Optimized bundle
- Set `NEXT_PUBLIC_API_URL` environment variable
- Recommended: Use HTTPS in production

### Port Configuration

- **Development (npm run dev):** Port 3000 (Next.js default)
- **PM2 (both modes):** Port 3100 (configured in `ecosystem.config.js`)

To change the port, edit `ecosystem.config.js`:
```javascript
env: {
  NODE_ENV: 'development',
  PORT: 3100, // Change this value
}
```

### Caching Behavior

**Development Mode:**
- ✅ No ISR caching (`isrMemoryCacheSize: 0`)
- ✅ Minimal page buffer (2 pages, 25s max age)
- ✅ Always fresh code on file changes

**Production Mode:**
- ✅ Full caching enabled
- ✅ Optimized performance
- ✅ Requires rebuild to update code

---

## 💰 Financial Data Structure

### Expense Categories

The system visualizes **9 expense categories** from the weekly finance summary:

| # | Category (Russian) | API Field (summary_total) | Description |
|---|-------------------|--------------------------|-------------|
| 1 | Логистика | `logistics_cost_total` | Delivery + returns logistics |
| 2 | Хранение | `storage_cost_total` | Storage fees |
| 3 | Платная приёмка | `paid_acceptance_cost_total` | Paid acceptance services |
| 4 | Штрафы | `penalties_total` | Penalties |
| 5 | Прочие комиссии WB | `wb_commission_adj_total` | Various deductions and payments: WB promotion services, one-time compensations. Not tied to orders. Contains only `commission_other` (excludes `commission_sales`) |
| 6 | Комиссия лояльности | `loyalty_fee_total` | Loyalty program fees |
| 7 | Удержание баллов лояльности | `loyalty_points_withheld_total` | Loyalty points withheld |
| 8 | Эквайринг | `acquiring_fee_total` | Acquiring fees (added in Request #06) |
| 9 | Комиссия продаж | `commission_sales_total` | Sales commission (added in Request #06) |

### API Response Structure

**Endpoint:** `GET /v1/analytics/weekly/finance-summary?week=YYYY-Www`

**Response Format:**
```typescript
{
  data: {
    summary_rus: {
      week: "2025-W45",
      report_type: "основной",

      // Revenue metrics - Request #41: Separate sales and returns
      sales_gross: number,             // Только продажи (doc_type='sale') - NEW
      returns_gross: number,           // Только возвраты (doc_type='return') - NEW
      sale_gross: number,              // NET = sales - returns (backward compat)
      to_pay_goods: number,            // К перечислению за товар

      // All 9 expense categories (positive values)
      logistics_cost: number,          // 1. Логистика
      storage_cost: number,            // 2. Хранение
      paid_acceptance_cost: number,    // 3. Платная приёмка
      penalties_total: number,         // 4. Штрафы
      wb_commission_adj: number,       // 5. Прочие комиссии WB (commission_other only)
      acquiring_fee_total: number,     // 6. Эквайринг
      commission_sales_total: number,  // 7. Комиссия продаж
      loyalty_fee: number,             // 8. Комиссия лояльности
      loyalty_points_withheld: number, // 9. Удержание баллов

      // Compensations (can be positive)
      loyalty_compensation: number,
      other_adjustments_net: number,

      // Special revenue (informational, not in payout_total)
      seller_delivery_revenue: number,     // DBS/EDBS paid delivery
      transport_reimbursement_neutral: number, // Transport reimbursement (qty=2)

      // Final result (can be negative)
      payout_total: number,            // Итого к оплате

      // Transaction metrics
      transaction_count: number,
      product_transactions: number,    // qty=1 (товарные операции)
      service_transactions: number,    // qty=0 (сервисные операции)

      created_at: string,
      updated_at: string
    },

    summary_eaeu: { /* Same structure for EAEU */ },

    summary_total: {
      // Consolidated totals (RUS + EAEU)
      // All fields with _total suffix
      week: "2025-W45",

      // Request #41: Separate sales and returns
      sales_gross_total: number,       // Только продажи - NEW
      returns_gross_total: number,     // Только возвраты - NEW
      sale_gross_total: number,        // NET = sales - returns (backward compat)
      to_pay_goods_total: number,
      logistics_cost_total: number,
      storage_cost_total: number,
      paid_acceptance_cost_total: number,
      penalties_total: number,
      wb_commission_adj_total: number,
      acquiring_fee_total: number,
      commission_sales_total: number,
      loyalty_fee_total: number,
      loyalty_points_withheld_total: number,
      loyalty_compensation_total: number,
      other_adjustments_net_total: number,
      seller_delivery_revenue_total: number,
      transport_reimbursement_neutral_total: number,
      payout_total: number,
      transaction_count_total: number,
      created_at: string,
      updated_at: string
    }
  },

  meta: {
    week: "2025-W45",
    cabinet_id: string,
    generated_at: string,
    timezone: "Europe/Moscow"
  }
}
```

### Payout Total Formula (WB Dashboard Compatible - Request #49 + #51)

```
payout_total = to_pay_goods           // WB "К перечислению за товар"
  - logistics_cost                     // WB "Стоимость логистики"
  - storage_cost                       // WB "Стоимость хранения"
  - paid_acceptance_cost               // WB "Стоимость платной приёмки"
  - penalties_total                    // WB "Общая сумма штрафов"
  - other_adjustments_net              // WB "Прочие удержания/выплаты"
  - wb_commission_adj                  // WB "Корректировка ВВ" (Request #51)
```

**Important Notes:**
- All expense values are stored as **positive numbers** (absolute values)
- Fields return `0` (not `null` or `undefined`) when no expenses in category
- `payout_total` can be **negative**
- `wb_commission_adj` = `commission_other` WHERE `reason='Удержание'` **ONLY** (see below)

**⚠️ КРИТИЧНО: wb_commission_adj Filtering (Request #51)**

Поле `commission_other` в raw данных содержит **4 разных типа** записей:

| reason | Сумма | Вычитаем? | Почему |
|--------|-------|-----------|--------|
| **Продажа** | 67,064₽ | ❌ НЕТ | Уже в `total_commission_rub` (двойной учёт!) |
| **Возврат** | 1,080₽ | ❌ НЕТ | Уже в `total_commission_rub` (двойной учёт!) |
| **Возмещение за ПВЗ** | 36,967₽ | ❌ НЕТ | **Инфо-строка** (gross=0, комиссия уже в retail-gross) |
| **Удержание** | 4,008₽ | ✅ ДА | Реальное удержание = WB "Корректировка ВВ" |

**SQL-агрегация:**
```sql
-- ПРАВИЛЬНО: только reason='Удержание'
SUM(CASE WHEN reason = 'Удержание' THEN ABS(commission_other) ELSE 0 END) as wb_commission_adj

-- НЕПРАВИЛЬНО: ВСЁ commission_other (занижение payout на 3-12K₽/неделю!)
SUM(ABS(commission_other)) as wb_commission_adj
```

📖 **Полная документация**: `docs/WB-DASHBOARD-METRICS.md` | `docs/request-backend/51-wb-commission-adj-payout.md`

**"Корректировка ВВ" (wb_commission_adj) Details:**
- **Source:** WB Excel column "Прочие удержания/начисления" WHERE reason='Удержание'
- **Contains:** Only actual WB commission adjustments (deductions)
- **Examples:**
  - WB commission corrections
  - Additional deductions for services
- **Characteristics:**
  - `doc_type = 'service'`, `gross = 0`, `net_for_pay = 0`
  - Only `reason = 'Удержание'` entries
  - Matches WB Dashboard "Корректировка Вознаграждения ВВ" field exactly

### Implementation Reference

- **Expense Chart:** `src/components/custom/ExpenseChart.tsx`
- **Expense Hook:** `src/hooks/useExpenses.ts`
- **Finance Types:** `src/hooks/useDashboard.ts` (FinanceSummary interface)
- **Story Documentation:** `docs/stories/3.3.expense-breakdown-visualization.md`
- **Backend Request:** `docs/request-backend/06-missing-expense-fields-in-finance-summary.md`

---

## 🛒 Product List & Pagination

### Implementation Overview

The product list (`/cogs` page) uses **cursor-based pagination** with a **client-side workaround** for Wildberries SDK issues.

**Features:**
- ✅ Cursor-based pagination (server-side slicing)
- ✅ Product search by `nm_id`, `sa_name`, or `brand` (partial match)
- ✅ Debounced search input (500ms delay) - prevents API spam
- ✅ Filter by COGS status (`has_cogs`: all/with/without)
- ✅ Pagination controls ("Назад"/"Вперёд" buttons)
- ✅ Accurate counter ("Показано X из Y товаров")
- ✅ Redis caching (1 hour TTL) for performance

### Technical Implementation

**Problem:** Wildberries SDK cursor pagination returned duplicate products on page 2 instead of next products.

**Solution:** Backend implements client-side pagination workaround:
1. Fetch ALL products via `getAllProductsList()` (with Redis cache)
2. Apply filters (category, `has_cogs`) on server
3. Paginate using `findIndex()` + `slice()` based on cursor
4. Return correct page to frontend

**Performance:**
- First load: ~500ms (fetches all products from WB API)
- Cached loads: ~50ms (instant page switching)
- Tested with 30+ products successfully

**Documentation:**
- Issue report: `docs/request-backend/13-products-pagination-wb-sdk-issue.md`
- Completion summary: `docs/request-backend/REQUEST-13-FINAL-COMPLETION.md`
- Story integration: `docs/stories/4.1.single-product-cogs-assignment.md`

**Frontend Components:**
- Hook: `src/hooks/useProducts.ts` - TanStack Query with cursor pagination
- Component: `src/components/custom/ProductList.tsx` - Product list with pagination UI
- Page: `src/app/(dashboard)/cogs/page.tsx` - COGS management page

### Product Search Fixes (2025-11-23)

Three search-related bugs were fixed in the same session:

**Fix 1: Search Parameter Name Mismatch**
- **Problem**: Frontend sent `search=` parameter, backend expected `q=`
- **Solution**: Changed `useProducts.ts` to send `q` parameter (line 47)
- **Documentation**: `docs/BUG-FIX-SEARCH-PARAMETER-MISMATCH.md`

**Fix 2: Search Input Disappearing on Keystroke**
- **Problem**: Input field disappeared after each keystroke (skeleton loading hid entire component)
- **Solution**:
  - Added debounce (500ms delay) using two-state pattern (`searchInput` + `search`)
  - Show skeleton only on first load, not during subsequent searches
- **Benefits**: 90%+ reduction in API calls, smooth typing experience
- **Documentation**: `docs/BUG-FIX-SEARCH-INPUT-DISAPPEARING.md`

**Fix 3: Partial Article Search Not Working (Backend)**
- **Problem**: Search "3216" didn't find products with articles "321678606"
- **Root Cause**: WB API `textSearch` doesn't support partial article matching
- **Solution**: Backend now filters client-side for partial article matches
- **Search Fields**: `nm_id` (partial), `sa_name` (partial, case-insensitive), `brand` (partial, case-insensitive)
- **Documentation**: `docs/BACKEND-CHANGES-SEARCH-FIX.md` (frontend), backend request #14

**How Search Works Now**:
1. User types "3216" → Input shows immediately (no API call yet)
2. After 500ms of no typing → API call with `?q=3216`
3. Backend fetches all products (cached) → Filters by `nmId.includes("3216")`
4. Returns matching products → Frontend updates table (input stays visible)

**Performance**:
- First search: ~500ms (backend fetch + filter)
- Subsequent searches: ~50ms (Redis cache + in-memory filter)
- Typing experience: Instant feedback, no input lag

---

## 💰 Margin Display in Product List (Request #15) - 2025-11-23

### Overview

Added opt-in margin display for product list via `enableMarginDisplay` prop, powered by backend `include_cogs=true` parameter.

**Feature**: Show margin data directly in product list without clicking each product.

### Quick Start

```typescript
// Enable margin display on COGS management page
<ProductList
  showOnlyWithoutCogs={false}
  enableSelection={true}
  enableMarginDisplay={true}  // ← Add this to show margin
/>
```

**Result:**
- Products with sales: `35.5%` (green for positive, red for negative)
- No sales: `— (нет продаж)`
- No COGS: `— (нет COGS)`
- Analytics unavailable: `— (недоступно)`

### Features

- ✅ **Backend API**: `GET /v1/products?include_cogs=true` (batched Epic 17 analytics)
- ✅ **Frontend Hook**: `useProducts({ include_margin: true })`
- ✅ **Component Prop**: `<ProductList enableMarginDisplay={true} />`
- ✅ **Performance**: ~300ms for 25 products (8x faster with batching)
- ✅ **Backward Compatible**: Default behavior unchanged (fast ~150ms)
- ✅ **Color Coding**: Green (positive), Red (negative), Gray (null)
- ✅ **Missing Data Reasons**: Clear explanations when margin unavailable

### Technical Implementation

**Problem**: Margin data only available in single product detail view due to performance concerns.

**Solution**: Backend implements batched Epic 17 analytics query:
1. Single batch query for all products on page (~150ms)
2. HashMap-based O(1) product enrichment (<1ms per product)
3. Total: ~300ms for 25 products vs 2.5s with sequential queries

**Performance:**
- Without margin (`enableMarginDisplay=false`): ~150ms (default, unchanged)
- With margin (`enableMarginDisplay=true`): ~300ms (+150ms overhead)
- 8x faster than simple sequential implementation (300ms vs 2500ms)

### Usage Patterns

**COGS Management** (recommended - show margin):
```typescript
<ProductList
  showOnlyWithoutCogs={false}
  enableMarginDisplay={true}  // Show margin for COGS work
/>
```

**Product Browsing** (default - keep fast):
```typescript
<ProductList
  enableMarginDisplay={false}  // Default: fast loading
/>
// Shows: "— (в карточке)" hint
```

**Toggle Margin Display**:
```typescript
const [showMargin, setShowMargin] = useState(false)

<Button onClick={() => setShowMargin(!showMargin)}>
  {showMargin ? 'Скрыть маржу' : 'Показать маржу'}
</Button>

<ProductList enableMarginDisplay={showMargin} />
```

### API Integration

**Hook Enhancement**:
```typescript
// src/hooks/useProducts.ts
export interface ProductFilters {
  // ... existing filters
  include_margin?: boolean  // Request #15: Request margin data
}

// Sends include_cogs=true to backend when include_margin=true
if (filters.include_margin) {
  params.append('include_cogs', 'true')
}
```

**Backend Response** (when `include_cogs=true`):
```json
{
  "products": [
    {
      "nm_id": "147205694",
      "sa_name": "Жидкая кожа черная",
      "has_cogs": true,
      "cogs": { "unit_cost_rub": 22.00 },

      "current_margin_pct": 35.5,           // NEW
      "current_margin_period": "2025-W46",  // NEW
      "current_margin_sales_qty": 50,       // NEW
      "current_margin_revenue": 125000.50,  // NEW
      "missing_data_reason": null           // NEW
    }
  ]
}
```

### Documentation

**Backend**:
- Completion Summary: `docs/request-backend/REQUEST-15-COMPLETION-SUMMARY.md`
- Implementation Plan: `docs/request-backend/REQUEST-15-IMPLEMENTATION-PLAN.md`
- E2E Tests: `test/products/products-include-cogs.e2e-spec.ts`

**Frontend**:
- Backend Response: `docs/backend-response-15-includecogs-implementation.md`
- Usage Guide: `docs/REQUEST-15-USAGE-GUIDE.md`
- Integration Complete: `docs/REQUEST-15-FRONTEND-INTEGRATION-COMPLETE.md`
- Ready to Use: `docs/REQUEST-15-READY-TO-USE.md`

**Related**:
- Epic 17 Story 17.2: `docs/stories/epic-17/story-17.2-api-includecogs-flag.md`
- Epic 18 Phase 1: `docs/backend-response-09-epic-18-products-api-enhancement.md`

### Files Modified

**Frontend Changes**:
1. `src/hooks/useProducts.ts` - Added `include_margin` flag
2. `src/components/custom/ProductList.tsx` - Added `enableMarginDisplay` prop and display logic

**Backend Changes** (already deployed):
3. `src/products/dto/query-products.dto.ts` - Added `include_cogs` parameter
4. `src/products/products.service.ts` - Batch margin enrichment
5. `test/products/products-include-cogs.e2e-spec.ts` - E2E tests

### Performance

| Scenario | Products | Margin | Time |
|----------|----------|--------|------|
| Default | 25 | No | ~150ms |
| With margin | 25 | Yes | ~300ms |
| Default | 50 | No | ~200ms |
| With margin | 50 | Yes | ~500ms |

**Recommendations**:
- Use `enableMarginDisplay=true` on COGS management UI
- Keep default `false` for general product browsing
- Pagination limit 25-50 products when margin enabled

---

## 📦 Storage Costs in Product List (Epic 24) - 2025-11-29

### Overview

Added opt-in storage cost display for product list via `include_storage=true` parameter, enabling storage cost analysis directly in product tables.

**Feature**: Show storage costs per product without navigating to separate Storage Analytics page.

### Quick Start

```typescript
// Enable storage display in hook
const { data } = useProducts({
  include_storage: true,  // ← Request storage data
  limit: 50
})

// Access storage fields on each product
products.forEach(product => {
  console.log(product.storage_cost_daily_avg)  // 12.50 ₽/день
  console.log(product.storage_cost_weekly)     // 87.50 ₽/неделю
  console.log(product.storage_period)          // "2025-W47"
})
```

### Features

- ✅ **Backend API**: `GET /v1/products?include_storage=true`
- ✅ **Frontend Hook**: `useProducts({ include_storage: true })`
- ✅ **Type Safety**: `ProductListItem` includes storage fields
- ✅ **Performance**: Extended stale time (60s) for expensive queries
- ✅ **Backward Compatible**: Default behavior unchanged

### API Integration

**Hook Enhancement**:
```typescript
// src/hooks/useProducts.ts
export interface ProductFilters {
  // ... existing filters
  include_storage?: boolean  // Epic 24: Request storage cost data
}

// Sends include_storage=true to backend when enabled
if (filters.include_storage) {
  params.append('include_storage', 'true')
}
```

**Response Fields** (when `include_storage=true`):
```typescript
// src/types/cogs.ts - ProductListItem
interface ProductListItem {
  // ... existing fields

  // Epic 24: Storage cost fields
  storage_cost_daily_avg?: number | null  // Average daily cost in ₽
  storage_cost_weekly?: number | null     // Total weekly cost in ₽
  storage_period?: string | null          // ISO week (e.g., "2025-W47")
}
```

**Backend Response Example**:
```json
{
  "products": [
    {
      "nm_id": "147205694",
      "sa_name": "Жидкая кожа черная",
      "has_cogs": true,

      "storage_cost_daily_avg": 12.50,    // NEW
      "storage_cost_weekly": 87.50,        // NEW
      "storage_period": "2025-W47"         // NEW
    }
  ]
}
```

### Files Modified

**Frontend Changes**:
1. `src/types/cogs.ts` - Added storage fields to `ProductListItem` interface
2. `src/hooks/useProducts.ts` - Added `include_storage` parameter to `ProductFilters`

### Documentation

- Epic Overview: `docs/stories/epic-24/README.md`
- Story 24.7-fe: `docs/stories/epic-24/story-24.7-fe-product-card-storage.md`
- Backend API: `docs/request-backend/36-epic-24-paid-storage-analytics-api.md`

### Related

- Epic 24: Paid Storage Analytics (8 frontend stories)
- Storage Analytics Page: `/analytics/storage`
- Product Storage Info Component: `src/components/custom/ProductStorageInfo.tsx`

---

## 🔄 Manual Margin Recalculation (Request #17) - 2025-01-27

### Overview

When COGS is assigned with a date **after** the last completed week, automatic margin recalculation is skipped. This section explains why and how to manually trigger recalculation.

**Feature**: Warning message and manual recalculation button in COGS assignment form.

### Problem

**Scenario:**
- Last completed week: W46 (ended November 19, 2025)
- COGS assigned: November 23-24, 2025 (AFTER last completed week)
- Expected: Margin calculated for week W46 using temporal COGS lookup
- Actual: Margin not shown (`current_margin_pct: null`)

**Root Cause:**
- Backend's `calculateAffectedWeeks()` returns empty array if `valid_from > last completed week end`
- Automatic recalculation task is not enqueued
- `weekly_margin_fact` table is not updated for historical weeks
- API reads from `weekly_margin_fact` → shows `null` instead of calculated margin

### Solution

**Frontend Implementation:**
1. **Warning Alert**: Shows when COGS `valid_from` date is after last completed week
2. **Manual Recalculation Button**: Triggers `POST /v1/tasks/enqueue` for specific week
3. **Recommendation**: Suggests assigning COGS with historical date for automatic recalculation

**Component**: `src/components/custom/SingleCogsForm.tsx`

**Hook**: `src/hooks/useManualMarginRecalculation.ts`

### Usage

**Automatic (Recommended):**
```typescript
// Assign COGS with date DURING target week
POST /v1/products/321678606/cogs
{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-15",  // ✅ Date DURING week W46
  "source": "manual"
}
// Result: Automatic recalculation triggered for W46
```

**Manual (When Needed):**
```typescript
// 1. Assign COGS with future date
POST /v1/products/321678606/cogs
{
  "unit_cost_rub": 999.00,
  "valid_from": "2025-11-23",  // ⚠️ Date AFTER week W46
  "source": "manual"
}

// 2. Form shows warning + button
// 3. User clicks "Пересчитать маржу для 2025-W46"
// 4. Frontend calls:
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "payload": {
    "cabinet_id": "...",
    "weeks": ["2025-W46"],
    "nm_ids": ["321678606"]
  }
}
```

### UI Behavior

**Warning Alert** (shown in form):
```
⚠️ COGS назначен с даты после последней завершенной недели (2025-W46)

Автоматический пересчет маржи для прошлых недель не запустится. 
Если нужна маржа для 2025-W46, назначьте COGS с датой до или во время этой недели.

[Пересчитать маржу для 2025-W46] ← Button
```

### Technical Details

**Files Created:**
- `src/hooks/useManualMarginRecalculation.ts` - Hook for manual recalculation API call
- Updated `src/components/custom/SingleCogsForm.tsx` - Warning alert and button

**Helper Functions:**
- `isCogsAfterLastCompletedWeek()` - Checks if COGS date is after last completed week
- `getLastCompletedWeek()` - Calculates last completed week (matches backend logic)

**API Endpoint:**
- `POST /v1/tasks/enqueue` - Enqueue margin recalculation task
- Response: `{ task_uuid, status, enqueued_at }`

### Documentation

**Backend:**
- Request #17: `docs/request-backend/17-cogs-assigned-after-completed-week-recalculation.md`
- COGS Backdating Logic: `docs/COGS-BACKDATING-BUSINESS-LOGIC.md`
- Epic 20 Overview: Backend documentation

**Frontend:**
- Story 4.1: `docs/stories/4.1.single-product-cogs-assignment.md` (updated with warning)
- Story 4.8: `docs/stories/4.8.margin-recalculation-polling.md` (related polling feature)

### Best Practices

1. **Assign COGS with Historical Date**: If you need margin for week W46, set `valid_from` to a date during W46 (e.g., November 15)
2. **Use Manual Recalculation**: Only needed if COGS must be assigned with future date
3. **Check Existing COGS**: Before assigning, check if historical COGS exists via `GET /v1/cogs?nm_id=<nmId>&valid_at=<date>`

### Role-Based Access Control (Story 23.10)

**⚠️ Important**: Manual recalculation requires **Manager+** role.

| Role | Manual Recalculation | View Margin |
|------|---------------------|-------------|
| Owner | ✅ Allowed | ✅ |
| Manager | ✅ Allowed | ✅ |
| Service | ✅ Allowed | ✅ |
| Analyst | ❌ Hidden (403) | ✅ |

**Frontend Implementation:**
- Button "Пересчитать вручную" hidden for Analyst users
- Uses `canEnqueueTasks(role)` helper function
- Files: `ProductMarginCell.tsx`, `SingleCogsForm.tsx`

### Task Types Reference

| Task Type | Purpose | Status |
|-----------|---------|--------|
| `finances_weekly_ingest` | Import weekly financial data | Active |
| `products_sync` | Sync product catalog | Active |
| `recalculate_weekly_margin` | Recalculate margins for weeks | Active (recommended) |
| `weekly_margin_aggregate` | Re-aggregate weekly data | Active |
| `weekly_sanity_check` | Data quality validation | Active |
| `publish_weekly_views` | Publish materialized views | Active |
| `enrich_cogs` | Legacy margin calculation | **Deprecated** |

**Note:** `enrich_cogs` is deprecated. Use `recalculate_weekly_margin` instead.

---

## 🔄 Margin Recalculation Polling (Story 4.8) - 2025-11-25

### Overview

After COGS assignment, automatic polling monitors margin calculation progress and updates UI in real-time.

**Feature**: Real-time margin status updates after COGS assignment with automatic polling.

### Key Components

**Hooks:**
- `useMarginPolling.ts` - Generic polling hook with configurable intervals
- `useSingleCogsAssignmentWithPolling.ts` - Single COGS + auto-polling
- `useBulkCogsAssignmentWithPolling.ts` - Bulk COGS + batch polling
- `useManualMarginRecalculation.ts` - Manual trigger via `POST /v1/tasks/enqueue`

**Helper Functions:**
- `margin-helpers.ts`:
  - `getLastCompletedWeek()` - Returns ISO week string for last completed week
  - `isCogsAfterLastCompletedWeek(validFrom)` - Checks if COGS date is after last completed week
  - `calculateAffectedWeeks(validFrom)` - Returns array of ISO weeks needing recalculation

**Components:**
- `MarginCalculationStatus.tsx` - Status display with warnings

**Store:**
- `marginPollingStore.ts` - Zustand store for polling state

### Polling Strategy

| Operation | Interval | Max Attempts | Timeout |
|-----------|----------|--------------|---------|
| Single COGS | 5s | 12 | 1 min |
| Historical COGS | 5s | 12 | Warning shown |
| Bulk (≤100) | 3s | 20 | 1 min |
| Bulk (>100) | 5s | 36 | 3 min |

### API Integration

**Epic 20**: Automatic margin recalculation via `POST /v1/products/:nmId/cogs`
**Epic 22**: Status endpoint `GET /v1/products/:nmId/margin-status`
**Manual**: Task queue `POST /v1/tasks/enqueue`

### Test Coverage

23 unit tests:
- 19 helper function tests (`margin-helpers.test.ts`)
- 4 polling hook tests (`useMarginPolling.test.ts`)

### Documentation

- Story Document: `docs/stories/4.8.margin-recalculation-polling.md`
- Backend Requests: #14, #17, #20, #21
- Epic 4 Summary: `docs/stories/EPIC-4-COMPLETION-SUMMARY.md`

---

## 📖 Key Patterns

### Currency Formatting

```typescript
import { formatCurrency } from '@/lib/utils'
formatCurrency(1234567.89) // => "1 234 567,89 ₽"
```

### Conditional Classes

```typescript
import { cn } from '@/lib/utils'
<div className={cn('base-class', condition && 'conditional-class')} />
```

### API Client Usage

```typescript
import { dashboardApi } from '@/lib/api'
const metrics = await dashboardApi.getMetrics()
```

### TanStack Query Hook

```typescript
import { useDashboard } from '@/hooks/useDashboard'
const { data, isLoading, error } = useDashboard()
```

### Zustand Store

```typescript
import { useAuthStore } from '@/stores/authStore'
const { user, token, login, logout } = useAuthStore()
```

---

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript errors:** Run `npm run type-check`
2. **ESLint errors:** Run `npm run lint:fix`
3. **Build fails:** Check for files over 200 lines
4. **API connection:** 
   - Default value `http://localhost:3000` works for local development
   - Verify `NEXT_PUBLIC_API_URL` in `.env.local` if you need a different URL
   - No warning needed - default is acceptable for development
5. **PM2 process not starting:**
   - Check logs: `pm2 logs wb-repricer-frontend-dev` or `pm2 logs wb-repricer-frontend`
   - Verify port 3100 is not in use: `lsof -i :3100`
   - For production: ensure `npm run build` completed successfully
   - Check if process already exists: `pm2 list`
6. **Caching issues in development:**
   - Development mode has caching disabled by default (`isrMemoryCacheSize: 0`)
   - Clear browser cache (Ctrl+Shift+R / Cmd+Shift+R)
   - Restart PM2 process: `pm2 restart wb-repricer-frontend-dev`
   - Ensure you're using development mode, not production
7. **Port already in use:**
   - Change port in `ecosystem.config.js` or use `PORT=3101 pm2 start ...`
   - Or stop the process using the port: `pm2 stop wb-repricer-frontend-dev`
   - Check what's using the port: `lsof -i :3100`
8. **Environment variable warnings:**
   - Default values are provided for local development
   - No warnings should appear - defaults are acceptable
   - In production, set `NEXT_PUBLIC_API_URL` explicitly

### Getting Help

- Review `docs/front-end-architecture.md` for detailed patterns
- Check `docs/front-end-spec.md` for UI/UX guidelines
- Reference backend API docs in `../docs/frontend-po/`

---

## 📝 Next Steps for Developers

1. **Read the Architecture Document**
   - Review `docs/front-end-architecture.md` thoroughly
   - Understand project structure and patterns

2. **Set Up Development Environment**
   - Install dependencies: `npm install`
   - Environment variables are optional (defaults work for local dev)
   - Initialize shadcn/ui components as needed
   - Choose your development mode:
     - **Option A:** `npm run dev` (port 3000, standard Next.js)
     - **Option B:** `pm2 start ecosystem.config.js --only wb-repricer-frontend-dev` (port 3100, PM2 managed)

3. **Review UI/UX Specifications**
   - Study `docs/front-end-spec.md` for design requirements
   - Understand user flows and component specifications

4. **Start with First Story**
   - Follow story requirements from PRD
   - Use architecture patterns and templates
   - Keep files under 200 lines

5. **For Server Deployment**
   - Build the application: `npm run build`
   - Start in production mode: `pm2 start ecosystem.config.js --only wb-repricer-frontend --env production`
   - Set production environment variables (especially `NEXT_PUBLIC_API_URL`)
   - Configure PM2 auto-start: `pm2 save && pm2 startup`

---

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

## 📦 Paid Storage Analytics (Epic 24) - 2025-11-29

### Overview

**Аналитика расходов на хранение** - новый раздел системы для анализа затрат на платное хранение товаров на складах Wildberries.

**Бизнес-ценность**: Продавцы могут анализировать расходы на хранение по SKU, выявлять товары с высокими затратами и оптимизировать складскую стратегию.

**Маршрут**: `/analytics/storage` (в сайдбаре: Аналитика → Хранение)

### 24.1 Типы данных и API-клиент

**Что это**: Базовые TypeScript типы и React Query хуки для работы с API расходов на хранение.

**Файлы**:
- `src/types/storage-analytics.ts` - Типы данных
- `src/lib/api/storage-analytics.ts` - API клиент
- `src/hooks/useStorageAnalytics.ts` - React Query хуки

**Доступные хуки**:
```typescript
// Данные по товарам
const { data } = useStorageBySku(weekStart, weekEnd, { brand, warehouse, limit });

// Топ-потребители
const { data } = useStorageTopConsumers(weekStart, weekEnd, { limit: 5, include_revenue: true });

// Тренды
const { data } = useStorageTrends(weekStart, weekEnd, { metrics: ['storage_cost'] });

// Импорт данных
const mutation = usePaidStorageImport();
await mutation.mutateAsync({ dateFrom: '2025-11-18', dateTo: '2025-11-24' });
```

**Ключевые типы**:
```typescript
interface StorageBySkuItem {
  nm_id: string;
  vendor_code: string | null;
  product_name: string | null;
  brand: string | null;
  storage_cost_total: number;      // Общие расходы за период
  storage_cost_avg_daily: number;  // Средние расходы в день
  volume_avg: number | null;       // Средний объём (л)
  warehouses: string[];            // Склады
  days_stored: number;             // Дней хранения
}

interface TopConsumerItem {
  rank: number;                           // Место в рейтинге
  storage_cost: number;                   // Расходы на хранение
  percent_of_total: number;               // % от общих расходов
  storage_to_revenue_ratio?: number | null; // Соотношение к выручке
}
```

### 24.2 Страница аналитики хранения

**Что это**: Основная страница для анализа расходов на хранение с фильтрами и карточками метрик.

**Маршрут**: `/analytics/storage`

**Компоненты страницы**:
1. **Заголовок** с хлебными крошками: `Главная > Аналитика > Хранение`
2. **Фильтры**:
   - Период (недели ISO): `2025-W44` - `2025-W47`
   - Бренды (мультивыбор)
   - Склады (мультивыбор)
3. **Карточки метрик**:
   - Всего затрат (₽)
   - Количество товаров
   - Среднее на товар
   - Период (дни)
4. **Секции визуализации**:
   - График трендов
   - Топ-5 потребителей
   - Полная таблица товаров

**Дизайн-решения**:
- Иконки: только Lucide (`Warehouse`, `TrendingUp`, `Trophy`, `List`)
- Цветовая схема: фиолетовый (#7C4DFF) для хранения
- Мобильная адаптация: горизонтальный скролл таблиц

### 24.3 Таблица расходов по SKU

**Что это**: Детальная таблица всех товаров с данными о хранении.

**Колонки таблицы**:

| Колонка | Сортировка | Описание |
|---------|------------|----------|
| Артикул | ❌ | nm_id (клик → карточка товара) |
| Название | ❌ | Обрезка 45 символов + tooltip |
| Бренд | ❌ | Название бренда |
| Хранение | ✅ | Общие расходы (₽) |
| ₽/день | ✅ | Средние расходы в день |
| Объём | ✅ | Средний объём (л) |
| Склады | ❌ | Бейджи (2 видимых + "+N") |
| Дней | ✅ | Количество дней хранения |

**Особенности**:
- **Поиск**: по артикулу или названию (дебаунс 500мс)
- **Пагинация**: курсорная, 20 записей на страницу
- **Бейджи складов**: показываем 2 склада + "+N" с tooltip
- **Обрезка названий**: 45 символов + полное имя в tooltip
- **Клик по строке**: переход на `/analytics/sku?nm_id={nm_id}`

**Почему так работает**:
- *Бейджи с overflow* - длинные списки складов не ломают вёрстку
- *Обрезка 45 символов* - реальные названия WB очень длинные
- *Дебаунс 500мс* - снижает нагрузку на API при поиске

### 24.4 Виджет "Топ-5 потребителей"

**Что это**: Компактный виджет с товарами, которые больше всего тратят на хранение.

**Визуальные элементы**:
- 🏆 Место 1: иконка Trophy (золотая)
- 🥈 Место 2: иконка Medal (серебряная)
- 🥉 Место 3: иконка Medal (бронзовая)
- Места 4-5: только номер

**Соотношение хранение/выручка**:
Цветные индикаторы показывают эффективность товара:

| Значение | Цвет | Статус |
|----------|------|--------|
| >20% | 🔴 Красный | Требует оптимизации |
| 10-20% | 🟡 Жёлтый | Обратите внимание |
| <10% | 🟢 Зелёный | Здоровое соотношение |
| null | ⚫ Серый | Нет данных о выручке |

**Tooltip**: объясняет что означает показатель и даёт рекомендации.

**Почему так работает**:
- *Иконки Lucide* - согласованность с дизайн-системой
- *CSS-классы для цветов* - доступность и темизация
- *Tooltip с рекомендациями* - помощь пользователю

### 24.5 График трендов расходов

**Что это**: Area-график динамики расходов на хранение по неделям.

**Компоненты графика**:
1. **Заголовок**: "Динамика расходов на хранение"
2. **Бейдж тренда**:
   - `+5.2%` 🔴 (рост = плохо для расходов)
   - `-3.1%` 🟢 (снижение = хорошо)
3. **Статистика**: Мин, Макс, Среднее
4. **График**:
   - Ось X: недели (W44, W45...)
   - Ось Y: сумма в ₽ (28k, 30k...)
   - Заливка: фиолетовый градиент

**Обработка пустых данных**:
- Разрывы в графике (не интерполируем)
- Пунктирный круг для недель без данных
- Tooltip: "Нет данных за эту неделю"

**Почему так работает**:
- *Разрывы вместо интерполяции* - честная визуализация данных
- *Красный для роста* - для расходов рост = негатив
- *Фиолетовый цвет* - отличие от других графиков (красный = расходы, зелёный = доход)

### 24.6 Диалог ручного импорта

**Что это**: Модальное окно для запуска импорта данных о хранении вручную.

**Доступ**: кнопка "Импорт данных" в заголовке страницы (только Manager/Owner)

**Этапы работы**:

1. **Выбор периода**:
   - Два датапикера: "С" и "По"
   - Ограничение: максимум 8 дней (лимит WB API)
   - Валидация: нельзя выбрать будущие даты
   - По умолчанию: последние 7 дней

2. **Процесс импорта**:
   - Индикатор прогресса (анимированный, без %)
   - Статус: "Ожидание в очереди...", "Обработка данных...", etc.
   - Polling статуса каждые 2 секунды

3. **Завершение**:
   - Успех: "Импортировано строк: 3,500"
   - Ошибка: сообщение об ошибке + кнопка повтора

**Закрытие во время импорта**:
- Появляется подтверждение: "Импорт продолжится в фоновом режиме"
- Можно закрыть диалог, импорт не прервётся

**Инфо о расписании**: "Автоматический импорт: каждый вторник в 08:00 МСК"

**Почему так работает**:
- *8 дней максимум* - ограничение Wildberries API
- *Индикатор без %* - бэкенд не возвращает прогресс
- *Продолжение в фоне* - не теряем импорт при закрытии диалога

### 24.7 Информация о хранении в карточке товара

**Что это**: Компонент для отображения расходов на хранение в деталях товара.

**Компонент**: `<ProductStorageInfo nmId="12345678" />`

**Отображение**:
```
📦 160 ₽/день (~4,800 ₽/мес)
```

**Tooltip**: период данных, дневная стоимость, месячная оценка, объём

**Ограничения**:
- Компонент делает отдельный API-запрос
- Не рекомендуется в списках (N+1 проблема)
- Рекомендация: интегрировать storage_cost_daily в ProductListItem на бэкенде

**Почему так работает**:
- *Отдельный запрос* - пока нет интеграции в API продуктов
- *Месячная оценка* - помогает понять масштаб расходов

### 24.8 Алерт о высоком соотношении

**Что это**: Баннер-предупреждение о товарах с высокими расходами на хранение относительно выручки.

**Условие показа**: есть товары с соотношением хранение/выручка > 20%

**Отображение**:
```
⚠️ 5 товаров с соотношением хранение/выручка > 20%
```

**Tooltip с рекомендациями**:
- < 10% — отлично 🟢
- 10-20% — обратите внимание 🟡
- > 20% — требует оптимизации 🔴

Рекомендации:
- Уменьшить запасы на складе
- Повысить оборачиваемость
- Рассмотреть вывод товара

**Плюрализация**: "1 товар", "2 товара", "5 товаров" (русские правила)

**Почему так работает**:
- *Порог 20%* - решение PO на основе бизнес-анализа
- *Tooltip с рекомендациями* - actionable insights для продавца

### File Structure

```
src/
├── app/(dashboard)/analytics/storage/
│   ├── page.tsx                         # Основная страница
│   ├── loading.tsx                      # Skeleton loader
│   └── components/
│       ├── StoragePageHeader.tsx        # Заголовок + breadcrumbs
│       ├── StorageFilters.tsx           # Фильтры периода и брендов
│       ├── StorageSummaryCards.tsx      # Карточки метрик
│       ├── StorageBySkuTable.tsx        # Таблица товаров
│       ├── TopConsumersWidget.tsx       # Топ-5 виджет
│       ├── StorageTrendsChart.tsx       # График трендов
│       ├── StorageAlertBanner.tsx       # Алерт высоких расходов
│       └── PaidStorageImportDialog.tsx  # Диалог импорта
├── components/custom/
│   └── ProductStorageInfo.tsx           # Инфо хранения в карточке
├── types/
│   └── storage-analytics.ts             # TypeScript типы
├── lib/api/
│   └── storage-analytics.ts             # API клиент
└── hooks/
    └── useStorageAnalytics.ts           # React Query хуки
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/analytics/storage/by-sku` | GET | Данные по SKU |
| `/v1/analytics/storage/top-consumers` | GET | Топ потребители |
| `/v1/analytics/storage/trends` | GET | Тренды по неделям |
| `/v1/imports/paid-storage` | POST | Запуск импорта |
| `/v1/imports/{id}` | GET | Статус импорта |

### Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Storage | `#7C4DFF` (Purple) | Charts, badges |
| High cost | `#EF4444` (Red) | >20% ratio |
| Medium cost | `#F59E0B` (Yellow) | 10-20% ratio |
| Low cost | `#22C55E` (Green) | <10% ratio |
| Trend up (bad) | `#DC2626` (Red) | Increasing costs |
| Trend down (good) | `#16A34A` (Green) | Decreasing costs |

### Testing

```bash
# Run all tests
npm test

# Run Epic 24 component tests
npm test -- --testPathPattern="storage"
```

---

## 📄 License

[Add license information if applicable]

---

**Last Updated:** 2025-01-17
**Maintained by:** Development Team

**Recent Updates:**
- 2025-01-17: **Epic 24: Paid Storage Analytics** ✅ COMPLETE — QA Review PASS
  - 11 stories implemented (39 SP total)
  - 133 tests passing, 8 test files, 3.91s duration
  - Unit tests: 21/21 API Client, 28/28 Hooks, 84/84 Components
  - Multi-select brand/warehouse filters
  - Chart click-to-filter interaction
  - Full E2E test coverage
  - QA Review: PASS - Ready for production deployment
  - Route: `/analytics/storage`
- 2025-01-17: **Epic 44: Price Calculator UI** ✅ COMPLETE
  - 6 stories implemented (14 SP total)
  - 208 tests passing (100% coverage)
  - 6 QA gates passed (88-95/100 scores)
  - Real-time calculation with 500ms debounce
  - Visual cost breakdown with stacked bar chart (Recharts)
  - WCAG 2.1 AA accessibility compliance
  - Route: `/cogs/price-calculator`
- 2025-12-06: **Epic 26: Per-SKU Operating Profit & Expense Tracking** ✅ COMPLETE
  - New "Опер. прибыль" column in all 3 margin tables (SKU/Brand/Category)
  - Operating Profit section in Cabinet Summary Dashboard
  - Dormant inventory indicator (💤) for products without sales but with expenses
  - Red color for losses (negative operating profit)
  - Tooltips with expense breakdown and operating margin %
  - New TypeScript types: `SkuOperatingExpenses`, `AggregatedOperatingExpenses`
- 2025-12-06: **Epic 25: Dashboard Data Accuracy** ✅ COMPLETE (5/5 stories)
  - **Story 25.5**: Fixed MarginCalculationService bug (returns were added instead of subtracted)
  - **Story 25.3**: Added WB Commission (`total_commission_rub`) to expenses
  - **Story 25.1**: Redesigned Cabinet Summary Dashboard with P&L structure
  - **Story 25.4**: Verified Top Products ranking uses correct `net_for_pay`
  - **Story 25.2**: Added COGS section to FinancialSummaryTable with profit display
  - Request #44: Extended finance-summary endpoint with COGS fields
- 2025-12-05: **Request #41: Separate Sales & Returns Tracking** ✅
  - New `sales_gross` / `returns_gross` fields in finance summary API
  - `sale_gross` now contains NET (sales - returns) for backward compatibility
  - Updated `FinanceSummary` interface in `useDashboard.ts`
  - Backend request doc: `docs/request-backend/41-separate-sales-returns-tracking.md`
- 2025-12-05: **Epic 6-FE Complete: 100%** (21/21 points) - All 5 stories complete ✅
  - **Story 6.5-FE: Export Analytics UI** (5 pts) ✅
    - New `useExportAnalytics` hook with mutation and status polling
    - New `ExportDialog` component for export configuration
    - New `ExportStatusDisplay` component for progress/download UI
    - Export types: by-sku, by-brand, by-category, cabinet-summary
    - Format selection: CSV or Excel (.xlsx)
    - Auto-download on completion, timeout handling (2 min), retry on failure
  - **Story 6.3-FE: ROI & Profit Metrics Display** (3 pts) ✅
    - New `useColumnVisibility` hook with localStorage persistence
    - New `ColumnVisibilityToggle` component for optional columns
    - New `analytics-utils.ts` with ROI color coding and formatters
    - Updated all 3 margin tables (SKU/Brand/Category) with ROI & Profit/Unit columns
    - Sortable columns with tooltips explaining formulas
  - Stories 6.1 (Date Range), 6.2 (Period Comparison), 6.4 (Cabinet Summary) completed earlier
- 2025-11-29: **Epic 6 Frontend Stories Created** - 5 stories for Advanced Analytics (21 points)
  - Date range support for analytics (weekStart/weekEnd)
  - Period comparison with delta visualization
  - ROI & profit per unit metrics display
  - Cabinet summary dashboard with KPIs
  - Export analytics UI (CSV/Excel)
- 2025-11-29: **Epic 24 Backend Integration** - `include_storage` parameter in Products API
  - Added storage fields to `ProductListItem`: `storage_cost_daily_avg`, `storage_cost_weekly`, `storage_period`
  - Added `include_storage?: boolean` to `ProductFilters` in `useProducts` hook
  - Resolves N+1 query concern for Story 24.7-fe (Product Card Storage Info)
- 2025-11-29: **Epic 24 Complete** - Paid Storage Analytics (8/8 stories, all Ready for QA)
  - Storage analytics page with filters, summary cards, and visualizations
  - Top consumers widget with rank indicators and cost severity dots
  - Trends chart with gap handling for null data
  - Manual import dialog with date validation and progress polling
  - High ratio alert banner with Russian pluralization
  - Full API integration with React Query hooks
- 2025-11-26: **Story 23.10 Integration** - JWT Authentication on Task & Schedule APIs
  - Role-based access control for `POST /v1/tasks/enqueue` (Manager+ required)
  - Manual recalculation buttons hidden for Analyst users
  - Updated `ProductMarginCell.tsx` and `SingleCogsForm.tsx`
- 2025-11-26: **Story 4.9 Complete** - Historical Margin Discovery (45 tests)
  - HistoricalMarginContext component for NO_SALES_DATA products
  - ProductList refactored (534→198 lines, 6 sub-components extracted)
- 2025-11-25: **Story 4.8 Complete** - Margin Recalculation Polling & Real-time Updates (23 tests)
  - Automatic polling after COGS assignment (3-5s intervals)
  - Warning for COGS assigned after last completed week
  - Manual recalculation button integration
  - Integration with Epic 20 (Auto Recalc) and Epic 22 (Status Endpoint)
- 2025-11-25: **Epic 4 Complete** - All 8/8 stories done (125 total tests)
- 2025-11-25: **Documentation Updated** - Added Stories & Epics Documentation section with cross-links
- 2025-01-27: Added Request #17 - Manual margin recalculation for future COGS dates (warning alert + button)
- 2025-11-23: Added Product List & Pagination section documenting Request #13 implementation
- 2025-11-23: Fixed pagination duplicates bug with client-side workaround (WB SDK issue)
- 2025-11-22: Added Financial Data Structure section with all 9 expense categories
- 2025-11-22: Updated API Response Structure with Request #06 changes (acquiring_fee_total, commission_sales_total)
- 2025-11-22: Added payout_total formula with new expense fields

