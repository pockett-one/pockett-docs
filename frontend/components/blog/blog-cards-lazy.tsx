"use client"

import { useState, useEffect, useRef } from 'react'
import { BlogCard } from './blog-card'
import { extractPlainText } from '@/lib/text-extraction'
import { ChevronDown } from 'lucide-react'
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
      <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-8">
        {visiblePosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-12 flex justify-center sm:mt-16 md:mt-20">
          <button
            ref={buttonRef}
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsButtonHovered(false)}
            className="group relative overflow-hidden rounded-[4px] border border-[#141c2a] bg-[#141c2a] px-8 py-3.5 text-xs font-bold uppercase tracking-widest text-[#72ff70] transition-all duration-200 [font-family:var(--font-kinetic-headline),system-ui,sans-serif] hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(2,6,23,0.55)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-[#72ff70] transition-[clip-path] duration-500 ease-out"
              style={{
                clipPath:
                  isButtonHovered && !isLoading
                    ? `circle(200% at ${iconPosition.x}% ${iconPosition.y}%)`
                    : `circle(0% at ${iconPosition.x}% ${iconPosition.y}%)`,
              }}
              aria-hidden
            />
            <span
              className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${
                isButtonHovered && !isLoading ? 'text-[#002203]' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading…
                </>
              ) : (
                <>
                  Load more
                  <ChevronDown
                    ref={iconRef}
                    className={`h-4 w-4 transition-transform ${isButtonHovered ? 'translate-y-0.5' : ''}`}
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
