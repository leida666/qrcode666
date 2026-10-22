import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { pagePath, type PageId } from '../pages'
import { en, type Dict } from './en'
import { zh } from './zh'

export type Lang = 'en' | 'zh'
export const LANGS: Lang[] = ['en', 'zh']
export const DICTS: Record<Lang, Dict> = { en, zh }
export const HTML_LANG: Record<Lang, string> = { en: 'en', zh: 'zh-CN' }

const STORAGE_KEY = 'qr666-lang'

interface I18nValue {
  lang: Lang
  t: Dict
  page: PageId
  setLang: (lang: Lang) => void
}

const I18nContext = createContext<I18nValue | null>(null)

export function langFromPath(pathname: string): Lang {
  return /^\/zh(\/|$)/.test(pathname) ? 'zh' : 'en'
}

/** Title and description for a page in a language. */
export function pageMeta(page: PageId, lang: Lang): { title: string; description: string } {
  const t = DICTS[lang]
  if (page.kind === 'type') return t.seo.types[page.type]
  if (page.kind === 'article') return t.seo.articles[page.id]
  return t.meta
}

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'en' || v === 'zh' ? v : null
  } catch {
    return null
  }
}

function applyDocument(page: PageId, lang: Lang) {
  const meta = pageMeta(page, lang)
  document.documentElement.lang = HTML_LANG[lang]
  document.title = meta.title
  document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
}

export function I18nProvider({ initialLang, page, children }: { initialLang: Lang; page: PageId; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback(
    (next: Lang, persist = true) => {
      setLangState(next)
      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, next)
        } catch {
          /* storage unavailable — the choice just won't be remembered */
        }
      }
      applyDocument(page, next)
      // Stay on the same page, in the other language.
      const path = pagePath(page, next)
      if (location.pathname !== path) history.replaceState(history.state, '', path + location.search + location.hash)
    },
    [page],
  )

  // On the default (English) home URL, honour a saved choice, else the browser language.
  useEffect(() => {
    if (initialLang !== 'en' || location.pathname !== '/') return
    const browser = navigator.languages?.[0] ?? navigator.language ?? ''
    const preferred = readStored() ?? (/^zh\b/i.test(browser) ? 'zh' : 'en')
    if (preferred === 'zh') setLang('zh', false)
  }, [initialLang, setLang])

  const value = useMemo(() => ({ lang, t: DICTS[lang], page, setLang: (l: Lang) => setLang(l) }), [lang, page, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
