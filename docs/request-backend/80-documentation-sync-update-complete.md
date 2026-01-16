# Request #80: Documentation Sync Update - Epic 33 Complete ✅

**Date**: 2025-12-27
**Status**: ✅ COMPLETE
**Priority**: INFO
**Type**: Documentation Update

---

## 📋 Summary

Вся backend документация проверена, обновлена и синхронизирована с последними изменениями Epic 33 (Advertising Analytics), включая критические bugfixes и troubleshooting guides для проблем с синхронизацией.

**Проверенные директории**:
- ✅ `@docs/` - Main documentation
- ✅ `@docs/stories/` - Story-specific docs
- ✅ `@README.md` - Project README
- ✅ `@test-api/` - API testing examples

---

## 🎯 Key Updates

### 1. Token Security & Sync Troubleshooting

**Новые guides созданы**:
- `docs/ADVERTISING-SYNC-TROUBLESHOOTING.md` - Операционное руководство по диагностике sync проблем
- `docs/SYNC-FAILURE-ROOT-CAUSE-ANALYSIS.md` - Анализ проблемы с token encryption (AES-256-GCM)

**Обновлена главная документация**:
- `docs/ADVERTISING-ANALYTICS-GUIDE.md` (v1.5, 2025-12-27):
  - Добавлен раздел **Token Security & Encryption** (lines 448-480)
  - Добавлен раздел **Sync Issues & Token Problems** (lines 1867-1931)
  - Ссылки на troubleshooting guides

**Проблема**: Только 2 campaigns в DB вместо 259 из WB API
**Причина**: Token encrypted with AES-256-CBC (2 parts) instead of AES-256-GCM (3 parts)
**Решение**: `scripts/fix-token-encryption.ts` + Redis cache clear + PM2 restart
**Результат**: ✅ 78/78 Type 9 campaigns synced successfully

---

### 2. Campaign Placements Field (Story 33.9)

**Status**: ✅ QA APPROVED (Quality Score: 100/100)

**New Field**: `placements` object в campaign response
```typescript
{
  "placements": {
    "search": true,           // Campaign active in Search
    "recommendations": false, // Campaign NOT in Recommendations
    "carousel": true          // Campaign active in Carousel (optional)
  }
}
```

**Important Notes**:
- ✅ **Type 9 campaigns**: `placements` object from WB API
- ✅ **Legacy campaigns (types 4-8)**: `placements: null`
- ✅ Frontend contract: `frontend/docs/request-backend/79-placement-field-campaign-data.md`

**Updated Files**:
- ✅ `docs/API-PATHS-REFERENCE.md` (lines 1135-1151)
- ✅ `test-api/07-advertising-analytics.http` (lines 285-292, 356-433)

---

### 3. Advertising Analytics Complete Reference

**Main Endpoint**: `GET /v1/analytics/advertising`

**Documented Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Start date (YYYY-MM-DD) ✅ |
| `to` | string | End date (YYYY-MM-DD) ✅ |
| `view_by` | enum | `sku`, `campaign`, `brand`, `category` ✅ |
| `sort_by` | enum | `spend`, `revenue`, `roas`, `roi`, `orders`, etc. ✅ |
| `sort_order` | enum | `asc`, `desc` ✅ |
| `limit` | number | 1-500, default 50 ✅ |
| `offset` | number | Pagination offset ✅ |
| `campaign_ids` | string | Comma-separated campaign IDs ✅ |
| `sku_ids` | string | Comma-separated SKU IDs ✅ |
| `efficiency_filter` | enum | `all`, `excellent`, `good`, `moderate`, `poor`, `loss`, `unknown` ✅ |

**Response Fields** (fully documented):
```typescript
{
  items: [{
    key: string;              // "sku:147205694" or "campaign:12345"
    label: string;            // Product name or campaign name
    nmId?: number;            // For SKU view
    advertId?: number;        // For campaign view
    brand?: string;           // For SKU view
    category?: string;        // For SKU view

    // Performance Metrics ✅
    views: number;
    clicks: number;
    orders: number;
    spend: number;
    revenue: number;          // Ad-attributed revenue (WB API orderSum)
    profit: number;
    profitAfterAds: number;   // profit - spend

    // Calculated Metrics ✅
    ctr: number;              // (clicks / views) × 100
    cpc: number;              // spend / clicks
    conversionRate: number;   // (orders / clicks) × 100
    roas: number;             // revenue / spend
    roi: number;              // (profit - spend) / spend

    // Epic 35: Organic vs Advertising Split ✅
    totalSales: number;       // Total revenue (organic + advertising)
    organicSales: number;     // totalSales - revenue
    organicContribution: number; // (organicSales / totalSales) × 100

    // Efficiency Classification ✅
    efficiency: {
      status: "excellent" | "good" | "moderate" | "poor" | "loss" | "unknown";
      recommendation: string | null;
    };
  }],

  summary: {
    totalSpend: number;
    totalRevenue: number;
    totalProfit: number;
    totalProfitAfterAds: number;
    totalViews: number;
    totalClicks: number;
    totalOrders: number;
    avgRoas: number;
    avgRoi: number;
    avgCtr: number;
    avgCpc: number;
    avgConversionRate: number;

    // Epic 35 Fields ✅
    totalSales: number;
    totalOrganicSales: number;
    avgOrganicContribution: number;
  },

  query: { from, to, viewBy, sortBy, sortOrder, limit, offset },
  pagination: { total, limit, offset, hasMore },
  cachedAt: string
}
```

