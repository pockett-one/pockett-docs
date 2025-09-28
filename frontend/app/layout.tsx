import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Pockett Docs - Supercharge Your Google Drive Experience Without Google Workspace Baggage',
  description: 'Built for freelancers, consultants & small agencies. Get Google Drive analytics, productivity tools, team collaboration, and document insights without Google Workspace complexity. Free tier available with Pro ($19) and Team ($39) plans.',
  keywords: [
    'Google Drive',
    'Google Drive analytics',
    'Google Drive productivity',
    'document management',
    'team collaboration',
    'freelancer tools',
    'consultant tools',
    'small agency tools',
    'Google Workspace alternative',
    'cloud storage management',
    'document insights',
    'team spaces',
    'watchlist reminders',
    'storage cleanup',
    'duplicate detection',
    'project management',
    'client portal',
    'document workflow'
  ],
  authors: [{ name: 'Pockett Docs Team' }],
  creator: 'Pockett Docs',
  publisher: 'Pockett Docs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://pockett.io',
    siteName: 'Pockett Docs',
    title: 'Pockett Docs - Supercharge Your Google Drive Experience Without Google Workspace Baggage',
    description: 'Built for freelancers, consultants & small agencies. Get Google Drive analytics, productivity tools, team collaboration, and document insights without Google Workspace complexity.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pockett Docs - Google Drive Productivity Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pockett Docs - Supercharge Your Google Drive Experience',
    description: 'Built for freelancers, consultants & small agencies. Google Drive analytics, productivity tools, and team collaboration without Google Workspace complexity.',
    images: ['/twitter-image.png'],
  },
  alternates: {
    canonical: 'https://pockett.com',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) - Only load in production */}
        {gaId && isProduction && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="bg-gray-50 text-gray-900" suppressHydrationWarning={true}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}