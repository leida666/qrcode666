import type { QrResult } from './index'
import { safeColor } from './render'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('logo failed to load'))
    img.src = src
  })
}

/**
 * Rasterises the same geometry used for the SVG onto a canvas. Modules are
 * snapped to whole pixels (any remainder goes into the quiet zone) so edges
 * stay crisp for printing.
 */
export async function renderPng(result: QrResult, px: number): Promise<Blob> {
  const { geometry: geo, options: opts } = result
  const canvas = document.createElement('canvas')
  canvas.width = px
  canvas.height = px
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  const unit = Math.max(1, Math.floor(px / geo.total))
  const offset = Math.floor((px - unit * geo.total) / 2)
  const fg = safeColor(opts.fg, '#000000')
  const bg = safeColor(opts.bg, '#ffffff')

  if (!opts.transparent) {
    ctx.fillStyle = bg
    const r = (geo.bgRadius / geo.total) * px
    ctx.beginPath()
    if (r > 0 && typeof ctx.roundRect === 'function') ctx.roundRect(0, 0, px, px, r)
    else ctx.rect(0, 0, px, px)
    ctx.fill()
  }

  ctx.save()
  ctx.translate(offset, offset)
  ctx.scale(unit, unit)
  ctx.fillStyle = fg
  if (geo.modulesPath) ctx.fill(new Path2D(geo.modulesPath))
  ctx.fill(new Path2D(geo.eyeRingPath), 'evenodd')
  ctx.fill(new Path2D(geo.eyeCenterPath))
  if (geo.plate) {
    const p = geo.plate
    ctx.fillStyle = bg
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') ctx.roundRect(p.x, p.y, p.w, p.h, p.r)
    else ctx.rect(p.x, p.y, p.w, p.h)
    ctx.fill()
  }
  ctx.restore()

  if (geo.logo && opts.logo) {
    const img = await loadImage(opts.logo.src)
    const l = geo.logo
    // The logo box already has the image's aspect ratio (measured on upload).
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, offset + l.x * unit, offset + l.y * unit, l.w * unit, l.h * unit)
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  )
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function svgBlob(svg: string): Blob {
  return new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${svg}`], { type: 'image/svg+xml' })
}
