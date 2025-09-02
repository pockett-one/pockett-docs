"use client"

import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DropZoneProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function DropZone({ id, children, className = "" }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
      style={{
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  )
}
