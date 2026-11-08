/**
 * GET /stats — a public, server-rendered page of anonymous usage totals
 * (downloads per day and per code type, from the /api/used "+1"s). It runs no
 * scripts and makes no requests of its own; it only reads aggregate counts.
 */
import { en } from '../src/i18n/en'
import { zh } from '../src/i18n/zh'
import { CONTENT_TYPES, type ContentType } from '../src/lib/qr/payload'

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T>(): Promise<{ results: T[] }>
}
interface D1Database {
  prepare(sql: string): D1Statement
}
export interface Env {
  DONATIONS_DB?: D1Database
}
export interface Context {
  request: Request
  env: Env
}

export interface Stats {
  total: number
  byType: { type: string; n: number }[]
  /** The last 30 UTC days, oldest first, zero-filled. */
  daily: { day: string; n: number }[]
}

const DAYS = 30

export function lastDays(today: Date, count = DAYS): string[] {
  const days: string[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i))
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

export async function loadStats(db: D1Database | undefined, today = new Date()): Promise<Stats> {
  const days = lastDays(today)
  if (!db) return { total: 0, byType: [], daily: days.map((day) => ({ day, n: 0 })) }
  const [total, byType, daily] = await Promise.all([
    db.prepare('SELECT COALESCE(SUM(uses), 0) AS n FROM usage').all<{ n: number }>(),
    db.prepare('SELECT type, SUM(uses) AS n FROM usage GROUP BY type ORDER BY n DESC').all<{ type: string; n: number }>(),
    db
      .prepare('SELECT day, SUM(uses) AS n FROM usage WHERE day >= ?1 GROUP BY day')
      .bind(days[0])
      .all<{ day: string; n: number }>(),
  ])
  const perDay = new Map(daily.results.map((r) => [r.day, Number(r.n)]))
  return {
    total: Number(total.results[0]?.n ?? 0),
    byType: byType.results.map((r) => ({ type: r.type, n: Number(r.n) })),
    daily: days.map((day) => ({ day, n: perDay.get(day) ?? 0 })),
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fmt = (n: number) => n.toLocaleString('en-US')

function typeLabel(type: string): string {
  if (!(CONTENT_TYPES as readonly string[]).includes(type)) return esc(type)
  const t = type as ContentType
  const a = en.generator.types[t]
  const b = zh.generator.types[t]
  return a === b ? esc(a) : `${esc(a)} <span class="zh">${esc(b)}</span>`
}

export function renderStats(s: Stats): string {
  const sum = (n: number) => s.daily.slice(-n).reduce((acc, d) => acc + d.n, 0)
  const maxDay = Math.max(1, ...s.daily.map((d) => d.n))
  const maxType = Math.max(1, ...s.byType.map((t) => t.n))
  const cards = [
    ['Today (UTC)', '今天', sum(1)],
    ['Last 7 days', '近 7 天', sum(7)],
    ['Last 30 days', '近 30 天', sum(30)],
  ]
    .map(([label, zhLabel, n]) => `<div class="card"><p class="label">${label} <span class="zh">${zhLabel}</span></p><p class="num">${fmt(n as number)}</p></div>`)
    .join('')
  const bars = s.daily
    .map(
      (d) =>
        `<div class="bar" title="${d.day}: ${d.n}"><span style="height:${((d.n / maxDay) * 100).toFixed(1)}%"></span><em>${d.n || ''}</em></div>`,
    )
    .join('')
  const types = s.byType.length
    ? s.byType
        .map(
          (t) =>
            `<li><span class="t">${typeLabel(t.type)}</span><span class="track"><span style="width:${((t.n / maxType) * 100).toFixed(1)}%"></span></span><span class="n">${fmt(t.n)}</span></li>`,
        )
        .join('')
    : '<li class="empty">No downloads yet. <span class="zh">暂无下载。</span></li>'

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Stats — QRCode666</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<style>
:root{--bg:#fff;--fg:#0a0a0a;--muted:#5f5f5d;--line:rgb(10 10 10/.1);--card:#f5f5f4;--accent:#1d4bff;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#f4f4f3;--muted:#a3a3a0;--line:rgb(255 255 255/.1);--card:#161616;--accent:#4d73ff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:880px;margin:0 auto;padding:48px 20px 64px}
a{color:inherit}.home{display:inline-flex;align-items:center;gap:10px;font-weight:800;text-decoration:none}.home img{width:28px;height:28px;border-radius:6px}.home b{color:var(--accent)}
h1{font-size:clamp(2rem,6vw,3.2rem);letter-spacing:-.04em;line-height:1.05;margin:40px 0 6px}
.zh{color:var(--muted);font-weight:400}
.total{font-size:clamp(3.5rem,14vw,7rem);font-weight:700;letter-spacing:-.05em;line-height:1;margin:20px 0 4px}
.sub{color:var(--muted);margin:0}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:36px 0}
.card{background:var(--card);border-radius:16px;padding:16px}.label{margin:0;font-size:13px;color:var(--muted)}.num{margin:6px 0 0;font-size:1.9rem;font-weight:700;letter-spacing:-.03em}
h2{font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);margin:44px 0 14px}
.chart{display:flex;align-items:flex-end;gap:3px;height:160px;border-bottom:1px solid var(--line)}
.bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;position:relative}
.bar span{display:block;background:var(--accent);border-radius:3px 3px 0 0;min-height:1px}
.bar em{position:absolute;bottom:100%;left:0;right:0;text-align:center;font-style:normal;font-size:10px;color:var(--muted)}
.axis{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-top:6px}
ul{list-style:none;margin:0;padding:0}li{display:grid;grid-template-columns:150px 1fr 56px;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--line)}
.track{height:8px;background:var(--card);border-radius:99px;overflow:hidden}.track span{display:block;height:100%;background:var(--accent);border-radius:99px}
.n{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}.empty{display:block;color:var(--muted)}
.note{margin-top:44px;font-size:13px;color:var(--muted);line-height:1.7}
@media (max-width:560px){.cards{gap:8px}.card{padding:12px}.label{font-size:11.5px}.num{font-size:1.4rem}li{grid-template-columns:110px 1fr 44px}}
</style>
</head>
<body>
<main>
<a class="home" href="/"><img src="/logo.svg" alt="" /><span>QRCODE<b>666</b></span></a>
<h1>QR codes made <span class="zh">已生成的二维码</span></h1>
<p class="total">${fmt(s.total)}</p>
<p class="sub">All free, all static. <span class="zh">全部免费，全部永久有效。</span></p>
<div class="cards">${cards}</div>
<h2>Last 30 days <span class="zh">近 30 天</span></h2>
<div class="chart" role="img" aria-label="Downloads per day over the last 30 days">${bars}</div>
<div class="axis"><span>${s.daily[0].day}</span><span>${s.daily[s.daily.length - 1].day}</span></div>
<h2>By type <span class="zh">按类型</span></h2>
<ul>${types}</ul>
<p class="note">Counted anonymously: each download sends a single “+1” with the code type, nothing else. Browsers with Do Not Track or Global Privacy Control aren’t counted, so the real number is a little higher. Days are in UTC.<br />
<span class="zh">匿名统计：每次下载只会发送一个“+1”和二维码类型，没有任何其他信息。开启“请勿追踪”的浏览器不计入，所以实际数字会略高一些。日期按 UTC 划分。</span></p>
<p class="note"><a href="/">← qrcode666.app</a></p>
</main>
</body>
</html>`
}

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  // Short cache so repeated visits (and crawlers) don't hit the database each time.
  'Cache-Control': 'public, max-age=60',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex',
}

export async function onRequest({ request, env }: Context): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } })
  let stats: Stats
  try {
    stats = await loadStats(env.DONATIONS_DB)
  } catch {
    stats = await loadStats(undefined)
  }
  return new Response(request.method === 'HEAD' ? null : renderStats(stats), { headers: HEADERS })
}
