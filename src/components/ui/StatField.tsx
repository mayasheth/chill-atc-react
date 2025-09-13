// src/components/ui/StatField.tsx

type Props = {
  value: string | number | null
  unit: string
  label: string
  active?: boolean
  align?: 'start' | 'center' | 'end'   // horizontal alignment of control + label
  widthClass?: string                  // width for the CONTROL area (e.g., 'w-[320px]')
  className?: string                   // wrapper classes if needed
  labelClass?: string                  // extra class for the label
}

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ')

export function StatField({
  value,
  unit,
  label,
  active = true,
  align = 'center',
  widthClass = '',
  className,
  labelClass,
}: Props) {
  const justify =
    align === 'start' ? 'sm:justify-items-start'
    : align === 'end' ? 'sm:justify-items-end'
    : 'sm:justify-items-center'

  return (
    <div className={cx('grid justify-items-center', justify, className)}>
      {/* fixed-height label → all labels align */}
      <div className={cx("pb-2", widthClass)}>
        <span className={cx('text-base font-base font-semibold text-content-3', labelClass)}> {label} </span>
      </div>

      {/* value  */}
      <div className={cx("", widthClass)}>
        <span className="text-2xl tracking-wide font-mono font-bold text-content-1"> {value} </span>
      </div>

      {/* unit  */}
      <div className={cx("leading-0", widthClass)}>
        <span className="text-sm font-base text-content-2"> {unit} </span>
      </div>
    </div>
  )
}
