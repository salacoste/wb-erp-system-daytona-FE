# Epic 5 Frontend: COGS History UI

## Overview

Frontend implementation for viewing, editing, and deleting COGS history records.

**Backend Status**: ✅ Complete (All 3 stories done, QA PASSED 90/100)
**Frontend Status**: ✅ **Complete & Approved** (All 3 stories QA PASSED 95/100, 92 tests)

## Stories

| Story                                          | Title                    | Status      | QA Score | Tests |
| ---------------------------------------------- | ------------------------ | ----------- | -------- | ----- |
| [5.1-fe](./story-5.1-fe-cogs-history-view.md)  | COGS History View        | ✅ Approved | 95/100   | 50    |
| [5.2-fe](./story-5.2-fe-cogs-edit-dialog.md)   | COGS Edit Dialog         | ✅ Approved | 95/100   | 24    |
| [5.3-fe](./story-5.3-fe-cogs-delete-dialog.md) | COGS Delete Confirmation | ✅ Approved | 95/100   | 18    |

## Backend API Endpoints

| Story  | Endpoint           | Method | Backend Story                                                         |
| ------ | ------------------ | ------ | --------------------------------------------------------------------- |
| 5.1-fe | `/v1/cogs/history` | GET    | [5.1](../../../../docs/stories/epic-5/story-5.1-view-cogs-history.md) |
| 5.2-fe | `/v1/cogs/:cogsId` | PATCH  | [5.2](../../../../docs/stories/epic-5/story-5.2-edit-cogs.md)         |
| 5.3-fe | `/v1/cogs/:cogsId` | DELETE | [5.3](../../../../docs/stories/epic-5/story-5.3-delete-cogs.md)       |

## File Structure

```
src/
├── app/(dashboard)/cogs/
│   └── history/
│       └── page.tsx              # Story 5.1-fe: History page
├── components/custom/
│   ├── CogsHistoryTable.tsx      # Story 5.1-fe: History table with dropdown
│   ├── CogsHistoryMeta.tsx       # Story 5.1-fe: Meta info card
│   ├── CogsHistoryPagination.tsx # Story 5.1-fe: Pagination
│   ├── AffectedWeeksCell.tsx     # Story 5.1-fe: Collapsible weeks
│   ├── CogsEditDialog.tsx        # Story 5.2-fe: Edit dialog
│   └── CogsDeleteDialog.tsx      # Story 5.3-fe: Delete dialog
├── hooks/
│   ├── useCogsHistory.ts         # Story 5.1-fe: Query hook
│   ├── useCogsEdit.ts            # Story 5.2-fe: Mutation hook
│   └── useCogsDelete.ts          # Story 5.3-fe: Mutation hook
└── types/
    └── cogs.ts                   # Extend with history types
```

## UX Decisions Summary (Resolved 2025-11-28)

### Story 5.1-fe: COGS History View

| #   | Question         | Decision                        | Rationale                        |
| --- | ---------------- | ------------------------------- | -------------------------------- |
| 1   | affected_weeks   | Collapsed "N недель" + expand   | Чистота UI, детали по запросу    |
| 2   | source icons     | ✏️📥⚙️ + tooltips               | Интуитивно понятно с пояснениями |
| 3   | nm_id в header   | Мелкий текст под названием      | Референс для WB, не перегружает  |
| 4   | Удалённые записи | Gray background + strikethrough | Сохраняет хронологию, очевидно   |
| 5   | Кнопки действий  | Dropdown "⋮"                    | Экономия места, touch-friendly   |

### Story 5.2-fe: COGS Edit Dialog

| #   | Question             | Decision             | Rationale                                  |
| --- | -------------------- | -------------------- | ------------------------------------------ |
| 1   | Layout полей         | Вертикальный стек    | Простота, мобильность, 2 поля              |
| 2   | Warning о марже      | Inline под полем     | Контекстуально, не блокирует               |
| 3   | Счётчик символов     | Показывать при >800  | Релевантно когда приближается к лимиту     |
| 4   | Margin recalculation | В toast notification | Достаточно информативно, не прерывает flow |

### Story 5.3-fe: COGS Delete Confirmation

| #   | Question              | Decision                                  | Rationale                                   |
| --- | --------------------- | ----------------------------------------- | ------------------------------------------- |
| 1   | Тон предупреждения    | Детальный summary                         | Informed consent для деструктивных действий |
| 2   | Version chain warning | Информативный текст с суммой              | Понятно, конкретно, не пугает               |
| 3   | Единственная версия   | Красный alert block                       | Критическая ситуация требует внимания       |
| 4   | Подтверждение         | Кнопка + checkbox для единственной версии | Баланс UX и безопасности                    |
| 5   | Undo опция            | Нет (soft delete → admin recovery)        | Технически сложно, есть альтернатива        |

## Dependencies

- Story 4.1: Single Product COGS Assignment (existing infrastructure)
- Story 4.4: Margin Display Components (reuse patterns)
- Story 4.8: Margin Polling (reuse patterns for recalculation)

## Authorization Matrix

| Action       | Analyst | Manager | Owner | Admin |
| ------------ | ------- | ------- | ----- | ----- |
| View History | ✅      | ✅      | ✅    | ✅    |
| Edit COGS    | ❌      | ✅      | ✅    | ✅    |
| Delete COGS  | ❌      | ✅      | ✅    | ✅    |
| View Deleted | ❌      | ❌      | ✅    | ✅    |

## Development Order

1. **Story 5.1-fe**: COGS History View (foundation - page, table, hooks)
2. **Story 5.2-fe**: COGS Edit Dialog (integrates with table)
3. **Story 5.3-fe**: COGS Delete Dialog (integrates with table)

## Key Technical Patterns

### Affected Weeks Collapsible

```tsx
<Collapsible>
  <CollapsibleTrigger>5 недель <ChevronDown /></CollapsibleTrigger>
  <CollapsibleContent>2025-W41, W42, W43, W44, W45</CollapsibleContent>
</Collapsible>
```

### Source Icons with Tooltips

```tsx
const sourceConfig = {
  manual: { icon: '✏️', label: 'Ручной ввод' },
  import: { icon: '📥', label: 'Импорт из файла' },
  system: { icon: '⚙️', label: 'Системный пересчёт' },
};
```

### Version Chain Analysis

```typescript
function analyzeVersionChain(record, history) {
  return {
    isCurrentVersion: record.valid_to === null,
    hasPreviousVersion: !!history.find(r => r.valid_to === record.valid_from),
    isOnlyVersion: history.filter(r => r.is_active).length === 1,
  };
}
```

## Estimation

| Story     | Estimated Effort |
| --------- | ---------------- |
| 5.1-fe    | 3-4 days         |
| 5.2-fe    | 1-2 days         |
| 5.3-fe    | 1-2 days         |
| **Total** | **5-8 days**     |

---

**Last Updated**: 2025-11-28
**Author**: Sarah (PO)
**UX Expert**: UX Team
**QA Approval**: Quinn (Test Architect) - 2025-11-28
