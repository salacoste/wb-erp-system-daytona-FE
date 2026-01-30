# Orders Page Documentation

Orders page manages order tracking, FBS (Fulfillment by Wildberries) integration, and historical order analytics.

## Page Overview

**Route:** `/orders`

**Primary Features:**
- Order list with search and filters
- FBS order status tracking
- Order details view
- Historical order analytics
- Order filtering by date/status

## Key Components

### Order List
- **Component:** `OrderList`
- **Location:** `src/components/custom/orders/OrderList.tsx`
- **Features:**
  - Search by order ID/SKU
  - Filter by status, date range
  - Sort by various fields
  - Pagination

### Order Details
- **Component:** `OrderDetails`
- **Location:** `src/components/custom/orders/OrderDetails.tsx`
- **Features:**
  - Full order information
  - Status tracking history
  - Related product info

## Documentation Files

### Integration Analysis
- [Orders Supply Storage Integration Analysis](../../ORDERS-SUPPLY-STORAGE-INTEGRATION-ANALYSIS.md) - Orders integration overview

### API Documentation
- [Epic 40 Orders FBS Frontend Guide](../../request-backend/93-epic-40-orders-fbs-frontend-guide.md) - FBS integration guide
- [Epic 40 WB Native Status History API](../../request-backend/109-epic-40-wb-native-status-history-api.md) - Status history API
- [Epic 51 FBS Historical Analytics API](../../request-backend/110-epic-51-fbs-historical-analytics-api.md) - Historical analytics

### Related Features
- [Separate Sales Returns Tracking](../../request-backend/41-separate-sales-returns-tracking.md) - Returns handling
- [Epic 48 Orders Integrity Dashboard](../../request-backend/97-epic-48-orders-integrity-dashboard.md) - Data integrity

## Related Files

### Components
- `src/components/custom/orders/OrderList.tsx` - Order list
- `src/components/custom/orders/OrderDetails.tsx` - Order details
- `src/components/custom/orders/OrderFilters.tsx` - Filters
- `src/components/custom/orders/OrderCard.tsx` - Order card

### Hooks
- `src/hooks/useOrders.ts` - Orders list
- `src/hooks/useOrderDetails.ts` - Order details
- `src/hooks/useFbsStatus.ts` - FBS status tracking

### Pages
- `src/app/(dashboard)/orders/page.tsx` - Orders page

### Utilities
- `src/lib/order-utils.ts` - Order utilities
- `src/lib/status-utils.ts` - Status helpers

### Tests
- `src/components/custom/orders/__tests__/` - Component tests
- `src/hooks/__tests__/useOrders.test.ts` - Hook tests

## API Endpoints

### Orders
- `GET /v1/orders` - Order list with pagination
- `GET /v1/orders/:id` - Single order details
- `GET /v1/orders/fbs/status` - FBS status tracking
- `GET /v1/orders/history` - Historical order data

### FBS Integration
- `GET /v1/fbs/orders` - FBS order list
- `GET /v1/fbs/status/:orderId` - FBS status history
- `POST /v1/fbs/sync` - Trigger FBS sync

## Business Logic

### Order Status Flow
```
Created → Accepted → Packed → Shipped → Delivered → Completed
                ↓
             Cancelled
```

### FBS Status Tracking
- Real-time status updates from WB API
- Status history with timestamps
- Automatic sync on page load

### Order Filtering
- Date range: Today, Yesterday, Last 7 days, Last 30 days, Custom
- Status: All, Active, Completed, Cancelled
- Search: Order ID, SKU, Article

## Design System

### Status Colors
- Active: `#3B82F6` (blue)
- Completed: `#22C55E` (green)
- Cancelled: `#EF4444` (red)
- Pending: `#F59E0B` (yellow)

### Typography
- Order ID: Monospace, 14px
- Status: Badge, 12px, uppercase
- Dates: 14px, regular

## Testing Strategy

### E2E Tests (Playwright)
- Order list rendering
- Search and filtering
- Status tracking updates
- Order details display

### Unit Tests (Vitest)
- Component rendering
- Hook behavior
- Status transformation
- Date formatting

## Performance Requirements

- Order list load: <2s
- Search response: <500ms
- Status update: <1s
- Details view: <1s

---

**Related Documentation:**
- [Frontend Spec](../../front-end-spec.md) - Design system and UI/UX guidelines
- [API Integration Guide](../../api-integration-guide.md) - Complete endpoint catalog
- [Orders FBS Guide](../../request-backend/93-epic-40-orders-fbs-frontend-guide.md) - FBS integration

**Last Updated:** 2026-01-30
