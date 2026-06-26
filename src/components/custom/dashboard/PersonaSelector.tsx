'use client'

/**
 * PersonaSelector (TZ-4) — header control to switch the dashboard persona preset.
 * On first load (no persisted persona) it applies the role→persona default. The choice
 * is persisted via the widget store (localStorage), so it survives reloads.
 *
 * @see docs/ux/IMPLEMENTATION-TZ.md (TZ-4)
 */

import { useEffect } from 'react'
import { Users } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDashboardWidgetsStore } from '@/stores/dashboardWidgetsStore'
import { useAuthStore } from '@/stores/authStore'
import {
  PERSONA_LABELS,
  isPersonaValue,
  personaForRole,
  type Persona,
} from '@/stores/persona-presets'

const PERSONAS: readonly Persona[] = ['Owner', 'Ops', 'CFO']

export function PersonaSelector(): React.ReactElement {
  const persona = useDashboardWidgetsStore(s => s.persona)
  const applyPersona = useDashboardWidgetsStore(s => s.applyPersona)
  const role = useAuthStore(s => s.user?.role)

  const roleDefault = personaForRole(role)

  // Role default on first load: when no persona is persisted yet, apply the role's preset.
  // Re-runs if role arrives async; once a persona is set (role default or user pick) it stops.
  useEffect(() => {
    if (persona === null && role) {
      applyPersona(roleDefault)
    }
  }, [persona, role, roleDefault, applyPersona])

  // Display the role default while the persisted persona is null (first paint, before the effect).
  const value = persona ?? roleDefault

  // radix Select returns a string; validate at the boundary before applying.
  const handleSelect = (selected: string) => {
    if (isPersonaValue(selected)) applyPersona(selected)
  }

  return (
    <Select value={value} onValueChange={handleSelect}>
      <SelectTrigger className="h-9 w-[150px]" aria-label="Персона дашборда">
        <Users className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERSONAS.map(p => (
          <SelectItem key={p} value={p}>
            {PERSONA_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
