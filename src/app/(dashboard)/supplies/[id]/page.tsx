'use client'

/**
 * Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Dynamic route page for viewing and managing a single supply.
 * Skeleton and error components extracted for file size compliance (Epic 74).
 */

import { use, useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { PageState } from '@/components/product/states/PageState'
import { useSupplyDetail } from '@/hooks/useSupplyDetail'
import { useRemoveOrders } from '@/hooks/useRemoveOrders'
import { SupplyHeader } from '@/components/custom/supplies/SupplyHeader'
import { SupplyStatusStepper } from '@/components/custom/supplies/SupplyStatusStepper'
import { SupplyOrdersTable } from '@/components/custom/supplies/SupplyOrdersTable'
import {
  SupplyDocumentsList,
  useSupplyDocumentDownload,
} from '@/components/custom/supplies/SupplyDocumentsList'
import { OrderPickerDrawer } from '@/components/custom/supplies/OrderPickerDrawer'
import { CloseSupplyDialog } from '@/components/custom/supplies/CloseSupplyDialog'
import { GenerateStickersModal } from '@/components/custom/supplies/GenerateStickersModal'
import { AcceptanceActSection } from '@/components/custom/supplies/AcceptanceActSection'
import { useUploadAcceptanceAct, useDownloadAcceptanceAct } from '@/hooks/useAcceptanceAct'
import { toast } from 'sonner'
import {
  SupplyDetailAnnouncements,
  SupplyDetailRouteHeader,
  SupplyDetailSkeleton,
} from './SupplyDetailSkeleton'
import { SupplyDetailError } from './SupplyDetailError'

interface PageProps {
  params: Promise<{ id: string }>
}

type Announcement = { message: string; channel: 0 | 1 }

export default function SupplyDetailPage({ params }: PageProps) {
  const { id: supplyId } = use(params)
  const router = useRouter()
  const [isOrderPickerOpen, setIsOrderPickerOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const [isStickersModalOpen, setIsStickersModalOpen] = useState(false)
  const [announcement, setAnnouncement] = useState<Announcement>({ message: '', channel: 0 })
  const announce = useCallback((message: string) => {
    setAnnouncement(previous => ({
      message,
      channel: previous.channel === 0 ? 1 : 0,
    }))
  }, [])
  const { downloadDocument, downloadingType } = useSupplyDocumentDownload(supplyId, announce)

  const { data: supply, isLoading, error, refetch } = useSupplyDetail(supplyId)
  const removeOrdersMutation = useRemoveOrders(supplyId)
  // Story O5: acceptance-act upload/download.
  const uploadAcceptanceActMutation = useUploadAcceptanceAct()
  const downloadAcceptanceActMutation = useDownloadAcceptanceAct()

  const handleRemoveOrders = (orderIds: string[], onSuccess: () => void) => {
    removeOrdersMutation.mutate(orderIds, { onSuccess })
  }

  const handleRefreshStatus = async () => {
    try {
      const result = await refetch()
      if (result.error) throw result.error
      toast.success('Статус обновлён')
      announce('Статус поставки обновлён')
    } catch {
      toast.error('Не удалось обновить статус')
      announce('Не удалось обновить статус поставки')
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container py-6">
        <SupplyDetailSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container space-y-6 py-6">
        <SupplyDetailRouteHeader />
        <SupplyDetailError error={error} onRetry={() => refetch()} />
      </div>
    )
  }

  // No data (shouldn't happen after loading)
  if (!supply) {
    return (
      <div className="container space-y-6 py-6">
        <SupplyDetailRouteHeader />
        <PageState
          state="not-found"
          title="Поставка не найдена"
          explanation="Сервис не вернул данные для указанной поставки."
          trust="Данные других поставок не затронуты."
          action={
            <Button asChild variant="outline">
              <Link href="/supplies">Вернуться к списку</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const showDocuments = ['CLOSED', 'DELIVERING', 'DELIVERED'].includes(supply.status)
  const hasPartialOrders = supply.ordersCount > supply.orders.length
  // Story O5: stored acceptance-act doc (if any).
  const storedAcceptanceAct = supply.documents.find(d => d.type === 'acceptance_act') ?? null

  return (
    <div className="container space-y-6 py-6">
      <SupplyDetailRouteHeader busy={removeOrdersMutation.isPending} />
      <SupplyDetailAnnouncements {...announcement} />

      <div className="space-y-6">
        {/* Header */}
        <SupplyHeader
          supply={supply}
          onAddOrders={() => setIsOrderPickerOpen(true)}
          onCloseSupply={() => setIsCloseDialogOpen(true)}
          onGenerateStickers={() => setIsStickersModalOpen(true)}
          onRefreshStatus={handleRefreshStatus}
          isLoading={removeOrdersMutation.isPending}
        />

        {/* Status stepper */}
        <SupplyStatusStepper status={supply.status} />

        {/* Orders table */}
        {hasPartialOrders ? (
          <PageState
            state="partial"
            title={`Заказы в поставке (${supply.ordersCount})`}
            explanation="Доступная часть состава показана ниже."
            trust="Действия применяются только к загруженным заказам."
            limitation={`Загружено ${supply.orders.length} из ${supply.ordersCount} заказов.`}
          >
            <SupplyOrdersTable
              orders={supply.orders}
              supplyId={supply.id}
              status={supply.status}
              onRemoveOrder={handleRemoveOrders}
              onOrderClick={order => router.push(`/orders?search=${order.orderId}`)}
              isRemoving={removeOrdersMutation.isPending}
            />
          </PageState>
        ) : (
          <section aria-labelledby="supply-orders-title">
            <h2 id="supply-orders-title" className="mb-4 text-lg font-semibold">
              Заказы в поставке ({supply.ordersCount})
            </h2>
            <SupplyOrdersTable
              orders={supply.orders}
              supplyId={supply.id}
              status={supply.status}
              onRemoveOrder={handleRemoveOrders}
              onOrderClick={order => router.push(`/orders?search=${order.orderId}`)}
              isRemoving={removeOrdersMutation.isPending}
            />
          </section>
        )}

        {/* Documents list (only for CLOSED+ statuses) */}
        {showDocuments && (
          <SupplyDocumentsList
            supplyId={supply.id}
            documents={supply.documents}
            onDownload={downloadDocument}
            isDownloading={!!downloadingType}
            downloadingType={downloadingType}
          />
        )}

        {/* Story O5: acceptance-act upload/download */}
        <AcceptanceActSection
          storedAct={storedAcceptanceAct}
          uploadPending={uploadAcceptanceActMutation.isPending}
          downloadPending={downloadAcceptanceActMutation.isPending}
          onUpload={file => uploadAcceptanceActMutation.mutate({ supplyId, file })}
          onDownload={() =>
            downloadAcceptanceActMutation.mutate({
              supplyId,
              filename: `acceptance-act-${supplyId}.${storedAcceptanceAct?.format ?? 'xlsx'}`,
            })
          }
        />
      </div>

      <OrderPickerDrawer
        supplyId={supply.id}
        isOpen={isOrderPickerOpen}
        onClose={() => setIsOrderPickerOpen(false)}
        onSuccess={() => {
          void refetch()
        }}
      />

      <CloseSupplyDialog
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
        supplyId={supply.id}
        ordersCount={supply.ordersCount}
        onSuccess={() => {
          void refetch()
        }}
      />

      <GenerateStickersModal
        open={isStickersModalOpen}
        onOpenChange={setIsStickersModalOpen}
        supplyId={supply.id}
      />
    </div>
  )
}
