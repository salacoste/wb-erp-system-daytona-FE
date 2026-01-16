# Story 42.4-FE: Documentation & Tests Update

**Epic**: [42-FE Task Handlers Adaptation](../../epics/epic-42-fe-task-handlers-adaptation.md)
**Status**: 📋 Ready for Development
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

### Files to Update

#### 1. `README.md` - Manual Margin Recalculation Section (~line 1120-1195)

**Current** (check for outdated references):
- Ensure `recalculate_weekly_margin` is used
- Add note about deprecated `enrich_cogs`

**Add section after existing manual recalculation docs**:
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

#### 2. `docs/api-integration-guide.md` - Add Task Types Section

Add new section:
```markdown
## Task Queue API

### Available Task Types

Reference: [Request #94](request-backend/94-epic-42-tech-debt-task-handlers.md)

#### Margin Recalculation (Recommended)
\`\`\`typescript
POST /v1/tasks/enqueue
{
  "task_type": "recalculate_weekly_margin",
  "payload": { "weeks": ["2025-W49"] },
  "priority": 5
}
\`\`\`

#### Data Quality Check (New)
\`\`\`typescript
POST /v1/tasks/enqueue
{
  "task_type": "weekly_sanity_check",
  "payload": { "week": "2025-W49" }
}

// Response includes:
// - missing_cogs_products: string[]
// - missing_cogs_total: number
// - checks_passed/failed: number
\`\`\`

#### ⚠️ Deprecated: enrich_cogs
Use `recalculate_weekly_margin` instead. The `enrich_cogs` task still works
but returns `deprecated: true` and logs warnings.
```

#### 3. `docs/stories/STORIES-STATUS-REPORT.md` - Add Epic 42-FE

```markdown
## Epic 42-FE: Task Handlers Adaptation

| Story | Name | Status | Points |
|-------|------|--------|--------|
| 42.1-FE | TypeScript Types Update | 📋 Ready | 1 |
| 42.2-FE | Sanity Check Hook | 📋 Backlog | 2 |
| 42.3-FE | Missing COGS Alert | 📋 Backlog | 2 |
| 42.4-FE | Documentation & Tests | 📋 Ready | 2 |

**Total**: 7 points | **Required**: 3 | **Optional**: 4
```

#### 4. Test Files - Verify and Update

Check these files for `enrich_cogs` references:
- `src/hooks/__tests__/useManualMarginRecalculation.test.ts`
- Any E2E tests related to task queue

**Expected**: No changes needed (current code uses `recalculate_weekly_margin`)

---

## Checklist

### Documentation Updates
- [ ] README.md - Manual Margin Recalculation section reviewed
- [ ] README.md - Task Types Reference table added
- [ ] README.md - "Recent Updates" section updated with Epic 42-FE
- [ ] api-integration-guide.md - Task Queue API section added
- [ ] STORIES-STATUS-REPORT.md - Epic 42-FE added
- [ ] Request #94 cross-referenced in all relevant docs

### Test Verification
- [ ] `useManualMarginRecalculation.test.ts` - verify uses correct task type
- [ ] Run `npm test` - all tests pass
- [ ] Run `npm run type-check` - no type errors

### Cross-References
- [ ] Epic doc links to all stories
- [ ] Stories link to Request #94
- [ ] README links to epic doc

---

## Definition of Done

- [ ] All documentation files updated
- [ ] No references to `enrich_cogs` as recommended approach
- [ ] Deprecated status clearly marked where `enrich_cogs` mentioned
- [ ] Tests pass
- [ ] PR review completed

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
