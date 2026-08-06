'use client'

/**
 * InstalledRuleRow — one installed automation rule (Story 163.2-FE).
 *
 * Renders: name, enabled/disabled badge, trigger (RU label), action (RU label),
 * and — when the rule "requires the cabinet writeback arm" (WRITEBACK_PRICE or
 * category 'price') — a yellow warning badge + explanatory text.
 *
 * Safety posture (never imply immediate price change):
 *  - Installing/enabling a rule is ALWAYS safe.
 *  - A WRITEBACK_PRICE rule only changes prices once the cabinet arms
 *    PRICE_WRITEBACK_ENABLED; until then it is inert.
 *  - When `enabled === false`, the warning text emphasizes that the rule is
 *    currently inactive (so a disabled price rule is doubly inert).
 *
 * Unknown trigger/action enums render via the fallback helpers (no crash).
 * Reference: docs/request-backend/224-automation-canned-rules-backend-contract.md
 */
import { useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { type AutomationRule, isWritebackRule, triggerLabel, actionLabel } from '@/types/automation'

interface InstalledRuleRowProps {
  rule: AutomationRule
  /** True when this row is the post-install deep-link target (?highlight=id). */
  highlighted: boolean
}

/** InstalledRuleRow — presentational; keyboard-accessible via semantic elements. */
export function InstalledRuleRow({ rule, highlighted }: InstalledRuleRowProps) {
  const requiresArm = isWritebackRule(rule)
  // Story 163.2: when this row is the post-install deep-link target (?highlight=id),
  // scroll it into view + make it focusable so the new rule is identifiable (AC5)
  // without the operator hunting for it below the fold.
  const rowRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (highlighted) rowRef.current?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])
  return (
    <li
      ref={rowRef}
      tabIndex={highlighted ? -1 : undefined}
      className={
        'flex flex-col gap-2 rounded-md border p-4 ' +
        (highlighted ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border')
      }
      data-testid={`installed-rule-row-${rule.id}`}
      data-highlighted={highlighted ? 'true' : 'false'}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-medium" data-testid={`installed-rule-name-${rule.id}`}>
          {rule.name}
        </h3>
        {rule.enabled ? (
          <Badge className="bg-green-100 text-green-800" data-testid={`enabled-badge-${rule.id}`}>
            Включено
          </Badge>
        ) : (
          <Badge variant="secondary" data-testid={`disabled-badge-${rule.id}`}>
            Выключено
          </Badge>
        )}
      </div>

      <dl className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="inline text-muted-foreground">Триггер: </dt>
          <dd className="inline" data-testid={`trigger-${rule.id}`}>
            {triggerLabel(rule.trigger)}
          </dd>
        </div>
        <div>
          <dt className="inline text-muted-foreground">Действие: </dt>
          <dd className="inline" data-testid={`action-${rule.id}`}>
            {actionLabel(rule.action)}
          </dd>
        </div>
      </dl>

      {requiresArm && (
        <div className="flex items-start gap-2" data-testid={`safety-${rule.id}`}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" aria-hidden="true" />
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Требует arm write-back.</span>{' '}
            {rule.enabled
              ? 'Изменение цены включается отдельным рубильником кабинета (PRICE_WRITEBACK_ENABLED). Правило установлено, но цены не меняются до включения рубильника.'
              : 'Правило сейчас выключено и не меняет цены. Даже после включения цена меняется только при активном рубильнике кабинета (PRICE_WRITEBACK_ENABLED).'}
          </p>
        </div>
      )}
    </li>
  )
}
