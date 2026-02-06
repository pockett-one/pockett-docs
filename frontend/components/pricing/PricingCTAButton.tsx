"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface PricingCTAButtonProps {
  href: string
  children: React.ReactNode
  variant: "black" | "gray"
}

export function PricingCTAButton({ href, children, variant }: PricingCTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 85, y: 50 })
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
    updateMousePosition()
  }

  const handleMouseMove = () => {
    if (isHovered) updateMousePosition()
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const updateMousePosition = () => {
    if (!arrowRef.current || !buttonRef.current) return
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const arrowRect = arrowRef.current.getBoundingClientRect()
    const x = ((arrowRect.left + arrowRect.width / 2 - buttonRect.left) / buttonRect.width) * 100
    const y = ((arrowRect.top + arrowRect.height / 2 - buttonRect.top) / buttonRect.height) * 100
    setMousePosition({ x, y })
  }

  const isBlack = variant === "black"
  // Pro: default full black, hover spreading fill = gray, text → black
  // Others: default full gray, hover spreading fill = black, text → white
  const baseBg = isBlack ? "bg-gray-900" : "bg-gray-200"
  const baseText = isBlack ? "text-white" : "text-gray-900"
  const spreadFill = isBlack ? "bg-gray-200" : "bg-gray-900"
  const hoverText = isBlack ? "group-hover:text-gray-900" : "group-hover:text-white"

  return (
    <Link
      ref={buttonRef}
      href={href}
      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border border-gray-300 ${baseBg} py-2.5 font-semibold text-sm transition-all duration-300 ${baseText} ${hoverText}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Spreading fill from arrow: Pro = gray on hover, others = black on hover */}
      <span
        className={`absolute inset-0 z-0 ${spreadFill}`}
        style={{
          clipPath: `circle(${isHovered ? "150%" : "0%"} at ${mousePosition.x}% ${mousePosition.y}%)`,
          transition: "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      {/* Text with vertical flip on hover in/out */}
      <div className="relative z-10 flex items-center justify-center [perspective:120px]">
        <div className="relative flex min-h-[1.25rem] items-center justify-center transition-transform duration-300 ease-out [transform-style:preserve-3d] group-hover:[transform:rotateX(180deg)]">
          <span
            className={`inline-block [backface-visibility:hidden] ${baseText}`}
            style={{ transform: "rotateX(0deg)" }}
          >
            {children}
          </span>
          <span
            className={`absolute inset-0 flex items-center justify-center [backface-visibility:hidden] ${hoverText}`}
            style={{ transform: "rotateX(180deg)" }}
            aria-hidden
          >
            {children}
          </span>
        </div>
      </div>
      <div ref={arrowRef} className={`relative z-10 flex shrink-0 ${hoverText}`}>
        <ArrowRight className="h-4 w-4 transition-all duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  )
}
