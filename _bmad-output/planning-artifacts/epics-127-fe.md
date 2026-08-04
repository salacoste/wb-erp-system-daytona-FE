# Epic 127-FE: Marketing Phase 3 Gap Fixes

**Priority**: P1 (Product Value)
**Complexity**: ~25-30 SP
**Status**: done
**Created**: 2026-06-07
**Delivered status reconciled**: 2026-08-03
**Source**: Epic 124-FE retro A-5 + Marketing Analytics Product Plan §4

## Context

At creation time, the shipped marketing analytics routes still lacked the Phase 3
features below. All six stories are now delivered; this section preserves the
historical creation context rather than describing current gaps:

- Buyout and Returns daily time-series charts
- Comparison periods (WoW/MoM) for Advertising, Buyout, and Returns
- Cross-page navigation between buyout and returns

Reusable infrastructure already exists:

- `ComparisonPeriodSelector` component (generic, supports previous/custom)
- `comparison-period-utils.ts` (`calculatePreviousPeriod()`)
- `SummaryComparison` delta display component
- Funnel page WoW pattern as reference implementation

## Delivered Coverage by Page

| Page            | Time Series     | Comparison | Notes                                                  |
| --------------- | --------------- | ---------- | ------------------------------------------------------ |
| Funnel          | ✅              | ✅ WoW     | Reference implementation                               |
| Advertising     | ✅ Daily trends | ✅         | Comparison selector and deltas delivered               |
| Search          | ✅ Daily orders | ❌         | Lower priority                                         |
| Buyout          | ✅ Daily trends | ✅         | Daily endpoint, chart, comparison, and links delivered |
| Returns         | ✅ Daily trends | ✅         | Daily endpoint, chart, comparison, and links delivered |
| Cross-Reference | N/A (scatter)   | N/A        | Done                                                   |
| Unified Product | ✅              | N/A        | Done                                                   |

## Stories

### Story 127.1: Buyout Time Series Chart (~5 SP)

- **Status:** done
- Delivered `GET /v1/analytics/buyout/daily` through `src/lib/api/buyout-daily.ts`
  and `src/hooks/use-buyout-daily.ts`, with boundary normalization, fixtures,
  `BuyoutTrendChart.tsx`, page integration, and targeted tests.

### Story 127.2: Returns Time Series Chart (~5 SP)

- **Status:** done
- Delivered `GET /v1/analytics/returns/daily` through `src/lib/api/returns-daily.ts`
  and `src/hooks/use-returns-daily.ts`, with boundary normalization, fixtures,
  `ReturnTrendChart.tsx`, page integration, and targeted tests.

### Story 127.3: Advertising Comparison Period (~5 SP)

- **Status:** done
- `ComparisonPeriodSelector` and comparison deltas are integrated in the
  advertising page.

### Story 127.4: Buyout Comparison Period (~5 SP)

- **Status:** done
- `ComparisonPeriodSelector` and buyout comparison utilities are integrated in
  `BuyoutPageContent` and covered by component/unit tests.

### Story 127.5: Returns Comparison Period (~5 SP)

- **Status:** done
- `ComparisonPeriodSelector`, returns comparison utilities, and delta summary
  rendering are integrated and tested.

### Story 127.6: Buyout-Return Cross-Link (~3 SP)

- **Status:** done
- Buyout rows link to filtered returns and returns rows link to filtered buyout;
  both tables also retain product-analytics navigation.

## Acceptance Criteria

- [x] AC-1: Buyout page has a daily trend chart
- [x] AC-2: Returns page has a daily trend chart
- [x] AC-3: Advertising, Buyout, Returns pages support comparison periods
- [x] AC-4: All new components have unit tests
- [x] AC-5: Targeted Epic 127 tests and current repository quality gates pass

## Dependencies

- Resolved: backend daily-granularity contracts are live at
  `GET /v1/analytics/buyout/daily` and `GET /v1/analytics/returns/daily`.
- Comparison-period infrastructure was reused without additional backend work.
