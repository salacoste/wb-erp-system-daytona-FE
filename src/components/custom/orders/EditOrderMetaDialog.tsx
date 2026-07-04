/**
 * EditOrderMetaDialog — marking-code (Честный ЗНАК) editor for an order.
 * Epic Moysklad, Story O4 (PATCH /v1/orders/:uuid/meta → {updated:true}).
 *
 * Rendered by OrderActionsCell when the operator picks «Код маркировки». The
 * form carries a metaType (IMEI/GTIN/SGTIN/UIN) and a 1–200-char value; both
 * mirror the backend constraint. On save it fires onSave(uuid, {metaType,
 * value}); the mutation invalidates the order's detail + lists.
 *
 * Reference: docs/epics/epic-moysklad-order-management.md (Story O4)
 */

'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ORDER_META_TYPES,
  ORDER_META_TYPE_LABELS,
  type UpdateOrderMetaBody,
  type OrderMetaType,
} from '@/types/orders-actions'
import type { OrderFbsItem } from '@/types/orders'

/** Max marking-code length (matches the backend 1–200 constraint). */
const META_VALUE_MAX = 200

interface EditOrderMetaDialogProps {
  /** The order being edited, or null when closed. */
  order: OrderFbsItem | null
  /** Controlled open state. */
  open: boolean
  /** True while the save mutation is in-flight (disables save + cancel). */
  pending?: boolean
  /** Fires with the order UUID + validated body on save. */
  onSave: (orderUuid: string, body: UpdateOrderMetaBody) => void
  /** Closes the dialog. */
  onClose: () => void
}

/**
 * Marking-code editor dialog.
 */
export function EditOrderMetaDialog({
  order,
  open,
  pending = false,
  onSave,
  onClose,
}: EditOrderMetaDialogProps) {
  const [metaType, setMetaType] = useState<OrderMetaType>('IMEI')
  const [value, setValue] = useState('')

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setMetaType('IMEI')
      setValue('')
    }
  }, [open])

  const trimmed = value.trim()
  const valueError =
    trimmed.length === 0
      ? 'Введите код маркировки'
      : trimmed.length > META_VALUE_MAX
        ? `Максимум ${META_VALUE_MAX} символов`
        : null
  const canSave = !valueError && !pending && !!order

  const handleSave = () => {
    if (!order || !canSave) return
    onSave(order.id, { metaType, value: trimmed })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) onClose()
      }}
    >
      <DialogContent data-testid="edit-order-meta-dialog" onClick={e => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Код маркировки</DialogTitle>
          <DialogDescription>Честный ЗНАК для заказа {order?.orderId ?? ''}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="order-meta-type">Тип</Label>
            <Select value={metaType} onValueChange={v => setMetaType(v as OrderMetaType)}>
              <SelectTrigger id="order-meta-type" data-testid="order-meta-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_META_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {ORDER_META_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-meta-value">Код</Label>
            <Input
              id="order-meta-value"
              value={value}
              onChange={e => setValue(e.target.value)}
              maxLength={META_VALUE_MAX}
              placeholder="Код маркировки"
              aria-invalid={!!valueError}
              data-testid="order-meta-value"
            />
            {valueError && (
              <p className="text-xs text-destructive" role="alert">
                {valueError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending} data-testid="order-meta-cancel">
              Отмена
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!canSave} data-testid="order-meta-save">
            {pending ? 'Сохранение…' : 'Сохранить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