---

### 4. Campaigns Endpoint

**Endpoint**: `GET /v1/analytics/advertising/campaigns`

**Response Fields** (fully documented):
```typescript
{
  campaigns: [{
    id: string;               // UUID
    advertId: number;         // WB campaign ID
    name: string;
    type: number;             // 4-9 (WB campaign types)
    typeLabel: string;        // "unified", "auto", "search", etc.
    status: number;           // 4,7,8,9,11 (WB campaign statuses)
    statusLabel: string;      // "active", "paused", "ended", etc.
    nmIds: number[];          // Product IDs in campaign
    productsCount: number;    // Count of products
    budget: number;
    dailyBudget: number;
    startDate: string;
    endDate: string;

    // ✅ NEW - Story 33.9 (Type 9 only)
    placements: {
      search: boolean;
      recommendations: boolean;
      carousel?: boolean;     // Optional
    } | null,                 // null for legacy campaigns (types 4-8)

    createdAt: string;
    updatedAt: string;
  }],
  total: number,
  limit: number,
  offset: number
}
```

**Filters**:
- `status` - Filter by campaign status (9=active, 11=paused, etc.)
- `type` - Filter by campaign type (9=unified, 8=auto, etc.)
- `search` - Search by campaign name (case-insensitive)
- `limit`, `offset` - Pagination

---

### 5. Sync Status Endpoint

**Endpoint**: `GET /v1/analytics/advertising/sync-status`

**Response**:
```typescript
{
  status: "completed" | "syncing" | "failed" | "idle";
  lastSyncAt: string;
  nextScheduledSync: string;
  campaignsSynced: number;
  dataAvailableFrom: string;
  dataAvailableTo: string;
  lastTask: {
    taskId: string;
    status: string;
    startedAt: string;
    finishedAt: string;
    error: string | null;
  }
}
```

**Schedule**: Daily 07:00 MSK (04:00 UTC)

---

## 📚 Documentation References

### Main Documentation
| Document | Path | Version | Updated |
|----------|------|---------|---------|
| **Advertising Guide** | `docs/ADVERTISING-ANALYTICS-GUIDE.md` | v1.5 | 2025-12-27 ✅ |
| **API Reference** | `docs/API-PATHS-REFERENCE.md` | - | 2025-12-18 ✅ |
| **README** | `README.md` | - | ✅ Current |

### Troubleshooting Guides
| Guide | Path | Purpose |
|-------|------|---------|
| **Sync Troubleshooting** | `docs/ADVERTISING-SYNC-TROUBLESHOOTING.md` | Quick diagnostics, fixes ✅ |
| **Root Cause Analysis** | `docs/SYNC-FAILURE-ROOT-CAUSE-ANALYSIS.md` | Token encryption deep dive ✅ |

### Story Documentation
| Story | Path | Status |
|-------|------|--------|
| **Story 33.9** | `docs/stories/epic-33/33.9.campaign-placement-field.md` | ✅ QA APPROVED |
| **Story 35.7** | `docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md` | ✅ Complete |

### Frontend Contracts
| Request | Path | Topic |
|---------|------|-------|
| **Request #76** | `frontend/docs/request-backend/76-efficiency-filter-not-implemented-backend.md` | Efficiency filter ✅ |
| **Request #77** | `frontend/docs/request-backend/77-roi-calculation-validation-backend.md` | ROI bug (known issue) |
| **Request #79** | `frontend/docs/request-backend/79-placement-field-campaign-data.md` | Placements field ✅ |

### Test Examples
| File | Path | Coverage |
|------|------|----------|
| **Test API** | `test-api/07-advertising-analytics.http` | 45+ examples ✅ |

---

## ✅ Bug Fixes

### Request #77: Profit Multiplication Bug - FIXED (2025-12-27)

**Status**: ✅ **RESOLVED** - Profit deduplication implemented with comprehensive tests

**Problem (Before Fix)**:
- SKUs advertised in multiple campaigns had profit multiplied by campaign count
- SKU `193775258` in 2 campaigns: returned `-9,566.34₽` instead of `-4,783.17₽` (2× actual)

**Solution Implemented**:
- Added nmId tracking per grouping key in `mergeData()`
- Profit/totalSales now counted only ONCE per unique nmId
- Works correctly for all view modes (sku, campaign, brand, category)

