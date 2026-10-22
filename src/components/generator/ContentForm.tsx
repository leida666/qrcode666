import { useId, useState } from 'react'
import {
  CalendarDays,
  Contact,
  Eye,
  EyeOff,
  Link,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Type,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '../../i18n'
import { CONTENT_TYPES, type ContentType, type PayloadData } from '../../lib/qr/payload'
import { Field, Segmented, TextArea, TextInput, Toggle, cx } from '../ui'

export const TYPE_ICONS: Record<ContentType, LucideIcon> = {
  url: Link,
  text: Type,
  wifi: Wifi,
  email: Mail,
  phone: Phone,
  sms: MessageSquare,
  vcard: Contact,
  location: MapPin,
  event: CalendarDays,
}

export function TypePicker({ value, onChange }: { value: ContentType; onChange: (t: ContentType) => void }) {
  const { t } = useI18n()
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{t.generator.contentTitle}</legend>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5 xl:grid-cols-9">
        {CONTENT_TYPES.map((type) => {
          const Icon = TYPE_ICONS[type]
          const active = type === value
          return (
            <label
              key={type}
              className={cx(
                'group flex cursor-pointer select-none flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[12.5px] font-medium transition-all duration-200',
                active
                  ? 'border-fg bg-fg text-bg shadow-[0_6px_16px_-8px_rgb(0_0_0/0.4)]'
                  : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-bg',
              )}
            >
              <input
                type="radio"
                name={name}
                value={type}
                checked={active}
                onChange={() => onChange(type)}
                className="sr-only"
                data-testid={`type-${type}`}
              />
              <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              {t.generator.types[type]}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

type Setter<T extends ContentType> = (patch: Partial<PayloadData[T]>) => void

interface FormProps<T extends ContentType> {
  data: PayloadData[T]
  set: Setter<T>
}

function UrlForm({ data, set }: FormProps<'url'>) {
  const { t } = useI18n()
  return (
    <Field label={t.generator.fields.url}>
      {(id) => (
        <TextInput
          id={id}
          type="url"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="off"
          spellCheck={false}
          placeholder={t.generator.fields.urlPlaceholder}
          value={data.url}
          onChange={(e) => set({ url: e.target.value })}
          data-testid="input-url"
        />
      )}
    </Field>
  )
}

function TextForm({ data, set }: FormProps<'text'>) {
  const { t } = useI18n()
  return (
    <Field label={t.generator.fields.text}>
      {(id) => (
        <TextArea
          id={id}
          placeholder={t.generator.fields.textPlaceholder}
          value={data.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={5}
          data-testid="input-text"
        />
      )}
    </Field>
  )
}

function WifiForm({ data, set }: FormProps<'wifi'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  const [show, setShow] = useState(false)
  return (
    <div className="grid gap-4">
      <Field label={f.ssid}>
        {(id) => (
          <TextInput
            id={id}
            autoComplete="off"
            spellCheck={false}
            value={data.ssid}
            onChange={(e) => set({ ssid: e.target.value })}
            data-testid="input-ssid"
          />
        )}
      </Field>
      <Segmented
        label={f.security}
        value={data.security}
        onChange={(security) => set({ security })}
        options={[
          { value: 'WPA', label: f.securityWpa },
          { value: 'WEP', label: f.securityWep },
          { value: 'nopass', label: f.securityNone },
        ]}
        size="sm"
      />
      {data.security !== 'nopass' && (
        <Field label={f.password} hint={f.wifiNote}>
          {(id) => (
            <div className="relative">
              <TextInput
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={data.password}
                onChange={(e) => set({ password: e.target.value })}
                className="pr-11"
                data-testid="input-wifi-password"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-fg"
                aria-label={show ? f.hidePassword : f.showPassword}
                aria-pressed={show}
              >
                {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
              </button>
            </div>
          )}
        </Field>
      )}
      <Toggle checked={data.hidden} onChange={(hidden) => set({ hidden })} label={f.hidden} />
    </div>
  )
}

function EmailForm({ data, set }: FormProps<'email'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  return (
    <div className="grid gap-4">
      <Field label={f.emailTo}>
        {(id) => (
          <TextInput
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={data.to}
            onChange={(e) => set({ to: e.target.value })}
            data-testid="input-email"
          />
        )}
      </Field>
      <Field label={f.subject} optional={f.optional}>
        {(id) => <TextInput id={id} value={data.subject} onChange={(e) => set({ subject: e.target.value })} />}
      </Field>
      <Field label={f.message} optional={f.optional}>
        {(id) => <TextArea id={id} rows={3} value={data.body} onChange={(e) => set({ body: e.target.value })} />}
      </Field>
    </div>
  )
}

function PhoneForm({ data, set }: FormProps<'phone'>) {
  const { t } = useI18n()
  return (
    <Field label={t.generator.fields.phone}>
      {(id) => (
        <TextInput
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t.generator.fields.phonePlaceholder}
          value={data.phone}
          onChange={(e) => set({ phone: e.target.value })}
          data-testid="input-phone"
        />
      )}
    </Field>
  )
}

function SmsForm({ data, set }: FormProps<'sms'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  return (
    <div className="grid gap-4">
      <Field label={f.phone}>
        {(id) => (
          <TextInput
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={f.phonePlaceholder}
            value={data.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
        )}
      </Field>
      <Field label={f.message} optional={f.optional}>
        {(id) => <TextArea id={id} rows={3} value={data.message} onChange={(e) => set({ message: e.target.value })} />}
      </Field>
    </div>
  )
}

function VCardForm({ data, set }: FormProps<'vcard'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  const input = (key: keyof PayloadData['vcard'], label: string, extra: Record<string, unknown> = {}, span = false) => (
    <Field label={label} className={span ? 'sm:col-span-2' : undefined}>
      {(id) => (
        <TextInput
          id={id}
          value={data[key] as string}
          onChange={(e) => set({ [key]: e.target.value } as Partial<PayloadData['vcard']>)}
          {...extra}
        />
      )}
    </Field>
  )
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {input('firstName', f.firstName, { autoComplete: 'given-name', 'data-testid': 'input-first-name' })}
      {input('lastName', f.lastName, { autoComplete: 'family-name' })}
      {input('organization', f.organization, { autoComplete: 'organization' })}
      {input('title', f.jobTitle, { autoComplete: 'organization-title' })}
      {input('mobile', f.mobile, { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
      {input('workPhone', f.workPhone, { type: 'tel', inputMode: 'tel' })}
      {input('email', f.email, { type: 'email', inputMode: 'email', autoComplete: 'email' })}
      {input('website', f.website, { type: 'url', inputMode: 'url', autoComplete: 'url' })}
      {input('street', f.street, { autoComplete: 'street-address' }, true)}
      {input('city', f.city, { autoComplete: 'address-level2' })}
      {input('region', f.region, { autoComplete: 'address-level1' })}
      {input('postcode', f.postcode, { autoComplete: 'postal-code' })}
      {input('country', f.country, { autoComplete: 'country-name' })}
      <Field label={f.note} optional={f.optional} className="sm:col-span-2">
        {(id) => <TextArea id={id} rows={2} className="min-h-0" value={data.note} onChange={(e) => set({ note: e.target.value })} />}
      </Field>
    </div>
  )
}

function LocationForm({ data, set }: FormProps<'location'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={f.latitude}>
        {(id) => (
          <TextInput
            id={id}
            inputMode="decimal"
            placeholder="31.2304"
            value={data.latitude}
            onChange={(e) => set({ latitude: e.target.value })}
            data-testid="input-lat"
          />
        )}
      </Field>
      <Field label={f.longitude}>
        {(id) => (
          <TextInput
            id={id}
            inputMode="decimal"
            placeholder="121.4737"
            value={data.longitude}
            onChange={(e) => set({ longitude: e.target.value })}
            data-testid="input-lng"
          />
        )}
      </Field>
      <Segmented
        className="sm:col-span-2"
        label={f.mapFormat}
        value={data.format}
        onChange={(format) => set({ format })}
        options={[
          { value: 'geo', label: f.formatGeo },
          { value: 'maps', label: f.formatMaps },
        ]}
        size="sm"
      />
      <p className="-mt-2 text-[12.5px] leading-relaxed text-muted sm:col-span-2">{f.formatHint}</p>
      {data.format === 'geo' && (
        <Field label={f.label} className="sm:col-span-2">
          {(id) => <TextInput id={id} value={data.label} onChange={(e) => set({ label: e.target.value })} />}
        </Field>
      )}
    </div>
  )
}

function EventForm({ data, set }: FormProps<'event'>) {
  const { t } = useI18n()
  const f = t.generator.fields
  const type = data.allDay ? 'date' : 'datetime-local'
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label={f.eventTitle} className="sm:col-span-2">
        {(id) => (
          <TextInput id={id} value={data.title} onChange={(e) => set({ title: e.target.value })} data-testid="input-event-title" />
        )}
      </Field>
      <div className="sm:col-span-2">
        <Toggle
          checked={data.allDay}
          onChange={(allDay) =>
            set({
              allDay,
              // Convert between date and datetime values so nothing is lost.
              start: allDay ? data.start.slice(0, 10) : data.start ? `${data.start.slice(0, 10)}T09:00` : '',
              end: allDay ? data.end.slice(0, 10) : data.end ? `${data.end.slice(0, 10)}T10:00` : '',
            })
          }
          label={f.allDay}
        />
      </div>
      <Field label={f.start}>
        {(id) => (
          <TextInput id={id} type={type} value={data.start} onChange={(e) => set({ start: e.target.value })} data-testid="input-event-start" />
        )}
      </Field>
      <Field label={f.end} optional={f.optional}>
        {(id) => <TextInput id={id} type={type} value={data.end} min={data.start || undefined} onChange={(e) => set({ end: e.target.value })} />}
      </Field>
      <Field label={f.eventLocation} optional={f.optional} className="sm:col-span-2">
        {(id) => <TextInput id={id} value={data.location} onChange={(e) => set({ location: e.target.value })} />}
      </Field>
      <Field label={f.description} optional={f.optional} className="sm:col-span-2">
        {(id) => <TextArea id={id} rows={2} className="min-h-0" value={data.description} onChange={(e) => set({ description: e.target.value })} />}
      </Field>
    </div>
  )
}

export function ContentForm({
  type,
  data,
  onChange,
}: {
  type: ContentType
  data: PayloadData
  onChange: <T extends ContentType>(type: T, patch: Partial<PayloadData[T]>) => void
}) {
  switch (type) {
    case 'url':
      return <UrlForm data={data.url} set={(p) => onChange('url', p)} />
    case 'text':
      return <TextForm data={data.text} set={(p) => onChange('text', p)} />
    case 'wifi':
      return <WifiForm data={data.wifi} set={(p) => onChange('wifi', p)} />
    case 'email':
      return <EmailForm data={data.email} set={(p) => onChange('email', p)} />
    case 'phone':
      return <PhoneForm data={data.phone} set={(p) => onChange('phone', p)} />
    case 'sms':
      return <SmsForm data={data.sms} set={(p) => onChange('sms', p)} />
    case 'vcard':
      return <VCardForm data={data.vcard} set={(p) => onChange('vcard', p)} />
    case 'location':
      return <LocationForm data={data.location} set={(p) => onChange('location', p)} />
    case 'event':
      return <EventForm data={data.event} set={(p) => onChange('event', p)} />
  }
}
