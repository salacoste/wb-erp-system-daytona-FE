'use client'

/**
 * Pallet accordion container with add-pallet button
 * Epic 76-FE, Story 76.2 (AC: #4, #5, #6, #7)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useAddPallet, useRemovePallet } from '@/hooks/use-shipment-detail'
import type { Pallet } from '@/types/shipment-cost'
import { BoxLineTable } from './BoxLineTable'
import { PalletAccordionItem } from './PalletAccordionItem'

interface PalletAccordionProps {
  shipmentId: string
  pallets: Pallet[]
  isDraft: boolean
  highlightedLineIds?: string[]
}

export function PalletAccordion({
  shipmentId,
  pallets,
  isDraft,
  highlightedLineIds,
}: PalletAccordionProps) {
  const { mutateAsync: addAsync, isPending: isAdding } = useAddPallet(shipmentId)
  const {
    mutateAsync: removeAsync,
    isPending: isRemoving,
    variables: removingPalletId,
  } = useRemovePallet(shipmentId)
  const [newPalletId, setNewPalletId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  async function handleAdd() {
    setAnnouncement('Добавляем паллету')
    try {
      const pallet = await addAsync()
      setNewPalletId(pallet.id)
      setAnnouncement('Паллета добавлена')
    } catch {
      setAnnouncement('Не удалось добавить паллету')
    }
  }

  async function handleRemove(palletId: string) {
    setAnnouncement('Удаляем паллету')
    try {
      await removeAsync(palletId)
      setAnnouncement('Паллета удалена')
    } catch {
      setAnnouncement('Не удалось удалить паллету')
    }
  }

  return (
    <div className="space-y-4">
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Паллеты ({pallets.length})</h2>
        {isDraft && (
          <Button size="sm" onClick={handleAdd} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-1" />
            {isAdding ? 'Добавление...' : 'Добавить паллету'}
          </Button>
        )}
      </div>

      {pallets.length === 0 ? (
        <p className="text-sm text-muted-foreground">Паллеты ещё не добавлены</p>
      ) : (
        <div className="space-y-2">
          {pallets.map(pallet => (
            <PalletAccordionItem
              key={pallet.id}
              pallet={pallet}
              isDraft={isDraft}
              onRemove={handleRemove}
              isPending={isRemoving && removingPalletId === pallet.id}
              defaultOpen={pallet.id === newPalletId}
            >
              <BoxLineTable
                shipmentId={shipmentId}
                palletId={pallet.id}
                boxLines={pallet.boxLines}
                isDraft={isDraft}
                highlightedLineIds={highlightedLineIds}
              />
            </PalletAccordionItem>
          ))}
        </div>
      )}
    </div>
  )
}
