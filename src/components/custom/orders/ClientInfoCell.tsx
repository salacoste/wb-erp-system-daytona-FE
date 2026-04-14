/**
 * ClientInfoCell
 * Story 86.2: Client Info (PII) for FBS Orders — Owner-only cell
 * Extracted from OrdersTableRow in Story 87.3-FE to free up budget for the
 * salePrice anomaly indicator.
 *
 * Renders client name + tel: link, or "—" when no PII available.
 * Phone link uses stopPropagation so clicking it does NOT also open the row modal.
 */

'use client'

import type { ClientInfoItem } from '@/types/orders-client-info'

interface ClientInfoCellProps {
  /** PII for the order (undefined when backend returned no client info for this orderId) */
  info?: ClientInfoItem
}

export function ClientInfoCell({ info }: ClientInfoCellProps) {
  if (!info || (!info.clientName && !info.clientPhone)) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      {info.clientName && <span className="font-medium">{info.clientName}</span>}
      {info.clientPhone && (
        <a
          href={`tel:${info.clientPhone}`}
          className="text-primary hover:underline text-xs"
          onClick={e => e.stopPropagation()}
          aria-label={`Позвонить клиенту по номеру ${info.clientPhone}`}
        >
          {info.clientPhone}
        </a>
      )}
    </div>
  )
}
