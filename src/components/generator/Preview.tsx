import { useMemo, useState } from 'react'
import { Check, Copy, Download, Lock } from 'lucide-react'
import { useI18n } from '../../i18n'
import { downloadBlob, renderPng, svgBlob } from '../../lib/qr/export'
import { DEFAULT_STYLE, generateQr, isBlocking, MAX_BYTES, toSvg, utf8Length, type QrOutcome, type QrStyle } from '../../lib/qr'
import type { PayloadIssue } from '../../lib/qr/payload'
import { CharityLinks } from '../Donate'
import { Notice, cx } from '../ui'

const PNG_SIZES = [512, 1024, 2048, 4096] as const

function stamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

interface PreviewProps {
  payload: string
  outcome: QrOutcome | null
  errors: PayloadIssue[]
  hints: PayloadIssue[]
  style: QrStyle
  filePrefix: string
}

export function Preview({ payload, outcome, errors, hints, style, filePrefix }: PreviewProps) {
  const { t } = useI18n()
  const g = t.generator
  const [pngSize, setPngSize] = useState<(typeof PNG_SIZES)[number]>(1024)
  const [busy, setBusy] = useState<null | 'png' | 'svg'>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

  const result = outcome?.ok ? outcome.result : null
  const svg = useMemo(() => (result ? toSvg(result) : ''), [result])
  const blocked = !result || isBlocking(result.issues)

  // A faded sample keeps the layout stable and shows the current style while empty.
  const ghost = useMemo(() => {
    if (result) return ''
    const out = generateQr('https://qrcode666.app', { ...DEFAULT_STYLE, ...style, ecLevel: 'M' }, null)
    return out.ok ? toSvg(out.result) : ''
  }, [result, style])

  async function download(kind: 'png' | 'svg') {
    if (!result || blocked) return
    setBusy(kind)
    setFailed(false)
    try {
      const name = `${filePrefix}-${stamp()}.${kind}`
      const blob = kind === 'png' ? await renderPng(result, pngSize) : svgBlob(toSvg(result, pngSize))
      downloadBlob(blob, name)
      setDownloaded(true)
    } catch {
      setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — the text is still selectable */
    }
  }

  const errorMessage = errors.length ? g.issues[errors[0]] : null

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cx(
          'relative overflow-hidden rounded-[22px] border border-line p-6 sm:p-8',
          result?.options.transparent ? 'checkerboard' : 'bg-sunken',
        )}
      >
        <div className="relative mx-auto aspect-square w-full max-w-[340px]">
          {result ? (
            <div
              role="img"
              aria-label={g.previewAlt}
              data-testid="qr-preview"
              className="size-full drop-shadow-[0_12px_30px_rgb(0_0_0/0.12)] [&>svg]:block [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <>
              <div
                aria-hidden
                className="size-full opacity-[0.12] blur-[2px] grayscale [&>svg]:block [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: ghost }}
              />
              <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-[14px] font-medium text-muted" data-testid="qr-empty">
                {outcome && !outcome.ok ? '' : g.previewEmpty}
              </p>
            </>
          )}
        </div>
      </div>

      {result && (
        <p className="text-center font-mono text-[11.5px] text-subtle" data-testid="qr-stats">
          {g.stats(result.matrix.version, result.matrix.size, result.ecLevel, utf8Length(payload))}
        </p>
      )}

      <div className="grid gap-2" aria-live="polite">
        {outcome && !outcome.ok && (
          <Notice severity="error">
            <span data-testid="capacity-error">
              {g.capacity(outcome.capacity.bytes, MAX_BYTES[outcome.capacity.ecLevel], outcome.capacity.ecLevel)}
            </span>
          </Notice>
        )}
        {errorMessage && errors[0] !== 'empty' && <Notice severity="warn">{errorMessage}</Notice>}
        {hints.map((h) => (
          <Notice key={h} severity="warn">
            {g.issues[h]}
          </Notice>
        ))}
        {result?.issues.map((i) => (
          <Notice key={i.code} severity={i.severity}>
            {g.quality[i.code]}
          </Notice>
        ))}
      </div>

      <div className="grid gap-3">
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-medium text-fg/80">{g.pngSize}</legend>
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-sunken p-1">
            {PNG_SIZES.map((s) => (
              <label
                key={s}
                className={cx(
                  'cursor-pointer rounded-[9px] py-1.5 text-center font-mono text-[12px] transition-all',
                  pngSize === s ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--line)]' : 'text-muted hover:text-fg',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                )}
              >
                <input type="radio" name="png-size" className="sr-only" checked={pngSize === s} onChange={() => setPngSize(s)} data-testid={`png-${s}`} />
                {s}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={blocked || busy !== null}
            onClick={() => void download('png')}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 text-[14.5px] font-semibold text-bg transition-all duration-200 hover:-translate-y-px hover:shadow-[0_10px_24px_-10px_rgb(0_0_0/0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0 disabled:hover:shadow-none"
            data-testid="download-png"
          >
            <Download className="size-4" aria-hidden />
            {busy === 'png' ? g.downloading : `${g.download} ${g.downloadPng}`}
          </button>
          <button
            type="button"
            disabled={blocked || busy !== null}
            onClick={() => void download('svg')}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-3 text-[14.5px] font-semibold transition-all duration-200 hover:-translate-y-px hover:border-fg/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
            data-testid="download-svg"
          >
            <Download className="size-4" aria-hidden />
            {busy === 'svg' ? g.downloading : `${g.download} ${g.downloadSvg}`}
          </button>
        </div>
        {failed && <Notice severity="error">{g.downloadFailed}</Notice>}
        {downloaded && (
          <p role="status" className="animate-[intro-fade-in_0.5s_ease_both] text-center text-[13px] text-muted" data-testid="thanks-note">
            {t.donate.afterDownload} <CharityLinks />
          </p>
        )}
        <p className="text-center text-[12px] text-subtle">
          {g.svgNote} {g.testTip}
        </p>
      </div>

      {result && (
        <details className="group rounded-2xl border border-line">
          <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-[13.5px] font-medium">
            {g.encoded}
            <span className="text-subtle transition-transform duration-200 group-open:rotate-45" aria-hidden>
              +
            </span>
          </summary>
          <div className="border-t border-line px-4 py-3">
            <p className="mb-2 text-[12.5px] text-muted">{g.encodedHint}</p>
            <pre
              className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-sunken p-3 font-mono text-[12px] leading-relaxed"
              data-testid="encoded-payload"
            >
              {payload}
            </pre>
            <button
              type="button"
              onClick={() => void copy()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-muted hover:bg-sunken hover:text-fg"
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
              {copied ? g.copied : g.copy}
            </button>
          </div>
        </details>
      )}

      <p className="flex items-start justify-center gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-[13px] font-medium leading-snug text-accent" data-testid="privacy-note">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {g.privacy}
      </p>
    </div>
  )
}
