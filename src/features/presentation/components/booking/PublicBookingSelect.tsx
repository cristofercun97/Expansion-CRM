import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

export type PublicBookingSelectOption = {
  value: string
  label: string
}

type Props = {
  id?: string
  label?: string
  value: string
  options: PublicBookingSelectOption[]
  onChange: (value: string) => void
  'aria-label'?: string
  'aria-invalid'?: boolean
  disabled?: boolean
}

export function PublicBookingSelect({
  id,
  label,
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  disabled,
}: Props) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex)
  const selected = options.find((option) => option.value === value) || options[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function openList() {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  function selectValue(next: string) {
    onChange(next)
    setOpen(false)
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openList()
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => Math.min(options.length - 1, current + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => Math.max(0, current - 1))
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) selectValue(option.value)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <div className="pb-select-wrap" ref={rootRef}>
      <button
        id={id}
        type="button"
        className="pb-select-trigger"
        aria-label={ariaLabel || label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-invalid={ariaInvalid || undefined}
        disabled={disabled}
        onClick={() => {
          if (open) setOpen(false)
          else openList()
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="pb-select-trigger-value">{selected?.label || ''}</span>
        <span className="pb-select-chevron" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          id={listId}
          className="pb-select-list"
          role="listbox"
          aria-label={ariaLabel || label}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  className="pb-select-option"
                  aria-selected={isSelected}
                  data-selected={isSelected ? 'true' : 'false'}
                  data-active={index === activeIndex ? 'true' : 'false'}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectValue(option.value)}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
