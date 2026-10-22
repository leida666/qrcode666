import { markBody, MARK_SIZE } from '../brand/mark'
import { cx } from './ui'

const PAD = 1.5
const SIDE = MARK_SIZE + PAD * 2
const BODY = markBody()

/**
 * The brand mark — a real QR code for https://qrcode666.app — always on its
 * own white tile, so it reads (and scans) the same in light and dark themes.
 */
export function Mark({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SIDE} ${SIDE}`}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width={SIDE} height={SIDE} rx={3} fill="#ffffff" />
      <g transform={`translate(${PAD} ${PAD})`} dangerouslySetInnerHTML={{ __html: BODY }} />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <Mark className="size-[30px] rounded-[7px] ring-1 ring-line" />
      <span className="text-[16px] font-extrabold tracking-[-0.01em]">
        QRCODE<span className="text-accent">666</span>
      </span>
    </span>
  )
}
