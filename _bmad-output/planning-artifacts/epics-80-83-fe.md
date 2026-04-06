---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - docs/prd.md
  - docs/front-end-architecture.md
  - docs/front-end-spec.md
  - docs/backlog/epics-80-83-frontend-integration.md
---

# Frontend Epics 80-83 Integration — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for frontend integration of backend Epics 80-83, decomposing the backend API changes into implementable frontend stories.

## Requirements Inventory

### Functional Requirements

- FR1: The system shall handle `available: boolean` field in seller-info response, showing fallback UI when WB API data is unavailable
- FR2: The system shall handle `available: boolean` field in jam-status response, distinguishing "no subscription" from "probe failed"
- FR3: The system shall display a Token Health banner when WB API token is unhealthy, with polling and dismiss functionality
- FR4: The system shall use `wb_sales_gross` metric in trends chart for accurate seller revenue (excluding WB commission)
- FR5: The system shall display FCU (Final Cost per Unit) delivery cost data per SKU on the unit-economics page
- FR6: The system shall display bid recommendations (competitive, leaders, top-2) for advertising campaigns
- FR7: The system shall display client PII (name, phone) for FBS orders, gated by Owner role
- FR8: The system shall update `sid` type from `number|string` to `string` (UUID) for seller info
- FR9: The system shall show `reason` field in Russian when seller-info or jam-status API reports unavailability
- FR10: The system shall support `wb_returns_gross` and `wb_commission_rub` metrics in trends API
- FR11: The system shall reconcile failed import batches via POST /v1/imports/historical/:batchId/reconcile and show DataGapsAlert only for truly missing data

### Non-Functional Requirements

- NFR1: All source files < 200 lines (ESLint enforced)
- NFR2: WCAG 2.1 AA accessibility
- NFR3: PII data (client info) must not be cached in localStorage or logged
- NFR4: Token Health polling must not exceed 1 request/60s
- NFR5: All new components must have TypeScript strict types (no `any`)
- NFR6: E2E tests for critical paths

### Additional Requirements

- Token Health banner must be dismissable per session, re-appear on new errors
- Bid recommendations: validate `advertId` and `nmId` as numbers before API call
- Client info: max 100 orderIds per batch request
- Seller info reason values: "token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"
- Jam status reason values: "no_products" | "token_error" | "insufficient_permissions" | "timeout" | "wb_api_error"
- Existing types must be updated in place (not duplicated)

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 (seller-info available) | Epic 84-FE | Story 84.1 |
| FR2 (jam-status available) | Epic 84-FE | Story 84.2 |
| FR8 (sid type) | Epic 84-FE | Story 84.1 |
| FR9 (reason field) | Epic 84-FE | Story 84.1, 84.2 |
| FR3 (token health banner) | Epic 84-FE | Story 84.3 |
| FR11 (batch reconciliation) | Epic 84-FE | Story 84.4 |
| FR4 (wb_sales_gross trends) | Epic 85-FE | Story 85.1 |
| FR10 (new trend metrics) | Epic 85-FE | Story 85.1 |
| FR5 (FCU by-sku) | Epic 85-FE | Story 85.2 |
| FR6 (bid recommendations) | Epic 86-FE | Story 86.1 |
| FR7 (client PII) | Epic 86-FE | Story 86.2 |

## Epic List

| Epic | Title | Stories | Priority |
|------|-------|:---:|---------|
| **Epic 84-FE** | Cabinet Health & API Stability | 4 | CRITICAL |
| **Epic 85-FE** | Analytics Accuracy | 2 | HIGH |
| **Epic 86-FE** | Advertising & Orders New Features | 2 | LOW |

---

## Epic 84-FE: Cabinet Health & API Stability

**Goal**: Adapt frontend to breaking changes in seller-info and jam-status endpoints, and add proactive token health monitoring. Backend now always returns 200 with `available` field to distinguish success from WB API failure. Token health banner alerts sellers before their data goes stale. Without these changes, sidebar shows incorrect data and users don't know when their WB token fails.

### Story 84.1: Seller Info — handle `available` field and `sid` type change

**As a** seller using the dashboard,
**I want** to see my store name in the sidebar even when WB API is temporarily unavailable,
**So that** I always know which cabinet I'm working with and understand if there's a data issue.

**Acceptance Criteria:**

**Given** the seller-info API returns `available: true` with valid name/tradeMark
**When** the sidebar renders
**Then** it shows the tradeMark (or name) as before
**And** no warning indicators are shown

**Given** the seller-info API returns `available: false` with a `reason`
**When** the sidebar renders
**Then** it shows "Кабинет" as fallback text with a warning icon
**And** hovering the warning icon shows the reason in Russian (e.g., "Токен невалидный")

**Given** the seller-info API returns `available: false`
**When** the user opens the Settings / Cabinet page
**Then** a yellow warning banner shows: "Информация о продавце недоступна: {reason}"
**And** a link to update the WB token is shown

**Given** the `sid` field in seller-info response
**When** the frontend processes it
**Then** it is typed as `string` (UUID), not `number | string`
**And** no type errors occur

