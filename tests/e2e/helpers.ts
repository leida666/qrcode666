import { readFileSync } from 'node:fs'
import { expect, type Download, type Locator, type Page } from '@playwright/test'
import { PNG } from 'pngjs'
import { decodeBoth, rasterizeSvg, type Raster } from '../unit/decode-helper'

/** Marks the intro as seen for this tab so tests start on the page itself. */
export async function skipIntro(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem('qr666-intro', '1'))
}

/** Waits until React has hydrated the pre-rendered HTML. */
export async function hydrated(page: Page) {
  await page.waitForSelector('html[data-hydrated]', { state: 'attached' })
}

export async function openGenerator(page: Page, path = '/') {
  await skipIntro(page)
  await page.goto(path + '#generator')
  await hydrated(page)
  await expect(page.getByTestId('qr-empty')).toBeVisible()
}

export function readPng(file: string): Raster {
  const png = PNG.sync.read(readFileSync(file))
  return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height }
}

export async function downloadFile(page: Page, testId: 'download-png' | 'download-svg'): Promise<{ path: string; download: Download }> {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(testId).click()])
  const path = await download.path()
  return { path, download }
}

/** Downloads the PNG and decodes it with jsQR and ZXing. */
export async function downloadAndDecodePng(page: Page) {
  const { path, download } = await downloadFile(page, 'download-png')
  const raster = readPng(path)
  return { raster, filename: download.suggestedFilename(), ...decodeBoth(raster) }
}

export async function downloadAndDecodeSvg(page: Page) {
  const { path, download } = await downloadFile(page, 'download-svg')
  const svg = readFileSync(path, 'utf8')
  return { svg, filename: download.suggestedFilename(), ...decodeBoth(rasterizeSvg(svg, 900)) }
}

/** A deliberately busy logo: dark tile, bright circle, white bar. */
export function logoPngBuffer(size = 240): Buffer {
  const png = new PNG({ width: size, height: size })
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const dx = x - size / 2
      const dy = y - size / 2
      const inCircle = dx * dx + dy * dy < (size * 0.32) ** 2
      const inBar = Math.abs(dy) < size * 0.06
      const [r, g, b] = inBar ? [255, 255, 255] : inCircle ? [255, 59, 48] : [17, 17, 17]
      png.data[i] = r
      png.data[i + 1] = g
      png.data[i + 2] = b
      png.data[i + 3] = 255
    }
  }
  return PNG.sync.write(png)
}

/** Selects a visually hidden radio the way a person does: by clicking its visible label. */
export async function pick(radio: Locator) {
  await radio.locator('xpath=ancestor::label[1]').click()
  await expect(radio).toBeChecked()
}
