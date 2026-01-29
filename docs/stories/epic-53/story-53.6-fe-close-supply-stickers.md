# Story 53.6-FE: Close Supply & Stickers

## Story Info

- **Epic**: 53-FE - Supply Management UI
- **Sprint**: 4 (Mar 17-28, 2026)
- **Priority**: High
- **Points**: 5
- **Status**: Ready for Dev

## User Story

**As a** WB seller managing FBS supplies,
**I want** to close my supply and generate stickers in my preferred format,
**So that** I can print labels for Wildberries delivery.

## Background

After adding orders to a supply, sellers need to:
1. **Close the supply** - Finalizes the supply, preventing further order changes and triggering WB to generate a supply number
2. **Generate stickers** - Create printable labels in various formats for different printer types

This story implements both workflows with appropriate UI components and validations.

---

## Acceptance Criteria

### AC1: Close Supply Button Visibility

- [ ] "Закрыть поставку" button visible only when `status === 'OPEN'`
- [ ] Button hidden for CLOSED, DELIVERING, DELIVERED, CANCELLED statuses
- [ ] Button disabled when `ordersCount === 0`
- [ ] Disabled tooltip: "Добавьте хотя бы один заказ"

### AC2: Close Supply Confirmation Dialog

- [ ] Dialog opens on button click
- [ ] Title: "Закрыть поставку?"
- [ ] Warning message: "После закрытия поставки вы не сможете добавлять или удалять заказы."
- [ ] Orders count displayed: "В поставке: N заказов"
- [ ] Cancel button: "Отмена"
- [ ] Confirm button: "Закрыть поставку" (warning variant)
- [ ] Dialog closes on cancel or backdrop click

### AC3: Close Supply Mutation

- [ ] `useCloseSupply(supplyId)` hook created
- [ ] Calls `POST /v1/supplies/:id/close`
- [ ] Loading state on confirm button
- [ ] Success: toast "Поставка закрыта", status updates to CLOSED
- [ ] Error 400 (empty supply): toast "Невозможно закрыть пустую поставку"
- [ ] Error 409 (already closed): toast "Поставка уже закрыта"
- [ ] Invalidates supply detail query on success

### AC4: Generate Stickers Button Visibility

- [ ] "Сгенерировать стикеры" button visible only when `status === 'CLOSED'`
- [ ] Button hidden for OPEN, DELIVERING, DELIVERED, CANCELLED statuses
- [ ] Primary button style (blue)

### AC5: Stickers Modal Structure

- [ ] Modal opens on button click
- [ ] Title: "Генерация стикеров"
- [ ] Format selector component
- [ ] Preview area (conditional)
- [ ] Cancel button: "Отмена"
- [ ] Download button: "Скачать"
- [ ] Modal closes on cancel or successful download

### AC6: Sticker Format Selector

- [ ] Radio button group with 3 options
- [ ] PNG option: "PNG - для обычных принтеров"
- [ ] SVG option: "SVG - высокое качество"
- [ ] ZPL option: "ZPL - для термопринтеров Zebra"
- [ ] PNG selected by default
- [ ] Selection triggers preview update (PNG/SVG only)

### AC7: Sticker Preview (PNG/SVG)

- [ ] Preview area shows generated sticker image
- [ ] Loading skeleton while generating
- [ ] Image scales to fit container (max-width: 100%, max-height: 300px)
- [ ] Error state: "Не удалось загрузить превью"
- [ ] Retry button on error

### AC8: ZPL Format Handling

- [ ] When ZPL selected, preview area shows info text
- [ ] Info text: "Предпросмотр ZPL недоступен. Этот формат предназначен для термопринтеров Zebra."
- [ ] Info icon displayed
- [ ] Download still works

### AC9: Download Functionality

- [ ] `useGenerateStickers(supplyId)` hook for generation
- [ ] `useDownloadDocument(supplyId, docType)` hook for download
- [ ] Calls `POST /v1/supplies/:id/stickers` with format
- [ ] Then calls `GET /v1/supplies/:id/documents/:type` for download
- [ ] File downloads with appropriate name: `stickers-{supplyId}.{format}`
- [ ] Success toast: "Стикеры скачаны"
- [ ] Loading state on download button

### AC10: Documents List Update

- [ ] After sticker generation, document appears in `SupplyDocumentsList`
- [ ] Query invalidated after successful generation
- [ ] Document row shows format, file size, download button

---

## UI Wireframes

### Close Supply Dialog

```
┌─────────────────────────────────────────┐
│         Закрыть поставку?          [X] │
├─────────────────────────────────────────┤
│                                         │
│ ⚠️ После закрытия поставки вы не       │
│ сможете добавлять или удалять заказы.  │
│                                         │
│ В поставке: 25 заказов                  │
│                                         │
├─────────────────────────────────────────┤
│ [Отмена]           [Закрыть поставку]  │
└─────────────────────────────────────────┘
```

