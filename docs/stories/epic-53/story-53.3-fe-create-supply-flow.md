# Story 53.3-FE: Create Supply Flow

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 3 (Mar 3-14, 2026)
- **Priority**: High
- **Points**: 3
- **Status**: Ready for Dev

## User Story

**As a** WB seller managing FBS orders,
**I want** to create a new supply with an optional name,
**So that** I can start grouping my confirmed orders for warehouse delivery.

## Background

The Create Supply Flow is the entry point to the supply management lifecycle. A supply starts in OPEN status, allowing the seller to add orders. The creation flow should be quick and seamless:

1. Click "Создать поставку" button on Supplies List page
2. Modal opens with optional name input
3. Click "Создать" to create supply
4. Redirect to Supply Detail page

The flow uses optimistic updates for instant feedback and handles errors gracefully with toast notifications.

---

## Acceptance Criteria

### AC1: Create Button Placement

- [ ] "Создать поставку" button in SuppliesListPage header
- [ ] Button uses `Plus` icon from Lucide
- [ ] Button variant: primary (red background `#E53935`)
- [ ] Button label: "Создать поставку"
- [ ] Button disabled while create mutation is pending

### AC2: Create Supply Modal

- [ ] Modal opens when clicking "Создать поставку" button
- [ ] Modal uses shadcn/ui Dialog component
- [ ] Modal max-width: 400px
- [ ] Modal title: "Новая поставка"
- [ ] Modal description: "Создайте поставку для группировки заказов"
- [ ] Clicking outside modal or X button closes it
- [ ] Escape key closes modal

### AC3: Modal Form

- [ ] Single optional text input for supply name
- [ ] Input label: "Название поставки (опционально)"
- [ ] Input placeholder: "Например: Поставка на склад Коледино"
- [ ] Max length: 100 characters
- [ ] If empty, backend generates default name ("Поставка #N")
- [ ] Form uses react-hook-form

### AC4: Modal Actions

- [ ] "Отмена" button (secondary) - closes modal
- [ ] "Создать" button (primary) - submits form
- [ ] "Создать" button disabled while mutation pending
- [ ] Loading spinner on "Создать" button during submission
- [ ] Keyboard: Enter submits form, Escape cancels

### AC5: useCreateSupply Mutation Hook

- [ ] Hook calls `POST /v1/supplies` with `{ name?: string }`
- [ ] Returns `{ mutate, mutateAsync, isPending, error, data }`
- [ ] Invalidates `suppliesQueryKeys.all` on success
- [ ] Optimistic update adds new supply to list immediately

### AC6: Optimistic Update Pattern

- [ ] New supply appears in list instantly (before server confirmation)
- [ ] Optimistic supply has temporary ID (e.g., `temp-${Date.now()}`)
- [ ] Optimistic supply shows:
  - Name: entered name or "Новая поставка..."
  - Status: OPEN
  - Orders count: 0
  - Created: current timestamp
- [ ] On success: replace temp ID with real ID
- [ ] On error: remove optimistic supply from list

### AC7: Redirect on Success

- [ ] After successful creation, close modal
- [ ] Navigate to `/supplies/{newSupplyId}`
- [ ] Use `router.push()` from Next.js navigation
- [ ] No additional toast on success (redirect is confirmation)

### AC8: Error Handling

- [ ] On API error: show toast notification
- [ ] Toast message format: "Не удалось создать поставку: {error.message}"
- [ ] Toast variant: destructive (red)
- [ ] Modal remains open on error for retry
- [ ] Network error: "Проверьте соединение и попробуйте снова"
- [ ] 401: Redirect to login (handled by ApiClient)

### AC9: Loading State

- [ ] "Создать" button shows spinner icon during mutation
- [ ] "Создать" button text changes to "Создание..."
- [ ] Form inputs disabled during mutation
- [ ] "Отмена" button remains enabled (allows cancel)

### AC10: Accessibility (WCAG 2.1 AA)

