'use client'

/**
 * Dialog for creating a new alert rule
 * Supports dynamic threshold fields per alert type
 */

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateAlertRule } from '@/hooks/useAlerts'
import {
  AlertType,
  ALERT_TYPE_LABELS,
  ALERT_TYPE_THRESHOLDS,
  ALERT_THRESHOLD_FIELDS,
} from '@/types/alerts'
import type { ThresholdFieldConfig } from '@/types/alerts'
import { ThresholdInput } from './ThresholdInput'

interface CreateAlertRuleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const ALERT_TYPES = Object.values(AlertType)

export function CreateAlertRuleDialog({ isOpen, onOpenChange }: CreateAlertRuleDialogProps) {
  const createRule = useCreateAlertRule()
  const [selectedType, setSelectedType] = useState<AlertType | ''>('')
  const [thresholds, setThresholds] = useState<Record<string, number>>({})

  const fields: ThresholdFieldConfig[] = selectedType ? ALERT_THRESHOLD_FIELDS[selectedType] : []

  const handleTypeChange = (value: string) => {
    const type = value as AlertType
    setSelectedType(type)
    setThresholds(ALERT_TYPE_THRESHOLDS[type] ?? {})
  }

  const handleThresholdChange = (key: string, raw: string) => {
    const parsed = parseInt(raw, 10)
    if (!isNaN(parsed)) {
      setThresholds(prev => ({ ...prev, [key]: parsed }))
    }
  }

  const handleCreate = () => {
    if (!selectedType) return

    createRule.mutate(
      {
        alertType: selectedType,
        thresholds,
        cooldownMinutes: 60,
        severity: 'warning',
        channels: { telegram: true },
      },
      {
        onSuccess: () => {
          toast.success('Правило создано')
          handleClose()
        },
        onError: () => {
          toast.error('Ошибка при создании правила')
        },
      }
    )
  }

  const handleClose = () => {
    setSelectedType('')
    setThresholds({})
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Новое правило оповещения
          </DialogTitle>
          <DialogDescription>
            Выберите тип оповещения и настройте пороговые значения
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger id="alert-type">
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                {ALERT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {ALERT_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {fields.map(field => (
            <ThresholdInput
              key={field.key}
              field={field}
              value={thresholds[field.key] ?? 0}
              onChange={v => handleThresholdChange(field.key, v)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createRule.isPending}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={!selectedType || createRule.isPending}>
            {createRule.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Создать
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
