'use client'

/** Empty state for Shipments list page — Epic 76-FE, Story 76.1 (AC: #1) */

import { Truck, Plus } from 'lucide-react'
import type { RefObject } from 'react'

import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ROUTES } from '@/lib/routes'

interface ShipmentsEmptyStateProps {
  hasSkuPackaging: boolean
  onCreateClick: () => void
  canCreate?: boolean
  createButtonRef?: RefObject<HTMLButtonElement | null>
}

export function ShipmentsEmptyState({
  hasSkuPackaging,
  onCreateClick,
  canCreate = true,
  createButtonRef,
}: ShipmentsEmptyStateProps) {
  const packagingHint = !hasSkuPackaging ? (
    <span>
      Для создания отправки{' '}
      <Link
        href={ROUTES.SHIPMENTS.SKU_PACKAGING}
        className="rounded-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        сначала настройте упаковку товаров
      </Link>
      .
    </span>
  ) : undefined

  return (
    <PageState
      state="empty"
      icon={<Truck className="size-5" />}
      title="Нет отправок"
      explanation="Создайте первую отправку, чтобы рассчитать стоимость доставки и собрать паллеты."
      trust="Фильтры не применены — в текущем кабинете ещё нет отправок."
      context={packagingHint}
      action={
        canCreate ? (
          <Button ref={createButtonRef} onClick={onCreateClick} disabled={!hasSkuPackaging}>
            <Plus className="h-4 w-4 mr-2" />
            Создать отправку
          </Button>
        ) : undefined
      }
    />
  )
}
