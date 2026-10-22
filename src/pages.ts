import { CONTENT_TYPES, type ContentType } from './lib/qr/payload'

/**
 * Every pre-rendered page. Besides the home page there is one landing page per
 * content type (generator preset to that type) and a few guides. Each exists
 * in English at /<slug> and in Chinese at /zh/<slug>; files are written as
 * <slug>.html, which Cloudflare Pages serves at the clean URL.
 */
export type ArticleId = 'expire' | 'stopped'
export type PageId = { kind: 'home' } | { kind: 'type'; type: ContentType } | { kind: 'article'; id: ArticleId }

export const TYPE_SLUGS: Record<ContentType, string> = {
  url: 'url-qr-code-generator',
  text: 'text-qr-code-generator',
  wifi: 'wifi-qr-code-generator',
  email: 'email-qr-code-generator',
  phone: 'phone-number-qr-code-generator',
  sms: 'sms-qr-code-generator',
  vcard: 'vcard-qr-code-generator',
  location: 'location-qr-code-generator',
  event: 'calendar-event-qr-code-generator',
}

export const ARTICLE_SLUGS: Record<ArticleId, string> = {
  expire: 'do-qr-codes-expire',
  stopped: 'qr-code-stopped-working',
}

export const ARTICLES: ArticleId[] = ['expire', 'stopped']

export const ALL_PAGES: PageId[] = [
  { kind: 'home' },
  ...CONTENT_TYPES.map((type) => ({ kind: 'type' as const, type })),
  ...ARTICLES.map((id) => ({ kind: 'article' as const, id })),
]

export function pageSlug(page: PageId): string {
  if (page.kind === 'type') return TYPE_SLUGS[page.type]
  if (page.kind === 'article') return ARTICLE_SLUGS[page.id]
  return ''
}

/** URL path for a page in a language: /, /zh/, /wifi-qr-code-generator, /zh/wifi-qr-code-generator. */
export function pagePath(page: PageId, lang: 'en' | 'zh'): string {
  const slug = pageSlug(page)
  if (lang === 'zh') return slug ? `/zh/${slug}` : '/zh/'
  return `/${slug}`
}

export function pageFromPath(pathname: string): PageId {
  const slug = pathname.replace(/^\/zh(\/|$)/, '/').replace(/^\/+|\/+$/g, '').replace(/\.html$/, '')
  if (!slug) return { kind: 'home' }
  const type = (Object.keys(TYPE_SLUGS) as ContentType[]).find((t) => TYPE_SLUGS[t] === slug)
  if (type) return { kind: 'type', type }
  const article = (Object.keys(ARTICLE_SLUGS) as ArticleId[]).find((a) => ARTICLE_SLUGS[a] === slug)
  if (article) return { kind: 'article', id: article }
  return { kind: 'home' }
}

export const samePage = (a: PageId, b: PageId) => pageSlug(a) === pageSlug(b)
