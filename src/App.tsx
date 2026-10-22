import { useEffect, type ReactNode } from 'react'
import { I18nProvider, useI18n, type Lang } from './i18n'
import type { PageId } from './pages'
import { Donate } from './components/Donate'
import { Education } from './components/Education'
import { Faq } from './components/Faq'
import { Footer } from './components/Footer'
import { Generator } from './components/generator/Generator'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { IntroProvider } from './components/Intro'
import { Manifesto } from './components/Manifesto'
import { ArticlePage, TypeLanding } from './components/SeoPages'

function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  // Lets tests (and curious people) know the pre-rendered page is now interactive.
  useEffect(() => {
    document.documentElement.dataset.hydrated = ''
  }, [])
  return (
    <div id="app-shell">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-fg focus:px-4 focus:py-2 focus:text-bg"
      >
        {t.skipToContent}
      </a>
      <div id="top" />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function PageContent({ page }: { page: PageId }) {
  if (page.kind === 'type') {
    return (
      <>
        <TypeLanding type={page.type} />
        <Education />
        <Donate />
      </>
    )
  }
  if (page.kind === 'article') {
    return (
      <>
        <ArticlePage id={page.id} />
        <Donate />
      </>
    )
  }
  return (
    <>
      <Hero />
      <Generator />
      <Education />
      <Manifesto />
      <Faq />
      <Donate />
    </>
  )
}

export function App({ lang, page }: { lang: Lang; page: PageId }) {
  return (
    <I18nProvider initialLang={lang} page={page}>
      <IntroProvider>
        <Shell>
          <PageContent page={page} />
        </Shell>
      </IntroProvider>
    </I18nProvider>
  )
}
