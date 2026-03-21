import { MetadataRoute } from 'next'
import { getAllPosts, getAllCategories } from '@/lib/blog-utils'
import { getPlatformSiteOrigin } from '@/config/platform-domain'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPlatformSiteOrigin()
  
  try {
    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/trust-center`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/pricing`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/waitlist`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: `${baseUrl}/resources/docs`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      },
      {
        url: `${baseUrl}/resources/docs/features`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.65,
      },
      {
        url: `${baseUrl}/resources/docs/authentication/signup`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/resources/docs/authentication/signin`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/resources/docs/authentication/logout`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.55,
      },
      {
        url: `${baseUrl}/resources/docs/dash/connectors`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/resources/docs/dash/insights`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/resources/docs/dash/document-actions`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/resources/docs/security`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.65,
      },
    ]

    // Blog category pages
    const categories = getAllCategories()
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${baseUrl}/blog/${category}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))

    // Blog post pages
    const posts = getAllPosts()
    const blogPostPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.category}/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticPages, ...categoryPages, ...blogPostPages]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static pages if blog posts fail
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
    ]
  }
}
