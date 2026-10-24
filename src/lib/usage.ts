import type { ContentType } from './qr/payload'

/**
 * The page's one outgoing request: an anonymous "+1" (with the code type) for
 * every download. Skipped when the browser asks not to be tracked. What the
 * person typed is never sent.
 */
export function reportUse(type: ContentType) {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.globalPrivacyControl || nav.doNotTrack === '1') return
  try {
    nav.sendBeacon('/api/used', new Blob([type], { type: 'text/plain' }))
  } catch {
    /* counting is best-effort and never affects the download */
  }
}
