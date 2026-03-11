'use client'

/**
 * Empty state for Box Types page
 * Epic 75-FE, Story 75.2: Box Types CRUD Page (AC: #1)
 */

import { Box, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface BoxTypesEmptyStateProps {
  onCreateClick: () => void
}

export function BoxTypesEmptyState({ onCreateClick }: BoxTypesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Box className="h-8 w-8 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">Нет типов коробок</h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          Добавьте типы коробок для расчёта стоимости доставки
        </p>

        <Button onClick={onCreateClick}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить тип коробки
        </Button>
      </CardContent>
    </Card>
  )
}
