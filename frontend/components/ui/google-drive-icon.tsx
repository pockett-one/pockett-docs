import React from 'react'

interface GoogleDriveIconProps {
  size?: number
  className?: string
}

export function GoogleDriveIcon({ size = 20, className = "" }: GoogleDriveIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Google Drive icon - simplified version */}
      <path
        d="M4.5 18.5L2.5 15.5L8.5 4.5H15.5L21.5 15.5L19.5 18.5H4.5Z"
        fill="#4285F4"
        stroke="#4285F4"
        strokeWidth="0.5"
      />
      <path
        d="M8.5 4.5L4.5 18.5H19.5L15.5 4.5H8.5Z"
        fill="#34A853"
        stroke="#34A853"
        strokeWidth="0.5"
      />
      <path
        d="M15.5 4.5L19.5 18.5L21.5 15.5L17.5 1.5H15.5V4.5Z"
        fill="#FBBC04"
        stroke="#FBBC04"
        strokeWidth="0.5"
      />
      <path
        d="M8.5 4.5L4.5 18.5L2.5 15.5L6.5 1.5H8.5V4.5Z"
        fill="#EA4335"
        stroke="#EA4335"
        strokeWidth="0.5"
      />
    </svg>
  )
}
