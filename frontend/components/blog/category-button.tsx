"use client"

import Link from 'next/link'
import { BLOG_COLORS } from '@/lib/blog-colors'
import { useState } from 'react'

interface CategoryButtonProps {
  href: string
  children: React.ReactNode
  isActive?: boolean
}

export function CategoryButton({ href, children, isActive = false }: CategoryButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  if (isActive) {
    return (
      <Link
        href={href}
        className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full font-medium transition-colors text-sm sm:text-base"
        style={{ 
          backgroundColor: isHovered ? '#ffed4e' : BLOG_COLORS.GOLD,
          color: BLOG_COLORS.DARK_BG
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-normal hover:bg-white/20 transition-all capitalize text-sm sm:text-base"
    >
      {children}
    </Link>
  )
}
