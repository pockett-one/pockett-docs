"use client"

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BLOG_COLORS } from '@/lib/blog-colors'
import { BLOG_BASE_PATH } from '@/lib/marketing/target-audience-nav'
import { useState } from 'react'

export function BackToBlogLink() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href={BLOG_BASE_PATH}
      className="group inline-flex items-center font-normal transition-colors"
      style={{ color: isHovered ? '#ffed4e' : BLOG_COLORS.GOLD }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Blog
    </Link>
  )
}
