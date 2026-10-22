import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowLeftRight, ImagePlus, RotateCcw, X } from 'lucide-react'
import { useI18n } from '../../i18n'
import {
  EC_LEVELS,
  EYE_STYLES,
  LOGO_MAX,
  LOGO_MIN,
  MODULE_STYLES,
  PRESETS,
  generateQr,
  logoEcLevel,
  toSvg,
  type ECLevel,
  type EyeStyle,
  type ModuleStyle,
  type PresetId,
  type QrStyle,
} from '../../lib/qr'
import { Notice, Range, Segmented, Toggle, cx } from '../ui'

export interface LogoState {
  src: string
  aspect: number
  name: string
}

const PRESET_IDS = Object.keys(PRESETS) as PresetId[]

function presetMatches(style: QrStyle, id: PresetId) {
  const p = PRESETS[id]
  return (
    p.fg === style.fg &&
    p.bg === style.bg &&
    p.moduleStyle === style.moduleStyle &&
    p.eyeStyle === style.eyeStyle &&
    p.corner === style.corner &&
    p.ecLevel === style.ecLevel
  )
}

function PresetThumb({ id }: { id: PresetId }) {
  const svg = useMemo(() => {
    const out = generateQr('QRCode666', { ...PRESETS[id], margin: 2, transparent: false }, null)
    return out.ok ? toSvg(out.result) : ''
  }, [id])
  return <span className="block size-11 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: svg }} />
}

/** Tiny glyphs that show what each module / eye style looks like. */
function ModuleGlyph({ style }: { style: ModuleStyle }) {
  const cells = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 2],
    [2, 2],
  ]
  return (
    <svg viewBox="0 0 3 3" className="size-4" aria-hidden fill="currentColor">
      {style === 'fluid' ? (
        <>
          <path d="M0.5 0H1.5A0.5 0.5 0 0 1 2 0.5V2H1V1H0.5A0.5 0.5 0 0 1 0.5 0Z" />
          <circle cx="0.5" cy="2.5" r="0.5" />
          <circle cx="2.5" cy="2.5" r="0.5" />
        </>
      ) : (
        cells.map(([x, y]) =>
          style === 'dots' ? (
            <circle key={`${x}${y}`} cx={x + 0.5} cy={y + 0.5} r={0.42} />
          ) : (
            <rect
              key={`${x}${y}`}
              x={style === 'soft' ? x + 0.07 : x}
              y={style === 'soft' ? y + 0.07 : y}
              width={style === 'soft' ? 0.86 : 1}
              height={style === 'soft' ? 0.86 : 1}
              rx={style === 'soft' ? 0.28 : 0}
            />
          ),
        )
      )}
    </svg>
  )
}

function EyeGlyph({ style }: { style: EyeStyle }) {
  return (
    <svg viewBox="0 0 7 7" className="size-4" aria-hidden fill="currentColor" fillRule="evenodd">
      {style === 'circle' ? (
        <>
          <path d="M3.5 0a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7Zm0 1a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5Z" />
          <circle cx="3.5" cy="3.5" r="1.5" />
        </>
      ) : style === 'rounded' ? (
        <>
          <path d="M2.2 0h2.6A2.2 2.2 0 0 1 7 2.2v2.6A2.2 2.2 0 0 1 4.8 7H2.2A2.2 2.2 0 0 1 0 4.8V2.2A2.2 2.2 0 0 1 2.2 0Zm.1 1A1.3 1.3 0 0 0 1 2.3v2.4A1.3 1.3 0 0 0 2.3 6h2.4A1.3 1.3 0 0 0 6 4.7V2.3A1.3 1.3 0 0 0 4.7 1Z" />
          <rect x="2" y="2" width="3" height="3" rx="0.9" />
        </>
      ) : (
        <>
          <path d="M0 0h7v7H0Zm1 1v5h5V1Z" />
          <rect x="2" y="2" width="3" height="3" />
        </>
      )}
    </svg>
  )
}

