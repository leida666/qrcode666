import { Plus } from 'lucide-react'
import { useI18n } from '../i18n'
import { SectionHeading } from './ui'

export function Faq() {
  const { t } = useI18n()
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:gap-20 lg:px-8 lg:py-28">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading id="faq-title" eyebrow={t.faq.eyebrow} title={t.faq.title} />
        </div>
        <div className="border-t border-line">
          {t.faq.items.map((item, i) => (
            <details key={item.q} className="group border-b border-line" open={i === 0}>
              <summary className="flex cursor-pointer items-center justify-between gap-6 py-5 text-left text-[17px] font-medium tracking-[-0.01em] transition-colors hover:text-accent">
                <h3>{item.q}</h3>
                <Plus
                  className="size-5 shrink-0 text-subtle transition-transform duration-300 ease-out-expo group-open:rotate-45"
                  aria-hidden
                />
              </summary>
              <p className="max-w-2xl pb-6 pr-10 text-pretty text-[15.5px] leading-[1.75] text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
