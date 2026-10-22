import { describe, expect, it } from 'vitest'
import {
  buildEmail,
  buildEvent,
  buildLocation,
  buildPayload,
  buildPhone,
  buildSms,
  buildText,
  buildUrl,
  buildVCard,
  buildWifi,
  contrastRatio,
  DEFAULT_STYLE,
  EMPTY_DATA,
  escapeWifi,
  generateQr,
  normalizeUrl,
  toSvg,
  assessQuality,
  type RenderOptions,
} from '../../src/lib/qr'

describe('URL', () => {
  it('keeps the URL exactly as typed — no redirect, no trailing slash', () => {
    expect(buildUrl({ url: 'https://virony.ng' }).payload).toBe('https://virony.ng')
    expect(buildUrl({ url: '  https://virony.ng  ' }).payload).toBe('https://virony.ng')
  })
  it('adds https:// only when no scheme is present', () => {
    expect(normalizeUrl('virony.ng')).toBe('https://virony.ng')
    expect(normalizeUrl('example.com:8080/x')).toBe('https://example.com:8080/x')
    expect(normalizeUrl('localhost:3000')).toBe('https://localhost:3000')
    expect(normalizeUrl('http://example.com')).toBe('http://example.com')
    expect(normalizeUrl('ftp://files.example.com')).toBe('ftp://files.example.com')
  })
  it('never points at qrcode666.app', () => {
    for (const url of ['virony.ng', 'https://a.b/c?d=e', 'example.org/页面']) {
      expect(buildUrl({ url }).payload).not.toContain('qrcode666')
    }
  })
  it('flags empty input as an error and odd URLs as hints', () => {
    expect(buildUrl({ url: '   ' }).errors).toEqual(['empty'])
    expect(buildUrl({ url: 'not a url' }).hints).toContain('urlSpaces')
    expect(buildUrl({ url: 'nodot' }).hints).toContain('urlInvalid')
  })
})

describe('text', () => {
  it('passes text through untouched (including whitespace and newlines)', () => {
    expect(buildText({ text: '  hi\nthere  ' }).payload).toBe('  hi\nthere  ')
    expect(buildText({ text: '   ' }).errors).toEqual(['empty'])
  })
})

describe('Wi-Fi', () => {
  it('escapes reserved characters', () => {
    expect(escapeWifi('a;b,c:d"e\\f')).toBe('a\\;b\\,c\\:d\\"e\\\\f')
  })
  it('builds WPA, WEP and open networks', () => {
    expect(buildWifi({ ssid: 'Home', password: 'secret', security: 'WPA', hidden: false }).payload).toBe(
      'WIFI:T:WPA;S:Home;P:secret;;',
    )
    expect(buildWifi({ ssid: 'Old', password: 'abc', security: 'WEP', hidden: true }).payload).toBe(
      'WIFI:T:WEP;S:Old;P:abc;H:true;;',
    )
    expect(buildWifi({ ssid: 'Cafe', password: 'ignored', security: 'nopass', hidden: false }).payload).toBe(
      'WIFI:T:nopass;S:Cafe;;',
    )
  })
  it('treats an untouched form as empty', () => {
    expect(buildWifi({ ssid: '', password: '', security: 'WPA', hidden: false }).errors).toEqual(['empty'])
  })
  it('requires an SSID and (for secured networks) a password', () => {
    expect(buildWifi({ ssid: '', password: 'x', security: 'WPA', hidden: false }).errors).toEqual(['wifiSsidRequired'])
    expect(buildWifi({ ssid: 'x', password: '', security: 'WPA', hidden: false }).errors).toEqual([
      'wifiPasswordRequired',
    ])
  })
})

describe('email / phone / sms', () => {
  it('builds mailto with encoded subject and body', () => {
    expect(buildEmail({ to: 'a@b.co', subject: 'Hi & bye', body: '' }).payload).toBe('mailto:a@b.co?subject=Hi%20%26%20bye')
    expect(buildEmail({ to: 'a@b.co', subject: '', body: 'x\ny' }).payload).toBe('mailto:a@b.co?body=x%0D%0Ay')
    expect(buildEmail({ to: 'nope', subject: '', body: '' }).hints).toContain('emailInvalid')
  })
  it('cleans phone numbers but keeps a leading +', () => {
    expect(buildPhone({ phone: '+1 (555) 010-9999' }).payload).toBe('tel:+15550109999')
    expect(buildPhone({ phone: '12' }).errors).toEqual(['phoneInvalid'])
  })
  it('uses the SMSTO format', () => {
    expect(buildSms({ phone: '+44 7700 900123', message: 'Hi: there' }).payload).toBe('SMSTO:+447700900123:Hi: there')
  })
})

