---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md
  - ../test-api/35-shipment-cost.http
  - docs/front-end-spec.md
  - docs/front-end-architecture.md
  - docs/api-integration-guide.md
  - CLAUDE.md
---

# Shipment Cost Allocation — Epic Breakdown (75-FE & 76-FE)

## Overview

This document provides the complete epic and story breakdown for Shipment Cost Allocation frontend, implementing the UI for backend Epic 79 (fully implemented, 23 endpoints, 229 tests). The feature enables sellers to plan shipments to WB warehouses and calculate FCU (Final Cost per Unit) including delivery costs.

**Two-epic structure:**
- **Epic 75-FE**: Foundation, Types, API Client, Reference Data Screens (Box Types + SKU Packaging)
- **Epic 76-FE**: Shipments List, Shipment Detail, Cost Calculation, Confirmation

## Key Decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Epic structure | Two epics | Smaller PRs, reference data ships independently |
| 2 | Shipment creation UX | Free-form | Experienced sellers know their shipments; contextual hints instead of wizard |
| 3 | Pre-flight validation | Lightweight inline warnings | Non-blocking banners + hints for missing COGS/packaging |
| 4 | Shipment detail layout | Full accordion | Collapse/expand per pallet, works for 1-10+ pallets |
| 5 | Shipment API placement | Distribute across consuming 76.x stories | "Create when needed" principle; each story creates only the hooks it uses |
| 6 | Dashboard integration | Defer to Epic 77 | FCU is self-contained in shipment detail; unit economics integration is separate scope |
| 7 | Bulk input UX | CSV/tab textarea + preview table | Practical for paste workflows; file upload is overengineering for MVP |
| 8 | Component extraction | Explicit sub-component lists in ACs | Prevents 200-line violations and `'use client'` issues from day one (Epic 74 lesson) |

## Requirements Inventory

### Functional Requirements

FR1: Box Type CRUD — Create, list, get, update, deactivate box types with dimensions (L×W×H → auto-calculated volume). Soft-delete via `isActive` flag.
FR2: SKU Packaging CRUD — Bind SKU (nmId) to box type with units-per-box count. Single and bulk operations with partial-success handling.
FR3: Shipment CRUD — Create shipments with two delivery modes (FIXED_VEHICLE / PER_PALLET). XOR validation on cost fields (`totalDeliveryCost` vs `palletRate`).
FR4: Pallet Management — Add/remove pallets to shipments with auto-numbering. Cascade deletion of box lines when pallet removed.
FR5: Box Line Management — Add/update/remove box lines per pallet (nmId + boxCount + optional totalUnits override for partial boxes).
FR6: Cost Calculation — Calculate FCU (Final Cost per Unit) via volume-proportional allocation with 7-step pipeline. Repeatable in DRAFT status.
FR7: Shipment Confirmation — Confirm shipment (auto-calculates, freezes cost snapshots, DRAFT→CONFIRMED transition).
FR8: Recalculation — Recalculate confirmed shipments with updated COGS. Manager/Owner/Admin role required.
FR9: Status-based Access Control — DRAFT allows all mutations, CONFIRMED blocks all except recalculate. UI must reflect this (disable/hide buttons).
FR10: Collect-All Validation — 9 simultaneous validation checks with `affectedIds` for targeted UI feedback. Show all errors at once, not just first.
FR11: Decimal Parsing — Backend returns Decimal fields as strings (`"96000.0000"`); frontend must `parseFloat()`. Exception: `/calculate` response returns numbers.
FR12: Shipment List with Pagination — Filter by status (DRAFT/CONFIRMED), sort by date, paginated results.
FR13: Pre-flight Warnings — When adding box lines, check if SKU has packaging config and COGS. Show non-blocking inline warnings if missing.
FR14: Navigation from Errors — `MISSING_COGS` errors link to `/products` with filter. `MISSING_PACKAGING` errors link to SKU packaging page.

### Non-Functional Requirements

