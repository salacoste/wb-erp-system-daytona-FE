'use client'

/**
 * InstalledRulesPageContent — client states for /automation/installed-rules
 * (Story 163.2-FE). Mirrors canned-rules/page.tsx:
 *  - loading  → "Загрузка…"
 *  - error    → Alert + "Повторить" button (refetch)
 *  - empty    → explanation + keyboard-accessible <Link> to the templates gallery
 *  - populated → InstalledRulesList
 *
 * A failure in this query never blanks the templates gallery (separate query).
 *
 * Migrated Story 172.3-FE: double page padding removed (the dashboard layout
 * provides outer padding); primitives verified (Alert/Button-asChild-Link).
 */
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useInstalledRules } from '@/hooks/useAutomation'
import { InstalledRulesList } from '@/components/custom/automation/InstalledRulesList'
import { ROUTES } from '@/lib/routes'

interface InstalledRulesPageContentProps {
  /** id of a just-installed rule to highlight (?highlight=…). */
  highlightId?: string
}

export function InstalledRulesPageContent({ highlightId }: InstalledRulesPageContentProps) {
  const { data: rules, isLoading, isError, error, refetch } = useInstalledRules()

  if (isLoading) {
    return (
      <div className="container">
        <h1 className="mb-6 text-2xl font-semibold">Установленные правила</h1>
        <p className="text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container">
        <h1 className="mb-6 text-2xl font-semibold">Установленные правила</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Не удалось загрузить правила. {error instanceof Error ? error.message : ''}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    )
  }

  const list = rules ?? []
  return (
    <div className="container">
      <h1 className="mb-2 text-2xl font-semibold">Установленные правила</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Правила, установленные в этом кабинете. Установка и включение всегда безопасны.
      </p>
      {list.length === 0 ? (
        <div className="space-y-3" data-testid="installed-rules-empty">
          <p className="text-muted-foreground">
            В этом кабинете пока нет установленных правил автоматизации.
          </p>
          <Button asChild>
            <Link href={ROUTES.AUTOMATION.CANNED_RULES}>Перейти к шаблонам</Link>
          </Button>
        </div>
      ) : (
        <InstalledRulesList rules={list} highlightId={highlightId} />
      )}
    </div>
  )
}
