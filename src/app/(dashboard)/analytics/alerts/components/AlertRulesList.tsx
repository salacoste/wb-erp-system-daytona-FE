'use client'

/**
 * Alert rules list with enable/disable toggle and severity badges
 */

import { BellOff, Trash2, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdateAlertRule, useDeleteAlertRule } from '@/hooks/useAlerts'
import { ALERT_TYPE_LABELS, ALERT_TYPE_DESCRIPTIONS } from '@/types/alerts'
import type { AlertRule, AlertSeverity } from '@/types/alerts'

const severityColors: Record<AlertSeverity, string> = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

const severityLabels: Record<AlertSeverity, string> = {
  critical: 'Критический',
  warning: 'Внимание',
  info: 'Информация',
}

interface AlertRulesListProps {
  rules: AlertRule[] | undefined
  isLoading: boolean
  onEdit?: (rule: AlertRule) => void
  canManageRules?: boolean
}

export function AlertRulesList({
  rules,
  isLoading,
  onEdit,
  canManageRules = true,
}: AlertRulesListProps) {
  const updateRule = useUpdateAlertRule()
  const deleteRule = useDeleteAlertRule()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Правила оповещений</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!rules || rules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
          {/* h2 — alerts page renders h1 in AlertsPageHeader; no h2 precedes this empty-state section */}
          <h2 className="text-lg font-semibold text-muted-foreground mb-2">Нет правил</h2>
          <p className="text-sm text-muted-foreground">
            Создайте первое правило оповещения для автоматического мониторинга
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Правила оповещений ({rules.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map(rule => (
          <RuleRow
            key={rule.id}
            rule={rule}
            onToggle={enabled => updateRule.mutate({ id: rule.id, payload: { enabled } })}
            onDelete={() => deleteRule.mutate(rule.id)}
            onEdit={() => onEdit?.(rule)}
            isToggling={updateRule.isPending}
            isDeleting={deleteRule.isPending}
            canManage={canManageRules}
          />
        ))}
      </CardContent>
    </Card>
  )
}

function RuleRow({
  rule,
  onToggle,
  onDelete,
  onEdit,
  isToggling,
  isDeleting,
  canManage,
}: {
  rule: AlertRule
  onToggle: (enabled: boolean) => void
  onDelete: () => void
  onEdit: () => void
  isToggling: boolean
  isDeleting: boolean
  canManage: boolean
}) {
  const VALID_SEVERITIES: AlertSeverity[] = ['critical', 'warning', 'info']
  const severity: AlertSeverity = VALID_SEVERITIES.includes(rule.severity as AlertSeverity)
    ? (rule.severity as AlertSeverity)
    : 'info'
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <Switch
          checked={rule.enabled}
          onCheckedChange={onToggle}
          disabled={!canManage || isToggling}
          aria-label={`Переключить правило ${rule.label ?? rule.alertType}`}
        />
        <div>
          <p className="font-medium">
            {rule.label ??
              ALERT_TYPE_LABELS[rule.alertType as keyof typeof ALERT_TYPE_LABELS] ??
              rule.alertType}
          </p>
          <p className="text-xs text-muted-foreground">
            {ALERT_TYPE_DESCRIPTIONS[rule.alertType as keyof typeof ALERT_TYPE_DESCRIPTIONS] ??
              rule.alertType}
          </p>
        </div>
        <Badge className={severityColors[severity]} variant="outline">
          {severityLabels[severity]}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{rule.cooldownMinutes} мин</span>
        {canManage && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label={`Редактировать правило ${rule.label ?? rule.alertType}`}
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={`Удалить правило ${rule.label ?? rule.alertType}`}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
