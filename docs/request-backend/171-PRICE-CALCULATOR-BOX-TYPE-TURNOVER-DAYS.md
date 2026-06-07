# Request #171: Price Calculator — Backend Support for box_type and turnover_days

## Problem

`box_type` (box/pallet) and `turnover_days` (storage duration) are computed entirely on the frontend. The price calculator API does not accept these fields, so the frontend calculates storage costs locally using warehouse tariff data. If the backend adds support, these fields could be sent in the API request for server-side validation and calculation.

## Current State

- **Frontend**: Fields exist in `FormData` and `PriceCalculatorRequest` types, annotated `@frontend-only NOT sent to API`
- **Frontend**: `toApiRequest()` in `priceCalculatorUtils.ts` intentionally excludes these fields
- **Backend**: Price calculator endpoint (`POST /v1/price-calculator/calculate`) does not process these fields

## Impact

Low — frontend calculation works correctly. Backend support would enable:
- Server-side validation of box_type against actual warehouse tariff schedules
- Server-side turnover_days factor in storage cost (currently frontend-only)

## Fix Scope

Backend only — add `box_type` and `turnover_days` as optional fields to the price calculator request DTO.

## Resolution

None yet -- aspirational. Frontend will send these fields once backend adds support.

---

## Backend Team Response

**Status**: RESOLVED (2026-06-06) — `turnover_days` now accepted in price calculator request; `box_type` remains shipment-cost module only (aspirational)
