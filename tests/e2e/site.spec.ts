import { expect, test } from '@playwright/test'
import { hydrated, skipIntro, pick } from './helpers'

test.describe('intro', () => {
  test('plays once per session, then gets out of the way', async ({ page }) => {
    await page.goto('/')
    await hydrated(page)
    const intro = page.getByTestId('intro')
    await expect(intro).toBeVisible()
    await expect(intro).toContainText('I fucking hate websites')
    await expect(intro).toContainText('charge you later.')
    // The real page is already rendered underneath — the intro never blocks loading.
    await expect(page.locator('#hero-title')).toBeAttached()
    await expect(intro).toContainText('So I built one that doesn’t.', { timeout: 5000 })
    await expect(intro).toContainText('No bullshit.', { timeout: 5000 })
    await expect(intro).toBeHidden({ timeout: 8000 })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.reload()
    await page.waitForLoadState('load')
    await page.waitForTimeout(400)
    await expect(intro).toHaveCount(0)
  })

  test('the whole sequence takes 5.5–7.5 seconds', async ({ page }) => {
    await page.goto('/')
    await hydrated(page)
    await expect(page.getByTestId('intro')).toBeVisible()
    const start = Date.now()
    await expect(page.getByTestId('intro')).toBeHidden({ timeout: 9000 })
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThan(5500)
    expect(elapsed).toBeLessThan(7500)
  })

  test('can be skipped with the button or Escape', async ({ page }) => {
    await page.goto('/')
    await hydrated(page)
    await page.getByTestId('intro-skip').click()
    await expect(page.getByTestId('intro')).toBeHidden({ timeout: 1500 })

    await page.evaluate(() => sessionStorage.clear())
    await page.reload()
    await expect(page.getByTestId('intro')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByTestId('intro')).toBeHidden({ timeout: 1500 })
  })

  test('can be replayed from the footer', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    await page.getByTestId('replay-intro').click()
    await expect(page.getByTestId('intro')).toBeVisible()
    await expect(page.getByTestId('intro')).toBeHidden({ timeout: 9000 })
  })

  test('does not autoplay with prefers-reduced-motion', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await hydrated(page)
    await page.waitForTimeout(500)
    await expect(page.getByTestId('intro')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await context.close()
  })

  test('Chinese mode adds a translation under the original English', async ({ page }) => {
    await page.goto('/zh/')
    await hydrated(page)
    const intro = page.getByTestId('intro')
    await expect(intro).toContainText('I fucking hate websites')
    await expect(intro).toContainText('我真他妈讨厌')
  })
})

test('the hero QR code really scans', async ({ browser }) => {
  // Reduced motion pauses the cycling, so we capture a settled frame.
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')
  await hydrated(page)
  const shot = await page.getByRole('img', { name: 'Live demo: a static QR code being generated' }).screenshot()
  const { PNG } = await import('pngjs')
  const { decodeBoth } = await import('../unit/decode-helper')
  const png = PNG.sync.read(shot)
  const decoded = decodeBoth({ data: new Uint8ClampedArray(png.data), width: png.width, height: png.height })
  expect(decoded.jsqr).toBe('https://qrcode666.app')
  await context.close()
})

test.describe('i18n', () => {
  test('switching language updates the URL, <html lang> and every label', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByTestId('lang-zh').first().click()
    await expect(page).toHaveURL(/\/zh\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('二维码。')
    await expect(page.getByText('在你的浏览器本地生成。你的数据永远不会离开你的设备。')).toBeVisible()
    await expect(page).toHaveTitle(/免费二维码生成器/)
    // The choice is remembered.
    await page.goto('/')
    await hydrated(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await page.getByTestId('lang-en').first().click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('QR Codes.')
  })

  test('the /zh/ page is pre-rendered in Chinese', async ({ request }) => {
    const html = await (await request.get('/zh/')).text()
    expect(html).toContain('<html lang="zh-CN">')
    expect(html).toContain('永久有效二维码'.slice(0, 4))
    expect(html).toContain('常见问题')
  })

  test('a Chinese browser gets Chinese automatically', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'zh-CN' })
    const page = await context.newPage()
    await page.addInitScript(() => sessionStorage.setItem('qr666-intro', '1'))
    await page.goto('/')
    await hydrated(page)
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN')
    await context.close()
  })

  test('error messages are localised', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/zh/#generator')
    await hydrated(page)
    await pick(page.getByRole('radio', { name: 'Wi-Fi' }))
    await page.getByTestId('input-ssid').fill('Home')
    await expect(page.getByText('请输入密码，或将加密方式设为“无”。')).toBeVisible()
  })
})

