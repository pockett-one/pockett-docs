#!/usr/bin/env node

/**
 * Script to add unique IDs to blog post MDX files
 * 
 * This script:
 * 1. Reads all MDX files in content/blog/
 * 2. Checks if they have an 'id' field
 * 3. If not, generates one based on category-slug-date
 * 4. Adds the ID to the frontmatter
 * 5. Writes the file back
 * 
 * Usage: node scripts/add-blog-ids.js
 */

const fs = require('fs')
const path = require('path')
const matter = require('gray-matter')

const postsDirectory = path.join(process.cwd(), 'content', 'blog')
const categories = ['comparisons', 'use-cases', 'guides', 'product']

function generateId(category, slug, date) {
  // Generate ID: category-slug-date, normalized
  const id = `${category}-${slug}-${date || ''}`
    .replace(/[^a-z0-9-]/gi, '-')
    .toLowerCase()
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  
  return id
}

function addIdsToPosts() {
  let totalProcessed = 0
  let totalAdded = 0
  let totalSkipped = 0

  categories.forEach((category) => {
    const categoryPath = path.join(postsDirectory, category)
    
    if (!fs.existsSync(categoryPath)) {
      console.log(`⚠️  Category directory not found: ${categoryPath}`)
      return
    }

    const fileNames = fs.readdirSync(categoryPath)
      .filter((name) => name.endsWith('.mdx'))

    fileNames.forEach((fileName) => {
      const filePath = path.join(categoryPath, fileName)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)
      
      totalProcessed++

      // Check if ID already exists
      if (data.id) {
        console.log(`✓  ${category}/${fileName} - ID already exists: ${data.id}`)
        totalSkipped++
        return
      }

      // Generate ID
      const slug = fileName.replace(/\.mdx$/, '')
      const id = generateId(category, slug, data.date)

      // Add ID to frontmatter
      const updatedData = {
        ...data,
        id
      }

      // Reconstruct file with new frontmatter
      const updatedFile = matter.stringify(content, updatedData)
      
      // Write back to file
      fs.writeFileSync(filePath, updatedFile, 'utf8')
      
      console.log(`✓  ${category}/${fileName} - Added ID: ${id}`)
      totalAdded++
    })
  })

  console.log('\n' + '='.repeat(50))
  console.log(`Summary:`)
  console.log(`  Total processed: ${totalProcessed}`)
  console.log(`  IDs added: ${totalAdded}`)
  console.log(`  Already had IDs: ${totalSkipped}`)
  console.log('='.repeat(50))
}

// Run the script
try {
  console.log('Adding IDs to blog posts...\n')
  addIdsToPosts()
  console.log('\n✅ Done!')
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
