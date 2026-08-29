// ============================================================================
// Language Radio Component
// Epic 34-FE: Story 34.3-FE - Notification Preferences Panel
// ============================================================================

import { cn } from '@/lib/utils'

/**
 * Props for LanguageRadio component
 * Story 34.3-FE: AC3 - Language Switcher with Q8 Radio Buttons
 */
interface LanguageRadioProps {
  value: 'ru' | 'en'
  label: string // e.g., "🇷🇺 Русский" or "🇬🇧 English"
  selected: boolean
  onSelect: () => void
}

/**
 * LanguageRadio - Custom radio button for language selection
 *
 * Features (Q8):
 * - Horizontal layout (side-by-side)
 * - Selected state: Telegram Blue border, light blue background
 * - Unselected state: Gray 300 border, white background
 * - Custom radio circle with inner dot when selected
 *
 * @example
 * ```tsx
 * <LanguageRadio
 *   value="ru"
 *   label="🇷🇺 Русский"
 *   selected={language === 'ru'}
 *   onSelect={() => changeLanguage('ru')}
 * />
 * ```
 */
export function LanguageRadio({ value, label, selected, onSelect }: LanguageRadioProps) {
  return (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-5 py-3 transition-all',
        'border-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        selected
          ? 'border-telegram bg-telegram/10 font-medium text-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted'
      )}
    >
      <input
        type="radio"
        name="language"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only" // Hide native radio, use custom styling
        aria-label={label}
      />

      {/* Custom Radio Circle */}
      <div
        className={cn(
          'flex size-5 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-telegram' : 'border-muted-foreground'
        )}
        aria-hidden="true"
      >
        {selected && <div className="size-3 rounded-full bg-telegram" />}
      </div>

      <span>{label}</span>
    </label>
  )
}
