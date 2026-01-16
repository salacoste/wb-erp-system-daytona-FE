# Backend Response: Epic 18 - COGS Management API Enhancement

**Date**: 2025-11-23  
**Last Updated**: 2025-01-26 (missing_data_reason values updated)  
**Request**: #09 - Epic 18 COGS Management API Requirements  
**Status**: ✅ **100% COMPLETE** - All 3 Phases Shipped  
**Full Details**: `/docs/backend-response-09-epic-18-products-api-enhancement.md`

**⚠️ IMPORTANT**: For up-to-date information on `missing_data_reason` values and margin data structure, see [Request #16](./16-cogs-history-and-margin-data-structure.md).

---

## TL;DR

**Good News**: Most of Epic 18 already exists! We only needed to add missing fields.

**What Changed**:
- ✅ Phase 1: Added 9 new fields to `GET /v1/products/:nmId` response
- ✅ Phase 1: Integrated margin calculation from Epic 17 analytics
- ✅ Phase 1: Added sales statistics (last_sale_date, total_sales_qty)
- ✅ Phase 2: Field alias support (items ↔ assignments)
- ✅ Phase 2: V2 response format (?format=v2)
- ✅ Phase 3: Multi-currency support (RUB, USD, EUR, CNY)
- ✅ Build passing, ready for integration

**Unblocked Stories**:
- ✅ Story 4.1: Single Product COGS Assignment Interface
- ✅ Story 4.2: Bulk COGS Assignment Capability
- ✅ Story 4.3: COGS Input Validation & Error Handling

---

## What's Already Available (Epic 12 + Epic 10)

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /v1/products` | ✅ Ready | Product catalog with `has_cogs` filter |
| `GET /v1/products/:nmId` | ✅ **Enhanced** | **9 new fields added** |
| `POST /v1/products/cogs/bulk` | ✅ Ready | Bulk COGS upload (max 1000 items) |
| `GET /v1/cogs` | ✅ Ready | COGS retrieval with temporal lookup |
| `GET /v1/products/missing-cogs` | ✅ Ready | Products without COGS |
| `GET /v1/products/cogs-coverage` | ✅ Ready | COGS coverage metrics |

---

## New Fields in ProductResponseDto

**Added to `GET /v1/products/:nmId` response**:

```typescript
{
  // ✅ NEW FIELDS (Phase 1 - 2025-11-23):
  "barcode": "4607156789012",                      // Product barcode from WB API

  "current_margin_pct": 35.5,                      // Margin % (from Epic 17 analytics)
  "current_margin_period": "2025-W46",             // ISO week for margin calculation
  "current_margin_sales_qty": 50,                  // Sales qty for margin period
  "current_margin_revenue": 125000.50,             // Revenue for margin period
  "missing_data_reason": null,                     // "NO_SALES_IN_PERIOD" | "COGS_NOT_ASSIGNED" | "NO_SALES_DATA" | "ANALYTICS_UNAVAILABLE" | null

  "last_sale_date": "2025-11-22",                  // Last sale date (all-time)
  "total_sales_qty": 280                           // Total quantity sold (all-time)
}
```

---

## Margin Calculation Logic

**How it works** (updated 2025-01-26):
1. **Try last completed week** (most recent data)
   - Query Epic 17: `GET /v1/analytics/weekly/by-sku?week=2025-W46&includeCogs=true`
   - Uses `IsoWeekService.getLastCompletedWeek()` to avoid incomplete weeks (Epic 19)
   - Fallback: If no data in last completed week, tries previous 3 weeks (for data availability, not for missing_data_reason)

2. **Determine missing_data_reason**:
   - Checks actual COGS existence in database (not just analytics response)
   - Checks if product has sales in the period
   - Sets `missing_data_reason` based on actual state

3. **Possible values for `missing_data_reason`** (updated 2025-01-26):
   - `null` - Margin calculated successfully ✅ OR COGS assigned but margin calculation in progress (Epic 20)
   - `"NO_SALES_IN_PERIOD"` - Product had no sales in last completed week (margin period)
   - `"COGS_NOT_ASSIGNED"` - Product has sales but no COGS assigned
   - `"NO_SALES_DATA"` - Product has never had any sales
   - `"ANALYTICS_UNAVAILABLE"` - Analytics service unavailable (graceful degradation)
   
   **Note**: See Request #16 for complete documentation on margin data structure.

**Why weekly (not monthly)**:
- ✅ More recent data (1 week vs 1 month)
- ✅ Consistent with Epic 17 analytics
- ✅ WB uses weekly reports
- ✅ Stable numbers (not real-time)

---

## API Examples

### Example 1: Product with Margin Data ✅

```http
GET /v1/products/12345678
Authorization: Bearer <jwt>
X-Cabinet-Id: <cabinet_id>
```

**Response**:
```json
{
  "nm_id": "12345678",
  "sa_name": "Кроссовки Nike Air Max",
  "brand": "Nike",
  "category": "Обувь",
  "has_cogs": true,
  "cogs": {
    "id": "cogs_abc123",
    "unit_cost_rub": "1250.50",
    "valid_from": "2025-11-01T00:00:00Z",
    "valid_to": null
  },
  "barcode": "4607156789012",
  "current_margin_pct": 35.5,
  "current_margin_period": "2025-W46",
  "current_margin_sales_qty": 50,
  "current_margin_revenue": 125000.50,
  "missing_data_reason": null,
  "last_sale_date": "2025-11-22",
  "total_sales_qty": 280
}
```

---

### Example 2: No Sales Last Week ⚠️

```json
{
  "nm_id": "87654321",
  "sa_name": "Футболка Adidas",
  "has_cogs": true,
  "current_margin_pct": null,
  "current_margin_period": null,
  "current_margin_sales_qty": 0,
  "current_margin_revenue": null,
  "missing_data_reason": "NO_SALES_IN_PERIOD",  // ← UX: show "no sales in period"
  "last_sale_date": "2025-11-10",
  "total_sales_qty": 15
}
```

---

### Example 3: Missing COGS ❌

```json
{
  "nm_id": "99999999",
  "sa_name": "Куртка New Brand",
  "has_cogs": false,
  "cogs": null,
  "current_margin_pct": null,
  "missing_data_reason": "COGS_NOT_ASSIGNED",  // ← UX: show "assign COGS to calculate margin"
  "last_sale_date": "2025-11-22",
  "total_sales_qty": 100
}
```

---

## Performance Notes

| Endpoint | Margin Calculation | Response Time |
|----------|-------------------|---------------|
| `GET /v1/products` (list) | ❌ Disabled | ~300ms (no change) |
| `GET /v1/products/:nmId` | ✅ Enabled | ~250ms (+100ms overhead) |

**Why margin disabled in list**:
- Product list with 50 items: 50 × 100ms = **+5 seconds** (unacceptable UX)
- Single product view: +100ms = **acceptable** for detailed view

**Recommendation**: If you need margin in product list, let us know. We can optimize with batch queries (~500ms for 50 products).

---

## Existing API Endpoints (No Changes)

### Bulk COGS Upload

```http
POST /v1/products/cogs/bulk
Content-Type: application/json
Authorization: Bearer <jwt>
X-Cabinet-Id: <cabinet_id>
```

**Request**:
```json
{
  "items": [
    {
      "nm_id": "12345678",
      "unit_cost_rub": 1250.50,
      "valid_from": "2025-11-23T00:00:00Z",
      "source": "manual",
      "notes": "Initial cost entry"
    }
  ]
}
```

**Response**:
```json
{
  "totalItems": 1,
  "createdItems": 1,
  "skippedItems": 0,
  "errors": []
}
```

**Note**: Field naming differs slightly from Request #09 spec:
- `items` instead of `assignments` (can use adapter)
- `unit_cost_rub` instead of `unit_cost` (explicit currency)

---

### COGS Retrieval

```http
GET /v1/cogs?nm_id=12345678&valid_at=2025-11-23
```

**Features**:
- ✅ Filter by `nm_id`, `sa_name`, `valid_at`
- ✅ Temporal lookup (COGS valid at specific date)
- ✅ Current COGS: `GET /v1/cogs/:nmId/current`
- ✅ Historical: `GET /v1/cogs/:nmId/at/:date`

---

## ✅ Phase 2: Field Naming Alignment (COMPLETED 2025-11-23)

### Field Naming - RESOLVED

| Request #09 | Current Backend | Phase 2 Solution |
|-------------|-----------------|------------------|
| `assignments` | `items` | ✅ **Both accepted** |
| `unit_cost` | `unit_cost_rub` | ✅ Keep (explicit currency) |

**What Changed**:
- Backend now accepts both `items` and `assignments` field names
- Zero breaking changes - original format still works
- Use whichever field name you prefer

**Example** (both work):
```typescript
// Option 1: Original format
await api.post('/v1/cogs/bulk', { items: [...] });

// Option 2: Request #09 format
await api.post('/v1/cogs/bulk', { assignments: [...] });
```

---

### Response Format - RESOLVED

**V2 Format Available** (`?format=v2` query parameter)

**Default Response** (backward compatible):
```json
{ "totalItems": 2, "createdItems": 2, "skippedItems": 0, "errors": [] }
```

**V2 Response** (`POST /v1/cogs/bulk?format=v2`):
```json
{
  "data": {
    "succeeded": 2,
    "failed": 0,
    "results": [
      { "nm_id": "12345678", "success": true, "cogs_id": "cogs_abc123", "version": 1 },
      { "nm_id": "87654321", "success": false, "error_code": "DUPLICATE_ENTRY", "error_message": "..." }
    ],
    "message": "2 из 2 товаров успешно обновлены"
  }
}
```

**Recommendation**: Use V2 format for new integrations (matches Request #09 exactly)

---

### ✅ Phase 3: Currency Support (COMPLETED 2025-11-23)

**What Changed**:
- Backend now supports multi-currency COGS
- Added optional `currency` field to bulk upload
- Default: 'RUB' (backward compatible)

**Supported Currencies**:
- `RUB` (Russian Ruble) - default
- `USD` (US Dollar)
- `EUR` (Euro)
- `CNY` (Chinese Yuan)

**Example**:
```typescript
// With currency (optional)
await api.post('/v1/cogs/bulk', {
  items: [
    {
      nm_id: '12345',
      sa_name: 'Product Name',
      unit_cost_rub: 1250.50,
      currency: 'USD',  // NEW: Optional field
      valid_from: '2025-11-23',
      source: 'manual'
    }
  ]
});

// Without currency (defaults to RUB)
await api.post('/v1/cogs/bulk', {
  items: [
    {
      nm_id: '67890',
      unit_cost_rub: 450.00,
      valid_from: '2025-11-23',
      source: 'manual'
      // currency defaults to 'RUB'
    }
  ]
});
```

**Implementation Details**:
- Validation: 3-character ISO 4217 code
- Database: `currency VARCHAR(3) DEFAULT 'RUB'`
- Backward compatible: Existing records default to 'RUB'

---

## Integration Checklist

### For Story 4.1 (Single Product COGS Assignment)

- [x] ✅ Backend API ready: `POST /v1/products/:nmId/cogs`
- [x] ✅ Backend API ready: `GET /v1/products/:nmId`
- [x] ✅ Product validation against WB API
- [x] ✅ Auto-fetch `sa_name` from WB API
- [x] ✅ Margin calculation integrated
- [ ] Frontend: Build COGS assignment form
- [ ] Frontend: Display margin in product details

---

### For Story 4.2 (Bulk COGS Assignment)

- [x] ✅ Backend API ready: `POST /v1/products/cogs/bulk`
- [x] ✅ Max 1000 items per request
- [x] ✅ Partial success handling
- [x] ✅ Product validation
- [ ] Frontend: Build bulk upload UI (CSV/Excel import)
- [ ] Frontend: Handle partial success responses

---

### For Story 4.3 (COGS Input Validation)

- [x] ✅ Backend validation: `unit_cost_rub >= 0`
- [x] ✅ Backend validation: `valid_from` date format
- [x] ✅ Backend validation: Product exists in WB API
- [x] ✅ Error responses with clear messages
- [ ] Frontend: Input validation before submit
- [ ] Frontend: Display backend validation errors

---

## Questions?

**Need help with integration?**
- Check full docs: `/docs/backend-response-09-epic-18-products-api-enhancement.md`
- Swagger: `http://localhost:3000/api` (when backend running)
- Test endpoints: `test-api/08-products.http` (Products & COGS Assignment)

**Missing something?**
- Current implementation covers 80% of Epic 18
- Remaining 20% = field naming alignment (Phase 2, optional)
- Let us know if you need anything prioritized!

---

**Document Version**: 1.0
**Last Updated**: 2025-11-23
**Status**: ✅ Ready for Frontend Integration
**Backend Contact**: Backend Team
