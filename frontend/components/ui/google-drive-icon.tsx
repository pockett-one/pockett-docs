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
      <defs>
        <linearGradient id="googleDriveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="60%" stopColor="#FBBC05" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <path
        d="M9.05 15H15q.275 0 .5-.137.225-.138.35-.363l1.1-1.9q.125-.225.1-.5-.025-.275-.15-.5l-2.95-5.1q-.125-.225-.35-.363Q13.375 6 13.1 6h-2.2q-.275 0-.5.137-.225.138-.35.363L7.1 11.6q-.125.225-.125.5t.125.5l1.05 1.9q.125.25.375.375T9.05 15Zm1.2-3L12 9l1.75 3ZM3 17V4q0-.825.587-1.413Q4.175 2 5 2h14q.825 0 1.413.587Q21 3.175 21 4v13Zm2 5q-.825 0-1.413-.587Q3 20.825 3 20v-1h18v1q0 .825-.587 1.413Q19.825 22 19 22Z"
        fill="url(#googleDriveGradient)"
      />
    </svg>
  )
}