test.describe('theme', () => {
  test('follows the system, can be overridden and is remembered', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const page = await context.newPage()
    await page.addInitScript(() => sessionStorage.setItem('qr666-intro', '1'))
    await page.goto('/')
    await hydrated(page)
    await expect(page.locator('html')).toHaveClass(/dark/)
    const toggle = page.getByTestId('theme-toggle')
    await toggle.click() // system → light
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(lightBg).toBe('rgb(255, 255, 255)')
    await page.reload()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    await toggle.click() // light → dark
    await expect(page.locator('html')).toHaveClass(/dark/)
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(darkBg).toBe('rgb(10, 10, 10)')
    await context.close()
  })

  test('generator works in dark mode and downloads a dark-on-light code', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark', acceptDownloads: true })
    const page = await context.newPage()
    await page.addInitScript(() => sessionStorage.setItem('qr666-intro', '1'))
    await page.goto('/#generator')
    await hydrated(page)
    await page.getByTestId('input-url').fill('https://example.com/dark')
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('download-png').click()])
    const { readPng } = await import('./helpers')
    const { decodeBoth } = await import('../unit/decode-helper')
    const raster = readPng(await download.path())
    expect(raster.data[0]).toBe(255) // background stays white regardless of site theme
    expect(decodeBoth(raster).jsqr).toBe('https://example.com/dark')
    await context.close()
  })
})

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })

  test('no horizontal scrolling, and the preview sits between content and style', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    const content = await page.getByTestId('input-url').boundingBox()
    const preview = await page.getByTestId('download-png').boundingBox()
    const style = await page.getByTestId('preset-classic').boundingBox()
    expect(content!.y).toBeLessThan(preview!.y)
    expect(preview!.y).toBeLessThan(style!.y)
    expect(preview!.x + preview!.width).toBeLessThanOrEqual(375)
  })

  test('mobile menu opens and navigates', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.locator('#mobile-nav').getByRole('link', { name: 'FAQ' }).click()
    await expect(page).toHaveURL(/#faq$/)
  })

  test('intro text wraps on a phone', async ({ page }) => {
    await page.goto('/')
    await hydrated(page)
    const line = page.getByTestId('intro').locator('p').first()
    await expect(line).toBeVisible()
    const box = await line.boundingBox()
    expect(box!.width).toBeLessThanOrEqual(375)
    expect(box!.height).toBeGreaterThan(100) // several lines
  })
})

