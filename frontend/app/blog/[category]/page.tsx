import { Metadata } from 'next'
import { getPostsByCategory, getAllCategories } from '@/lib/blog-utils'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BlogCard } from '@/components/blog/blog-card'
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
      <nav aria-label="Breadcrumb" className="pt-32 pb-8 px-32 sm:px-48 lg:px-64">
        <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
          <Breadcrumb items={[
            { label: 'Blog', href: '/blog' },
            { label: categoryName }
          ]} />
        </div>
      </nav>

      {/* Header */}
      <header className="pb-12 px-32 sm:px-48 lg:px-64">
        <div className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal text-white mb-4 capitalize tracking-tight">
            {categoryName}
          </h1>
          <p className="text-white/80 text-xl font-normal">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'} in this category
          </p>
        </div>
      </header>

      {/* Category Navigation */}
      <nav aria-label="Blog categories" className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-32 sm:px-48 lg:px-64 pb-8">
        <div className="flex flex-wrap gap-3">
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
      <main className="max-w-[98%] xl:max-w-[95%] 2xl:max-w-[92%] mx-auto px-32 sm:px-48 lg:px-64 pb-24">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60 font-normal">No posts in this category yet. Check back soon!</p>
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
  )
}
