import { describe, expect, it } from 'vitest'
import { COUNT_SQL, onRequest, type Context } from '../../functions/donate/[org]'

function ctx(url: string, org: string, withDb = true, method = 'GET') {
  const writes: unknown[][] = []
  const pending: Promise<unknown>[] = []
  const context: Context = {
    request: new Request(url, { method }),
    params: { org },
    env: withDb
      ? {
          DONATIONS_DB: {
            prepare: (sql: string) => ({
              bind: (...values: unknown[]) => ({
                run: async () => {
                  writes.push([sql, ...values])
                  return {}
                },
              }),
            }),
          },
        }
      : {},
    waitUntil: (p) => pending.push(p),
  }
  return { context, writes, settle: () => Promise.all(pending) }
}

describe('/donate/:org', () => {
  it('counts one anonymous click and redirects to the official page', async () => {
    const { context, writes, settle } = ctx('https://qrcode666.app/donate/unicef?lang=zh', 'unicef')
    const res = await onRequest(context)
    await settle()
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://help.unicef.org/global/donate')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer')
    const today = new Date().toISOString().slice(0, 10)
    expect(writes).toEqual([[COUNT_SQL, today, 'unicef', 'zh']])
  })

  it('stores only organisation, day and language — never request details', async () => {
    const { context, writes, settle } = ctx('https://qrcode666.app/donate/wfp?lang=en&utm_source=x&id=123', 'wfp')
    await onRequest(context)
    await settle()
    expect(writes[0].slice(1)).toEqual([new Date().toISOString().slice(0, 10), 'wfp', 'en'])
  })

  it('normalises unknown languages to en', async () => {
    const { context, writes, settle } = ctx('https://qrcode666.app/donate/wfp?lang=<script>', 'wfp')
    await onRequest(context)
    await settle()
    expect(writes[0][3]).toBe('en')
  })

  it('sends unknown organisations back to the donate section without counting', async () => {
    const { context, writes, settle } = ctx('https://qrcode666.app/donate/evil', 'evil')
    const res = await onRequest(context)
    await settle()
    expect(res.headers.get('Location')).toBe('/#donate')
    expect(writes).toEqual([])
  })

  it('still redirects when the database is unavailable or failing', async () => {
    const noDb = ctx('https://qrcode666.app/donate/wfp', 'wfp', false)
    expect((await onRequest(noDb.context)).headers.get('Location')).toBe('https://www.wfp.org/donate')

    const failing = ctx('https://qrcode666.app/donate/unicef', 'unicef')
    failing.context.env.DONATIONS_DB!.prepare = () => ({ bind: () => ({ run: () => Promise.reject(new Error('down')) }) })
    const res = await onRequest(failing.context)
    await expect(failing.settle()).resolves.toBeDefined()
    expect(res.status).toBe(302)
  })

  it('does not count HEAD requests (link previews, prefetchers)', async () => {
    const { context, writes, settle } = ctx('https://qrcode666.app/donate/unicef', 'unicef', true, 'HEAD')
    await onRequest(context)
    await settle()
    expect(writes).toEqual([])
  })
})
