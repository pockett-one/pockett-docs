'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface OTPInputProps {
    value: string
    onChange: (value: string) => void
    onComplete?: (code: string) => void  // Pass the complete code
    disabled?: boolean
    length?: number
}

export function OTPInput({
    value,
    onChange,
    onComplete,
    disabled = false,
    length = 6
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])
    const [otp, setOtp] = useState<string[]>(Array(length).fill(''))

    useEffect(() => {
        // Sync with parent value
        const digits = value.split('').slice(0, length)
        const newOtp = [...digits, ...Array(length - digits.length).fill('')]
        setOtp(newOtp)
    }, [value, length])

    const handleChange = (index: number, digit: string) => {
        if (disabled) return

        // Only allow single digit
        const newDigit = digit.slice(-1)

        if (newDigit && !/^\d$/.test(newDigit)) return

        const newOtp = [...otp]
        newOtp[index] = newDigit
        setOtp(newOtp)

        const newValue = newOtp.join('')
        onChange(newValue)

        // Auto-focus next input
        if (newDigit && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Call onComplete if all digits filled
        if (newValue.length === length && onComplete) {
            onComplete(newValue)
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return

        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current is empty, go to previous
                inputRefs.current[index - 1]?.focus()
            } else {
                // Clear current
                const newOtp = [...otp]
                newOtp[index] = ''
                setOtp(newOtp)
                onChange(newOtp.join(''))
            }
        }

        // Handle arrow keys
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
        if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (disabled) return

        e.preventDefault()
        const pastedData = e.clipboardData.getData('text/plain')
        const digits = pastedData.replace(/\D/g, '').slice(0, length).split('')

        const newOtp = [...digits, ...Array(length - digits.length).fill('')]
        setOtp(newOtp)
        onChange(newOtp.join(''))

        // Focus last filled input or first empty
        const focusIndex = Math.min(digits.length, length - 1)
        inputRefs.current[focusIndex]?.focus()

        // Call onComplete if all digits filled
        if (digits.length === length && onComplete) {
            onComplete(newOtp.join(''))
        }
    }

    return (
        <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
                <Input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    autoComplete="off"
                />
            ))}
        </div>
    )
}
