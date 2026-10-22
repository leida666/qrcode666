import { ArrowUp, Play } from 'lucide-react'
import { useI18n } from '../i18n'
import { CharityLinks } from './Donate'
import { LanguageSwitch } from './Header'
import { useIntro } from './Intro'
import { Logo } from './Logo'
import { GeneratorLinks, GuideLinks } from './SeoPages'

export function Footer() {
  const { t } = useI18n()
  const { replay } = useIntro()
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 font-serif text-xl italic leading-snug text-fg/80">{t.footer.tagline}</p>
            <p className="mt-3 text-[13.5px] text-muted">{t.footer.noCookies}</p>
            <p className="mt-1.5 text-[13.5px] text-muted">
              {t.donate.footer} <CharityLinks />
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 md:items-end">
            <LanguageSwitch />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={replay}
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg"
                data-testid="replay-intro"
              >
                <Play className="size-3.5" aria-hidden />
                {t.footer.replay}
              </button>
              <a
                href="#top"
                className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-fg"
              >
                <ArrowUp className="size-3.5" aria-hidden />
                {t.footer.top}
              </a>
            </div>
          </div>
        </div>
        <nav aria-label={t.seo.ui.generators} className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{t.seo.ui.generators}</h2>
            <GeneratorLinks className="mt-4 sm:grid-cols-2 lg:grid-cols-3" />
          </div>
          <div>
            <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-subtle">{t.seo.ui.guides}</h2>
            <GuideLinks className="mt-4" />
          </div>
        </nav>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[12.5px] text-subtle sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} QRCode666 · {t.footer.license}
          </p>
          <p>{t.footer.trademark}</p>
        </div>
      </div>
    </footer>
  )
}
