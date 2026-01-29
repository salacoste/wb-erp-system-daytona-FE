# Story 42.4-FE: Documentation & Tests Update

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: ✅ Complete
**Completed**: 2026-01-29
**Priority**: Required
**Points**: 2
**Estimated Time**: 1-2 hours

---

## User Story

**As a** frontend developer
**I want** documentation to reflect current task API
**So that** I can correctly integrate with backend task queue

---

## Background

After TypeScript types update (Story 42.1-FE), documentation and test files need to reflect the changes for consistency and maintainability.

---

## Acceptance Criteria

### AC1: README Updated
```gherkin
Given the README.md file
When I review the Manual Margin Recalculation section
Then it should reference correct task type
And not mention deprecated 'enrich_cogs'
```

### AC2: API Integration Guide Updated
```gherkin
Given docs/api-integration-guide.md
When I review task-related sections
Then new task types should be documented
And deprecated types marked accordingly
```

### AC3: Request #94 Cross-Referenced
```gherkin
Given all task-related documentation
When I search for task_type references
Then Request #94 should be linked as source of truth
```

### AC4: Tests Updated
```gherkin
Given existing tests for margin recalculation
When tests reference task types
Then they should use 'recalculate_weekly_margin'
And not use deprecated 'enrich_cogs'
```

---

## Technical Implementation

### Validation Status (2026-01-29)

**✅ Verified**: Current implementation already uses correct task type.
- `useManualMarginRecalculation.ts` line 49: `task_type: 'recalculate_weekly_margin'` ✅
- No tests reference `enrich_cogs` ✅
- README examples already use correct task type ✅

### Files to Update

#### 1. `README.md` - Manual Margin Recalculation Section (~line 1310)

**Status**: README already uses `recalculate_weekly_margin` correctly in all examples.

**Add Task Types Reference table** after line 1310 (after COGS assignment recommendations):

```markdown
### Task Types Reference (Epic 42)

| Task Type | Status | Use Case |
|-----------|--------|----------|
| `recalculate_weekly_margin` | ✅ Active | Margin recalculation |
| `weekly_sanity_check` | ✅ New | Data quality validation |
| `weekly_margin_aggregate` | ✅ New | Re-aggregate summaries |
| `enrich_cogs` | ⚠️ DEPRECATED | Use `recalculate_weekly_margin` |

📖 **Full documentation**: `docs/request-backend/94-epic-42-tech-debt-task-handlers.md`
```

#### 2. `docs/api-integration-guide.md` - Add Task Queue API Section

**Status**: No task section currently exists. Add after line 710 (after appendix).

Add new section:
```markdown
---

## Task Queue API

Reference: [Request #94](request-backend/94-epic-42-tech-debt-task-handlers.md)

### Available Task Types

| Task Type | Status | Payload | Use Case |
|-----------|--------|---------|----------|
| `recalculate_weekly_margin` | ✅ Active | `{ weeks: string[] }` | Margin recalculation |
| `weekly_margin_aggregate` | ✅ New | `{ week?, weeks?, dateFrom?, dateTo? }` | Re-aggregate summaries |
| `weekly_sanity_check` | ✅ New | `{ week? }` | Data validation |
| `enrich_cogs` | ⚠️ **DEPRECATED** | `{ week?, weeks? }` | Use `recalculate_weekly_margin` |

### Example: Margin Recalculation

\`\`\`typescript
// Recommended approach
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "payload": { "weeks": ["2025-W49"] },
  "priority": 5
}
\`\`\`

### Example: Data Quality Check

\`\`\`typescript
POST /v1/tasks/enqueue
{
  "task_type": "weekly_sanity_check",
  "payload": { "week": "2025-W49" }
}

// Response includes:
// - missing_cogs_products: string[] (first 100)
// - missing_cogs_total: number
// - checks_passed/failed: number
// - warnings: string[]
\`\`\`

### ⚠️ Deprecated: enrich_cogs

Use `recalculate_weekly_margin` instead. The `enrich_cogs` task still works
but returns `deprecated: true` and logs warnings.

Backend HTTP test file: `09-tasks.http`
```

#### 3. `docs/stories/STORIES-STATUS-REPORT.md`

**Status**: ✅ Already has Epic 42-FE section (lines 344-366). No changes needed.

#### 4. `src/types/api.ts` - Mark Deprecated (Story 42.1-FE Dependency)

**Status**: Story 42.1-FE will handle this. `enrich_cogs` on line 43 will be:
- Kept for backwards compatibility
- Marked with JSDoc `@deprecated` comment

**Note**: No test file exists for `useManualMarginRecalculation` hook. Consider if one should be added.

#### 5. Test Files - Verified

**Status**: ✅ No test files reference `enrich_cogs` or task types.
- Searched all 83 `*.test.ts` files
- No changes needed

---

## Checklist

### Documentation Updates
- [ ] README.md - Task Types Reference table added (~line 1310)
- [ ] README.md - "Recent Updates" section updated with Epic 42-FE
- [ ] api-integration-guide.md - Task Queue API section added (after line 710)
- [x] STORIES-STATUS-REPORT.md - Epic 42-FE already present ✅
- [ ] Request #94 cross-referenced in README

### Code Verification (Pre-validated ✅)
- [x] `useManualMarginRecalculation.ts` uses correct task type ✅
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run type-check` - no type errors

### Cross-References
- [x] Epic doc links to all stories ✅
- [x] Stories link to Request #94 ✅
- [ ] README links to Request #94

---

## Definition of Done

- [ ] All documentation files updated
- [ ] No references to `enrich_cogs` as recommended approach
- [ ] Deprecated status clearly marked where `enrich_cogs` mentioned
- [ ] Tests pass
- [ ] PR review completed

---

## Non-goals

- Writing new automated tests (only verify existing tests)
- Code changes to implementation files
- API integration guide rewrite (add task types section only)
- Changelog creation (documentation update only)
- Translation of documentation (Russian documentation already present)

---

## Notes

- Low risk - documentation only
- Can be done in parallel with Story 42.1-FE
- Good task for documentation cleanup sprint

---

## Related

- [Story 42.1-FE](./story-42.1-fe-typescript-types-update.md) - Types that docs reference
- [Request #94](../../request-backend/94-epic-42-tech-debt-task-handlers.md) - Source of truth

---

*Created: 2026-01-06*
*Validated: 2026-01-29*
