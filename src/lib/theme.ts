import { useCallback, useEffect, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'
const KEY = 'qr666-theme'

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && systemDark())
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a0a0a' : '#ffffff')
}

/** Theme preference; the inline boot script in index.html applies it before first paint. */
export function useTheme() {
  // Always 'system' on the server and the first client render to keep hydration stable.
  const [pref, setPref] = useState<ThemePref>('system')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored === 'light' || stored === 'dark') setPref(stored)
    } catch {
      /* ignore */
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    apply(pref)
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref, loaded])

  const set = useCallback((next: ThemePref) => {
    setPref(next)
    try {
      if (next === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  return [pref, set] as const
}
