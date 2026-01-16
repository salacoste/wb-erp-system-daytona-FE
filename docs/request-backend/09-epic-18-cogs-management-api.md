# Request #09: Epic 18 - COGS Management API Requirements

**Date:** 2025-11-23
**From:** Frontend Team (Product Owner)
**To:** Backend Team
**Priority:** 🔴 **HIGH** - Blocks 3 Epic 4 Stories
**Epic:** Epic 18 - COGS Management & Product Catalog API

---

## Executive Summary

**Request:** Implement COGS management API with temporal versioning and product catalog endpoints to enable Epic 4 (COGS Management & Margin Analysis) frontend implementation.

**Impact:**
- ✅ Unblocks Stories 4.1, 4.2, 4.3 (currently blocked)
- ✅ Enables full COGS workflow (upload → validate → display margins)
- ✅ Complements Epic 17 analytics with data management capabilities

**Current Status:**
- Epic 17 provides **read-only** COGS & margin analytics (`includeCogs=true`) ✅
- **Missing:** COGS create/update endpoints ❌
- **Missing:** Product catalog listing ❌
- **Missing:** Temporal versioning API ❌

---

## Business Context

### Problem Statement

Epic 4 frontend stories require users to:
1. **Assign COGS** to individual products (Story 4.1)
2. **Bulk upload COGS** for multiple products (Story 4.2)
3. **Validate COGS** input with business rules (Story 4.3)

**Current Gap:**
- Epic 17 only provides **read-only** COGS data in analytics endpoints
- No API exists for **creating or updating** COGS assignments
- No product catalog endpoint for COGS assignment UI

### Business Value

**Without COGS Management API:**
- ❌ Users cannot enter COGS data
- ❌ Margin calculations remain empty (`missing_cogs_flag: true`)
- ❌ Epic 17 analytics show incomplete profitability data

**With COGS Management API:**
- ✅ Users upload COGS via UI (Stories 4.1, 4.2)
- ✅ Margin calculations populate automatically (Story 4.4)
- ✅ Epic 17 analytics provide full profitability insights (Stories 4.5-4.7)

---

## Blocked Frontend Stories

| Story | Title | Status | Depends On |
|-------|-------|--------|------------|
| **4.1** | Single Product COGS Assignment Interface | 🔴 **BLOCKED** | `POST /v1/cogs/bulk`, `GET /v1/products` |
| **4.2** | Bulk COGS Assignment Capability | 🔴 **BLOCKED** | `POST /v1/cogs/bulk` |
| **4.3** | COGS Input Validation & Error Handling | 🟡 **PARTIAL** | Frontend validation ready, needs API |

**Impact:** **43% of Epic 4** (3 out of 7 stories) blocked by missing backend API.

---

## Required Endpoints

### 1. Bulk COGS Upload (Priority: 🔴 HIGH)

**Story:** 4.1 (Single), 4.2 (Bulk)

#### Endpoint Specification

```http
POST /v1/cogs/bulk
Content-Type: application/json
Authorization: Bearer <jwt>
X-Cabinet-Id: <cabinet_id>
```

#### Request Body

```typescript
{
  "assignments": [
    {
      "nm_id": 12345678,           // Артикул WB (required)
      "sa_name": "Кроссовки Nike", // Название товара (optional, for validation)
      "unit_cost": 1250.50,         // Себестоимость за единицу (required)
      "currency": "RUB",            // Валюта (optional, default: RUB)
      "valid_from": "2025-11-23"    // Дата начала действия (required)
    },
    {
      "nm_id": 87654321,
      "sa_name": "Футболка Adidas",
      "unit_cost": 450.00,
      "valid_from": "2025-11-23"
    }
  ],
  "source": "manual_upload",         // Источник: manual_upload | excel_import | api
  "created_by": "user@example.com"   // Email пользователя (optional, from JWT)
}
```

#### Response (Success)

