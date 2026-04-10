/** Display label for a blog category slug (e.g. `use-cases` → "Use Cases"). Safe for client bundles. */
export function formatBlogCategoryName(category: string): string {
  return category
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
