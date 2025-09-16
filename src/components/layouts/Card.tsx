import React from 'react'

// components/layouts/Card.tsx
type Props = React.PropsWithChildren<{
  as?: React.ElementType;
  className?: string;
  variant?: "default" | "row";
}>;

export function Card({
  as: Tag = "div",
  className = "",
  variant = "default",
  children,
}: Props) {
  const base = `
    relative flex flex-col items-center justify-items-center overflow-visible
    text-content-0 bg-surface-1 rounded-xl border-0 p-6 shadow-none
  `
  const size =
    variant === "default"
      ? "my-0 min-w-9/10 md:min-w-3xl max-w-screen-lg"
      : // row variant: let the parent grid/flex control sizing
        "my-0 w-full min-w-0 md:min-w-0 max-w-none h-full";

  return <Tag className={`${base} ${size} ${className}`.replace(/\s+/g, " ")}>{children}</Tag>;
}
