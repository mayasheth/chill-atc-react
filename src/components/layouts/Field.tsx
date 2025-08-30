// src/components/layouts/Field.tsx
import type { ReactNode } from 'react'

type Props = {
  label?: string
  children: ReactNode
  align?: 'start' | 'center' | 'end'   // horizontal alignment of control + label
  widthClass?: string                  // width for the CONTROL area (e.g., 'w-[320px]')
  className?: string                   // wrapper classes if needed
  labelClass?: string                  // extra class for the label
  controlClass?: string                // extra class for the control container
}

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ')

export function Field({
  label,
  children,
  align = 'center',
  widthClass = '',
  className,
  labelClass,
  controlClass,
}: Props) {
  const justify =
    align === 'start' ? 'sm:justify-items-start'
    : align === 'end' ? 'sm:justify-items-end'
    : 'sm:justify-items-center'

  return (
    <div className={cx('grid gap-4 justify-items-center', justify, className)}>
      {/* fixed-height label row → all labels align */}
      <div className="h-4">
        {label ? (
          <span className={cx('text-sm font-base leading-4 text-content-2', labelClass)}>{label}</span>
        ) : null}
      </div>

      {/* content row */}
      <div className={cx('w-full', widthClass, controlClass)}>
        {children}
      </div>
    </div>
  )
}
