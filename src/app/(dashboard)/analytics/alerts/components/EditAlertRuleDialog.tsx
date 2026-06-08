'use client'

/**
 * Dialog for editing an existing alert rule
 * Pre-fills values from the rule and calls useUpdateAlertRule on submit
 */

import { useState, useEffect } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateAlertRule } from '@/hooks/useAlerts'
import { ALERT_TYPE_LABELS, ALERT_THRESHOLD_FIELDS, AlertType } from '@/types/alerts'
import type { AlertRule, ThresholdFieldConfig } from '@/types/alerts'

interface EditAlertRuleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  rule: AlertRule | null
}

export function EditAlertRuleDialog({ isOpen, onOpenChange, rule }: EditAlertRuleDialogProps) {
  const updateRule = useUpdateAlertRule()
  const [label, setLabel] = useState('')
  const [thresholds, setThresholds] = useState<Record<string, number>>({})

  useEffect(() => {
    if (rule) {
      setLabel(rule.label ?? '')
      setThresholds(
        Object.fromEntries(Object.entries(rule.thresholds).map(([k, v]) => [k, Number(v) ?? 0]))
      )
    }
  }, [rule])

  if (!rule) return null

  const fields: ThresholdFieldConfig[] = ALERT_THRESHOLD_FIELDS[rule.alertType as AlertType] ?? []
  const typeLabel =
    ALERT_TYPE_LABELS[rule.alertType as keyof typeof ALERT_TYPE_LABELS] ?? rule.alertType

  const handleThresholdChange = (key: string, raw: string) => {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) {
      setThresholds(prev => ({ ...prev, [key]: parsed }))
    }
  }

  const handleSave = () => {
    updateRule.mutate(
      {
        id: rule.id,
        payload: {
          thresholds,
          label: label || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Правило обновлено')
          onOpenChange(false)
        },
        onError: () => {
          toast.error('Ошибка при обновлении правила')
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Редактирование правила
          </DialogTitle>
          <DialogDescription>
            Измените параметры правила &laquo;{typeLabel}&raquo;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rule-label">Название (необязательно)</Label>
            <Input
              id="rule-label"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={typeLabel}
            />
          </div>

          {fields.map(field => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={`edit-${field.key}`}>{field.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`edit-${field.key}`}
                  type="number"
                  value={thresholds[field.key] ?? 0}
                  onChange={e => handleThresholdChange(field.key, e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {field.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateRule.isPending}
          >
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={updateRule.isPending}>
            {updateRule.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Pencil className="mr-2 h-4 w-4" />
                Сохранить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