NFR1: All source files ≤ 200 lines (ESLint enforced). Design extracted sub-components from day one.
NFR2: TypeScript strict — no `any` types. Use `unknown` where needed.
NFR3: WCAG 2.1 AA accessibility — color contrast ≥4.5:1, keyboard navigation, ARIA labels, focus indicators.
NFR4: Russian locale — all formatters (`formatCurrency`, `formatPercentage`, dates, numbers).
NFR5: Design system compliance — Primary #E53935, semantic colors (green/red for profit/loss), shadcn/ui components.
NFR6: Performance — API response p95 < 500ms, page load < 3s.
NFR7: Path aliases — `@/` for all imports.
NFR8: Server Components default — no `'use client'` unless file uses React hooks.

### Additional Requirements (Architecture & UX)

- API Client pattern: Auto-injects `Authorization` + `X-Cabinet-Id` headers; auto-unwraps `{ data: ... }`
- TanStack Query: staleTime=60s, gcTime=5min, retry=1 for all hooks
- Reusable shadcn/ui components: DataTable, Badge, Dialog/Sheet, Select, Collapsible (accordion)
- `formatCurrency()` in `lib/format-utils.ts` — reuse for all monetary values
- Route registration: New routes added to `src/lib/routes.ts`
- Existing COGS/Products integration: Link to existing pages from validation errors
- Apply Epic 74 extraction patterns proactively: page-state hooks, sub-components, config files
- `parseDecimal()` utility needed for Decimal-as-string pattern (new to this project)
- Nested API paths: `shipments/:id/pallets/:palletId/box-lines` — 3-level nesting
- After `/calculate`, invalidate+refetch shipment query (server-computed transform, not optimistic)

### Backend API Reference

**Base paths:**
- `/v1/box-types` — 5 endpoints (CRUD + deactivate)
- `/v1/sku-packaging` — 5 endpoints (CRUD + bulk)
- `/v1/shipments` — 13 endpoints (CRUD + pallets + box-lines + calculate + confirm + recalculate)

**Total: 23 endpoints**

**HTTP test file:** `test-api/35-shipment-cost.http`
**Swagger UI:** `http://localhost:3000/api` → section `shipment-cost`
**Full spec:** `docs/request-backend/161-SHIPMENT-COST-ALLOCATION.md`

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | 75 | Box Type CRUD → Story 75.2 |
| FR2 | 75 | SKU Packaging CRUD + bulk → Story 75.3 |
| FR3 | 76 | Shipment CRUD (delivery modes, XOR) → Stories 76.1, 76.2 |
| FR4 | 76 | Pallet management (add/remove, auto-number) → Story 76.2 |
| FR5 | 76 | Box line management (per pallet) → Story 76.3 |
| FR6 | 76 | Cost calculation (FCU, 7-step pipeline) → Story 76.4 |
| FR7 | 76 | Shipment confirmation (DRAFT→CONFIRMED) → Story 76.5 |
| FR8 | 76 | Recalculation (Manager+ role) → Story 76.5 |
| FR9 | 76 | Status-based access control → Stories 76.1, 76.2, 76.5 |
| FR10 | 76 | Collect-all validation (9 checks, affectedIds) → Story 76.4 |
| FR11 | 75+76 | Decimal parsing (`parseDecimal()` utility) → Stories 75.1 (create), 76.2 (use) |
| FR12 | 76 | Shipment list with pagination/filters → Story 76.1 |
| FR13 | 76 | Pre-flight warnings (missing COGS/packaging) → Story 76.3 |
| FR14 | 76 | Navigation from errors (links to /products, packaging) → Story 76.4 |

**Coverage: 14/14 FRs mapped (100%)**

## Epic List

### Epic 75-FE: Reference Data Management (Box Types & SKU Packaging)

**~16 SP | 4 stories**

Sellers can manage box type dimensions and bind SKU-to-box packaging configurations — prerequisites needed before creating any shipment.

**FRs covered:** FR1, FR2, FR11 (partial)

| Story | Title | FRs | SP |
|-------|-------|-----|-----|
| 75.1 | Foundation: Types, API Client, Routes, Utilities | FR11 | 5 |
| 75.2 | Box Types CRUD Page | FR1 | 3 |
| 75.3 | SKU Packaging Page (single + bulk) | FR2 | 5 |
| 75.4 | Tests & Polish | — | 3 |

