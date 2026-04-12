import Link from 'next/link'

import { formatBlogCategoryName } from '@/lib/blog-format'
import { BLOG_BASE_PATH } from '@/lib/marketing/target-audience-nav'
import { formatFullDate } from '@/lib/utils'

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

const H = '[font-family:var(--font-kinetic-headline),system-ui,sans-serif]'

export function RecentPostCard({ post }: RecentPostCardProps) {
  const href = `${BLOG_BASE_PATH}/${post.category}/${post.slug}`

  return (
    <article>
      <Link href={href} className="group block">
        <p className={`mb-2 text-[10px] font-bold uppercase tracking-widest text-[#006e16] ${H}`}>
          {formatBlogCategoryName(post.category)}
        </p>
        <h3
          className={`mb-3 text-base font-bold leading-snug tracking-tight text-[#1b1b1d] transition-colors duration-300 group-hover:text-[#006e16] ${H}`}
        >
          {post.title}
        </h3>
        <div
          className={`flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#45474c]/80 ${H}`}
        >
          <time dateTime={post.date}>{formatFullDate(post.date)}</time>
          {post.readingTime ? (
            <>
              <span className="size-1 shrink-0 rounded-full bg-[#c6c6cc]" aria-hidden />
              <span>{post.readingTime} min read</span>
            </>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
