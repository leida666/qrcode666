import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { DICTS, HTML_LANG, pageMeta, type Lang } from './i18n'
import { ALL_PAGES, pagePath, pageSlug, type PageId } from './pages'
import { CONTENT_TYPES } from './lib/qr/payload'
import { REPO_URL } from './site'

export { ALL_PAGES, CONTENT_TYPES, DICTS, HTML_LANG, pageMeta, pagePath, pageSlug, REPO_URL }

/** Pre-renders a page in a language at build time (static HTML, no server at runtime). */
export function render(lang: Lang, page: PageId): string {
  return renderToString(
    <StrictMode>
      <App lang={lang} page={page} />
    </StrictMode>,
  )
}
