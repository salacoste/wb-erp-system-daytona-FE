'use client'

/**
 * Canned Automation Rules gallery page. AT1 (gap-09).
 * Route: /automation/canned-rules
 *
 * Composes useCannedRules (GET /v1/automation/canned-rules) with the
 * CannedRulesGallery. Loading/error/empty states mirror the dashboard-page
 * convention (see shipments/page.tsx).
 *
 * Migrated Story 172.2-FE: token-clean born-clean surface; double page
 * padding removed (the dashboard layout provides outer padding), retry
 * control moved to the Button primitive.
 *
 * FUTURE: after install, deep-link to the rule editor (GET/PATCH
 * /v1/automation/rules/:id) so the operator tunes thresholds/scope. The
 * rule-editor page does not exist yet — see docs/request-backend/224-…md
 * § FE integration. Until then, install success is signalled via toast and
 * the operator navigates manually.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { useCannedRules } from '@/hooks/useAutomation'
import { CannedRulesGallery } from '@/components/custom/automation/CannedRulesGallery'

export default function CannedRulesPage() {
  const { data: templates, isLoading, isError, error, refetch } = useCannedRules()

  if (isLoading) {
    return (
      <div className="container">
        <h1 className="mb-6 text-2xl font-semibold">Шаблоны автоматизации</h1>
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container">
        <h1 className="mb-6 text-2xl font-semibold">Шаблоны автоматизации</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить шаблоны. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
        <Button
          variant="link"
          size="sm"
          onClick={() => refetch()}
          className="mt-4 px-0"
          data-testid="canned-rules-retry"
        >
          Повторить
        </Button>
      </div>
    )
  }

  const list = templates ?? []
  return (
    <div className="container">
      <h1 className="mb-2 text-2xl font-semibold">Шаблоны автоматизации</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Готовые правила в один клик. После установки правило можно настроить.
      </p>
      {list.length === 0 ? (
        <p className="text-muted-foreground" data-testid="canned-rules-empty">
          Шаблоны пока не доступны.
        </p>
      ) : (
        <CannedRulesGallery templates={list} />
      )}
    </div>
  )
}
