# Blog Post Unique ID System

## Overview

Each blog post **must** have a unique `id` field in its frontmatter metadata. This ID serves multiple purposes:

1. **React Key Management**: Ensures unique keys for React components, preventing duplicate key errors
2. **Post Identification**: Provides a stable identifier for tracking, analytics, and API responses
3. **Deduplication**: Helps prevent duplicate posts from appearing in lists
4. **Future-Proofing**: Makes it easier to migrate to a database-backed system later
5. **Stability**: IDs stored in MDX files remain consistent across builds, even if metadata changes

## How It Works

### ID Storage (Recommended)

**IDs should be stored directly in the MDX frontmatter** to ensure consistency. This prevents IDs from changing if you:
- Update the post date
- Rename the file (slug changes)
- Move posts between categories

### Automatic ID Generation (Fallback Only)

If an `id` field is not provided in the frontmatter, the system automatically generates one using the format:
```
{category}-{slug}-{date}
```

Example: `comparisons-clinked-vs-pockett-2025-11-18`

**⚠️ Important**: Auto-generated IDs are **not stable** - they will change if the category, slug, or date changes. Always add IDs to your MDX files for consistency.

The generated ID is normalized (lowercase, special characters replaced with hyphens) to ensure consistency.

### Manual ID Assignment

You can explicitly set an `id` in the frontmatter:

```yaml
---
id: "clinked-pockett-comparison-2025"
title: "Clinked vs Pockett: Which Client Portal Is Better for Small Teams?"
date: "2025-11-18"
excerpt: "A practical comparison..."
category: "comparisons"
tags: ["clinked", "client-portal", "comparison", "small-teams"]
image: "/images/blog/blog-2.jpg"
---
```

## Best Practices

### When to Use Manual IDs

1. **Short, Memorable IDs**: If you want shorter, more readable IDs for API responses
2. **Consistent Naming**: If you want to follow a specific naming convention
3. **Migration**: When migrating from another system with existing IDs

### ID Format Guidelines

- Use lowercase letters, numbers, and hyphens only
- Keep IDs concise but descriptive
- Avoid special characters or spaces
- Make them URL-safe (no encoding needed)

### Examples

```yaml
# Good IDs
id: "clinked-pockett-comparison"
id: "consultant-portal-guide-2025"
id: "google-drive-alternatives"

# Avoid
id: "Clinked vs Pockett"  # Contains spaces and uppercase
id: "clinked/pockett"     # Contains special characters
id: "post_1"              # Underscores work but hyphens are preferred
```

## Implementation Details

### BlogPost Interface

```typescript
export interface BlogPost {
  id: string              // Required: Unique identifier
  slug: string            // File name without .mdx extension
  title: string
  date: string
  excerpt: string
  tags: string[]
  category: string
  image: string
  content?: string
  readingTime?: number
}
```

### Usage in Components

The ID is used as the React key in list rendering:

```tsx
{posts.map((post) => (
  <article key={post.id}>
    <BlogCard post={post} />
  </article>
))}
```

### Deduplication

The lazy loading component uses IDs to prevent duplicate posts:

```typescript
const existingIds = new Set(prev.map(p => p.id))
const newPosts = processedNextBatch.filter(p => !existingIds.has(p.id))
```

## Migration Guide

### Adding IDs to Existing Posts

**Use the automated script** to add IDs to all existing posts:

```bash
npm run blog:add-ids
```

This script will:
1. Read all MDX files in `content/blog/`
2. Check if they have an `id` field
3. If not, generate one based on `category-slug-date`
4. Add the ID to the frontmatter
5. Write the file back

### Manual Addition

You can also add IDs manually:

1. Open the MDX file
2. Add `id: "your-unique-id"` to the frontmatter
3. Save the file

Example:

```yaml
---
id: "getting-started-pockett-docs"
title: "Getting Started with Pockett Docs"
date: "2025-02-04"
# ... rest of frontmatter
---
```

### Verifying IDs

All posts should have IDs in their frontmatter. You can verify this by:
1. Checking the MDX files directly
2. Checking the `BlogPost` objects returned from `getAllPosts()` or `getPostBySlug()`
3. Running `npm run blog:add-ids` to see which posts already have IDs

## Benefits

1. **No More Duplicate Key Errors**: React keys are now guaranteed unique
2. **Better Tracking**: IDs can be used for analytics and event tracking
3. **API Ready**: IDs provide stable identifiers for API endpoints
4. **Database Migration**: Easy to map to database primary keys later
5. **Deduplication**: Prevents the same post from appearing multiple times

## Technical Notes

- **IDs are read from MDX frontmatter** - they are not generated dynamically
- The auto-generation logic (fallback) normalizes special characters to hyphens
- IDs are case-insensitive (always lowercase)
- The system ensures backward compatibility: posts without IDs will have them auto-generated, but this is not recommended for production
- **IDs should be immutable** - once set, don't change them unless absolutely necessary
- If you need to change an ID, update all references (analytics, external systems, etc.)

## Why Store IDs in MDX Files?

1. **Consistency**: IDs remain the same across builds, even if metadata changes
2. **Stability**: React keys stay stable, preventing unnecessary re-renders
3. **Tracking**: Analytics and tracking systems can rely on stable IDs
4. **Migration**: Easy to migrate to a database system later
5. **Debugging**: Easier to identify posts in logs and error messages
