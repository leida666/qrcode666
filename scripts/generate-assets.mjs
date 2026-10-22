// Generates favicons, app icons and the social preview image from the brand
// mark. Run with `npm run assets`; outputs are committed to public/.
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { markSvg, MARK_PATH, MARK_ACCENT, MARK_SIZE } from '../src/brand/mark.ts'

const out = new URL('../public/', import.meta.url)
mkdirSync(out, { recursive: true })
const write = (name, data) => writeFileSync(new URL(name, out), data)

const png = (svg, size) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: size }, shapeRendering: 2 }).render().asPng()

// Favicon SVG adapts to the browser's light/dark UI.
const a = MARK_ACCENT
const pad = 2
const s = MARK_SIZE + pad * 2
write(
  'favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}">` +
    `<style>.t{fill:#0a0a0a}.m{fill:#fff}@media (prefers-color-scheme:dark){.t{fill:#fff}.m{fill:#0a0a0a}}</style>` +
    `<rect class="t" width="${s}" height="${s}" rx="5"/>` +
    `<g transform="translate(${pad} ${pad})"><path class="m" d="${MARK_PATH}"/>` +
    `<rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="#1d4bff"/></g></svg>\n`,
)

// Square app icons: white mark on near-black tile.
const tile = (padding, radius) => markSvg({ fg: '#ffffff', bg: '#0a0a0a', accent: '#4d73ff', padding, radius })
write('apple-touch-icon.png', png(tile(4, 0), 180)) // iOS applies its own mask
write('icon-192.png', png(tile(3, 5), 192))
write('icon-512.png', png(tile(3, 5), 512))
write('icon-maskable-512.png', png(tile(8, 0), 512)) // generous safe zone
write('logo.svg', markSvg({ fg: '#0a0a0a', accent: '#1d4bff' }) + '\n')
write('avatar.png', png(tile(5, 0), 1024)) // GitHub / social avatar

// favicon.ico with embedded PNGs (supported by every current browser).
const sizes = [16, 32, 48]
const images = sizes.map((size) => png(tile(2, 4), size))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(sizes.length, 4)
let offset = 6 + 16 * sizes.length
const entries = sizes.map((size, i) => {
  const e = Buffer.alloc(16)
  e.writeUInt8(size, 0)
  e.writeUInt8(size, 1)
  e.writeUInt16LE(1, 4)
  e.writeUInt16LE(32, 6)
  e.writeUInt32LE(images[i].length, 8)
  e.writeUInt32LE(offset, 12)
  offset += images[i].length
  return e
})
write('favicon.ico', Buffer.concat([header, ...entries, ...images]))

// Open Graph / Twitter card, 1200 × 630.
const markScale = 7
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="78%" cy="40%" r="60%">
      <stop offset="0" stop-color="#1d4bff" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#1d4bff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070707"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(80 84) scale(2.4)">
    <path d="${MARK_PATH}" fill="#fff"/><rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="#4d73ff"/>
  </g>
  <text x="152" y="122" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-weight="600" font-size="34" fill="#fff" letter-spacing="-0.5">QRCode<tspan fill="#6d8bff">666</tspan></text>
  <text x="80" y="300" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="104" fill="#fff" letter-spacing="-4">QR Codes. Free.</text>
  <text x="80" y="408" font-family="Georgia, Times New Roman, serif" font-style="italic" font-size="112" fill="#6d8bff" letter-spacing="-2">Forever.</text>
  <text x="80" y="510" font-family="Segoe UI, Inter, Helvetica, Arial, sans-serif" font-size="30" fill="#a3a3a0">No account. No subscription. No expiration.</text>
  <text x="80" y="556" font-family="Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif" font-size="26" fill="#74746f">免费二维码生成器 · 永久有效 · 无需订阅</text>
  <g transform="translate(860 150) scale(${markScale * 2})" opacity="0.9">
    <rect x="-1.5" y="-1.5" width="${MARK_SIZE + 3}" height="${MARK_SIZE + 3}" rx="2" fill="#fff"/>
    <path d="${MARK_PATH}" fill="#0a0a0a"/><rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="#1d4bff"/>
  </g>
</svg>`
write('og-image.png', new Resvg(og, { font: { loadSystemFonts: true } }).render().asPng())

console.log('assets written to public/')
