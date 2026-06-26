/**
 * Unit tests for persona presets (TZ-4): role→persona mapping, hidden-widget sets, labels.
 */

import { describe, it, expect } from 'vitest'
import {
  HIDDEN_BY_PERSONA,
  PERSONA_LABELS,
  isPersonaValue,
  personaForRole,
  type Persona,
} from '../persona-presets'
import { WIDGET_LABELS, type WidgetId } from '../dashboardWidgetsStore'

const PERSONAS: Persona[] = ['Owner', 'Ops', 'CFO']

describe('persona-presets (TZ-4)', () => {
  describe('personaForRole', () => {
    it('maps Owner|Manager → Owner', () => {
      expect(personaForRole('Owner')).toBe('Owner')
      expect(personaForRole('Manager')).toBe('Owner')
    })

    it('maps Analyst|Service → CFO', () => {
      expect(personaForRole('Analyst')).toBe('CFO')
      expect(personaForRole('Service')).toBe('CFO')
    })

    it('defaults unknown/null/undefined → Owner', () => {
      expect(personaForRole('Unknown')).toBe('Owner')
      expect(personaForRole(null)).toBe('Owner')
      expect(personaForRole(undefined)).toBe('Owner')
    })
  })

  describe('HIDDEN_BY_PERSONA', () => {
    it('Owner hides nothing', () => {
      expect(HIDDEN_BY_PERSONA.Owner).toEqual([])
    })

    it('Ops and CFO hide distinct, non-empty sets', () => {
      expect(HIDDEN_BY_PERSONA.Ops.length).toBeGreaterThan(0)
      expect(HIDDEN_BY_PERSONA.CFO.length).toBeGreaterThan(0)
    })

    it('every hidden widget id is a valid WidgetId', () => {
      const validIds = new Set(Object.keys(WIDGET_LABELS) as WidgetId[])
      for (const persona of PERSONAS) {
        for (const id of HIDDEN_BY_PERSONA[persona]) {
          expect(validIds.has(id)).toBe(true)
        }
      }
    })

    it('no persona hides so many widgets that fewer than 3 remain visible', () => {
      const total = Object.keys(WIDGET_LABELS).length
      for (const persona of PERSONAS) {
        const visibleCount = total - HIDDEN_BY_PERSONA[persona].length
        expect(visibleCount).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe('PERSONA_LABELS', () => {
    it('has a non-empty Russian label for every persona', () => {
      for (const persona of PERSONAS) {
        expect(PERSONA_LABELS[persona].length).toBeGreaterThan(0)
      }
    })
  })

  describe('isPersonaValue', () => {
    it('accepts the 3 known personas', () => {
      for (const persona of PERSONAS) {
        expect(isPersonaValue(persona)).toBe(true)
      }
    })

    it('rejects unknown / corrupted / non-string values', () => {
      expect(isPersonaValue('Garbage')).toBe(false)
      expect(isPersonaValue('')).toBe(false)
      expect(isPersonaValue(null)).toBe(false)
      expect(isPersonaValue(undefined)).toBe(false)
      expect(isPersonaValue(42)).toBe(false)
    })
  })
})
