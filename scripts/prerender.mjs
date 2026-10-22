// Post-build step: turns the client build into fully pre-rendered static pages
// (/, /zh/, /404.html) with per-language SEO metadata, structured data and a
// Content-Security-Policy that forbids the page from making network requests.
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const dist = path.join(root, 'dist')
const SITE = (process.env.SITE_URL || 'https://qrcode666.app').replace(/\/$/, '')
const PATHS = { en: '/', zh: '/zh/' }
const OG_LOCALE = { en: 'en_US', zh: 'zh_CN' }

const { render, DICTS, HTML_LANG } = await import(pathToFileURL(path.join(root, 'node_modules', '.cache', 'ssr', 'entry-server.js')).href)
const template = readFileSync(path.join(dist, 'index.html'), 'utf8')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`

// Hash every inline script so the CSP can allow exactly those and nothing else.
const inlineScripts = [...template.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
const hashes = inlineScripts.map((s) => `'sha256-${createHash('sha256').update(s).digest('base64')}'`)
const csp = [
  "default-src 'self'",
  `script-src 'self' ${hashes.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'none'",
  "manifest-src 'self'",
  "worker-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ')
const cspTag = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`

function head(lang) {
  const t = DICTS[lang]
  const url = SITE + PATHS[lang]
  const image = `${SITE}/og-image.png`
  const tags = [
    `<title>${esc(t.meta.title)}</title>`,
    `<meta name="description" content="${esc(t.meta.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<link rel="alternate" hreflang="en" href="${SITE}/" />`,
    `<link rel="alternate" hreflang="zh-CN" href="${SITE}/zh/" />`,
    `<link rel="alternate" hreflang="x-default" href="${SITE}/" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="QRCode666" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:title" content="${esc(t.meta.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(t.meta.ogDescription)}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="QRCode666 — QR Codes. Free. Forever." />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    `<meta property="og:locale:alternate" content="${OG_LOCALE[lang === 'en' ? 'zh' : 'en']}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(t.meta.ogTitle)}" />`,
    `<meta name="twitter:description" content="${esc(t.meta.ogDescription)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    jsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          '@id': `${SITE}/#app`,
          name: 'QRCode666',
          url,
          description: t.meta.description,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript',
          inLanguage: HTML_LANG[lang],
          isAccessibleForFree: true,
          license: 'https://opensource.org/license/mit',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: Object.values(t.generator.types).join(', '),
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE}/#website`,
          name: 'QRCode666',
          url: `${SITE}/`,
          inLanguage: ['en', 'zh-CN'],
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          inLanguage: HTML_LANG[lang],
          mainEntity: t.faq.items.map((i) => ({
            '@type': 'Question',
            name: i.q,
            acceptedAnswer: { '@type': 'Answer', text: i.a },
          })),
        },
      ],
    }),
  ]
  return tags.join('\n    ')
}

// Performance: inline the (small) stylesheet so it doesn't block first paint
// on a separate request, and preload the two fonts visible above the fold.
const cssLink = template.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/)
const inlineCss = cssLink ? `<style>${readFileSync(path.join(dist, cssLink[1]), 'utf8')}</style>` : ''
const assets = readdirSync(path.join(dist, 'assets'))
const preloads = [/^inter-latin-wght-normal-.*\.woff2$/, /^instrument-serif-latin-400-italic-.*\.woff2$/]
  .map((re) => assets.find((f) => re.test(f)))
  .filter(Boolean)
  .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ')

function page(lang) {
  let html = template
    .replace('<html lang="en">', `<html lang="${HTML_LANG[lang]}">`)
    .replace('<!--csp-->', cspTag)
    .replace(/<!--head:start-->[\s\S]*?<!--head:end-->/, `${head(lang)}\n    ${preloads}`)
    .replace('<!--app-html-->', render(lang))
  if (cssLink) html = html.replace(cssLink[0], inlineCss)
  return html
}

writeFileSync(path.join(dist, 'index.html'), page('en'))
mkdirSync(path.join(dist, 'zh'), { recursive: true })
writeFileSync(path.join(dist, 'zh', 'index.html'), page('zh'))

// 404: static, bilingual, no application JavaScript needed.
const css = (template.match(/<link rel="stylesheet"[^>]*>/) || [''])[0]
const bootScript = (template.match(/<script>[\s\S]*?<\/script>/) || [''])[0]
const en = DICTS.en.notFound
const zh = DICTS.zh.notFound
const notFound = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    ${cspTag}
    <title>404 — QRCode666</title>
    <meta name="robots" content="noindex" />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    ${css}
    ${bootScript}
  </head>
  <body>
    <main class="mx-auto flex min-h-svh max-w-3xl flex-col justify-center px-6 py-24">
      <a href="/" class="mb-16 inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.03em]">
        <img src="/logo.svg" alt="" width="22" height="22" class="dark:invert" />QRCode<span class="text-accent">666</span>
      </a>
      <p class="font-mono text-sm text-accent">404</p>
      <h1 class="font-display mt-4 text-[clamp(2.4rem,7vw,4.5rem)] font-semibold leading-[1.02]">${esc(en.title)}</h1>
      <p class="mt-6 text-lg text-muted">${esc(en.body)}</p>
      <p class="mt-10 text-[clamp(1.4rem,3.5vw,2rem)] font-semibold" lang="zh-CN">${esc(zh.title)}</p>
      <p class="mt-3 text-muted" lang="zh-CN">${esc(zh.body)}</p>
      <div class="mt-12 flex flex-wrap gap-3">
        <a href="/#generator" class="rounded-full bg-fg px-6 py-3 font-semibold text-bg">${esc(en.home)}</a>
        <a href="/zh/#generator" lang="zh-CN" class="rounded-full border border-line-strong px-6 py-3 font-semibold">${esc(zh.home)}</a>
      </div>
    </main>
  </body>
</html>
`
writeFileSync(path.join(dist, '404.html'), notFound)

const today = new Date().toISOString().slice(0, 10)
const alternates = `<xhtml:link rel="alternate" hreflang="en" href="${SITE}/"/><xhtml:link rel="alternate" hreflang="zh-CN" href="${SITE}/zh/"/><xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/"/>`
writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod>${alternates}</url>
  <url><loc>${SITE}/zh/</loc><lastmod>${today}</lastmod>${alternates}</url>
</urlset>
`,
)
writeFileSync(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`)

rmSync(path.join(root, 'node_modules', '.cache', 'ssr'), { recursive: true, force: true })
console.log(`prerendered /, /zh/, /404.html for ${SITE} (${hashes.length} inline script hash)`)
