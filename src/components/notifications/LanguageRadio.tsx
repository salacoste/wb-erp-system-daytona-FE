// ============================================================================
// Language Radio Component
// Epic 34-FE: Story 34.3-FE - Notification Preferences Panel
// ============================================================================

import { cn } from '@/lib/utils';

/**
 * Props for LanguageRadio component
 * Story 34.3-FE: AC3 - Language Switcher with Q8 Radio Buttons
 */
interface LanguageRadioProps {
  value: 'ru' | 'en';
  label: string; // e.g., "🇷🇺 Русский" or "🇬🇧 English"
  selected: boolean;
  onSelect: () => void;
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
export function LanguageRadio({
  value,
  label,
  selected,
  onSelect,
}: LanguageRadioProps) {
  return (
    <label
      className={cn(
        'flex items-center gap-2 px-5 py-3 rounded-lg cursor-pointer transition-all',
        'border-2',
        selected
          ? 'border-telegram-blue bg-blue-50 text-gray-800 font-medium' // AC3: Selected state (Q8)
          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50' // AC3: Unselected state (Q8)
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
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? 'border-telegram-blue' : 'border-gray-400'
        )}
        aria-hidden="true"
      >
        {selected && <div className="w-3 h-3 rounded-full bg-telegram-blue" />}
      </div>

      <span>{label}</span>
    </label>
  );
}