- [ ] Focus trapped inside modal when open
- [ ] Initial focus on name input
- [ ] Focus returns to "Создать поставку" button on close
- [ ] Modal has `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- [ ] Form input has associated label
- [ ] Error messages announced to screen readers

---

## UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Поставки FBS                                     [+ Создать поставку]       │
│ ════════════════════════════════════════════════════════════════════════════│
│                                                                             │
│  ┌─────────────────────────────────────────────┐                            │
│  │                   [X]                       │                            │
│  │                                             │                            │
│  │   Новая поставка                            │                            │
│  │   Создайте поставку для группировки заказов │                            │
│  │                                             │                            │
│  │   Название поставки (опционально)           │                            │
│  │   ┌─────────────────────────────────────┐   │                            │
│  │   │ Например: Поставка на склад Колед...│   │                            │
│  │   └─────────────────────────────────────┘   │                            │
│  │                                             │                            │
│  │                    [Отмена]   [Создать]     │                            │
│  │                                             │                            │
│  └─────────────────────────────────────────────┘                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────┐
│                   [X]                           │
│                                                 │
│   Новая поставка                                │
│   Создайте поставку для группировки заказов     │
│                                                 │
│   Название поставки (опционально)               │
│   ┌─────────────────────────────────────┐       │
│   │ Моя поставка                  [disabled]    │
│   └─────────────────────────────────────┘       │
│                                                 │
│                  [Отмена]   [◌ Создание...]     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Components to Create

### New Components

| Component | File Path | Lines Est. | Purpose |
|-----------|-----------|------------|---------|
| `CreateSupplyModal` | `src/app/(dashboard)/supplies/components/CreateSupplyModal.tsx` | ~120 | Modal with form for creating supply |
| `CreateSupplyButton` | `src/app/(dashboard)/supplies/components/CreateSupplyButton.tsx` | ~40 | Button that triggers modal open |

### Hooks

| Hook | File Path | Lines Est. | Purpose |
|------|-----------|------------|---------|
| `useCreateSupply` | `src/hooks/useCreateSupply.ts` | ~60 | Mutation hook with optimistic updates |

### Reused Components

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter` - shadcn/ui
- `Button` - shadcn/ui
- `Input`, `Label` - shadcn/ui
- `toast` (sonner) - Notification system

---

## API Integration

### Create Supply Endpoint

```typescript
POST /v1/supplies
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

Request:
{
  "name": "Поставка на Коледино"  // optional
}

Response (201 Created):
{
  "data": {
    "id": "sup_123abc",
    "name": "Поставка на Коледино",
    "status": "OPEN",
    "ordersCount": 0,
    "createdAt": "2026-03-05T10:30:00Z",
    "updatedAt": "2026-03-05T10:30:00Z"
  }
}
```

### API Function

```typescript
// src/lib/api/supplies.ts
export async function createSupply(data: CreateSupplyRequest): Promise<Supply> {
  return apiClient.post<Supply>('/v1/supplies', data)
}
```

---

## Technical Implementation

### CreateSupplyButton Component

```typescript
// src/app/(dashboard)/supplies/components/CreateSupplyButton.tsx
'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { CreateSupplyModal } from './CreateSupplyModal'

export function CreateSupplyButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Создать поставку
      </Button>
      <CreateSupplyModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
```

### useCreateSupply Hook Pattern

```typescript
// src/hooks/useCreateSupply.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createSupply } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'

export function useCreateSupply() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createSupply,
    onMutate: async (newSupply) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: suppliesQueryKeys.all })

      // Snapshot previous value
      const previousSupplies = queryClient.getQueryData(suppliesQueryKeys.list({}))

      // Optimistically add new supply
      queryClient.setQueryData(suppliesQueryKeys.list({}), (old: any) => ({
        ...old,
        items: [
          {
            id: `temp-${Date.now()}`,
            name: newSupply.name || 'Новая поставка...',
            status: 'OPEN',
            ordersCount: 0,
            createdAt: new Date().toISOString(),
          },
          ...(old?.items || []),
        ],
      }))

      return { previousSupplies }
    },
    onSuccess: (data) => {
      // Navigate to detail page
      router.push(`/supplies/${data.id}`)
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousSupplies) {
        queryClient.setQueryData(suppliesQueryKeys.list({}), context.previousSupplies)
      }

      const message = error instanceof Error
        ? error.message
        : 'Проверьте соединение и попробуйте снова'

      toast.error(`Не удалось создать поставку: ${message}`)
    },
    onSettled: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: suppliesQueryKeys.all })
    },
  })
}
```

### CreateSupplyModal Component

