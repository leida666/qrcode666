import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Info, OctagonAlert, TriangleAlert } from 'lucide-react'

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

const fieldBase =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-[15px] text-fg placeholder:text-subtle ' +
  'transition-[border-color,box-shadow] duration-200 outline-none hover:border-fg/30 ' +
  'focus:border-accent focus:ring-4 focus:ring-accent/15'

interface FieldProps {
  label: string
  hint?: ReactNode
  optional?: string
  children: (id: string) => ReactNode
  className?: string
}

export function Field({ label, hint, optional, children, className }: FieldProps) {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-fg/80">
        {label}
        {optional && <span className="ml-1.5 font-normal text-subtle">· {optional}</span>}
      </label>
      {children(id)}
      {hint && <p className="text-[12.5px] leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(fieldBase, props.className)} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(fieldBase, 'min-h-28 resize-y leading-relaxed', props.className)} />
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: { value: T; label: ReactNode; title?: string; disabled?: boolean }[]
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

/** Radio group with segmented-control styling; fully keyboard accessible. */
export function Segmented<T extends string>({ label, value, options, onChange, className, size = 'md' }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset className={cx('min-w-0', className)}>
      <legend className="mb-1.5 text-[13px] font-medium text-fg/80">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-xl bg-sunken p-1">
        {options.map((o) => (
          <label
            key={o.value}
            title={o.title}
            className={cx(
              'relative flex flex-1 cursor-pointer select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[9px] font-medium transition-all duration-200',
              size === 'sm' ? 'px-2 py-1.5 text-[12.5px]' : 'px-2.5 py-2 text-[13px]',
              value === o.value
                ? 'bg-surface text-fg shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_var(--line)]'
                : 'text-muted hover:text-fg',
              o.disabled && 'cursor-not-allowed opacity-40 hover:text-muted',
              'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={cx('flex cursor-pointer items-center justify-between gap-4 py-1', disabled && 'cursor-not-allowed opacity-50')}>
      <span className="text-[13.5px] text-fg/85">{label}</span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-10 rounded-full bg-line-strong transition-colors duration-200 peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out-expo peer-checked:translate-x-4" />
      </span>
    </label>
  )
}

export function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  display: string
}) {
  const id = useId()
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-fg/80">
          {label}
        </label>
        <span className="font-mono text-[12px] tabular-nums text-muted">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        className="range w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` }}
        aria-valuetext={display}
      />
    </div>
  )
}

export function Notice({ severity, children }: { severity: 'error' | 'warn' | 'info'; children: ReactNode }) {
  const Icon = severity === 'error' ? OctagonAlert : severity === 'warn' ? TriangleAlert : Info
  return (
    <div
      role={severity === 'error' ? 'alert' : undefined}
      className={cx(
        'flex gap-2.5 rounded-xl px-3 py-2.5 text-[13px] leading-relaxed',
        severity === 'error' && 'bg-danger-soft text-danger',
        severity === 'warn' && 'bg-warn-soft text-warn',
        severity === 'info' && 'bg-sunken text-muted',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  id,
  invert,
}: {
  eyebrow: string
  title: ReactNode
  subtitle?: ReactNode
  id?: string
  invert?: boolean
}) {
  return (
    <div className="max-w-3xl">
      <p className={cx('mb-4 text-[13px] font-medium uppercase tracking-[0.14em]', invert ? 'text-white/50' : 'text-accent')}>
        {eyebrow}
      </p>
      <h2 id={id} className="font-display text-balance text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.02]">
        {title}
      </h2>
      {subtitle && (
        <p className={cx('mt-5 max-w-2xl text-pretty text-lg leading-relaxed', invert ? 'text-white/60' : 'text-muted')}>{subtitle}</p>
      )}
    </div>
  )
}
