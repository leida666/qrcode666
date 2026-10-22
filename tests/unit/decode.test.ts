/**
 * End-to-end correctness of the QR engine: every case is rendered to a real
 * SVG document, rasterised, then decoded with two independent decoders
 * (jsQR and ZXing). The decoded text must equal the exact payload.
 */
import { describe, expect, it } from 'vitest'
import {
  buildPayload,
  DEFAULT_STYLE,
  EMPTY_DATA,
  EYE_STYLES,
  generateQr,
  LOGO_MAX,
  MODULE_STYLES,
  PRESETS,
  toSvg,
  type ECLevel,
  type LogoInput,
  type QrStyle,
} from '../../src/lib/qr'
import { decodeBoth, rasterizeSvg } from './decode-helper'

function roundTrip(payload: string, style: QrStyle = DEFAULT_STYLE, logo: LogoInput | null = null, width?: number) {
  const out = generateQr(payload, style, logo)
  if (!out.ok) throw new Error('capacity')
  const svg = toSvg(out.result, 1024)
  // ~8 px per module, like a phone camera filling the frame with the code.
  const decoded = decodeBoth(rasterizeSvg(svg, width ?? Math.max(480, out.result.geometry.total * 8)))
  return { ...decoded, result: out.result, svg }
}

function expectDecodes(payload: string, style?: QrStyle, logo?: LogoInput | null, width?: number) {
  const { jsqr, zxing } = roundTrip(payload, style, logo ?? null, width)
  expect(jsqr, 'jsQR').toBe(payload)
  expect(zxing, 'ZXing').toBe(payload)
}

// A deliberately hostile logo: dark, high-contrast, fills its whole box.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="18" fill="#111"/><circle cx="50" cy="50" r="30" fill="#ff3b30"/><rect x="20" y="44" width="60" height="12" fill="#fff"/></svg>`
const LOGO_SRC = `data:image/svg+xml;base64,${Buffer.from(LOGO_SVG).toString('base64')}`
const logo = (size: number, plate = true): LogoInput => ({ src: LOGO_SRC, aspect: 1, size, plate })

describe('content round-trips', () => {
  const cases: Record<string, string> = {
    'plain URL': 'https://virony.ng',
    'URL with query + fragment': 'https://example.com/path/to/page?utm_source=x&q=hello%20world#section-2',
    'long URL': `https://example.com/${'very-long-path-segment/'.repeat(30)}?token=${'a1b2c3d4'.repeat(20)}`,
    'Chinese text': '你好，世界！这是一个永久有效的二维码。',
    'mixed CJK + latin + numbers': 'QRCode666 免费二维码生成器 2026 年 10 月 22 日',
    emoji: 'Free forever 🎉🔥 No subscriptions 🙅‍♂️ 👨‍👩‍👧‍👦',
    'special characters': `Special: !@#$%^&*()_+-={}[]|\\:";'<>?,./~\` ©®™ € £ ¥ — “quotes” ‘single’ …`,
    'multi-line text': 'Line one\nLine two\r\nLine three\ttabbed',
    'numeric only': '12345678901234567890',
    'uppercase alphanumeric': 'HTTPS://EXAMPLE.COM/ABC-123',
    'Japanese + Korean': 'こんにちは世界 안녕하세요',
  }
  for (const [name, payload] of Object.entries(cases)) {
    it(name, () => expectDecodes(payload))
  }

  it('Wi-Fi with special characters in SSID and password', () => {
    const { payload } = buildPayload('wifi', {
      ssid: 'Café;Guest,"5G"',
      password: 'p@ss:w0rd;with\\slash,"quote"',
      security: 'WPA',
      hidden: true,
    })
    expect(payload).toBe('WIFI:T:WPA;S:Café\\;Guest\\,\\"5G\\";P:p@ss\\:w0rd\\;with\\\\slash\\,\\"quote\\";H:true;;')
    expectDecodes(payload)
  })

  it('vCard with unicode and escaped fields', () => {
    const { payload } = buildPayload('vcard', {
      ...EMPTY_DATA.vcard,
      firstName: '小明',
      lastName: '王',
      organization: 'Acme, Inc.',
      title: 'Founder; CEO',
      mobile: '+86 138 0013 8000',
      email: 'xiaoming@example.com',
      website: 'example.com',
      street: '1 Main St',
      city: '上海',
      country: 'China',
      note: 'Line 1\nLine 2',
    })
    expect(payload).toContain('N:王;小明;;;')
    expect(payload).toContain('ORG:Acme\\, Inc.')
    expect(payload).toContain('TITLE:Founder\\; CEO')
    expect(payload).toContain('TEL;TYPE=CELL:+8613800138000')
    expect(payload).toContain('URL:https://example.com')
    expect(payload).toContain('NOTE:Line 1\\nLine 2')
    expectDecodes(payload)
  })

  it('email, phone, SMS, location and calendar event', () => {
    const payloads = [
      buildPayload('email', { to: 'hello@example.com', subject: 'Hi there & welcome', body: 'Line 1\nLine 2' }).payload,
      buildPayload('phone', { phone: '+1 (555) 010-9999' }).payload,
      buildPayload('sms', { phone: '+44 7700 900123', message: 'Hello: see you at 5' }).payload,
      buildPayload('location', { latitude: '51.5007', longitude: '-0.1246', label: 'Big Ben', format: 'geo' }).payload,
      buildPayload('event', {
        title: 'Launch, party; v1',
        location: 'Shanghai',
        description: 'Bring friends',
        allDay: false,
        start: '2026-11-01T18:30',
        end: '2026-11-01T21:00',
      }).payload,
    ]
    for (const p of payloads) {
      expect(p).not.toBe('')
      expectDecodes(p)
    }
  })
})

