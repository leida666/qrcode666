/**
 * Real-browser tests of the generator. Every download is decoded with jsQR and
 * ZXing to prove the file encodes exactly the expected content — not merely
 * that an image was produced.
 */
import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { downloadAndDecodePng, downloadAndDecodeSvg, downloadFile, logoPngBuffer, openGenerator, readPng, pick } from './helpers'
import { decodeBoth } from '../unit/decode-helper'

test.describe('URL', () => {
  test('a plain URL is encoded directly, with no redirect', async ({ page }) => {
    await openGenerator(page)
    await page.getByTestId('input-url').fill('https://virony.ng')
    await expect(page.getByTestId('qr-preview')).toBeVisible()
    await expect(page.getByTestId('encoded-payload')).toHaveText('https://virony.ng')

    const png = await downloadAndDecodePng(page)
    expect(png.filename).toMatch(/^qrcode666-url-\d{8}-\d{6}\.png$/)
    expect(png.raster.width).toBe(1024)
    expect(png.raster.height).toBe(1024)
    expect(png.jsqr).toBe('https://virony.ng')
    expect(png.zxing).toBe('https://virony.ng')

    // After a download, a quiet thank-you note points at the charities — not at us.
    const thanks = page.getByTestId('thanks-note')
    await expect(thanks).toBeVisible()
    await expect(thanks.getByRole('link', { name: /UNICEF/ })).toHaveAttribute('href', '/donate/unicef?lang=en')
    await expect(thanks.getByRole('link', { name: /WFP/ })).toHaveAttribute('href', '/donate/wfp?lang=en')
  })

  test('a scheme-less URL gets https:// and nothing else', async ({ page }) => {
    await openGenerator(page)
    await page.getByTestId('input-url').fill('virony.ng')
    const png = await downloadAndDecodePng(page)
    expect(png.jsqr).toBe('https://virony.ng')
  })

  test('a long URL', async ({ page }) => {
    const url = `https://example.com/${'segment/'.repeat(40)}?q=${'abc123'.repeat(40)}&utm_source=newsletter#top`
    await openGenerator(page)
    await page.getByTestId('input-url').fill(url)
    const png = await downloadAndDecodePng(page)
    expect(png.jsqr).toBe(url)
    expect(png.zxing).toBe(url)
  })

  test('SVG export is real vector and decodes', async ({ page }) => {
    await openGenerator(page)
    await page.getByTestId('input-url').fill('https://qrcode666.app/svg-test')
    const svg = await downloadAndDecodeSvg(page)
    expect(svg.filename).toMatch(/\.svg$/)
    expect(svg.svg).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<svg /)
    expect(svg.svg).toContain('<path d="M')
    expect(svg.svg).not.toContain('<image')
    expect(svg.svg).not.toMatch(/base64|data:image\/png/)
    expect(svg.jsqr).toBe('https://qrcode666.app/svg-test')
    expect(svg.zxing).toBe('https://qrcode666.app/svg-test')
  })

  for (const size of [512, 2048, 4096] as const) {
    test(`PNG at ${size}×${size}`, async ({ page }) => {
      await openGenerator(page)
      await page.getByTestId('input-url').fill('https://example.org/size')
      await pick(page.getByTestId(`png-${size}`))
      const png = await downloadAndDecodePng(page)
      expect(png.raster.width).toBe(size)
      expect(png.raster.height).toBe(size)
      expect(png.jsqr).toBe('https://example.org/size')
    })
  }
})

test.describe('text content', () => {
  const cases: Record<string, string> = {
    Chinese: '你好，世界！这是一个永久有效的二维码。',
    emoji: 'Free forever 🎉🔥 No subscriptions 🙅‍♂️',
    'special characters': `!@#$%^&*()_+-={}[]|\\:";'<>?,./~\` ©®™ € — “quotes” …`,
  }
  for (const [name, text] of Object.entries(cases)) {
    test(name, async ({ page }) => {
      await openGenerator(page)
      await pick(page.getByRole('radio', { name: 'Text' }))
      await page.getByTestId('input-text').fill(text)
      const png = await downloadAndDecodePng(page)
      expect(png.jsqr).toBe(text)
      expect(png.zxing).toBe(text)
    })
  }
})

test('Wi-Fi network with a password containing special characters', async ({ page }) => {
  await openGenerator(page)
  await pick(page.getByRole('radio', { name: 'Wi-Fi' }))
  await page.getByTestId('input-ssid').fill('Café Guest')
  await page.getByTestId('input-wifi-password').fill('p@ss;word:"42"\\')
  const expected = 'WIFI:T:WPA;S:Café Guest;P:p@ss\\;word\\:\\"42\\"\\\\;;'
  await expect(page.getByTestId('encoded-payload')).toHaveText(expected)
  const png = await downloadAndDecodePng(page)
  expect(png.jsqr).toBe(expected)
  expect(png.zxing).toBe(expected)
})

test('vCard contact', async ({ page }) => {
  await openGenerator(page)
  await pick(page.getByRole('radio', { name: 'Contact' }))
  await page.getByTestId('input-first-name').fill('Ada')
  await page.getByLabel('Last name').fill('Lovelace')
  await page.getByLabel('Company').fill('Analytical Engines, Ltd.')
  await page.getByLabel('Mobile').fill('+44 20 7946 0000')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill('ada@example.com')
  const png = await downloadAndDecodePng(page)
  expect(png.jsqr).toBe(
    [
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Lovelace;Ada;;;',
      'FN:Ada Lovelace',
      'ORG:Analytical Engines\\, Ltd.',
      'TEL;TYPE=CELL:+442079460000',
      'EMAIL;TYPE=INTERNET:ada@example.com',
      'END:VCARD',
    ].join('\r\n'),
  )
  expect(png.zxing).toBe(png.jsqr)
})

