'use client'

/** Page state hook for SKU Packaging — Epic 75-FE, Story 75.3 */

import { useMemo, useRef, useState } from 'react'
import { useSkuPackaging } from '@/hooks/use-sku-packaging'
import { useBoxTypes } from '@/hooks/use-box-types'
import type { SkuPackaging } from '@/types/shipment-cost'

export function useSkuPackagingPageState() {
  const { data: items, isLoading, isFetching, isError, error, refetch } = useSkuPackaging()
  const boxTypesQuery = useBoxTypes()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SkuPackaging | null>(null)
  const [deletingItem, setDeletingItem] = useState<SkuPackaging | null>(null)
  const [query, setQuery] = useState('')
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const allItems = items ?? []
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('ru-RU')
    if (!needle) return allItems
    return allItems.filter(item =>
      [
        item.nmId,
        item.product?.subject,
        item.product?.vendorCode,
        item.product?.brand,
        item.boxType?.name,
      ].some(value =>
        String(value ?? '')
          .toLocaleLowerCase('ru-RU')
          .includes(needle)
      )
    )
  }, [allItems, query])

  const rememberTrigger = (trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger
  }
  const handleCreate = (trigger: HTMLButtonElement) => {
    rememberTrigger(trigger)
    setIsCreateOpen(true)
  }
  const handleBulk = (trigger: HTMLButtonElement) => {
    rememberTrigger(trigger)
    setIsBulkOpen(true)
  }
  const handleEdit = (item: SkuPackaging, trigger: HTMLButtonElement) => {
    rememberTrigger(trigger)
    setEditingItem(item)
  }
  const handleDelete = (item: SkuPackaging, trigger: HTMLButtonElement) => {
    rememberTrigger(trigger)
    setDeletingItem(item)
  }

  const handleFormClose = () => {
    setIsCreateOpen(false)
    setEditingItem(null)
  }

  const handleDeleteClose = () => setDeletingItem(null)
  const handleBulkClose = () => setIsBulkOpen(false)

  return {
    items: allItems,
    filteredItems,
    query,
    setQuery,
    clearQuery: () => setQuery(''),
    boxTypes: boxTypesQuery.data ?? [],
    hasBoxTypes: (boxTypesQuery.data ?? []).length > 0,
    isLoading: isLoading || boxTypesQuery.isLoading,
    isFetching: isFetching || boxTypesQuery.isFetching,
    isError,
    isBoxTypesError: boxTypesQuery.isError,
    refetchBoxTypes: boxTypesQuery.refetch,
    error,
    refetch,
    isCreateOpen,
    handleCreate,
    isBulkOpen,
    handleBulk,
    editingItem,
    deletingItem,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteClose,
    handleBulkClose,
    returnFocusRef,
  }
}
