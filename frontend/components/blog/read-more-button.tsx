"use client"

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { BLOG_COLORS } from '@/lib/blog-colors'

const GOLD_COLOR = BLOG_COLORS.GOLD

interface ReadMoreButtonProps {
  href: string
  children: React.ReactNode
}

export function ReadMoreButton({ href, children }: ReadMoreButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 85, y: 50 })
  const buttonRef = useRef<HTMLAnchorElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setIsHovered(true)
    if (!arrowRef.current || !buttonRef.current) return
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const arrowRect = arrowRef.current.getBoundingClientRect()
    const x = ((arrowRect.left + arrowRect.width / 2 - buttonRect.left) / buttonRect.width) * 100
    const y = ((arrowRect.top + arrowRect.height / 2 - buttonRect.top) / buttonRect.height) * 100
    setMousePosition({ x, y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isHovered || !arrowRef.current || !buttonRef.current) return
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const arrowRect = arrowRef.current.getBoundingClientRect()
    const x = ((arrowRect.left + arrowRect.width / 2 - buttonRect.left) / buttonRect.width) * 100
    const y = ((arrowRect.top + arrowRect.height / 2 - buttonRect.top) / buttonRect.height) * 100
    setMousePosition({ x, y })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <Link
      ref={buttonRef}
      href={href}
      className="group relative inline-flex items-center gap-2 px-6 py-3 border-2 rounded-full overflow-hidden transition-all duration-300 hover:text-[#1a1520]"
      style={{
        borderColor: GOLD_COLOR,
        color: GOLD_COLOR
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fill effect starting from arrow */}
      <span 
        className="absolute inset-0 z-0"
        style={{
          backgroundColor: GOLD_COLOR,
          clipPath: `circle(${isHovered ? '150%' : '0%'} at ${mousePosition.x}% ${mousePosition.y}%)`,
          transition: 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      ></span>
      <span className="relative z-10 font-medium group-hover:text-[#1a1520] transition-colors duration-300">{children}</span>
      <div ref={arrowRef} className="relative z-10">
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 group-hover:text-[#1a1520] transition-all duration-300" />
      </div>
    </Link>
  )
}
