/**
 * Payload builders. Every QR code produced by QRCode666 encodes the final
 * content directly — the text returned here is exactly what ends up inside
 * the symbol. There is no redirect, short link, or tracking parameter.
 */

export type ContentType =
  | 'url'
  | 'text'
  | 'wifi'
  | 'email'
  | 'phone'
  | 'sms'
  | 'vcard'
  | 'location'
  | 'event'

export const CONTENT_TYPES: ContentType[] = [
  'url',
  'text',
  'wifi',
  'email',
  'phone',
  'sms',
  'vcard',
  'location',
  'event',
]

export interface UrlData {
  url: string
}
export interface TextData {
  text: string
}
export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'
export interface WifiData {
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
}
export interface EmailData {
  to: string
  subject: string
  body: string
}
export interface PhoneData {
  phone: string
}
export interface SmsData {
  phone: string
  message: string
}
export interface VCardData {
  firstName: string
  lastName: string
  organization: string
  title: string
  mobile: string
  workPhone: string
  email: string
  website: string
  street: string
  city: string
  region: string
  postcode: string
  country: string
  note: string
}
export type LocationFormat = 'geo' | 'maps'
export interface LocationData {
  latitude: string
  longitude: string
  label: string
  format: LocationFormat
}
export interface EventData {
  title: string
  location: string
  description: string
  allDay: boolean
  /** `YYYY-MM-DDTHH:mm` (datetime-local) or `YYYY-MM-DD` when allDay */
  start: string
  end: string
}

export interface PayloadData {
  url: UrlData
  text: TextData
  wifi: WifiData
  email: EmailData
  phone: PhoneData
  sms: SmsData
  vcard: VCardData
  location: LocationData
  event: EventData
}

export const EMPTY_DATA: PayloadData = {
  url: { url: '' },
  text: { text: '' },
  wifi: { ssid: '', password: '', security: 'WPA', hidden: false },
  email: { to: '', subject: '', body: '' },
  phone: { phone: '' },
  sms: { phone: '', message: '' },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    mobile: '',
    workPhone: '',
    email: '',
    website: '',
    street: '',
    city: '',
    region: '',
    postcode: '',
    country: '',
    note: '',
  },
  location: { latitude: '', longitude: '', label: '', format: 'geo' },
  event: { title: '', location: '', description: '', allDay: false, start: '', end: '' },
}

/** Machine-readable problem codes; the UI maps them to localized messages. */
export type PayloadIssue =
  | 'empty'
  | 'urlInvalid'
  | 'urlSpaces'
  | 'wifiSsidRequired'
  | 'wifiPasswordRequired'
  | 'emailInvalid'
  | 'phoneInvalid'
  | 'vcardNameRequired'
  | 'latInvalid'
  | 'lngInvalid'
  | 'eventTitleRequired'
  | 'eventStartRequired'
  | 'eventEndBeforeStart'

export interface PayloadResult {
  /** The exact string that will be encoded. Empty when nothing to encode. */
  payload: string
  /** Blocking problems — no QR code is generated while any exist. */
  errors: PayloadIssue[]
  /** Non-blocking hints. */
  hints: PayloadIssue[]
}

const ok = (payload: string, hints: PayloadIssue[] = []): PayloadResult => ({
  payload,
  errors: [],
  hints,
})
const fail = (...errors: PayloadIssue[]): PayloadResult => ({ payload: '', errors, hints: [] })

/* ------------------------------------------------------------------ URL */

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

/**
 * Trims whitespace and adds `https://` when no scheme is present. The URL is
 * otherwise kept byte-for-byte as typed — we deliberately do NOT run it
 * through `new URL().href`, which would e.g. append a trailing slash.
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ''
  // `example.com:8080/x` and `localhost:3000` look like a scheme but are host:port.
  const hostPort = /^(([a-z0-9-]+\.)+[a-z0-9-]+|localhost):\d+(\/|\?|#|$)/i.test(trimmed)
  if (SCHEME_RE.test(trimmed) && !hostPort) return trimmed
  return `https://${trimmed}`
}

export function buildUrl({ url }: UrlData): PayloadResult {
  const value = normalizeUrl(url)
  if (!value) return fail('empty')
  if (/\s/.test(value)) return { payload: value, errors: [], hints: ['urlSpaces'] }
  try {
    const parsed = new URL(value)
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && !parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { payload: value, errors: [], hints: ['urlInvalid'] }
    }
  } catch {
    return { payload: value, errors: [], hints: ['urlInvalid'] }
  }
  return ok(value)
}

/* ----------------------------------------------------------------- Text */