test.describe('SEO and accessibility', () => {
  test('metadata, structured data and canonical links', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    await expect(page).toHaveTitle('QRCode666 — Free QR Code Generator | No Expiration, No Subscription')
    await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href', 'https://qrcode666.app/')
    await expect(page.locator('link[hreflang="zh-CN"]')).toHaveAttribute('href', 'https://qrcode666.app/zh/')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://qrcode666.app/og-image.png')
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
    const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
    const types = ld['@graph'].map((n: { '@type': string }) => n['@type'])
    expect(types).toEqual(['Organization', 'WebSite', 'WebApplication', 'FAQPage'])
    expect(ld['@graph'][2].offers.price).toBe('0')
    expect(await page.locator('h1').count()).toBe(1)
  })

  test('robots, sitemap, manifest and 404 page exist', async ({ request }) => {
    expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://qrcode666.app/sitemap.xml')
    const sitemap = await (await request.get('/sitemap.xml')).text()
    expect(sitemap).toContain('<loc>https://qrcode666.app/zh/</loc>')
    const manifest = await (await request.get('/site.webmanifest')).json()
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3)
    const notFound = await (await request.get('/404.html')).text()
    expect(notFound).toContain('This page doesn’t exist.')
    expect(notFound).toContain('noindex')
    for (const icon of ['/favicon.ico', '/favicon.svg', '/apple-touch-icon.png', '/og-image.png']) {
      expect((await request.get(icon)).ok(), icon).toBe(true)
    }
  })

  test('skip link and keyboard-only generation', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/')
    await hydrated(page)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    // Reach the type picker by keyboard and switch type with arrow keys.
    await page.getByRole('radio', { name: 'URL' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: 'Text' })).toBeChecked()
    await page.keyboard.press('Tab')
    await expect(page.getByTestId('input-text')).toBeFocused()
    await page.keyboard.type('keyboard only')
    await expect(page.getByTestId('qr-preview')).toBeVisible()
  })

  test('form controls have accessible names', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/#generator')
    for (const name of ['Website URL', 'Quiet zone', 'Background corners']) {
      await expect(page.getByLabel(name)).toBeAttached()
    }
    await expect(page.getByRole('img', { name: 'Live demo: a static QR code being generated' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Theme:/ })).toBeVisible()
  })
})

test.describe('donations', () => {
  test('two choices, opened in a new tab without a referrer, via the anonymous counter', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/#donate')
    await hydrated(page)
    const section = page.locator('#donate')
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('Say thanks. Just not to us.')
    const links = {
      unicef: '/donate/unicef?lang=en',
      wfp: '/donate/wfp?lang=en',
    }
    for (const [id, href] of Object.entries(links)) {
      const link = section.getByTestId(`donate-${id}`)
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noopener/)
      await expect(link).toHaveAttribute('rel', /noreferrer/)
    }
    await expect(section).toContainText('not affiliated with UNICEF or WFP')
    // The footer offers the same two choices.
    await expect(page.locator('footer').getByTestId('donate-link-unicef')).toHaveAttribute('href', links.unicef)
    await expect(page.locator('footer').getByTestId('donate-link-wfp')).toHaveAttribute('href', links.wfp)
  })

  test('is localised in Chinese', async ({ page }) => {
    await skipIntro(page)
    await page.goto('/zh/#donate')
    await hydrated(page)
    const section = page.locator('#donate')
    await expect(section.getByRole('heading', { level: 2 })).toHaveText('想说谢谢？别给我们。')
    await expect(section.getByTestId('donate-unicef')).toContainText('捐给 联合国儿童基金会')
    await expect(section.getByTestId('donate-wfp')).toContainText('捐给 世界粮食计划署')
  })
})

test('Chinese pages tag donation clicks with zh', async ({ page }) => {
  await skipIntro(page)
  await page.goto('/zh/#donate')
  await hydrated(page)
  await expect(page.locator('#donate').getByTestId('donate-unicef')).toHaveAttribute('href', '/donate/unicef?lang=zh')
})

test('donation links still reach the charity where the counting Function is absent', async ({ page }) => {
  // vite preview has no Cloudflare Function, so the page's boot script redirects.
  await page.route('https://help.unicef.org/**', (route) => route.fulfill({ status: 200, body: 'unicef stub' }))
  await page.goto('/donate/unicef?lang=en')
  await expect(page).toHaveURL('https://help.unicef.org/global/donate')
  await expect(page.getByText('unicef stub')).toBeVisible()
})

test('the footer links to the public source code', async ({ page }) => {
  await skipIntro(page)
  await page.goto('/')
  await expect(page.locator('footer').getByTestId('repo-link')).toHaveAttribute('href', 'https://github.com/leida666/qrcode666')
})