**Files**: `src/types/cabinet.ts`, `src/components/custom/SidebarCabinetInfo.tsx`, `src/components/custom/settings/CabinetInfoCard.tsx`, `src/hooks/useSellerInfo.ts`

**Estimate**: 2 hours

---

### Story 84.2: Jam Status — handle `available` field and reason

**As a** seller with a Jam subscription,
**I want** to see my correct Jam tier in the sidebar badge,
**So that** I know my subscription is active and I can use Jam features.

**Acceptance Criteria:**

**Given** jam-status returns `available: true, tier: "standard"`
**When** the sidebar renders
**Then** a blue "Джем Стандарт" badge is shown

**Given** jam-status returns `available: true, tier: "none"`
**When** the sidebar renders
**Then** no Jam badge is shown in sidebar
**And** Settings page shows "Нет подписки"

**Given** jam-status returns `available: false` with `reason: "token_error"`
**When** the sidebar renders
**Then** no Jam badge is shown
**And** Settings page shows "Статус неизвестен" with reason text

**Given** jam-status returns `available: false`
**When** the search analytics page checks `searchTextsLimit`
**Then** it does NOT use the limit value (treats as 0)

**Given** the RequireJam gate component
**When** `available: false` or `tier: "none"`
**Then** Jam-gated features are hidden

**Files**: `src/types/cabinet.ts`, `src/components/custom/SidebarCabinetInfo.tsx`, `src/components/custom/jam/RequireJam.tsx`, `src/components/custom/settings/CabinetInfoCard.tsx`, `src/hooks/useJamStatus.ts`

**Estimate**: 2 hours

### Story 84.3: Token Health Banner

**As a** seller whose WB API token has expired or become invalid,
**I want** to see a clear warning banner on every page telling me there's a problem,
**So that** I can fix it before my data becomes stale.

**Acceptance Criteria:**

**Given** the token-status API returns `healthy: false`
**When** any dashboard page loads
**Then** a yellow warning banner appears below the header
**And** it shows the `recommendation` text from the backend
**And** it includes a link to Settings / Cabinet page

**Given** the banner is visible
**When** the user clicks the dismiss (✕) button
**Then** the banner is hidden for the current session
**And** the dismissed state is stored in localStorage

**Given** the banner was dismissed but `errorCount` has increased
**When** the next poll completes (every 60s)
**Then** the banner re-appears with updated info

**Given** the token-status API returns `healthy: true`
**When** any page loads
**Then** no banner is shown
**And** polling stops (or continues at reduced frequency)

**Given** the user is on login or onboarding pages
**When** the page loads
**Then** the token health banner is NOT shown

**Files**: NEW `src/hooks/useTokenHealth.ts`, NEW `src/components/custom/TokenHealthBanner.tsx`, `src/app/(dashboard)/layout.tsx`

**Estimate**: 3 hours

---

### Story 84.4: Batch Reconciliation + DataGapsAlert

**As a** seller viewing the dashboard,
**I want** the system to automatically reconcile failed import batches and only warn me about truly missing data,
**So that** I don't see false warnings about data gaps that were already resolved by auto-import.

**Acceptance Criteria:**

**Given** the dashboard loads and `GET /v1/imports/historical` returns batches with `status: "failed"`
**When** the processing status hook initializes
**Then** it calls `POST /v1/imports/historical/{batchId}/reconcile` for each failed batch
**And** waits for all reconcile calls to complete before computing `failedBatchCount`

**Given** reconcile returns `{ reconciled: true, newStatus: "completed" }` for a batch
**When** `failedBatchCount` is computed
**Then** that batch is NOT counted as failed

**Given** reconcile returns `{ reconciled: false }` (data truly missing)
**When** `failedBatchCount > 0`
**Then** the yellow DataGapsAlert banner shows "{N} импортов завершились с ошибкой — возможны пропуски данных"

**Given** all batches reconcile successfully (`failedBatchCount = 0`)
**When** the dashboard renders
**Then** no DataGapsAlert is shown

**Given** the reconcile API returns 404 (batch not found) or 401 (unauthorized)
**When** the reconcile call fails
**Then** the batch is counted as failed (conservative approach)
**And** no error is shown to the user

**Given** a batch was already reconciled in this session
**When** `useProcessingStatus` re-runs (refetch, navigation)
**Then** the reconcile POST is NOT called again for that batch (session cache via `reconciledIds` ref)

**Files**: `src/hooks/useProcessingStatus.ts` (remove hardcoded `failedBatchCount = 0`, add reconcile logic with session cache), NEW `src/lib/api/imports-reconcile.ts`

**Estimate**: 2 hours

---

## Epic 85-FE: Analytics Accuracy

**Goal**: Improve trends accuracy with `wb_sales_gross` metric and connect FCU delivery cost data to unit-economics. These changes improve data quality for sellers making pricing and profitability decisions.

### Story 85.1: Trends — use wb_sales_gross for accurate seller revenue

