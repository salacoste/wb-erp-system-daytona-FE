# Request #209: Per-Keyword Ad Spend Reporting

**Date**: 2026-06-05
**Origin**: Epic 121-FE (Advertising + Search Cross-Analysis, Story 121.1-FE)
**Priority**: P3
**Status**: Open

## Problem

Currently, advertising analytics data is aggregated per SKU/campaign. There is no endpoint that returns ad spend, clicks, or impressions broken down by **search query/keyword**. This prevents keyword-level cross-analysis between organic search and paid advertising.

## Current Behavior

- `GET /v1/analytics/advertising` returns: spend, clicks, orders, revenue per SKU or campaign
- WB Promotion API `fullstats` endpoint returns: stats per campaign per day per app — NOT per search query
- Frontend can correlate at **product level** (organic contribution vs ad spend per nmId) but NOT at keyword level

## Desired Behavior

A new endpoint (or extended `fullstats` response) that provides:
- Ad spend per search query/keyword within a campaign
- Clicks, impressions, CTR per keyword
- Date range filtering
- Campaign filtering

## Impact

- **Story 121.1-FE** (Keyword Overlap Analysis) is BLOCKED by this gap
- Marketing Plan §3.6.1 (Ad Keyword vs Organic Keyword Overlap) cannot be fully implemented
- Without this, sellers cannot identify which keywords they're paying for that already rank organically

## Frontend Consumers

- `/analytics/cross-reference` — "Overlap" tab (Story 121.1-FE, DEFERRED)
- Cross-reference page would join this data with `GET /v1/analytics/search/by-query` (organic position per keyword)

## Workaround

Product-level scatter plot (Story 121.2-FE, SHIPPED) provides a coarser analysis using `organicContribution` from advertising data. This is a useful proxy but does not provide keyword-level granularity.