test('empty input never produces a download', async ({ page }) => {
  await openGenerator(page)
  await expect(page.getByTestId('thanks-note')).toHaveCount(0)
  await expect(page.getByTestId('download-png')).toBeDisabled()
  await expect(page.getByTestId('download-svg')).toBeDisabled()
  await page.getByTestId('input-url').fill('   ')
  await expect(page.getByTestId('qr-empty')).toBeVisible()
  await expect(page.getByTestId('download-png')).toBeDisabled()
})

test('content over capacity shows a clear error instead of a broken code', async ({ page }) => {
  await openGenerator(page)
  await pick(page.getByRole('radio', { name: 'Text' }))
  await page.getByTestId('input-text').fill('x'.repeat(2400))
  await expect(page.getByTestId('capacity-error')).toContainText('2,400 bytes')
  await expect(page.getByTestId('capacity-error')).toContainText('2,331')
  await expect(page.getByTestId('download-png')).toBeDisabled()
  // Lowering error correction to L makes it fit.
  await pick(page.getByRole('radio', { name: 'L', exact: true }))
  await expect(page.getByTestId('qr-preview')).toBeVisible()
  const png = await downloadAndDecodePng(page)
  expect(png.jsqr).toBe('x'.repeat(2400))
})

test('custom logo: raises error correction and still scans', async ({ page }) => {
  await openGenerator(page)
  await page.getByTestId('input-url').fill('https://example.com/with-logo')
  await page.getByTestId('logo-input').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: logoPngBuffer() })
  await expect(page.getByTestId('logo-remove')).toBeVisible()
  await expect(page.getByTestId('qr-stats')).toContainText('EC H')
  await expect(page.getByRole('radio', { name: 'L', exact: true })).toBeDisabled()
  // Push the size slider to its maximum.
  const slider = page.getByLabel('Logo size')
  await slider.focus()
  await page.keyboard.press('End')
  await pick(page.getByTestId('png-2048'))
  const png = await downloadAndDecodePng(page)
  expect(png.jsqr).toBe('https://example.com/with-logo')
  expect(png.zxing).toBe('https://example.com/with-logo')

  const svg = await downloadAndDecodeSvg(page)
  expect(svg.svg).toContain('<image')
  expect(svg.jsqr).toBe('https://example.com/with-logo')
})

test('every preset scans', async ({ page }) => {
  await openGenerator(page)
  await page.getByTestId('input-url').fill('https://example.com/presets')
  for (const id of ['classic', 'minimal', 'rounded', 'corporate', 'bold']) {
    await page.getByTestId(`preset-${id}`).click()
    const png = await downloadAndDecodePng(page)
    expect(png.jsqr, id).toBe('https://example.com/presets')
    expect(png.zxing, id).toBe('https://example.com/presets')
  }
})

test('transparent background exports a PNG with alpha and warns', async ({ page }) => {
  await openGenerator(page)
  await page.getByTestId('input-url').fill('https://example.com/transparent')
  await page.getByText('Transparent background').click()
  await expect(page.getByText('Transparent backgrounds only scan well')).toBeVisible()
  const { path } = await downloadFile(page, 'download-png')
  const raster = readPng(path)
  expect(raster.data[3]).toBe(0) // top-left pixel is fully transparent
  expect(decodeBoth(raster).jsqr).toBe('https://example.com/transparent')
})

test('unreadable colour contrast blocks downloads', async ({ page }) => {
  await openGenerator(page)
  await page.getByTestId('input-url').fill('https://example.com/contrast')
  await page.getByTestId('color-fg').fill('#dddddd')
  await expect(page.getByText('Contrast is too low to scan reliably')).toBeVisible()
  await expect(page.getByTestId('download-png')).toBeDisabled()
  await page.getByTestId('color-fg').fill('#1d4bff')
  await expect(page.getByTestId('download-png')).toBeEnabled()
})

test('nothing is sent over the network while generating and downloading', async ({ page }) => {
  await openGenerator(page)
  await page.waitForLoadState('networkidle')
  const requests: string[] = []
  page.on('request', (r) => requests.push(r.url()))
  await page.getByTestId('input-url').fill('https://secret.example.com/private?token=abc123')
  await page.getByTestId('logo-input').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: logoPngBuffer() })
  await downloadAndDecodePng(page)
  await downloadAndDecodeSvg(page)
  // Only browser-internal data:/blob: URLs may appear — never an http(s) request.
  expect(requests.filter((u) => /^https?:/.test(u))).toEqual([])

  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(csp).toContain("connect-src 'none'")
  // The policy is enforced: any attempt to phone home fails.
  const blocked = await page.evaluate(() =>
    fetch('/robots.txt').then(
      () => false,
      () => true,
    ),
  )
  expect(blocked).toBe(true)
})

test('PNG file on disk matches the downloaded content type', async ({ page }) => {
  await openGenerator(page)
  await page.getByTestId('input-url').fill('https://example.com/magic')
  const { path } = await downloadFile(page, 'download-png')
  expect(readFileSync(path).subarray(1, 4).toString()).toBe('PNG')
})
