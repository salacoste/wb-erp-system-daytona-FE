# Epic 33-FE: Advertising Analytics (Frontend)

## Overview

Frontend implementation for Epic 33 - Advertising Analytics. Backend API is complete (Request #71).

**Business Value**: Sellers can analyze advertising campaign performance, track ROAS/ROI metrics, identify profitable and unprofitable campaigns, and optimize ad spend.

## Stories

### MVP Stories

| Story | Title | Priority | Points | Status | Sprint |
|-------|-------|----------|--------|--------|--------|
| [33.1-fe](story-33.1-fe-types-api-client.md) | TypeScript Types & API Client | High | 3 | ✅ Done | 1 |
| [33.2-fe](story-33.2-fe-page-layout.md) | Advertising Analytics Page Layout | High | 5 | ✅ Done | 1 |
| [33.3-fe](story-33.3-fe-metrics-table.md) | Performance Metrics Table | High | 5 | ✅ Done | 1 |
| [33.4-fe](story-33.4-fe-efficiency-indicators.md) | Efficiency Status Indicators | High | 3 | ✅ Done | 1 |
| [33.5-fe](story-33.5-fe-campaign-list.md) | Campaign List & Filtering | Medium | 3 | ✅ Done | 2 |
| [33.6-fe](story-33.6-fe-sync-status.md) | Sync Status Display | Low | 2 | ✅ Done | 3 |
| [33.7-fe](story-33.7-fe-dashboard-widget.md) | Dashboard Widget | Medium | 3 | ✅ Done | 2 |
| [33.8-fe](story-33.8-fe-integration-testing.md) | Integration Testing | Low | 2 | ✅ Done | 3 |

**MVP Points**: 26 | **Status**: ✅ **COMPLETE** (2025-12-22)

## Sprint Plan (Updated after PO Review)

| Sprint | Stories | Points | Focus |
|--------|---------|--------|-------|
| Sprint 1 | 33.1, 33.2, 33.3, **33.4** | **16** | Core page + efficiency badges |
| Sprint 2 | 33.5, 33.7 | 6 | Filtering + dashboard widget |
| Sprint 3 | 33.6, 33.8 | 4 | Polish + testing |

**Note**: Story 33.4-fe moved to Sprint 1 (BLOCKER resolved - EfficiencyBadge required by 33.3-fe table)

## Dependencies

- **Backend**: Epic 33 complete (Request #71)
- **API Documentation**: `docs/request-backend/71-advertising-analytics-epic-33.md`
- **Existing Components**: DatePicker, Table, Chart (Recharts), Badge

---

## PO Decisions (2025-12-22)

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Dashboard Widget in MVP? | ✅ **YES** | 3 points, high value, API ready |
| 2 | Sparkline Chart in Widget | ❌ DEFER | Adds complexity, not critical |
| 3 | Export (CSV/Excel) | ❌ DEFER | 3-5 extra points, post-MVP |
| 4 | Loss Campaign Alerts (>3d) | ❌ DEFER | Needs notification infra |
| 5 | Campaign Actions (pause/resume) | ❌ DEFER | Needs new API, risky |
| 6 | **Default View Mode** | **SKU** | Most granular, per-product focus |
| 7 | **Default Sort Order** | **Spend DESC** | "Where am I spending most?" |
| 8 | **Default Date Range** | **14 days** | Standard two-week period |

---

## UX Decisions (2025-12-22)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| UX-1 | Sidebar Icon | **Megaphone** | More recognizable for advertising |
| UX-2 | Date Picker Style | **Separate From/To inputs** | Consistent with other analytics pages |
| UX-3 | View Mode Toggle | **Tabs** | Existing pattern in project |
| UX-4 | Table Row Density | **Comfortable** | Better readability, fewer eye strain |
| UX-5 | Negative Values | **Red with minus (-800₽)** | Standard RU accounting convention |
| UX-6 | ROAS/ROI Trend Chart | **DEFER** | PO decision: adds complexity |
| UX-7 | Mobile Table Layout | **Horizontal scroll** | Simpler, consistent with other tables |
| UX-8 | Empty State Design | **Standard text + icon** | Use existing pattern with FileX icon |
| UX-9 | Loss Alert Position | **Above table** | Immediately visible, actionable |
| UX-10 | Tooltip Delay | **Standard 300ms** | Consistent with UI library defaults |
| UX-11 | Dashboard Widget Size | **Standard card** | Fits existing dashboard grid

---

## Design Reference

```
+-----------------------------------------------------------------------+
| Рекламная аналитика                                   [Sync: Healthy] |
| Главная > Аналитика > Реклама                                         |
+-----------------------------------------------------------------------+
| Период: [2025-12-08] - [2025-12-21]   View: [SKU|Campaign|Brand|Cat]  |
| Эффективность: [Все ▼]    Кампании: [Все кампании ▼]                  |
+-----------------------------------------------------------------------+
| +----------------+ +----------------+ +----------------+ +------------+|
| | 125,000 ₽      | | 3.6x          | | +46%           | | 8 / 10     ||
| | Затраты        | | Общий ROAS    | | Общий ROI     | | Кампаний   ||
| +----------------+ +----------------+ +----------------+ +------------+|
+-----------------------------------------------------------------------+
| ⚠️ 3 товара с отрицательной эффективностью (ROAS < 1.0)  [Показать]   |
+-----------------------------------------------------------------------+
| Эффективность рекламы                      Sort: [Затраты ▼]          |
| +------+----------+--------+--------+------+------+------+----------+ |
| | SKU  | Название | Затраты| Выручка| ROAS | ROI  | CTR  | Статус   | |
| +------+----------+--------+--------+------+------+------+----------+ |
| | 123  | Товар А  | 5,000₽ | 18,000₽| 3.6x | +46% | 3.0% | [Хорошо] | |
| | 456  | Товар Б  | 3,000₽ | 2,500₽ | 0.8x | -27% | 1.2% | [Убыток] | |
| | 789  | Товар В  | 1,000₽ | -      | -    | -    | 0.5% | [Нет дан]| |
| +------+----------+--------+--------+------+------+------+----------+ |
|                                      [< Назад] Стр. 1 из 5 [Вперёд >] |
+-----------------------------------------------------------------------+
```

## Navigation

- **Route**: `/analytics/advertising`
- **Sidebar**: Under "Аналитика" section (after "Хранение")
- **Icon**: `Megaphone` (Lucide)

## API Endpoints Used

| Endpoint | Story | Pagination |
|----------|-------|------------|
| `GET /v1/analytics/advertising` | 33.1, 33.3 | **Offset-based** |
| `GET /v1/analytics/advertising/campaigns` | 33.1, 33.5 | Offset-based |
| `GET /v1/analytics/advertising/sync-status` | 33.1, 33.6 | N/A |

## Key Metrics & Formulas

| Metric | Formula | Good Threshold |
|--------|---------|----------------|
| **ROAS** | `revenue / spend` | >= 3.0 |
| **ROI** | `(profit - spend) / spend` | >= 0.5 (50%) |
| **CTR** | `(clicks / views) * 100` | >= 2.0% |
| **CPC** | `spend / clicks` | Lower is better |
| **Conversion Rate** | `(orders / clicks) * 100` | >= 3.0% |

## Efficiency Status Colors & Display

| Status | ROAS | ROI | Color | Badge | Display when |
|--------|------|-----|-------|-------|--------------|
| `excellent` | >= 5.0 | >= 1.0 | Green | "Отлично" | All metrics available |
| `good` | 3.0 - 5.0 | 0.5 - 1.0 | Light Green | "Хорошо" | All metrics available |
| `moderate` | 2.0 - 3.0 | 0.2 - 0.5 | Yellow | "Умеренно" | All metrics available |
| `poor` | 1.0 - 2.0 | 0 - 0.2 | Orange | "Слабо" | All metrics available |
| `loss` | < 1.0 | < 0 | Red | "Убыток" | All metrics available |
| `unknown` | N/A | N/A | Gray | "Нет данных" | **No profit data** |

### Handling 'unknown' Status

When `efficiency_status === 'unknown'`:
- Show "—" (dash) for ROAS, ROI, Profit columns
- Show gray badge "Нет данных"
- Tooltip: "Нет данных о прибыли для расчёта эффективности"
- Still show: Spend, Revenue, CTR, CPC (if available)

## File Structure

```
src/
├── app/(dashboard)/analytics/advertising/
│   ├── page.tsx                           # Main page (33.2-fe)
│   ├── loading.tsx                        # Skeleton loader
│   ├── error.tsx                          # Error boundary
│   └── components/
│       ├── AdvertisingPageHeader.tsx      # Title + breadcrumbs + sync
│       ├── AdvertisingFilters.tsx         # Date range + view + efficiency
│       ├── AdvertisingSummaryCards.tsx    # 4 metric cards
│       ├── PerformanceMetricsTable.tsx    # Main data table (33.3-fe)
│       ├── EfficiencyBadge.tsx            # Status badge (33.4-fe)
│       ├── EfficiencyAlertBanner.tsx      # Loss alert (33.4-fe)
│       ├── CampaignSelector.tsx           # Campaign filter (33.5-fe)
│       └── SyncStatusIndicator.tsx        # Sync health (33.6-fe)
├── components/custom/
│   └── AdvertisingDashboardWidget.tsx     # Dashboard widget (33.7-fe)
├── types/
│   └── advertising-analytics.ts           # Types (33.1-fe)
├── lib/
│   ├── api/
│   │   └── advertising-analytics.ts       # API client (33.1-fe)
│   ├── efficiency-utils.ts                # Status utilities (33.4-fe)
│   └── campaign-utils.ts                  # Campaign utilities (33.5-fe)
└── hooks/
    └── useAdvertisingAnalytics.ts         # React Query hooks (33.1-fe)
```

## Accessibility Requirements (All Stories)

All component stories (33.2, 33.3, 33.4, 33.5, 33.6, 33.7) must include:

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Screen reader support (aria-labels)
- [ ] No color-only information (icons/text supplement colors)

## Error Handling

All error messages must be in Russian. Generic error format:
- 400: "Неверные параметры запроса"
- 401: "Требуется авторизация"
- 403: "Нет доступа к этому кабинету"
- 404: "Данные не найдены"
- 500: "Ошибка сервера. Попробуйте позже"

## Testing Strategy

- **Unit Tests**: Vitest + React Testing Library
- **Test Location**: Colocated in `__tests__` folders
- **Coverage Target**: >80% for hooks, >70% for components
- **E2E Tests**: Optional for MVP (Playwright)

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-22 | James (Dev Agent) | Initial draft - 8 stories created |
| 2025-12-22 | Sarah (PO) | PO Review: decisions on defaults, MVP scope, gaps identified |
| 2025-12-22 | James (Dev Agent) | Updated stories with PO feedback, fixed BLOCKERs |
| 2025-12-22 | Sally (UX Expert) | UX Review: confirmed defaults |
| 2025-12-22 | Sarah (PO) | **Final approval - Ready for Development** |
| 2025-12-22 | Dev Team | **Implementation complete - all 8 stories DONE** |
| 2026-01-02 | PO Review | Documentation sync: updated status to COMPLETE |
