'use client'

/**
 * Link-mapping dialog — wraps ProductCombobox (WB product picker) to manually
 * link a МС assortment to a WB nmId. POST /mappings/:id/link writes to OUR DB only.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 */

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProductCombobox } from '@/app/(dashboard)/analytics/search/components/ProductCombobox'
import { useLinkMapping } from '@/hooks/useMoyskladQueries'
import type { MoyskladProductMapping } from '@/types/moysklad'

interface LinkMappingDialogProps {
  mapping: MoyskladProductMapping | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkMappingDialog({ mapping, open, onOpenChange }: LinkMappingDialogProps) {
  const [nmId, setNmId] = useState<number | undefined>(undefined)
  const [confirmed, setConfirmed] = useState(false)
  const linkMutation = useLinkMapping()

  const alreadyMatched = !!mapping?.nmId
  // For an already-matched row, require an explicit confirm step before allowing link.
  const needsConfirm = alreadyMatched && !confirmed

  const reset = () => {
    setNmId(undefined)
    setConfirmed(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleConfirm = () => {
    if (!mapping || !nmId) return
    linkMutation.mutate(
      { id: mapping.id, nmId },
      {
        onSuccess: () => {
          toast.success('Привязано')
          reset()
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Не удалось привязать')
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Привязать товар WB</DialogTitle>
          <DialogDescription>
            {mapping?.moyskladName ?? 'МойСклад товар'}
            {mapping?.moyskladArticle ? ` · артик. ${mapping.moyskladArticle}` : ''}
          </DialogDescription>
        </DialogHeader>

        {needsConfirm ? (
          <p className="text-sm text-muted-foreground">
            Уже привязан к nmId {mapping?.nmId}. Перепривязать?
          </p>
        ) : (
          <ProductCombobox value={nmId} onChange={setNmId} />
        )}

        <DialogFooter>
          {needsConfirm ? (
            <Button type="button" onClick={() => setConfirmed(true)}>
              Продолжить
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!nmId || linkMutation.isPending}
            >
              {linkMutation.isPending ? 'Сохранение…' : 'Привязать'}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
