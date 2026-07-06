# Domain Features

The application is organized around Wildberries marketplace seller workflows. All protected routes live under the `(dashboard)` route group at `src/app/(dashboard)/`.

## Analytics Hub (`/analytics/*`)

The largest route tree in the application. Sub-routes include:

| Route | Purpose |
|-------|---------|
| `/analytics/dashboard` | Analytics overview dashboard |
| `/analytics/sku` | SKU-level margin analysis |
| `/analytics/brand` | Brand-level analytics |
| `/analytics/brand-share` | Brand market share |
| `/analytics/category` | Category analytics |
| `/analytics/time-period` | Time-period comparison |
| `/analytics/finance-history` | Financial history trends |
| `/analytics/storage` | Paid storage analytics |
| `/analytics/supply-planning` | Supply planning recommendations |
| `/analytics/unit-economics` | Unit economics waterfall + table |
| `/analytics/liquidity` | Liquidation planner |
| `/analytics/advertising` | Advertising campaigns + performance |
| `/analytics/orders` | Order seasonality, comparison, trends |
| `/analytics/funnel` | Funnel overlay chart + anomaly detection |
| `/analytics/buyout` / `buyout-reconciliation` | Buyout analytics |
| `/analytics/returns` | Returns analytics |
| `/analytics/acquiring` | Acquiring reports, periods, transactions |
| `/analytics/fbs-stock` / `fbs-enhanced` | FBS stock + analytics |
| `/analytics/reorder` | Reorder recommendations |
| `/analytics/search` | Search performance + positions |
| `/analytics/cross-reference` | Ad/organic overlap |
| `/analytics/alerts` | Alert rules CRUD |
| `/analytics/pricing` | Price elasticity analysis |
| `/analytics/forecast` | AI predictions |
| `/analytics/forecast-accuracy` | Forecast accuracy tracking |
| `/analytics/models` | AI model management |
| `/analytics/product/[nmId]` | Product detail by NM ID |
| `/analytics/ai-admin` | AI admin panel (models, preferences, anomalies) |

## COGS Management (`/cogs/*`)

Cost of goods sold management with **versioning**. Each COGS assignment is versioned and has history tracking.

| Route | Purpose |
|-------|---------|
| `/cogs` | Single product COGS assignment |
| `/cogs/bulk` | Bulk COGS assignment |
| `/cogs/history` | COGS version history |
| `/cogs/price-calculator` | Price calculator |

**Key patterns**: COGS forms (`SingleCogsForm`, `BulkCogsForm`), edit/delete dialogs, history tables. Business logic in `src/lib/` includes acceptance cost formulas (`acceptance-cost-formulas.ts`, `acceptance-cost-utils.ts`). COGS calculations often run asynchronously with polling (see `src/hooks/useCogsEdit.ts`, `useMarginPollingWithQuery.ts`).

## Orders (`/orders/*`)

| Route | Purpose |
|-------|---------|
| `/orders` | Order management |
| `/orders/fbo` | FBO orders & sales |
| `/orders/integrity` | Data reconciliation |

API modules: `src/lib/api/orders.ts`, `orders-analytics.ts`, `orders-fbo.ts`, `orders-history-api.ts`, `orders-integrity-api.ts`, `orders-volume.ts`, `orders-actions.ts`.

## Supplies & Shipments

### Supplies (`/supplies/*`)
Supply shipments with detail pages at `/supplies/[id]`. Background processing with polling (`useSupplyPolling.ts`).

### Shipments (`/shipments/*`)
FBS shipments with sub-routes for box types and SKU packaging:
| Route | Purpose |
|-------|---------|
| `/shipments` | Shipment list |
| `/shipments/[id]` | Shipment detail |
| `/shipments/box-types` | Box type management |
| `/shipments/sku-packaging` | SKU packaging config |

## Products (`/products`)
Assortment management. Product lifecycle analytics in `src/lib/api/product-lifecycle-api.ts` and `unified-product-analytics.ts`.

## Margin Analytics

