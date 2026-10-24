import { describe, expect, it } from 'vitest'
import { onRequest, USE_SQL, type Context } from '../../functions/api/used'

function ctx(init: { method?: string; body?: string; origin?: string | null } = {}, withDb = true) {
  const writes: unknown[][] = []
  const pending: Promise<unknown>[] = []
  const headers = new Headers()
  if (init.origin !== null) headers.set('Origin', init.origin ?? 'https://qrcode666.app')
  const context: Context = {
    request: new Request('https://qrcode666.app/api/used', { method: init.method ?? 'POST', body: init.method === 'GET' ? undefined : (init.body ?? 'wifi'), headers }),
    env: withDb
      ? { DONATIONS_DB: { prepare: (sql: string) => ({ bind: (...v: unknown[]) => ({ run: async () => { writes.push([sql, ...v]); return {} } }) }) } }
      : {},
    waitUntil: (p) => pending.push(p),
  }
  return { context, writes, settle: () => Promise.all(pending) }
}

describe('/api/used', () => {
  it('adds one use for a known type, storing only day and type', async () => {
    const { context, writes, settle } = ctx({ body: 'wifi' })
    const res = await onRequest(context)
    await settle()
    expect(res.status).toBe(204)
    expect(writes).toEqual([[USE_SQL, new Date().toISOString().slice(0, 10), 'wifi']])
  })

  it('ignores anything that is not exactly a known type', async () => {
    for (const body of ['', 'https://secret.example.com', 'wifi; DROP TABLE usage', 'WIFI']) {
      const { context, writes, settle } = ctx({ body })
      await onRequest(context)
      await settle()
      expect(writes, body).toEqual([])
    }
  })

  it('only accepts POST from our own pages', async () => {
    const get = ctx({ method: 'GET' })
    expect((await onRequest(get.context)).status).toBe(405)
    const foreign = ctx({ origin: 'https://evil.example' })
    await onRequest(foreign.context)
    await foreign.settle()
    expect(foreign.writes).toEqual([])
  })

  it('still answers when the database is missing', async () => {
    const { context } = ctx({}, false)
    expect((await onRequest(context)).status).toBe(204)
  })
})
