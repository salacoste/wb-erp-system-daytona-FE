import postcss from 'postcss'
import tailwindcssPostcss from '@tailwindcss/postcss'
import { describe, expect, it } from 'vitest'

import {
  contrastRatio,
  declarationsFor,
  globalsPath,
  globalsSource,
  hslTripletToHex,
  parseGlobals,
} from './token-test-utils'

const semanticClasses = [
  'bg-brand',
  'bg-primary',
  'bg-card',
  'border-border',
  'text-muted-foreground',
  'text-destructive',
  'bg-primary-pressed',
  'bg-primary-subtle',
  'bg-destructive',
  'text-financial-positive',
  'text-financial-negative',
  'text-status-warning',
  'text-status-information',
  'text-availability-unavailable',
  'text-availability-unknown',
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
  'outline-ring',
  'text-primary-dark',
  'text-telegram-blue',
  'shadow-card',
  'shadow-card-hover',
  'animate-slide-down',
  'animate-in',
  'fade-in',
  'slide-in-from-left-4',
  'text-h1',
  'text-h2',
  'text-body',
  'text-metric',
  'text-metric-lg',
  'mt-18',
  'mt-22',
  'rounded',
  'rounded-sm',
  'rounded-md',
  'rounded-lg',
]

const textPairs = [
  ['background', 'foreground'],
  ['card', 'card-foreground'],
  ['popover', 'popover-foreground'],
  ['muted', 'muted-foreground'],
  ['secondary', 'secondary-foreground'],
  ['accent', 'accent-foreground'],
  ['disabled', 'disabled-foreground'],
  ['brand', 'brand-foreground'],
  ['primary', 'primary-foreground'],
  ['primary-pressed', 'primary-foreground'],
  ['primary-subtle', 'primary-subtle-foreground'],
  ['destructive', 'destructive-foreground'],
  ['status-success', 'status-success-foreground'],
  ['status-warning', 'status-warning-foreground'],
  ['status-error', 'status-error-foreground'],
  ['status-information', 'status-information-foreground'],
  ['status-pending', 'status-pending-foreground'],
  ['chart-tooltip', 'chart-tooltip-foreground'],
] as const

const chartRoles = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6']

const semanticTextRoles = [
  'primary',
  'primary-pressed',
  'destructive',
  'financial-positive',
  'financial-negative',
  'financial-neutral',
  'status-success',
  'status-warning',
  'status-error',
  'status-information',
  'status-pending',
  'availability-available',
  'availability-unavailable',
  'availability-stale',
  'availability-partial',
  'availability-restricted',
  'availability-unknown',
] as const

