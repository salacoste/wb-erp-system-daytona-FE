import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  declarationsFor,
  hslTripletToHex,
  parseGlobals,
  themeInlineRules,
} from './token-test-utils'

const requiredRoles = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'muted',
  'muted-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'border',
  'input',
  'disabled',
  'disabled-foreground',
  'ring',
  'ring-offset-background',
  'brand',
  'brand-foreground',
  'primary',
  'primary-foreground',
  'primary-pressed',
  'primary-subtle',
  'primary-subtle-foreground',
  'destructive',
  'destructive-foreground',
  'financial-positive',
  'financial-negative',
  'financial-neutral',
  'status-success',
  'status-success-foreground',
  'status-warning',
  'status-warning-foreground',
  'status-error',
  'status-error-foreground',
  'status-information',
  'status-information-foreground',
  'status-pending',
  'status-pending-foreground',
  'availability-available',
  'availability-unavailable',
  'availability-stale',
  'availability-partial',
  'availability-restricted',
  'availability-unknown',
  'telegram',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'chart-positive',
  'chart-negative',
  'chart-reference',
  'chart-target',
  'chart-forecast',
  'chart-confidence-band',
  'chart-grid',
  'chart-axis',
  'chart-tooltip',
  'chart-tooltip-foreground',
  'chart-selection',
] as const

describe('globals semantic token contract', () => {
  const root = parseGlobals()
  const light = declarationsFor(root, ':root')
  const dark = declarationsFor(root, '.dark')

  it('defines the approved red identity values exactly', () => {
    expect(hslTripletToHex(light.get('--brand') ?? '')).toBe('#E53935')
    expect(hslTripletToHex(light.get('--primary') ?? '')).toBe('#C62828')
    expect(hslTripletToHex(light.get('--primary-pressed') ?? '')).toBe('#A31515')
    expect(hslTripletToHex(light.get('--primary-subtle') ?? '')).toBe('#FFCDD2')
  })

  it('registers one CSS-variable-only application color theme', () => {
    const themes = themeInlineRules(root)
    expect(themes).toHaveLength(1)

    const mappings = new Map<string, string>()
    themes[0].walkDecls(/^--color-/, declaration => {
      mappings.set(declaration.prop, declaration.value.trim())
    })
    expect(mappings.size).toBeGreaterThan(requiredRoles.length)
    for (const value of mappings.values()) {
      expect(value).toMatch(/^hsl\(var\(--[a-z0-9-]+\)\)$/)
    }
  })

  it('defines and maps every required role in both themes', () => {
    const theme = themeInlineRules(root)[0]
    const mappings = new Map<string, string>()
    theme.walkDecls(/^--color-/, declaration => {
      mappings.set(declaration.prop, declaration.value.trim())
    })

    for (const role of requiredRoles) {
      expect(light.has(`--${role}`), `light --${role}`).toBe(true)
      expect(dark.has(`--${role}`), `dark --${role}`).toBe(true)
      expect(mappings.get(`--color-${role}`), `theme --color-${role}`).toBe(`hsl(var(--${role}))`)
    }
  })

  it('keeps critical red and state meanings as independent roles', () => {
    const theme = themeInlineRules(root)[0]
    const roles = [
      'brand',
      'primary',
      'destructive',
      'financial-negative',
      'status-error',
      'availability-unavailable',
      'availability-unknown',
    ] as const
    const mappings = new Map<string, string>()
    theme.walkDecls(/^--color-/, declaration => {
      mappings.set(declaration.prop, declaration.value.trim())
    })

    for (const role of roles) {
      expect(light.get(`--${role}`), `light --${role}`).toBeTruthy()
      expect(dark.get(`--${role}`), `dark --${role}`).toBeTruthy()
      expect(mappings.get(`--color-${role}`), `theme --color-${role}`).toBe(`hsl(var(--${role}))`)
    }

    expect(new Set(roles.map(role => mappings.get(`--color-${role}`)))).toHaveLength(roles.length)
  })

  it('aligns shadcn and PostCSS with Tailwind v4 without a config palette', () => {
    const components = JSON.parse(fs.readFileSync('components.json', 'utf8'))
    expect(components.tailwind).toEqual({
      config: '',
      css: 'src/styles/globals.css',
      baseColor: 'neutral',
      cssVariables: true,
      prefix: '',
    })
    expect(components.aliases).toEqual({
      components: '@/components',
      utils: '@/lib/utils',
      ui: '@/components/ui',
      lib: '@/lib',
      hooks: '@/hooks',
    })
    expect(components.style).toBe('new-york')
    expect(components.rsc).toBe(true)
    expect(components.tsx).toBe(true)
    expect(components.iconLibrary).toBe('lucide')

    const postcssConfig = fs.readFileSync('postcss.config.js', 'utf8')
    expect(postcssConfig).toContain("'@tailwindcss/postcss': {}")
    const tailwindPath = path.resolve('tailwind.config.ts')
    if (fs.existsSync(tailwindPath)) {
      expect(fs.readFileSync(tailwindPath, 'utf8')).not.toMatch(/\bcolors\s*:/)
    }
  })
})
