"use client"

import { useState, useCallback } from 'react'

interface BlogImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  priority?: boolean
}

const FALLBACK_IMAGE_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="20" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EBlog Post%3C/text%3E%3C/svg%3E'
const FALLBACK_IMAGE_SVG_LARGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23e5e7eb" width="800" height="400"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EBlog Post%3C/text%3E%3C/svg%3E'

export function BlogImage({ src, alt, fill = false, className = '', priority = false }: BlogImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [hasError, setHasError] = useState(false)
  
  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fill ? FALLBACK_IMAGE_SVG : FALLBACK_IMAGE_SVG_LARGE)
    }
  }, [fill, hasError])
  
  // Use regular img tag for all images since we need onError support
  // and images are unoptimized in next.config.js anyway
  // Use key prop to ensure proper re-rendering when src changes
  return (
    <img
      key={src}
      src={hasError ? imgSrc : src}
      alt={alt}
      className={className}
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
