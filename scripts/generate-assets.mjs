// Generates favicons, app icons, the avatar and the social preview image from
// the brand mark (a real QR code for https://qrcode666.app). Run with
// `npm run assets`; outputs are committed to public/.
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { markBody, markSvg, MARK_SIZE, BRAND_BLUE } from '../src/brand/mark.ts'

const out = new URL('../public/', import.meta.url)
mkdirSync(out, { recursive: true })
const write = (name, data) => writeFileSync(new URL(name, out), data)
const png = (svg, size) => new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng()

// Browser tab icon and the plain logo.
write('favicon.svg', markSvg({ padding: 1.5, radius: 3 }) + '\n')
write('logo.svg', markSvg({ padding: 2, radius: 3 }) + '\n')

// App icons. iOS applies its own mask; maskable icons need a wide safe zone.
write('apple-touch-icon.png', png(markSvg({ padding: 3 }), 180))
write('icon-192.png', png(markSvg({ padding: 2.5, radius: 4 }), 192))
write('icon-512.png', png(markSvg({ padding: 2.5, radius: 4 }), 512))
write('icon-maskable-512.png', png(markSvg({ padding: 6 }), 512))

// favicon.ico with embedded PNGs (supported by every current browser).
const sizes = [16, 32, 48]
const images = sizes.map((size) => png(markSvg({ padding: 1, radius: 2 }), size))
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

const WORD_FONT = 'Segoe UI, Inter, Helvetica, Arial, sans-serif'

// Square avatar (GitHub, social profiles): mark above the wordmark, as in the
// original artwork.
const A = 1024
const markPx = 760
const unit = markPx / MARK_SIZE
const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="${A}" height="${A}" viewBox="0 0 ${A} ${A}">
  <rect width="${A}" height="${A}" fill="#ffffff"/>
  <g transform="translate(${(A - markPx) / 2} 70) scale(${unit})">${markBody()}</g>
  <text x="${A / 2}" y="${70 + markPx + 120}" text-anchor="middle" font-family="${WORD_FONT}" font-weight="800" font-size="104" letter-spacing="-1" fill="#000">QRCODE<tspan fill="${BRAND_BLUE}">666</tspan></text>
</svg>`
write('avatar.png', new Resvg(avatar, { font: { loadSystemFonts: true } }).render().asPng())

// Open Graph / X card, 1200 × 630.
const tile = (x, y, px, radius) => {
  const pad = 1.5
  const side = MARK_SIZE + pad * 2
  const k = px / side
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect width="${side}" height="${side}" rx="${radius}" fill="#fff"/><g transform="translate(${pad} ${pad})">${markBody()}</g></g>`
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g" cx="78%" cy="45%" r="60%">
      <stop offset="0" stop-color="${BRAND_BLUE}" stop-opacity="0.24"/>
      <stop offset="1" stop-color="${BRAND_BLUE}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#070707"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  ${tile(80, 80, 52, 3)}
  <text x="148" y="117" font-family="${WORD_FONT}" font-weight="800" font-size="32" fill="#fff">QRCODE<tspan fill="#6d8bff">666</tspan></text>
  <text x="80" y="300" font-family="${WORD_FONT}" font-weight="700" font-size="100" fill="#fff" letter-spacing="-4">QR Codes. Free.</text>
  <text x="80" y="408" font-family="Georgia, Times New Roman, serif" font-style="italic" font-size="112" fill="#6d8bff" letter-spacing="-2">Forever.</text>
  <text x="80" y="510" font-family="${WORD_FONT}" font-size="30" fill="#a3a3a0">No account. No subscription. No expiration.</text>
  <text x="80" y="556" font-family="Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif" font-size="26" fill="#74746f">免费二维码生成器 · 永久有效 · 无需订阅</text>
  ${tile(800, 155, 320, 3)}
</svg>`
write('og-image.png', new Resvg(og, { font: { loadSystemFonts: true } }).render().asPng())

console.log('assets written to public/')
