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

const rgbToHslTriplet = (rgb: [number, number, number]): string => {
  const [r255, g255, b255] = rgb.map(channel => channel / 255) as [number, number, number]
  const max = Math.max(...rgb) / 255
  const min = Math.min(...rgb) / 255
  const lightness = (max + min) / 2
  const delta = max - min
  let hue = 0
  let saturation = 0
  if (delta !== 0) {
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)
    // `max` derives from the same rounded integers compared above, so exact
    // float ties between channels cannot occur here.
    switch (max) {
      case r255:
        hue = ((g255 - b255) / delta + (g255 < b255 ? 6 : 0)) * 60
        break
      case g255:
        hue = ((b255 - r255) / delta + 2) * 60
        break
      default:
        hue = ((r255 - g255) / delta + 4) * 60
    }
  }
  const trim = (value: number): string => String(Number(value.toFixed(6)))
  return `${trim(hue)} ${trim(saturation * 100)}% ${trim(lightness * 100)}%`
}

// Alpha-composites an overlay HSL triplet over a base one in sRGB (browser
// alpha blending) and returns the resulting HSL triplet — lets contrast pins
// reproduce real tinted stacks (e.g. status-information/20 over card) at the
// token level.
export const compositeTriplets = (base: string, overlay: string, alpha: number): string => {
  const baseRgb = hslToRgb(base)
  const overlayRgb = hslToRgb(overlay)
  return rgbToHslTriplet([
    Math.round(baseRgb[0] * (1 - alpha) + overlayRgb[0] * alpha),
    Math.round(baseRgb[1] * (1 - alpha) + overlayRgb[1] * alpha),
    Math.round(baseRgb[2] * (1 - alpha) + overlayRgb[2] * alpha),
  ])
}