**Test Coverage**:
- 5 comprehensive unit tests added (lines 1075-1259)
- 100% coverage of deduplication logic
- Tests verify: 2 campaigns, 3 campaigns, brand aggregation, single-campaign regression

**Frontend Impact**:
- ✅ `profit` values will DECREASE for multi-campaign SKUs (become accurate)
- ✅ `roi` values will improve (less negative)
- ✅ `efficiency.status` may improve (loss → moderate/poor)
- ⚠️ **Expected Changes**: SKUs with N campaigns will show profit = 1/N of previous value

**No Breaking Changes**:
- Response structure identical
- Field names unchanged
- Only VALUES corrected

**Reference**: `frontend/docs/request-backend/77-roi-calculation-validation-backend.md` (updated)

---

## ✅ Validation Checklist

### Structure Completeness
- ✅ All input parameters documented
- ✅ All output fields documented
- ✅ All methods documented with examples
- ✅ Error cases covered (400, 401, 403, 404)
- ✅ Pagination, sorting, filtering described

### Recent Changes
- ✅ Token encryption troubleshooting documented
- ✅ Campaign placements field (Story 33.9) documented
- ✅ Epic 35 organic/advertising split documented
- ✅ Sync failure root cause analysis documented
- ✅ Test examples updated with latest changes

### Cross-References
- ✅ Links between documents verified
- ✅ API reference matches implementation
- ✅ Test examples match API spec
- ✅ Frontend contracts aligned with backend

---

## 🚀 Frontend Integration Checklist

### Campaign Placements (Story 33.9)
```typescript
// ✅ READY - Use placements field for Type 9 campaigns
const searchCampaigns = campaigns.filter(c =>
  c.type === 9 && c.placements?.search === true
);

const recoCampaigns = campaigns.filter(c =>
  c.type === 9 && c.placements?.recommendations === true
);

// ⚠️ Legacy campaigns (types 4-8) have placements = null
const legacyCampaigns = campaigns.filter(c =>
  c.type <= 8 && c.placements === null
);
```

### Organic vs Advertising Split (Epic 35)
```typescript
// ✅ READY - totalSales, organicSales, organicContribution fields available
const organicPercentage = item.organicContribution; // e.g., 36.44%
const adAttributedRevenue = item.revenue;           // from WB API
const totalRevenue = item.totalSales;               // organic + advertising
```

### Efficiency Filter (Request #76)
```typescript
// ✅ READY - efficiency_filter query parameter
const lossmakers = await api.get('/v1/analytics/advertising', {
  params: {
    from: '2025-12-01',
    to: '2025-12-21',
    efficiency_filter: 'loss' // excellent, good, moderate, poor, loss, unknown
  }
});
```

---

## 🔗 Quick Links

### Endpoints
- `GET /v1/analytics/advertising` - Main analytics
- `GET /v1/analytics/advertising/campaigns` - Campaign list
- `GET /v1/analytics/advertising/sync-status` - Sync status

### Documentation
- Main: `docs/ADVERTISING-ANALYTICS-GUIDE.md`
- API: `docs/API-PATHS-REFERENCE.md`
- Tests: `test-api/07-advertising-analytics.http`

### Troubleshooting
- Sync issues: `docs/ADVERTISING-SYNC-TROUBLESHOOTING.md`
- Token problems: `docs/SYNC-FAILURE-ROOT-CAUSE-ANALYSIS.md`

---

## 📊 Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Documentation** | ✅ Complete | All files updated |
| **API Reference** | ✅ Complete | Full parameter/response docs |
| **Test Examples** | ✅ Complete | 45+ test cases |
| **Troubleshooting** | ✅ Complete | 2 new guides created |
| **Frontend Contracts** | ✅ Complete | Request #76, #77, #79 |
| **Bug Fixes** | ✅ Complete | Request #77 profit bug FIXED |
| **Unit Tests** | ✅ Complete | 5 new tests for Request #77 |

---

**Ready for Frontend Integration**: ✅ YES

**What Changed (2025-12-27)**:
1. ✅ **Request #77 FIXED**: Profit deduplication implemented
2. ✅ **Test Coverage**: 5 comprehensive unit tests added
3. ✅ **Documentation Updated**: All docs reflect bugfix status
4. ⚠️ **Frontend Note**: Profit values will change (become more accurate) after deployment

**Next Steps**:
1. Review placements field implementation (Story 33.9)
2. Implement organic/advertising split UI (Epic 35)
3. Add efficiency filter to campaign management (Request #76)
4. ~~Handle profit multiplication bug workaround (Request #77)~~ ✅ FIXED - no workaround needed

---

**Document Version**: 1.1 (Updated: Request #77 Fix)
**Last Updated**: 2025-12-27
**Backend Status**: ✅ PRODUCTION READY (with Request #77 fix)
**Epic 33 Status**: ✅ 100% Complete (Phase 1-4)
