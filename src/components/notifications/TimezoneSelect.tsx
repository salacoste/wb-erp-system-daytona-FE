// ============================================================================
// Timezone Select Component
// Epic 34-FE: Story 34.4-FE
// ============================================================================

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Timezone data structure with grouped Russian timezones
 * Ref: Story 34.4-FE Q12 - Grouped dropdown
 */
const TIMEZONES = [
  {
    group: 'Европа',
    zones: [
      { value: 'Europe/Kaliningrad', label: 'Калининград (GMT+2)', offset: '+02:00' },
      { value: 'Europe/Moscow', label: 'Москва (GMT+3)', offset: '+03:00' },
      { value: 'Europe/Samara', label: 'Самара (GMT+4)', offset: '+04:00' },
    ],
  },
  {
    group: 'Азия',
    zones: [
      { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (GMT+5)', offset: '+05:00' },
      { value: 'Asia/Omsk', label: 'Омск (GMT+6)', offset: '+06:00' },
      { value: 'Asia/Krasnoyarsk', label: 'Красноярск (GMT+7)', offset: '+07:00' },
      { value: 'Asia/Irkutsk', label: 'Иркутск (GMT+8)', offset: '+08:00' },
      { value: 'Asia/Yakutsk', label: 'Якутск (GMT+9)', offset: '+09:00' },
      { value: 'Asia/Vladivostok', label: 'Владивосток (GMT+10)', offset: '+10:00' },
      { value: 'Asia/Magadan', label: 'Магадан (GMT+11)', offset: '+11:00' },
      { value: 'Asia/Kamchatka', label: 'Камчатка (GMT+12)', offset: '+12:00' },
    ],
  },
];

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  disabled?: boolean;
}

/**
 * Grouped timezone dropdown for Russian timezones
 *
 * Features:
 * - Grouped by Europe and Asia regions
 * - 10-15 popular Russian timezones
 * - Format: "City (GMT+X)"
 * - 240px width on desktop, full-width on mobile
 *
 * Ref: Story 34.4-FE AC#2
 */
export function TimezoneSelect({ value, onChange, disabled = false }: TimezoneSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        className="w-full sm:w-60"
        aria-label="Выберите часовой пояс"
      >
        <SelectValue placeholder="Выберите часовой пояс" />
      </SelectTrigger>

      <SelectContent className="max-h-80">
        {TIMEZONES.map((group) => (
          <SelectGroup key={group.group}>
            <SelectLabel className="text-xs font-semibold text-gray-700 uppercase">
              {group.group}
            </SelectLabel>
            {group.zones.map((zone) => (
              <SelectItem
                key={zone.value}
                value={zone.value}
                className="pl-6"
              >
                {zone.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