**Standalone**: Yes — delivers complete reference data management. No dependency on Epic 76.

---

### Epic 76-FE: Shipment Planning & Cost Calculation

**~24 SP | 6 stories**

Sellers can create shipments, manage pallets and box lines, calculate FCU (delivery cost per unit), view validation errors with navigation links, and confirm/recalculate shipments.

**FRs covered:** FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11 (complete), FR12, FR13, FR14

| Story | Title | FRs | SP |
|-------|-------|-----|-----|
| 76.1 | Shipments List Page | FR3, FR9, FR12 | 3 |
| 76.2 | Shipment Detail: Header + Pallet Accordion | FR3, FR4, FR9, FR11 | 5 |
| 76.3 | Box Line Management + Pre-flight Warnings | FR5, FR13 | 5 |
| 76.4 | Calculate + Validation Error Display | FR6, FR10, FR14 | 5 |
| 76.5 | Confirm + Recalculate + Readonly View | FR7, FR8, FR9 | 3 |
| 76.6 | Tests & Polish | — | 3 |

**Dependency**: Requires Epic 75 (box types + SKU packaging data). Standalone once 75 is delivered.

---

**Total: 2 epics, 10 stories, ~40 SP**

---

## Epic 75-FE: Reference Data Management (Box Types & SKU Packaging)

Sellers can manage box type dimensions and bind SKU-to-box packaging configurations — prerequisites needed before creating any shipment.

### Story 75.1: Foundation — Types, API Client, Routes, Utilities

As a **developer**,
I want a complete typed foundation for shipment cost allocation,
So that all subsequent stories have shared types, API functions, hooks, and utilities.

**Acceptance Criteria:**

**Given** the shipment-cost domain is new to the frontend
**When** Story 75.1 is complete
**Then** TypeScript interfaces exist for all domain entities in `src/types/shipment-cost.ts`: `BoxType`, `SkuPackaging`, `Shipment`, `ShipmentStatus`, `DeliveryMode`, `Pallet`, `BoxLine`, `CalculationResult`, `CalculationResultItem`, `ValidationError`, `ValidationErrorCode` (enum with all 9 codes) — with all fields from backend spec
**And** `parseDecimal(value: string | number | null | undefined): number` utility exists in `src/lib/decimal-utils.ts` — handles `"96000.0000"` → `96000`, passthrough for numbers, `0` for null/undefined/empty string/NaN
**And** API client functions exist for box-types (5 endpoints) and sku-packaging (5 endpoints) in `src/lib/api/shipment-cost/box-types-api.ts` and `src/lib/api/shipment-cost/sku-packaging-api.ts`
**And** TanStack Query hooks exist in `src/hooks/use-box-types.ts`: `useBoxTypes`, `useBoxType`, `useCreateBoxType`, `useUpdateBoxType`, `useDeactivateBoxType`
**And** TanStack Query hooks exist in `src/hooks/use-sku-packaging.ts`: `useSkuPackaging`, `useSkuPackagingByNmId`, `useCreateSkuPackaging`, `useUpdateSkuPackaging`, `useDeleteSkuPackaging`, `useBulkCreateSkuPackaging`
**And** routes registered in `src/lib/routes.ts`: `/shipments/box-types`, `/shipments/sku-packaging`, `/shipments`
**And** all hooks use standard config: `staleTime=60s, gcTime=5min, retry=1`
**And** all files ≤ 200 lines, `@/` imports, no `any` types
**And** sidebar navigation entry added under a "Доставка" section

### Story 75.2: Box Types CRUD Page

As a **seller**,
I want to manage box type dimensions (length, width, height),
So that I can define the packaging I use for shipments to WB warehouses.

**Acceptance Criteria:**

**Given** a seller navigates to `/shipments/box-types`
**When** the page loads and no box types exist
**Then** an empty state displays: "Добавьте типы коробок для расчёта стоимости доставки" with a primary CTA button "Добавить тип коробки"

