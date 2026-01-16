'use client'

import { useRouter } from 'next/navigation'
import { BulkCogsForm } from '@/components/custom/BulkCogsForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info, ArrowLeft } from 'lucide-react'

/**
 * Bulk COGS Assignment Page
 * Story 4.2: Bulk COGS Assignment Capability
 *
 * Allows users to:
 * - Select multiple products without COGS
 * - Assign same COGS value to all selected products
 * - Preview selection before submission
 * - View detailed results (success/failure counts)
 * - Retry failed assignments
 */
export default function BulkCogsPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to main COGS page after successful bulk assignment
    router.push('/cogs')
  }

  const handleBack = () => {
    router.push('/cogs')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Массовое назначение себестоимости
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Назначайте одинаковую себестоимость сразу нескольким товарам
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Как это работает:</strong> Выберите товары из списка и укажите
          себестоимость. Все выбранные товары получат одинаковую себестоимость с указанной
          датой. Максимум 1000 товаров за один раз.
        </AlertDescription>
      </Alert>

      {/* Bulk COGS Form */}
      <Card>
        <CardHeader>
          <CardTitle>Выбор товаров и назначение себестоимости</CardTitle>
          <CardDescription>
            Выберите товары из списка и укажите себестоимость для массового обновления
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkCogsForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Советы по использованию</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div>
            <strong>1. Выбор товаров</strong>
            <p className="mt-1 text-blue-800">
              Используйте чекбоксы для выбора отдельных товаров или кнопку "Выбрать все"
              для выбора всех товаров на текущей странице. Можно выбирать товары с разных
              страниц.
            </p>
          </div>
          <div>
            <strong>2. Поиск и фильтрация</strong>
            <p className="mt-1 text-blue-800">
              Используйте поиск по артикулу или названию, чтобы быстро найти нужные товары.
              В списке показаны только товары без себестоимости.
            </p>
          </div>
          <div>
            <strong>3. Предпросмотр перед назначением</strong>
            <p className="mt-1 text-blue-800">
              Перед отправкой данных вы увидите окно предпросмотра со списком выбранных
              товаров и указанной себестоимостью. Проверьте данные и подтвердите операцию.
            </p>
          </div>
          <div>
            <strong>4. Частичный успех</strong>
            <p className="mt-1 text-blue-800">
              Если некоторые товары не удалось обновить, вы увидите детальный отчёт с
              причинами ошибок. Можно повторить операцию только для неудачных товаров.
            </p>
          </div>
          <div>
            <strong>5. Ограничения</strong>
            <p className="mt-1 text-blue-800">
              Максимум 1000 товаров за один раз. Если нужно обновить больше товаров,
              разделите их на несколько групп.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