Cross-cutting feature with components and hooks throughout:
- By SKU: `useMarginAnalyticsBySku.ts`, `MarginBySkuTable.tsx`
- By Brand: `useMarginAnalyticsByBrand.ts`, `MarginByBrandTable.tsx`
- By Category: `MarginByCategoryTable.tsx`
- Trends: `useMarginTrends.ts`, `MarginTrendChart.tsx`
- Helpers: `src/lib/margin-helpers.ts`, `theoretical-profit.ts`, `roi-profit-utils.ts`

## Telegram Notifications (`/settings/notifications`)

Full notification preference system:
- Notification preferences panel
- Telegram binding (card + modal)
- Quiet hours configuration
- Event type selection
- Language and timezone settings

API: `src/lib/api/notifications.ts` + `notifications-normalizer.ts`. Hooks: `useNotificationPreferences.ts`, `useTelegramBinding.ts`, `useOrderNotificationSettings.ts`, `useQuietHours.ts`. Components in `src/components/notifications/` (17 files).

## AI / Forecast

AI-powered features:
- Forecast predictions (`/analytics/forecast`)
- Forecast accuracy tracking (`/analytics/forecast-accuracy`)
- Model management (`/analytics/models`, including evaluations and performance sub-routes)
- AI admin panel (`/analytics/ai-admin`)

API: `src/lib/api/ai/`, `ai-forecast-api.ts`. Hooks: `useAiForecast.ts`, `useAiEvaluations.ts`, `useAiModels.ts`, `useTrainAiModel.ts`, `useAiStatus.ts`.

## Supply Planning & Unit Economics

- **Supply planning** (`/analytics/supply-planning`): Reorder velocity calculations in `src/lib/supply-planning-reorder-velocity.ts`, config in `supply-planning-config.ts`.
- **Unit economics** (`/analytics/unit-economics`): Waterfall chart + table. Logic in `src/lib/unit-economics-utils.ts`, `unit-economics-config.ts`, `unit-economics-analysis.ts`.
- **Liquidity** (`/analytics/liquidity`): Liquidation planner with action benchmarks in `src/lib/liquidity-action-benchmark.ts`.

## Settings (`/settings/*`)

| Route | Purpose |
|-------|---------|
| `/settings` | Settings home |
| `/settings/cabinet` | Cabinet management |
| `/settings/notifications` | Telegram notification preferences |
| `/settings/expenses` | Expense configuration |
| `/settings/tariffs` | Tariff management |
| `/settings/tax` | Tax settings |
| `/settings/backfill` | Historical data backfill |

Settings has its own sub-layout at `src/app/(dashboard)/settings/layout.tsx`.

## Integrations

### Moysklad (`/moysklad`)
МойСклад integration. API: `src/lib/api/moysklad.ts`, `moysklad-products.ts`, `moysklad-stock.ts`, `moysklad-variants.ts`. Hooks: `useMoysklad.ts`, `useMoyskladQueries.ts`, `useMoyskladSync.ts`.

### Automation (`/automation/*`)
Automation rules engine with canned rules at `/automation/canned-rules`.

### Monitoring
- `/monitor` — KPI monitoring dashboard
- `/monitoring` — Data pipeline health

## Key Domain Source References

| Domain | API Module | Key Components |
|--------|-----------|----------------|
| Analytics | `src/lib/api/analytics-comparison.ts`, `funnel-analytics.ts`, etc. | `src/components/analytics/` |
| COGS | `src/lib/api/cogs.ts` | `src/components/custom/single-cogs/`, `bulk-cogs/` |
| Orders | `src/lib/api/orders*.ts` | `src/components/custom/orders/` |
| Supplies | `src/lib/api/supplies.ts` | `src/components/custom/supplies/` |
| Shipments | `src/lib/api/` shipment modules | `src/components/custom/shipments/` |
| Notifications | `src/lib/api/notifications.ts` | `src/components/notifications/` |
| AI/Forecast | `src/lib/api/ai/` | `src/components/custom/ai/` |
| Moysklad | `src/lib/api/moysklad*.ts` | — |
