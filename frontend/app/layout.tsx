import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pockett Docs',
  description: 'Documentation and API for Pockett',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  )
}