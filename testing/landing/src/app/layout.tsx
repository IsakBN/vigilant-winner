import type { Metadata } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import { Navbar, Footer, StickyCTA } from '@/components/layout'
import { generateOrganizationSchema, generateSoftwareSchema } from '@/lib/seo'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BundleNudge - OTA Updates for React Native | CodePush Alternative',
  description:
    'Push JavaScript updates to React Native apps instantly. No App Store review. Free tier available. CodePush alternative with predictable pricing.',
  keywords: [
    'codepush alternative',
    'react native ota updates',
    'react native over the air updates',
    'skip app store review',
    'eas update alternative',
  ],
  authors: [{ name: 'BundleNudge' }],
  openGraph: {
    title: 'BundleNudge - OTA Updates for React Native',
    description: 'Push JavaScript updates instantly. No App Store review.',
    url: 'https://bundlenudge.com',
    siteName: 'BundleNudge',
    type: 'website',
    images: [
      {
        url: 'https://bundlenudge.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BundleNudge - OTA Updates for React Native',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BundleNudge - OTA Updates for React Native',
    description: 'Push JavaScript updates instantly. No App Store review.',
    images: ['https://bundlenudge.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgSchema = generateOrganizationSchema()
  const softwareSchema = generateSoftwareSchema()

  return (
    <html lang="en" className={`${nunito.variable} ${quicksand.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <StickyCTA />
      </body>
    </html>
  )
}
