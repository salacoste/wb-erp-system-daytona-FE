# Products Page Documentation

Products page manages the product catalog with COGS (Cost of Goods Sold) assignment, margin calculation, and bulk operations.

## Page Overview

**Route:** `/products`

**Primary Features:**
- Product list with search, filters, and pagination
- Single COGS assignment per product
- Bulk COGS upload (Excel/CSV)
- Margin calculation and real-time polling
- Historical COGS versions tracking
- Manual margin recalculation trigger

## Key Components

### Product List
- **Component:** `ProductList`
- **Location:** `src/components/custom/products/ProductList.tsx`
- **Features:**
  - Search by article/name
  - Filter by brand/category
  - Sort by margin/revenue
  - Pagination
  - COGS coverage indicator

### COGS Assignment
- **Single COGS:** `SingleCogsForm` - Assign COGS to individual product
- **Bulk Upload:** `BulkCogsUpload` - Upload Excel/CSV with multiple COGS
- **Location:** `src/components/custom/cogs/`

### Margin Calculation
- **Polling:** Automatic margin calculation polling after COGS assignment
- **Status Display:** Real-time calculation status
- **Manual Trigger:** Force recalculation button

## Documentation Files

### Latest Integration Changes
- [COGS Bulk Upload Changes - Automatic Margin Recalculation](./COGS-BULK-UPLOAD-CHANGES.md) ⭐ **NEW**
  - Backend automatic margin recalculation integration (2026-01-30)
  - New API response format with `marginRecalculation` field
  - Complete frontend implementation plan with code examples
  - Test cases and rollback strategy

### Integration Analysis
- [Margin Integration Analysis](../../MARGIN-INTEGRATION-ANALYSIS.md) - Complete margin calculation integration
- [Margin COGS Backend Integration](../../MARGIN-COGS-BACKEND-INTEGRATION.md) - Backend API integration guide
- [Margin Calculation Documentation Summary](../../request-backend/MARGIN-CALCULATION-DOCUMENTATION-SUMMARY.md) - Consolidated documentation

### Backend Team Questions
- [Backend Team Questions - Detailed Analysis](../../request-backend/118-backend-team-questions-detailed-analysis.md) - COGS and margin questions
- [Quick Answers Summary](../../request-backend/119-quick-answers-summary.md) - Quick reference answers

### API Documentation
- [COGS Margin Analytics includecogs Parameter](../../request-backend/07-cogs-margin-analytics-includecogs-parameter.md) - include_cogs parameter usage
- [Margin Calculation Frontend Guide](../../request-backend/114-margin-calculation-frontend-guide.md) - Frontend implementation guide
- [Margin Calculation Investigation Findings](../../request-backend/117-margin-calculation-investigation-findings.md) - Investigation results
- [Margin Calculation Text Clarification](../../request-backend/26-margin-calculation-text-clarification.md) - Text clarification

### COGS Management
- [COGS History and Margin Data Structure](../../request-backend/16-cogs-history-and-margin-data-structure.md) - Data structure overview
- [COGS Temporal Versioning and Margin Calculation](../../request-backend/29-cogs-temporal-versioning-and-margin-calculation.md) - Temporal logic
- [COGS Display Improvement](../../request-backend/31-cogs-display-improvement-show-applicable-cogs.md) - UI improvements
- [COGS CreateCogs Not Closing Previous Versions](../../request-backend/33-cogs-createCogs-not-closing-previous-versions.md) - Version management

### Polling & Status
- [Frontend Polling Implementation Issues](../../request-backend/20-frontend-polling-implementation-issues.md) - Polling challenges
- [Margin Calculation Status Endpoint](../../request-backend/21-margin-calculation-status-endpoint-backend.md) - Status API
- [Margin Calculation Manual Trigger](../../request-backend/22-w47-margin-calculation-manual-trigger.md) - Manual recalculation

### Edge Cases
- [COGS Assigned After Completed Week Recalculation](../../request-backend/17-cogs-assigned-after-completed-week-recalculation.md) - Edge case handling
- [Missing Margin and Missing Data Reason Scenarios](../../request-backend/18-missing-margin-and-missing-data-reason-scenarios.md) - Empty states
- [Margin Returned Without COGS](../../request-backend/19-margin-returned-without-cogs.md) - Data validation
- [Historical Margin Context Not Showing](../../request-backend/32-historical-margin-not-showing-for-product-173589742.md) - Historical data