### Generate Stickers Modal

```
┌─────────────────────────────────────────┐
│       Генерация стикеров           [X] │
├─────────────────────────────────────────┤
│                                         │
│ Выберите формат:                        │
│                                         │
│ (●) PNG - для обычных принтеров         │
│ ( ) SVG - высокое качество              │
│ ( ) ZPL - для термопринтеров Zebra      │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │        [Sticker Preview Image]      │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Отмена]                    [Скачать]  │
└─────────────────────────────────────────┘
```

### ZPL Selected State

```
┌─────────────────────────────────────────┐
│       Генерация стикеров           [X] │
├─────────────────────────────────────────┤
│                                         │
│ Выберите формат:                        │
│                                         │
│ ( ) PNG - для обычных принтеров         │
│ ( ) SVG - высокое качество              │
│ (●) ZPL - для термопринтеров Zebra      │
│                                         │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  ℹ️ Предпросмотр ZPL недоступен.   │ │
│ │  Этот формат предназначен для      │ │
│ │  термопринтеров Zebra.             │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Отмена]                    [Скачать]  │
└─────────────────────────────────────────┘
```

---

## Components to Create

| File | Purpose | Lines Est. |
|------|---------|------------|
| `CloseSupplyDialog.tsx` | Confirmation dialog for closing supply | ~80 |
| `GenerateStickersModal.tsx` | Modal with format selection and preview | ~120 |
| `StickerFormatSelector.tsx` | Radio button group for format selection | ~60 |
| `StickerPreview.tsx` | Image preview for PNG/SVG formats | ~100 |
| `DownloadButton.tsx` | Reusable download trigger button | ~40 |

### Component Location

```
src/app/(dashboard)/supplies/[id]/components/
├── CloseSupplyDialog.tsx          # NEW: This story
├── GenerateStickersModal.tsx      # NEW: This story
├── StickerFormatSelector.tsx      # NEW: This story
├── StickerPreview.tsx             # NEW: This story
└── DownloadButton.tsx             # NEW: This story
```

---

## Hooks to Create

| Hook | File Path | Purpose |
|------|-----------|---------|
| `useCloseSupply` | `src/hooks/useCloseSupply.ts` | Close supply mutation |
| `useGenerateStickers` | `src/hooks/useGenerateStickers.ts` | Generate stickers mutation |
| `useStickerPreview` | `src/hooks/useStickerPreview.ts` | Fetch sticker preview |

**Note**: `useDownloadDocument` hook already exists from Story 53.4-FE.

---

## API Integration

### Close Supply

```typescript
POST /v1/supplies/{id}/close
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}

Response (200):
{
  "data": {
    "id": "sup_123abc",
    "status": "CLOSED",
    "closedAt": "2026-03-20T14:30:00Z",
    "supplyNumber": "WB-12345678"
  }
}

Error (400):
{
  "error": {
    "code": "EMPTY_SUPPLY",
    "message": "Cannot close supply with no orders"
  }
}

Error (409):
{
  "error": {
    "code": "ALREADY_CLOSED",
    "message": "Supply is already closed"
  }
}
```

### Generate Stickers

```typescript
POST /v1/supplies/{id}/stickers
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}
Content-Type: application/json

Request:
{
  "format": "png" | "svg" | "zpl"
}

Response (200):
{
  "data": {
    "documentId": "doc_abc123",
    "format": "png",
    "size": 125000,
    "createdAt": "2026-03-20T14:35:00Z"
  }
}
```

### Download Document

```typescript
GET /v1/supplies/{id}/documents/{type}
Authorization: Bearer {token}
X-Cabinet-Id: {cabinetId}

Response: Binary file (image/png, image/svg+xml, or application/octet-stream)
Content-Disposition: attachment; filename="stickers-sup_123abc.png"
```

---

## Technical Implementation

### useCloseSupply Hook

```typescript
// src/hooks/useCloseSupply.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { closeSupply } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'

export function useCloseSupply(supplyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => closeSupply(supplyId),
    onSuccess: (data) => {
      toast.success('Поставка закрыта')
      queryClient.setQueryData(
        suppliesQueryKeys.detail(supplyId),
        (old: any) => ({
          ...old,
          status: 'CLOSED',
          closedAt: data.closedAt,
          supplyNumber: data.supplyNumber,
        })
      )
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.all
      })
    },
    onError: (error: any) => {
      const code = error?.response?.data?.error?.code
      if (code === 'EMPTY_SUPPLY') {
        toast.error('Невозможно закрыть пустую поставку')
      } else if (code === 'ALREADY_CLOSED') {
        toast.error('Поставка уже закрыта')
      } else {
        toast.error('Не удалось закрыть поставку')
      }
    },
  })
}
```