describe('compiled semantic utilities and contrast', () => {
  const root = parseGlobals()

  it('compiles representative semantic and legacy-compatible utilities', async () => {
    const source = `${globalsSource}\n@source inline("${semanticClasses.join(' ')}");`
    const result = await postcss([tailwindcssPostcss()]).process(source, {
      from: globalsPath,
    })

    expect(result.warnings()).toEqual([])
    for (const className of semanticClasses) {
      expect(result.css, className).toContain(`.${className}`)
    }
    expect(result.css).toContain('var(--primary-pressed)')
    expect(result.css).toContain('var(--telegram)')

    const declarationsForSelector = (selector: string): Map<string, string> => {
      const declarations = new Map<string, string>()
      result.root.walkRules(selector, rule => {
        rule.walkDecls(declaration => {
          declarations.set(declaration.prop, declaration.value.trim())
        })
      })
      return declarations
    }

    expect(declarationsForSelector('.rounded').get('border-radius')).toBe('0.5rem')
    expect(declarationsForSelector('.rounded-sm').get('border-radius')).toBe('0.25rem')
    expect(declarationsForSelector('.rounded-md').get('border-radius')).toBe('0.375rem')
    expect(declarationsForSelector('.rounded-lg').get('border-radius')).toBe('0.75rem')
    expect(declarationsForSelector('.animate-in').get('animation-name')).toBe('enter')
    expect(declarationsForSelector('.fade-in').get('--tw-enter-opacity')).toBe('0')
    expect(declarationsForSelector('.slide-in-from-left-4').get('--tw-enter-translate-x')).toBe(
      '-1rem'
    )
    const h1 = declarationsForSelector('.text-h1')
    expect(h1.get('font-size')).toBe('2rem')
    expect(h1.get('line-height')).toBe('var(--tw-leading, 1.2)')
    expect(h1.get('font-weight')).toBe('var(--tw-font-weight, 700)')
    const h2 = declarationsForSelector('.text-h2')
    expect(h2.get('font-size')).toBe('1.5rem')
    expect(h2.get('line-height')).toBe('var(--tw-leading, 1.3)')
    expect(h2.get('font-weight')).toBe('var(--tw-font-weight, 600)')
    const body = declarationsForSelector('.text-body')
    expect(body.get('font-size')).toBe('0.875rem')
    expect(body.get('line-height')).toBe('var(--tw-leading, 1.5)')
    expect(body.get('font-weight')).toBe('var(--tw-font-weight, 400)')
    expect(declarationsForSelector('.text-metric').get('font-size')).toBe('2rem')
    expect(declarationsForSelector('.text-metric-lg').get('font-size')).toBe('3rem')
    expect(declarationsForSelector('.mt-18').get('margin-top')).toBe('4.5rem')
    expect(declarationsForSelector('.mt-22').get('margin-top')).toBe('5.5rem')
    expect(declarationsForSelector('.shadow-card').get('--tw-shadow')).toContain('0 1px 3px')
    expect(declarationsForSelector('.shadow-card-hover').get('--tw-shadow')).toContain('0 4px 6px')
    expect(declarationsForSelector('.animate-slide-down').get('animation')).toBe(
      'slide-down 200ms ease-out'
    )
  })

  it.each([':root', '.dark'])('%s normal-text pairs meet WCAG AA', selector => {
    const tokens = declarationsFor(root, selector)
    for (const [background, foreground] of textPairs) {
      const ratio = contrastRatio(
        tokens.get(`--${background}`) ?? '',
        tokens.get(`--${foreground}`) ?? ''
      )
      expect(ratio, `${selector} ${background}/${foreground}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it.each([':root', '.dark'])('%s focus ring meets non-text contrast', selector => {
    const tokens = declarationsFor(root, selector)
    for (const surface of ['background', 'card'] as const) {
      expect(
        contrastRatio(tokens.get(`--${surface}`) ?? '', tokens.get('--ring') ?? ''),
        `${selector} ring/${surface}`
      ).toBeGreaterThanOrEqual(3)
    }
  })

  it.each([':root', '.dark'])(
    '%s semantic text roles meet WCAG AA on page and card surfaces',
    selector => {
      const tokens = declarationsFor(root, selector)
      for (const role of semanticTextRoles) {
        for (const surface of ['background', 'card'] as const) {
          expect(
            contrastRatio(tokens.get(`--${surface}`) ?? '', tokens.get(`--${role}`) ?? ''),
            `${selector} ${role}/${surface}`
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
  )

  it('keeps brand red out of the white-text interactive mapping', () => {
    const light = declarationsFor(root, ':root')
    const white = light.get('--primary-foreground') ?? ''
    expect(contrastRatio(light.get('--brand') ?? '', white)).toBeLessThan(4.5)
    expect(contrastRatio(light.get('--primary') ?? '', white)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(light.get('--primary-pressed') ?? '', white)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([':root', '.dark'])('%s chart categories stay unique', selector => {
    const tokens = declarationsFor(root, selector)
    const values = chartRoles.map(role => hslTripletToHex(tokens.get(`--${role}`) ?? ''))
    expect(new Set(values)).toHaveLength(chartRoles.length)
  })
})
