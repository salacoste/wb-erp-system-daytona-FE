# Epic 42-FE: Task Handlers Adaptation

**Status**: 📋 Ready for Development
**Created**: 2026-01-06
**Backend Epic**: Epic 42 (Complete)

---

## Overview

Адаптация Frontend к изменениям backend Epic 42 (Technical Debt - Task Handlers).

**Key Change**: `enrich_cogs` task is **DEPRECATED** → use `recalculate_weekly_margin`

---

## Stories

| # | Story | Status | Points | Priority |
|---|-------|--------|--------|----------|
| 42.1-FE | [TypeScript Types Update](./story-42.1-fe-typescript-types-update.md) | 📋 Ready | 1 | Required |
| 42.2-FE | [Sanity Check Hook](./story-42.2-fe-sanity-check-hook.md) | 📋 Backlog | 2 | Optional |
| 42.3-FE | [Missing COGS Alert](./story-42.3-fe-missing-cogs-alert.md) | 📋 Backlog | 2 | Optional |
| 42.4-FE | [Documentation & Tests](./story-42.4-fe-documentation-tests.md) | 📋 Ready | 2 | Required |

**Total**: 7 points (3 required, 4 optional)

---

## Quick Reference

### Deprecated Task Type
```typescript
// ❌ DEPRECATED
task_type: 'enrich_cogs'

// ✅ USE INSTEAD
task_type: 'recalculate_weekly_margin'
```

### New Task Types
- `weekly_sanity_check` - Data quality validation
- `weekly_margin_aggregate` - Re-aggregation standalone

---

## Related Documentation

- **Epic Document**: [epic-42-fe-task-handlers-adaptation.md](../../epics/epic-42-fe-task-handlers-adaptation.md)
- **Backend Request**: [Request #94](../../request-backend/94-epic-42-tech-debt-task-handlers.md)
- **Current Hook**: [useManualMarginRecalculation.ts](../../../src/hooks/useManualMarginRecalculation.ts)

---

## Development Order

1. **Phase 1** (Required): Stories 42.1-FE + 42.4-FE (3 pts)
2. **Phase 2** (Optional): Stories 42.2-FE + 42.3-FE when data quality UI needed

---

*Last Updated: 2026-01-06*
