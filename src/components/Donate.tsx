import { ArrowUpRight, Heart } from 'lucide-react'
import { useI18n } from '../i18n'
import { CHARITIES, donateHref } from '../lib/donate'
import { SectionHeading } from './ui'

// Links pass through /donate/<org>, which adds one to an anonymous daily tally
// (organisation, day, page language — nothing about the person) and redirects
// to the official page. No tracking parameters and no referrer are passed on.
const external = { target: '_blank', rel: 'noopener noreferrer' } as const

/** "UNICEF or WFP" as inline links, for the footer and the post-download note. */
export function CharityLinks({ className = 'underline decoration-line-strong underline-offset-4 hover:text-fg hover:decoration-fg' }) {
  const { t, lang } = useI18n()
  const d = t.donate
  return (
    <>
      <a href={donateHref('unicef', lang)} {...external} className={className} data-testid="donate-link-unicef">
        {d.orgs.unicef.name}
        <span className="sr-only"> {d.newTab}</span>
      </a>{' '}
      {d.or}{' '}
      <a href={donateHref('wfp', lang)} {...external} className={className} data-testid="donate-link-wfp">
        {d.orgs.wfp.name}
        <span className="sr-only"> {d.newTab}</span>
      </a>
      {d.end}
    </>
  )
}

export function Donate() {
  const { t, lang } = useI18n()
  const d = t.donate
  return (
    <section id="donate" aria-labelledby="donate-title" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <SectionHeading id="donate-title" eyebrow={d.eyebrow} title={d.title} subtitle={d.body} />
        <ul className="mt-12 grid gap-5 md:grid-cols-2">
          {CHARITIES.map(({ id }) => {
            const org = d.orgs[id]
            return (
              <li key={id} className="flex flex-col rounded-[24px] border border-line bg-surface p-6 sm:p-8" data-testid={`charity-${id}`}>
                <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-subtle">{org.full}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{org.name}</h3>
                <p className="mt-3 flex-1 text-pretty text-[15px] leading-relaxed text-muted">{org.desc}</p>
                <a
                  href={donateHref(id, lang)}
                  {...external}
                  className="group mt-7 inline-flex w-fit items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-[14.5px] font-semibold transition-all duration-200 hover:-translate-y-px hover:border-fg/40"
                  data-testid={`donate-${id}`}
                >
                  <Heart className="size-4 text-accent" aria-hidden />
                  {d.cta(org.name)}
                  <ArrowUpRight
                    className="size-4 text-subtle transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                  <span className="sr-only"> {d.newTab}</span>
                </a>
              </li>
            )
          })}
        </ul>
        <p className="mt-6 max-w-3xl text-[13px] leading-relaxed text-subtle">{d.disclaimer}</p>
      </div>
    </section>
  )
}
