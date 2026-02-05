"use client"

import { useState, useEffect, useRef } from 'react'
import { BlogCard } from './blog-card'
import { extractPlainText } from '@/lib/text-extraction'
import { ChevronDown } from 'lucide-react'
import { BLOG_COLORS } from '@/lib/blog-colors'

interface BlogPost {
  id: string
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

interface BlogCardsLazyProps {
  posts: BlogPost[]
}

const POSTS_PER_PAGE = 6

const GOLD_COLOR = BLOG_COLORS.GOLD

export function BlogCardsLazy({ posts }: BlogCardsLazyProps) {
  const [visiblePosts, setVisiblePosts] = useState<BlogPost[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loadedCount, setLoadedCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isButtonHovered, setIsButtonHovered] = useState(false)
  const [iconPosition, setIconPosition] = useState({ x: 50, y: 50 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const iconRef = useRef<SVGSVGElement>(null)

  // Initialize with first batch
  useEffect(() => {
    const initialPosts = posts.slice(0, POSTS_PER_PAGE)
    // Process posts to include plain text content for audio
    const processedPosts = initialPosts.map(post => ({
      ...post,
      content: post.content ? extractPlainText(post.content) : undefined
    }))
    setVisiblePosts(processedPosts)
    setLoadedCount(POSTS_PER_PAGE)
    setHasMore(posts.length > POSTS_PER_PAGE)
  }, [posts])

  // Update icon position for hover effect
  useEffect(() => {
    const updateIconPosition = () => {
      if (!buttonRef.current || !iconRef.current) return
      
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const iconRect = iconRef.current.getBoundingClientRect()
      
      const x = ((iconRect.left + iconRect.width / 2 - buttonRect.left) / buttonRect.width) * 100
      const y = ((iconRect.top + iconRect.height / 2 - buttonRect.top) / buttonRect.height) * 100
      
      setIconPosition({ x, y })
    }
    
    updateIconPosition()
    window.addEventListener('resize', updateIconPosition)
    return () => window.removeEventListener('resize', updateIconPosition)
  }, [])

  const loadMore = () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const nextBatchStart = loadedCount
      const nextBatchEnd = nextBatchStart + POSTS_PER_PAGE
      const nextBatch = posts.slice(nextBatchStart, nextBatchEnd)
      
      if (nextBatch.length > 0) {
        // Process posts to include plain text content for audio
        const processedNextBatch = nextBatch.map(post => ({
          ...post,
          content: post.content ? extractPlainText(post.content) : undefined
        }))
        
        // Prevent duplicates by checking existing post IDs
        setVisiblePosts(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newPosts = processedNextBatch.filter(p => !existingIds.has(p.id))
          return [...prev, ...newPosts]
        })
        
        setLoadedCount(nextBatchEnd)
        setHasMore(nextBatchEnd < posts.length)
      } else {
        setHasMore(false)
      }
      
      setIsLoading(false)
    }, 300)
  }

  const handleMouseEnter = () => {
    setIsButtonHovered(true)
    // Update icon position on hover to ensure accuracy
    if (buttonRef.current && iconRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const iconRect = iconRef.current.getBoundingClientRect()
      
      const x = ((iconRect.left + iconRect.width / 2 - buttonRect.left) / buttonRect.width) * 100
      const y = ((iconRect.top + iconRect.height / 2 - buttonRect.top) / buttonRect.height) * 100
      
      setIconPosition({ x, y })
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
        {visiblePosts.map((post) => (
          <article key={post.id}>
            <BlogCard post={post} />
          </article>
        ))}
      </div>
      {hasMore && (
        <div className="flex items-center justify-center mt-12 sm:mt-16 md:mt-20">
          <button
            ref={buttonRef}
            onClick={loadMore}
            disabled={isLoading}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="group relative px-8 py-4 rounded-full font-medium text-sm sm:text-base transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#000000',
              borderColor: GOLD_COLOR,
              borderWidth: '1px',
              borderStyle: 'solid',
              color: isButtonHovered && !isLoading ? '#000000' : GOLD_COLOR
            }}
          >
            {/* Hover fill effect - starts from icon */}
            <div
              className="absolute inset-0 rounded-full transition-all duration-500"
              style={{
                backgroundColor: GOLD_COLOR,
                clipPath: isButtonHovered && !isLoading 
                  ? `circle(200% at ${iconPosition.x}% ${iconPosition.y}%)` 
                  : `circle(0% at ${iconPosition.x}% ${iconPosition.y}%)`,
              }}
            />
            
            {/* Button content */}
            <span className="relative z-10 flex items-center gap-2">
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>See More Articles</span>
                  <ChevronDown 
                    ref={iconRef}
                    className={`h-4 w-4 transition-transform ${isButtonHovered ? 'translate-y-1' : ''}`} 
                  />
                </>
              )}
            </span>
          </button>
        </div>
      )}
    </>
  )
}
