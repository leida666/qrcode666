import { MARK_ACCENT, MARK_PATH, MARK_SIZE } from '../brand/mark'
import { cx } from './ui'

export function Mark({ className, accent = 'var(--accent)' }: { className?: string; accent?: string }) {
  const a = MARK_ACCENT
  return (
    <svg viewBox={`0 0 ${MARK_SIZE} ${MARK_SIZE}`} className={className} aria-hidden="true" shapeRendering="crispEdges">
      <path d={MARK_PATH} fill="currentColor" />
      <rect x={a.x} y={a.y} width={a.w} height={a.h} fill={accent} />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Mark className="size-[26px]" />
      <span className="text-[17px] font-semibold tracking-[-0.03em]">
        QRCode<span className="text-accent">666</span>
      </span>
    </span>
  )
}