describe('capacity', () => {
  const maxBytes: Record<ECLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 }
  for (const level of ['L', 'M', 'Q', 'H'] as ECLevel[]) {
    it(`fits exactly ${maxBytes[level]} bytes at ${level} and rejects one more`, () => {
      const style = { ...DEFAULT_STYLE, ecLevel: level }
      const fits = 'a'.repeat(maxBytes[level])
      const out = generateQr(fits, style, null)
      expect(out.ok).toBe(true)
      if (out.ok) expect(out.result.matrix.version).toBe(40)
      const tooBig = generateQr(fits + 'a', style, null)
      expect(tooBig.ok).toBe(false)
      if (!tooBig.ok) expect(tooBig.capacity.bytes).toBe(maxBytes[level] + 1)
    })
  }

  it('version 40 at the limit still decodes', () => {
    // A near-limit payload with multibyte characters (3 bytes each).
    const text = '码'.repeat(Math.floor(2331 / 3))
    expectDecodes(text, { ...DEFAULT_STYLE, ecLevel: 'M' })
  })
})

describe('every style combination scans', () => {
  const payload = 'https://qrcode666.app/?ref=style-test&lang=en'
  for (const moduleStyle of MODULE_STYLES) {
    for (const eyeStyle of EYE_STYLES) {
      for (const ecLevel of ['L', 'H'] as ECLevel[]) {
        it(`${moduleStyle} modules / ${eyeStyle} eyes / EC ${ecLevel}`, () => {
          expectDecodes(payload, { ...DEFAULT_STYLE, moduleStyle, eyeStyle, ecLevel })
        })
      }
    }
  }

  // The same symbol must scan at many pixel sizes — like a phone at different
  // distances. This sweep is what caught rounded alignment patterns.
  for (const eyeStyle of EYE_STYLES) {
    it(`${eyeStyle} eyes across EC levels, module styles and sizes`, () => {
      const failures: string[] = []
      for (const moduleStyle of MODULE_STYLES) {
        for (const ecLevel of ['L', 'M', 'Q', 'H'] as ECLevel[]) {
          for (const p of ['https://example.com/presets', 'https://virony.ng']) {
            const out = generateQr(p, { ...DEFAULT_STYLE, moduleStyle, eyeStyle, ecLevel }, null)
            if (!out.ok) throw new Error('capacity')
            const svg = toSvg(out.result)
            for (const w of [420, 600, 700, 1024]) {
              const r = decodeBoth(rasterizeSvg(svg, w))
              if (r.jsqr !== p || r.zxing !== p) failures.push(`${moduleStyle}/${ecLevel}/${w}px`)
            }
          }
        }
      }
      expect(failures).toEqual([])
    })
  }

  for (const [id, preset] of Object.entries(PRESETS)) {
    it(`preset ${id}`, () => {
      for (const w of [512, 700, 1024, 1500]) expectDecodes(payload, { ...DEFAULT_STYLE, ...preset }, null, w)
    })
  }

  it('transparent background (printed on white)', () => {
    expectDecodes(payload, { ...DEFAULT_STYLE, transparent: true })
  })

  it('quiet zone of 1 module with rounded background corners', () => {
    expectDecodes(payload, { ...DEFAULT_STYLE, margin: 1, corner: 1 })
  })
})

describe('logos at the maximum allowed size', () => {
  const payloads = [
    'https://virony.ng',
    'https://example.com/a/fairly/long/path?with=query&and=more-parameters-here',
    'WIFI:T:WPA;S:HomeNetwork;P:correct horse battery staple;;',
    '这是一个带有标志的中文二维码测试内容，长度适中。',
    'x'.repeat(400),
  ]
  for (const ecLevel of ['Q', 'H'] as ECLevel[]) {
    for (const moduleStyle of MODULE_STYLES) {
      for (const eyeStyle of EYE_STYLES) {
        it(`EC ${ecLevel} / ${moduleStyle} / ${eyeStyle}`, () => {
          for (const p of payloads) {
            expectDecodes(p, { ...DEFAULT_STYLE, ecLevel, moduleStyle, eyeStyle }, logo(LOGO_MAX[ecLevel]))
          }
        })
      }
    }
  }

  it('raises error correction to H when a logo is added at L/M', () => {
    const out = generateQr('https://virony.ng', { ...DEFAULT_STYLE, ecLevel: 'L' }, logo(0.2))
    expect(out.ok && out.result.ecLevel).toBe('H')
  })

  it('clamps an oversized logo to the safe maximum', () => {
    const out = generateQr('https://virony.ng', { ...DEFAULT_STYLE, ecLevel: 'H' }, logo(0.9))
    expect(out.ok && out.result.options.logo?.size).toBe(LOGO_MAX.H)
  })
})