**Given** a seller navigates to `/shipments/box-types`
**When** box types exist
**Then** a DataTable displays all active box types with columns: Название, Размеры (Д×Ш×В, см), Объём (см³), Действия
**And** volume is auto-calculated as `length × width × height` and formatted with Russian locale

**Given** a seller clicks "Добавить тип коробки"
**When** the create dialog opens
**Then** form fields exist for: name (required), length (required, number > 0), width (required, number > 0), height (required, number > 0)
**And** submitting creates the box type via `POST /v1/box-types` and refreshes the list
**And** validation errors display inline

**Given** a seller clicks edit on a box type
**When** the edit dialog opens
**Then** all fields are pre-filled with current values
**And** submitting updates via `PATCH /v1/box-types/:id` and refreshes the list

**Given** a seller clicks deactivate on a box type
**When** confirmation is shown and accepted
**Then** the box type is deactivated via `PATCH /v1/box-types/:id/deactivate`
**And** it disappears from the active list (soft-delete via `isActive` flag)

**Given** all decimal fields from the backend
**When** rendering values
**Then** `parseDecimal()` is used for all Decimal-as-string fields

### Story 75.3: SKU Packaging Page — Single & Bulk Operations

As a **seller**,
I want to bind my SKUs to box types with units-per-box counts,
So that the system knows how each product is packaged for delivery cost calculation.

**Acceptance Criteria:**

**Given** a seller navigates to `/shipments/sku-packaging`
**When** the page loads and no packaging configs exist
**Then** an empty state displays: "Привяжите товары к типам коробок"
**And** if no box types exist yet, an additional hint: "Сначала добавьте типы коробок" with a link to `/shipments/box-types`

**Given** a seller navigates to `/shipments/sku-packaging`
**When** packaging configs exist
**Then** a DataTable displays: Товар (nmId + название), Тип коробки, Штук в коробке, Действия

**Given** a seller clicks "Добавить упаковку"
**When** the create dialog opens
**Then** form fields exist for: SKU (searchable combobox via `/v1/products`, showing nmId + product name), Box Type (dropdown of active box types), Units per Box (required, number > 0)
**And** submitting creates via `POST /v1/sku-packaging`

**Given** a seller clicks edit on a packaging config
**When** the edit dialog opens
**Then** nmId is read-only, box type and units per box are editable
**And** submitting updates via `PATCH /v1/sku-packaging/:id`

**Given** a seller clicks delete on a packaging config
**When** confirmation is shown and accepted
**Then** the config is removed via `DELETE /v1/sku-packaging/:id`

**Given** a seller clicks "Массовое добавление" (bulk add)
**When** the bulk dialog opens
**Then** a textarea accepts multiple rows in CSV/tab-separated format: `nmId, boxTypeId, unitsPerBox` (one per line)
**And** a preview table renders parsed rows before submission showing: nmId, Box Type name (resolved), Units, Status
**And** submitting calls `POST /v1/sku-packaging/bulk`
**And** partial success is handled: successful items shown in green, failed items shown with error messages in the preview table
**And** the list refreshes showing all successfully created configs

### Story 75.4: Tests & Polish

As a **QA engineer**,
I want comprehensive test coverage for reference data features,
So that box types and SKU packaging work reliably.

**Acceptance Criteria:**

**Given** all components from stories 75.1–75.3 are implemented
**When** running `npm test`
**Then** unit tests pass for `parseDecimal()` with explicit edge cases: `parseDecimal("96000.0000")` → `96000`, `parseDecimal(42)` → `42`, `parseDecimal(null)` → `0`, `parseDecimal(undefined)` → `0`, `parseDecimal("")` → `0`, `parseDecimal("NaN")` → `0`, `parseDecimal("0.0000")` → `0`, `parseDecimal(0)` → `0`
**And** unit tests pass for all TanStack Query hooks (box-types: 5 hooks, sku-packaging: 6 hooks) verifying query key structure, enabled conditions, and mutation invalidation
**And** unit tests pass for API client functions (request/response mapping, correct URL construction)

