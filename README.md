# QRCode666

**Free QR Codes. Forever. No Subscriptions. No Bullshit.**

QRCode666 ([qrcode666.app](https://qrcode666.app)) is a free, static QR code generator. Every code it makes
stores your content directly — the URL, text, Wi-Fi details or contact card — so it never depends
on this website, a redirect service or a subscription. Codes are generated in your browser; nothing
you type is sent anywhere.

- 100% free: no paywall, no account, no credit card, no generation or download limits, no watermark
- Static codes only: `https://virony.ng` is encoded as `https://virony.ng`, never as a short link to us
- No tracking: no analytics, no cookies, no scan counting. The page's Content-Security-Policy
  (`connect-src 'none'`) makes it impossible for the page to send network requests at all
- Essentially a static site: the generator never touches a server. The only server-side code is a tiny
  Cloudflare Pages Function that anonymously counts donation-link clicks. No accounts, no API keys, no paid services

> A QR code has no expiry date. A code that holds a link is only as reliable as that link,
> though: if the website goes offline, the code still scans but leads nowhere. That part is
> up to whoever owns the link.

## Features

| Area | What's included |
| --- | --- |
| Content types | URL, plain text, Wi-Fi, email (`mailto:`), phone (`tel:`), SMS (`SMSTO:`), contact (vCard 3.0), location (`geo:` or a Google Maps link), calendar event (iCalendar `VEVENT`) |
| Encoding | UTF-8 with automatic numeric/alphanumeric/byte segmentation, L/M/Q/H error correction, a clear error when content exceeds QR capacity (never a truncated or damaged code) |
| Styling | Foreground/background colours, transparent background, 4 module styles (square, fluid, soft, dots), 3 corner-marker styles, quiet zone 0–10, background corner rounding, presets (Classic, Minimal, Rounded, Corporate, Bold) |
| Logo | PNG/JPG/SVG/WebP/GIF, read locally. Forces error correction Q/H, caps the size per level (Q 22 %, H 26 % of width) and clears the modules behind it |
| Scannability guard | Contrast check (downloads blocked below 2:1, warning below 3.5:1), warnings for inverted colours, transparent backgrounds, small quiet zones, dense codes and logos without a clear plate |
| Export | PNG at 512, 1024, 2048 or 4096 px (modules snapped to whole pixels); true vector SVG (paths, no embedded bitmap) |
| Transparency | "What's inside" shows the exact encoded text |
| Brand intro | ~6 s cinematic intro: once per browser session, skippable (button or Esc), replayable from the footer, never autoplays with `prefers-reduced-motion` |
| Say thanks (not to us) | A "Donate" section lets visitors choose UNICEF or the World Food Programme; the same two links appear in the footer and in a quiet note after each download. Links pass through `/donate/<org>`, which counts the click anonymously (organisation, day, page language — nothing about the person) and redirects to the official donation page. No tracking parameters, no referrer, no affiliation, and QRCode666 receives nothing |
| i18n | English (default) and Simplified Chinese, pre-rendered at `/` and `/zh/`, auto-detected from the browser language, switchable and remembered |
| Themes | Light, dark and system, applied before first paint |
| SEO | Per-language title/description, canonical + hreflang, Open Graph and X cards, JSON-LD (`WebApplication`, `WebSite`, `FAQPage`), sitemap, robots.txt, web manifest, favicons, 404 page |

## Quick start

Requires Node.js 20+ (developed on Node 24).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:5173. Other scripts:

| Command | What it does |
| --- | --- |
| `npm run build` | Production build into `dist/`: client bundle, then server-side pre-rendering of `/`, `/zh/` and `/404.html`, plus `sitemap.xml` and `robots.txt` |
| `npm run preview` | Serves `dist/` at http://localhost:4173 |
| `npm test` | Unit and decode tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright) against the production build; run `npm run build` first |
| `npm run typecheck` | TypeScript check |
| `npm run assets` | Regenerates favicons, app icons, `avatar.png` and `og-image.png` from the brand mark |

Set `SITE_URL` when building for a different domain, e.g. `SITE_URL=https://example.com npm run build`.
It's used in canonical URLs, Open Graph tags, the sitemap and robots.txt.

## Testing

QR output is verified by **decoding it**, not by checking that an image exists.

- **Unit + decode tests** (`tests/unit`, 110 tests): payload builders (Wi-Fi escaping, vCard, iCalendar,
  `mailto:`, `tel:`, `SMSTO:`, `geo:`), URL handling, contrast checks capacity limits, and the donation counter Function (counts only org/day/language, ignores HEAD and unknown orgs, still redirects if the database is down). Every QR case is
  rendered to SVG, rasterised with resvg and decoded by two independent decoders, **jsQR** and **ZXing**.
  The decoded text must match the payload exactly. Covered: plain, long and query-heavy URLs, Chinese,
  Japanese/Korean, emoji, special characters, multi-line text, Wi-Fi with reserved characters, vCard, all
  types at the capacity limit (exactly `MAX_BYTES` fits, one more byte is rejected), every module × eye ×
  EC combination at several pixel sizes, every preset, transparent backgrounds, tiny quiet zones, and logos
  at the maximum allowed size.
- **End-to-end tests** (`tests/e2e`, 43 tests, Playwright with the locally installed Microsoft Edge):
  real downloads of PNG (all four sizes) and SVG, each decoded with jsQR + ZXing; URL, long URL, Chinese,
  emoji, special characters, Wi-Fi, vCard; empty input; over-capacity input; logo upload; presets;
  transparent PNG alpha; low-contrast blocking; **no network requests** while typing, uploading and
  downloading (and the CSP really blocks `fetch`); intro playback, timing, skip, Esc, replay and
  reduced motion; language switching, auto-detection and localised errors; light/dark themes; mobile
  layout with no horizontal scroll; keyboard-only use; SEO metadata, sitemap, manifest and 404; and the
  hero animation really scanning; donation links (via the counter, per language, new tab, no referrer) and the post-download thank-you note.

To run the e2e tests with Playwright's bundled Chromium instead of Edge:

```bash
npx playwright install chromium
```

```bash
PW_CHANNEL=chromium npm run test:e2e
```

### Lighthouse (production build, local)

| Page | Performance | Accessibility | Best practices | SEO |
| --- | --- | --- | --- | --- |
| `/` mobile | 98 | 100 | 100 | 92* |
| `/` desktop | 100 | 100 | 100 | 92* |
| `/zh/` mobile | 98 | 100 | 100 | 92* |

Mobile: FCP 1.4 s, LCP 2.2 s, TBT 10 ms, CLS 0.

\* The only failing SEO audit is `robots-txt`: Lighthouse fetches `robots.txt` from inside the page, and our
privacy CSP (`connect-src 'none'`) blocks that fetch. Search engines request `robots.txt` directly, and it is
served normally. We keep the CSP: it is what guarantees your input can't leave the page.

## Deploying to Cloudflare Pages

The site is static files plus one small Pages Function (`functions/donate/[org].ts`) that anonymously
counts donation-link clicks in a Cloudflare D1 database. Everything is on Cloudflare's free plan.

### First deployment (once)

Log in to Cloudflare. This opens your browser:

```bash
npx wrangler login
```

Create the database. Copy the `database_id` it prints into `wrangler.toml`, replacing the zeros:

```bash
npx wrangler d1 create qrcode666-donations
```

Create the table:

```bash
npx wrangler d1 migrations apply qrcode666-donations --remote
```

Build and publish (the first run creates the Pages project; choose `main` as the production branch):

```bash
npm run build
```

```bash
npx wrangler pages deploy
```

Wrangler reads `wrangler.toml` (output directory `dist`, the D1 binding) and uploads the Function along with
the static files. You get a `https://qrcode666.pages.dev` URL.

### Later deployments

Run `npm run build`, then `npx wrangler pages deploy`. Or connect the GitHub repository in the dashboard
(**Workers & Pages → qrcode666 → Settings → Builds**) with build command `npm run build`, output directory
`dist` and environment variable `NODE_VERSION` = `22`. Every push to `main` then deploys automatically.

### What Cloudflare Pages picks up automatically

- `dist/_headers` sets security headers (`X-Frame-Options`, `frame-ancestors`, `Referrer-Policy: no-referrer`,
  `Permissions-Policy`, HSTS) and long-term caching for hashed assets. The main CSP is in a `<meta>` tag in each
  page, so it also holds on other hosts.
- `dist/404.html` is served, with status 404, for unknown paths.
- `/zh/` is served from `dist/zh/index.html`.

Leave **Web Analytics** off in the Pages project, so "no trackers" stays literally true.

### Donation click counts

Each click on a donation link goes to `/donate/<org>?lang=<en|zh>`. The Function adds one to a running total
for *(UTC day, organisation, page language)* and redirects to the official page. It doesn't read or store an IP
address, user agent, referrer or cookie. `HEAD` requests (link previews) and unknown organisations aren't counted.

To see the numbers, open **Storage & Databases → D1 → qrcode666-donations → Console** in the dashboard and run:

```sql
SELECT org, lang, SUM(clicks) AS clicks FROM donation_clicks GROUP BY org, lang;
```

Or, per day:

```sql
SELECT * FROM donation_clicks ORDER BY day DESC, org, lang;
```

From the command line:

```bash
npx wrangler d1 execute qrcode666-donations --remote --command "SELECT org, SUM(clicks) FROM donation_clicks GROUP BY org"
```

To try it locally, apply the migration with `--local`, then run `npx wrangler pages dev dist`.

On a host other than Cloudflare Pages, the Function won't run. Either remove `donateHref` in
`src/lib/donate.ts` and link straight to the charities, or add equivalent redirects.

## Custom domain (qrcode666.app)

1. In the Pages project: **Custom domains → Set up a custom domain**, then enter `qrcode666.app`.
2. If the domain's DNS is on Cloudflare, the record is created for you. Otherwise, add a `CNAME` from
   `qrcode666.app` (or `www`) to `<project>.pages.dev` at your DNS provider. Many providers need `ALIAS`/`ANAME`
   or CNAME flattening at the apex; moving DNS to Cloudflare avoids that.
3. Add `www.qrcode666.app` as a second custom domain, and redirect it to the apex with a Redirect Rule
   (**Rules → Redirect Rules**: `www.qrcode666.app/*` → `https://qrcode666.app/${1}`, 301).
4. `.app` is on the HSTS preload list, so HTTPS is mandatory. Cloudflare issues the certificate automatically
   within minutes.
5. If you use a different domain, build with `SITE_URL=https://your.domain`.

## Technical decisions

- **React 19 + TypeScript + Vite + Tailwind CSS 4**, as requested, with **build-time pre-rendering**:
  `scripts/prerender.mjs` renders the real app to static HTML per language, then the client hydrates it. Content,
  headings and the hero are in the HTML before any JavaScript runs, which is good for SEO and LCP. No server is
  needed at runtime.
- **No Motion / Framer Motion.** It was the initial choice, but measured at roughly 30 KB gzipped for what is a
  single fixed ~6-second timeline. The intro uses CSS keyframes (staggered blur/opacity/translate reveals)
  driven by React state, which costs about 1 KB. A black cover is painted by an inline boot script before first paint,
  so nothing flashes, while the real page renders underneath: the intro never delays page load.
- **QR encoding: [`qrcode`](https://github.com/soldair/node-qrcode)** (widely used, ISO/IEC 18004 compliant), imported from
  its core encoder only. We take its module matrix and draw it ourselves (`src/lib/qr/render.ts`) as resolution-
  independent geometry. The same paths become the SVG file, the on-page preview and (via `Path2D`) the PNG, so all
  three are identical. No third-party QR API is involved.
- **Scannability is measured, not assumed.** The decode suite is how limits were chosen. Logos first broke at
  36 % width (Q) and 40 % (H), so the caps are 22 % and 26 %. Rounded *alignment* patterns measurably hurt ZXing's
  detector, so the "rounded" style keeps alignment patterns square. Gapped styles (dots, soft) keep finder and
  alignment patterns solid for the same reason.
- **Privacy is enforced by the browser.** The CSP's `connect-src 'none'` blocks every `fetch`/XHR/beacon, and the
  e2e suite asserts that no request is made. Fonts and scripts are self-hosted, and inline scripts are allowed by
  hash only.
- **Honest copy.** The FAQ explains that a static code cannot be edited, that a link inside a code can still die,
  that Cloudflare processes standard request data such as IP addresses, and exactly what is kept in browser storage
  (language, theme and an "intro seen" flag; no user content).
- **Donations go to UNICEF or WFP, never to us.** Both URLs (`src/lib/donate.ts`) are the official entry points linked from each organisation's own site; UNICEF routes visitors to their national office. Re-check them now and then.
- **Counting clicks without tracking people.** Instead of an analytics script (which would break the CSP and the "no trackers" promise), clicks go through a same-site redirect whose Function increments an aggregate row in D1 — `INSERT … ON CONFLICT DO UPDATE` keeps concurrent clicks exact. The FAQ and the donate section say so explicitly.
- **No history feature in v1.** It's optional in the brief; leaving it out means the app stores no user content at all.

## Project structure

```
src/
  lib/qr/        payload builders, encoder, renderer, quality checks, PNG/SVG export
  components/    intro, header, hero, generator (content, style, preview), education, manifesto, FAQ, footer
  i18n/          en.ts, zh.ts (typed: zh must match en's shape)
  brand/mark.ts  the logo, shared by the app and the asset script
functions/       Cloudflare Pages Function: /donate/<org> anonymous click counter + redirect
migrations/      D1 schema for the click counts
scripts/         prerender.mjs (build), generate-assets.mjs (icons, OG image)
public/          favicons, icons, OG image, web manifest, _headers
tests/unit       Vitest: payloads + decode round-trips
tests/e2e        Playwright: real browser, real downloads, decoded
```

## The logo

Three QR finder patterns, each extended into a "6", placed where a QR code's finders sit, with one blue accent
module in the data corner: QR + 666 in one mark. Variants are in `public/`: `logo.svg`, `favicon.svg` (adapts to
light/dark browser UI), `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, and `avatar.png`
(1024 px, for GitHub and social profiles).

## Ideas for later

- Optional local history (off by default, stored only in the browser, one-click clear)
- Batch generation from CSV, exported as a ZIP
- More content types: crypto payment URIs, app-store smart links, EPC/SEPA payment codes, MeCard
- Eye colour separate from module colour; gradient fills with automatic contrast checks
- PDF / EPS export for print shops; print-size calculator (minimum size for a scan distance)
- "Test scan" with the device camera, decoded locally
- More languages (Traditional Chinese, Japanese, Spanish, …)
- Offline support (service worker / installable PWA)

## 中文简介

QRCode666 是一个完全免费的静态二维码生成器：无需注册、无需订阅、永不过期。二维码在浏览器本地生成，
内容直接编码进二维码，不经过任何跳转服务，也不会把你的输入发送到任何服务器。支持网址、文本、Wi-Fi、
邮件、电话、短信、名片、位置和日程，可导出 PNG（最高 4096×4096）与真正的矢量 SVG。

本地开发：`npm install`，然后 `npm run dev`。构建：`npm run build`（输出目录 `dist`）。
部署到 Cloudflare Pages 的步骤见上文 “Deploying to Cloudflare Pages”。

## License

[MIT](LICENSE). The QR codes you generate are yours. Use them for anything, commercially or not.

“QR Code” is a registered trademark of DENSO WAVE INCORPORATED.
