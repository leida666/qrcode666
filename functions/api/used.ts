/**
 * POST /api/used — the site's single "+1": sent for every downloaded code.
 * The body is just the code type (e.g. "wifi"). Nothing
 * about the person — IP, user agent, cookie, the code's content — is stored.
 */
import { CONTENT_TYPES } from '../../src/lib/qr/payload'

interface D1Statement {
  bind(...values: unknown[]): { run(): Promise<unknown> }
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
  waitUntil(promise: Promise<unknown>): void
}

export const USE_SQL =
  'INSERT INTO usage (day, type, uses) VALUES (?1, ?2, 1) ON CONFLICT (day, type) DO UPDATE SET uses = uses + 1'

const done = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

export async function onRequest(context: Context): Promise<Response> {
  const { request, env } = context
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } })
  // Only our own pages count; this also keeps link-following crawlers out.
  const origin = request.headers.get('Origin')
  if (origin !== null && origin !== new URL(request.url).origin) return done()

  const type = (await request.text()).trim()
  if (env.DONATIONS_DB && (CONTENT_TYPES as readonly string[]).includes(type)) {
    const day = new Date().toISOString().slice(0, 10)
    context.waitUntil(
      env.DONATIONS_DB.prepare(USE_SQL)
        .bind(day, type)
        .run()
        .catch(() => undefined),
    )
  }
  return done()
}
