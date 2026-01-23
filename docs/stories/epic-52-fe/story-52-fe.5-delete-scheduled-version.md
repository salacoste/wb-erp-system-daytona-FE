# Story 52-FE.5: Delete Scheduled Version

**Epic**: Epic 52-FE - Tariff Settings Admin UI
**Story ID**: 52-FE.5
**Title**: Delete Scheduled Version
**Status**: 📋 Ready for Development
**Story Points**: 2
**Priority**: Required

---

## User Story

**As an** Admin,
**I want to** delete a scheduled tariff version,
**So that** I can cancel planned changes that are no longer needed.

---

## Acceptance Criteria

- [ ] **AC1**: Delete button visible only for versions with `status = "scheduled"`
- [ ] **AC2**: Delete button hidden for `active` and `expired` versions
- [ ] **AC3**: Clicking delete opens confirmation dialog
- [ ] **AC4**: Dialog text: "Вы уверены, что хотите удалить версию, запланированную на {date}?"
- [ ] **AC5**: Confirm button calls `DELETE /v1/tariffs/settings/:id`
- [ ] **AC6**: Error handling:
  - 400 → "Нельзя удалить активную или истекшую версию"
  - 403 → Redirect to dashboard
- [ ] **AC7**: Success toast: "Запланированная версия удалена"
- [ ] **AC8**: After success, refresh version history table

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

- [ ] Delete button only visible for scheduled versions
- [ ] Delete button hidden for active/expired versions
- [ ] Dialog opens with correct version date
- [ ] Confirm button triggers onConfirm callback
- [ ] Cancel button triggers onCancel callback
- [ ] Loading state shows spinner

### Integration Tests

- [ ] DELETE request sent with correct version ID
- [ ] Success toast appears after deletion
- [ ] Version history table refreshes
- [ ] Error toast for 400/404 responses

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

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Dialog accessible (focus trap, ESC to close)
- [ ] Error states handled gracefully
- [ ] Optimistic UI update or refresh after delete
- [ ] Code reviewed and approved

---

**Created**: 2026-01-22
**Last Updated**: 2026-01-22
