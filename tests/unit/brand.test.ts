/**
 * The brand mark is a real QR code for the site. It must decode to the site
 * URL with both decoders at every size in a fine sweep — the finder-centre
 * colour was chosen with exactly this test.
 */
import { describe, expect, it } from 'vitest'
import { MARK_URL, markSvg } from '../../src/brand/mark'
import { decodeBoth, rasterizeSvg } from './decode-helper'

describe('brand mark', () => {
  it('encodes the site URL', () => {
    expect(MARK_URL).toBe('https://qrcode666.app')
  })

  it('scans with jsQR and ZXing from 140px to 1200px', () => {
    const svg = markSvg({ padding: 3 })
    const failures: string[] = []
    for (let w = 140; w <= 1200; w += 23) {
      const { jsqr, zxing } = decodeBoth(rasterizeSvg(svg, w))
      if (jsqr !== MARK_URL) failures.push(`jsQR@${w}`)
      if (zxing !== MARK_URL) failures.push(`ZXing@${w}`)
    }
    expect(failures).toEqual([])
  })
})

describe('published brand assets', () => {
  it('the avatar PNG scans to the site', async () => {
    const { readFileSync } = await import('node:fs')
    const { PNG } = await import('pngjs')
    const png = PNG.sync.read(readFileSync('public/avatar.png'))
    const r = decodeBoth({ data: new Uint8ClampedArray(png.data), width: png.width, height: png.height })
    expect(r.jsqr).toBe(MARK_URL)
    expect(r.zxing).toBe(MARK_URL)
  })
})

describe('donation fallback redirect', () => {
  it('index.html boot script uses the same URLs as src/lib/donate.ts', async () => {
    const { readFileSync } = await import('node:fs')
    const { CHARITIES } = await import('../../src/lib/donate')
    const html = readFileSync('index.html', 'utf8')
    for (const c of CHARITIES) expect(html).toContain(`${c.id}: '${c.url}'`)
  })
})
