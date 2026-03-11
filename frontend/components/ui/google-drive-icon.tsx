import React from 'react'

interface GoogleDriveIconProps {
  size?: number
  className?: string
}

/**
 * Official Google Drive 2020 logo - triangular design with Google brand colors.
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