**Given** the Box Types page
**When** component tests run
**Then** tests verify: list rendering with data, create dialog (all fields required, validation), edit dialog (pre-fill), deactivate flow (confirmation + API call), empty state rendering, loading state, error state

**Given** the SKU Packaging page
**When** component tests run
**Then** tests verify: list rendering, create (searchable combobox filtering), edit (nmId read-only), delete (confirmation), bulk create (CSV parsing, preview table, partial success display), empty state (with and without box types hint)

**Given** all pages
**When** accessibility testing runs
**Then** keyboard navigation works for all interactive elements (DataTable, dialogs, buttons, combobox)
**And** ARIA labels are present on all form inputs and buttons
**And** color contrast meets WCAG 2.1 AA (≥4.5:1)
**And** focus indicators are visible, dialogs trap focus

**Given** all source files
**When** `npm run lint && npm run type-check` runs
**Then** 0 ESLint errors, 0 TypeScript errors, all files ≤ 200 lines

---

## Epic 76-FE: Shipment Planning & Cost Calculation

Sellers can create shipments, manage pallets and box lines, calculate FCU (delivery cost per unit), view validation errors with navigation links, and confirm/recalculate shipments.

### Story 76.1: Shipments List Page

As a **seller**,
I want to see all my shipments with filtering and pagination,
So that I can manage my delivery planning and track shipment statuses.

**Acceptance Criteria:**

**Given** a seller navigates to `/shipments`
**When** the page loads and no shipments exist
**Then** an empty state displays: "Создайте первую отправку для расчёта стоимости доставки"
**And** if no packaging configs exist, a hint: "Сначала настройте упаковку товаров" with a link to `/shipments/sku-packaging`
**And** a primary CTA button "Создать отправку"

**Given** shipments exist
**When** the page loads
**Then** a paginated DataTable displays: Название, Статус (Badge: ЧЕРНОВИК/ПОДТВЕРЖДЕНА), Способ доставки, Паллет, Дата создания, Действия
**And** pagination controls (page size, next/prev) work correctly

**Given** the shipments list page
**When** a seller selects a status filter (Все / ЧЕРНОВИК / ПОДТВЕРЖДЕНА)
**Then** the list filters by selected status via query parameter `?status=DRAFT`
**And** sorting by date (ascending/descending) is available

**Given** a seller clicks "Создать отправку"
**When** the create shipment dialog opens
**Then** form fields exist for: Название (required), Способ доставки (radio: Фиксированная стоимость / За паллету)
**And** when "Фиксированная стоимость" is selected: `totalDeliveryCost` field appears (required, number > 0)
**And** when "За паллету" is selected: `palletRate` field appears (required, number > 0)
**And** switching delivery mode clears the other cost field (XOR validation)
**And** submitting creates via `POST /v1/shipments` and navigates to the new shipment detail page

**Given** this is the first story in Epic 76
**When** the story is complete
**Then** API client functions exist for shipments CRUD in `src/lib/api/shipment-cost/shipments-api.ts`: `getShipments`, `getShipment`, `createShipment`, `updateShipment`, `deleteShipment`
**And** TanStack Query hooks exist in `src/hooks/use-shipments.ts`: `useShipments`, `useShipment`, `useCreateShipment`
**And** page state hook: `useShipmentsPageState.ts` (filters, pagination, sort)

### Story 76.2: Shipment Detail — Header + Pallet Accordion

As a **seller**,
I want to view and edit shipment details with an expandable pallet layout,
So that I can organize my shipment's physical structure before calculating costs.

**Acceptance Criteria:**

**Given** a seller navigates to `/shipments/:id`
**When** the page loads
**Then** a header section displays: shipment name, status badge, delivery mode, cost field (totalDeliveryCost or palletRate formatted via `formatCurrency()`), created/updated dates
**And** all Decimal-as-string fields are parsed via `parseDecimal()`

**Given** a DRAFT shipment detail page
**When** a seller clicks "Редактировать"
**Then** an edit dialog allows changing: name, delivery mode, cost fields (with XOR validation — switching mode clears the other field)
**And** submitting updates via `PATCH /v1/shipments/:id`