```typescript
// src/app/(dashboard)/supplies/components/CreateSupplyModal.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateSupply } from '@/hooks/useCreateSupply'

const formSchema = z.object({
  name: z.string().max(100, 'Максимум 100 символов').optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateSupplyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSupplyModal({ open, onOpenChange }: CreateSupplyModalProps) {
  const { mutate, isPending } = useCreateSupply()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '' },
  })

  const onSubmit = (values: FormValues) => {
    mutate(
      { name: values.name || undefined },
      {
        onSuccess: () => {
          form.reset()
          onOpenChange(false)
        },
      }
    )
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Новая поставка</DialogTitle>
          <DialogDescription>
            Создайте поставку для группировки заказов
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название поставки (опционально)</Label>
            <Input
              id="name"
              placeholder="Например: Поставка на склад Коледино"
              disabled={isPending}
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание...
                </>
              ) : (
                'Создать'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

## Error Handling

| HTTP Status | Error Message (Russian) | Action |
|-------------|-------------------------|--------|
| 400 | "Неверные данные запроса" | Show toast, keep modal open |
| 401 | "Сессия истекла. Войдите снова." | Redirect to login |
| 403 | "Нет доступа к этому кабинету" | Show toast, close modal |
| 429 | "Слишком много запросов. Подождите." | Show toast, keep modal open |
| 500 | "Ошибка сервера. Попробуйте позже." | Show toast, keep modal open |
| Network | "Проверьте соединение и попробуйте снова" | Show toast, keep modal open |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/supplies/components/__tests__/CreateSupplyModal.test.tsx`

### Test Cases

#### Modal Behavior
- [ ] Modal opens when button clicked
- [ ] Modal closes on X button click
- [ ] Modal closes on overlay click
- [ ] Modal closes on Escape key
- [ ] Focus trapped inside modal
- [ ] Initial focus on name input

#### Form Validation
- [ ] Empty name is valid (optional field)
- [ ] Name with >100 characters shows error
- [ ] Error message displayed in Russian

#### Submission
- [ ] Form submits on "Создать" click
- [ ] Form submits on Enter key
- [ ] Loading state shown during submission
- [ ] Button disabled during submission
- [ ] Input disabled during submission

#### Success Flow
- [ ] Modal closes on success
- [ ] Navigates to `/supplies/{id}`
- [ ] Optimistic update adds supply to list
- [ ] Form resets on success

#### Error Flow
- [ ] Toast shown on error
- [ ] Modal stays open on error
- [ ] Optimistic update rolled back on error
- [ ] Can retry after error

#### Accessibility
- [ ] Modal has proper ARIA attributes
- [ ] Input has associated label
- [ ] Focus returns to trigger on close
- [ ] Error announced to screen readers

---

## Definition of Done

- [ ] `CreateSupplyButton` component created
- [ ] `CreateSupplyModal` component created with form
- [ ] `useCreateSupply` hook implemented with optimistic updates
- [ ] Modal opens/closes correctly
- [ ] Name input is optional with max 100 chars
- [ ] Loading state during mutation
- [ ] Redirect to detail page on success
- [ ] Error toast on failure
- [ ] Optimistic update with rollback
- [ ] All text in Russian
- [ ] Keyboard navigation (Enter, Escape)
- [ ] Focus management working
- [ ] ARIA labels and roles implemented
- [ ] Unit tests passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 53.1-FE | Required | `Supply` type, `createSupply` function |
| Supplies List Page | 53.2-FE | Required | Page where button is placed |

### Backend

| Dependency | Endpoint | Status |
|------------|----------|--------|
| Create Supply | `POST /v1/supplies` | Complete |

---

## Dev Notes

### Source Tree

```
src/
├── app/(dashboard)/supplies/
│   ├── page.tsx                           # Story 53.2-FE
│   └── components/
│       ├── CreateSupplyButton.tsx         # NEW: This story
│       ├── CreateSupplyModal.tsx          # NEW: This story
│       └── SuppliesTable.tsx              # Story 53.2-FE
├── hooks/
│   └── useCreateSupply.ts                 # NEW: This story
├── lib/api/
│   └── supplies.ts                        # Story 53.1-FE
└── types/
    └── supplies.ts                        # Story 53.1-FE
```

### Integration with Supplies List Page

```tsx
// src/app/(dashboard)/supplies/page.tsx
import { CreateSupplyButton } from './components/CreateSupplyButton'

export default function SuppliesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Поставки FBS</h1>
        <CreateSupplyButton />
      </div>
      {/* ... rest of page */}
    </div>
  )
}
```

### Design System Adherence

Per Design Kit and README:
- **Primary Button**: Red background `#E53935`
- **Modal**: Use shadcn/ui Dialog
- **Icons**: Lucide only (Plus, Loader2)
- **Form**: react-hook-form + zod validation
- **Notifications**: sonner toast

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Backend API**: `test-api/16-supplies.http`
- **Supply Detail Page**: [Story 53.4-FE](./story-53.4-fe-supply-detail-page.md)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-29 | 1.0 | Initial story creation | Claude Code (PM Agent) |

---

## Dev Agent Record

_Section for Dev Agent to track implementation progress and decisions_

```
Status: Ready for Dev
Agent:
Started:
Completed:
Notes:
```

---

## QA Results

_Section for QA to document review results_

```
Gate Decision:
Reviewer:
Date:
Quality Score: /100
```
