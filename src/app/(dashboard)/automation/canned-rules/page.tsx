'use client'

/**
 * Canned Automation Rules gallery page. AT1 (gap-09).
 * Route: /automation/canned-rules
 *
 * Composes useCannedRules (GET /v1/automation/canned-rules) with the
 * CannedRulesGallery. Loading/error/empty states mirror the dashboard-page
 * convention (see shipments/page.tsx).
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
import { AlertCircle } from 'lucide-react'
import { useCannedRules } from '@/hooks/useAutomation'
import { CannedRulesGallery } from '@/components/custom/automation/CannedRulesGallery'

export default function CannedRulesPage() {
  const { data: templates, isLoading, isError, error, refetch } = useCannedRules()

  if (isLoading) {
    return (
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-semibold">Шаблоны автоматизации</h1>
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container py-6">
        <h1 className="mb-6 text-2xl font-semibold">Шаблоны автоматизации</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить шаблоны. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
        >
          Повторить
        </button>
      </div>
    )
  }

  const list = templates ?? []
  return (
    <div className="container py-6">
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