**Given** a DRAFT shipment detail page
**When** a seller clicks "Удалить отправку"
**Then** a confirmation dialog appears
**And** confirming deletes via `DELETE /v1/shipments/:id` and navigates back to list

**Given** a DRAFT shipment detail page
**When** a seller clicks "Добавить паллету"
**Then** a new pallet is created via `POST /v1/shipments/:id/pallets`
**And** the pallet appears in the accordion with auto-generated sequential number
**And** the accordion section is expanded by default for the new pallet

**Given** a shipment with pallets
**When** the pallet accordion renders
**Then** each pallet shows as a collapsible section with header: "Паллета #N" + box line count summary
**And** clicking expand/collapse toggles the pallet content area
**And** all pallets can be expanded/collapsed independently

**Given** a DRAFT shipment with a pallet
**When** a seller clicks remove on a pallet
**Then** a confirmation warns that all box lines in this pallet will be deleted (cascade)
**And** confirming removes via `DELETE /v1/shipments/:id/pallets/:palletId`

**Given** a CONFIRMED shipment
**When** the detail page loads
**Then** "Редактировать", "Удалить", "Добавить паллету", and pallet remove buttons are disabled/hidden
**And** a visual indicator shows the shipment is locked (FR9)

**Given** the 200-line file constraint
**When** this story is implemented
**Then** sub-components are extracted: `ShipmentDetailHeader.tsx` (header + status), `ShipmentEditDialog.tsx` (edit form), `PalletAccordion.tsx` (accordion container), `PalletAccordionItem.tsx` (single pallet)
**And** files using React hooks/state have `'use client'` directive
**And** TanStack Query hooks added: `useUpdateShipment`, `useDeleteShipment`, `useAddPallet`, `useRemovePallet` in `src/hooks/use-shipment-detail.ts`

### Story 76.3: Box Line Management + Pre-flight Warnings

As a **seller**,
I want to add products (box lines) to each pallet with packaging warnings,
So that I can specify exactly what goes on each pallet before cost calculation.

**Acceptance Criteria:**

**Given** an expanded pallet in a DRAFT shipment
**When** a seller clicks "Добавить товар"
**Then** a form/dialog appears with fields: SKU (searchable combobox via `/v1/products`, showing nmId + product name), Box Count (required, number > 0), Total Units override (optional, number — for partial boxes)
**And** submitting creates via `POST /v1/shipments/:id/pallets/:palletId/box-lines`

**Given** box lines exist in a pallet
**When** the pallet content renders
**Then** a table displays: Товар (nmId + название), Коробок, Штук в коробке (from packaging config), Всего штук, Действия (edit/remove)

**Given** a box line in a DRAFT shipment
**When** a seller clicks edit
**Then** boxCount and totalUnits are editable
**And** submitting updates via `PATCH /v1/shipments/:id/pallets/:palletId/box-lines/:boxLineId`

**Given** a box line in a DRAFT shipment
**When** a seller clicks remove
**Then** a confirmation appears
**And** confirming removes via `DELETE /v1/shipments/:id/pallets/:palletId/box-lines/:boxLineId`

**Given** a seller adds a box line with an nmId
**When** the SKU lacks a packaging config
**Then** an inline warning banner appears: "У товара {nmId} нет настройки упаковки" with a link to `/shipments/sku-packaging`
**And** the warning is non-blocking — the box line can still be added

**Given** a seller adds a box line with an nmId
**When** the SKU lacks COGS data
**Then** an inline warning banner appears: "У товара {nmId} не указана себестоимость" with a link to `/products?filter=nmId`
**And** the warning is non-blocking — the box line can still be added

**Given** a CONFIRMED shipment
**When** the pallet content renders
**Then** add/edit/remove box line controls are disabled/hidden

**Given** the 200-line file constraint
**When** this story is implemented
**Then** sub-components are extracted: `BoxLineTable.tsx` (line listing), `BoxLineForm.tsx` (add/edit form), `PreflightWarnings.tsx` (warning banners)
**And** TanStack Query hooks added: `useAddBoxLine`, `useUpdateBoxLine`, `useRemoveBoxLine` in `src/hooks/use-box-lines.ts`

