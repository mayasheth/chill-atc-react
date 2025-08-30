// src/components/Selector.tsx
import { useState, useRef, useEffect } from 'react'

export type Option = { label: string | React.ReactNode; value: string }

type OptionStateKey = 'idle' | 'highlighted' | 'selected' | 'selectedHighlighted'
export type OptionStateClasses = Record<OptionStateKey, string>

export const DEFAULT_OPTION_STATE_CLASSES: OptionStateClasses = {
  // 1) open, not selected, no hover/highlight; also define what "highlight" would be when hovered/keyboarded while closed
  idle: [
    '[--opt-bg:theme(colors.surface.2)] [--opt-fg:theme(colors.content.1)]',
    '[--opt-bg-h:theme(colors.surface.3)] [--opt-fg-h:theme(colors.content.1)]',
  ].join(' '),

  // 3) open, not selected, hover/highlight  
  highlighted: [
    '[--opt-bg:theme(colors.surface.3)] [--opt-fg:theme(colors.content.1)]',
  ].join(' '),

  // 2) open, selected, not hover/highlight and highlight vars
  //    and define its highlight vars
  selected: [
    '[--opt-bg:theme(colors.content.3)] [--opt-fg:theme(colors.surface.1)]',
    '[--opt-bg-h:theme(colors.content.2)] [--opt-fg-h:theme(colors.surface.1)]',
  ].join(' '),

  // 4) open, selected + hover/highlight 
  selectedHighlighted: [
    '[--opt-bg:theme(colors.content.2)] [--opt-fg:theme(colors.surface.1)]',
  ].join(' '),
}

// Overrideable class slots
export type SelectorClasses = {
  root?: string
  control?: string
  button?: string
  caret?: string
  menu?: string
  optionBase?: string   // <— new: structural classes for each option row
  optionContent?: string
}

// Simple class joiner (avoid a new dep)
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

type Props = {
  id?: string
  label?: string
  value?: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  renderOption?: (opt: Option) => React.ReactNode
  renderValue?: (opt: Option | undefined) => React.ReactNode
  classes?: SelectorClasses
  optionStateClasses?: Partial<OptionStateClasses> // <— allow overrides per state
  getOptionClassName?: (
    opt: Option,
    state: { isSelected: boolean; isHighlighted: boolean; index: number }
  ) => string
  autoSelectFirst?: boolean // default true (preserves current behavior)
}

