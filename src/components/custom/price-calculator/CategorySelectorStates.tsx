'use client'

/**
 * CategorySelector Loading and Error States
 * Story 44.16-FE: Category Selection with Search
 * Extracted for 200-line file limit compliance
 */

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { FieldTooltip } from './FieldTooltip'

const TOOLTIP_CONTENT = 'Категория определяет комиссию WB. FBO и FBS имеют разные ставки.'

export function CategorySelectorLoading() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Категория товара</Label>
        <FieldTooltip content={TOOLTIP_CONTENT} />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export interface CategorySelectorErrorProps {
  onRetry: () => void
}

export function CategorySelectorError({ onRetry }: CategorySelectorErrorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">Категория товара</Label>
        <FieldTooltip content={TOOLTIP_CONTENT} />
      </div>
      <div className="flex items-center gap-2 p-3 rounded-md border border-destructive bg-destructive/10">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive flex-1">Ошибка загрузки категорий</span>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    </div>
  )
}