```typescript
{
  "data": {
    "succeeded": 2,
    "failed": 0,
    "results": [
      {
        "nm_id": 12345678,
        "sa_name": "Кроссовки Nike",
        "success": true,
        "cogs_id": "cogs_abc123",     // ID новой записи COGS
        "version": 1,                  // Версия записи (temporal versioning)
        "valid_from": "2025-11-23",
        "valid_to": null               // null = активная версия
      },
      {
        "nm_id": 87654321,
        "sa_name": "Футболка Adidas",
        "success": true,
        "cogs_id": "cogs_def456",
        "version": 1,
        "valid_from": "2025-11-23",
        "valid_to": null
      }
    ],
    "message": "2 из 2 товаров успешно обновлены"
  }
}
```

#### Response (Partial Success)

```typescript
{
  "data": {
    "succeeded": 1,
    "failed": 1,
    "results": [
      {
        "nm_id": 12345678,
        "success": true,
        "cogs_id": "cogs_abc123",
        "version": 1
      },
      {
        "nm_id": 99999999,
        "success": false,
        "error": "PRODUCT_NOT_FOUND",
        "message": "Товар с артикулом 99999999 не найден в каталоге"
      }
    ],
    "message": "1 из 2 товаров обновлены. 1 ошибка."
  }
}
```

#### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Невалидные данные (unit_cost < 0, missing fields) |
| `PRODUCT_NOT_FOUND` | 404 | Товар с указанным nm_id не найден |
| `DUPLICATE_ASSIGNMENT` | 409 | COGS для этой даты уже существует |
| `UNAUTHORIZED` | 401 | Невалидный JWT токен |
| `FORBIDDEN` | 403 | Кабинет не принадлежит пользователю |
| `RATE_LIMITED` | 429 | Превышен лимит запросов |

#### Validation Rules

**Required Fields:**
- `nm_id` (number, > 0)
- `unit_cost` (number, >= 0, decimal support)
- `valid_from` (ISO date string, >= today - 365 days)

**Optional Fields:**
- `sa_name` (string, used for validation if provided)
- `currency` (string, default: "RUB")
- `source` (string, default: "manual_upload")

**Business Rules:**
- `unit_cost` must be >= 0 (zero allowed for free products)
- `valid_from` cannot be in far past (> 1 year ago)
- `valid_from` cannot be in future (> today)
- Duplicate assignments for same `(nm_id, valid_from)` should update existing COGS
- If product not found in catalog, return error in results array

---

### 2. Product Catalog Listing (Priority: 🔴 HIGH)

**Story:** 4.1 (product list for COGS assignment UI)

#### Endpoint Specification

