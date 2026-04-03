import React from "react"
import { cn } from "@/lib/utils"

interface GoogleDriveIconProps {
  size?: number
  className?: string
}

/** Same asset as Trust Architecture & Google’s branding guidelines (1× 48dp product icon). */
export const GOOGLE_DRIVE_PRODUCT_MARK_SRC =
  "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" as const

type GoogleDriveProductMarkProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  className?: string
}

/**
 * Google-supplied Drive product mark (PNG). Prefer this on marketing surfaces next to
 * “Google Drive” copy so heroes match Trust Architecture; use {@link GoogleDriveIcon}
 * only where a small inline SVG is required (e.g. dense UI).
 */
export function GoogleDriveProductMark({
  className,
  alt = "Google Drive",
  width = 48,
  height = 48,
  decoding = "async",
  ...rest
}: GoogleDriveProductMarkProps) {
  return (
    <img
      src={GOOGLE_DRIVE_PRODUCT_MARK_SRC}
      alt={alt}
      width={width}
      height={height}
      decoding={decoding}
      className={cn("object-contain", className)}
      {...rest}
    />
  )
}

/**
 * Inline SVG approximation of the Drive logo — triangular design with Google brand colors.
 * Blue (#4285F4), Green (#34A853), Yellow (#FBBC05).
 */
export function GoogleDriveIcon({ size = 20, className = "" }: GoogleDriveIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blue - top triangle (Google blue) */}
      <path fill="#4285F4" d="M12 0L4 14H20L12 0Z" />
      {/* Green - bottom left (Google green) */}
      <path fill="#34A853" d="M4 14L0 21H12L12 14L4 14Z" />
      {/* Yellow - bottom right (Google yellow) */}
      <path fill="#FBBC05" d="M20 14L12 14V21H24V14L20 14Z" />
    </svg>
  )
}
