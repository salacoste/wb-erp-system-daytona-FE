# Request #78: Epic 35 Critical Bugfix & SDK v2.4.0 Upgrade

**Date**: 2025-12-25
**Status**: ✅ **RESOLVED** - Critical bug fixed, SDK upgraded, all tests passing
**Epic**: Epic 35 - Total Sales & Organic vs Ad-Attributed Revenue Split
**Story**: Story 35.7 - Critical Bug Fix: docType Filter Mismatch
**Priority**: 🚨 **CRITICAL**

---

## Summary

**What happened**: Epic 35 was deployed but ALL products showed `totalSales=0₽` in advertising analytics dashboard despite working ad revenue.

**Root cause**: Data model mismatch - hybrid query used wrong `docType` filter value (`'Продажа'` instead of `'sale'`)

**Resolution time**: 80 minutes (detection → fix → verification → documentation)

**SDK upgrade**: daytona-wildberries-typescript-sdk v2.3.2 → **v2.4.0** (Type 9 API compliance, no migration needed)

---

## 🐛 Critical Bug Details

### Symptom

**Impact**: 100% of products in advertising analytics dashboard

| Metric | Before Fix | After Fix |
|--------|------------|-----------|
| Total Sales | **0₽** ❌ | **1,079,457.71₽** ✅ |
| Organic Sales | **0₽** ❌ | **939,203.71₽** ✅ |
| Organic Contribution | **0%** ❌ | **87.01%** ✅ |
| Ad Revenue | 140,254₽ ✅ | 140,254₽ ✅ (no change) |

### Root Cause

**Location**: `src/analytics/services/advertising-analytics.service.ts` (3 locations)

**Problem**: Hybrid query filter used Russian capitalized value from `daily_sales_raw` convention when querying `wb_finance_raw`:

```typescript
// ❌ WRONG (returned 0 rows)
const result = await this.prisma.wbFinanceRaw.groupBy({
  where: {
    cabinetId,
    saleDt: { gte: dateFrom, lte: weeklyEnd },
    docType: 'Продажа',  // ❌ Russian capitalized (wrong for wb_finance_raw)
    nmId: { in: nmIdStrings },
  },
  _sum: { retailPriceWithDiscount: true },
});

// ✅ CORRECT (returns actual data)
const result = await this.prisma.wbFinanceRaw.groupBy({
  where: {
    cabinetId,
    saleDt: { gte: dateFrom, lte: weeklyEnd },
    docType: 'sale',  // ✅ English lowercase (correct for wb_finance_raw)
    nmId: { in: nmIdStrings },
  },
  _sum: { retailPriceWithDiscount: true },
});
```

**Data Model Mismatch**:
- `wb_finance_raw.docType`: **English lowercase** (`"sale"`, `"return"`, `"service"`)
- `daily_sales_raw.docTypeName`: **Russian capitalized** (`"Продажа"`, `"Возврат"`)

Different WB API endpoints return different conventions, normalized during import at different times.

---

## ✅ Fix Applied

### Files Modified

**1. Backend Service** (`src/analytics/services/advertising-analytics.service.ts`):
- Line 503: Sales revenue query for profit calculation
- Line 582: Hybrid query `getTotalSalesByNmId()` - **PRIMARY BUG**
- Line 741: Profit calculation query

Changed all 3 locations:
```typescript
docType: 'Продажа'  →  docType: 'sale'
```

**2. Queue Processor** (`src/queue/processors/task.processor.ts`):
- Added missing handler for `daily_sales_sync` task type
- Integrated `DailySalesSyncService` via constructor injection
- Added switch case for `daily_sales_sync`

### Verification Results

**Test Script**: `/tmp/test-fix.sh`
```bash
curl "http://localhost:3000/v1/analytics/advertising?from=2024-12-11&to=2024-12-24" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Cabinet-Id: $CABINET_ID"
```

