import { CapacityError, encodeQr, type ECLevel, type QrMatrix } from './encode'
import { assessQuality, LOGO_MAX, logoEcLevel, type QualityIssue } from './quality'
import { buildGeometry, renderSvg, type EyeStyle, type ModuleStyle, type QrGeometry, type RenderOptions } from './render'

export * from './encode'
export * from './payload'
export * from './quality'
export * from './render'

export interface QrStyle {
  fg: string
  bg: string
  transparent: boolean
  margin: number
  moduleStyle: ModuleStyle
  eyeStyle: EyeStyle
  corner: number
  ecLevel: ECLevel
}

export type PresetId = 'classic' | 'minimal' | 'rounded' | 'corporate' | 'bold'

export const PRESETS: Record<PresetId, Omit<QrStyle, 'margin' | 'transparent'>> = {
  classic: { fg: '#000000', bg: '#ffffff', moduleStyle: 'square', eyeStyle: 'square', corner: 0, ecLevel: 'M' },
  minimal: { fg: '#111111', bg: '#ffffff', moduleStyle: 'dots', eyeStyle: 'rounded', corner: 0.6, ecLevel: 'M' },
  rounded: { fg: '#0a0a0a', bg: '#ffffff', moduleStyle: 'fluid', eyeStyle: 'rounded', corner: 0.8, ecLevel: 'Q' },
  corporate: { fg: '#0b1f3a', bg: '#ffffff', moduleStyle: 'square', eyeStyle: 'rounded', corner: 0.3, ecLevel: 'Q' },
  bold: { fg: '#1d3bff', bg: '#ffffff', moduleStyle: 'soft', eyeStyle: 'circle', corner: 1, ecLevel: 'Q' },
}

export const DEFAULT_STYLE: QrStyle = { ...PRESETS.classic, margin: 4, transparent: false }

export interface LogoInput {
  src: string
  aspect: number
  size: number
  plate: boolean
}

export interface QrResult {
  matrix: QrMatrix
  geometry: QrGeometry
  options: RenderOptions
  /** The level actually used — raised to H when a logo needs it. */
  ecLevel: ECLevel
  issues: QualityIssue[]
}

export type QrOutcome = { ok: true; result: QrResult } | { ok: false; capacity: CapacityError }

/** Smallest version used with a logo, so the logo never dwarfs the data. */
export const LOGO_MIN_VERSION = 5

export function generateQr(payload: string, style: QrStyle, logo: LogoInput | null): QrOutcome {
  const ecLevel = logo ? logoEcLevel(style.ecLevel) : style.ecLevel
  let matrix: QrMatrix
  try {
    matrix = encodeQr(payload, ecLevel, logo ? LOGO_MIN_VERSION : 1)
  } catch (err) {
    if (err instanceof CapacityError) return { ok: false, capacity: err }
    throw err
  }
  const options: RenderOptions = {
    fg: style.fg,
    bg: style.bg,
    transparent: style.transparent,
    margin: style.margin,
    moduleStyle: style.moduleStyle,
    eyeStyle: style.eyeStyle,
    corner: style.corner,
    logo: logo ? { ...logo, size: Math.min(logo.size, LOGO_MAX[ecLevel]) } : null,
  }
  const geometry = buildGeometry(matrix, options)
  const issues = assessQuality(matrix, options, ecLevel !== style.ecLevel)
  return { ok: true, result: { matrix, geometry, options, ecLevel, issues } }
}

export function toSvg(result: QrResult, pixelSize?: number): string {
  return renderSvg(result.geometry, result.options, pixelSize)
}
