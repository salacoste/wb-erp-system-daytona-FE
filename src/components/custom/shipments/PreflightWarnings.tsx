'use client'

/**
 * Pre-flight warning banners for missing packaging/COGS
 * Epic 76-FE, Story 76.3 (AC: #5, #6)
 * Non-blocking — informational only, does not prevent submission
 */

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSkuPackagingByNmId } from '@/hooks/use-sku-packaging'
import { useProducts } from '@/hooks/useProducts'
import { ROUTES } from '@/lib/routes'

interface PreflightWarningsProps {
  nmId: number | null
}

export function PreflightWarnings({ nmId }: PreflightWarningsProps) {
  const { isError: packagingMissing, isFetched: packagingFetched } = useSkuPackagingByNmId(
    nmId ?? 0
  )
  const { data: productData, isFetched: productFetched } = useProducts(
    nmId ? { search: String(nmId), limit: 1 } : undefined
  )

  if (!nmId) return null

  const product = productData?.products?.[0]
  const cogsMissing = productFetched && product && !product.has_cogs

  return (
    <div className="space-y-2">
      {packagingFetched && packagingMissing && (
        <Alert variant="warning" role="alert" aria-live="polite">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            У товара {nmId} нет настройки упаковки.{' '}
            <Link href={ROUTES.SHIPMENTS.SKU_PACKAGING} className="underline font-medium">
              Настроить упаковку
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {cogsMissing && (
        <Alert variant="warning" role="alert" aria-live="polite">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            У товара {nmId} не указана себестоимость.{' '}
            <Link href={`/products?filter=${nmId}`} className="underline font-medium">
              Указать себестоимость
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
