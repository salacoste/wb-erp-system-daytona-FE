'use client'

/**
 * Box Types CRUD Page
 * Epic 75-FE, Story 75.2: Box Types CRUD Page
 * Route: /shipments/box-types
 */

import { useRef } from 'react'
import { PageHeader } from '@/components/product'
import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  BoxTypesEmptyState,
  BoxTypesTable,
  BoxTypeFormDialog,
  BoxTypeDeactivateDialog,
} from '@/components/custom/box-types'
import { useBoxTypesPageState } from './useBoxTypesPageState'

export default function BoxTypesPage() {
  const stableFocusRef = useRef<HTMLElement>(null)
  const {
    boxTypes,
    isLoading,
    isFetching,
    isError,
    refetch,
    isCreateOpen,
    handleCreate,
    editingBoxType,
    deactivatingBoxType,
    handleEdit,
    handleDeactivate,
    handleFormClose,
    handleDeactivateClose,
    returnFocusRef,
  } = useBoxTypesPageState()

  const header = (
    <PageHeader
      title="Типы коробок"
      description="Справочник габаритов коробок для расчёта стоимости доставки."
      breadcrumbs={[{ label: 'Главная', href: '/dashboard' }, { label: 'Типы коробок' }]}
      busy={isFetching}
      actions={
        !isLoading && !isError && boxTypes.length > 0 ? (
          <Button onClick={event => handleCreate(event.currentTarget)}>
            <Plus aria-hidden="true" className="size-4" />
            Добавить тип коробки
          </Button>
        ) : undefined
      }
    />
  )

  if (isLoading) {
    return (
      <section
        ref={stableFocusRef}
        tabIndex={-1}
        aria-label="Типы коробок"
        className="space-y-6 py-2"
      >
        {header}
        <PageState
          state="loading"
          title="Загружаем типы коробок"
          explanation="Получаем типы коробок текущего кабинета."
          trust="Данные и действия станут доступны после завершения загрузки."
        />
      </section>
    )
  }

  if (isError) {
    return (
      <section
        ref={stableFocusRef}
        tabIndex={-1}
        aria-label="Типы коробок"
        className="space-y-6 py-2"
      >
        {header}
        <PageState
          state="error"
          title="Не удалось загрузить типы коробок"
          explanation="Справочник типов коробок временно недоступен."
          trust="Новые данные не показаны; повторная попытка не изменит справочник."
          context="Проверьте соединение и повторите попытку."
          recovery={
            <Button type="button" variant="outline" disabled={isFetching} onClick={() => refetch()}>
              {isFetching ? 'Повторяем...' : 'Повторить'}
            </Button>
          }
        />
      </section>
    )
  }

  return (
    <section
      ref={stableFocusRef}
      tabIndex={-1}
      aria-label="Типы коробок"
      className="space-y-6 py-2"
    >
      {header}

      {boxTypes.length === 0 ? (
        <BoxTypesEmptyState onCreateClick={handleCreate} />
      ) : (
        <BoxTypesTable boxTypes={boxTypes} onEdit={handleEdit} onDeactivate={handleDeactivate} />
      )}

      <BoxTypeFormDialog
        open={isCreateOpen || !!editingBoxType}
        boxType={editingBoxType}
        onClose={handleFormClose}
        returnFocusRef={returnFocusRef}
        successFocusRef={stableFocusRef}
        focusFallbackOnSuccess={isCreateOpen && boxTypes.length === 0}
      />

      <BoxTypeDeactivateDialog
        boxType={deactivatingBoxType}
        onClose={handleDeactivateClose}
        returnFocusRef={returnFocusRef}
        successFocusRef={stableFocusRef}
      />
    </section>
  )
}
