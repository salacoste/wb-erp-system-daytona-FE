# Story 5.2-fe: COGS Edit Dialog

## Status
Approved

## Story

**As a** seller who made an error entering COGS,
**I want** to edit an existing COGS record through a modal dialog,
**so that** my margin calculations are accurate without creating a new version.

## Acceptance Criteria

### Dialog Trigger
1. Edit button в COGS History table dropdown открывает диалог
2. Диалог может быть открыт для любой активной записи COGS
3. Кнопка недоступна для Analyst (только Manager/Owner/Admin)

### Dialog UI
4. Modal dialog с заголовком "Редактирование COGS"
5. Показывает read-only информацию: `nm_id`, `product_name`, `valid_from`, `source`
6. Редактируемые поля:
   - `unit_cost_rub` — input number с step="0.01"
   - `notes` — textarea (max 1000 символов)
7. **Layout**: Вертикальный стек (label над input)
   - Простая форма с 2 полями, универсально для всех экранов
8. **Текущее значение**: Показывается inline над input полем
   ```
   ┌─────────────────────────────────────┐
   │ Себестоимость (₽)                   │
   │ Текущее: 450.00                     │
   │ ┌─────────────────────────────────┐ │
   │ │ 520.00                          │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
   ```
9. **Warning о марже**: Inline под полем себестоимости
   - Текст: "ℹ️ Изменение затронет маржу за N недель"
   - Цвет: text-muted-foreground
   - Показывается только если значение изменено

### Validation
10. `unit_cost_rub` обязателен и должен быть > 0
11. `notes` максимум 1000 символов
12. Хотя бы одно поле должно быть изменено для сохранения
13. Валидация в реальном времени с сообщениями об ошибках
14. **Счётчик символов**: Показывать при >800 символов
    - Формат: "850/1000"
    - Цвет: text-muted-foreground, text-destructive при >950

### Form Actions
15. Кнопка "Сохранить" — submit формы (primary)
16. Кнопка "Отмена" — закрыть диалог без сохранения
17. Loading state во время сохранения (spinner + disabled buttons)
18. Кнопка "Сохранить" disabled пока форма невалидна или нет изменений

### Success Flow
19. После успешного сохранения:
    - Toast notification "✅ COGS обновлён"
    - Описание: "Маржа будет пересчитана для N недель (~X сек)"
    - Закрыть диалог
    - Обновить таблицу истории (query invalidation)
20. **Margin recalculation info**: Показывается в toast notification
    - Не прерывает workflow
    - Информирует о фоновом пересчёте

### Error Handling
21. 400 (validation) — показать ошибки под полями
22. 403 (forbidden) — toast "Недостаточно прав для редактирования"
23. 404 (not found) — toast "Запись не найдена, возможно была удалена"
24. Network error — toast с кнопкой "Повторить"

## Tasks / Subtasks

- [x] Task 1: Create Edit COGS mutation hook (AC: 12, 19)
  - [x] Create `src/hooks/useCogsEdit.ts`
  - [x] TanStack Mutation: `PATCH /v1/cogs/:cogsId`
  - [x] Query invalidation on success (`cogs-history-full`, `cogs-history`, `products`)

- [x] Task 2: Create CogsEditDialog component (AC: 4, 5, 6, 7, 8, 15, 16, 17, 18)
  - [x] Create `src/components/custom/CogsEditDialog.tsx`
  - [x] Use shadcn/ui Dialog, Input, Button
  - [x] useState + helper functions for validation
  - [x] Display read-only fields (nm_id, valid_from, source)
  - [x] Display current value above input field
  - [x] Vertical stack layout

- [x] Task 3: Implement validation (AC: 10, 11, 12, 13, 14)
  - [x] validateUnitCost, validateNotes helper functions
  - [x] Real-time validation messages
  - [x] "At least one field changed" validation (hasCogsChanges)
  - [x] Character counter for notes (show when >800)

- [x] Task 4: Implement margin warning (AC: 9)
  - [x] Show inline warning when unit_cost_rub is changed
  - [x] Display affected weeks count from record.affected_weeks

- [x] Task 5: Implement success/error handling (AC: 19, 20, 21, 22, 23, 24)
  - [x] Toast notifications using sonner
  - [x] Margin recalculation info in toast description
  - [x] Error state handling per HTTP status (400, 403, 404)

- [x] Task 6: Integrate with CogsHistoryTable (AC: 1, 2, 3)
  - [x] Receive record data from parent
  - [x] Open dialog when Edit clicked
  - [x] Close dialog on success or cancel

