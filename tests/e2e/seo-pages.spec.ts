/**
 * The search landing pages: one per QR type plus the guides, in English and
 * Chinese. Each must be pre-rendered with its own metadata, hydrate cleanly,
 * and (for generators) produce a correct, scannable code for its type.
 */
import { expect, test } from '@playwright/test'
import { downloadAndDecodePng, hydrated, skipIntro } from './helpers'

const TYPE_PAGES = {
  url: '/url-qr-code-generator',
  text: '/text-qr-code-generator',
  wifi: '/wifi-qr-code-generator',
  email: '/email-qr-code-generator',
  phone: '/phone-number-qr-code-generator',
  sms: '/sms-qr-code-generator',
  vcard: '/vcard-qr-code-generator',
  location: '/location-qr-code-generator',
  event: '/calendar-event-qr-code-generator',
}
const GUIDES = ['/do-qr-codes-expire', '/qr-code-stopped-working']

test('every page is pre-rendered with its own title, canonical, hreflang and structured data', async ({ request }) => {
  const titles = new Set<string>()
  for (const path of [...Object.values(TYPE_PAGES), ...GUIDES]) {
    for (const [prefix, lang] of [
      ['', 'en'],
      ['/zh', 'zh-CN'],
    ] as const) {
      const res = await request.get(prefix + path)
      expect(res.status(), prefix + path).toBe(200)
      const html = await res.text()
      expect(html).toContain(`<html lang="${lang}">`)
      expect(html).toContain(`<link rel="canonical" href="https://qrcode666.app${prefix}${path}" />`)
      expect(html).toContain(`hreflang="en" href="https://qrcode666.app${path}"`)
      expect(html).toContain(`hreflang="zh-CN" href="https://qrcode666.app/zh${path}"`)
      const title = /<title>([^<]+)<\/title>/.exec(html)![1]
      expect(titles.has(title), `duplicate title ${title}`).toBe(false)
      titles.add(title)
      // Exactly one H1, present in the static HTML (not added by JavaScript).
      expect(html.match(/<h1[\s>]/g)?.length).toBe(1)
      const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)![1])
      const types = ld['@graph'].map((n: { '@type': string }) => n['@type'])
      expect(types).toContain('BreadcrumbList')
      expect(types).toContain(GUIDES.includes(path) ? 'Article' : 'FAQPage')
    }
  }
})

test('the sitemap lists all 24 pages with language alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text()
  expect(xml.match(/<url>/g)?.length).toBe(24)
  for (const path of Object.values(TYPE_PAGES)) {
    expect(xml).toContain(`<loc>https://qrcode666.app${path}</loc>`)
    expect(xml).toContain(`<loc>https://qrcode666.app/zh${path}</loc>`)
  }
})

for (const [type, path] of Object.entries(TYPE_PAGES)) {
  test(`${path} presets the generator to ${type} and hydrates cleanly`, async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(path)
    await hydrated(page)
    await expect(page.getByTestId(`type-${type}`)).toBeChecked()
    // Landing pages from search skip the intro.
    await expect(page.getByTestId('intro')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test('the Wi-Fi landing page makes a working Wi-Fi code', async ({ page }) => {
  await skipIntro(page)
  await page.goto('/wifi-qr-code-generator')
  await hydrated(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Wi-Fi QR Code Generator')
  await page.getByTestId('input-ssid').fill('Guest')
  await page.getByTestId('input-wifi-password').fill('welcome123')
  const png = await downloadAndDecodePng(page)
  expect(png.jsqr).toBe('WIFI:T:WPA;S:Guest;P:welcome123;;')
  expect(png.zxing).toBe('WIFI:T:WPA;S:Guest;P:welcome123;;')
})

test('switching language on a landing page stays on the same page', async ({ page }) => {
  await page.goto('/vcard-qr-code-generator')
  await hydrated(page)
  await page.getByTestId('lang-zh').first().click()
  await expect(page).toHaveURL(/\/zh\/vcard-qr-code-generator$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('名片二维码生成器')
  await expect(page).toHaveTitle(/名片二维码生成器/)
})

test('guides link back to the generator and the header reaches home sections', async ({ page }) => {
  await page.goto('/do-qr-codes-expire')
  await hydrated(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Do QR codes expire?')
  await expect(page.getByTestId('article-cta')).toHaveAttribute('href', '/#generator')
  await expect(page.locator('header nav[aria-label="Primary"]').getByRole('link', { name: 'FAQ' })).toHaveAttribute('href', '/#faq')
  await page.getByTestId('article-cta').click()
  await expect(page).toHaveURL(/\/#generator$/)
})

test('every page links to every generator and guide from the footer', async ({ page }) => {
  await skipIntro(page)
  await page.goto('/')
  const footer = page.locator('footer')
  for (const path of [...Object.values(TYPE_PAGES), ...GUIDES]) {
    await expect(footer.locator(`a[href="${path}"]`)).toHaveCount(1)
  }
})
