'use client'

/**
 * Single collapsible pallet item with remove confirmation
 * Epic 76-FE, Story 76.2 (AC: #5, #6, #7)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import type { Pallet } from '@/types/shipment-cost'

interface PalletAccordionItemProps {
  pallet: Pallet
  isDraft: boolean
  onRemove: (palletId: string) => void
  isPending: boolean
  defaultOpen?: boolean
  children?: React.ReactNode
}

export function PalletAccordionItem({
  pallet,
  isDraft,
  onRemove,
  isPending,
  defaultOpen = false,
  children,
}: PalletAccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const boxLineCount = pallet.boxLines.length

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg">
      <div className="flex items-center justify-between px-4 py-3">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium hover:underline"
            aria-label={`Раскрыть паллету ${pallet.palletNumber}`}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Паллета #{pallet.palletNumber}
            <span className="text-muted-foreground font-normal">({boxLineCount} товаров)</span>
          </button>
        </CollapsibleTrigger>

        {isDraft && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Удалить паллету ${pallet.palletNumber}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить паллету #{pallet.palletNumber}?</AlertDialogTitle>
                <AlertDialogDescription>
                  При удалении паллеты будут удалены все товары в ней.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={() => onRemove(pallet.id)} disabled={isPending}>
                  {isPending ? 'Удаление...' : 'Удалить'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <CollapsibleContent className="px-4 pb-3">
        {children ?? <p className="text-sm text-muted-foreground">Товары будут добавлены позже</p>}
      </CollapsibleContent>
    </Collapsible>
  )
}
