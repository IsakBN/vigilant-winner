'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/providers/AuthProvider'

export function Navbar() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-cream-bg/80 backdrop-blur-md border-b border-soft-yellow/50">
      <div className="container-fluid h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-icon.svg" alt="BundleNudge" width={40} height={40} />
          <h2 className="text-2xl font-extrabold tracking-tight">BundleNudge</h2>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          <a className="text-base font-medium text-text-light hover:text-bright-accent transition-colors" href="#features">Features</a>
          <a className="text-base font-medium text-text-light hover:text-bright-accent transition-colors" href="#how-it-works">How it works</a>
          <a className="text-base font-medium text-text-light hover:text-bright-accent transition-colors" href="#pricing">Pricing</a>
          {!isLoading && isAuthenticated ? (
            <Link href="/dashboard" className="bg-bright-accent text-white text-base font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-bright-accent/30 transition-all">
              Dashboard
            </Link>
          ) : !isLoading ? (
            <Link href="/login" className="bg-bright-accent text-white text-base font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-bright-accent/30 transition-all">
              Get Started
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
