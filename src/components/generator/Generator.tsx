import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Camera } from 'lucide-react'
import { useI18n } from '../../i18n'
import { DEFAULT_STYLE, generateQr, type QrStyle } from '../../lib/qr'
import { buildPayload, EMPTY_DATA, type ContentType, type PayloadData } from '../../lib/qr/payload'
import { SectionHeading } from '../ui'
import { ContentForm, TypePicker } from './ContentForm'
import { Preview } from './Preview'
import { StylePanel, type LogoState } from './StylePanel'

/**
 * Phones' own Camera apps act on these formats (join Wi-Fi, save a contact,
 * add an event…), but in-app scanners such as WeChat's only show the raw text.
 * URLs and plain text behave the same everywhere, so they need no tip.
 */
function needsCameraTip(type: ContentType, data: PayloadData): boolean {
  if (type === 'url' || type === 'text') return false
  if (type === 'location' && data.location.format === 'maps') return false
  return true
}

/** `initialType` presets the content type (landing pages); `heading` hides the section title where the page's H1 already says it. */
export function Generator({ initialType = 'url', heading = true }: { initialType?: ContentType; heading?: boolean }) {
  const { t } = useI18n()
  const g = t.generator
  const [type, setType] = useState<ContentType>(initialType)
  const [data, setData] = useState<PayloadData>(EMPTY_DATA)
  const [style, setStyleState] = useState<QrStyle>(DEFAULT_STYLE)
  const [logo, setLogo] = useState<LogoState | null>(null)
  const [logoSize, setLogoSize] = useState(0.22)
  const [logoPlate, setLogoPlate] = useState(true)

  const onChange = useCallback(<T extends ContentType>(key: T, patch: Partial<PayloadData[T]>) => {
    setData((d) => ({ ...d, [key]: { ...d[key], ...patch } }))
  }, [])
  const setStyle = useCallback((patch: Partial<QrStyle>) => setStyleState((s) => ({ ...s, ...patch })), [])

  const payloadResult = useMemo(() => buildPayload(type, data[type]), [type, data])
  // Keep typing responsive for very long content: encoding can lag a frame behind.
  const payload = useDeferredValue(payloadResult.payload)

  const outcome = useMemo(() => {
    if (!payload) return null
    return generateQr(payload, style, logo ? { src: logo.src, aspect: logo.aspect, size: logoSize, plate: logoPlate } : null)
  }, [payload, style, logo, logoSize, logoPlate])

  return (
    <section id="generator" aria-labelledby="generator-title" className="scroll-mt-16 border-t border-line bg-sunken/60">
      <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${heading ? 'py-20 lg:py-28' : 'pb-20 pt-8 lg:pb-28 lg:pt-10'}`}>
        {heading ? (
          <SectionHeading id="generator-title" eyebrow={g.eyebrow} title={g.title} subtitle={g.subtitle} />
        ) : (
          <h2 id="generator-title" className="sr-only">
            {g.title}
          </h2>
        )}

        <div className={`${heading ? 'mt-12' : ''} grid gap-5 [grid-template-areas:'content'_'preview'_'style'] lg:grid-cols-[minmax(0,1fr)_400px] lg:[grid-template-areas:'content_preview'_'style_preview'] xl:grid-cols-[minmax(0,1fr)_440px]`}>
          <div className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] [grid-area:content] sm:p-7">
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{g.contentTitle}</h3>
            <TypePicker value={type} onChange={setType} />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{g.typeHint[type]}</p>
            {needsCameraTip(type, data) && (
              <p
                className="mt-3 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] leading-snug text-accent"
                data-testid="camera-tip"
              >
                <Camera className="mt-px size-3.5 shrink-0" aria-hidden />
                {g.cameraTip}
              </p>
            )}
            <div className="mt-5">
              <ContentForm type={type} data={data} onChange={onChange} />
            </div>
          </div>

          <div className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] [grid-area:style] sm:p-7">
            <StylePanel
              style={style}
              setStyle={setStyle}
              resetStyle={() => setStyleState(DEFAULT_STYLE)}
              logo={logo}
              setLogo={setLogo}
              logoSize={logoSize}
              setLogoSize={setLogoSize}
              logoPlate={logoPlate}
              setLogoPlate={setLogoPlate}
            />
          </div>

          <aside aria-label={g.preview} className="[grid-area:preview]">
            <div className="rounded-[24px] border border-line bg-surface p-4 shadow-[0_1px_2px_rgb(0_0_0/0.03),0_24px_60px_-40px_rgb(0_0_0/0.35)] sm:p-5 lg:sticky lg:top-20">
              <Preview
                payload={payload}
                outcome={outcome}
                errors={payloadResult.errors}
                hints={payloadResult.hints}
                style={style}
                filePrefix={`qrcode666-${type}`}
              />
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
