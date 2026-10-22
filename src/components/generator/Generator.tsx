import { useCallback, useDeferredValue, useMemo, useState } from 'react'
import { useI18n } from '../../i18n'
import { DEFAULT_STYLE, generateQr, type QrStyle } from '../../lib/qr'
import { buildPayload, EMPTY_DATA, type ContentType, type PayloadData } from '../../lib/qr/payload'
import { SectionHeading } from '../ui'
import { ContentForm, TypePicker } from './ContentForm'
import { Preview } from './Preview'
import { StylePanel, type LogoState } from './StylePanel'

export function Generator() {
  const { t } = useI18n()
  const g = t.generator
  const [type, setType] = useState<ContentType>('url')
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
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading id="generator-title" eyebrow={g.eyebrow} title={g.title} subtitle={g.subtitle} />

        <div className="mt-12 grid gap-5 [grid-template-areas:'content'_'preview'_'style'] lg:grid-cols-[minmax(0,1fr)_400px] lg:[grid-template-areas:'content_preview'_'style_preview'] xl:grid-cols-[minmax(0,1fr)_440px]">
          <div className="rounded-[24px] border border-line bg-surface p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)] [grid-area:content] sm:p-7">
            <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{g.contentTitle}</h3>
            <TypePicker value={type} onChange={setType} />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">{g.typeHint[type]}</p>
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
