import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPostBySlug, getAllPosts, getAllCategories, extractPlainText } from '@/lib/blog-utils'
import { Calendar, Tag, BookOpen, Clock } from 'lucide-react'
import { TextToSpeech } from '@/components/blog/text-to-speech'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumb } from '@/components/blog/breadcrumb'
import { RecentPostCard } from '@/components/blog/recent-post-card'
import { BLOG_COLORS } from '@/lib/blog-colors'

interface BlogPostPageProps {
  params: Promise<{
    category: string
    slug: string
  }>
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatCategoryName(category: string) {
  return category.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { category, slug } = await params
  const post = getPostBySlug(category, slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Pockett Docs',
    }
  }

  return {
    title: `${post.title} | Blog | Pockett Docs`,
    description: post.excerpt,
    keywords: [...post.tags, category, 'blog', 'article'],
    authors: [{ name: 'Pockett Docs Team' }],
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
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
      images: [post.image],
      url: `https://pockett.io/blog/${category}/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.image],
    },
    alternates: {
      canonical: `https://pockett.io/blog/${category}/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    category: post.category,
    slug: post.slug,
  }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { category, slug } = await params
  const categories = getAllCategories()
  
  if (!categories.includes(category)) {
    notFound()
  }

  const post = getPostBySlug(category, slug)
  
  if (!post) {
    notFound()
  }

  // Get recent posts excluding current one
  const allPosts = getAllPosts()
  const recentPosts = allPosts
    .filter(p => `${p.category}/${p.slug}` !== `${category}/${slug}`)
    .slice(0, 5)

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.date,
    "dateModified": post.date,
    "author": {
      "@type": "Organization",
      "name": "Pockett Docs",
      "url": "https://pockett.io"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pockett Docs",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pockett.io/logo-120x120.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://pockett.io/blog/${category}/${slug}`
    },
    "image": post.image,
    "keywords": post.tags.join(', ')
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <article className="min-h-screen relative blog-font" style={{ backgroundColor: BLOG_COLORS.DARK_PURPLE }}>
        <Header />
        
        {/* Hero Image with Overlay */}
        {post.image && (
          <div className="relative w-full h-[60vh] -mt-24 pt-24">
            {/* Background Image */}
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/90" />
            
            {/* Content Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="w-[95%] md:w-[85%] max-w-7xl mx-auto pb-8 md:pb-12 px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-6">
                  <Breadcrumb items={[
                    { label: 'Blog', href: '/blog' },
                    { label: formatCategoryName(category), href: `/blog/${category}` },
                    { label: post.title }
                  ]} />
                </nav>
                
                <div className="mb-3">
                  <span className="px-3 py-1 rounded-full text-sm font-medium capitalize inline-flex items-center gap-2" style={{ backgroundColor: BLOG_COLORS.GOLD, color: BLOG_COLORS.DARK_BG }}>
                    {post.category.replace('-', ' ')}
                  </span>
                </div>
                
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-white mb-4 tracking-tight leading-tight">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-white/90 font-normal">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </div>
                  
                  {post.readingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{post.readingTime} min read</span>
                    </div>
                  )}
                  
                  {/* Text to Speech */}
                  <div className="flex items-center">
                    <TextToSpeech 
                      text={`${post.title}. ${extractPlainText(post.content)}`}
                      size="md"
                    />
                  </div>
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-normal"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="w-[95%] md:w-[85%] max-w-7xl mx-auto pt-8 sm:pt-12 md:pt-16">
          <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-12">
            {/* Main Content */}
            <div className="flex-1">
              <style dangerouslySetInnerHTML={{ __html: `
            .blog-prose-content {
              color: white !important;
            }
            .blog-prose-content p {
              color: white !important;
              margin-bottom: 1.5rem !important;
            }
            .blog-prose-content p:last-child {
              margin-bottom: 0 !important;
            }
            .blog-prose-content li,
            .blog-prose-content ul,
            .blog-prose-content ol,
            .blog-prose-content blockquote {
              color: white !important;
            }
            .blog-prose-content {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
              font-feature-settings: 'kern' 1, 'liga' 1 !important;
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
            }
            .blog-prose-content h1,
            .blog-prose-content h2,
            .blog-prose-content h3,
            .blog-prose-content h4,
            .blog-prose-content h5,
            .blog-prose-content h6 {
              color: white !important;
              display: flex !important;
              align-items: center !important;
              gap: 0.75rem !important;
              margin-top: 2rem !important;
              margin-bottom: 1rem !important;
              font-size: 1.5rem !important;
              font-weight: normal !important;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif !important;
              font-feature-settings: 'kern' 1, 'liga' 1 !important;
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
            }
            @media (min-width: 1024px) {
              .blog-prose-content h1,
              .blog-prose-content h2,
              .blog-prose-content h3,
              .blog-prose-content h4,
              .blog-prose-content h5,
              .blog-prose-content h6 {
                font-size: 30px !important;
              }
            }
            .blog-prose-content h1:first-child,
            .blog-prose-content h2:first-child,
            .blog-prose-content h3:first-child {
              margin-top: 0 !important;
            }
            .blog-prose-content a {
              color: ${BLOG_COLORS.GOLD} !important;
            }
            .blog-prose-content code {
              color: ${BLOG_COLORS.GOLD} !important;
            }
          `}} />
          <div className="bg-white/5 backdrop-blur-sm p-8 md:p-12 lg:p-16 prose prose-lg max-w-none blog-prose-content
            prose-headings:font-normal prose-headings:text-white prose-headings:tracking-tight
            prose-p:text-white prose-p:leading-relaxed prose-p:font-normal
            prose-a:no-underline hover:prose-a:underline 
            prose-strong:text-white prose-strong:font-medium
            prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-normal
            prose-pre:bg-black/50 prose-pre:text-white prose-pre:border prose-pre:border-white/20
            prose-ul:text-white prose-ol:text-white prose-ul:font-normal prose-ol:font-normal
            prose-li:text-white prose-li:font-normal
            prose-blockquote:text-white prose-blockquote:border-white/20 prose-blockquote:font-normal">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => (
                  <h1 {...props}>
                    <BookOpen className="h-5 w-5 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h1>
                ),
                h2: ({node, ...props}) => (
                  <h2 {...props}>
                    <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h2>
                ),
                h3: ({node, ...props}) => (
                  <h3 {...props}>
                    <BookOpen className="h-4 w-4 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h3>
                ),
                h4: ({node, ...props}) => (
                  <h4 {...props}>
                    <BookOpen className="h-3.5 w-3.5 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h4>
                ),
                h5: ({node, ...props}) => (
                  <h5 {...props}>
                    <BookOpen className="h-3.5 w-3.5 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h5>
                ),
                h6: ({node, ...props}) => (
                  <h6 {...props}>
                    <BookOpen className="h-3 w-3 flex-shrink-0" style={{ color: BLOG_COLORS.GOLD }} />
                    <span>{props.children}</span>
                  </h6>
                ),
              }}
            >
              {post.content || ''}
            </ReactMarkdown>
          </div>
            </div>

            {/* Sidebar - Recent Posts */}
            <aside className="lg:w-80 flex-shrink-0">
              <h3 className="text-xl font-normal text-white mb-6">Recent Articles</h3>
              <div className="space-y-4">
                {recentPosts.map((recentPost) => (
                  <RecentPostCard key={recentPost.id} post={recentPost} />
                ))}
              </div>
            </aside>
          </div>
        </div>

        <div className="pt-4 sm:pt-6 md:pt-8">
          <Footer />
        </div>
      </article>
    </>
  )
}
