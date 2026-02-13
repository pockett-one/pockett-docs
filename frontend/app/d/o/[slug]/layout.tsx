/**
 * Pass-through layout: /d/o/[slug] and all children use the same chrome and
 * padding as /d (from app/d/layout.tsx). This avoids double topbar, sidebar,
 * and padding that would make Clients/Projects spacing differ from Organizations.
 */
export default function OrgSlugLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
