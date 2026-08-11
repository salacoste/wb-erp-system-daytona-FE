import fs from 'node:fs'
import path from 'node:path'

import postcss, { type AtRule, type Root } from 'postcss'

export const globalsPath = path.resolve(process.cwd(), 'src/styles/globals.css')
export const globalsSource = fs.readFileSync(globalsPath, 'utf8')

export const parseGlobals = (): Root => postcss.parse(globalsSource, { from: globalsPath })

export const themeInlineRules = (root: Root): AtRule[] => {
  const rules: AtRule[] = []
  root.walkAtRules('theme', rule => {
    if (rule.params.trim() === 'inline') rules.push(rule)
  })
  return rules
}

export const declarationsFor = (root: Root, selector: string): Map<string, string> => {
  const declarations = new Map<string, string>()
  root.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return
    rule.walkDecls(/^--/, declaration => {
      declarations.set(declaration.prop, declaration.value.trim())
    })
  })
  return declarations
}

const hslToRgb = (value: string): [number, number, number] => {
  const match = value.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/)
  if (!match) throw new Error(`Expected an HSL triplet, received: ${value}`)

  const hue = (Number(match[1]) % 360) / 360
  const saturation = Number(match[2]) / 100
  const lightness = Number(match[3]) / 100

  if (saturation === 0) {
    const channel = Math.round(lightness * 255)
    return [channel, channel, channel]
  }

  const q =
    lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation
  const p = 2 * lightness - q
  const channel = (offset: number): number => {
    let point = hue + offset
    if (point < 0) point += 1
    if (point > 1) point -= 1
    if (point < 1 / 6) return p + (q - p) * 6 * point
    if (point < 1 / 2) return q
    if (point < 2 / 3) return p + (q - p) * (2 / 3 - point) * 6
    return p
  }

  return [channel(1 / 3), channel(0), channel(-1 / 3)].map(item => Math.round(item * 255)) as [
    number,
    number,
    number,
  ]
}

export const hslTripletToHex = (value: string): string =>
  `#${hslToRgb(value)
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()

const relativeLuminance = (value: string): number => {
  const channels = hslToRgb(value).map(channel => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

export const contrastRatio = (background: string, foreground: string): number => {
  const values = [relativeLuminance(background), relativeLuminance(foreground)].sort(
    (left, right) => right - left
  )
  return (values[0] + 0.05) / (values[1] + 0.05)
}
