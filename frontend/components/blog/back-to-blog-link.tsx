"use client"

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BLOG_COLORS } from '@/lib/blog-colors'
import { useState } from 'react'

export function BackToBlogLink() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link
      href="/blog"
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
