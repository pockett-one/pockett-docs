"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { TextToSpeech } from './text-to-speech'

interface BlogCardProps {
  post: {
    id?: string
    slug: string
    title: string
    date: string
    excerpt: string
    tags: string[]
    category: string
    image: string
    readingTime?: number
    content?: string
  }
}

import { BLOG_COLORS } from '@/lib/blog-colors'

const LIME_YELLOW = BLOG_COLORS.LIME_YELLOW
const GOLD_COLOR = BLOG_COLORS.GOLD

function formatDate(dateString: string, short: boolean = false) {
  const date = new Date(dateString)
  if (short) {
    // Short format for mobile: "DEC 7, 2025"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).toUpperCase()
  }
  // Full format for desktop: "DECEMBER 7, 2025"
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).toUpperCase()
}

function truncateExcerpt(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function BlogCard({ post }: BlogCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [isAudioPaused, setIsAudioPaused] = useState(false)
  const [avatarPosition, setAvatarPosition] = useState({ x: 15, y: 50 })
  const cardRef = useRef<HTMLAnchorElement>(null)
  const innerTileRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  // Handle audio playing state changes
  const handleAudioStateChange = (playing: boolean, paused: boolean) => {
    setIsAudioPlaying(playing)
    setIsAudioPaused(paused)
  }

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
      ref={cardRef}
      href={`/blog/${post.category}/${post.slug}`}
      className="group relative rounded-xl overflow-hidden flex flex-col transition-all duration-500 min-h-[320px] sm:min-h-[384px] shadow-lg block"
      style={{
        backgroundColor: '#000000',
        borderColor: GOLD_COLOR,
        borderWidth: '0.25px',
        borderStyle: 'solid'
      }}
    >
      {/* Background image spans whole card */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      
      {/* Content wrapper with mouse handlers */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 flex flex-col flex-1"
      >
        {/* Tags - Black and gold pills - at top */}
        <div className="px-3 py-4 sm:px-6 sm:py-6 sm:pb-4 flex flex-wrap gap-2 sm:gap-3">
        {post.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-500"
            style={{
              backgroundColor: '#000000',
              borderColor: GOLD_COLOR,
              borderWidth: '1px',
              borderStyle: 'solid',
              color: GOLD_COLOR
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Empty space in middle - geometric shapes visible here */}
      <div className="flex-1 min-h-[60px] sm:min-h-[80px]"></div>

      {/* Inner tile with icon, title, excerpt - at bottom - hover effect here */}
      <div ref={innerTileRef} className="mx-3 sm:mx-4 md:mx-6 mb-4 sm:mb-5 md:mb-6">
        <div 
          className="rounded-lg px-4 py-4 sm:px-5 sm:py-5 relative overflow-hidden min-h-[160px] sm:h-[140px] flex flex-col"
          style={{
            backgroundColor: GOLD_COLOR,
            borderColor: GOLD_COLOR,
            borderWidth: '0.5px',
            borderStyle: 'solid'
          }}
        >
          {/* Paint-spread hover effect - starts from profile icon with exact color, spreads black */}
          {/* Apply hover effect when card is hovered OR audio is playing (and not paused) */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundColor: '#000000',
              clipPath: `circle(${(isHovered || (isAudioPlaying && !isAudioPaused)) ? '500%' : '0%'} at ${avatarPosition.x}% ${avatarPosition.y}%)`,
              transition: 'clip-path 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          ></div>
          
          <div className="relative z-10 flex items-start gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
            <div 
              ref={avatarRef}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: '#000000'
              }}
            >
              <span className="text-base sm:text-base font-medium" style={{ color: GOLD_COLOR }}>P</span>
            </div>
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-2 flex-shrink-0 flex-wrap">
                <div 
                  className="text-xs sm:text-xs font-medium transition-colors duration-500"
                  style={{
                    color: (isHovered || (isAudioPlaying && !isAudioPaused)) ? GOLD_COLOR : '#000000'
                  }}
                >
                  <span className="hidden sm:inline">{formatDate(post.date, false)}</span>
                  <span className="sm:hidden">{formatDate(post.date, true)}</span>
                </div>
                {post.readingTime && (
                  <div 
                    className="hidden sm:flex items-center gap-1 text-xs font-medium transition-colors duration-500"
                    style={{
                      color: (isHovered || (isAudioPlaying && !isAudioPaused)) ? GOLD_COLOR : '#000000'
                    }}
                  >
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{post.readingTime} min</span>
                  </div>
                )}
                <div className="ml-auto flex-shrink-0">
                  <TextToSpeech 
                    text={post.content 
                      ? (() => {
                          // When reading full content, exclude excerpt to avoid duplication
                          // The excerpt is already displayed on the card, so we remove it from content
                          let contentText = post.content
                          if (post.excerpt) {
                            // Normalize both texts for comparison (remove extra spaces, lowercase)
                            const normalizedExcerpt = post.excerpt.trim().toLowerCase().replace(/\s+/g, ' ')
                            const normalizedContent = contentText.trim().toLowerCase().replace(/\s+/g, ' ')
                            
                            // Check if excerpt appears at the start of content (with some tolerance for formatting)
                            if (normalizedContent.startsWith(normalizedExcerpt)) {
                              // Remove excerpt from the beginning of content
                              contentText = contentText.substring(post.excerpt.length).trim()
                              // Also remove any leading punctuation or spaces
                              contentText = contentText.replace(/^[.,;:\s]+/, '').trim()
                            }
                          }
                          return `${post.title}. ${contentText}`
                        })()
                      : `${post.title}. ${post.excerpt}`}
                    size="sm"
                    cardHovered={isHovered}
                    onPlayingStateChange={handleAudioStateChange}
                  />
                </div>
              </div>
              <h2 
                className="text-base sm:text-lg font-medium mb-3 sm:mb-2 leading-snug sm:leading-tight transition-colors duration-500 line-clamp-2 flex-shrink-0 overflow-hidden"
                style={{
                  color: (isHovered || (isAudioPlaying && !isAudioPaused)) ? GOLD_COLOR : '#000000'
                }}
              >
                {post.title}
              </h2>
              <p 
                className="text-sm sm:text-sm leading-relaxed transition-colors duration-500 flex-1 min-h-0 overflow-hidden line-clamp-3 sm:line-clamp-3"
                style={{
                  color: (isHovered || (isAudioPlaying && !isAudioPaused)) ? GOLD_COLOR : '#000000'
                }}
              >
                {truncateExcerpt(post.excerpt, 100)}
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Link>
  )
}