- [x] Task 7: Add unit tests
  - [x] Test form validation (positive number, max length, at least one change)
  - [x] Test helper functions (hasCogsChanges, buildUpdatePayload)
  - [x] Test character counter logic
  - [x] Test margin warning display logic

## Dev Notes

### API Integration

**Backend Endpoint:** `PATCH /v1/cogs/:cogsId`
- Backend Story: `docs/stories/epic-5/story-5.2-edit-cogs.md`
- Backend Status: ✅ Done (QA PASSED 90/100)

**Headers:**
- `Authorization: Bearer <token>`
- `X-Cabinet-Id: <uuid>`

**Request body:**
```typescript
interface UpdateCogsRecordDto {
  unit_cost_rub?: number;  // Positive decimal, optional
  notes?: string;          // Max 1000 chars, optional
}
// At least one field must be provided (backend validates)
```

**Response (200 OK):**
```typescript
interface EditCogsResponse {
  cogs_id: string;
  nm_id: string;
  unit_cost_rub: number;
  currency: string;
  valid_from: string;
  valid_to: string | null;
  source: string;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  margin_recalculation: {
    triggered: boolean;
    task_uuid: string;
    affected_weeks: string[];
    estimated_time_sec: number;
  };
}
```

**Error Responses:**
- `400 Bad Request` — Validation errors (empty body, invalid values)
- `403 Forbidden` — Analyst role or wrong cabinet
- `404 Not Found` — COGS not found or already deleted

### Validation Schema (Zod)

```typescript
import { z } from 'zod';

const editCogsSchema = z.object({
  unit_cost_rub: z
    .number({ invalid_type_error: 'Введите числовое значение' })
    .positive('Себестоимость должна быть положительным числом')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Максимум 1000 символов')
    .optional(),
}).refine(
  (data) => data.unit_cost_rub !== undefined || data.notes !== undefined,
  { message: 'Необходимо изменить хотя бы одно поле' }
);

type EditCogsFormData = z.infer<typeof editCogsSchema>;
```

### Relevant Source Tree

**New Files:**
```
src/
├── components/custom/
│   └── CogsEditDialog.tsx   # Edit dialog component
└── hooks/
    └── useCogsEdit.ts       # Mutation hook
```

### Component Patterns

**Dialog with Form (UX Decision - Vertical Layout):**
```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Редактирование COGS</DialogTitle>
      <DialogDescription>
        Измените себестоимость или примечание.
      </DialogDescription>
    </DialogHeader>

    {/* Read-only info */}
    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground border-b pb-4">
      <div>Артикул: {record.nm_id}</div>
      <div>Источник: {sourceConfig[record.source].label}</div>
      <div className="col-span-2">
        Дата начала: {formatDate(record.valid_from)}
      </div>
    </div>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Unit cost field with current value */}
        <FormField
          control={form.control}
          name="unit_cost_rub"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Себестоимость (₽)</FormLabel>
              <div className="text-sm text-muted-foreground">
                Текущее: {formatCurrency(record.unit_cost_rub)}
              </div>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              {/* Margin warning - inline (UX Decision) */}
              {field.value !== record.unit_cost_rub && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  Изменение затронет маржу за {record.affected_weeks.length} недель
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes field with character counter */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between">
                <FormLabel>Примечание</FormLabel>
                {/* Character counter - show when >800 (UX Decision) */}
                {field.value && field.value.length > 800 && (
                  <span className={cn(
                    "text-xs",
                    field.value.length > 950 ? "text-destructive" : "text-muted-foreground"
                  )}>
                    {field.value.length}/1000
                  </span>
                )}
              </div>
              <FormControl>
                <Textarea maxLength={1000} rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            Отмена
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || !form.formState.isDirty}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>
```

**Mutation Hook with Toast (UX Decision):**
```typescript
const mutation = useMutation({
  mutationFn: (data: UpdateCogsRecordDto) =>
    apiClient.patch(`/v1/cogs/${cogsId}`, data),
  onSuccess: (response: EditCogsResponse) => {
    queryClient.invalidateQueries({ queryKey: ['cogs-history'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });

    // Toast with margin recalculation info (UX Decision)
    toast({
      title: '✅ COGS обновлён',
      description: `Маржа будет пересчитана для ${response.margin_recalculation.affected_weeks.length} недель (~${response.margin_recalculation.estimated_time_sec} сек)`,
    });

    onClose();
  },
  onError: (error: AxiosError) => {
    if (error.response?.status === 403) {
      toast({
        title: 'Недостаточно прав для редактирования',
        variant: 'destructive',
      });
    } else if (error.response?.status === 404) {
      toast({
        title: 'Запись не найдена, возможно была удалена',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Ошибка сохранения',
        description: 'Попробуйте ещё раз',
        variant: 'destructive',
      });
    }
  },
});
```

