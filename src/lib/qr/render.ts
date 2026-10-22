import { alignmentCenters, isDark, isFinder, type QrMatrix } from './encode'

export type ModuleStyle = 'square' | 'fluid' | 'soft' | 'dots'
export type EyeStyle = 'square' | 'rounded' | 'circle'

export const MODULE_STYLES: ModuleStyle[] = ['square', 'fluid', 'soft', 'dots']
export const EYE_STYLES: EyeStyle[] = ['square', 'rounded', 'circle']

export interface LogoOptions {
  /** data: URL of the user's image. Never uploaded anywhere. */
  src: string
  /** Width / height of the image, used to fit it inside the logo box. */
  aspect: number
  /** Logo box side as a fraction of the symbol width (quiet zone excluded). */
  size: number
  /** Clear the modules behind the logo and draw a background plate. */
  plate: boolean
}

export interface RenderOptions {
  fg: string
  bg: string
  transparent: boolean
  /** Quiet zone in modules. */
  margin: number
  moduleStyle: ModuleStyle
  eyeStyle: EyeStyle
  /** Background corner rounding, 0–1. */
  corner: number
  logo: LogoOptions | null
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Resolution-independent description of the final image, in module units. */
export interface QrGeometry {
  /** Side length including quiet zone. */
  total: number
  bgRadius: number
  modulesPath: string
  eyeRingPath: string
  eyeCenterPath: string
  plate: (Rect & { r: number }) | null
  logo: Rect | null
}

const f = (n: number) => {
  const r = Math.round(n * 1000) / 1000
  return Object.is(r, -0) ? '0' : String(r)
}

function rectPath(x: number, y: number, w: number, h: number): string {
  return `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}z`
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  if (rr <= 0) return rectPath(x, y, w, h)
  return (
    `M${f(x + rr)} ${f(y)}H${f(x + w - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + w)} ${f(y + rr)}` +
    `V${f(y + h - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + w - rr)} ${f(y + h)}` +
    `H${f(x + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x)} ${f(y + h - rr)}` +
    `V${f(y + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + rr)} ${f(y)}z`
  )
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0z`
}

/** A unit square whose corners are rounded only where they face empty space. */
function fluidModulePath(x: number, y: number, tl: number, tr: number, br: number, bl: number): string {
  let d = `M${f(x + tl)} ${f(y)}H${f(x + 1 - tr)}`
  if (tr) d += `A${tr} ${tr} 0 0 1 ${f(x + 1)} ${f(y + tr)}`
  d += `V${f(y + 1 - br)}`
  if (br) d += `A${br} ${br} 0 0 1 ${f(x + 1 - br)} ${f(y + 1)}`
  d += `H${f(x + bl)}`
  if (bl) d += `A${bl} ${bl} 0 0 1 ${f(x)} ${f(y + 1 - bl)}`
  d += `V${f(y + tl)}`
  if (tl) d += `A${tl} ${tl} 0 0 1 ${f(x + tl)} ${f(y)}`
  return d + 'z'
}

/** Logo box + cleared module area for a given symbol. */
export function logoLayout(matrix: QrMatrix, margin: number, logo: LogoOptions) {
  const n = matrix.size
  const box = n * logo.size
  const aspect = logo.aspect > 0 && Number.isFinite(logo.aspect) ? logo.aspect : 1
  const w = aspect >= 1 ? box : box * aspect
  const h = aspect >= 1 ? box / aspect : box
  const cx = margin + n / 2
  const cy = margin + n / 2
  const image: Rect = { x: cx - w / 2, y: cy - h / 2, w, h }
  if (!logo.plate) return { image, cleared: null as Rect | null }
  // Pad by half a module, then snap outward to whole modules so no module is
  // left partially covered.
  const pad = 0.5
  const x0 = Math.floor(image.x - pad - margin)
  const y0 = Math.floor(image.y - pad - margin)
  const x1 = Math.ceil(image.x + image.w + pad - margin)
  const y1 = Math.ceil(image.y + image.h + pad - margin)
  const cleared: Rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
  return { image, cleared }
}

export function buildGeometry(matrix: QrMatrix, opts: RenderOptions): QrGeometry {
  const n = matrix.size
  const m = opts.margin
  const total = n + 2 * m

  let logo: Rect | null = null
  let plate: QrGeometry['plate'] = null
  let cleared: Rect | null = null
  if (opts.logo) {
    const layout = logoLayout(matrix, m, opts.logo)
    logo = layout.image
    cleared = layout.cleared
    if (cleared) {
      plate = { x: cleared.x + m, y: cleared.y + m, w: cleared.w, h: cleared.h, r: Math.min(1.2, cleared.w / 4) }
    }
  }

  const inCleared = (r: number, c: number) =>
    !!cleared && c >= cleared.x && c < cleared.x + cleared.w && r >= cleared.y && r < cleared.y + cleared.h
  // Alignment patterns are drawn as solid shapes (like the finders) so that
  // gapped module styles never break the 1:1:1 ratio decoders look for.
  // Patterns hidden under a logo are simply cleared with it.
  const alignments = alignmentCenters(matrix.version).filter(
    ([r, c]) => !(inCleared(r - 2, c - 2) || inCleared(r + 2, c + 2) || inCleared(r - 2, c + 2) || inCleared(r + 2, c - 2)),
  )
  const isAlignment = (r: number, c: number) => alignments.some(([ar, ac]) => Math.abs(r - ar) <= 2 && Math.abs(c - ac) <= 2)
  const on = (r: number, c: number) =>
    isDark(matrix, r, c) && !isFinder(n, r, c) && !inCleared(r, c) && !isAlignment(r, c)

  const parts: string[] = []
  if (opts.moduleStyle === 'square') {
    // Merge horizontal runs into single rectangles: smaller files, no seams.
    for (let r = 0; r < n; r++) {
      let c = 0
      while (c < n) {
        if (!on(r, c)) {
          c++
          continue
        }
        const start = c
        while (c < n && on(r, c)) c++
        parts.push(rectPath(start + m, r + m, c - start, 1))
      }
    }
  } else {
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!on(r, c)) continue
        const x = c + m
        const y = r + m
        if (opts.moduleStyle === 'dots') {
          parts.push(circlePath(x + 0.5, y + 0.5, 0.46))
        } else if (opts.moduleStyle === 'soft') {
          parts.push(roundedRectPath(x + 0.06, y + 0.06, 0.88, 0.88, 0.3))
        } else {
          const t = on(r - 1, c)
          const b = on(r + 1, c)
          const l = on(r, c - 1)
          const rt = on(r, c + 1)
          const R = 0.5
          parts.push(fluidModulePath(x, y, !t && !l ? R : 0, !t && !rt ? R : 0, !b && !rt ? R : 0, !b && !l ? R : 0))
        }
      }
    }
  }

  const ring: string[] = []
  const center: string[] = []
  const origins = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ]
  for (const [c0, r0] of origins) {
    const x = c0 + m
    const y = r0 + m
    if (opts.eyeStyle === 'circle') {
      ring.push(circlePath(x + 3.5, y + 3.5, 3.5), circlePath(x + 3.5, y + 3.5, 2.5))
      center.push(circlePath(x + 3.5, y + 3.5, 1.5))
    } else if (opts.eyeStyle === 'rounded') {
      ring.push(roundedRectPath(x, y, 7, 7, 2), roundedRectPath(x + 1, y + 1, 5, 5, 1.1))
      center.push(roundedRectPath(x + 2, y + 2, 3, 3, 0.8))
    } else {
      ring.push(rectPath(x, y, 7, 7), rectPath(x + 1, y + 1, 5, 5))
      center.push(rectPath(x + 2, y + 2, 3, 3))
    }
  }
  // Rounded alignment patterns measurably hurt ZXing's detector (see the
  // multi-size sweep in tests/unit/decode.test.ts), so the "rounded" eye style
  // keeps them square — at 5×5 modules the difference is barely visible.
  for (const [r, c] of alignments) {
    const x = c - 2 + m
    const y = r - 2 + m
    if (opts.eyeStyle === 'circle') {
      ring.push(circlePath(x + 2.5, y + 2.5, 2.5), circlePath(x + 2.5, y + 2.5, 1.5))
      center.push(circlePath(x + 2.5, y + 2.5, 0.5))
    } else {
      ring.push(rectPath(x, y, 5, 5), rectPath(x + 1, y + 1, 3, 3))
      center.push(rectPath(x + 2, y + 2, 1, 1))
    }
  }

  return {
    total,
    bgRadius: opts.transparent ? 0 : Math.max(0, Math.min(1, opts.corner)) * m * 1.5,
    modulesPath: parts.join(''),
    eyeRingPath: ring.join(''),
    eyeCenterPath: center.join(''),
    plate: opts.transparent ? null : plate,
    logo,
  }
}

const escapeAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Accepts only plain hex colours so nothing unexpected reaches the SVG. */
export function safeColor(value: string, fallback: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value.toLowerCase() : fallback
}

/** A real, scalable SVG document. Modules are vector paths, never a bitmap. */
export function renderSvg(geo: QrGeometry, opts: RenderOptions, pixelSize?: number): string {
  const fg = safeColor(opts.fg, '#000000')
  const bg = safeColor(opts.bg, '#ffffff')
  const t = f(geo.total)
  const sizeAttrs = pixelSize ? ` width="${pixelSize}" height="${pixelSize}"` : ''
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${t} ${t}"${sizeAttrs}>`,
  ]
  if (!opts.transparent) {
    out.push(`<rect width="${t}" height="${t}"${geo.bgRadius ? ` rx="${f(geo.bgRadius)}"` : ''} fill="${bg}"/>`)
  }
  if (geo.modulesPath) out.push(`<path d="${geo.modulesPath}" fill="${fg}"/>`)
  out.push(`<path d="${geo.eyeRingPath}" fill="${fg}" fill-rule="evenodd"/>`)
  out.push(`<path d="${geo.eyeCenterPath}" fill="${fg}"/>`)
  if (geo.plate) {
    const p = geo.plate
    out.push(`<rect x="${f(p.x)}" y="${f(p.y)}" width="${f(p.w)}" height="${f(p.h)}" rx="${f(p.r)}" fill="${bg}"/>`)
  }
  if (geo.logo && opts.logo) {
    const l = geo.logo
    out.push(
      `<image x="${f(l.x)}" y="${f(l.y)}" width="${f(l.w)}" height="${f(l.h)}" preserveAspectRatio="xMidYMid meet" xlink:href="${escapeAttr(opts.logo.src)}"/>`,
    )
  }
  out.push('</svg>')
  return out.join('')
}