function ColorField({ label, value, onChange, testId }: { label: string; value: string; onChange: (v: string) => void; testId: string }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg/80" id={`${testId}-label`}>
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-line-strong bg-surface p-1 pr-2 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <input
          type="color"
          className="swatch shrink-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-labelledby={`${testId}-label`}
          data-testid={`${testId}-picker`}
        />
        <input
          type="text"
          value={text}
          spellCheck={false}
          autoCapitalize="off"
          maxLength={7}
          aria-labelledby={`${testId}-label`}
          className="w-full min-w-0 bg-transparent font-mono text-[13.5px] uppercase text-fg outline-none"
          data-testid={testId}
          onChange={(e) => {
            const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`
            setText(v)
            if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) {
              onChange(v.length === 4 ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase() : v.toLowerCase())
            }
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  )
}

function Group({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-t border-line pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{title}</h4>
        {action}
      </div>
      <div className="grid gap-5">{children}</div>
    </div>
  )
}

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Reads the logo entirely in the browser; large bitmaps are downscaled to keep exports light. */
async function readLogo(file: File): Promise<LogoState> {
  if (file.type === 'image/svg+xml') {
    const text = await file.text()
    let aspect = 1
    const vb = /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(text)
    const w = /<svg[^>]*\swidth\s*=\s*["']([\d.]+)/i.exec(text)
    const h = /<svg[^>]*\sheight\s*=\s*["']([\d.]+)/i.exec(text)
    if (vb && +vb[1] > 0 && +vb[2] > 0) aspect = +vb[1] / +vb[2]
    else if (w && h && +w[1] > 0 && +h[1] > 0) aspect = +w[1] / +h[1]
    const src = await readAsDataUrl(file)
    await loadImage(src) // validate
    return { src, aspect, name: file.name }
  }
  const src = await readAsDataUrl(file)
  const img = await loadImage(src)
  const aspect = img.naturalWidth / img.naturalHeight || 1
  const MAX = 1024
  if (Math.max(img.naturalWidth, img.naturalHeight) <= MAX) return { src, aspect, name: file.name }
  const scale = MAX / Math.max(img.naturalWidth, img.naturalHeight)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return { src: canvas.toDataURL('image/png'), aspect, name: file.name }
}

interface StylePanelProps {
  style: QrStyle
  setStyle: (patch: Partial<QrStyle>) => void
  resetStyle: () => void
  logo: LogoState | null
  setLogo: (logo: LogoState | null) => void
  logoSize: number
  setLogoSize: (v: number) => void
  logoPlate: boolean
  setLogoPlate: (v: boolean) => void
}

export function StylePanel(props: StylePanelProps) {
  const { style, setStyle, logo, setLogo, logoSize, setLogoSize, logoPlate, setLogoPlate } = props
  const { t } = useI18n()
  const g = t.generator
  const fileRef = useRef<HTMLInputElement>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const effectiveEc: ECLevel = logo ? logoEcLevel(style.ecLevel) : style.ecLevel
  const maxLogo = LOGO_MAX[effectiveEc]

  async function handleFile(file: File | undefined) {
    if (!file) return
    setLogoError(null)
    if (!LOGO_TYPES.includes(file.type)) return setLogoError(g.logoBadType)
    if (file.size > MAX_LOGO_BYTES) return setLogoError(g.logoTooBig)
    try {
      const next = await readLogo(file)
      setLogo(next)
      if (style.ecLevel !== 'H' && style.ecLevel !== 'Q') setStyle({ ecLevel: 'H' })
    } catch {
      setLogoError(g.logoFailed)
    }
  }

  return (
    <div className="grid gap-6">
      <Group
        title={g.presets}
        action={
          <button
            type="button"
            onClick={props.resetStyle}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-muted hover:bg-sunken hover:text-fg"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            {g.reset}
          </button>
        }
      >
        <div className="grid grid-cols-5 gap-2" role="group" aria-label={g.presets}>
          {PRESET_IDS.map((id) => {
            const active = presetMatches(style, id)
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setStyle({ ...PRESETS[id], ecLevel: logo ? logoEcLevel(PRESETS[id].ecLevel) : PRESETS[id].ecLevel })}
                className={cx(
                  'flex flex-col items-center gap-2 rounded-xl border p-2 pb-1.5 text-[11.5px] font-medium transition-all duration-200',
                  active ? 'border-fg text-fg' : 'border-line text-muted hover:border-line-strong hover:text-fg',
                )}
                data-testid={`preset-${id}`}
              >
                <span className="overflow-hidden rounded-md ring-1 ring-line">
                  <PresetThumb id={id} />
                </span>
                <span className="w-full truncate text-center">{g.presetNames[id]}</span>
              </button>
            )
          })}
        </div>
      </Group>

      <Group title={g.styleTitle}>
        <div className="flex items-end gap-2">
          <ColorField label={g.foreground} value={style.fg} onChange={(fg) => setStyle({ fg })} testId="color-fg" />
          <button
            type="button"
            onClick={() => setStyle({ fg: style.bg, bg: style.fg })}
            className="mb-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-sunken hover:text-fg"
            aria-label={g.swapColors}
            title={g.swapColors}
          >
            <ArrowLeftRight className="size-4" aria-hidden />
          </button>
          <ColorField label={g.background} value={style.bg} onChange={(bg) => setStyle({ bg })} testId="color-bg" />
        </div>
        <Toggle checked={style.transparent} onChange={(transparent) => setStyle({ transparent })} label={g.transparent} />

        <Segmented
          label={g.moduleStyle}
          value={style.moduleStyle}
          onChange={(moduleStyle) => setStyle({ moduleStyle })}
          options={MODULE_STYLES.map((s) => ({
            value: s,
            label: (
              <>
                <ModuleGlyph style={s} />
                {g.moduleStyles[s]}
              </>
            ),
          }))}
        />
        <Segmented
          label={g.eyeStyle}
          value={style.eyeStyle}
          onChange={(eyeStyle) => setStyle({ eyeStyle })}
          options={EYE_STYLES.map((s) => ({
            value: s,
            label: (
              <>
                <EyeGlyph style={s} />
                {g.eyeStyles[s]}
              </>
            ),
          }))}
        />
        <div>
          <Segmented
            label={g.ecLevel}
            value={effectiveEc}
            onChange={(ecLevel) => setStyle({ ecLevel })}
            options={EC_LEVELS.map((l) => ({
              value: l,
              label: l,
              title: g.ecHint[l],
              disabled: !!logo && (l === 'L' || l === 'M'),
            }))}
          />
          <p className="mt-1.5 text-[12.5px] text-muted">
            {g.ecHint[effectiveEc]}
            {logo && <span className="text-subtle"> {g.ecLocked}</span>}
          </p>
        </div>
        <Range
          label={g.margin}
          value={style.margin}
          min={0}
          max={10}
          step={1}
          onChange={(margin) => setStyle({ margin })}
          display={g.marginUnit(style.margin)}
        />
        {!style.transparent && style.margin > 0 && (
          <Range
            label={g.corner}
            value={Math.round(style.corner * 100)}
            min={0}
            max={100}
            step={5}
            onChange={(v) => setStyle({ corner: v / 100 })}
            display={`${Math.round(style.corner * 100)}%`}
          />
        )}
      </Group>

      <Group title={g.logoTitle}>
        <input
          ref={fileRef}
          type="file"
          accept={LOGO_TYPES.join(',')}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          data-testid="logo-input"
          onChange={(e) => {
            void handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {!logo ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void handleFile(e.dataTransfer.files?.[0])
            }}
            className={cx(
              'flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center transition-colors',
              dragging ? 'border-accent bg-accent-soft' : 'border-line-strong hover:border-fg/40 hover:bg-sunken',
            )}
          >
            <ImagePlus className="size-5 text-muted" aria-hidden />
            <span className="text-[14px] font-medium">{g.logoUpload}</span>
            <span className="text-[12.5px] text-muted">{g.logoDrop}</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-2xl border border-line p-2.5">
              <span className="checkerboard flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                <img src={logo.src} alt="" className="max-h-full max-w-full object-contain" />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{logo.name}</span>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-muted hover:bg-sunken hover:text-fg"
              >
                {g.logoReplace}
              </button>
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-fg"
                aria-label={g.logoRemove}
                data-testid="logo-remove"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <Range
              label={g.logoSize}
              value={Math.round(Math.min(logoSize, maxLogo) * 100)}
              min={Math.round(LOGO_MIN * 100)}
              max={Math.round(maxLogo * 100)}
              step={1}
              onChange={(v) => setLogoSize(v / 100)}
              display={`${Math.round(Math.min(logoSize, maxLogo) * 100)}%`}
            />
            <p className="-mt-3 text-[12.5px] text-muted">{g.logoLimit(Math.round(maxLogo * 100), effectiveEc)}</p>
            <Toggle checked={logoPlate} onChange={setLogoPlate} label={g.logoPlate} />
          </>
        )}
        {logoError && <Notice severity="error">{logoError}</Notice>}
      </Group>
    </div>
  )
}
