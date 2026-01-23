# Story 52-FE.5: Delete Scheduled Version

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.5
**Title**: Delete Scheduled Version
**Status**: ✅ Complete
**Story Points**: 2
**Priority**: Required
**Completed**: 2026-01-23

---

## User Story

**As an** Admin,
**I want to** delete a scheduled tariff version,
**So that** I can cancel planned changes that are no longer needed.

---

## Acceptance Criteria

- [x] **AC1**: Delete button visible only for versions with `status = "scheduled"`
- [x] **AC2**: Delete button hidden for `active` and `expired` versions
- [x] **AC3**: Clicking delete opens confirmation dialog
- [x] **AC4**: Dialog text: "Вы уверены, что хотите удалить версию, запланированную на {date}?"
- [x] **AC5**: Confirm button calls `DELETE /v1/tariffs/settings/:id`
- [x] **AC6**: Error handling:
  - 400 → "Нельзя удалить активную или истекшую версию"
  - 403 → Redirect to dashboard
- [x] **AC7**: Success toast: "Запланированная версия удалена"
- [x] **AC8**: After success, refresh version history table

---

## API Integration

### Endpoint

```http
DELETE /v1/tariffs/settings/3
Authorization: Bearer <admin-jwt>
```

### Success Response

```
204 No Content
```

### Error Responses

```json
// 400 Bad Request - Not scheduled
{
  "message": "Cannot delete active or expired versions",
  "error": "Bad Request"
}

// 403 Forbidden - Not admin
{
  "message": "Required roles: admin. User role: manager",
  "error": "Forbidden"
}

// 404 Not Found
{
  "message": "Version not found",
  "error": "Not Found"
}
```

---

## Technical Design

### Components

| Component | File | Purpose |
|-----------|------|---------|
| `DeleteVersionDialog` | `DeleteVersionDialog.tsx` | Confirmation dialog |

### Hook

```typescript
// src/hooks/useDeleteTariffVersion.ts
export function useDeleteTariffVersion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (versionId: number) => deleteTariffVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tariffQueryKeys.versionHistory() })
      toast.success('Запланированная версия удалена')
    },
    onError: (error: ApiError) => {
      if (error.status === 400) {
        toast.error('Нельзя удалить активную или истекшую версию')
      } else if (error.status === 404) {
        toast.error('Версия не найдена')
      }
    },
  })
}
```

### Integration with VersionHistoryTable

```typescript
// In VersionHistoryTable.tsx
function VersionHistoryTable() {
  const [versionToDelete, setVersionToDelete] = useState<TariffVersion | null>(null)
  const deleteVersion = useDeleteTariffVersion()

  return (
    <>
      <Table>
        {versions.map((version) => (
          <TableRow key={version.id}>
            {/* ... other columns ... */}
            <TableCell>
              {version.status === 'scheduled' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVersionToDelete(version)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </Table>

      <DeleteVersionDialog
        open={!!versionToDelete}
        version={versionToDelete}
        onConfirm={() => {
          if (versionToDelete) {
            deleteVersion.mutate(versionToDelete.id)
            setVersionToDelete(null)
          }
        }}
        onCancel={() => setVersionToDelete(null)}
        isLoading={deleteVersion.isPending}
      />
    </>
  )
}
```

---

## UI/UX Specifications

### Delete Button (in VersionHistoryTable)

- **Icon**: Trash2 (Lucide)
- **Color**: Red (text-red-500)
- **Variant**: ghost
- **Size**: sm
- **Tooltip**: "Удалить версию"
- **Visibility**: Only for `status === 'scheduled'`

### Confirmation Dialog

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Удалить запланированную версию?                     │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  Вы уверены, что хотите удалить версию,                 │
│  запланированную на 01.02.2026?                         │
│                                                          │
│  Это действие нельзя отменить.                          │
│                                                          │
│  ───────────────────────────────────────────────────────│
│                                                          │
│  [Отмена]                              [🗑️ Удалить]     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Button States

| State | Cancel | Confirm |
|-------|--------|---------|
| Default | Enabled | Enabled, red variant |
| Deleting | Disabled | Loading spinner |
| Error | Enabled | Enabled |

### Dialog Props

```typescript
interface DeleteVersionDialogProps {
  open: boolean
  version: TariffVersion | null
  onConfirm: () => void
  onCancel: () => void
  isLoading: boolean
}
```

---

## Testing Requirements

### Unit Tests

- [x] Delete button only visible for scheduled versions
- [x] Delete button hidden for active/expired versions
- [x] Dialog opens with correct version date
- [x] Confirm button triggers onConfirm callback
- [x] Cancel button triggers onCancel callback
- [x] Loading state shows spinner

### Integration Tests

- [x] DELETE request sent with correct version ID
- [x] Success toast appears after deletion
- [x] Version history table refreshes
- [x] Error toast for 400/404 responses

---

## Dependencies

- Story 52-FE.1 (VersionHistoryTable - integrates with)
- Story 52-FE.7 (Types)
- shadcn/ui `AlertDialog` component

---

## Files to Create/Modify

### New Files

```
src/components/custom/tariffs-admin/DeleteVersionDialog.tsx
src/hooks/useDeleteTariffVersion.ts
```

### Modified Files

```
src/components/custom/tariffs-admin/VersionHistoryTable.tsx (add delete button and dialog integration)
```

---

## Definition of Done

- [x] All acceptance criteria met
- [x] Unit tests written and passing
- [x] Dialog accessible (focus trap, ESC to close)
- [x] Error states handled gracefully
- [x] Optimistic UI update or refresh after delete
- [x] Code reviewed and approved

---

## Implementation Status

**Status:** ✅ Complete

### Implemented Components
- `DeleteVersionDialog.tsx` (136 lines) - AlertDialog-based confirmation with loading state
- `useDeleteTariffVersion.ts` - Delete mutation hook with cache invalidation
- `__tests__/DeleteVersionDialog.test.tsx` - Comprehensive test coverage

### Notes
Dialog prevents closing during deletion (loading state). Uses AlertDialog from shadcn/ui with proper ARIA labels. Integrated into VersionHistoryTable via state management.

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-23