**As a** seller analyzing my weekly trends,
**I want** to see my actual seller revenue (after WB commission) instead of retail price,
**So that** my efficiency percentage reflects reality.

**Acceptance Criteria:**

**Given** the trends API now supports `wb_sales_gross`
**When** the trends chart loads
**Then** the revenue line uses `wb_sales_gross` (not `sale_gross`)
**And** the label reads "Выручка продавца" (not "Продажи (розница)")

**Given** the efficiency calculation
**When** computed per week
**Then** formula is `(payout_total - cogs_total) / wb_sales_gross * 100`
**And** this gives a higher and more accurate % (since denominator excludes WB commission)

**Given** `wb_sales_gross` is null for a week
**When** the chart renders
**Then** that point falls back to `sale_gross` for that week
**And** no gap appears in the chart

**Given** the metric label changed from "Продажи (розница)" to "Выручка продавца"
**When** the chart first renders after update
**Then** a one-time dismissable info tooltip appears on the legend item
**And** it reads "Метрика обновлена: теперь показывает выручку продавца без комиссии WB"
**And** after dismiss, it does not appear again (localStorage flag)

**Files**: `src/hooks/useTrends.ts`, `src/components/custom/TrendGraph.tsx`, `src/types/api.ts`

**Estimate**: 1.5 hours

---

### Story 85.2: FCU Analytics — connect /shipment-cost/by-sku

**As a** seller who has confirmed shipments,
**I want** to see delivery cost per unit (FCU) on the unit-economics page,
**So that** I understand the full cost structure including logistics.

**Acceptance Criteria:**

**Given** the `/v1/shipment-cost/by-sku` endpoint is now available
**When** the unit-economics page loads with view_by=sku
**Then** the hook `useFcuBySku` fetches FCU data for the selected week
**And** the "Доставка" column shows FCU values per SKU

**Given** no confirmed shipments exist for a week
**When** the endpoint returns an empty array
**Then** the "Доставка" column shows "—" for all rows
**And** no error is displayed

**Given** the existing merge logic in `useUnitEconomicsPageState`
**When** FCU data is available
**Then** `delivery_to_warehouse` costs are merged into unit-economics items
**And** client-side sorting by delivery column works correctly

**Files**: `src/hooks/use-fcu-aggregation.ts`, `src/hooks/__tests__/use-fcu-aggregation.test.ts`

**Estimate**: 30 minutes

---

## Epic 86-FE: Advertising & Orders New Features

**Goal**: Add new advertising bid recommendations and client PII display for FBS orders. These are new UI features built on newly available backend endpoints.

### Story 86.1: Bid Recommendations for Advertising Campaigns

**As a** seller managing advertising campaigns,
**I want** to see recommended bid levels (competitive, leaders, top-2) for my campaigns,
**So that** I can set optimal bid amounts to maximize visibility without overspending.

**Acceptance Criteria:**

**Given** the user is on the advertising analytics page viewing a specific campaign/SKU
**When** they click to see bid recommendations
**Then** the system fetches recommendations for that advertId + nmId
**And** displays: competitive bid, leaders bid, top-2 bid, and per-keyword ranges

**Given** the `advertId` or `nmId` is not a valid number
**When** the request is attempted
**Then** it is blocked with a validation error (no API call made)

**Given** the backend returns a rate limit error
**When** the UI receives it
**Then** a toast shows "Превышен лимит запросов. Повторите через несколько минут"

**Given** bid recommendations have a 30-minute backend cache
**When** the hook fetches data
**Then** staleTime is set to 30 minutes to match

**Files**: NEW `src/lib/api/advertising/bid-recommendations-api.ts`, NEW `src/hooks/useBidRecommendations.ts`, advertising campaign detail component

**Estimate**: 4-6 hours

---

### Story 86.2: Client Info (PII) for FBS Orders

**As an** Owner viewing FBS orders,
**I want** to see client name and phone number for my orders,
**So that** I can contact buyers when needed for delivery coordination.

**Acceptance Criteria:**

**Given** the user has role "Owner"
**When** the orders table loads
**Then** a "Клиент" column/expandable area is available
**And** client info is fetched in batches (max 100 orderIds per request)

**Given** the user does NOT have role "Owner" (Analyst, Manager)
**When** the orders table loads
**Then** the "Клиент" column is completely hidden
**And** no client-info API calls are made

**Given** the API returns partial data (some orders have no client info)
**When** the table renders
**Then** orders without client data show "—" in the client column
**And** no error is displayed

**Given** client PII data is received
**When** it is stored in memory
**Then** it is NOT persisted to localStorage, sessionStorage, or any browser cache
**And** it is NOT logged to console

**Given** the useClientInfo hook unmounts (user navigates away)
**When** a unit test checks browser storage
**Then** localStorage and sessionStorage contain NO keys with client names or phone numbers
**And** TanStack Query gcTime is set to 0 (no in-memory caching after unmount)

**Files**: NEW `src/lib/api/orders/client-info-api.ts`, NEW `src/hooks/useClientInfo.ts`, orders table component

**Estimate**: 4-6 hours
