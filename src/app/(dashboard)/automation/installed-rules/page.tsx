/**
 * Installed automation rules page (Story 163.2-FE). Route: /automation/installed-rules
 *
 * Server component: awaits the `?highlight=<id>` search param (Next 16 requires
 * searchParams to be a Promise — see analytics/search/page.tsx for the pattern)
 * and passes it to the client InstalledRulesPageContent, which owns the
 * loading/error/empty/populated states via useInstalledRules.
 *
 * A list-query failure is isolated to this query and never blanks the templates
 * gallery (separate queryKey, not caught into global state).
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { InstalledRulesPageContent } from './InstalledRulesPageContent'

interface InstalledRulesPageProps {
  searchParams?: Promise<{ highlight?: string | string[] }>
}

export default async function InstalledRulesPage({ searchParams }: InstalledRulesPageProps) {
  const params = (await searchParams) ?? {}
  const raw = params.highlight
  // Defensive: searchParams values can be string | string[] | undefined; consume first only.
  const highlightId = Array.isArray(raw) ? raw[0] : raw
  return <InstalledRulesPageContent highlightId={highlightId} />
}
