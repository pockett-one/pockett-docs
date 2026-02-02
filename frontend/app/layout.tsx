import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'Pockett Docs | Professional Client Portals atop Google Drive',
  description: 'Turn Google Drive into a professional client portal. Secure, non-custodial file sharing for consultants & advisors. Protect Intellectual Property with time-bombed links and one-click revocation.',
  keywords: [
    'Client Portal',
    'Google Drive Portal',
    'Secure File Sharing',
    'Consultant Tools',
    'Professional Services Automation',
    'Non-Custodial Security',
    'Document Management',
    'Time-Bombed Links',
    'Google Drive Integration',
    'Project Wrap',
    'Advisory Tools',
    'Virtual Data Room'
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
    title: 'Pockett Docs | Professional Client Portals atop Google Drive',
    description: 'Turn Google Drive into a professional client portal. Secure, non-custodial file sharing for consultants & advisors.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pockett Docs - Professional Client Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pockett Docs | Professional Client Portals atop Google Drive',
    description: 'Turn Google Drive into a professional client portal. Secure, non-custodial file sharing for consultants & advisors.',
    images: ['/twitter-image.png'],
  },
  alternates: {
    canonical: 'https://pockett.io',
  },
  category: 'technology',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const isProduction = process.env.NODE_ENV === 'production'

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`${inter.className} bg-gray-50 text-gray-900`} suppressHydrationWarning={true}>
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
        {/* JSON-LD for Search/Answer Engines */}
        {/* JSON-LD for Search/Answer Engines */}
        <script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Pockett Docs",
              "headline": "Turn Google Drive into a Professional Client Portal",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Web, Browser",
              "description": "Pockett Docs allows consultants and advisors to create secure, white-labeled client portals directly from Google Drive folders without moving files.",
              "featureList": "Non-custodial file sharing, Client Portals, Project Wrap, Time-bombed links, Audit Logs",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/OnlineOnly"
              },
              "author": {
                "@type": "Organization",
                "name": "Pockett Docs"
              }
            })
          }}
        />
        {/* Force Unregister Service Workers and Handle Chunk Errors (Fix ChunkLoadError) */}
        <Script id="fix-chunk-errors" strategy="beforeInteractive">
          {`
            // Unregister all service workers immediately
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                  registration.unregister();
                  console.log('ServiceWorker unregistered:', registration);
                }
              });
            }
            
            // Handle chunk loading errors by reloading the page
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes('Loading chunk') && e.message.includes('failed')) {
                console.warn('ChunkLoadError detected, reloading page...');
                // Clear Next.js cache and reload
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (let name of names) {
                      caches.delete(name);
                    }
                  });
                }
                // Reload after a short delay to allow cache clearing
                setTimeout(function() {
                  window.location.reload();
                }, 100);
              }
            }, true);
            
            // Also handle unhandled promise rejections from chunk loading
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason && typeof e.reason === 'string' && e.reason.includes('Loading chunk')) {
                console.warn('ChunkLoadError in promise rejection, reloading page...');
                e.preventDefault();
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (let name of names) {
                      caches.delete(name);
                    }
                  });
                }
                setTimeout(function() {
                  window.location.reload();
                }, 100);
              }
            });
          `}
        </Script>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}