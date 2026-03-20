/**
 * Pass-through layout: /d/f/[slug] and all children use the same chrome and
 * padding as /d (from app/(app)/d/layout.tsx). This avoids double topbar, sidebar,
 * and padding that would make Clients/Projects spacing differ from Firms.
 */
export default function FirmSlugLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
