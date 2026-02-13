import { redirect } from 'next/navigation'

/**
 * /dash Legacy Redirect Page
 * 
 * This page redirects to /d (organizations list) for backward compatibility.
 * All new code should use /d directly.
 */
export default function DashDispatcherPage() {
    redirect('/d')
}
