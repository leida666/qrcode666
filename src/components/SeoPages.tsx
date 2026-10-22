import { ArrowRight, Check, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'
import { CONTENT_TYPES, type ContentType } from '../lib/qr/payload'
import { ARTICLES, pagePath, type ArticleId } from '../pages'
import { TYPE_ICONS } from './generator/ContentForm'
import { Generator } from './generator/Generator'
import { cx } from './ui'

function Breadcrumbs({ current }: { current: string }) {
  const { t, lang } = useI18n()
  return (
    <nav aria-label={t.seo.ui.breadcrumb} className="mb-8">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <li>
          <a href={pagePath({ kind: 'home' }, lang)} className="hover:text-fg">
            {t.seo.ui.home}
          </a>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5 text-subtle" />
        </li>
        <li aria-current="page" className="text-fg/80">
          {current}
        </li>
      </ol>
    </nav>
  )
}

/** Internal links to every generator page (footer and landing pages). */
export function GeneratorLinks({ exclude, className }: { exclude?: ContentType; className?: string }) {
  const { t, lang } = useI18n()
  return (
    <ul className={cx('grid gap-x-6 gap-y-2.5', className)}>
      {CONTENT_TYPES.filter((type) => type !== exclude).map((type) => {
        const Icon = TYPE_ICONS[type]
        return (
          <li key={type}>
            <a
              href={pagePath({ kind: 'type', type }, lang)}
              className="inline-flex items-center gap-2 text-[13.5px] text-muted transition-colors hover:text-fg"
            >
              <Icon className="size-3.5 shrink-0 text-subtle" aria-hidden />
              {t.seo.types[type].nav}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export function GuideLinks({ exclude, className }: { exclude?: ArticleId; className?: string }) {
  const { t, lang } = useI18n()
  return (
    <ul className={cx('grid gap-y-2.5', className)}>
      {ARTICLES.filter((id) => id !== exclude).map((id) => (
        <li key={id}>
          <a href={pagePath({ kind: 'article', id }, lang)} className="text-[13.5px] text-muted transition-colors hover:text-fg">
            {t.seo.articles[id].nav}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** /wifi-qr-code-generator etc.: a focused intro, the generator preset to the type, steps and FAQ. */
export function TypeLanding({ type }: { type: ContentType }) {
  const { t } = useI18n()
  const p = t.seo.types[type]
  const Icon = TYPE_ICONS[type]
  return (
    <>
      <section aria-labelledby="page-title" className="mx-auto max-w-7xl px-4 pb-4 pt-10 sm:px-6 md:pt-14 lg:px-8">
        <Breadcrumbs current={p.h1} />
        <div className="max-w-3xl">
          <span className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Icon className="size-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h1 id="page-title" className="font-display text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[0.98]">
            {p.h1}
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">{p.subtitle}</p>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {t.hero.points.map((point) => (
              <li key={point} className="flex items-center gap-2 text-[14.5px] font-medium text-fg/85">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Generator initialType={type} heading={false} />

      <section aria-labelledby="how-title" className="border-t border-line">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <div>
            <h2 id="how-title" className="font-display text-[clamp(1.8rem,4vw,2.75rem)] font-semibold leading-[1.05]">
              {t.seo.ui.howTitle(p.name)}
            </h2>
            <ol className="mt-8 grid gap-5">
              {p.steps.map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fg font-mono text-[13px] font-semibold text-bg">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-[16px] leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.75rem)] font-semibold leading-[1.05]">{t.seo.ui.faqTitle}</h2>
            <div className="mt-6 border-t border-line">
              {p.faq.map((item) => (
                <details key={item.q} className="group border-b border-line" open>
                  <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 text-[16.5px] font-medium">
                    <h3>{item.q}</h3>
                  </summary>
                  <p className="pb-5 text-pretty text-[15px] leading-[1.75] text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="more-title" className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 id="more-title" className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">
            {t.seo.ui.generators}
          </h2>
          <GeneratorLinks exclude={type} className="mt-5 sm:grid-cols-2 lg:grid-cols-4" />
          <h2 className="mt-10 text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{t.seo.ui.guides}</h2>
          <GuideLinks className="mt-5" />
        </div>
      </section>
    </>
  )
}

/** /do-qr-codes-expire etc.: a plain, readable article with a way back to the generator. */
export function ArticlePage({ id }: { id: ArticleId }) {
  const { t, lang } = useI18n()
  const a = t.seo.articles[id]
  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
      <Breadcrumbs current={a.nav} />
      <h1 id="page-title" className="font-display text-balance text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1]">
        {a.h1}
      </h1>
      <p className="mt-7 text-pretty text-xl leading-relaxed text-muted">{a.lead}</p>
      <div className="mt-12 grid gap-10">
        {a.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-[clamp(1.4rem,3vw,1.85rem)] font-semibold tracking-[-0.02em]">{s.h}</h2>
            {s.p.map((para) => (
              <p key={para} className="mt-4 text-pretty text-[17px] leading-[1.8] text-fg/85">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>
      <a
        href={`${pagePath({ kind: 'home' }, lang)}#generator`}
        className="group mt-14 inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-[15px] font-semibold text-bg transition-transform hover:-translate-y-0.5"
        data-testid="article-cta"
      >
        {a.cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </a>
      <aside className="mt-16 border-t border-line pt-10" aria-labelledby="related-title">
        <h2 id="related-title" className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">
          {t.seo.ui.related}
        </h2>
        <GuideLinks exclude={id} className="mt-5" />
        <GeneratorLinks className="mt-6 sm:grid-cols-2" />
      </aside>
    </article>
  )
}
