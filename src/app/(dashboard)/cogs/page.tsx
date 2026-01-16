'use client'

import { useState } from 'react'
import { ProductList } from '@/components/custom/ProductList'
import { SingleCogsForm } from '@/components/custom/SingleCogsForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Info } from 'lucide-react'
import type { ProductListItem } from '@/types/api'

/**
 * COGS Management Page
 * Story 4.1: Single Product COGS Assignment Interface
 * Story 4.10: Slide-out COGS Assignment Panel (refactored from 2-column layout)
 *
 * Changes in 4.10:
 * - Full-width product table for better data visibility
 * - Slide-out Sheet panel for COGS form (opens from right)
 * - Uses Sheet size="wide" variant (448-512px) for comfortable form entry
 *
 * See: docs/stories/4.10.slide-out-cogs-panel.md
 */
export default function CogsManagementPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null)

  // Sheet is open when a product is selected (AC-3)
  const isSheetOpen = selectedProduct !== null

  const handleProductSelect = (product: ProductListItem) => {
    setSelectedProduct(product)
  }

  const handleCogsSuccess = () => {
    // Clear selection after successful COGS assignment (closes Sheet)
    setSelectedProduct(null)
  }

  const handleCancel = () => {
    setSelectedProduct(null)
  }

  // Handle Sheet open state change (for overlay click, X button, Escape key)
  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedProduct(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Управление себестоимостью
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Назначайте себестоимость товарам для расчёта маржинальности и прибыли
        </p>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          После назначения себестоимости маржа будет рассчитана автоматически на основе
          данных продаж за последнюю завершённую неделю. Для товаров без продаж в этот
          период будет показан исторический контекст за последние 12 недель.
        </AlertDescription>
      </Alert>

      {/* Full-width Product List (Story 4.10 - AC-1) */}
      <Card>
        <CardHeader>
          <CardTitle>Список товаров</CardTitle>
          <CardDescription>
            Кликните на товар для назначения себестоимости
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductList
            onProductSelect={handleProductSelect}
            selectedProductId={selectedProduct?.nm_id}
            showOnlyWithoutCogs={false}
            enableSelection={true}
            enableMarginDisplay={true}
          />
        </CardContent>
      </Card>

      {/* Slide-out COGS Assignment Panel (Story 4.10 - AC-2, AC-3) */}
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent side="right" size="wide">
          <SheetHeader>
            <SheetTitle>Назначение себестоимости</SheetTitle>
            <SheetDescription>
              {selectedProduct
                ? `Укажите себестоимость для товара ${selectedProduct.nm_id}`
                : 'Выберите товар из списка'}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {selectedProduct && (
              <SingleCogsForm
                nmId={selectedProduct.nm_id}
                productName={selectedProduct.sa_name}
                existingCogs={selectedProduct.cogs || undefined}
                onSuccess={handleCogsSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Как это работает?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div>
            <strong>1. Выберите товар</strong>
            <p className="mt-1 text-blue-800">
              Используйте поиск или фильтры для нахождения нужного товара
            </p>
          </div>
          <div>
            <strong>2. Укажите себестоимость</strong>
            <p className="mt-1 text-blue-800">
              Введите стоимость единицы товара в рублях и дату начала действия
            </p>
          </div>
          <div>
            <strong>3. Получите расчёт маржи</strong>
            <p className="mt-1 text-blue-800">
              Система автоматически рассчитает маржинальность на основе данных продаж
            </p>
          </div>
          <div>
            <strong>4. Версионирование</strong>
            <p className="mt-1 text-blue-800">
              История изменений себестоимости сохраняется, можно назначить новую
              себестоимость с любой даты
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
