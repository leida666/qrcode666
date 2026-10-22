import { Resvg } from '@resvg/resvg-js'
import jsQR from 'jsqr'
import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  HybridBinarizer,
  QRCodeReader,
  RGBLuminanceSource,
} from '@zxing/library'

export interface Raster {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** Rasterises an SVG document onto white (like printing on paper). */
export function rasterizeSvg(svg: string, width = 600): Raster {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width }, background: '#ffffff' })
  const img = resvg.render()
  return { data: new Uint8ClampedArray(img.pixels), width: img.width, height: img.height }
}

/** Flattens RGBA over a white background. */
export function flatten(r: Raster): Raster {
  const out = new Uint8ClampedArray(r.data.length)
  for (let i = 0; i < r.data.length; i += 4) {
    const a = r.data[i + 3] / 255
    out[i] = r.data[i] * a + 255 * (1 - a)
    out[i + 1] = r.data[i + 1] * a + 255 * (1 - a)
    out[i + 2] = r.data[i + 2] * a + 255 * (1 - a)
    out[i + 3] = 255
  }
  return { data: out, width: r.width, height: r.height }
}

export function decodeJsQR(r: Raster): string | null {
  const res = jsQR(r.data, r.width, r.height, { inversionAttempts: 'dontInvert' })
  return res ? res.data : null
}

/** Bilinear resample — like the same code seen from a different distance. */
export function resample(r: Raster, scale: number): Raster {
  const width = Math.max(1, Math.round(r.width * scale))
  const height = Math.max(1, Math.round(r.height * scale))
  const out = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    const sy = Math.min(r.height - 1, (y + 0.5) / scale - 0.5)
    const y0 = Math.max(0, Math.floor(sy))
    const y1 = Math.min(r.height - 1, y0 + 1)
    const fy = Math.max(0, sy - y0)
    for (let x = 0; x < width; x++) {
      const sx = Math.min(r.width - 1, (x + 0.5) / scale - 0.5)
      const x0 = Math.max(0, Math.floor(sx))
      const x1 = Math.min(r.width - 1, x0 + 1)
      const fx = Math.max(0, sx - x0)
      for (let c = 0; c < 4; c++) {
        const a = r.data[(y0 * r.width + x0) * 4 + c] * (1 - fx) + r.data[(y0 * r.width + x1) * 4 + c] * fx
        const b = r.data[(y1 * r.width + x0) * 4 + c] * (1 - fx) + r.data[(y1 * r.width + x1) * 4 + c] * fx
        out[(y * width + x) * 4 + c] = a * (1 - fy) + b * fy
      }
    }
  }
  return { data: out, width, height }
}

export function decodeZXing(r: Raster): string | null {
  // zxing-js's finder-pattern detector misses a share of perfectly clean,
  // synthetic symbols — including ones rendered by the `qrcode` library's own
  // SVG renderer — depending only on the exact pixel size. Like a phone moving
  // closer or further away, we retry at a few scales, then fall back to its
  // PURE_BARCODE path, which still runs full format/version parsing and
  // Reed–Solomon correction on our output.
  for (const scale of [1, 0.87, 0.73, 0.61]) {
    const text = zxingOnce(scale === 1 ? r : resample(r, scale), false)
    if (text !== null) return text
  }
  return zxingOnce(r, true)
}

function zxingOnce(r: Raster, pureBarcode: boolean): string | null {
  const lum = new Uint8ClampedArray(r.width * r.height)
  for (let i = 0, j = 0; i < r.data.length; i += 4, j++) {
    lum[j] = (r.data[i] * 299 + r.data[i + 1] * 587 + r.data[i + 2] * 114) / 1000
  }
  const attempt = (pure: boolean) => {
    const source = new RGBLuminanceSource(lum, r.width, r.height)
    const bitmap = new BinaryBitmap(new HybridBinarizer(source))
    const hints = new Map<DecodeHintType, unknown>([
      [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]],
      [DecodeHintType.CHARACTER_SET, 'UTF-8'],
    ])
    if (pure) hints.set(DecodeHintType.PURE_BARCODE, true)
    try {
      return new QRCodeReader().decode(bitmap, hints).getText()
    } catch {
      return null
    }
  }
  return attempt(pureBarcode)
}

/** Decodes with both libraries; returns both results so tests can require agreement. */
export function decodeBoth(r: Raster) {
  const flat = flatten(r)
  return { jsqr: decodeJsQR(flat), zxing: decodeZXing(flat) }
}
