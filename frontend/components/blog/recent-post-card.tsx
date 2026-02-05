"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { BLOG_COLORS } from '@/lib/blog-colors'

interface RecentPostCardProps {
  post: {
    slug: string
    title: string
    date: string
    excerpt: string
    category: string
    readingTime?: number
  }
}

const GOLD_COLOR = BLOG_COLORS.GOLD

export function RecentPostCard({ post }: RecentPostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [avatarPosition, setAvatarPosition] = useState({ x: 15, y: 50 })
  const innerTileRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Update avatar position for paint spread effect
  useEffect(() => {
    const updatePosition = () => {
      if (!avatarRef.current || !innerTileRef.current) return
      const tileRect = innerTileRef.current.getBoundingClientRect()
      const avatarRect = avatarRef.current.getBoundingClientRect()
      const x = ((avatarRect.left + avatarRect.width / 2 - tileRect.left) / tileRect.width) * 100
      const y = ((avatarRect.top + avatarRect.height / 2 - tileRect.top) / tileRect.height) * 100
      setAvatarPosition({ x, y })
    }
    
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  const handleMouseEnter = () => {
    setIsHovered(true)
    // Update position on hover to ensure accuracy
    if (avatarRef.current && innerTileRef.current) {
      const tileRect = innerTileRef.current.getBoundingClientRect()
      const avatarRect = avatarRef.current.getBoundingClientRect()
      const x = ((avatarRect.left + avatarRect.width / 2 - tileRect.left) / tileRect.width) * 100
      const y = ((avatarRect.top + avatarRect.height / 2 - tileRect.top) / tileRect.height) * 100
      setAvatarPosition({ x, y })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return (
    <Link
      href={`/blog/${post.category}/${post.slug}`}
      className="block group"
    >
      <div
        ref={innerTileRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="rounded-lg p-4 relative overflow-hidden h-[140px] flex flex-col transition-all duration-300"
        style={{
          backgroundColor: GOLD_COLOR,
          borderColor: GOLD_COLOR,
          borderWidth: '0.5px',
          borderStyle: 'solid'
        }}
      >
        {/* Paint-spread hover effect - starts from profile icon with exact color, spreads black */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: '#000000',
            clipPath: `circle(${isHovered ? '500%' : '0%'} at ${avatarPosition.x}% ${avatarPosition.y}%)`,
            transition: 'clip-path 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        ></div>
        
        <div className="relative z-10 flex items-center gap-3 flex-1 min-h-0">
          <div 
            ref={avatarRef}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: '#000000'
            }}
          >
            <span className="text-sm font-medium" style={{ color: GOLD_COLOR }}>P</span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
              <div 
                className="text-xs font-medium transition-colors duration-500"
                style={{
                  color: isHovered ? GOLD_COLOR : '#000000'
                }}
              >
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).toUpperCase()}
              </div>
              {post.readingTime && (
                <div 
                  className="flex items-center gap-1 text-xs font-medium transition-colors duration-500"
                  style={{
                    color: isHovered ? GOLD_COLOR : '#000000'
                  }}
                >
                  <Clock className="h-3 w-3" />
                  <span>{post.readingTime} min</span>
                </div>
              )}
            </div>
            <h4 
              className="text-sm font-medium mb-1 leading-tight line-clamp-2 flex-shrink-0 transition-colors duration-500"
              style={{
                color: isHovered ? GOLD_COLOR : '#000000'
              }}
            >
              {post.title}
            </h4>
            <p 
              className="text-xs leading-relaxed flex-1 min-h-0 line-clamp-2 transition-colors duration-500"
              style={{
                color: isHovered ? GOLD_COLOR : '#000000'
              }}
            >
              {post.excerpt.length > 80 ? post.excerpt.slice(0, 80).trim() + '...' : post.excerpt}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
