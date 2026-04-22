---
id: task-12
title: 'Update Epic 90 + Request #166 — full 3-endpoint scope confirmed'
status: To Do
assignee: []
created_date: '2026-04-18 15:13'
updated_date: '2026-04-19 15:35'
labels:
  - epic-90
  - acquiring
  - unblocked
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Backend Epics 89-93 (2026-04-19): All 3 acquiring endpoints delivered per Request #166.

**RESOLVED (was task-14):** Backend confirmed full scope. No stories to drop.

Actions:
1. Update `docs/request-backend/166-ACQUIRING-COST-REPORTS-API.md` with actual response shapes from backend (see doc-2 section 3)
2. Update `_bmad-output/planning-artifacts/epics-90-fe.md` — remove BLOCKED status, update endpoint URLs to match backend delivery
3. Update sprint-status.yaml if any story keys changed
4. Update doc-1 (Monitor Dashboard spec) to note that acquiring data could optionally be shown in Monitor too

Response shapes confirmed (all snake_case, null-preserving):
- AcquiringReportListItem: report_id, seller_finance_name, date_from, date_to, create_date, currency, acquiring_fee_sum, acquiring_fee_vat_sum
- AcquiringReportDetailItem: rrd_id, report_id, acq_date, acquiring_bank, sale_date, srid, doc_type_name, nm_id, retail_amount, acquiring_fee, acquiring_fee_vat, currency

Source: Backend Epics 89-93, doc-2
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Request #166 doc updated with actual response shapes
- [ ] #2 Epic 90 planning artifact BLOCKED status removed
- [ ] #3 Sprint-status.yaml Epic 90 stories unchanged (full scope)
- [ ] #4 test-api/34-acquiring-analytics.http confirmed present
<!-- AC:END -->
