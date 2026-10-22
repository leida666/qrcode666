import { Fragment, createContext, useCallback, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useI18n } from '../i18n'
import { Mark } from './Logo'

const SEEN_KEY = 'qr666-intro'
/**
 * Scene start times (ms). Each scene fully reveals, then holds briefly so it
 * can be read. The overlay lifts at T.done and is gone 0.7 s later (≈ 6.3 s total).
 */
const T = { built: 2700, brand: 4300, done: 5600 }
const LEAVE_MS = 700

interface IntroValue {
  playing: boolean
  replay: () => void
}
const IntroContext = createContext<IntroValue>({ playing: false, replay: () => {} })
export const useIntro = () => useContext(IntroContext)

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
}

/**
 * Plays the intro once per browser session (never automatically when the user
 * prefers reduced motion). The boot script in index.html makes the same call
 * before first paint and shows a black cover so the page never flashes.
 * The page underneath is fully rendered and interactive-ready the whole time.
 */
export function IntroProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    if (document.documentElement.dataset.intro === 'pending') setPlaying(true)
  }, [])

  const finish = useCallback(() => {
    markSeen()
    setPlaying(false)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [])

  const replay = useCallback(() => {
    setRunId((n) => n + 1)
    setPlaying(true)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Keep the page behind the intro out of the tab order and accessibility tree.
  useEffect(() => {
    const shell = document.getElementById('app-shell')
    if (!shell) return
    if (playing) shell.setAttribute('inert', '')
    else shell.removeAttribute('inert')
  }, [playing])

  return (
    <IntroContext.Provider value={{ playing, replay }}>
      {children}
      {playing && <IntroOverlay key={runId} onDone={finish} />}
    </IntroContext.Provider>
  )
}

type Word = { text: string; tone?: 'serif' | 'accent' }

const LINE_1: Word[] = [
  { text: 'I' },
  { text: 'fucking', tone: 'serif' },
  { text: 'hate' },
  { text: 'websites' },
  { text: 'that' },
  { text: 'don’t' },
  { text: 'tell' },
  { text: 'you' },
  { text: 'upfront' },
  { text: 'they’re' },
  { text: 'going' },
  { text: 'to' },
  { text: 'charge you later.', tone: 'accent' },
]
const LINE_2: Word[] = [{ text: 'So' }, { text: 'I' }, { text: 'built' }, { text: 'one' }, { text: 'that' }, { text: 'doesn’t.', tone: 'serif' }]

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` })

function Words({ words, start, step }: { words: Word[]; start: number; step: number }) {
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span
          style={delay(start + i * step)}
          className={
            'intro-word ' +
            (w.tone === 'serif'
              ? 'font-serif font-normal italic tracking-[-0.02em]'
              : w.tone === 'accent'
                ? 'text-[#5b7cff]'
                : '')
          }
        >
          {w.text}
          </span>
        </Fragment>
      ))}
    </>
  )
}

const LINE_CLASS =
  'font-display text-balance text-[clamp(2.1rem,6.6vw,6.2rem)] font-semibold leading-[1.04] tracking-[-0.045em]'

function IntroOverlay({ onDone }: { onDone: () => void }) {
  const { t, lang } = useI18n()
  const [scene, setScene] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const skipRef = useRef<HTMLButtonElement>(null)
  const doneRef = useRef(false)

  const leave = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setLeaving(true)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(onDone, reduce ? 0 : LEAVE_MS)
  }, [onDone])

  useEffect(() => {
    // Our own black layer now covers the screen; drop the boot cover.
    delete document.documentElement.dataset.intro
    skipRef.current?.focus({ preventScroll: true })
    const timers = [setTimeout(() => setScene(1), T.built), setTimeout(() => setScene(2), T.brand), setTimeout(leave, T.done)]
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') leave()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('keydown', onKey)
    }
  }, [leave])

  const sceneClass = (i: number) =>
    'absolute inset-x-0 top-1/2 -translate-y-1/2 ' + (scene > i ? 'intro-scene-out' : scene === i ? '' : 'hidden')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.intro.label}
      data-testid="intro"
      className={
        'fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#050505] px-6 text-white ' +
        (leaving ? 'intro-leave' : '')
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgb(29_75_255/0.10),transparent_70%)]"
      />
      <div className="relative w-full max-w-[min(92vw,1180px)]">
        <div className={sceneClass(0)}>
          <p lang="en" className={LINE_CLASS}>
            <Words words={LINE_1} start={150} step={75} />
          </p>
          {lang === 'zh' && t.intro.translation && (
            <p className="intro-fade mt-6 text-[clamp(0.95rem,1.8vw,1.25rem)] text-white/55" style={delay(1300)}>
              {t.intro.translation}
            </p>
          )}
        </div>

        {scene >= 1 && (
          <div className={sceneClass(1)}>
            <p lang="en" className={LINE_CLASS}>
              <Words words={LINE_2} start={0} step={70} />
            </p>
            {lang === 'zh' && t.intro.built && (
              <p className="intro-fade mt-6 text-[clamp(0.95rem,1.8vw,1.25rem)] text-white/55" style={delay(400)}>
                {t.intro.built}
              </p>
            )}
          </div>
        )}

        {scene >= 2 && (
          <div className={sceneClass(2) + ' flex flex-col items-center text-center'}>
            <span className="intro-rise mb-6" style={delay(0)}>
              <Mark className="size-14 text-white sm:size-16" accent="#4d73ff" />
            </span>
            <p className="intro-rise font-display text-[clamp(3rem,11vw,9.5rem)] font-semibold leading-[0.95] tracking-[-0.055em]" style={delay(100)}>
              QRCode<span className="text-[#5b7cff]">666</span>.
            </p>
            <p lang="en" className="intro-rise mt-5 text-[clamp(1rem,2.2vw,1.6rem)] font-medium tracking-[-0.02em] text-white/70" style={delay(200)}>
              Free forever. No subscriptions. No bullshit.
            </p>
            {lang === 'zh' && (
              <p className="intro-rise mt-2 text-[clamp(0.9rem,1.6vw,1.1rem)] text-white/45" style={delay(280)}>
                {t.intro.tagline}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        ref={skipRef}
        type="button"
        onClick={leave}
        className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-white/70 transition-colors hover:border-white/40 hover:text-white focus-visible:outline-white"
        data-testid="intro-skip"
      >
        {t.intro.skip}
        <kbd className="ml-2 hidden font-mono text-[11px] text-white/35 sm:inline">Esc</kbd>
      </button>
    </div>
  )
}