### Related Requests
- [Add includecogs to Product List Endpoint](../../request-backend/15-add-includecogs-to-product-list-endpoint.md) - API enhancement
- [Automatic Margin Recalculation on COGS Update](../../request-backend/14-automatic-margin-recalculation-on-cogs-update.md) - Automation
- [COGS Update Conflict 409 Error](../../request-backend/12-cogs-update-conflict-409-error.md) - Conflict handling

## Related Files

### Components
- `src/components/custom/products/ProductList.tsx` - Product list
- `src/components/custom/products/SingleCogsForm.tsx` - Single COGS form
- `src/components/custom/products/BulkCogsUpload.tsx` - Bulk upload
- `src/components/custom/products/ProductCard.tsx` - Product card
- `src/components/custom/products/ProductFilters.tsx` - Filters

### Hooks
- `src/hooks/useProducts.ts` - Products list
- `src/hooks/useCogsAssignment.ts` - COGS assignment
- `src/hooks/useMarginPolling.ts` - Margin polling
- `src/hooks/useBulkCogsUpload.ts` - Bulk upload

### Pages
- `src/app/(dashboard)/products/page.tsx` - Products page

### Utilities
- `src/lib/margin-helpers.ts` - Margin calculation helpers
- `src/lib/cogs-utils.ts` - COGS utilities
- `src/lib/polling-utils.ts` - Polling strategies

### Tests
- `src/components/custom/products/__tests__/` - Component tests
- `src/hooks/__tests__/useProducts.test.ts` - Hook tests

## API Endpoints

### Products
- `GET /v1/products` - Product list with pagination
- `GET /v1/products?include_cogs=true` - Products with COGS and margin
- `GET /v1/products/:id` - Single product details

### COGS Management
- `POST /v1/cogs` - Create COGS assignment
- `PUT /v1/cogs/:id` - Update COGS assignment
- `GET /v1/cogs` - COGS history list
- `GET /v1/cogs/:id` - Single COGS details

### Margin Calculation
- `POST /v1/margin/calculate` - Trigger margin calculation
- `GET /v1/margin/status/:taskId` - Calculation status
- `GET /v1/margin/history` - Historical margin data

### Bulk Operations
- `POST /v1/cogs/bulk` - Bulk COGS upload
- `POST /v1/products/margin/recalculate` - Manual recalculation

## Business Logic

### Week Definition
- Format: ISO week `YYYY-Www` (e.g., "2025-W49")
- Timezone: `Europe/Moscow`
- Week starts: Monday
- Last completed week: Mon/Tue before 12:00 → W-2, Tue after 12:00 → W-1

### COGS Temporal Logic
- **Midpoint Rule:** Thursday determines which COGS version applies
- `valid_from` after last completed week → Warning + manual recalc button
- Historical weeks use COGS version based on validity date

### Margin Calculation
```
margin_pct = ((revenue - cogs) / revenue) * 100
```

### Polling Strategy
After COGS assignment, poll for margin calculation:
```typescript
getPollingStrategy(validFrom, isBulk) -> {
  interval: 3000-5000ms,
  maxAttempts: 10-20
}
```

### COGS Coverage
- Percentage of products with assigned COGS
- Calculated for selected week
- Affects margin data accuracy

## Design System

### Color Palette
- Green: `#22C55E` (positive margin, profitable)
- Red: `#EF4444` (negative margin, loss)
- Blue: `#3B82F6` (neutral information)

### Status Indicators
- Calculated: Green checkmark
- Pending: Yellow spinner
- Failed: Red error icon
- Missing Data: Gray warning

## Testing Strategy

### E2E Tests (Playwright)
- Product list rendering
- Single COGS assignment flow
- Bulk upload flow
- Margin polling behavior
- Manual recalculation trigger

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Margin calculations
- COGS temporal logic
- Polling strategies

## Performance Requirements

- Product list load: <2s
- COGS assignment: <500ms
- Margin calculation: <5s (background)
- Bulk upload (100 items): <10s
- Polling response: <200ms

---

**Related Documentation:**
- [Frontend Spec](../../front-end-spec.md) - Design system and UI/UX guidelines
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog
- [Margin Helpers](../../src/lib/margin-helpers.ts) - Margin calculation utilities

**Last Updated:** 2026-01-30