### Story 76.4: Calculate + Validation Error Display

As a **seller**,
I want to calculate delivery cost per unit and see all validation errors at once,
So that I can fix issues and understand the true cost of shipping each product.

**Acceptance Criteria:**

**Given** a DRAFT shipment with at least one pallet and box line
**When** a seller clicks "Рассчитать"
**Then** `POST /v1/shipments/:id/calculate` is called
**And** on success, the shipment query is invalidated and refetched (server-computed transform, NOT optimistic update)
**And** calculation results display per SKU: nmId, product name, PCU (production cost), DCU (delivery cost per unit), FCU (final cost per unit = PCU + DCU)
**And** all monetary values use `formatCurrency()` with Russian locale
**And** note: `/calculate` response returns numbers (not Decimal strings) — no `parseDecimal()` needed for this response

**Given** calculation returns validation errors
**When** the error response contains multiple `ValidationError` objects
**Then** ALL errors display simultaneously in an error panel (not just the first)
**And** each error shows: error code, human-readable message in Russian, affected item identifiers

**Given** a `MISSING_COGS` validation error with `affectedIds`
**When** the error is displayed
**Then** a clickable link navigates to `/products?filter={nmId}` for each affected SKU
**And** the affected box lines in the pallet accordion are highlighted (e.g., red border or background)

**Given** a `MISSING_PACKAGING` validation error with `affectedIds`
**When** the error is displayed
**Then** a clickable link navigates to `/shipments/sku-packaging` for each affected SKU
**And** the affected box lines are highlighted

**Given** validation errors with `affectedIds` arrays
**When** the errors render
**Then** all 9 validation error codes are handled: `MISSING_COGS`, `MISSING_PACKAGING`, `EMPTY_SHIPMENT`, `EMPTY_PALLET`, `ZERO_UNITS`, `ZERO_VOLUME`, `MISSING_DELIVERY_COST`, `DUPLICATE_SKU_IN_PALLET`, `INVALID_BOX_COUNT`
**And** each error type displays an appropriate icon and severity level
**And** a validation error config maps each code to: Russian message, icon, severity, navigation link pattern

**Given** a CONFIRMED shipment
**When** the detail page loads
**Then** the "Рассчитать" button is disabled/hidden

**Given** the 200-line file constraint
**When** this story is implemented
**Then** sub-components are extracted: `CalculationResults.tsx` (results table), `ValidationErrorPanel.tsx` (error list container), `ValidationErrorItem.tsx` (single error with navigation), `validation-error-config.ts` (error code → message/icon/link mapping)
**And** TanStack Query hook added: `useCalculateShipment` in `src/hooks/use-shipment-calculations.ts`

### Story 76.5: Confirm + Recalculate + Readonly View

As a **seller**,
I want to confirm a shipment to lock in costs, and recalculate if COGS change,
So that my delivery cost snapshots are frozen for accounting and can be updated when needed.

**Acceptance Criteria:**

**Given** a DRAFT shipment with successful calculation results
**When** a seller clicks "Подтвердить"
**Then** `POST /v1/shipments/:id/confirm` is called (which auto-calculates before confirming)
**And** on success, the shipment transitions to CONFIRMED status
**And** the shipment query is invalidated and refetched
**And** a success toast displays: "Отправка подтверждена"

**Given** a CONFIRMED shipment
**When** the detail page loads
**Then** all mutation controls are disabled/hidden (edit, delete, add/remove pallets, add/remove box lines, calculate)
**And** the header shows a "ПОДТВЕРЖДЕНА" badge with a lock icon
**And** cost snapshot data displays: per-SKU FCU, PCU, DCU values from the frozen calculation
**And** the readonly view clearly communicates the shipment is locked

