'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { ROUTES } from '@/lib/routes'
import { Loader2 } from 'lucide-react'

interface CabinetKey {
  keyName: string
  updatedAt: string
}

interface CabinetResponse {
  id: string
  name: string
  isActive: boolean
  keys?: CabinetKey[]
  cabinetKeys?: CabinetKey[]
}

interface RequireWbTokenProps {
  children: React.ReactNode
}

/**
 * Wrapper component that redirects to /wb-token if no WB API token is configured
 * Use this to protect pages that require WB API access
 */
export function RequireWbToken({ children }: RequireWbTokenProps) {
  const router = useRouter()
  const { cabinetId } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cabinet-wb-token-check', cabinetId],
    queryFn: async () => {
      if (!cabinetId) return null
      try {
        const response = await apiClient.get<CabinetResponse>(`/v1/cabinets/${cabinetId}`)
        return response
      } catch {
        return null
      }
    },
    staleTime: 60000,
    retry: false,
    enabled: !!cabinetId,
  })

  // Check if wb_api_token exists
  const keys = data?.cabinetKeys || data?.keys || []
  const hasWbToken = keys.some((key) => key.keyName === 'wb_api_token')

  // Redirect to /wb-token if no token found (after loading completes)
  useEffect(() => {
    if (!isLoading && !isError && cabinetId && data && !hasWbToken) {
      router.push(ROUTES.ONBOARDING.WB_TOKEN)
    }
  }, [isLoading, isError, cabinetId, data, hasWbToken, router])

  // Show loading while checking
  if (isLoading || !cabinetId) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // If no token, show nothing (redirect is happening)
  if (!hasWbToken && data) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Перенаправление...</span>
      </div>
    )
  }

  return <>{children}</>
}
