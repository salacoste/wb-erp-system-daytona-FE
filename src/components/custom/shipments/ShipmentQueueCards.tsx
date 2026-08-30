import { Eye } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { buildShipmentDetailRoute } from '@/lib/routes'
import { formatDate } from '@/lib/utils'
import type { Shipment } from '@/types/shipment-cost'

import { ShipmentStatusBadge } from './ShipmentStatusBadge'
import { DELIVERY_MODE_LABELS } from './shipments-columns'

export function shipmentIdentity(shipment: Shipment): string {
  return shipment.name?.trim() || `Отправка ${shipment.id}`
}

export function ShipmentQueueCards({ shipments }: { shipments: Shipment[] }) {
  return (
    <ul className="space-y-3">
      {shipments.map(shipment => {
        const identity = shipmentIdentity(shipment)

        return (
          <li key={shipment.id}>
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="break-words font-semibold">{identity}</h3>
                  {!shipment.name?.trim() && (
                    <p className="text-sm text-muted-foreground">Название не указано</p>
                  )}
                  <ShipmentStatusBadge status={shipment.status} />
                </div>

                <dl className="grid min-w-0 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Дата создания</dt>
                    <dd className="font-medium">{formatDate(shipment.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Способ доставки</dt>
                    <dd className="break-words font-medium">
                      {DELIVERY_MODE_LABELS[shipment.deliveryMode] ?? 'Не указан'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Паллет</dt>
                    <dd className="font-medium tabular-nums">{shipment.pallets.length}</dd>
                  </div>
                </dl>

                <Button asChild variant="outline" className="min-h-11 w-full whitespace-normal">
                  <Link
                    href={buildShipmentDetailRoute(shipment.id)}
                    aria-label={`Открыть отправку «${identity}»`}
                  >
                    <Eye aria-hidden="true" className="size-4" />
                    Открыть отправку
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}
