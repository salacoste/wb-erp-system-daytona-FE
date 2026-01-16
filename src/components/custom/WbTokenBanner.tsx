'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import Link from 'next/link'

interface CabinetKey {
  keyName: string
  updatedAt: string
}

interface CabinetResponse {
  id: string
  name: string
  isActive: boolean
  keys?: CabinetKey[]
  cabinetKeys?: CabinetKey[] // Alternative field name from API
}

/**
 * Banner to show when WB API token is not configured
 * Displays at the top of dashboard pages
 */
export function WbTokenBanner() {
  const { cabinetId } = useAuthStore()

  // Check if cabinet has WB token configured
  const { data, isLoading } = useQuery({
    queryKey: ['cabinet-wb-token-check', cabinetId],
    queryFn: async () => {
      if (!cabinetId) return null
      try {
        const response = await apiClient.get<CabinetResponse>(`/v1/cabinets/${cabinetId}`)
        return response
      } catch {
        // If error, assume no token (will show banner)
        return null
      }
    },
    staleTime: 60000, // 1 minute
    retry: false,
    enabled: !!cabinetId,
  })

  // Don't show while loading or if no cabinet
  if (isLoading || !cabinetId) return null

  // Check if wb_api_token exists in keys array (API uses 'cabinetKeys' field)
  const keys = data?.cabinetKeys || data?.keys || []
  const hasWbToken = keys.some(
    (key) => key.keyName === 'wb_api_token'
  )

  // Don't show banner if token exists
  if (hasWbToken) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-semibold text-amber-800">WB API токен не настроен</h4>
          <p className="text-sm text-amber-700 mt-1">
            Для получения данных о товарах необходимо настроить WB API токен.
            Перейдите в настройки кабинета для ввода токена.
          </p>
          <Link href={ROUTES.ONBOARDING.WB_TOKEN}>
            <Button variant="outline" size="sm" className="mt-3 border-amber-400 text-amber-800 hover:bg-amber-100">
              Перейти в настройки
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
