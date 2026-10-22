/**
 * The QRCode666 mark: three QR finder patterns, each extended into a "6"
 * (a top bar and left stem over a 7×7 finder ring), placed where a QR code's
 * three finders sit. One accent module marks the data corner.
 *
 * Kept dependency-free so the asset build script can import it directly.
 */

// 7 × 10 glyph: a finder pattern with a stem — a geometric "6".
const SIX = [
  '#######',
  '#......',
  '#......',
  '#######',
  '#.....#',
  '#.###.#',
  '#.###.#',
  '#.###.#',
  '#.....#',
  '#######',
]

export const MARK_SIZE = 21

function glyphPath(ox: number, oy: number): string {
  let d = ''
  SIX.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (row[x] !== '#') {
        x++
        continue
      }
      const start = x
      while (x < row.length && row[x] === '#') x++
      d += `M${ox + start} ${oy + y}h${x - start}v1h${start - x}z`
    }
  })
  return d
}

/** Path for the three "6" finders, in a 21 × 21 module grid. */
export const MARK_PATH = glyphPath(0, 0) + glyphPath(14, 0) + glyphPath(0, 11)

/** The accent "data" module block. */
export const MARK_ACCENT = { x: 15, y: 15, w: 4, h: 4 }

export const ACCENT = '#1d4bff'

/** Standalone SVG of the mark, e.g. for favicons and social avatars. */
export function markSvg({
  fg = '#0a0a0a',
  bg = null as string | null,
  accent = ACCENT,
  padding = 0,
  radius = 0,
} = {}): string {
  const s = MARK_SIZE + padding * 2
  const a = MARK_ACCENT
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">` +
    (bg ? `<rect width="${s}" height="${s}" rx="${radius}" fill="${bg}"/>` : '') +
    `<g transform="translate(${padding} ${padding})">` +
    `<path d="${MARK_PATH}" fill="${fg}"/>` +
    `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="${accent}"/>` +
    `</g></svg>`
  )
}
