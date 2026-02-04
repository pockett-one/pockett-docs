import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  category: string
  image: string
  content?: string
  readingTime?: number
}

const postsDirectory = path.join(process.cwd(), 'content', 'blog')

// Calculate reading time in minutes based on word count
// Average reading speed: 200 words per minute
export function getReadingTime(content: string | undefined): number {
  if (!content) return 1
  
  // Remove markdown syntax and count words
  const text = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`[^`]+`/g, '') // Remove inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Replace markdown links with text
    .replace(/[#*\-_]/g, '') // Remove markdown formatting
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .trim()
  
  const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
  const readingTime = Math.ceil(wordCount / 200)
  
  return Math.max(1, readingTime) // Minimum 1 minute
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const categories = ['comparisons', 'use-cases', 'guides', 'product']
  const allPosts: BlogPost[] = []

  categories.forEach((category) => {
    const categoryPath = path.join(postsDirectory, category)
    if (!fs.existsSync(categoryPath)) {
      return
    }

    const fileNames = fs.readdirSync(categoryPath)
    const categoryPosts = fileNames
      .filter((name) => name.endsWith('.mdx'))
      .map((fileName) => {
        const fullPath = path.join(categoryPath, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
          slug: fileName.replace(/\.mdx$/, ''),
          title: data.title || '',
          date: data.date || '',
          excerpt: data.excerpt || '',
          tags: data.tags || [],
          category,
          image: data.image || `/images/blog/${category}-default.jpg`,
          content,
          readingTime: getReadingTime(content),
        } as BlogPost
      })

    allPosts.push(...categoryPosts)
  })

  // Sort by date, newest first
  return allPosts.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter((post) => post.category === category)
}

export function getPostBySlug(category: string, slug: string): BlogPost | null {
  // Validate inputs
  if (!category || !slug || typeof category !== 'string' || typeof slug !== 'string') {
    return null
  }

  const filePath = path.join(postsDirectory, category, `${slug}.mdx`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContents = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(fileContents)

  return {
    slug,
    title: data.title || '',
    date: data.date || '',
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    category,
    image: data.image || `/images/blog/${category}-default.jpg`,
    content,
    readingTime: getReadingTime(content),
  } as BlogPost
}

export function getAllCategories(): string[] {
  return ['comparisons', 'use-cases', 'guides', 'product']
}
