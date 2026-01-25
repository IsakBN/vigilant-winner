import type { Metadata } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import { Providers } from '@/providers/Providers'
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
  metadataBase: new URL('https://app.bundlenudge.com'),
  title: {
    default: 'BundleNudge | OTA Updates for React Native',
    template: '%s | BundleNudge',
  },
  description:
    'Push JavaScript and asset updates directly to your React Native apps. Skip the App Store. Self-host for free or use our managed cloud.',
  keywords: [
    'React Native',
    'OTA updates',
    'CodePush alternative',
    'mobile app updates',
    'JavaScript bundle updates',
  ],
  authors: [{ name: 'BundleNudge' }],
  creator: 'BundleNudge',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.bundlenudge.com',
    siteName: 'BundleNudge',
    title: 'BundleNudge | OTA Updates for React Native',
    description:
      'Push JavaScript and asset updates directly to your React Native apps. Skip the App Store. Self-host for free or use our managed cloud.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BundleNudge - OTA Updates for React Native',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BundleNudge | OTA Updates for React Native',
    description:
      'Push JavaScript and asset updates directly to your React Native apps. Skip the App Store.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${quicksand.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