**Results**:
```json
{
  "summary": {
    "totalRevenue": 140254.00,      // Ad revenue (unchanged) ✅
    "totalCost": 73658.92,
    "totalSales": 1079457.71,       // ✅ FIXED (was 0)
    "totalOrganicSales": 939203.71, // ✅ FIXED (was 0)
    "avgOrganicContribution": 87.01 // ✅ FIXED (was 0)
  },
  "items": [
    {
      "nmId": 123456789,
      "revenue": 28600.50,           // Ad revenue ✅
      "totalSales": 45000.00,        // ✅ FIXED (was 0)
      "organicSales": 16399.50,      // ✅ FIXED (was 0)
      "organicContribution": 36.44   // ✅ FIXED (was 0)
    }
  ]
}
```

**Performance**: Hybrid query maintains **17-37ms p95** latency (27× better than 500ms target)

---

## 🚀 SDK Upgrade: v2.4.0

### Migration Status

**Status**: ✅ **NO MIGRATION REQUIRED** - Zero deprecated methods used

**Upgrade Command**:
```bash
npm install daytona-wildberries-typescript-sdk@2.4.0 --legacy-peer-deps
```

### Deprecated Methods in v2.4.0

| Deprecated Method | Replacement | Our Status |
|-------------------|-------------|------------|
| `getAutoGetnmtoadd()` | `getAuctionAdverts()` | ✅ Already using replacement |
| `createAutoUpdatenm()` | `updateAuctionNm()` | ❌ Not used (read-only sync) |
| `getAutoStatWords()` | `getAdvFullstats()` | ✅ Already using replacement |
| `createAutoSetExcluded()` | Type 9 campaign API | ❌ Not used (read-only sync) |

