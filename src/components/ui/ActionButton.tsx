import React from 'react'
import { SpotifyIcon } from '@/assets/icons/other'
type Variant = 'spotify' | 'icon'

type ActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: React.ReactNode
  icon?: React.ReactNode
  variant?: Variant
  className?: string
  /** For icon-only usage; ignored when label is visible */
  ariaLabel?: string
}

const VARIANT_CLASSES: Record<Variant, string> = {
  spotify:
    'bg-surface-2 border-none text-content-1 hover:bg-surface-3 active:bg-surface-3 focus-outline active:scale-[0.95]',
  icon:
    'bg-transparent text-content-3 hover:text-content-2 active:text-content-1 focus-outline active:scale-[0.85]'
}

export function ActionButton({
  label,
  icon,
  variant = 'icon',
  className = '',
  type = 'button',
  ariaLabel,
  ...rest
}: ActionButtonProps) {
  const base =
    [
      // Layout & size: ensure ≥44px target
      'inline-flex items-center justify-center gap-2 rounded-md h-11 min-size-mobile',
      // Interaction & feedback
      'soft-transition select-none touch-manipulation',
      // Disabled behavior
      'disabled:text-surface-3 disabled:cursor-not-allowed disabled:pointer-events-none',
      'disabled:pointer-events-none disabled:active:scale-100',
      // iOS tap highlight removal (requires global CSS var or utility)
      '[&]:[--tap-highlight:transparent]',
    ].join(' ')

  const styles = VARIANT_CLASSES[variant]

  const isIconOnly = typeof label === 'string' ? label.trim() === '' : !label

  return (
    <button
      type={type}
      className={`${base} ${styles} ${className}`}
      aria-label={isIconOnly ? ariaLabel : undefined}
      aria-disabled={rest.disabled ? true : undefined}
      {...rest}
      // Inline style fallback for iOS tap highlight:
      style={{ WebkitTapHighlightColor: 'transparent', ...(rest.style || {}) }}
    >
      {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
      {/* If you sometimes want icon-only, pass label="" and ariaLabel="Log in" */}
      {label && <span className="truncate">{label}</span>}
    </button>
  )
}

/* Login button */
type LoginButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function LoginButton({ className = '', ...rest }: LoginButtonProps) {
  return (
    <ActionButton
      // Visible text label (so no ariaLabel needed)
      label={<span className="font-semibold">log in</span>}
      icon={<SpotifyIcon className="w-5 h-5 text-spotify-green" aria-hidden="true" />}
      variant="spotify"
      className={[ className, 'px-4'].join(' ')}
      {...rest}
    />
  )
}