"use client"

import { AuthGuard } from '@/components/auth/auth-guard'

export default function DashLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}
