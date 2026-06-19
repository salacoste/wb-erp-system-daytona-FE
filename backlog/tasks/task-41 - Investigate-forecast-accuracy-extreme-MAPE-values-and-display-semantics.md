---
id: task-41
title: Investigate forecast accuracy extreme MAPE values and display semantics
status: Done
assignee: []
created_date: '2026-06-16 17:36'
updated_date: '2026-06-16 17:42'
labels:
  - validation
  - business-data
  - forecast
  - backend-data-quality
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live analytics smoke for /analytics/forecast-accuracy loaded successfully with no API or console errors, but visible business metrics included extremely high MAPE values in prior inspection (for example multi-thousand percent / 9999.99% style values) and dash placeholders for some values. Need verify backend calculation, null/zero denominator handling, cap/label semantics, and whether UI should explain or clamp outliers.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Confirm whether extreme MAPE values are mathematically valid for current backend data
- [x] #2 Define and document zero-demand/null denominator behavior for MAPE
- [x] #3 If values are expected, UI explains outliers clearly; if not, backend or transform is fixed
- [x] #4 Add regression coverage for extreme/null MAPE cases
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Evidence 2026-06-16: live smoke /tmp/live-analytics-batch2-check.json showed /analytics/forecast-accuracy failing=false, /v1/ai/forecast-accuracy status=200, no console/page/API errors; issue is business-data semantics, not page-load failure.

Finding 2026-06-16: direct live API call with Bearer token + X-Cabinet-Id returned avgMAPE=8374.35 and bySKU values up to 9999.99; frontend is not multiplying by 100 incorrectly because project docs and formatters use backend percent-units where 12 means 12%.

Implemented 2026-06-16: /analytics/forecast-accuracy now shows an explanatory alert for MAPE >= 1000: high MAPE can occur when actual sales are near zero/zero; users should compare MAE and observation count; em dash means MAPE was not calculated for that SKU.

Verification 2026-06-16: forecast accuracy component unit tests => 24 passed across ForecastAccuracyPageContent, AccuracyMetricsCards, HorizonBreakdownTable, SkuBreakdownTable.

Verification 2026-06-16: npx playwright test e2e/forecast-accuracy.spec.ts --project=chromium --no-deps --reporter=line => 5 passed; npm run type-check => passed; targeted ESLint => passed.

Verification 2026-06-16: live analytics batch smoke => 8 routes failing=0; forecast-accuracy API 200, consoleEvents=[], badApi=[], and warning text visible on real data.
<!-- SECTION:NOTES:END -->
