# Epic 42-FE: Task Handlers Adaptation

**Status**: 📋 Ready for Development
**Created**: 2026-01-06
**Backend Epic**: Epic 42 (Complete)
**Priority**: Low (backward compatible)
**Estimated Effort**: 5-8 story points total

---

## Executive Summary

Адаптация Frontend к изменениям backend Epic 42 (Technical Debt - Task Handlers). Backend deprecate'ировал `enrich_cogs` task в пользу `recalculate_weekly_margin` и добавил два новых task types: `weekly_margin_aggregate` и `weekly_sanity_check`.

**Ключевой факт**: Frontend уже использует `recalculate_weekly_margin` — изменения минимальны.

---

## Business Value

1. **Техническое соответствие**: Синхронизация типов с актуальным backend API
2. **Future-proofing**: Подготовка к возможному удалению deprecated `enrich_cogs`
3. **Новые возможности**: Data quality индикаторы (optional) улучшат UX

---

## Impact Analysis

### Текущее состояние (проверено 2026-01-06)

| Компонент | Использует | Статус |
|-----------|------------|--------|
| `useManualMarginRecalculation.ts` | `recalculate_weekly_margin` | ✅ Актуален |
| `src/types/api.ts` (Task.type) | `enrich_cogs` в union | ⚠️ Обновить |
| Прямые вызовы `enrich_cogs` | Не найдены | ✅ |

### Backward Compatibility

Backend поддерживает `enrich_cogs` с deprecation warning. Frontend изменения **не срочные**, но рекомендуются для:
- Чистоты кода
- Подготовки к полному удалению deprecated endpoint
- Использования новых возможностей (sanity check)

---

## Stories Overview

| Story | Название | Points | Priority | Type |
|-------|----------|--------|----------|------|
| 42.1-FE | TypeScript Types Update | 1 | Required | Tech |
| 42.2-FE | Add Sanity Check Hook | 2 | Optional | Feature |
| 42.3-FE | Missing COGS Alert Component | 2 | Optional | Feature |
| 42.4-FE | Documentation & Tests Update | 2 | Required | Tech |

**Required**: 3 points
**Optional**: 4 points
**Total**: 5-7 points

---

## Dependencies

### Backend (Complete)
- ✅ Story 42.1: `enrich_cogs` deprecated, returns `deprecated: true`
- ✅ Story 42.2: `weekly_margin_aggregate` handler
- ✅ Story 42.3: `weekly_sanity_check` handler

### Frontend Prerequisites
- None (all changes are additive)

---

## API Changes Summary

### Deprecated
```typescript
// ❌ DEPRECATED (still works, logs warning)
task_type: 'enrich_cogs'
payload: { week: '2025-W49' }

// ✅ USE THIS INSTEAD
task_type: 'recalculate_weekly_margin'
payload: { weeks: ['2025-W49'] }
```

### New Task Types

```typescript
// NEW: Data quality validation
task_type: 'weekly_sanity_check'
payload: { week?: '2025-W49' }  // optional, all weeks if empty
// Response includes:
//   - missing_cogs_products: string[] (first 100 nm_ids)
//   - missing_cogs_total: number
//   - checks_passed/failed: number
//   - warnings: string[]

// NEW: Re-aggregation (admin)
task_type: 'weekly_margin_aggregate'
payload: { week?, weeks?, dateFrom?, dateTo? }
```

---

## Files to Modify

### Required Changes
1. `src/types/api.ts` - Update Task type union
2. `src/types/tasks.ts` (NEW) - Task-specific types and responses

### Optional Changes
3. `src/hooks/useSanityCheck.ts` (NEW) - Hook for data quality
4. `src/components/custom/MissingCogsAlert.tsx` (NEW) - Alert component

---

## Acceptance Criteria (Epic Level)

1. ✅ `Task.type` union includes `recalculate_weekly_margin`
2. ✅ `enrich_cogs` marked as deprecated in types (JSDoc)
3. ✅ New task types have proper TypeScript interfaces
4. ✅ Documentation updated
5. ⬜ (Optional) Sanity check hook available for future use
6. ⬜ (Optional) Missing COGS alert component ready

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking change | Very Low | Low | Backend supports backward compat |
| Type mismatches | Low | Low | E2E tests validate |
| Scope creep | Medium | Low | Optional stories clearly marked |

---

## Related Documentation

- [Request #94: Epic 42 Backend Changes](../request-backend/94-epic-42-tech-debt-task-handlers.md)
- [TASKS-API-EXPLANATION.md](../../../docs/TASKS-API-EXPLANATION.md)
- [useManualMarginRecalculation.ts](../../src/hooks/useManualMarginRecalculation.ts)

---

## Timeline Recommendation

**Phase 1** (Sprint N): Required stories (42.1-FE, 42.4-FE) - 3 points
**Phase 2** (Backlog): Optional stories when data quality features needed

---

*Last Updated: 2026-01-06*
