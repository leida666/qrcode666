/**
 * GET /donate/:org — counts one click for the organisation, then redirects to
 * its official donation page.
 *
 * What is stored: the UTC day, the organisation and the page language, as a
 * running total. Nothing about the person: no IP address, user agent,
 * referrer or cookie is read or kept.
 */
import { CHARITIES } from '../../src/lib/donate'

// Minimal shapes of the Cloudflare bindings we use, so this file needs no
// extra type packages.
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
  params: { org?: string | string[] }
  env: Env
  waitUntil(promise: Promise<unknown>): void
}

export const COUNT_SQL =
  'INSERT INTO donation_clicks (day, org, lang, clicks) VALUES (?1, ?2, ?3, 1) ' +
  'ON CONFLICT (day, org, lang) DO UPDATE SET clicks = clicks + 1'

const HEADERS = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }

export async function onRequest(context: Context): Promise<Response> {
  const { request, params, env } = context
  const org = String(params.org ?? '')
  const charity = CHARITIES.find((c) => c.id === org)
  if (!charity) {
    return new Response(null, { status: 302, headers: { ...HEADERS, Location: '/#donate' } })
  }

  if (request.method === 'GET' && env.DONATIONS_DB) {
    const lang = new URL(request.url).searchParams.get('lang') === 'zh' ? 'zh' : 'en'
    const day = new Date().toISOString().slice(0, 10)
    // Counting never delays or blocks the redirect.
    // Called on the context: detached, waitUntil throws "Illegal invocation".
    context.waitUntil(
      env.DONATIONS_DB.prepare(COUNT_SQL)
        .bind(day, charity.id, lang)
        .run()
        .catch(() => undefined),
    )
  }

  return new Response(null, { status: 302, headers: { ...HEADERS, Location: charity.url } })
}
