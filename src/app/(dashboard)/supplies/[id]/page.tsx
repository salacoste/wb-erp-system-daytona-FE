'use client'

/**
 * Supply Detail Page
 * Story 53.4-FE: Supply Detail Page
 * Epic 53-FE: Supply Management UI
 *
 * Dynamic route page for viewing and managing a single supply.
 */

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useSupplyDetail } from '@/hooks/useSupplyDetail'
import { useRemoveOrders } from '@/hooks/useRemoveOrders'
import { downloadDocument } from '@/lib/api/supplies'
import type { DocumentType } from '@/types/supplies'
import { SupplyHeader } from '@/components/custom/supplies/SupplyHeader'
import { SupplyStatusStepper } from '@/components/custom/supplies/SupplyStatusStepper'
import { SupplyOrdersTable } from '@/components/custom/supplies/SupplyOrdersTable'
import { SupplyDocumentsList } from '@/components/custom/supplies/SupplyDocumentsList'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

/** Loading skeleton for the page */
function SupplyDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-32" />

      {/* Header skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Stepper skeleton */}
      <Skeleton className="h-24 w-full" />

      {/* Table skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  )
}

/** Error state component */
function SupplyDetailError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const is404 = error.message?.includes('404') || error.message?.includes('not found')
  const is403 = error.message?.includes('403') || error.message?.includes('forbidden')

  if (is404) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-yellow-500" />
        <h1 className="mb-2 text-2xl font-bold">Поставка не найдена</h1>
        <p className="mb-6 text-gray-500">Поставка не существует или была удалена</p>
        <Link href="/supplies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </Link>
      </div>
    )
  }

  if (is403) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-2xl font-bold">Нет доступа</h1>
        <p className="mb-6 text-gray-500">Нет доступа к этой поставке</p>
        <Link href="/supplies">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться к списку
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Ошибка загрузки</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Не удалось загрузить данные поставки</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  )
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
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
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