export function buildText({ text }: TextData): PayloadResult {
  if (!text.trim()) return fail('empty')
  return ok(text)
}

/* ----------------------------------------------------------------- Wi-Fi */

/** Escapes `\ ; , : "` as required by the de-facto `WIFI:` format (ZXing). */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

export function buildWifi(d: WifiData): PayloadResult {
  if (!d.ssid) return fail('wifiSsidRequired')
  if (d.security !== 'nopass' && !d.password) return fail('wifiPasswordRequired')
  let out = `WIFI:T:${d.security};S:${escapeWifi(d.ssid)};`
  if (d.security !== 'nopass') out += `P:${escapeWifi(d.password)};`
  if (d.hidden) out += 'H:true;'
  out += ';'
  return ok(out)
}

/* ----------------------------------------------------------------- Email */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function buildEmail(d: EmailData): PayloadResult {
  const to = d.to.trim()
  if (!to) return fail('empty')
  const params: string[] = []
  if (d.subject) params.push(`subject=${encodeURIComponent(d.subject)}`)
  if (d.body) params.push(`body=${encodeURIComponent(d.body.replace(/\r?\n/g, '\r\n'))}`)
  const payload = `mailto:${to}${params.length ? `?${params.join('&')}` : ''}`
  return EMAIL_RE.test(to) ? ok(payload) : { payload, errors: [], hints: ['emailInvalid'] }
}

/* ----------------------------------------------------------------- Phone */

/** Keeps a leading `+` and digits plus `*`/`#` (for service codes). */
export function cleanPhone(input: string): string {
  const trimmed = input.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/[^0-9*#]/g, '')
}

export function buildPhone({ phone }: PhoneData): PayloadResult {
  if (!phone.trim()) return fail('empty')
  const cleaned = cleanPhone(phone)
  if (cleaned.replace('+', '').length < 3) return fail('phoneInvalid')
  return ok(`tel:${cleaned}`)
}

export function buildSms(d: SmsData): PayloadResult {
  if (!d.phone.trim()) return fail('empty')
  const cleaned = cleanPhone(d.phone)
  if (cleaned.replace('+', '').length < 3) return fail('phoneInvalid')
  // SMSTO:number:message is the most widely recognised QR SMS format
  // (iOS Camera, Android/ZXing, Google Lens).
  return ok(`SMSTO:${cleaned}:${d.message}`)
}

/* ----------------------------------------------------------------- vCard */

/** RFC 6350 / 2426 text escaping. */
export function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

export function buildVCard(d: VCardData): PayloadResult {
  const first = d.firstName.trim()
  const last = d.lastName.trim()
  const org = d.organization.trim()
  if (!first && !last && !org) return fail('vcardNameRequired')
  const e = escapeVCard
  const fullName = [first, last].filter(Boolean).join(' ') || org
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(last)};${e(first)};;;`, `FN:${e(fullName)}`]
  if (org) lines.push(`ORG:${e(org)}`)
  if (d.title.trim()) lines.push(`TITLE:${e(d.title.trim())}`)
  if (d.mobile.trim()) lines.push(`TEL;TYPE=CELL:${cleanPhone(d.mobile)}`)
  if (d.workPhone.trim()) lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone(d.workPhone)}`)
  if (d.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${d.email.trim()}`)
  if (d.website.trim()) lines.push(`URL:${normalizeUrl(d.website)}`)
  const adr = [d.street, d.city, d.region, d.postcode, d.country].map((s) => s.trim())
  if (adr.some(Boolean)) lines.push(`ADR;TYPE=WORK:;;${adr.map(e).join(';')}`)
  if (d.note.trim()) lines.push(`NOTE:${e(d.note.trim())}`)
  lines.push('END:VCARD')
  const hints: PayloadIssue[] = []
  if (d.email.trim() && !EMAIL_RE.test(d.email.trim())) hints.push('emailInvalid')
  return ok(lines.join('\r\n'), hints)
}

/* -------------------------------------------------------------- Location */

function parseCoord(value: string, limit: number): number | null {
  const trimmed = value.trim()
  if (!/^[-+]?\d{1,3}(\.\d+)?$/.test(trimmed)) return null
  const n = Number(trimmed)
  return Math.abs(n) <= limit ? n : null
}

export function buildLocation(d: LocationData): PayloadResult {
  if (!d.latitude.trim() && !d.longitude.trim()) return fail('empty')
  const lat = parseCoord(d.latitude, 90)
  const lng = parseCoord(d.longitude, 180)
  const errors: PayloadIssue[] = []
  if (lat === null) errors.push('latInvalid')
  if (lng === null) errors.push('lngInvalid')
  if (errors.length) return fail(...errors)
  const latS = d.latitude.trim().replace(/^\+/, '')
  const lngS = d.longitude.trim().replace(/^\+/, '')
  if (d.format === 'maps') {
    return ok(`https://maps.google.com/?q=${latS},${lngS}`)
  }
  const label = d.label.trim()
  return ok(label ? `geo:${latS},${lngS}?q=${latS},${lngS}(${encodeURIComponent(label)})` : `geo:${latS},${lngS}`)
}

