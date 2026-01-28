import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BundleNudge - OTA Updates for React Native',
  description: 'Push JavaScript changes directly to users without App Store review. Git push triggers deploy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
