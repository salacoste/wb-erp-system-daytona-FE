'use client'

/**
 * Single МС mapping table row.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 * AP#8: pending row → «не привязан» + «Привязать» button; null price → «—».
 *
 * M5 — COGS-recalc visibility:
 *  - Matched nmId wraps in a drill-through <Link> to /analytics/product/<nmId>
 *    (FR-7 product page; mirrors PerformanceMetricsTable's link style).
 *  - Recently-linked rows with a buy price show the «себестоимость обновлена» badge.
 */

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatCogsCost, formatDate } from '@/lib/formatters'
import { ROUTES } from '@/lib/routes'
import type { MoyskladMatchStrategy, MoyskladProductMapping } from '@/types/moysklad'
import { CogsRecalcBadge } from './CogsRecalcBadge'

interface MoyskladMappingRowProps {
  mapping: MoyskladProductMapping
  onLink: (mapping: MoyskladProductMapping) => void
  /** True when this row was linked this session (badge signal). */
  isRecent?: boolean
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

export function MoyskladMappingRow({ mapping, onLink, isRecent = false }: MoyskladMappingRowProps) {
  const isPending = mapping.nmId == null
  // Badge only on rows that carry a buy price (AP#8: null price → no badge).
  const showRecalcBadge = isRecent && mapping.buyPriceRub != null
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
          <Link
            href={`${ROUTES.ANALYTICS.PRODUCT}/${mapping.nmId}`}
            className="text-blue-600 hover:underline flex items-center gap-1"
          >
            {/* Opaque ID rendered as-is (anti-pattern #10: no formatNumber). */}
            {String(mapping.nmId)}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </TableCell>
      <TableCell>
        {mapping.matchedBy ? (
          <Badge variant="secondary">{MATCH_LABEL[mapping.matchedBy]}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {formatCogsCost(mapping.buyPriceRub)}
          {showRecalcBadge && <CogsRecalcBadge />}
        </div>
      </TableCell>
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