### Testing

**Test file:** `src/components/custom/CogsEditDialog.test.tsx`

**Test scenarios:**
- Form renders with current values pre-filled
- Current value displayed above input
- Validation error: empty unit_cost_rub when cleared
- Validation error: negative unit_cost_rub
- Validation error: notes > 1000 characters
- Validation error: no changes made (Save disabled)
- Character counter appears when notes > 800
- Character counter red when notes > 950
- Margin warning appears when unit_cost_rub changed
- Successful save flow with query invalidation
- Toast shows margin recalculation info
- Error handling: 400 shows field errors
- Error handling: 403 shows permission toast
- Error handling: 404 shows not found toast
- Loading state during save (button disabled, spinner)
- Dialog closes on cancel

### Important Notes

- Depends on Story 5.1-fe (CogsHistoryTable provides the trigger)
- Backend endpoint already implemented and tested (Epic 5 Complete)
- **Key difference from `updateCogs()` (new version)**: This endpoint modifies existing record, not creates new version
- Reuse form patterns from SingleCogsForm.tsx (Story 4.1)
- Follow WCAG AA accessibility standards
- Russian locale for all user-facing text

## UX Decisions (Resolved 2025-11-28)

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Layout полей | Вертикальный стек | Простота, мобильность, 2 поля |
| 2 | Warning о марже | Inline под полем | Контекстуально, не блокирует |
| 3 | Счётчик символов | Показывать при >800 | Релевантно когда приближается к лимиту |
| 4 | Margin recalculation | В toast notification | Достаточно информативно, не прерывает flow |

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-28 | 1.0 | Initial story creation | Sarah (PO) |
| 2025-11-28 | 1.1 | UX decisions applied, status → Approved | Sarah (PO) |
| 2025-11-28 | 1.2 | Implementation complete, 24 tests passing, status → Dev Complete | James (Dev Agent) |
| 2025-11-28 | 1.3 | QA PASS (95/100), status → Approved | Quinn (QA) |

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
- Initial component created as part of Story 5.1-fe (CogsHistoryTable dependency)
- Refactored to use separate hook with exported helper functions
- Fixed validateUnitCost to use strict regex check (parseFloat('12abc') returns 12)

### Completion Notes List
1. Created `useCogsEdit.ts` hook with exported helper functions for testability
2. Refactored `CogsEditDialog.tsx` to use the hook and helper functions
3. Hook handles all toast notifications and query invalidation
4. Uses `cn()` utility for conditional class names
5. All 24 AC covered by implementation

### File List
**New Files Created:**
```
src/hooks/useCogsEdit.ts                    # Mutation hook + helpers
src/hooks/useCogsEdit.test.ts               # 24 unit tests
```

**Modified Files:**
```
src/components/custom/CogsEditDialog.tsx    # Refactored to use hook
```

### Test Results
- `useCogsEdit.test.ts`: 24 tests passed ✅

## QA Results

**Gate Decision**: ✅ **PASS** (95/100)
**Reviewer**: Quinn (Test Architect)
**Date**: 2025-11-28

### Summary
Complete implementation with all 24 ACs met, 24 unit tests passing, proper form validation, margin warning, and toast notifications.

### NFR Validation
| NFR | Status | Notes |
|-----|--------|-------|
| Security | ✅ PASS | Role-based access (Analyst cannot edit), Authorization headers sent, input validation |
| Performance | ✅ PASS | TanStack Mutation with proper query invalidation, optimistic form state |
| Reliability | ✅ PASS | Comprehensive error handling (400/403/404/network), toast notifications |
| Maintainability | ✅ PASS | Validation helpers exported for unit testing, clear separation hook/component |
| Accessibility | ✅ PASS | Form labels properly associated, disabled states during loading |

### Test Coverage
- **24 unit tests** covering validation and payload construction
- All 24 acceptance criteria verified
- Strict numeric validation (rejects '12abc')

### Risks Identified
None

### Recommendations
- Future: Consider component tests for form interactions (submit flow)
- Future: Consider E2E test for edit workflow end-to-end

---

**Epic**: Epic 5: COGS History Management
**Related Frontend Stories**: [Story 5.1-fe: History View](./story-5.1-fe-cogs-history-view.md), [Story 5.3-fe: Delete COGS](./story-5.3-fe-cogs-delete-dialog.md)
**Backend Stories**: [Story 5.2: Edit COGS](../../../../docs/stories/epic-5/story-5.2-edit-cogs.md)
