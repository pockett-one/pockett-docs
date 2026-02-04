import { Metadata } from 'next'
import { getPostsByCategory, getAllCategories } from '@/lib/blog-utils'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BlogCardsLazy } from '@/components/blog/blog-cards-lazy'
import { Breadcrumb } from '@/components/blog/breadcrumb'
import { CategoryButton } from '@/components/blog/category-button'
import { BLOG_COLORS } from '@/lib/blog-colors'

interface CategoryPageProps {
  params: Promise<{
    category: string
  }>
}

function formatCategoryName(category: string) {
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { category } = await params
  const categoryName = formatCategoryName(category)
  const posts = getPostsByCategory(category)
  
  return {
    title: `${categoryName} | Blog | Pockett Docs`,
    description: `Browse ${posts.length} ${categoryName.toLowerCase()} articles and guides from Pockett Docs. ${posts.slice(0, 3).map(p => p.title).join(', ')}`,
    keywords: [categoryName.toLowerCase(), 'blog', 'articles', 'guides'],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: `${categoryName} | Blog | Pockett Docs`,
      description: `Browse ${categoryName.toLowerCase()} articles and guides from Pockett Docs`,
      type: 'website',
      url: `https://pockett.io/blog/${category}`,
    },
    alternates: {
      canonical: `https://pockett.io/blog/${category}`,
    },
  }
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((category) => ({
    category,
  }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params
  const categories = getAllCategories()
  
  if (!categories.includes(category)) {
    notFound()
  }

  const posts = getPostsByCategory(category)
  const categoryName = formatCategoryName(category)

  return (
    <div className="min-h-screen relative blog-font" style={{ backgroundColor: BLOG_COLORS.DARK_PURPLE }}>
      <Header />
      
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="pt-32 sm:pt-32 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64">
        <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
          <Breadcrumb items={[
            { label: 'Blog', href: '/blog' },
            { label: categoryName }
          ]} />
        </div>
      </nav>

      {/* Header */}
      <header className="pb-10 sm:pb-14 md:pb-16 px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64">
        <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-normal text-white mb-4 sm:mb-5 md:mb-6 capitalize tracking-tight">
            {categoryName}
          </h1>
          <p className="text-white/80 text-base sm:text-lg md:text-xl font-normal">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} in this category
          </p>
        </div>
      </header>

      {/* Category Navigation */}
      <nav aria-label="Blog categories" className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64 pb-8 sm:pb-10 md:pb-12">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <CategoryButton href="/blog">
            All Posts
          </CategoryButton>
          {categories.map((cat) => (
            <CategoryButton 
              key={cat} 
              href={`/blog/${cat}`}
              isActive={cat === category}
            >
              {formatCategoryName(cat)}
            </CategoryButton>
          ))}
        </div>
      </nav>

      {/* Blog Posts Grid - 2 columns on desktop */}
      <main className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-4 sm:px-8 md:px-16 lg:px-32 xl:px-48 2xl:px-64 pb-16 sm:pb-20 md:pb-28 lg:pb-32">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 font-normal">No posts in this category yet. Check back soon!</p>
          </div>
        ) : (
          <BlogCardsLazy posts={posts} />
        )}
      </main>

      <div className="pt-4 sm:pt-6 md:pt-8">
        <Footer />
      </div>
    </div>
  )
}
