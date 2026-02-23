/**
 * FolderSupervisedIcon
 *
 * Inline SVG replica of the Material Symbols "folder_supervised" icon.
 * Paths use viewBox "0 0 24 24" (standard Material icon coordinate space).
 * The icon shows a folder with a person/supervisor silhouette inside.
 *
 * No external font dependency — zero FOUT, zero network request.
 */
import { cn } from '@/lib/utils'

interface FolderSupervisedIconProps {
    className?: string
    style?: React.CSSProperties
}

export function FolderSupervisedIcon({ className, style }: FolderSupervisedIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className={cn('inline-block', className)}
            style={style}
        >
            {/* Folder shape: left + right + bottom walls, tab at top-left */}
            <path d="M20 6h-8l-2-2H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
            {/* Person head — white circle punched out */}
            <circle cx="14" cy="11.5" r="1.5" fill="white" />
            {/* Person body — white shoulders silhouette */}
            <path d="M14 14c-2 0-3 .75-3 1.5V16h6v-.5c0-.75-1-1.5-3-1.5z" fill="white" />
        </svg>
    )
}
