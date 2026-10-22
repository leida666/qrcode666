import type { ECLevel, QrMatrix } from './encode'
import type { RenderOptions } from './render'

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** WCAG 2 relative luminance. */
export function luminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** Below this the code is blocked from download: too faint to scan reliably. */
export const MIN_CONTRAST = 2
/** Below this we warn. */
export const GOOD_CONTRAST = 3.5

/**
 * Largest logo (fraction of symbol width) allowed per error-correction level.
 * The logo covers roughly size² of the symbol area. In our decode sweep
 * (jsQR + ZXing, every module/eye style) decoding first broke at 0.36 for Q
 * and 0.40 for H; these limits keep a ~10-point margin for camera blur,
 * glare and print defects. Re-verified by tests/unit/decode.test.ts.
 */
export const LOGO_MAX: Record<ECLevel, number> = { L: 0, M: 0, Q: 0.22, H: 0.26 }
export const LOGO_MIN = 0.12

/** Logos are only allowed with Q or H error correction. */
export function logoEcLevel(level: ECLevel): ECLevel {
  return level === 'H' || level === 'Q' ? level : 'H'
}

export type Severity = 'error' | 'warn' | 'info'
export type QualityCode =
  | 'contrastTooLow'
  | 'contrastLow'
  | 'inverted'
  | 'transparent'
  | 'marginTiny'
  | 'marginSmall'
  | 'dense'
  | 'logoEc'
  | 'logoNoPlate'

export interface QualityIssue {
  code: QualityCode
  severity: Severity
}

export function assessQuality(matrix: QrMatrix | null, opts: RenderOptions, logoRaisedEc: boolean): QualityIssue[] {
  const issues: QualityIssue[] = []
  const ratio = contrastRatio(opts.fg, opts.bg)
  if (!opts.transparent) {
    if (ratio < MIN_CONTRAST) issues.push({ code: 'contrastTooLow', severity: 'error' })
    else if (ratio < GOOD_CONTRAST) issues.push({ code: 'contrastLow', severity: 'warn' })
    if (luminance(opts.fg) > luminance(opts.bg) && ratio >= MIN_CONTRAST) {
      issues.push({ code: 'inverted', severity: 'warn' })
    }
  } else {
    issues.push({ code: 'transparent', severity: 'warn' })
    // A transparent code still needs dark modules; light ones vanish on white paper.
    if (contrastRatio(opts.fg, '#ffffff') < MIN_CONTRAST) issues.push({ code: 'contrastTooLow', severity: 'error' })
  }
  if (opts.margin < 2) issues.push({ code: 'marginTiny', severity: 'warn' })
  else if (opts.margin < 4) issues.push({ code: 'marginSmall', severity: 'info' })
  if (matrix && matrix.version >= 20) issues.push({ code: 'dense', severity: 'info' })
  if (opts.logo && logoRaisedEc) issues.push({ code: 'logoEc', severity: 'info' })
  if (opts.logo && !opts.logo.plate) issues.push({ code: 'logoNoPlate', severity: 'warn' })
  return issues
}

export const isBlocking = (issues: QualityIssue[]) => issues.some((i) => i.severity === 'error')