### useGenerateStickers Hook

```typescript
// src/hooks/useGenerateStickers.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateStickers } from '@/lib/api/supplies'
import { suppliesQueryKeys } from '@/lib/api/supplies'
import { toast } from 'sonner'
import type { StickerFormat } from '@/types/supplies'

export function useGenerateStickers(supplyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (format: StickerFormat) =>
      generateStickers(supplyId, format),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: suppliesQueryKeys.detail(supplyId)
      })
    },
    onError: () => {
      toast.error('Не удалось сгенерировать стикеры')
    },
  })
}
```

### CloseSupplyDialog Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/CloseSupplyDialog.tsx
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useCloseSupply } from '@/hooks/useCloseSupply'

interface CloseSupplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplyId: string
  ordersCount: number
}

export function CloseSupplyDialog({
  open,
  onOpenChange,
  supplyId,
  ordersCount,
}: CloseSupplyDialogProps) {
  const { mutate: closeSupply, isPending } = useCloseSupply(supplyId)

  const handleClose = () => {
    closeSupply(undefined, {
      onSuccess: () => onOpenChange(false),
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Закрыть поставку?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-start gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>
                После закрытия поставки вы не сможете добавлять
                или удалять заказы.
              </span>
            </div>
            <div className="text-foreground font-medium">
              В поставке: {ordersCount} заказов
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClose}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Закрыть поставку
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### StickerFormatSelector Component

```typescript
// src/app/(dashboard)/supplies/[id]/components/StickerFormatSelector.tsx
'use client'

import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { StickerFormat } from '@/types/supplies'

const FORMAT_OPTIONS = [
  {
    value: 'png' as StickerFormat,
    label: 'PNG - для обычных принтеров',
  },
  {
    value: 'svg' as StickerFormat,
    label: 'SVG - высокое качество',
  },
  {
    value: 'zpl' as StickerFormat,
    label: 'ZPL - для термопринтеров Zebra',
  },
] as const

interface StickerFormatSelectorProps {
  value: StickerFormat
  onChange: (format: StickerFormat) => void
  disabled?: boolean
}

export function StickerFormatSelector({
  value,
  onChange,
  disabled,
}: StickerFormatSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Выберите формат:</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as StickerFormat)}
        disabled={disabled}
        className="space-y-2"
      >
        {FORMAT_OPTIONS.map((option) => (
          <div key={option.value} className="flex items-center space-x-2">
            <RadioGroupItem value={option.value} id={option.value} />
            <Label htmlFor={option.value} className="font-normal cursor-pointer">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
```

---

## Sticker Format Reference

| Format | MIME Type | Extension | Preview | Use Case |
|--------|-----------|-----------|---------|----------|
| PNG | `image/png` | `.png` | Yes | Standard inkjet/laser printers |
| SVG | `image/svg+xml` | `.svg` | Yes | High quality, scalable printing |
| ZPL | `application/octet-stream` | `.zpl` | No | Zebra thermal label printers |

---

## Error Handling

| HTTP Status | Error Code | Message (Russian) | Action |
|-------------|------------|-------------------|--------|
| 400 | EMPTY_SUPPLY | "Невозможно закрыть пустую поставку" | Toast error |
| 400 | INVALID_FORMAT | "Неверный формат стикера" | Toast error |
| 401 | UNAUTHORIZED | "Сессия истекла" | Redirect to login |
| 403 | FORBIDDEN | "Нет доступа к этой поставке" | Toast error |
| 404 | NOT_FOUND | "Поставка не найдена" | Toast error |
| 409 | ALREADY_CLOSED | "Поставка уже закрыта" | Toast error |
| 409 | WRONG_STATUS | "Стикеры доступны только для закрытых поставок" | Toast error |
| 500 | SERVER_ERROR | "Ошибка сервера" | Toast error, retry |

---

## Testing

### Framework & Location

- **Framework**: Vitest + React Testing Library
- **Test Location**: `src/app/(dashboard)/supplies/[id]/components/__tests__/`

### Test Cases

#### CloseSupplyDialog
- [ ] Dialog opens when `open={true}`
- [ ] Shows orders count correctly
- [ ] Cancel button closes dialog
- [ ] Confirm button calls mutation
- [ ] Loading state shows spinner
- [ ] Dialog closes on success
- [ ] Error toast on failure

#### StickerFormatSelector
- [ ] All 3 formats rendered
- [ ] PNG selected by default
- [ ] Selection change triggers onChange
- [ ] Disabled state works

#### StickerPreview
- [ ] Shows loading skeleton initially
- [ ] Displays image for PNG/SVG
- [ ] Shows info message for ZPL
- [ ] Error state with retry button

#### GenerateStickersModal
- [ ] Modal opens correctly
- [ ] Format selection works
- [ ] Preview updates on format change
- [ ] Download button triggers mutation
- [ ] Modal closes after download
- [ ] Cancel button closes modal

#### useCloseSupply Hook
- [ ] Calls correct endpoint
- [ ] Updates cache on success
- [ ] Shows correct error messages
- [ ] Invalidates queries

#### useGenerateStickers Hook
- [ ] Calls endpoint with format
- [ ] Invalidates detail query on success
- [ ] Handles errors correctly

---

## Definition of Done

- [ ] `CloseSupplyDialog` component created (~80 lines)
- [ ] `GenerateStickersModal` component created (~120 lines)
- [ ] `StickerFormatSelector` component created (~60 lines)
- [ ] `StickerPreview` component created (~100 lines)
- [ ] `DownloadButton` component created (~40 lines)
- [ ] `useCloseSupply` hook implemented
- [ ] `useGenerateStickers` hook implemented
- [ ] `useStickerPreview` hook implemented
- [ ] Close button visible only for OPEN status
- [ ] Close button disabled when ordersCount === 0
- [ ] Confirmation dialog with warning
- [ ] Generate stickers button visible only for CLOSED status
- [ ] Format selector with 3 options (PNG, SVG, ZPL)
- [ ] Preview for PNG/SVG formats
- [ ] Info text for ZPL format
- [ ] Download functionality works
- [ ] Documents list updated after generation
- [ ] All text in Russian
- [ ] Mobile responsive
- [ ] WCAG 2.1 AA compliant
- [ ] Unit tests passing (>70% coverage)
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] File size <200 lines per component
- [ ] Code review approved

---

## Dependencies

### Required (Blocking)

| Dependency | Story | Status | Notes |
|------------|-------|--------|-------|
| Types & API Client | 53.1-FE | Required | StickerFormat type |
| Supply Detail Page | 53.4-FE | Required | Integration point |
| useDownloadDocument | 53.4-FE | Required | Download hook |

### Backend

| Dependency | Endpoint | Status |
|------------|----------|--------|
| Close Supply | `POST /v1/supplies/:id/close` | Complete |
| Generate Stickers | `POST /v1/supplies/:id/stickers` | Complete |
| Download Document | `GET /v1/supplies/:id/documents/:type` | Complete |

---

## Integration Points

### SupplyHeader Integration

```typescript
// In SupplyHeader.tsx, add Close button
{supply.status === 'OPEN' && (
  <Button
    variant="outline"
    onClick={() => setCloseDialogOpen(true)}
    disabled={supply.ordersCount === 0}
    title={supply.ordersCount === 0 ? 'Добавьте хотя бы один заказ' : undefined}
  >
    Закрыть поставку
  </Button>
)}

{supply.status === 'CLOSED' && (
  <Button onClick={() => setStickersModalOpen(true)}>
    Сгенерировать стикеры
  </Button>
)}
```

---

## Dev Notes

### Source Tree

```
src/
├── app/(dashboard)/supplies/[id]/
│   ├── page.tsx                          # Story 53.4-FE
│   └── components/
│       ├── SupplyHeader.tsx              # Story 53.4-FE (update)
│       ├── CloseSupplyDialog.tsx         # NEW: This story
│       ├── GenerateStickersModal.tsx     # NEW: This story
│       ├── StickerFormatSelector.tsx     # NEW: This story
│       ├── StickerPreview.tsx            # NEW: This story
│       └── DownloadButton.tsx            # NEW: This story
├── hooks/
│   ├── useCloseSupply.ts                 # NEW: This story
│   ├── useGenerateStickers.ts            # NEW: This story
│   ├── useStickerPreview.ts              # NEW: This story
│   └── useDownloadDocument.ts            # Story 53.4-FE
├── lib/api/
│   └── supplies.ts                       # Story 53.1-FE (add functions)
└── types/
    └── supplies.ts                       # Story 53.1-FE (StickerFormat)
```

### Design System Adherence

- **Dialog**: Use `AlertDialog` from shadcn/ui for close confirmation
- **Modal**: Use `Dialog` from shadcn/ui for stickers modal
- **Radio Group**: Use `RadioGroup` from shadcn/ui
- **Colors**: Orange for warning actions, Blue for primary actions
- **Icons**: Lucide only (AlertTriangle, Info, Download, Loader2)

---

## Related

- **Parent Epic**: [Epic 53-FE: Supply Management UI](../../epics/epic-53-fe-supply-management.md)
- **Supply Detail**: [Story 53.4-FE](./story-53.4-fe-supply-detail-page.md)
- **Order Picker**: [Story 53.5-FE](./story-53.5-fe-order-picker-drawer.md)
- **Status Polling**: [Story 53.7-FE](./story-53.7-fe-status-polling-sync.md)
- **Backend API**: `test-api/16-supplies.http`

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
