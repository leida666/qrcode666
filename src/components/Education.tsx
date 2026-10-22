import { Check, FileText, Server, Smartphone } from 'lucide-react'
import { useI18n } from '../i18n'
import { SectionHeading, cx } from './ui'

function Node({ icon: Icon, label, muted }: { icon: typeof Server; label: string; muted?: boolean }) {
  return (
    <span className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <span
        className={cx(
          'flex size-11 items-center justify-center rounded-xl border',
          muted ? 'border-dashed border-line-strong text-subtle' : 'border-line bg-surface text-fg',
        )}
      >
        <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-[11.5px] font-medium leading-tight text-muted">{label}</span>
    </span>
  )
}

function Arrow({ dashed }: { dashed?: boolean }) {
  return (
    <span aria-hidden className="mb-5 flex flex-1 items-center">
      <span className={cx('h-px flex-1', dashed ? 'border-t border-dashed border-line-strong' : 'bg-fg/40')} />
      <span className={cx('size-0 border-y-[4px] border-l-[6px] border-y-transparent', dashed ? 'border-l-line-strong' : 'border-l-fg/40')} />
    </span>
  )
}

export function Education() {
  const { t } = useI18n()
  const e = t.education
  return (
    <section id="static-vs-dynamic" aria-labelledby="edu-title" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading id="edu-title" eyebrow={e.eyebrow} title={e.title} subtitle={e.subtitle} />

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <article className="relative rounded-[24px] border-2 border-accent bg-surface p-6 shadow-[0_24px_60px_-40px_var(--accent)] sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-[-0.03em]">{e.staticTitle}</h3>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11.5px] font-semibold text-accent-fg">{e.staticTag}</span>
            </div>
            <div className="mt-7 flex items-end gap-3" role="img" aria-label={`${e.flowPhone} → ${e.flowYou}`}>
              <Node icon={Smartphone} label={e.flowPhone} />
              <Arrow />
              <Node icon={FileText} label={e.flowYou} />
            </div>
            <ul className="mt-7 grid gap-3.5">
              {e.staticPoints.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Check className="size-3" strokeWidth={3} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[24px] border border-line bg-sunken/70 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-fg/85">{e.dynamicTitle}</h3>
              <span className="rounded-full border border-line-strong px-2.5 py-1 text-[11.5px] font-medium text-muted">{e.dynamicTag}</span>
            </div>
            <div
              className="mt-7 flex items-end gap-3"
              role="img"
              aria-label={`${e.flowPhone} → ${e.flowProvider} → ${e.flowYou}`}
            >
              <Node icon={Smartphone} label={e.flowPhone} />
              <Arrow />
              <Node icon={Server} label={e.flowProvider} muted />
              <Arrow dashed />
              <Node icon={FileText} label={e.flowYou} />
            </div>
            <ul className="mt-7 grid gap-3.5">
              {e.dynamicPoints.map((p) => (
                <li key={p} className="flex gap-3 text-[15px] leading-relaxed text-fg/75">
                  <span className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-subtle" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-16 grid gap-8 border-t border-line pt-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <p className="font-display text-balance text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.08]">{e.statement}</p>
          <p className="text-pretty text-[15px] leading-relaxed text-muted">{e.caveat}</p>
        </div>
      </div>
    </section>
  )
}