```http
GET /v1/products?hasCogs=false&search=Nike&page=1&limit=50
Authorization: Bearer <jwt>
X-Cabinet-Id: <cabinet_id>
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `hasCogs` | boolean | No | Filter: `true` = with COGS, `false` = without COGS, omit = all |
| `search` | string | No | Search by nm_id or sa_name (partial match) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 50, max: 200) |

#### Response

```typescript
{
  "data": {
    "products": [
      {
        "nm_id": 12345678,
        "sa_name": "Кроссовки Nike Air Max",
        "barcode": "4607156789012",
        "brand": "Nike",
        "category": "Обувь",
        "has_cogs": false,              // Индикатор наличия COGS
        "current_cogs": null,           // Текущая себестоимость (если есть)
        "current_margin_pct": null,     // Текущая маржа (если COGS есть)
        "last_sale_date": "2025-11-20", // Дата последней продажи
        "total_sales_qty": 150          // Всего продано единиц
      },
      {
        "nm_id": 87654321,
        "sa_name": "Футболка Adidas Classic",
        "barcode": "4607156789013",
        "brand": "Adidas",
        "category": "Одежда",
        "has_cogs": true,
        "current_cogs": 450.00,
        "current_margin_pct": 35.5,
        "last_sale_date": "2025-11-22",
        "total_sales_qty": 280
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

#### Data Source

**Source Tables:**
- Primary: `products` table (or equivalent SKU catalog)
- Join: `cogs` table for `has_cogs` flag and `current_cogs` value
- Aggregation: `wb_finance_raw` for sales statistics

**Performance Requirements:**
- p95 latency: < 500ms for 50 products
- Support pagination for catalogs with 10k+ SKUs
- Indexed fields: `nm_id`, `sa_name`, `has_cogs`

---

### 3. COGS Retrieval (Priority: 🟡 MEDIUM)

**Story:** 4.1 (view current COGS), 4.4 (margin display)

#### Endpoint Specification

```http
GET /v1/cogs?nm_id=12345678&valid_at=2025-11-23
Authorization: Bearer <jwt>
X-Cabinet-Id: <cabinet_id>
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nm_id` | number | Yes | Артикул WB (can provide multiple: `nm_id=123&nm_id=456`) |
| `valid_at` | string | No | ISO date (default: today) - return COGS valid at this date |
| `include_history` | boolean | No | Include all historical versions (default: false) |

#### Response (Single Product, Current COGS)

```typescript
{
  "data": {
    "cogs": [
      {
        "cogs_id": "cogs_abc123",
        "nm_id": 12345678,
        "sa_name": "Кроссовки Nike Air Max",
        "unit_cost": 1250.50,
        "currency": "RUB",
        "valid_from": "2025-11-01",
        "valid_to": null,               // null = активная версия
        "version": 2,                   // Версия записи (2 = updated once)
        "source": "manual_upload",
        "created_by": "user@example.com",
        "created_at": "2025-11-01T10:30:00Z",
        "updated_at": "2025-11-15T14:20:00Z"
      }
    ]
  }
}
```

#### Response (With History)

```typescript
{
  "data": {
    "cogs": [
      {
        "cogs_id": "cogs_abc123",
        "nm_id": 12345678,
        "unit_cost": 1250.50,
        "valid_from": "2025-11-01",
        "valid_to": null,
        "version": 2,
        "is_current": true
      },
      {
        "cogs_id": "cogs_xyz789",
        "nm_id": 12345678,
        "unit_cost": 1100.00,
        "valid_from": "2025-10-01",
        "valid_to": "2025-10-31",
        "version": 1,
        "is_current": false
      }
    ]
  }
}
```

---

## Temporal Versioning Requirements

### Database Schema (Reference from Epic 10.4)

**Table:** `cogs`

```sql
CREATE TABLE cogs (
  id SERIAL PRIMARY KEY,
  nm_id BIGINT NOT NULL,              -- Артикул WB
  sa_name VARCHAR(500),               -- Название товара (denormalized for convenience)
  unit_cost DECIMAL(12,2) NOT NULL,   -- Себестоимость за единицу
  currency VARCHAR(3) DEFAULT 'RUB',
  valid_from DATE NOT NULL,            -- Дата начала действия
  valid_to DATE,                       -- Дата окончания действия (NULL = активная)
  version INTEGER NOT NULL DEFAULT 1,  -- Версия записи
  source VARCHAR(50) DEFAULT 'manual_upload',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT cogs_positive_cost CHECK (unit_cost >= 0),
  CONSTRAINT cogs_valid_dates CHECK (valid_from <= COALESCE(valid_to, '9999-12-31'))
);

CREATE INDEX idx_cogs_nm_id_valid ON cogs(nm_id, valid_from, valid_to);
CREATE INDEX idx_cogs_current ON cogs(nm_id) WHERE valid_to IS NULL;
```

### Temporal Versioning Logic

**Key Principles:**
1. **One Active Version:** Only one COGS record per `nm_id` with `valid_to = NULL`
2. **Immutable History:** Previous versions remain in DB with `valid_to` set
3. **Point-in-Time Queries:** `valid_from <= date AND (valid_to IS NULL OR valid_to >= date)`

**Update Flow:**
```sql
-- Step 1: Close current version (if exists)
UPDATE cogs
SET valid_to = '2025-11-22'
WHERE nm_id = 12345678 AND valid_to IS NULL;

-- Step 2: Insert new version
INSERT INTO cogs (nm_id, unit_cost, valid_from, version)
VALUES (12345678, 1250.50, '2025-11-23', 2);
```

**Query Current COGS:**
```sql
SELECT * FROM cogs
WHERE nm_id = 12345678 AND valid_to IS NULL;
```

**Query Historical COGS (at specific date):**
```sql
SELECT * FROM cogs
WHERE nm_id = 12345678
  AND valid_from <= '2025-10-15'
  AND (valid_to IS NULL OR valid_to >= '2025-10-15')
LIMIT 1;
```

---

## Integration with Epic 17 Analytics

### Current Epic 17 Behavior

**Analytics Endpoints with `includeCogs=true`:**
- `GET /v1/analytics/weekly/by-sku?includeCogs=true&week=2025-W47`
- `GET /v1/analytics/weekly/by-brand?includeCogs=true`
- `GET /v1/analytics/weekly/by-category?includeCogs=true`

**Epic 17 Response Fields:**
```typescript
{
  cogs?: number;              // unit_cost × qty (if COGS available)
  profit?: number;            // revenue_net - cogs
  margin_pct?: number;        // (profit / |revenue_net|) × 100
  markup_percent?: number;    // (profit / |cogs|) × 100
  missing_cogs_flag: boolean; // true if COGS not assigned
}
```

### Required Integration

**Epic 17 should use temporal COGS:**
1. For each `(nm_id, sale_dt)` in analytics query
2. Lookup COGS where `valid_from <= sale_dt AND (valid_to IS NULL OR valid_to >= sale_dt)`
3. Use matched `unit_cost` for margin calculations
4. Set `missing_cogs_flag = true` if no COGS found

**Example SQL (for Epic 17 analytics):**
```sql
SELECT
  f.nm_id,
  f.sa_name,
  f.revenue_net,
  f.qty,
  c.unit_cost,
  (c.unit_cost * f.qty) AS cogs,
  (f.revenue_net - c.unit_cost * f.qty) AS profit,
  CASE
    WHEN c.unit_cost IS NULL THEN TRUE
    ELSE FALSE
  END AS missing_cogs_flag
FROM weekly_payout_summary f
LEFT JOIN cogs c ON f.nm_id = c.nm_id
  AND f.sale_dt >= c.valid_from
  AND (c.valid_to IS NULL OR f.sale_dt <= c.valid_to)
WHERE f.week = '2025-W47';
```

---

## Business Logic & Validation

### COGS Upload Rules

**Validation (HTTP 400):**
- `unit_cost` must be >= 0
- `valid_from` must be valid ISO date
- `valid_from` cannot be > 1 year in past
- `valid_from` cannot be in future (> today)
- `nm_id` must be valid number > 0

**Product Validation (Partial Success):**
- If `nm_id` not found in product catalog → return error in results array
- If `sa_name` provided and doesn't match catalog → warning in results array

**Duplicate Handling:**
- If COGS for `(nm_id, valid_from)` already exists → **UPDATE** existing record
- Increment `version` number
- Set `updated_at` timestamp

**Authorization:**
- User must have access to `cabinet_id` from JWT claims
- Reject with HTTP 403 if cabinet not in user's `cabinet_ids`

---

## Performance Requirements

| Endpoint | p50 | p95 | p99 | Notes |
|----------|-----|-----|-----|-------|
| `POST /v1/cogs/bulk` | < 500ms | < 2s | < 5s | For 100 products |
| `GET /v1/products` | < 200ms | < 500ms | < 1s | For 50 products per page |
| `GET /v1/cogs` | < 100ms | < 300ms | < 500ms | For 1-10 products |

**Bulk Upload Limits:**
- Maximum 1000 products per request
- Batch processing recommended for 100+ products
- Progress tracking via async job (optional, for Phase 2)

**Indexing Requirements:**
- Primary: `cogs(nm_id, valid_from, valid_to)` for temporal queries
- Secondary: `cogs(nm_id) WHERE valid_to IS NULL` for current COGS
- Full-text: `products(sa_name)` for search functionality

---

## Error Handling & Edge Cases

### Edge Case 1: Product Not in Catalog

**Scenario:** User uploads COGS for `nm_id = 99999999` that doesn't exist in product catalog

**Expected Behavior:**
- Return partial success response
- Include error in `results` array: `PRODUCT_NOT_FOUND`
- Do NOT create COGS record for non-existent product
- Log warning for monitoring

### Edge Case 2: Overlapping COGS Dates

**Scenario:** User uploads COGS with `valid_from = 2025-11-15`, but existing COGS has `valid_from = 2025-11-01, valid_to = NULL`

**Expected Behavior:**
1. Close existing COGS: `valid_to = 2025-11-14` (day before new COGS)
2. Create new COGS: `valid_from = 2025-11-15, valid_to = NULL`
3. Increment version number

### Edge Case 3: Zero COGS

**Scenario:** User uploads COGS with `unit_cost = 0` (free promotional products)

**Expected Behavior:**
- Allow `unit_cost = 0` (valid business case)
- Margin calculation: `margin_pct = 100%` (revenue - 0 cogs)
- Set `missing_cogs_flag = false` (COGS IS assigned, just zero)

### Edge Case 4: Concurrent Updates

**Scenario:** Two users update same product's COGS simultaneously

**Expected Behavior:**
- Use database transaction isolation
- Last write wins (optimistic locking)
- Optional: Return HTTP 409 if `version` mismatch (pessimistic locking)

---

## API Integration Examples

### Frontend Hook (Story 4.2 - Bulk Upload)

```typescript
// src/hooks/useCogsBulkUpload.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface CogsAssignment {
  nm_id: number;
  sa_name?: string;
  unit_cost: number;
  valid_from: string;
}

interface BulkCogsUploadRequest {
  assignments: CogsAssignment[];
  source?: string;
}

export function useCogsBulkUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BulkCogsUploadRequest) => {
      const response = await apiClient.post('/v1/cogs/bulk', request);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate product list to refresh COGS status
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Invalidate analytics to refresh margin calculations
      queryClient.invalidateQueries({ queryKey: ['analytics'] });

      console.log(`✅ COGS uploaded: ${data.succeeded} succeeded, ${data.failed} failed`);
    },
    onError: (error) => {
      console.error('❌ COGS upload failed:', error);
    },
  });
}
```

### Frontend Hook (Story 4.1 - Product List)

```typescript
// src/hooks/useProducts.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ProductFilters {
  hasCogs?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await apiClient.get('/v1/products', {
        params: filters,
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 300000,   // 5 minutes
  });
}
```

---

## Testing Requirements

### Unit Tests (Backend)

**COGS Service:**
- ✅ Test bulk upload with valid data
- ✅ Test validation errors (negative cost, invalid dates)
- ✅ Test product not found error
- ✅ Test duplicate COGS update (version increment)
- ✅ Test temporal versioning (close old, create new)
- ✅ Test concurrent updates (transaction isolation)

**Product Service:**
- ✅ Test product listing with filters
- ✅ Test search functionality (nm_id, sa_name)
- ✅ Test pagination (page, limit)
- ✅ Test `hasCogs` filter accuracy

### Integration Tests

**E2E Flow:**
1. Upload COGS via `POST /v1/cogs/bulk`
2. Verify product list shows `has_cogs = true`
3. Retrieve COGS via `GET /v1/cogs`
4. Query Epic 17 analytics with `includeCogs=true`
5. Verify margin calculations populated

**Performance Tests:**
- Bulk upload 1000 products: p95 < 5s
- Product list 10k catalog: p95 < 500ms
- COGS retrieval 100 products: p95 < 300ms

---

## Migration & Rollout Plan

### Phase 1: Database Schema (Week 1)

**Tasks:**
1. Create `cogs` table with temporal versioning
2. Add indexes for performance
3. Seed initial COGS data (if available)
4. Test migration on staging environment

**Prisma Migration Example:**
```typescript
// prisma/migrations/XXX_create_cogs_table/migration.sql
CREATE TABLE cogs (
  id SERIAL PRIMARY KEY,
  nm_id BIGINT NOT NULL,
  sa_name VARCHAR(500),
  unit_cost DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'RUB',
  valid_from DATE NOT NULL,
  valid_to DATE,
  version INTEGER NOT NULL DEFAULT 1,
  source VARCHAR(50) DEFAULT 'manual_upload',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cogs_nm_id_valid ON cogs(nm_id, valid_from, valid_to);
CREATE INDEX idx_cogs_current ON cogs(nm_id) WHERE valid_to IS NULL;
```

### Phase 2: API Implementation (Week 2-3)

**Tasks:**
1. Implement `POST /v1/cogs/bulk` endpoint
2. Implement `GET /v1/products` endpoint
3. Implement `GET /v1/cogs` endpoint
4. Add validation and error handling
5. Write unit tests (target: 80% coverage)

### Phase 3: Epic 17 Integration (Week 3)

**Tasks:**
1. Update Epic 17 analytics to use temporal COGS
2. Test margin calculations with real COGS data
3. Verify `missing_cogs_flag` accuracy

### Phase 4: Frontend Integration (Week 4)

**Tasks:**
1. Frontend implements Stories 4.1, 4.2, 4.3
2. E2E testing of COGS upload workflow
3. UAT with business users

---

## Success Criteria

### Functional Requirements ✅

- [ ] `POST /v1/cogs/bulk` accepts 1-1000 products per request
- [ ] Temporal versioning works correctly (history preserved)
- [ ] `GET /v1/products` returns paginated product catalog
- [ ] `hasCogs` filter accurately reflects COGS status
- [ ] Product search works for `nm_id` and `sa_name`
- [ ] Epic 17 analytics use temporal COGS for margin calculations
- [ ] Partial success responses include detailed error information
- [ ] All validation rules enforced correctly

### Performance Requirements ⚡

- [ ] Bulk upload 100 products: p95 < 2s
- [ ] Product list 50 products: p95 < 500ms
- [ ] COGS retrieval: p95 < 300ms
- [ ] Database indexes provide <100ms query times

### Quality Requirements 🎯

- [ ] Unit test coverage: >= 80%
- [ ] Integration tests cover E2E COGS workflow
- [ ] API documentation in Swagger/OpenAPI
- [ ] Error messages in Russian (user-facing)
- [ ] Logging for all COGS mutations (audit trail)

---

## Documentation Requirements

**Required Deliverables:**

1. **Swagger/OpenAPI Spec** for all 3 endpoints
2. **Database Schema Documentation** with temporal versioning examples
3. **Integration Guide** for Epic 17 analytics
4. **Error Code Reference** with user-facing messages (Russian)
5. **Performance Benchmarks** from load testing

**Update Existing Docs:**
- `docs/architecture/08-rest-api-spec.md` - Add COGS endpoints
- `docs/architecture/09-database-schema.md` - Add `cogs` table
- Backend `README.md` - Add Epic 18 to features list

---

## Open Questions for Backend Team

1. **Product Catalog Source:**
   - Does `products` table already exist?
   - Or should we source from `wb_finance_raw` (distinct `nm_id`, `sa_name`)?
   - Recommendation: Dedicated `products` table for better performance

2. **Async Processing:**
   - Should bulk uploads >1000 products use background jobs (BullMQ)?
   - Or is synchronous processing sufficient for MVP?
   - Recommendation: Synchronous for MVP, async for Phase 2

3. **COGS Deletion:**
   - Should we support `DELETE /v1/cogs/{cogs_id}`?
   - Or soft-delete with `valid_to = today`?
   - Recommendation: Soft-delete for audit trail

4. **Multi-Currency:**
   - MVP supports only RUB, but schema allows `currency` field
   - Future requirement for USD, EUR, CNY?
   - Recommendation: Implement for future-proofing

---

## Contact & Coordination

**Frontend Team:**
- Product Owner: Sarah (r2d2@example.com)
- Lead Developer: [Frontend Dev Name]

**Backend Team:**
- Architect: [Backend Architect Name]
- API Developer: [API Dev Name]

**Meetings:**
- Weekly sync: Fridays 10:00 MSK
- Slack channel: `#epic-18-cogs-api`
- Epic tracking: GitHub Project "Epic 18"

---

## Appendix: Related Documentation

**Epic 17 (COGS Analytics - Deployed):**
- `docs/request-backend/07-cogs-margin-analytics-includecogs-parameter.md`
- `docs/request-backend/08-epic-17-documentation-navigation.md`

**Epic 10 (COGS Database Schema - Deployed):**
- `docs/stories/epic-10/STORY-10.4-COMPLETION-SUMMARY.md`
- Schema: `cogs` table with temporal versioning

**Epic 4 (Frontend Stories - Blocked):**
- `docs/stories/4.1.single-product-cogs-assignment.md`
- `docs/stories/4.2.bulk-cogs-assignment.md`
- `docs/stories/4.3.cogs-input-validation-error-handling.md`

**Backend Reference:**
- `/backend/docs/stories/epic-17/` - Epic 17 implementation details
- `/backend/test-api/` - API testing examples (см. SECTION-MAPPING.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** 🔴 Awaiting Backend Review
