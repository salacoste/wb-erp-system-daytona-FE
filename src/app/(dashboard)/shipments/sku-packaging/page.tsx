'use client'

import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/product'
import { PageState } from '@/components/product/states'
import { Button } from '@/components/ui/button'
import {
  BulkAddDialog,
  SkuPackagingDeleteDialog,
  SkuPackagingEmptyState,
  SkuPackagingFilterToolbar,
  SkuPackagingFormDialog,
  SkuPackagingTable,
} from '@/components/custom/sku-packaging'
import { useSkuPackagingPageState } from './useSkuPackagingPageState'

export default function SkuPackagingPage() {
  const stableFocusRef = useRef<HTMLElement>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const [resultAnnouncement, setResultAnnouncement] = useState('')
  const state = useSkuPackagingPageState()
  const openCreate = (trigger: HTMLButtonElement) => {
    setResultAnnouncement('')
    state.handleCreate(trigger)
  }
  const openBulk = (trigger: HTMLButtonElement) => {
    setResultAnnouncement('')
    state.handleBulk(trigger)
  }
  const resetFilter = () => {
    state.clearQuery()
    window.setTimeout(() => filterInputRef.current?.focus(), 0)
  }
  const header = (
    <PageHeader
      title="Упаковка товаров"
      description="Привязки SKU к типам коробок и количеству единиц в упаковке."
      breadcrumbs={[{ label: 'Главная', href: '/dashboard' }, { label: 'Упаковка товаров' }]}
      busy={state.isFetching}
      actions={
        !state.isLoading && !state.isError && !state.isBoxTypesError && state.items.length > 0 ? (
          <>
            <Button variant="outline" onClick={event => openBulk(event.currentTarget)}>
              Массовое добавление
            </Button>
            <Button onClick={event => openCreate(event.currentTarget)}>
              <Plus aria-hidden="true" className="size-4" />
              Добавить упаковку
            </Button>
          </>
        ) : undefined
      }
    />
  )
  let content
  if (state.isLoading)
    content = (
      <PageState
        state="loading"
        title="Загружаем привязки упаковки"
        explanation="Получаем привязки SKU и доступные типы коробок текущего кабинета."
        trust="Данные и действия станут доступны после завершения загрузки."
      />
    )
  else if (state.isError)
    content = (
      <PageState
        state="error"
        title="Не удалось загрузить привязки упаковки"
        explanation="Список привязок временно недоступен."
        trust="Непроверенные данные не показаны."
        recovery={
          <Button variant="outline" disabled={state.isFetching} onClick={() => state.refetch()}>
            {state.isFetching ? 'Повторяем...' : 'Повторить'}
          </Button>
        }
      />
    )
  else if (state.isBoxTypesError)
    content = (
      <PageState
        state="error"
        title="Не удалось проверить типы коробок"
        explanation="Действия с упаковкой недоступны, пока справочник типов коробок не загружен."
        trust="Существующие привязки не изменены."
        recovery={
          <Button variant="outline" onClick={() => state.refetchBoxTypes()}>
            Повторить
          </Button>
        }
      />
    )
  else if (state.items.length === 0)
    content = <SkuPackagingEmptyState hasBoxTypes={state.hasBoxTypes} onCreateClick={openCreate} />
  else
    content = (
      <>
        <SkuPackagingFilterToolbar
          query={state.query}
          total={state.filteredItems.length}
          empty={state.filteredItems.length === 0}
          busy={state.isFetching}
          onQueryChange={state.setQuery}
          onReset={resetFilter}
          inputRef={filterInputRef}
        />
        {state.filteredItems.length === 0 ? (
          <PageState
            state="filtered-empty"
            title="По фильтру ничего не найдено"
            explanation="Измените поисковый запрос или покажите все привязки."
            trust="Исходный список не изменён."
            scope={`Поиск: «${state.query.trim()}»`}
            resetAction={<Button onClick={resetFilter}>Показать все привязки</Button>}
          />
        ) : (
          <SkuPackagingTable
            items={state.filteredItems}
            onEdit={(item, trigger) => {
              setResultAnnouncement('')
              state.handleEdit(item, trigger)
            }}
            onDelete={(item, trigger) => {
              setResultAnnouncement('')
              state.handleDelete(item, trigger)
            }}
          />
        )}
      </>
    )
  return (
    <section
      ref={stableFocusRef}
      tabIndex={-1}
      aria-label="Упаковка товаров"
      className="space-y-6 py-2"
    >
      {header}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {resultAnnouncement}
      </p>
      {content}
      <SkuPackagingFormDialog
        open={state.isCreateOpen || !!state.editingItem}
        item={state.editingItem}
        onClose={state.handleFormClose}
        onSuccess={setResultAnnouncement}
        returnFocusRef={state.returnFocusRef}
        successFocusRef={stableFocusRef}
      />
      <SkuPackagingDeleteDialog
        item={state.deletingItem}
        onClose={state.handleDeleteClose}
        onSuccess={setResultAnnouncement}
        returnFocusRef={state.returnFocusRef}
        successFocusRef={stableFocusRef}
      />
      <BulkAddDialog
        open={state.isBulkOpen}
        onClose={state.handleBulkClose}
        onSuccess={setResultAnnouncement}
        returnFocusRef={state.returnFocusRef}
        successFocusRef={stableFocusRef}
      />
    </section>
  )
}
