# Backend Request #150: Monitoring Dashboard — False Critical Alarms

**Date**: 2026-02-17
**Priority**: High
**Epic**: 67 (Pipeline Health Dashboard)
**Reporter**: Frontend team (UX validation)

---

## Problem

The monitoring dashboard (`GET /v1/monitoring/dashboard`) reports **false critical/no_data statuses** for 3 out of 4 high-frequency pipelines and 1 data completeness table, despite the actual data flowing correctly on the backend.

### Affected Pipelines

| Pipeline | Reported Status | lastSuccessAt | successRate24h | Actual State |
|----------|----------------|---------------|----------------|--------------|
| **FBO Продажи** | `critical` | `null` | `0` | Data flows correctly |
| **Поставки** | `critical` | `null` | `0` | Data flows correctly |
| **FBO Заказы** | `no_data` | `null` | `0` | Data flows correctly |
| FBS Заказы | `healthy` | `2026-02-17T19:40:00` | `1` | Correct |

### Affected Data Completeness

| Table | Reported Ratio | Reported Status | Actual State |
|-------|---------------|-----------------|--------------|
| **weekly_payout_summary** | `0` | `critical` | Financial data IS imported |
| inventory_snapshots | `0.71` | `incomplete` | Needs verification |

### Health Score Contradiction

- `system.overallStatus = "healthy"` with `healthScore = 83`
- But 3 out of 4 high-frequency pipelines show `critical` or `no_data`
- `system.activeAlerts = 0` despite 3 broken pipelines
- Health widget message "Все источники работают исправно" contradicts pipeline grid

---

## Root Cause Hypothesis

---

## Backend Team Response

**Status**: RESOLVED
**Resolution date**: 2026-05-06 (confirmed in #170 backend update)
**Summary**: Fixed with StaleTaskReaperService (Post-Fix #150). The service automatically cancels stuck tasks: `in_progress` tasks exceeding `timeout_seconds * 2` are failed, `pending` tasks older than 2 hours are cancelled. This eliminates the false critical alarms that were caused by zombie tasks in the pipeline.
**Remaining frontend action**: None - monitoring dashboard no longer generates false alarms.
1. **Pipeline execution tracking gap**: FBO Продажи, Поставки, and FBO Заказы may not have entries in `task_execution_log` (or equivalent) because they use a different execution path not instrumented by the monitoring system.

2. **Health score calculation ignores critical pipelines**: The `healthScore: 83` and `overallStatus: "healthy"` appear to be calculated from only the pipelines that DO have execution data (daily + weekly), ignoring the high-frequency ones with `null` lastSuccess.

3. **weekly_payout_summary completeness**: The completeness check may query the wrong table or use incorrect date range for detecting weekly payout data.

---

## Impact

- **Users see false alarms**: Business owners see "Критично" for pipelines that work fine → loss of trust in the monitoring system
- **Contradictory information**: Health score says "healthy" while pipeline cards show "critical" → confusing UX
- **Noise drowns signal**: Real problems will be hidden among false alarms

---

## Expected Behavior

1. All pipelines that actually process data should show `status: "healthy"` with correct `lastSuccessAt` and `successRate24h`
2. `overallStatus` and `healthScore` should account for ALL pipeline statuses (including high-frequency)
3. `activeAlerts` should be non-zero when pipelines are critical
4. `weekly_payout_summary` completeness should reflect actual data presence

---

## API Response (Raw)

```json
{
  "system": {
    "overallStatus": "healthy",
    "healthScore": 83,
    "activeAlerts": 0,
    "lastReportDate": "2026-02-16"
  },
  "pipelines": [
    { "name": "FBO Заказы", "status": "no_data", "lastSuccess": null, "successRate24h": 0 },
    { "name": "FBO Продажи", "status": "critical", "lastSuccess": null, "successRate24h": 0 },
    { "name": "FBS Заказы", "status": "healthy", "lastSuccess": "2026-02-17T19:40:00", "successRate24h": 1 },
    { "name": "Поставки", "status": "critical", "lastSuccess": null, "successRate24h": 0 }
  ],
  "dataCompleteness": {
    "overallHealth": "degraded",
    "tables": [
      { "table": "weekly_payout_summary", "completenessRatio": 0, "status": "critical" }
    ]
  }
}
```

---

## Resolution Required

**Backend team** needs to:
1. Instrument FBO Продажи, Поставки, FBO Заказы pipeline executions in the monitoring system
2. Fix health score calculation to account for all pipeline statuses
3. Set `activeAlerts > 0` when any pipeline is critical
4. Fix `weekly_payout_summary` completeness detection
5. Ensure `overallStatus` reflects the worst pipeline status (e.g., "degraded" if any pipeline is critical)
