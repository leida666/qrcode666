import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App'
import { DICTS, HTML_LANG, type Lang } from './i18n'

export { DICTS, HTML_LANG }

/** Pre-renders the full page for a language at build time (static HTML, no server at runtime). */
export function render(lang: Lang): string {
  return renderToString(
    <StrictMode>
      <App lang={lang} />
    </StrictMode>,
  )
}
