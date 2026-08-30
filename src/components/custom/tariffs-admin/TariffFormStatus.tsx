import { CircleAlert, Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  getFirstTariffErrorMessage,
  TARIFF_FIELD_LABELS,
  type TariffSettingsFormData,
} from './tariffSettingsSchema'
import type { FieldErrors } from 'react-hook-form'

interface TariffFormStatusProps {
  errors: FieldErrors<TariffSettingsFormData>
  unavailableFieldLabels: string[]
  saveOutcome: 'idle' | 'success' | 'error'
}

export function TariffFormStatus({
  errors,
  unavailableFieldLabels,
  saveOutcome,
}: TariffFormStatusProps) {
  const errorSummary = Object.entries(errors).flatMap(([field, error]) => {
    const message = getFirstTariffErrorMessage(error)
    if (!message) return []
    return [
      {
        field,
        label: TARIFF_FIELD_LABELS[field as keyof typeof TARIFF_FIELD_LABELS] ?? field,
        message,
      },
    ]
  })
  const saveAnnouncement =
    saveOutcome === 'success'
      ? 'Тарифы сохранены. Текущие значения обновлены.'
      : saveOutcome === 'error'
        ? 'Не удалось сохранить тарифы. Введённые значения сохранены для повторной попытки.'
        : ''

  return (
    <>
      {unavailableFieldLabels.length > 0 && (
        <Alert
          role="status"
          aria-label="Часть значений тарифов недоступна"
          className="border-status-warning/40 bg-status-warning/10"
        >
          <Info aria-hidden="true" className="h-4 w-4 text-status-warning" />
          <AlertTitle>Часть текущих значений не получена от сервера</AlertTitle>
          <AlertDescription>
            Для редактирования показаны стандартные значения. Перед сохранением проверьте:{' '}
            {unavailableFieldLabels.join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {errorSummary.length > 0 && (
        <Alert variant="destructive" aria-label="Ошибки формы тарифов">
          <CircleAlert aria-hidden="true" className="h-4 w-4" />
          <AlertTitle>Проверьте значения тарифов</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-5">
              {errorSummary.map(item => (
                <li key={item.field}>
                  <span className="font-medium">{item.label}:</span> {item.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div
        role="status"
        aria-live="polite"
        aria-label="Результат сохранения тарифов"
        className={
          saveOutcome === 'success'
            ? 'min-h-5 text-sm text-status-success'
            : 'min-h-5 text-sm text-destructive'
        }
      >
        {saveAnnouncement}
      </div>
    </>
  )
}
