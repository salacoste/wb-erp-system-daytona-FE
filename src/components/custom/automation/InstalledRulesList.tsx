'use client'

/**
 * InstalledRulesList — the populated list of installed automation rules
 * (Story 163.2-FE). Purely presentational over the already-fetched list.
 *
 * Empty state is intentionally NOT rendered here — the page owns it (the page
 * shows a "go to templates" CTA when the cabinet has zero installed rules).
 * When given an empty array this component renders nothing.
 *
 * `highlightId` (from the ?highlight= search param) marks the row that was
 * just installed via the templates gallery deep-link.
 *
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { InstalledRuleRow } from './InstalledRuleRow'
import type { AutomationRule } from '@/types/automation'

interface InstalledRulesListProps {
  rules: AutomationRule[]
  /** Optional id of a just-installed rule to highlight (post-install deep-link). */
  highlightId?: string
}

export function InstalledRulesList({ rules, highlightId }: InstalledRulesListProps) {
  if (rules.length === 0) return null
  return (
    <ul className="flex flex-col gap-3" data-testid="installed-rules-list">
      {rules.map(rule => (
        <InstalledRuleRow
          key={rule.id}
          rule={rule}
          highlighted={highlightId !== undefined && rule.id === highlightId}
        />
      ))}
    </ul>
  )
}
