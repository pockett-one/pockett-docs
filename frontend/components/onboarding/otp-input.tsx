'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface OTPInputProps {
    value: string
    onChange: (value: string) => void
    onComplete?: (code: string) => void
    disabled?: boolean
    loading?: boolean
    length?: number
}

const OTP_STYLES = `
    @keyframes dashBlink {
        0%, 49% { border-bottom-color: #0f172a; }
        50%, 100% { border-bottom-color: transparent; }
    }

    @keyframes dashPulseLoading {
        0%, 100% { border-bottom-color: #cbd5e1; }
        50% { border-bottom-color: #3b82f6; }
    }

    .otp-slot {
        position: relative;
        width: 44px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        border-bottom: 3.5px solid #cbd5e1;
        border-radius: 0;
        font-size: 26px;
        font-weight: 600;
        color: #0f172a;
        transition: border-bottom-color 200ms ease;
        font-variant-numeric: tabular-nums;
    }

    .otp-slot.filled {
        border-bottom-color: #0f172a;
    }

    .otp-slot.active {
        animation: dashBlink 1s step-end infinite;
    }

    .otp-slot.loading-slot {
        animation: dashPulseLoading 1.2s ease-in-out infinite;
    }

    .otp-hidden-input {
        position: absolute;
        opacity: 0;
        width: 1px;
        height: 1px;
        pointer-events: none;
    }
`

function injectOTPStyles() {
    if (typeof document === 'undefined') return
    if (!document.head.querySelector('style[data-otp-v2="true"]')) {
        const style = document.createElement('style')
        style.setAttribute('data-otp-v2', 'true')
        style.textContent = OTP_STYLES
        document.head.appendChild(style)
    }
}

export function OTPInput({
    value,
    onChange,
    onComplete,
    disabled = false,
    loading = false,
    length = 6
}: OTPInputProps) {
    const hiddenInputRef = useRef<HTMLInputElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    useEffect(() => {
        injectOTPStyles()
        // Auto-focus on mount
        const id = setTimeout(() => hiddenInputRef.current?.focus(), 50)
        return () => clearTimeout(id)
    }, [])

    const focusInput = useCallback(() => {
        hiddenInputRef.current?.focus()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled || loading) return

        let input = e.target.value.replace(/\D/g, '').slice(0, length)
        onChange(input)

        if (input.length === length && onComplete) {
            onComplete(input)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled || loading) return

        if (e.key === 'Backspace') {
            e.preventDefault()
            onChange(value.slice(0, -1))
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled || loading) return

        e.preventDefault()
        const digits = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length)
        onChange(digits)

        if (digits.length === length && onComplete) {
            onComplete(digits)
        }
    }

    const activeIndex = value.length

    return (
        <div className="relative">
            {/* Hidden input captures all keyboard/paste events */}
            <input
                ref={hiddenInputRef}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                autoComplete="one-time-code"
                maxLength={length}
                className="otp-hidden-input"
                aria-label="Enter verification code"
            />

            {/* Visual slots */}
            <div
                className="flex gap-3 justify-center cursor-text"
                onClick={focusInput}
            >
                {Array.from({ length }).map((_, index) => {
                    const digit = value[index] || ''
                    const isFilled = digit !== ''
                    const isActive = isFocused && index === activeIndex && !loading
                    const loadingDelay = loading ? `${index * 0.2}s` : undefined

                    return (
                        <div
                            key={index}
                            className={[
                                'otp-slot',
                                isFilled && 'filled',
                                isActive && 'active',
                                loading && 'loading-slot',
                            ].filter(Boolean).join(' ')}
                            style={loading ? { animationDelay: loadingDelay } : undefined}
                        >
                            {digit}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
