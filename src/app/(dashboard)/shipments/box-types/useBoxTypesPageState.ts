'use client'

/**
 * Page state hook for Box Types CRUD page
 * Epic 75-FE, Story 75.2: Box Types CRUD Page
 */

import { useState } from 'react'
import { useBoxTypes } from '@/hooks/use-box-types'
import type { BoxType } from '@/types/shipment-cost'

export function useBoxTypesPageState() {
  const { data: boxTypes, isLoading, isError, error, refetch } = useBoxTypes()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBoxType, setEditingBoxType] = useState<BoxType | null>(null)
  const [deactivatingBoxType, setDeactivatingBoxType] = useState<BoxType | null>(null)

  const handleEdit = (boxType: BoxType) => setEditingBoxType(boxType)
  const handleDeactivate = (boxType: BoxType) => setDeactivatingBoxType(boxType)

  const handleFormClose = () => {
    setIsCreateOpen(false)
    setEditingBoxType(null)
  }

  const handleDeactivateClose = () => setDeactivatingBoxType(null)

  return {
    boxTypes: boxTypes ?? [],
    isLoading,
    isError,
    error,
    refetch,
    isCreateOpen,
    setIsCreateOpen,
    editingBoxType,
    deactivatingBoxType,
    handleEdit,
    handleDeactivate,
    handleFormClose,
    handleDeactivateClose,
  }
}
