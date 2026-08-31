'use client'

/**
 * МойСклад health badge — token-configured + read-only indicator + org name.
 * Contract: docs/request-backend/221-moysklad-integration-backend-contract.md
 * GET /health (no live МС call) + lazy GET /organizations for the org name.
 */

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMoyskladHealth, useMoyskladOrganizations } from '@/hooks/useMoyskladQueries'
import { cn } from '@/lib/utils'

export function MoyskladHealthBadge() {
  const { data: health, isLoading } = useMoyskladHealth()
  // Lazy-load the org name only once the token is configured (cheap, live МС call).
  const { data: orgs } = useMoyskladOrganizations(!!health?.tokenConfigured)
  const orgName = orgs?.[0]?.name ?? null

  if (isLoading) return <Skeleton className="h-6 w-40 rounded-md" />

  const configured = !!health?.tokenConfigured
  const label = configured ? 'Подключён' : 'Не настроен'

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={configured ? 'secondary' : 'outline'}
        className={cn(
          configured
            ? 'border-status-success/40 bg-status-success/10 text-foreground'
            : 'border-destructive/30 text-destructive'
        )}
      >
        {label}
      </Badge>
      {health?.readOnly === true && (
        <Badge variant="outline" className="text-muted-foreground">
          Только чтение
        </Badge>
      )}
      {orgName && (
        <span className="text-sm text-muted-foreground truncate max-w-[16rem]">{orgName}</span>
      )}
    </div>
  )
}
