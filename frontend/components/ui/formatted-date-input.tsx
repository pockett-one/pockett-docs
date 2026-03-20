"use client"

import React, { useMemo, useRef } from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormattedDateInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
  className?: string
}

export function FormattedDateInput({
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  ariaLabel,
  className,
}: FormattedDateInputProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const dateDisplayFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
    []
  )

  const formattedValue = useMemo(() => {
    if (!value) return ''
    const parsed = new Date(`${value}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return ''
    return dateDisplayFormatter.format(parsed)
  }, [dateDisplayFormatter, value])

  const openDatePicker = () => {
    const input = dateInputRef.current
    if (!input || disabled) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
      return
    }
    input.focus()
    input.click()
  }

  return (
    <div className={cn("relative", className)} onClick={openDatePicker}>
      <Input
        id={id}
        type="text"
        value={formattedValue}
        readOnly
        placeholder={placeholder}
        className="h-10 bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400 pr-10 cursor-pointer"
        disabled={disabled}
      />
      <Input
        ref={dateInputRef}
        aria-label={ariaLabel ?? placeholder ?? 'Date'}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 pointer-events-none"
        disabled={disabled}
      />
      <button
        type="button"
        aria-label={ariaLabel ? `Open ${ariaLabel} calendar` : 'Open calendar'}
        onClick={(e) => {
          e.stopPropagation()
          openDatePicker()
        }}
        disabled={disabled}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
      >
        <Calendar className="h-4 w-4" />
      </button>
    </div>
  )
}