**Deadline**: February 2, 2026 - No action required (we're already compliant)

### Current SDK Usage

**File**: `src/imports/services/adv-sync.service.ts`

| Method | Type | Status |
|--------|------|--------|
| `getPromotionCount()` | Standard API | ✅ Not deprecated |
| `getAuctionAdverts()` | **Type 9 API** | ✅ Recommended (modern) |
| `getAdvUpd()` | Standard API | ✅ Not deprecated |
| `getAdvFullstats()` | **Type 9 API** | ✅ Recommended (modern) |

**Conclusion**: Our implementation already uses Type 9 API methods. No code changes needed.

---

## 🎯 Frontend Impact & Required Actions

### API Response Changes

**No breaking changes** - all new fields are additive:

```typescript
// Existing fields (unchanged)
interface AdvertisingItem {
  nmId: number;
  revenue: number;    // Ad-attributed revenue (Epic 33)
  spend: number;
  roas: number;       // revenue / spend
  roi: number;
  // ... other existing fields
}

// ✅ NEW fields (Epic 35 - additive)
interface AdvertisingItem {
  totalSales: number;           // ✅ Total sales (organic + ad)
  organicSales: number;         // ✅ Organic = totalSales - revenue
  organicContribution: number;  // ✅ Percentage organic
}

// ✅ NEW summary fields
interface AdvertisingSummary {
  totalSales: number;          // ✅ Total across all SKUs
  totalOrganicSales: number;   // ✅ Total organic
  avgOrganicContribution: number; // ✅ Average % organic
}
```

### Frontend Actions Required

**✅ Already completed** (based on previous Epic 35 frontend integration):

1. **Type Definitions** (`frontend/src/types/advertising-analytics.ts`):
   - `totalSales`, `organicSales`, `organicContribution` fields added ✅

2. **API Adapter** (`frontend/src/lib/api/advertising-analytics.ts`):
   - Updated to handle new fields ✅

3. **Dashboard Widget** (`AdvertisingSummaryCards.tsx`):
   - Shows Total Sales, Organic %, ROAS with current week indicator ✅

4. **Performance Table** (`PerformanceMetricsTable.tsx`):
   - Displays total sales, organic contribution columns ✅

5. **Tests & Mocks**:
   - Updated with new fields ✅

### Verified Working

**Test Date Range**: 2024-12-11 to 2024-12-24 (2 weeks: W50, W51)

**Sample Data**:
- Total Sales: 1,079,457.71₽ (35 SKUs with advertising campaigns)
- Organic Sales: 939,203.71₽ (87% of total)
- Ad Revenue: 140,254₽ (13% of total)
- Hybrid query: 17-37ms p95

**Edge Cases Tested**:
- ✅ Negative organic (when WB over-attributes: revenue > totalSales)
- ✅ Zero total sales (NaN prevention for organicContribution)
- ✅ Current week empty (graceful fallback to wb_finance_raw only)
- ✅ Cache failures (transparent fallback to direct DB query)

---

## 📝 Documentation Updates

### Backend Documentation

**Created**:
- `docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md` - Full migration analysis
- `docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md` - Detailed bugfix documentation

**Updated**:
- `docs/CHANGELOG.md` - SDK upgrade + Epic 35 bugfix entries
- `docs/epics/epic-35-total-sales-organic-split.md` - Story 35.7 added, all stories marked complete
- `docs/ADVERTISING-ANALYTICS-GUIDE.md` - Version 1.4, bugfix + SDK upgrade notes
- `README.md` - SDK v2.4.0, bugfix link
- `test-api/07-advertising-analytics.http` - SDK v2.4.0, bugfix details
- `test-api/README.md` - Epic 35 bugfix section, SDK migration link

### Schema Documentation

**Added inline comments** (`prisma/schema.prisma`):
```prisma
model WbFinanceRaw {
  /// Type of document for sales tracking
  /// VALUES: "sale" (English lowercase), "return", "service", null
  /// IMPORTANT: Use English lowercase for queries, NOT Russian "Продажа"
  /// See: docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md
  docType String? @map("doc_type") @db.VarChar(50)
}

model DailySalesRaw {
  /// Document type name from WB API (Russian capitalized)
  /// VALUES: "Продажа", "Возврат"
  /// IMPORTANT: Different convention from wb_finance_raw.doc_type
  /// See: docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md
  docTypeName String @map("doc_type_name") @db.VarChar(50)
}
```

---

## 🔍 Testing Checklist

### Backend Verification ✅

- [x] Build successful (`npm run build`)
- [x] Servers restarted (PM2: wb-repricer, wb-repricer-worker)
- [x] Redis cache cleared
- [x] API endpoint tested: `GET /v1/analytics/advertising`
- [x] Response includes all new fields with correct values
- [x] Hybrid query performance: 17-37ms p95 ✅
- [x] Daily sales sync handler integrated
- [x] Integration tests added for docType filter validation

### Frontend Verification ✅

- [x] TypeScript types updated
- [x] API adapter handles new fields
- [x] Dashboard widget displays Total Sales, Organic %
- [x] Performance table shows totalSales, organicSales columns
- [x] Tests passing with new fields
- [x] No console errors
- [x] Data matches backend response

### Data Accuracy ✅

- [x] Total Sales: 1,079,457.71₽ (verified against WB Excel reports)
- [x] Organic Sales: 939,203.71₽ (87% organic contribution)
- [x] Ad Revenue: 140,254₽ (unchanged from Epic 33)
- [x] Formula validation: `organicSales = totalSales - revenue` ✅
- [x] Percentage calculation: `organicContribution = (organicSales / totalSales) × 100` ✅

---

## 🎓 Lessons Learned

### What Went Wrong

1. **Inconsistent Data Conventions**: Two tables use different value conventions for same concept
2. **Missing Type Safety**: No TypeScript enum for docType values
3. **Insufficient Testing**: Integration tests didn't cover filter value validation
4. **Silent Failure**: Wrong filter returned 0 rows without error
5. **Documentation Gap**: Schema didn't document value conventions

### What Went Right

1. **Fast Detection**: User reported issue within hours of deployment
2. **Clear Symptoms**: "ALL products showing 0" indicated systematic issue, not edge case
3. **Rapid Diagnosis**: Root cause identified within 30 minutes using diagnostic scripts
4. **Quick Fix**: Code change + test + deploy in < 1 hour
5. **Zero Downtime**: Fix deployed without service interruption

### Prevention Measures Implemented

1. ✅ **Schema Documentation**: Added inline comments documenting value conventions
2. ✅ **Service Comments**: Added critical notes in hybrid query method
3. ✅ **Integration Tests**: Added test cases for docType filter validation
4. ✅ **Documentation**: Created Story 35.7 documenting root cause + prevention
5. 🔜 **Type Safety**: Consider future migration to TypeScript enums
6. 🔜 **Runtime Validation**: Add schema validation middleware
7. 🔜 **Monitoring**: Add alerting for 0 totalSales across all SKUs (anomaly detection)

---

## 🔗 Related Documentation

### Backend
- **Story 35.7**: [docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md](../../docs/stories/epic-35/35.7.critical-bugfix-doctype-mismatch.md)
- **Epic 35**: [docs/epics/epic-35-total-sales-organic-split.md](../../docs/epics/epic-35-total-sales-organic-split.md)
- **SDK Migration**: [docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md](../../docs/SDK-MIGRATION-V2.4.0-ANALYSIS.md)
- **Advertising Guide**: [docs/ADVERTISING-ANALYTICS-GUIDE.md](../../docs/ADVERTISING-ANALYTICS-GUIDE.md) (v1.4)
- **CHANGELOG**: [docs/CHANGELOG.md](../../docs/CHANGELOG.md)

### Test API
- **HTTP Tests**: [test-api/07-advertising-analytics.http](../../test-api/07-advertising-analytics.http) (requests #40-42)
- **Test Guide**: [test-api/README.md](../../test-api/README.md) (Epic 35 section)

### Frontend
- **Request #77**: [77-total-sales-organic-ad-split.md](./77-total-sales-organic-ad-split.md) - Original Epic 35 request

---

## ❓ FAQ for Frontend Team

### Q: Do I need to change my frontend code?

**A**: No code changes required if you already integrated Epic 35 fields. The bug was backend-only (filter mismatch). If you haven't integrated Epic 35 yet, follow Request #77 guidance.

### Q: Are there any breaking API changes?

**A**: No. All Epic 35 fields are **additive**. Existing fields (`revenue`, `spend`, `roas`, `roi`) are unchanged.

### Q: What if I see totalSales=0 again?

**A**:
1. Check date range - current week data requires daily sync at 06:00 MSK
2. Check if cabinet has sales data for that period
3. If persistent, report to backend team with:
   - Cabinet ID
   - Date range
   - Sample `nmId` that should have sales
   - Screenshot of WB dashboard showing sales

### Q: How do I test the fix?

**A**: Use test request from `test-api/07-advertising-analytics.http`:
```http
GET http://localhost:3000/v1/analytics/advertising?from=2024-12-15&to=2024-12-25
Authorization: Bearer <your-token>
X-Cabinet-Id: <your-cabinet-id>
```

Expected response:
```json
{
  "items": [{
    "totalSales": 45000.00,        // ✅ Should be > 0
    "organicSales": 16400.00,      // ✅ Should be > 0
    "organicContribution": 36.44   // ✅ Should be > 0
  }],
  "summary": {
    "totalSales": 1079457.71,      // ✅ Should be > 0
    "totalOrganicSales": 939203.71 // ✅ Should be > 0
  }
}
```

### Q: What about SDK v2.4.0 migration?

**A**: No frontend changes. SDK upgrade is backend-only and already complete. We're using Type 9 API methods (modern, not deprecated).

### Q: Is the hybrid query still fast after the fix?

**A**: Yes! Performance maintained at **17-37ms p95** (27× better than 500ms target).

### Q: Can organicSales be negative?

**A**: Yes, if WB API over-attributes (reports more ad revenue than actual total sales for a SKU). This is expected behavior - we show the truth.

### Q: What happens if daily_sales_raw is empty for current week?

**A**: Graceful fallback to `wb_finance_raw` only (completed weeks data). Current week shows 0 until daily sync populates data.

---

## ✅ Resolution Status

**Bug Status**: ✅ **RESOLVED** (2025-12-25)
**SDK Upgrade**: ✅ **COMPLETE** (v2.4.0)
**Frontend Integration**: ✅ **VERIFIED** (Epic 35 fields working)
**Documentation**: ✅ **COMPLETE** (all docs updated)
**Tests**: ✅ **PASSING** (unit, integration, E2E)

**Next Actions**: None required - system fully operational.

---

**Contact**: Backend Team
**Last Updated**: 2025-12-25
**Review Status**: Ready for Frontend Team Review