/* ----------------------------------------------------------------- Event */

/** RFC 5545 TEXT escaping. */
export function escapeICal(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Converts a local `YYYY-MM-DDTHH:mm` into an unambiguous UTC iCal timestamp. */
export function toICalUtc(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local)
  if (!m) return null
  const date = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  if (Number.isNaN(date.getTime())) return null
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  )
}

export function toICalDate(value: string, addDays = 0): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!m) return null
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + addDays))
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

export function buildEvent(d: EventData): PayloadResult {
  const title = d.title.trim()
  if (!title && !d.start) return fail('empty')
  if (!title) return fail('eventTitleRequired')
  if (!d.start) return fail('eventStartRequired')
  const lines = ['BEGIN:VEVENT', `SUMMARY:${escapeICal(title)}`]
  if (d.allDay) {
    const start = toICalDate(d.start)
    if (!start) return fail('eventStartRequired')
    const endBase = d.end || d.start
    if (endBase < d.start.slice(0, 10)) return fail('eventEndBeforeStart')
    // DTEND is exclusive for all-day events: the day after the last day.
    const end = toICalDate(endBase, 1)!
    lines.push(`DTSTART;VALUE=DATE:${start}`, `DTEND;VALUE=DATE:${end}`)
  } else {
    const start = toICalUtc(d.start)
    if (!start) return fail('eventStartRequired')
    lines.push(`DTSTART:${start}`)
    if (d.end) {
      const end = toICalUtc(d.end)
      if (!end || end < start) return fail('eventEndBeforeStart')
      lines.push(`DTEND:${end}`)
    }
  }
  if (d.location.trim()) lines.push(`LOCATION:${escapeICal(d.location.trim())}`)
  if (d.description.trim()) lines.push(`DESCRIPTION:${escapeICal(d.description.trim())}`)
  lines.push('END:VEVENT')
  return ok(lines.join('\r\n'))
}

/* -------------------------------------------------------------- Dispatch */

export function buildPayload<T extends ContentType>(type: T, data: PayloadData[T]): PayloadResult {
  switch (type) {
    case 'url':
      return buildUrl(data as UrlData)
    case 'text':
      return buildText(data as TextData)
    case 'wifi':
      return buildWifi(data as WifiData)
    case 'email':
      return buildEmail(data as EmailData)
    case 'phone':
      return buildPhone(data as PhoneData)
    case 'sms':
      return buildSms(data as SmsData)
    case 'vcard':
      return buildVCard(data as VCardData)
    case 'location':
      return buildLocation(data as LocationData)
    case 'event':
      return buildEvent(data as EventData)
    default:
      return fail('empty')
  }
}

/** UTF-8 byte length — what actually counts against QR capacity. */
export function utf8Length(value: string): number {
  return new TextEncoder().encode(value).length
}
