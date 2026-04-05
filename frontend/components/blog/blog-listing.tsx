'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

import { MARKETING_PAGE_SHELL } from '@/lib/marketing/target-audience-nav'
import { cn } from '@/lib/utils'
import { formatBlogCategoryName } from '@/lib/blog-format'
import type { BlogPost } from '@/lib/blog-types'

import { BlogCardsLazy } from '@/components/blog/blog-cards-lazy'
import { BlogFeaturedHero } from '@/components/blog/blog-featured-hero'
import { CategoryButton } from '@/components/blog/category-button'

const H = '[font-family:var(--font-kinetic-headline),system-ui,sans-serif]'
const B = '[font-family:var(--font-kinetic-body),system-ui,sans-serif]'

export function BlogListing({
  posts,
  categories,
  activeCategory,
  showFeatured,
  listTitle = 'Articles',
}: {
  posts: BlogPost[]
  categories: string[]
  activeCategory: 'all' | string
  showFeatured: boolean
  /** Section heading above the grid when `showFeatured` is false (avoid duplicating the page H1). */
  listTitle?: string
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return posts
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.excerpt.toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s)) ||
        formatBlogCategoryName(p.category).toLowerCase().includes(s),
    )
  }, [posts, q])

  const featured = showFeatured && filtered.length > 0 ? filtered[0] : null
  const gridPosts =
    showFeatured && featured ? filtered.filter((p) => p.id !== featured.id) : filtered

  return (
    <>
      <section className={cn(MARKETING_PAGE_SHELL, 'mb-10')} aria-label="Filter posts">
        <div className="flex flex-col gap-4 rounded-[4px] bg-[#f0edee] p-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <CategoryButton href="/blog" isActive={activeCategory === 'all'}>
              All posts
            </CategoryButton>
            {categories.map((cat) => (
              <CategoryButton key={cat} href={`/blog/${cat}`} isActive={activeCategory === cat}>
                {formatBlogCategoryName(cat)}
              </CategoryButton>
            ))}
          </div>
          <div className="relative w-full md:max-w-xs md:shrink-0">
            <label htmlFor="blog-search" className="sr-only">
              Search articles
            </label>
            <input
              id="blog-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles"
              className={cn(
                'w-full rounded-[4px] border border-[#c6c6cc]/30 bg-white py-3 pl-4 pr-10 text-sm text-[#1b1b1d] outline-none transition-[box-shadow,border-color]',
                'placeholder:font-medium placeholder:normal-case placeholder:text-[#76777d] placeholder:tracking-normal',
                'focus:border-[#001256] focus:ring-2 focus:ring-[#5a78ff]/35',
                B,
              )}
            />
            <Search
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#45474c]"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {featured ? (
        <section className={cn(MARKETING_PAGE_SHELL, 'mb-16 md:mb-24')} aria-label="Featured article">
          <BlogFeaturedHero post={featured} categoryLabel={formatBlogCategoryName(featured.category)} />
        </section>
      ) : null}

      <section id="posts" className={cn(MARKETING_PAGE_SHELL, 'pb-16 md:pb-24')}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#eae7e9] pb-4">
          <h2 className={cn('text-3xl font-bold tracking-tighter text-[#1b1b1d] md:text-4xl', H)}>
            {showFeatured ? 'Recent articles' : listTitle}
          </h2>
          <span className={cn('text-[10px] font-bold uppercase tracking-widest text-[#45474c]', H)}>
            {showFeatured
              ? `Showing ${gridPosts.length} of ${filtered.length}${q.trim() ? ' (filtered)' : ''}`
              : `${filtered.length} ${filtered.length === 1 ? 'article' : 'articles'}`}
          </span>
        </div>
        {gridPosts.length === 0 ? (
          <p className={cn('text-center text-[#45474c]', B)}>
            {q.trim()
              ? 'No articles match your search.'
              : featured
                ? 'More articles are on the way.'
                : 'No articles in this category yet.'}
          </p>
        ) : (
          <BlogCardsLazy posts={gridPosts} />
        )}
      </section>
    </>
  )
}