describe('vCard', () => {
  it('treats an untouched form as empty, then requires a name or organisation', () => {
    expect(buildVCard(EMPTY_DATA.vcard).errors).toEqual(['empty'])
    expect(buildVCard({ ...EMPTY_DATA.vcard, email: 'a@b.co' }).errors).toEqual(['vcardNameRequired'])
  })
  it('produces a CRLF-separated vCard 3.0', () => {
    const { payload } = buildVCard({ ...EMPTY_DATA.vcard, firstName: 'Ada', lastName: 'Lovelace' })
    expect(payload).toBe('BEGIN:VCARD\r\nVERSION:3.0\r\nN:Lovelace;Ada;;;\r\nFN:Ada Lovelace\r\nEND:VCARD')
  })
  it('uses the organisation as the display name when there is no person', () => {
    const { payload } = buildVCard({ ...EMPTY_DATA.vcard, organization: 'Acme' })
    expect(payload).toContain('FN:Acme')
  })
})

describe('location', () => {
  it('validates coordinate ranges', () => {
    expect(buildLocation({ latitude: '91', longitude: '0', label: '', format: 'geo' }).errors).toEqual(['latInvalid'])
    expect(buildLocation({ latitude: '0', longitude: '-181', label: '', format: 'geo' }).errors).toEqual(['lngInvalid'])
    expect(buildLocation({ latitude: 'abc', longitude: '1', label: '', format: 'geo' }).errors).toEqual(['latInvalid'])
  })
  it('builds geo: URIs and map links', () => {
    expect(buildLocation({ latitude: '31.2304', longitude: '121.4737', label: '', format: 'geo' }).payload).toBe(
      'geo:31.2304,121.4737',
    )
    expect(buildLocation({ latitude: '31.2304', longitude: '121.4737', label: 'The Bund', format: 'geo' }).payload).toBe(
      'geo:31.2304,121.4737?q=31.2304,121.4737(The%20Bund)',
    )
    expect(buildLocation({ latitude: '+1.5', longitude: '-2', label: '', format: 'maps' }).payload).toBe(
      'https://maps.google.com/?q=1.5,-2',
    )
  })
})

describe('calendar event', () => {
  it('converts local times to UTC and escapes text', () => {
    const { payload } = buildEvent({
      title: 'Launch, v1; go',
      location: '',
      description: 'a\nb',
      allDay: false,
      start: '2026-11-01T18:30',
      end: '2026-11-01T20:00',
    })
    const start = new Date(2026, 10, 1, 18, 30)
    const expected = `${start.toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`
    expect(payload).toContain(`DTSTART:${expected.slice(0, 13)}00Z`)
    expect(payload).toContain('SUMMARY:Launch\\, v1\\; go')
    expect(payload).toContain('DESCRIPTION:a\\nb')
    expect(payload.startsWith('BEGIN:VEVENT\r\n')).toBe(true)
    expect(payload.endsWith('\r\nEND:VEVENT')).toBe(true)
  })
  it('uses exclusive DTEND for all-day events', () => {
    const { payload } = buildEvent({
      title: 'Holiday',
      location: '',
      description: '',
      allDay: true,
      start: '2026-12-31',
      end: '2026-12-31',
    })
    expect(payload).toContain('DTSTART;VALUE=DATE:20261231')
    expect(payload).toContain('DTEND;VALUE=DATE:20270101')
  })
  it('rejects an end before the start', () => {
    const r = buildEvent({ title: 'x', location: '', description: '', allDay: false, start: '2026-11-02T10:00', end: '2026-11-01T10:00' })
    expect(r.errors).toEqual(['eventEndBeforeStart'])
  })
})

describe('dispatch + empty input', () => {
  it('returns "empty" for every blank form instead of a QR code', () => {
    for (const type of ['url', 'text', 'email', 'phone', 'sms', 'location', 'event'] as const) {
      const r = buildPayload(type, EMPTY_DATA[type])
      expect(r.payload).toBe('')
      expect(r.errors.length).toBeGreaterThan(0)
    }
  })
})

describe('quality checks', () => {
  const base: RenderOptions = { ...DEFAULT_STYLE, logo: null }
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#fff', '#fff')).toBeCloseTo(1, 5)
  })
  it('blocks nearly invisible colour combinations', () => {
    const issues = assessQuality(null, { ...base, fg: '#dddddd', bg: '#ffffff' }, false)
    expect(issues.find((i) => i.code === 'contrastTooLow')?.severity).toBe('error')
  })
  it('warns about inverted, transparent and tight quiet zones', () => {
    expect(assessQuality(null, { ...base, fg: '#ffffff', bg: '#000000' }, false).map((i) => i.code)).toContain('inverted')
    expect(assessQuality(null, { ...base, transparent: true }, false).map((i) => i.code)).toContain('transparent')
    expect(assessQuality(null, { ...base, margin: 1 }, false).map((i) => i.code)).toContain('marginTiny')
  })
  it('does not warn about the default style', () => {
    expect(assessQuality(null, base, false)).toEqual([])
  })
  it('emits a real vector SVG with no embedded bitmap', () => {
    const out = generateQr('https://virony.ng', DEFAULT_STYLE, null)
    if (!out.ok) throw new Error()
    const svg = toSvg(out.result, 1024)
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 33 33" width="1024" height="1024">/)
    expect(svg).toContain('<path d="M')
    expect(svg).not.toContain('<image')
    expect(svg).not.toContain('base64')
  })
})
