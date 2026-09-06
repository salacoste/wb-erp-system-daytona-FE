'use client'

/**
 * WritebackSafetyAcknowledgement (Story 163.3-FE, AC #4).
 *
 * Explains the PRICE_WRITEBACK_ENABLED cabinet kill-switch + the effect of
 * enabling price writeback. When the pending save "could activate" price
 * writeback (isActivatingWriteback === true) an explicit acknowledgement
 * checkbox gates Save — the operator must confirm before the action takes effect.
 *
 * Purely presentational; the ack state + Save gating live in InstalledRuleEditor.
 *
 * Migrated Story 172.4-FE: warning panel on status-warning tokens (dark-aware).
 */
import { AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface WritebackSafetyAcknowledgementProps {
  /** True when the pending save could activate price writeback. */
  activating: boolean
  /** Current acknowledgement state. */
  acknowledged: boolean
  /** Toggle the acknowledgement. */
  onAcknowledgementChange: (next: boolean) => void
}

export function WritebackSafetyAcknowledgement({
  activating,
  acknowledged,
  onAcknowledgementChange,
}: WritebackSafetyAcknowledgementProps) {
  const checkboxId = 'writeback-ack'
  return (
    <section
      className="rounded-md border border-status-warning/40 bg-status-warning/10 p-4"
      aria-labelledby={`${checkboxId}-title`}
      data-testid="writeback-safety"
    >
      <div className="flex items-start gap-2">
        {/* p2-wave-6: icon = non-text channel on warn/10 (real stack
            bg>muted/50): 4.07/10.03 >= 3:1 (1.4.11) — full warn kept as the
            valence carrier for the fg-on-tint body below. */}
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-status-warning" aria-hidden="true" />
        {/* p2-wave-6: fg-on-tint — full warn on warn/10 = 4.07/10.03 (FAIL 4.5);
            text-foreground = 13.34/12.41. Valence = tint + border + icon. */}
        <div className="space-y-2 text-sm text-foreground">
          <h3 id={`${checkboxId}-title`} className="font-medium">
            Изменение цены (write-back)
          </h3>
          <p>
            Правило с действием «Изменение цены» меняет цены только когда включён отдельный
            рубильник кабинета{' '}
            {/* p2-wave-6: compounding /20-on-/10 chip measured 3.15 light —
                layer removed; code text inherits the fg-on-tint body. */}
            <code className="rounded px-1">PRICE_WRITEBACK_ENABLED</code>. Пока рубильник выключен,
            правило остаётся неактивным даже после сохранения.
          </p>
          <p>
            Включение такого правила и активация рубильника приведут к реальным изменениям цен на
            товары.
          </p>
          {activating ? (
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id={checkboxId}
                checked={acknowledged}
                onCheckedChange={v => onAcknowledgementChange(v === true)}
                data-testid="writeback-ack-checkbox"
              />
              <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium">
                Я понимаю, что сохранение может привести к изменению цен товаров, и подтверждаю это
                действие.
              </Label>
            </div>
          ) : (
            // p2-80-sweep: fg-on-tint — warn/80 AND full warn both fail 4.5:1
            // light on background > status-warning/10 (3.04 / 4.24); fg = 14.18.
            <p className="text-xs text-foreground" data-testid="writeback-safety-passive">
              Сейчас сохранение не приводит к немедленному изменению цен.
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
