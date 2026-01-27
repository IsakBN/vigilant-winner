import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'BundleNudge Documentation',
  description: 'OTA updates for React Native. Ship faster, roll back safely.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex">
            <Sidebar />
            <main className="flex-1 px-8 py-6 max-w-4xl">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
