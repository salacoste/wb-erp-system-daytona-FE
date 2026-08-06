'use client'

/**
 * EditorFields (Story 163.3-FE, AC #2/#3/#8).
 *
 * Presentational form for the editable fields. Controlled by EditorFormValues;
 * validation errors (RU) render under each field. Action-specific fields appear
 * only when relevant. Controls live in form-controls.tsx (accessible: label,
 * aria-invalid, aria-live inline errors, logical tab order via source order).
 */
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  AUTOMATION_ACTION_LABELS,
  AUTOMATION_OPERATOR_LABELS,
  AUTOMATION_OPERATORS,
} from '@/types/automation'
import type { EditorFormErrors, EditorFormValues } from './validation'
import { SelectField, TextField } from './form-controls'

interface EditorFieldsProps {
  values: EditorFormValues
  errors: EditorFormErrors
  onChange: <K extends keyof EditorFormValues>(field: K, value: EditorFormValues[K]) => void
}

export function EditorFields({ values, errors, onChange }: EditorFieldsProps) {
  const actionOptions = Object.entries(AUTOMATION_ACTION_LABELS).map(([value, label]) => ({
    value,
    label,
  }))
  const operatorOptions = AUTOMATION_OPERATORS.map(op => ({
    value: op,
    label: AUTOMATION_OPERATOR_LABELS[op],
  }))
  return (
    <fieldset className="space-y-4" data-testid="editor-fields">
      <TextField
        id="name"
        label="Название правила"
        value={values.name}
        error={errors.name}
        onChange={v => onChange('name', v)}
        placeholder="Например: Низкий остаток → уведомление"
        autoComplete="off"
      />

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="enabled">Включено</Label>
          <p className="text-xs text-muted-foreground">Активировать правило после сохранения.</p>
        </div>
        <Switch
          id="enabled"
          checked={values.enabled}
          onCheckedChange={v => onChange('enabled', v)}
          data-testid="field-enabled"
          aria-label="Включено"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="priority"
          label="Приоритет"
          value={values.priority}
          error={errors.priority}
          onChange={v => onChange('priority', v)}
          placeholder="0"
          hint="Целое неотрицательное число (выше = важнее)."
          autoComplete="off"
          inputMode="decimal"
        />
        <TextField
          id="cooldownMin"
          label="Кулдаун (минуты)"
          value={values.cooldownMin}
          error={errors.cooldownMin}
          onChange={v => onChange('cooldownMin', v)}
          placeholder="60"
          hint="От 1 до 10080 минут (до 7 дней)."
          autoComplete="off"
          inputMode="decimal"
        />
      </div>

      <SelectField
        id="action"
        label="Действие"
        value={values.action}
        options={actionOptions}
        onChange={v => onChange('action', v)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="threshold"
          label="Порог срабатывания"
          value={values.threshold}
          error={errors.threshold}
          onChange={v => onChange('threshold', v)}
          placeholder="10"
          inputMode="decimal"
          autoComplete="off"
        />
        <SelectField
          id="operator"
          label="Оператор сравнения"
          value={values.operator}
          error={errors.operator}
          placeholder="Выберите оператор"
          options={operatorOptions}
          onChange={v => onChange('operator', v)}
        />
      </div>

      {values.action === 'WRITEBACK_PRICE' && (
        <TextField
          id="priceAdjustPct"
          label="Корректировка цены (%)"
          value={values.priceAdjustPct}
          error={errors.priceAdjustPct}
          onChange={v => onChange('priceAdjustPct', v)}
          placeholder="-5"
          hint="От -100 до 100 процентов."
          inputMode="decimal"
          autoComplete="off"
        />
      )}
      {values.action === 'CREATE_TASK' && (
        <TextField
          id="taskType"
          label="Тип задачи"
          value={values.taskType}
          error={errors.taskType}
          onChange={v => onChange('taskType', v)}
          placeholder="например: supply_planning"
          autoComplete="off"
        />
      )}
      {values.action === 'NOTIFY' && (
        <TextField
          id="message"
          label="Текст уведомления"
          value={values.message}
          error={errors.message}
          onChange={v => onChange('message', v)}
          placeholder="Текст, который получит оператор."
          autoComplete="off"
        />
      )}
    </fieldset>
  )
}
