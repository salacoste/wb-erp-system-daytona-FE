'use client'

/**
 * Page state hook for Box Types CRUD page
 * Epic 75-FE, Story 75.2: Box Types CRUD Page
 */

import { useRef, useState } from 'react'
import { useBoxTypes } from '@/hooks/use-box-types'
import type { BoxType } from '@/types/shipment-cost'

export function useBoxTypesPageState() {
  const { data: boxTypes, isLoading, isFetching, isError, error, refetch } = useBoxTypes()

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingBoxType, setEditingBoxType] = useState<BoxType | null>(null)
  const [deactivatingBoxType, setDeactivatingBoxType] = useState<BoxType | null>(null)
  const returnFocusRef = useRef<HTMLButtonElement | null>(null)

  const handleCreate = (trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger
    setIsCreateOpen(true)
  }

  const handleEdit = (boxType: BoxType, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger
    setEditingBoxType(boxType)
  }

  const handleDeactivate = (boxType: BoxType, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger
    setDeactivatingBoxType(boxType)
  }

  const handleFormClose = () => {
    setIsCreateOpen(false)
    setEditingBoxType(null)
  }

  const handleDeactivateClose = () => setDeactivatingBoxType(null)

  return {
    boxTypes: boxTypes ?? [],
    isLoading,
    isFetching,
    isError,
    error,
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
  }
}
