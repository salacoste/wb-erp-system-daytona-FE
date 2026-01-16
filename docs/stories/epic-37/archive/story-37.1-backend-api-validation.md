# Story 37.1: Backend API Validation

**Epic**: Epic 37 - Merged Group Table Display (Склейки)
**Status**: 📋 Draft - Awaiting PO Validation
**Effort**: 1-2 hours
**Priority**: High (Blocker for 37.2-37.4)
**Assignee**: [TO BE ASSIGNED - Frontend Dev]

---

## 🎯 User Story

**As a** frontend developer
**I want** to verify the backend API returns both aggregate and individual metrics for merged groups
**So that** I can confidently build the MergedGroupTable component with correct data structure

---

## 📋 Acceptance Criteria

### API Response Structure
- [ ] `GET /v1/analytics/advertising?group_by=imtId` returns successful 200 response
- [ ] Response includes both aggregate metrics and individual product metrics
- [ ] Each group has `imtId` field matching products within that group
- [ ] Main product correctly identified (spend > 0)
- [ ] Child products correctly identified (spend = 0)

### Epic 35 Field Validation
- [ ] Aggregate level includes: `totalSales`, `revenue`, `organicSales`, `organicContribution`
- [ ] Individual product level includes: `totalSales`, `revenue`, `organicSales`, `organicContribution`
- [ ] Percentage calculations correct: `organicContribution = (organicSales / totalSales) × 100`
- [ ] ROAS calculation correct: `roas = revenue / spend` (handle spend=0 case)

### Data Integrity Checks
- [ ] Aggregate `totalSales` equals SUM of individual `totalSales`
- [ ] Aggregate `revenue` equals SUM of individual `revenue`
- [ ] Aggregate `spend` equals SUM of individual `spend`
- [ ] No missing or null values for required fields

### [PO TO FILL] Additional Requirements
- [ ] [PO TO SPECIFY] Minimum/maximum group size expectations
- [ ] [PO TO SPECIFY] Sorting order of products within group
- [ ] [PO TO SPECIFY] Handling of standalone products (imtId = null)
- [ ] [PO TO SPECIFY] Response pagination strategy for large datasets

---

## 🔍 Technical Details

### API Endpoint
```
GET /v1/analytics/advertising?group_by=imtId&cabinet_id=1
```

### Expected Response Structure (Draft)
```typescript
{
  "data": [
    {
      // Aggregate-level metrics (склейка totals)
      "imtId": 328632,
      "mainProduct": {
        "nmId": "ter-09",
        "name": "Product Name"
      },
      "productCount": 6,
      "aggregateMetrics": {
        "totalSales": 35570,      // Epic 35 field
        "revenue": 10234,          // Epic 35 field
        "organicSales": 25336,     // Epic 35 field
        "organicContribution": 71.2, // Percentage
        "spend": 11337,
        "roas": 0.90
      },

      // Individual product metrics (per-SKU breakdown)
      "products": [
        {
          "nmId": "ter-09",
          "imtId": 328632,
          "isMainProduct": true,
          "totalSales": 15000,
          "revenue": 4000,
          "organicSales": 11000,
          "organicContribution": 73.3,
          "spend": 6000,
          "roas": 0.67
        },
        {
          "nmId": "ter-10",
          "imtId": 328632,
          "isMainProduct": false,
          "totalSales": 1489,
          "revenue": 400,
          "organicSales": 1089,
          "organicContribution": 73.1,
          "spend": 0,
          "roas": null  // N/A for child products
        }
        // ... 4 more products
      ]
    }
    // ... more groups
  ]
}
```

### Validation Tests (Manual)

**Test 1: Aggregate Summation**
```typescript
const group = response.data[0];
const individualTotal = group.products.reduce((sum, p) => sum + p.totalSales, 0);
expect(group.aggregateMetrics.totalSales).toBe(individualTotal);
```

**Test 2: Main Product Identification**
```typescript
const mainProducts = group.products.filter(p => p.isMainProduct);
expect(mainProducts.length).toBe(1);
expect(mainProducts[0].spend).toBeGreaterThan(0);
```

**Test 3: Epic 35 Calculation**
```typescript
const product = group.products[0];
const calculatedOrganic = product.totalSales - product.revenue;
expect(product.organicSales).toBe(calculatedOrganic);
```

---

## 📊 Test Scenarios

### Scenario 1: Normal Group (6 products)
**Input**: `group_by=imtId`, group with 1 main + 5 child products
**Expected**:
- Aggregate metrics present and correct
- All 6 products listed in `products[]` array
- Main product has `isMainProduct: true`, `spend > 0`
- Child products have `isMainProduct: false`, `spend = 0`

### Scenario 2: Single-Product Group
**Input**: `group_by=imtId`, standalone product with `imtId = null`
**Expected**:
- [PO TO FILL] Should standalone products appear in response?
- [PO TO FILL] If yes, what structure? (group of 1, or filtered out?)

### Scenario 3: Large Group (>10 products)
**Input**: `group_by=imtId`, group with 15+ products
**Expected**:
- [PO TO FILL] Response includes all products, or paginated?
- [PO TO FILL] Frontend component collapse/expand strategy

---

## 🐛 Edge Cases

### Edge Case 1: Zero Spend
**Scenario**: All products in group have `spend = 0`
**Expected Behavior**: [PO TO FILL]
- ROAS calculation: Show "N/A" or hide column?
- Main product identification: How to determine without spend signal?

### Edge Case 2: Negative Revenue
**Scenario**: Returns exceed sales, `revenue < 0`
**Expected Behavior**: [PO TO FILL]
- Display negative values as-is, or flag with warning?
- ROAS calculation: Handle negative numerator?

### Edge Case 3: Missing Epic 35 Fields
**Scenario**: Backend returns `null` for `organicSales` due to data gap
**Expected Behavior**: [PO TO FILL]
- Show placeholder text ("Нет данных")?
- Hide entire row?
- Disable group view mode?

---

## ✅ Definition of Done

- [ ] API response structure documented in this story
- [ ] Manual validation tests passed (all 3 tests above)
- [ ] Test scenarios executed (all 3 scenarios)
- [ ] Edge cases documented with PO decisions
- [ ] Response sample saved in `docs/stories/epic-37/api-response-sample.json`
- [ ] Slack message to PO confirming API readiness
- [ ] Story 37.2 can start (no blockers)

---

## 📎 References

- **Epic 36 Backend**: `docs/epics/epic-36-product-card-linking.md` - imtId implementation
- **Epic 35 API**: `frontend/docs/request-backend/77-total-sales-organic-ad-split.md` - Field definitions
- **Current API**: `frontend/src/app/(dashboard)/analytics/advertising/page.tsx:85-90` - Existing fetch logic
- **Backend Controller**: `backend/src/modules/analytics/advertising.controller.ts` - [VERIFY PATH]

---

## 🎯 Next Steps

1. **Frontend dev**: Execute validation tests against `http://localhost:3000/v1/analytics/advertising?group_by=imtId`
2. **Document findings**: Update this story with actual response structure
3. **Flag discrepancies**: If API doesn't match expected structure, create backend bug ticket
4. **PO review**: Fill in [PO TO FILL] sections with decisions
5. **Mark complete**: When all ACs pass, move to Story 37.2

---

**Story Owner**: [TO BE ASSIGNED]
**Created**: 2025-12-29
**Last Updated**: 2025-12-29
