'use client'

/**
 * Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Dynamic route page for viewing and managing a single supply.
 * Skeleton and error components extracted for file size compliance (Epic 74).
 */

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useSupplyDetail } from '@/hooks/useSupplyDetail'
import { useRemoveOrders } from '@/hooks/useRemoveOrders'
import { downloadDocument } from '@/lib/api/supplies'
import type { DocumentType } from '@/types/supplies'
import { SupplyHeader } from '@/components/custom/supplies/SupplyHeader'
import { SupplyStatusStepper } from '@/components/custom/supplies/SupplyStatusStepper'
import { SupplyOrdersTable } from '@/components/custom/supplies/SupplyOrdersTable'
import { SupplyDocumentsList } from '@/components/custom/supplies/SupplyDocumentsList'
import { toast } from 'sonner'
import { SupplyDetailSkeleton } from './SupplyDetailSkeleton'
import { SupplyDetailError } from './SupplyDetailError'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function SupplyDetailPage({ params }: PageProps) {
  const { id: supplyId } = use(params)
  const router = useRouter()
  const [downloadingType, setDownloadingType] = useState<string | undefined>()

  const { data: supply, isLoading, error, refetch } = useSupplyDetail(supplyId)
  const removeOrdersMutation = useRemoveOrders(supplyId)

  const handleRemoveOrders = (orderIds: string[]) => {
    removeOrdersMutation.mutate(orderIds)
  }

  const handleDownload = async (docType: string, filename: string) => {
    try {
      setDownloadingType(docType)
      const blob = await downloadDocument(supplyId, docType as DocumentType)
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Документ скачан')
    } catch {
      toast.error('Не удалось скачать документ')
    } finally {
      setDownloadingType(undefined)
    }
  }

  // Placeholder handlers for future stories
  const handleAddOrders = () => {
    // Will open OrderPickerDrawer (Story 53.5-FE)
    toast.info('Добавление заказов скоро будет доступно')
  }

  const handleCloseSupply = () => {
    // Will open CloseSupplyDialog (Story 53.6-FE)
    toast.info('Закрытие поставки скоро будет доступно')
  }

  const handleGenerateStickers = () => {
    // Will open StickerFormatSelector (Story 53.6-FE)
    toast.info('Генерация стикеров скоро будет доступна')
  }

  const handleRefreshStatus = () => {
    refetch()
    toast.success('Статус обновлён')
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
      <div className="container py-6">
        <div className="mb-6">
          <Link
            href="/supplies"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Назад к списку
          </Link>
        </div>
        <SupplyDetailError error={error} onRetry={() => refetch()} />
      </div>
    )
  }

  // No data (shouldn't happen after loading)
  if (!supply) {
    return null
  }

  const showDocuments = ['CLOSED', 'DELIVERING', 'DELIVERED'].includes(supply.status)

  return (
    <div className="container py-6">
      {/* Back navigation */}
      <div className="mb-6">
        <Link
          href="/supplies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Назад к списку
        </Link>
      </div>

      <div className="space-y-6">
        {/* Header */}
        <SupplyHeader
          supply={supply}
          onAddOrders={handleAddOrders}
          onCloseSupply={handleCloseSupply}
          onGenerateStickers={handleGenerateStickers}
          onRefreshStatus={handleRefreshStatus}
          isLoading={removeOrdersMutation.isPending}
        />

        {/* Status stepper */}
        <SupplyStatusStepper status={supply.status} />

        {/* Orders table */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Заказы в поставке ({supply.ordersCount})</h2>
          <SupplyOrdersTable
            orders={supply.orders}
            supplyId={supply.id}
            status={supply.status}
            onRemoveOrder={handleRemoveOrders}
            onOrderClick={order => router.push(`/orders?search=${order.orderId}`)}
            isRemoving={removeOrdersMutation.isPending}
          />
        </div>

        {/* Documents list (only for CLOSED+ statuses) */}
        {showDocuments && (
          <SupplyDocumentsList
            supplyId={supply.id}
            documents={supply.documents}
            onDownload={handleDownload}
            isDownloading={!!downloadingType}
            downloadingType={downloadingType}
          />
        )}
      </div>
    </div>
  )
}
