'use client'

/**
 * Single МС mapping table row.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 * AP#8: pending row → «не привязан» + «Привязать» button; null price → «—».
 */

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCogsCost, formatDate } from '@/lib/formatters'
import type { MoyskladMatchStrategy, MoyskladProductMapping } from '@/types/moysklad'

interface MoyskladMappingRowProps {
  mapping: MoyskladProductMapping
  onLink: (mapping: MoyskladProductMapping) => void
}

/** Human label for the match strategy. */
const MATCH_LABEL: Record<MoyskladMatchStrategy, string> = {
  VENDOR_CODE: 'По артикулу',
  BARCODE: 'Штрихкод',
  MANUAL: 'Вручную',
}

/** Badge label for the МС assortment kind. NULL type → «неизвестный тип». */
function typeLabel(type: MoyskladProductMapping['moyskladType']): string {
  if (type === 'VARIANT') return 'Модиф.'
  if (type === 'PRODUCT') return 'Товар'
  return 'неизвестный тип'
}

export function MoyskladMappingRow({ mapping, onLink }: MoyskladMappingRowProps) {
  const isPending = mapping.nmId == null
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            {typeLabel(mapping.moyskladType)}
          </Badge>
          <span className="font-medium truncate max-w-[20rem]">{mapping.moyskladName ?? '—'}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{mapping.moyskladArticle ?? '—'}</TableCell>
      <TableCell>
        {isPending ? (
          <span className="text-muted-foreground">не привязан</span>
        ) : (
          <span>{mapping.nmId}</span>
        )}
      </TableCell>
      <TableCell>
        {mapping.matchedBy ? (
          <Badge variant="secondary">{MATCH_LABEL[mapping.matchedBy]}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{formatCogsCost(mapping.buyPriceRub)}</TableCell>
      <TableCell className="text-muted-foreground">
        {mapping.lastSyncedAt ? formatDate(mapping.lastSyncedAt) : '—'}
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant={isPending ? 'default' : 'outline'}
          size="sm"
          onClick={() => onLink(mapping)}
          aria-label={
            isPending ? 'Привязать товар' : `Перепривязать (текущий nmId ${mapping.nmId})`
          }
        >
          {isPending ? 'Привязать' : 'Изменить'}
        </Button>
      </TableCell>
    </TableRow>
  )
}
