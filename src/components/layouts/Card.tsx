import React from 'react'

type Props = React.PropsWithChildren<{
  as?: React.ElementType
  className?: string
}>

export function Card({
  as: Tag = 'div',
  className = '',
  children,
}: Props) {
  const base = `
    relative flex flex-col items-center justify-center overflow-visible
    text-content-0 bg-surface-1 min-w-9/10 md:min-w-3xl max-w-screen-lg
    my-6 rounded-xl border-0 p-10 shadow-none
  `
  return <Tag className={`${base} ${className}`.replace(/\s+/g, ' ')}>{children}</Tag>
}
