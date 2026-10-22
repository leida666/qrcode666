import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { encodeQr } from '../lib/qr/encode'
import { useI18n } from '../i18n'
import { useIntro } from './Intro'

/** Real payloads. Every frame of the animation is a valid, scannable code. */
const DEMO = ['https://qrcode666.app', 'WIFI:T:WPA;S:Guest;P:free-forever;;', 'tel:+15550100666', 'Free forever. 永久免费。']
const VERSION = 3
const MARGIN = 2

function useReducedMotionPref() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

function HeroQr() {
  const { t } = useI18n()
  const { playing } = useIntro()
  const reduce = useReducedMotionPref()
  const [index, setIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  // The server renders the first frame as one compact path; the per-module
  // grid needed for the animation is only built once the page is live.
  const [live, setLive] = useState(false)
  useEffect(() => setLive(true), [])

  const matrices = useMemo(() => DEMO.map((p) => encodeQr(p, 'M', VERSION)), [])
  const current = matrices[index]
  const n = current.size

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce || playing || !visible) return
    const id = setInterval(() => {
      if (!document.hidden) setIndex((i) => (i + 1) % DEMO.length)
    }, 3200)
    return () => clearInterval(id)
  }, [reduce, playing, visible])

  const cells = []
  let staticPath = ''
  for (let r = 0; r < n && !live; r++) {
    for (let c = 0; c < n; c++) {
      if (current.data[r * n + c] === 1) staticPath += `M${c + MARGIN} ${r + MARGIN}h1v1h-1z`
    }
  }
  for (let r = 0; r < n && live; r++) {
    for (let c = 0; c < n; c++) {
      const on = current.data[r * n + c] === 1
      cells.push(
        <rect
          key={r * n + c}
          className="hm"
          x={c + MARGIN}
          y={r + MARGIN}
          width={1}
          height={1}
          data-on={on ? '' : undefined}
          style={{ ['--d' as string]: r + c }}
        />,
      )
    }
  }

  const total = n + MARGIN * 2
  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[420px]">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--accent-soft),transparent)] blur-2xl"
      />
      <figure className="rounded-[28px] border border-line bg-surface p-5 shadow-[0_1px_0_var(--line),0_30px_80px_-30px_rgb(0_0_0/0.25)] sm:p-6">
        <div className="overflow-hidden rounded-2xl bg-white">
          <svg
            viewBox={`0 0 ${total} ${total}`}
            className="block h-auto w-full"
            role="img"
            aria-label={t.hero.demoLabel}
            shapeRendering="crispEdges"
          >
            <rect width={total} height={total} fill="#fff" />
            {live ? <g fill="#0a0a0a">{cells}</g> : <path d={staticPath} fill="#0a0a0a" />}
          </svg>
        </div>
        <figcaption className="mt-4 flex items-center gap-3 px-1">
          <span className="relative flex size-2 shrink-0">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2 rounded-full bg-accent" />
          </span>
          <span className="shrink-0 text-[12px] font-medium uppercase tracking-[0.12em] text-subtle">{t.hero.encoding}</span>
          <code key={index} className="min-w-0 truncate font-mono text-[12.5px] text-fg/80" aria-live="off">
            {DEMO[index]}
          </code>
        </figcaption>
      </figure>
      <p className="mt-4 text-center text-[12.5px] text-subtle">{t.hero.scanMe}</p>
    </div>
  )
}

export function Hero() {
  const { t } = useI18n()
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] font-medium text-muted">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden />
            {t.hero.eyebrow}
          </p>
          <h1 id="hero-title" className="font-display text-[clamp(3.1rem,9vw,7.25rem)] font-semibold leading-[0.92]">
            <span className="block">{t.hero.titleA}</span>
            <span className="block text-muted">{t.hero.titleB}</span>
            <span className="block font-serif font-normal italic tracking-[-0.02em] text-accent">{t.hero.titleC}</span>
          </h1>
          <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-muted sm:text-xl">{t.hero.subtitle}</p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#generator"
              className="group inline-flex items-center gap-2 rounded-full bg-fg px-6 py-3.5 text-[15px] font-semibold text-bg shadow-[0_8px_24px_-8px_rgb(0_0_0/0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgb(0_0_0/0.45)] active:translate-y-0"
            >
              {t.hero.cta}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
            </a>
            <a
              href="#static-vs-dynamic"
              className="inline-flex items-center rounded-full px-5 py-3.5 text-[15px] font-medium text-muted transition-colors hover:text-fg"
            >
              {t.hero.secondary}
            </a>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {t.hero.points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[14.5px] font-medium text-fg/85">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <HeroQr />
      </div>
    </section>
  )
}
