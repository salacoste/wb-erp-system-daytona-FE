'use client'

/**
 * Box Types CRUD Page
 * Epic 75-FE, Story 75.2: Box Types CRUD Page
 * Route: /shipments/box-types
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import {
  BoxTypesEmptyState,
  BoxTypesTable,
  BoxTypeFormDialog,
  BoxTypeDeactivateDialog,
} from '@/components/custom/box-types'
import { useBoxTypesPageState } from './useBoxTypesPageState'

export default function BoxTypesPage() {
  const {
    boxTypes,
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
  } = useBoxTypesPageState()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Типы коробок</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Типы коробок</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error instanceof Error ? error.message : 'Ошибка загрузки типов коробок'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Повторить
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Типы коробок</h1>
        {boxTypes.length > 0 && (
          <Button onClick={() => setIsCreateOpen(true)}>Добавить тип коробки</Button>
        )}
      </div>

      {boxTypes.length === 0 ? (
        <BoxTypesEmptyState onCreateClick={() => setIsCreateOpen(true)} />
      ) : (
        <BoxTypesTable boxTypes={boxTypes} onEdit={handleEdit} onDeactivate={handleDeactivate} />
      )}

      <BoxTypeFormDialog
        open={isCreateOpen || !!editingBoxType}
        boxType={editingBoxType}
        onClose={handleFormClose}
      />

      <BoxTypeDeactivateDialog boxType={deactivatingBoxType} onClose={handleDeactivateClose} />
    </div>
  )
}
