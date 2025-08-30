// src/components/layouts/ControlRow.tsx
import type { ReactNode } from 'react'

type Props = {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  /** Relative weights; any numbers are ok (e.g., 1,1,1 or 2,1,3). */
  leftBasis?: number
  centerBasis?: number
  rightBasis?: number
  className?: string
}

const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(' ')

/** Normalize three numbers to spans that sum to 12. */
const basisToClass = (basis: number, totalBasis: number) =>  ['basis-', basis, '/', totalBasis].join('')

export function ControlRow({
  left,
  center,
  right,
  leftBasis = 1,
  centerBasis = 1,
  rightBasis = 1,
  className,
}: Props) {

  const sumBasis = leftBasis + centerBasis + rightBasis
  const leftClass = basisToClass(leftBasis, sumBasis)
  const centerClass = basisToClass(centerBasis, sumBasis)
  const rightClass = basisToClass(rightBasis, sumBasis)

  return (
    <div className={cx('mt-6 flex flex-col gap-3 sm:flex-row sm:gap-12 sm:flex-grow', className)}>
      <div className={cx('flex justify-center', leftClass)}>{left}</div>
      <div className={cx('flex justify-center', centerClass)}>{center}</div>
      <div className={cx('flex justify-center', rightClass)}>{right}</div>
    </div>
  )
}
