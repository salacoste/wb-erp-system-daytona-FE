# Epic 57: REST API Controller Missing - Frontend Team Notice

**Created**: 2026-01-30
**Priority**: P0 - BLOCKING
**Epic**: 57 - FBS Analytics Enhancement

---

## Issue

Epic 57 services are fully implemented but **NOT exposed via REST API endpoints**.

## Impact

Frontend team CANNOT access:
- Stock by product groups
- Stock by sizes
- Regional warehouse analytics
- Warehouse remains CSV export
- Enhanced FBS order statistics

## Services Ready (No API Layer)

| Service | File | Status |
|---------|------|--------|
| WarehouseRemainsService | src/analytics/services/warehouse-remains.service.ts | ✅ Complete |
| RegionalStockService | src/analytics/services/regional-stock.service.ts | ✅ Complete |
| FbsAnalyticsAggregationService | src/analytics/services/fbs-analytics-aggregation.service.ts | ✅ Complete |

## Required Endpoints (Per Epic 57 Spec)

```
GET  /v1/analytics/fbs/stock/groups
GET  /v1/analytics/fbs/stock/sizes
GET  /v1/analytics/fbs/stock/regions
POST /v1/analytics/fbs/stock/export
GET  /v1/analytics/fbs/stock/export/:exportId
GET  /v1/analytics/fbs/stock/export/:exportId/download
GET  /v1/analytics/orders/enhanced
```

## Action Required

Backend team must create `FbsAnalyticsController` to expose these services.

---

## Service API Signatures

### WarehouseRemainsService

```typescript
// Create export task
async createWarehouseRemainsTask(cabinetId: string, options?: CreateTaskOptions): Promise<TaskCreationResult>

// Get task status
async getTaskStatus(cabinetId: string, taskId: string): Promise<TaskStatusResult>

// Download CSV result
async downloadTaskResult(cabinetId: string, taskId: string): Promise<WarehouseRemainsResult>

// Wait for completion (polling helper)
async waitForTaskCompletion(cabinetId: string, taskId: string, timeoutMs?: number): Promise<TaskStatusResult>
```

### RegionalStockService

```typescript
// Stock by office/warehouse
async getStocksByOffice(cabinetId: string, period: { begin: string; end: string }, nmIds?: number[]): Promise<StockAggregationResult>

// Stock by region (aggregated from offices)
async getStocksByRegion(cabinetId: string, period: { begin: string; end: string }): Promise<StockAggregationResult>
```

### FbsAnalyticsAggregationService

```typescript
// Aggregate all FBS analytics
async aggregateFbsAnalytics(cabinetId: string, period: AggregationPeriod): Promise<FbsAggregatedAnalytics>

// Invalidate cache
async invalidateCache(cabinetId: string): Promise<void>
```

---

## Proposed Controller Structure

```typescript
@ApiTags('Analytics - FBS Stock')
@ApiBearerAuth()
@Controller('v1/analytics/fbs')
@UseGuards(JwtAuthGuard, CabinetGuard)
export class FbsAnalyticsController {
  constructor(
    private readonly warehouseRemains: WarehouseRemainsService,
    private readonly regionalStock: RegionalStockService,
    private readonly aggregation: FbsAnalyticsAggregationService,
  ) {}

  // Stock endpoints
  @Get('stock/groups')
  async getStockByGroups() { }

  @Get('stock/sizes')
  async getStockBySizes() { }

  @Get('stock/regions')
  async getRegionalStock() { }

  // Export endpoints
  @Post('stock/export')
  async createExport() { }

  @Get('stock/export/:exportId')
  async getExportStatus() { }

  @Get('stock/export/:exportId/download')
  async downloadExport() { }

  // Enhanced analytics
  @Get('orders/enhanced')
  async getEnhancedAnalytics() { }
}
```

---

## Related Documentation

- [Epic 57 Full Report](../frontend/docs/request-backend/112-epic-57-fbs-analytics-validation-report.md)
- [Epic 57 Specification](../../docs/epics/epic-57-fbs-analytics-enhancement.md)
