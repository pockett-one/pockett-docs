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
 * Google-supplied Drive product mark (PNG). Used on marketing and in-app UI via
 * {@link GoogleDriveIcon} so the mark matches Trust Architecture everywhere.
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
 * Same 48dp product mark as the landing page ({@link GoogleDriveProductMark}), scaled for inline UI.
 */
export function GoogleDriveIcon({ size = 20, className = "" }: GoogleDriveIconProps) {
  return (
    <img
      src={GOOGLE_DRIVE_PRODUCT_MARK_SRC}
      alt=""
      width={size}
      height={size}
      decoding="async"
      className={cn("object-contain shrink-0", className)}
      aria-hidden
    />
  )
}
