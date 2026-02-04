import { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog-utils'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BlogCard } from '@/components/blog/blog-card'
import { Breadcrumb } from '@/components/blog/breadcrumb'
import { ReadMoreButton } from '@/components/blog/read-more-button'
import { CategoryButton } from '@/components/blog/category-button'
import { BLOG_COLORS } from '@/lib/blog-colors'

export const metadata: Metadata = {
  title: 'Blog | Pockett Docs - Articles, Guides & Insights',
  description: 'Read the latest articles, guides, and insights from Pockett Docs. Learn about document management, Google Drive integration, client portals, and productivity tips.',
  keywords: ['blog', 'articles', 'guides', 'document management', 'Google Drive', 'productivity', 'client portals'],
  openGraph: {
    title: 'Blog | Pockett Docs',
    description: 'Read the latest articles, guides, and insights from Pockett Docs',
    type: 'website',
    url: 'https://pockett.io/blog',
  },
  alternates: {
    canonical: 'https://pockett.io/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()
  const categories = ['comparisons', 'use-cases', 'guides', 'product']

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Pockett Docs Blog",
    "description": "Articles, guides, and insights about document management and productivity",
    "url": "https://pockett.io/blog",
    "blogPost": posts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.date,
      "author": {
        "@type": "Organization",
        "name": "Pockett Docs"
      }
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen relative blog-font" style={{ backgroundColor: BLOG_COLORS.DARK_PURPLE }}>
        <Header />
        
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="pt-32 pb-8 px-32 sm:px-48 lg:px-64">
          <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
            <Breadcrumb items={[{ label: 'Blog' }]} />
          </div>
        </nav>

        {/* Hero Section */}
        <header className="pb-16 px-32 sm:px-48 lg:px-64">
          <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
            <div className="text-sm font-medium uppercase tracking-wider mb-4" style={{ color: BLOG_COLORS.GOLD }}>
              Recent Articles
            </div>
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-12">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal text-white mb-6 leading-tight tracking-tight">
                  Explore our most recent articles and fresh perspectives
                </h1>
              </div>
              <div className="lg:w-96">
                <p className="text-white/80 text-lg leading-relaxed mb-6 font-normal">
                  Stay in the loop with our latest posts, featuring thought-provoking articles, fresh ideas, and creative insights. Whether you're looking for inspiration, practical tips, or stories that spark curiosity.
                </p>
                <ReadMoreButton href="#posts">
                  Read More
                </ReadMoreButton>
              </div>
            </div>
          </div>
        </header>

        {/* Category Navigation */}
        <nav aria-label="Blog categories" className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-32 sm:px-48 lg:px-64 pb-8">
          <div className="flex flex-wrap gap-3">
            <CategoryButton href="/blog" isActive={true}>
              All Posts
            </CategoryButton>
            {categories.map((category) => (
              <CategoryButton key={category} href={`/blog/${category}`}>
                {category.split('-').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </CategoryButton>
            ))}
          </div>
        </nav>

        {/* Blog Posts Grid - 2 columns on desktop */}
        <main id="posts" className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-32 sm:px-48 lg:px-64 pb-24">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 font-normal">No blog posts available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {posts.map((post) => (
                <article key={`${post.category}-${post.slug}`}>
                  <BlogCard post={post} />
                </article>
              ))}
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}
