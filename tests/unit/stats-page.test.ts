import { describe, expect, it } from 'vitest'
import { lastDays, loadStats, onRequest, renderStats } from '../../functions/stats'

type Row = Record<string, unknown>
function fakeDb(rows: { day: string; type: string; uses: number }[]) {
  return {
    prepare(sql: string) {
      let arg: unknown
      const stmt = {
        bind(...v: unknown[]) {
          arg = v[0]
          return stmt
        },
        async all<T>() {
          let results: Row[]
          if (sql.includes('COALESCE')) results = [{ n: rows.reduce((a, r) => a + r.uses, 0) }]
          else if (sql.includes('GROUP BY type')) {
            const m = new Map<string, number>()
            for (const r of rows) m.set(r.type, (m.get(r.type) ?? 0) + r.uses)
            results = [...m].map(([type, n]) => ({ type, n })).sort((a, b) => b.n - a.n)
          } else {
            const m = new Map<string, number>()
            for (const r of rows) if (r.day >= String(arg)) m.set(r.day, (m.get(r.day) ?? 0) + r.uses)
            results = [...m].map(([day, n]) => ({ day, n }))
          }
          return { results: results as T[] }
        },
      }
      return stmt
    },
  }
}

const today = new Date('2026-11-07T12:00:00Z')

describe('/stats', () => {
  it('lists the last 30 UTC days, oldest first', () => {
    const days = lastDays(today)
    expect(days).toHaveLength(30)
    expect(days[0]).toBe('2026-10-09')
    expect(days[29]).toBe('2026-11-07')
  })

  it('totals, zero-fills days and ranks types', async () => {
    const db = fakeDb([
      { day: '2026-10-26', type: 'wifi', uses: 1 },
      { day: '2026-10-27', type: 'url', uses: 1 },
      { day: '2026-11-07', type: 'url', uses: 3 },
      { day: '2026-09-01', type: 'vcard', uses: 2 }, // older than 30 days: in the total only
    ])
    const s = await loadStats(db, today)
    expect(s.total).toBe(7)
    expect(s.byType).toEqual([
      { type: 'url', n: 4 },
      { type: 'vcard', n: 2 },
      { type: 'wifi', n: 1 },
    ])
    expect(s.daily).toHaveLength(30)
    expect(s.daily.at(-1)).toEqual({ day: '2026-11-07', n: 3 })
    expect(s.daily.find((d) => d.day === '2026-10-26')?.n).toBe(1)
    expect(s.daily.filter((d) => d.n === 0)).toHaveLength(27)

    const html = renderStats(s)
    expect(html).toContain('<p class="total">7</p>')
    expect(html).toContain('Wi-Fi')
    expect(html).toContain('Contact <span class="zh">名片</span>')
    expect(html).toContain('<meta name="robots" content="noindex" />')
    expect(html).not.toContain('<script')
  })

  it('shows an empty state without a database', async () => {
    const s = await loadStats(undefined, today)
    expect(s.total).toBe(0)
    expect(renderStats(s)).toContain('No downloads yet.')
  })

  it('escapes unexpected type names', () => {
    const html = renderStats({ total: 1, byType: [{ type: '<img src=x>', n: 1 }], daily: lastDays(today).map((day) => ({ day, n: 0 })) })
    expect(html).toContain('&lt;img src=x&gt;')
    expect(html).not.toContain('<img src=x>')
  })

  it('serves HTML with a strict policy, and still renders if the database fails', async () => {
    const broken = { prepare: () => ({ bind() { return this }, all: () => Promise.reject(new Error('down')) }) }
    const res = await onRequest({ request: new Request('https://qrcode666.app/stats'), env: { DONATIONS_DB: broken as never } })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/html')
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'none'")
    expect(await res.text()).toContain('No downloads yet.')
    const post = await onRequest({ request: new Request('https://qrcode666.app/stats', { method: 'POST' }), env: {} })
    expect(post.status).toBe(405)
  })
})
