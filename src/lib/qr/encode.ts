import { create } from 'qrcode/lib/core/qrcode.js'
import type { QRCode } from 'qrcode'

export type ECLevel = 'L' | 'M' | 'Q' | 'H'
export const EC_LEVELS: ECLevel[] = ['L', 'M', 'Q', 'H']

/** Share of codewords each level can restore (ISO/IEC 18004). */
export const EC_RECOVERY: Record<ECLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.3 }

/** Byte-mode capacity of a version 40 symbol — the absolute maximum per level. */
export const MAX_BYTES: Record<ECLevel, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 }

export interface QrMatrix {
  /** Modules per side, without quiet zone. */
  size: number
  version: number
  ecLevel: ECLevel
  /** Row-major, 1 = dark. */
  data: Uint8Array
}

export class CapacityError extends Error {
  constructor(
    public readonly bytes: number,
    public readonly ecLevel: ECLevel,
  ) {
    super(`Data too long for a QR code at level ${ecLevel}`)
    this.name = 'CapacityError'
  }
}

/**
 * Encodes `text` (UTF-8, with automatic numeric/alphanumeric/byte segmentation)
 * into a module matrix. Throws CapacityError when it cannot fit — we never
 * truncate or emit a damaged symbol.
 */
export function encodeQr(text: string, ecLevel: ECLevel, minVersion = 1): QrMatrix {
  let qr: QRCode
  try {
    qr = create(text, { errorCorrectionLevel: ecLevel })
    if (qr.version < minVersion) {
      qr = create(text, { errorCorrectionLevel: ecLevel, version: minVersion })
    }
  } catch (err) {
    if (err instanceof Error && /too big|cannot contain|amount of data/i.test(err.message)) {
      throw new CapacityError(new TextEncoder().encode(text).length, ecLevel)
    }
    throw err
  }
  const { size, data } = qr.modules
  return { size, version: qr.version, ecLevel, data: Uint8Array.from(data) }
}

export function isDark(m: QrMatrix, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= m.size || col >= m.size) return false
  return m.data[row * m.size + col] === 1
}

/** True when (row, col) falls inside one of the three 7×7 finder patterns. */
export function isFinder(size: number, row: number, col: number): boolean {
  return (row < 7 && col < 7) || (row < 7 && col >= size - 7) || (row >= size - 7 && col < 7)
}

/** Centres [row, col] of the alignment patterns for a version (ISO/IEC 18004 Annex E). */
export function alignmentCenters(version: number): [number, number][] {
  if (version === 1) return []
  const count = Math.floor(version / 7) + 2
  const size = version * 4 + 17
  const step = size === 145 ? 26 : Math.ceil((size - 13) / (2 * count - 2)) * 2
  const coords = [size - 7]
  for (let i = 1; i < count - 1; i++) coords[i] = coords[i - 1] - step
  coords.push(6)
  coords.reverse()
  const out: [number, number][] = []
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === count - 1) || (i === count - 1 && j === 0)) continue
      out.push([coords[i], coords[j]])
    }
  }
  return out
}
