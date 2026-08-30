'use client'

/**
 * Shipments List Page
 * Epic 76-FE, Story 76.1: Shipment Planning & Cost Calculation
 * Route: /shipments
 */

import { useRef } from 'react'
import { Plus } from 'lucide-react'

import { PageHeader } from '@/components/product'
import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import { useSkuPackaging } from '@/hooks/use-sku-packaging'
import { canManageOperationalData } from '@/lib/role-permissions'
import { useAuthStore } from '@/stores/authStore'
import {
  ShipmentsEmptyState,
  ShipmentsTable,
  CreateShipmentDialog,
} from '@/components/custom/shipments'
import { useShipmentsPageState } from './useShipmentsPageState'

export default function ShipmentsPage() {
  const createButtonRef = useRef<HTMLButtonElement>(null)
  const {
    shipments,
    total,
    page,
    limit,
    statusFilter,
    sortOrder,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    handleStatusChange,
    handlePageChange,
    handleLimitChange,
    handleSortToggle,
  } = useShipmentsPageState()

  const userRole = useAuthStore(state => state.user?.role)
  const canManageShipments = canManageOperationalData(userRole)
  const { data: skuPackaging } = useSkuPackaging()
  const hasSkuPackaging = (skuPackaging?.length ?? 0) > 0

  const header = (
    <PageHeader
      title="Отправки"
      description="Очередь отправок по жизненному циклу, способу доставки и дате создания."
      breadcrumbs={[{ label: 'Главная', href: '/dashboard' }, { label: 'Отправки' }]}
      busy={isFetching}
      actions={
        canManageShipments && shipments.length > 0 ? (
          <Button ref={createButtonRef} onClick={() => setIsCreateOpen(true)}>
            <Plus aria-hidden="true" className="size-4" />
            Создать отправку
          </Button>
        ) : undefined
      }
    />
  )

  if (isLoading) {
    return (
      <section aria-label="Очередь отправок" className="space-y-6 py-2">
        {header}
        <PageState
          state="loading"
          title="Загружаем отправки"
          explanation="Получаем актуальную очередь отправок текущего кабинета."
          trust="Фильтры и действия станут доступны после завершения загрузки."
        />
      </section>
    )
  }

  if (isError && shipments.length === 0) {
    return (
      <section aria-label="Очередь отправок" className="space-y-6 py-2">
        {header}
        <PageState
          state="error"
          title="Не удалось загрузить отправки"
          explanation={error instanceof Error ? error.message : 'Ошибка загрузки отправок'}
          trust="Новые данные не показаны; повторная попытка не изменит отправки."
          recovery={
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section aria-label="Очередь отправок" className="space-y-6 py-2">
      {header}

      {shipments.length === 0 && !statusFilter ? (
        <ShipmentsEmptyState
          hasSkuPackaging={hasSkuPackaging}
          onCreateClick={() => setIsCreateOpen(true)}
          canCreate={canManageShipments}
          createButtonRef={createButtonRef}
        />
      ) : isError ? (
        <PageState
          state="stale"
          title="Показаны ранее загруженные отправки"
          explanation="Фоновое обновление очереди завершилось ошибкой."
          trust="Сохранённые строки доступны для просмотра, но могли устареть."
          limitation={error instanceof Error ? error.message : 'Не удалось обновить отправки'}
        >
          <ShipmentsTable
            shipments={shipments}
            total={total}
            page={page}
            limit={limit}
            statusFilter={statusFilter}
            sortOrder={sortOrder}
            onStatusChange={handleStatusChange}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onSortToggle={handleSortToggle}
          />
        </PageState>
      ) : (
        <ShipmentsTable
          shipments={shipments}
          total={total}
          page={page}
          limit={limit}
          statusFilter={statusFilter}
          sortOrder={sortOrder}
          busy={isFetching}
          onStatusChange={handleStatusChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          onSortToggle={handleSortToggle}
        />
      )}

      {canManageShipments && (
        <CreateShipmentDialog
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          returnFocusRef={createButtonRef}
        />
      )}
    </section>
  )
}
