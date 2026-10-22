import { useI18n } from '../i18n'
import { Mark } from './Logo'
import { SectionHeading } from './ui'

/** Always dark, in both themes — the one loud section on the page. */
export function Manifesto() {
  const { t } = useI18n()
  const m = t.manifesto
  return (
    <section id="manifesto" aria-labelledby="manifesto-title" className="scroll-mt-16 bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <SectionHeading id="manifesto-title" eyebrow={m.eyebrow} title={m.title} invert />
        <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="grid content-start gap-6 text-pretty text-[17px] leading-[1.75] text-white/70 sm:text-lg">
            {m.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <ol className="grid content-start gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {m.principles.map(([title, body], i) => (
              <li key={title} className="flex gap-5 bg-[#070707] p-5 sm:p-6">
                <span className="font-mono text-[12px] text-[#6d8bff]">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="font-semibold tracking-[-0.01em]">{title}</p>
                  <p className="mt-1 text-[14.5px] leading-relaxed text-white/55">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-20 flex flex-col items-start gap-6 border-t border-white/10 pt-12 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-serif text-[clamp(1.9rem,4.5vw,3.4rem)] italic leading-[1.1] tracking-[-0.01em]">{m.signoff}</p>
          <Mark className="size-14 shrink-0" label="QRCode666 — scans to qrcode666.app" />
        </div>
      </div>
    </section>
  )
}