**Given** a CONFIRMED shipment and the user has Manager/Owner/Admin role
**When** a seller clicks "Пересчитать"
**Then** `POST /v1/shipments/:id/recalculate` is called
**And** on success, updated cost results display (using fresh COGS)
**And** the shipment remains CONFIRMED
**And** the shipment query is invalidated and refetched

**Given** a CONFIRMED shipment and the user has Analyst role
**When** the detail page loads
**Then** the "Пересчитать" button is hidden (role-based access: FR8 requires Manager+)

**Given** a DRAFT shipment without calculation results
**When** a seller clicks "Подтвердить"
**Then** the confirm action triggers auto-calculation first
**And** if validation errors exist, they display (same as Story 76.4) and confirmation is blocked

**Given** this story is complete
**When** implemented
**Then** TanStack Query hooks added: `useConfirmShipment`, `useRecalculateShipment` in `src/hooks/use-shipment-calculations.ts`

### Story 76.6: Tests & Polish

As a **QA engineer**,
I want comprehensive test coverage for shipment features,
So that the full shipment workflow works reliably end-to-end.

**Acceptance Criteria:**

**Given** all components from stories 76.1–76.5 are implemented
**When** running `npm test`
**Then** unit tests pass for: all shipment TanStack Query hooks (useShipments, useShipment, useCreateShipment, useUpdateShipment, useDeleteShipment, useAddPallet, useRemovePallet, useAddBoxLine, useUpdateBoxLine, useRemoveBoxLine, useCalculateShipment, useConfirmShipment, useRecalculateShipment)
**And** API client tests verify: correct URL construction for 3-level nested paths (`shipments/:id/pallets/:palletId/box-lines/:boxLineId`), request/response mapping

**Given** XOR validation (delivery mode)
**When** tests run
**Then** specific edge cases verified: switch FIXED_VEHICLE→PER_PALLET clears totalDeliveryCost, switch PER_PALLET→FIXED_VEHICLE clears palletRate, both fields cannot have values simultaneously, submitting without cost field shows validation error

**Given** collect-all validation (FR10)
**When** tests run
**Then** all 9 error codes tested individually and in combination: `MISSING_COGS` (with affectedIds, link to /products), `MISSING_PACKAGING` (with affectedIds, link to /sku-packaging), `EMPTY_SHIPMENT`, `EMPTY_PALLET`, `ZERO_UNITS`, `ZERO_VOLUME`, `MISSING_DELIVERY_COST`, `DUPLICATE_SKU_IN_PALLET`, `INVALID_BOX_COUNT`
**And** multiple simultaneous errors render correctly in the error panel
**And** affectedIds highlight the correct box lines in the accordion

**Given** role-based access (FR8)
**When** tests run
**Then** Analyst role: recalculate button is hidden on CONFIRMED shipments
**And** Manager role: recalculate button is visible and functional on CONFIRMED shipments
**And** Owner/Admin role: recalculate button is visible and functional

**Given** the Shipments List page
**When** component tests run
**Then** tests verify: list rendering with pagination, status filtering (All/DRAFT/CONFIRMED), create dialog (delivery mode switching, XOR validation), empty state (with and without packaging hint), navigation to detail

**Given** the Shipment Detail page
**When** component tests run
**Then** tests verify: header display (DRAFT vs CONFIRMED states), edit/delete flows, pallet accordion expand/collapse, add/remove pallets (cascade warning), CONFIRMED readonly state (all mutation controls hidden/disabled)

**Given** box line and calculation features
**When** component tests run
**Then** tests verify: box line CRUD within pallets, pre-flight warnings (missing COGS banner + link, missing packaging banner + link), calculate + result display, confirm flow + success toast, recalculate (Manager+ only)

**Given** all pages
**When** accessibility testing runs
**Then** keyboard navigation works for: accordion expand/collapse, dialog forms, error navigation links, all buttons and interactive elements
**And** ARIA labels on all form inputs, buttons, status badges, error messages
**And** focus management: dialogs trap focus, accordion returns focus on collapse

**Given** all source files
**When** `npm run lint && npm run type-check && npm run build` runs
**Then** 0 ESLint errors, 0 TypeScript errors, all files ≤ 200 lines, production build succeeds