export function Selector({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  required = false,
  renderOption,
  renderValue,
  classes,
  optionStateClasses,
  getOptionClassName,
  autoSelectFirst = true,
}: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const selectRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<(HTMLDivElement | null)[]>([])
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Default to first option if no value is provided and options exist
  const effectiveValue = value || (options.length > 0 ? options[0].value : '');
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Optionally select first option on mount/update
  useEffect(() => {
    if (autoSelectFirst && !value && options.length > 0) {
      onChange(options[0].value)
    }
  }, [autoSelectFirst, value, options, onChange])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) {
        if ((event.key === 'Enter' || event.key === ' ') && document.activeElement === buttonRef.current) {
          event.preventDefault()
          setIsOpen(true)
          setHighlightedIndex(Math.max(0, options.findIndex(o => o.value === effectiveValue)))
        }
        return
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setHighlightedIndex(prev => (prev < options.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          event.preventDefault()
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (highlightedIndex >= 0) handleOptionClick(options[highlightedIndex])
          break
        case 'Escape':
          setIsOpen(false)
          setHighlightedIndex(-1)
          buttonRef.current?.focus()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, highlightedIndex, options, effectiveValue])

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex])

  const handleToggle = () => {
    if (disabled) return
    setIsOpen(open => !open)
    if (!isOpen) {
      const idx = options.findIndex(opt => opt.value === effectiveValue)
      setHighlightedIndex(idx >= 0 ? idx : 0)
    } else {
      setHighlightedIndex(-1)
    }
  }

  const handleOptionClick = (option: Option) => {
    onChange(option.value)
    setIsOpen(false)
    setHighlightedIndex(-1)
    buttonRef.current?.focus()
  }

  const mergeStates = (ov?: Partial<OptionStateClasses>): OptionStateClasses => ({
    idle:                [DEFAULT_OPTION_STATE_CLASSES.idle,                ov?.idle].filter(Boolean).join(' '),
    highlighted:         [DEFAULT_OPTION_STATE_CLASSES.highlighted,         ov?.highlighted].filter(Boolean).join(' '),
    selected:            [DEFAULT_OPTION_STATE_CLASSES.selected,            ov?.selected].filter(Boolean).join(' '),
    selectedHighlighted: [DEFAULT_OPTION_STATE_CLASSES.selectedHighlighted, ov?.selectedHighlighted].filter(Boolean).join(' '),
  })
  const merged = mergeStates(optionStateClasses)

  const selectedOption = options.find(opt => opt.value === effectiveValue)
  const display = renderValue ? renderValue(selectedOption) : (selectedOption?.label ?? placeholder)

  const baseButton = [
    'inline-flex h-11 min-h-[44px] min-w-48 items-center justify-center rounded-md',
    'px-4 text-base font-base font-light',
    'transition-all duration-400 focus-outline touch-manipulation select-none',
  ].join(' ')

  return (
    <label htmlFor={id} className="flex flex-col gap-2">
      {label && <p className="text-center text-sm font-base text-content-2">{label}</p>}

      <div
        ref={selectRef}
        className={cx('selectize-wrapper relative z-10 overflow-visible w-full', classes?.root)}
      >
        <div className={cx('selectize-control single flex justify-center w-full', classes?.control)}>
          {/* Button */}
          <button
            ref={buttonRef}
            type="button"
            id={id}
            className={cx(
              baseButton,
              'w-full relative',
              // consume current vars
              merged.idle, 'bg-[var(--opt-bg)] text-[var(--opt-fg)]',
              // when CLOSED, hovering should switch to highlight vars
              !isOpen && 'hover:[--opt-bg:var(--opt-bg-h)] hover:[--opt-fg:var(--opt-fg-h)] hover:[--code:var(--code-h)] hover:[--city:var(--city-h)] hover:[--ch:var(--ch-h)]',
              // keep shape tweak when open
              isOpen && 'rounded-b-none focus-visible:rounded-b-md',
              // optional: belt & suspenders to lock look while open
              'aria-expanded:!hover:[--opt-bg:var(--opt-bg)] aria-expanded:!hover:[--opt-fg:var(--opt-fg)]',
              classes?.button
            )}
            onClick={handleToggle}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-required={required}
            aria-label={label || 'Select an option'}
          >
            <span className={cx('flex-1 truncate px-2', classes?.optionContent)}>{display}</span>

            {/* caret */}
            <div
              className={cx(
                'ml-2 w-0 h-0 border-l-[5px] border-r-[5px] border-l-transparent border-r-transparent transition-transform duration-200 flex-shrink-0',
                isOpen ? 'border-b-[6px] border-b-primary' : 'border-b-[6px] border-b-primary rotate-180',
                classes?.caret
              )}
            />
          </button>

          {/* Menu */}
          {isOpen && (
            <div
              className={cx(
                'selectize-dropdown absolute top-full left-0 right-0 z-[9999] bg-surface-2 text-content-2 rounded-t-0 rounded-b-md w-full overflow-visible',
                classes?.menu
              )}
            >
              <div
                className="selectize-dropdown-content overflow-y-auto overscroll-contain"
                style={{ maxHeight: 'min(calc(2.5rem * 6), 60vh)' }}
                role="listbox"
                aria-label="Options"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === effectiveValue
                  const isHighlighted = index === highlightedIndex

                  // precedence: selected+highlighted > selected > highlighted > idle
                  const stateClass =
                    isSelected && isHighlighted
                      ? merged.selectedHighlighted
                      : isSelected
                      ? merged.selected
                      : isHighlighted
                      ? merged.highlighted
                      : merged.idle

                  const content = renderOption ? renderOption(option) : option.label

                  const optionClass = cx(
                    // structure
                    'option py-2 px-4 cursor-pointer text-base font-base font-light min-h-[44px] flex',
                    'items-center justify-center text-center touch-manipulation',
                    'border-content-2 first:border-t-2 last:border-b-0 last:rounded-b-md',
                    classes?.optionBase,
                    // consume current vars for bg/fg
                    'bg-[var(--opt-bg)] text-[var(--opt-fg)]',
                    // per-state variable assignments come from stateClass
                    stateClass,
                    getOptionClassName?.(option, { isSelected, isHighlighted, index }),
                    'transition-all duration-400'
                    )

                  return (
                    <div
                      key={option.value}
                      ref={(el: HTMLDivElement | null) => {
                        optionsRef.current[index] = el; // no return => type is void
                      }}
                      className={optionClass}
                      role="option"
                      aria-selected={isSelected}
                      // data- attributes let you style via Tailwind arbitrary variants or CSS
                      data-selected={isSelected ? 'true' : 'false'}
                      data-highlighted={isHighlighted ? 'true' : 'false'}
                      onClick={() => handleOptionClick(option)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onTouchStart={() => setHighlightedIndex(index)}
                    >
                      {typeof content === 'string' ? (
                        <span className={cx('truncate', classes?.optionContent)}>{content}</span>
                      ) : (
                        <div className={cx('w-full', classes?.optionContent)}>{content}</div>
                      )}
                    </div>
                  )
                })}

                {options.length === 0 && (
                  <div className="py-4 px-4 text-fg text-center italic text-base min-h-[44px] flex items-center justify-center">
                    No options available!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </label>
  )
}