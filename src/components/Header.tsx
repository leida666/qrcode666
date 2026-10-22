import { useEffect, useState } from 'react'
import { Menu, Monitor, Moon, Sun, X } from 'lucide-react'
import { useI18n, type Lang } from '../i18n'
import { pagePath } from '../pages'
import { useTheme, type ThemePref } from '../lib/theme'
import { Logo } from './Logo'
import { cx } from './ui'

const NEXT_THEME: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' }

export function LanguageSwitch({ className }: { className?: string }) {
  const { lang, setLang, t, page } = useI18n()
  const options: { value: Lang; label: string }[] = [
    { value: 'en', label: 'EN' },
    { value: 'zh', label: '中文' },
  ]
  return (
    <div role="group" aria-label={t.nav.language} className={cx('flex rounded-full border border-line p-0.5', className)}>
      {options.map((o) => (
        <a
          key={o.value}
          href={pagePath(page, o.value)}
          hrefLang={o.value === 'zh' ? 'zh-CN' : 'en'}
          lang={o.value === 'zh' ? 'zh-CN' : 'en'}
          aria-current={lang === o.value ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault()
            setLang(o.value)
          }}
          className={cx(
            'rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors',
            lang === o.value ? 'bg-fg text-bg' : 'text-muted hover:text-fg',
          )}
          data-testid={`lang-${o.value}`}
        >
          {o.label}
        </a>
      ))}
    </div>
  )
}

export function ThemeToggle() {
  const { t } = useI18n()
  const [pref, setPref] = useTheme()
  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor
  const label = pref === 'light' ? t.nav.themeLight : pref === 'dark' ? t.nav.themeDark : t.nav.themeSystem
  return (
    <button
      type="button"
      onClick={() => setPref(NEXT_THEME[pref])}
      className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-sunken hover:text-fg"
      aria-label={`${t.nav.theme}: ${label}`}
      title={`${t.nav.theme}: ${label}`}
      data-testid="theme-toggle"
      data-theme-pref={pref}
    >
      <Icon className="size-[18px]" aria-hidden />
    </button>
  )
}

export function Header() {
  const { t, lang, page } = useI18n()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  // Sections that aren't on this page link to the home page.
  const home = pagePath({ kind: 'home' }, lang)
  const here = (id: string) =>
    page.kind === 'home' || (page.kind === 'type' && (id === 'generator' || id === 'static-vs-dynamic')) ? `#${id}` : `${home}#${id}`
  const links = [
    { href: here('generator'), label: t.nav.generator },
    { href: here('static-vs-dynamic'), label: t.nav.static },
    { href: here('manifesto'), label: t.nav.manifesto },
    { href: here('faq'), label: t.nav.faq },
  ]

  return (
    <header
      className={cx(
        'sticky top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300',
        scrolled || open ? 'border-b border-line bg-bg/80 backdrop-blur-xl backdrop-saturate-150' : 'border-b border-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href={page.kind === 'home' ? '#top' : home} className="rounded-lg" aria-label="QRCode666">
          <Logo />
        </a>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="rounded-full px-3 py-2 text-[14px] font-medium text-muted transition-colors hover:text-fg">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-1.5">
          <LanguageSwitch className="hidden sm:flex" />
          <ThemeToggle />
          <a
            href="#generator"
            className="ml-1 hidden rounded-full bg-fg px-4 py-2 text-[13.5px] font-semibold text-bg transition-transform hover:-translate-y-px md:inline-flex"
          >
            {t.nav.create}
          </a>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full text-fg hover:bg-sunken md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? t.nav.close : t.nav.menu}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line px-4 pb-5 pt-2 md:hidden">
          <ul className="grid">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-line py-3.5 text-[17px] font-medium tracking-[-0.01em]"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <LanguageSwitch className="mt-4 w-fit sm:hidden" />
        </nav>
      )}
    </header>
  )
}
