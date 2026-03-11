'use client'

/** Page state hook for SKU Packaging — Epic 75-FE, Story 75.3 */

import { useState } from 'react'
import { useSkuPackaging } from '@/hooks/use-sku-packaging'
import { useBoxTypes } from '@/hooks/use-box-types'
import type { SkuPackaging } from '@/types/shipment-cost'

export function useSkuPackagingPageState() {
  const { data: items, isLoading, isError, error, refetch } = useSkuPackaging()
  const { data: boxTypes } = useBoxTypes()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SkuPackaging | null>(null)
  const [deletingItem, setDeletingItem] = useState<SkuPackaging | null>(null)

  const handleEdit = (item: SkuPackaging) => setEditingItem(item)
  const handleDelete = (item: SkuPackaging) => setDeletingItem(item)

  const handleFormClose = () => {
    setIsCreateOpen(false)
    setEditingItem(null)
  }

  const handleDeleteClose = () => setDeletingItem(null)
  const handleBulkClose = () => setIsBulkOpen(false)

  return {
    items: items ?? [],
    boxTypes: boxTypes ?? [],
    hasBoxTypes: (boxTypes ?? []).length > 0,
    isLoading,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    isBulkOpen,
    setIsBulkOpen,
    editingItem,
    deletingItem,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleDeleteClose,
    handleBulkClose,
  }
}
